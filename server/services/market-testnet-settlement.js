import {randomUUID,createHash} from 'node:crypto';
import {withKeyLock} from '../utils/keyLock.js';
import {atomicAmount,testnetAccount} from './market-testnet-rpc.js';
const clone=value=>JSON.parse(JSON.stringify(value));
const fail=code=>{throw Object.assign(new Error(code),{code,statusCode:409});};
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

// A separate, explicitly testnet-only custodial rehearsal. Never reads or
// credits local_market_p4, never signs and never operates production inventory.
export function createTestnetSettlement({config,reader,state,save,now=Date.now}){
  for(const key of ['token','vault','seller','buyer','feeRecipient'])testnetAccount(config[key]);
  if(config.network!=='testnet')fail('TESTNET_ONLY');
  if(new Set([config.vault,config.seller,config.feeRecipient,config.buyer]).size!==4)fail('TESTNET_ROLES_MUST_BE_DISTINCT');
  atomicAmount(1,config.decimals);
  const configHash=digest({...config,feePercent:5});
  let current=state || {version:1,mode:'testnet-rehearsal',configHash,orders:[],transactions:{},requests:{},journal:[],inventory:{[config.seller]:[{id:'night_disinfector_weapon',type:'equipment',slot:'weapon',count:1,testFixture:true}],[config.buyer]:[]},listing:{id:'testnet-demo-weapon',seller:config.seller,priceHundredths:100,status:'active',item:null}};
  if(current.configHash!==configHash||current.mode!=='testnet-rehearsal')fail('SETTLEMENT_CONFIG_CHANGED');
  function commit(draft,event){
    draft.journal.push({id:randomUUID(),at:new Date(now()).toISOString(),network:'testnet',...event});
    if(save(draft)!==true)fail('SETTLEMENT_STORAGE_UNAVAILABLE');
    current=draft;
  }
  function find(book,id){const order=book.orders.find(o=>o.id===id);if(!order)fail('ORDER_NOT_FOUND');return order;}
  function expected(order,leg){
    const legs={funding:{sender:order.buyer,receiver:order.vault,amount:order.amount},seller:{sender:order.vault,receiver:order.seller,amount:order.sellerAmount},fee:{sender:order.vault,receiver:order.feeRecipient,amount:order.feeAmount},refund:{sender:order.vault,receiver:order.buyer,amount:order.amount}};
    if(!legs[leg])fail('INVALID_SETTLEMENT_LEG');
    return {network:'testnet',token:order.token,...legs[leg],memo:`p4-testnet:${order.id}:${leg}`};
  }
  function releaseListing(draft,order){
    if(draft.listing.orderId!==order.id)return;
    draft.listing.status='active';delete draft.listing.orderId;
  }
  function complete(draft,order){
    if(!order.proofs.seller || !order.proofs.fee)return;
    if(draft.listing.orderId!==order.id)fail('ESCROW_RESERVATION_LOST');
    const held=order.item;
    if(draft.inventory[order.buyer].some(i=>i.id===held.id))fail('ITEM_ALREADY_OWNED');
    draft.inventory[order.buyer].push(clone(held));
    draft.inventory[order.seller]=draft.inventory[order.seller].filter(i=>i.id!==held.id);
    order.status='completed';order.completedAt=new Date(now()).toISOString();
    draft.listing.status='sold';
  }
  return {
    read(){return clone({mode:'testnet-rehearsal',network:'testnet',signingEnabled:false,productionInventory:false,config,listing:current.listing,orders:current.orders,inventory:current.inventory,journal:current.journal});},
    async reserve({requestId}){
      if(!/^[a-zA-Z0-9-]{16,80}$/.test(requestId || ''))fail('REQUEST_ID_REQUIRED');
      if(current.requests[requestId])return clone(find(current,current.requests[requestId]));
      // Check chain and decimals before offering any unsigned payment request.
      await reader.metadata(config);
      return withKeyLock('market-testnet-settlement',()=>{
        if(current.requests[requestId])return clone(find(current,current.requests[requestId]));
        if(current.listing.status!=='active')fail('LOT_UNAVAILABLE');
        const draft=clone(current),price=draft.listing.priceHundredths;
        const item=draft.inventory[config.seller].find(i=>i.id==='night_disinfector_weapon');
        if(!item)fail('ITEM_UNAVAILABLE');
        const fee=Math.ceil(price*5/100),amount=atomicAmount(price,config.decimals);
        const order={id:randomUUID(),requestId,status:'awaiting_payment',createdAt:new Date(now()).toISOString(),expiresAt:now()+15*60000,token:config.token,vault:config.vault,seller:config.seller,feeRecipient:config.feeRecipient,buyer:config.buyer,decimals:config.decimals,amount,feeAmount:atomicAmount(fee,config.decimals),sellerAmount:price===fee?'0':atomicAmount(price-fee,config.decimals),item:clone(item),proofs:{}};
        if(order.sellerAmount==='0')order.proofs.seller={skipped:true,amount:'0'};
        draft.orders.push(order);draft.requests[requestId]=order.id;draft.listing.status='reserved';draft.listing.orderId=order.id;
        commit(draft,{action:'reserved',orderId:order.id});return clone(order);
      });
    },
    instruction(orderId,leg){
      const order=find(current,orderId);
      if(order.status==='completed'||order.status==='refunded')fail('ORDER_FINISHED');
      if(leg==='funding'&&(order.status!=='awaiting_payment'||now()>order.expiresAt))fail('ORDER_EXPIRED');
      if(['seller','fee'].includes(leg)&&!['payment_confirmed','payout_pending'].includes(order.status))fail('FUNDING_REQUIRED');
      if(leg==='refund'&&(!order.proofs.funding||order.proofs.fee||order.proofs.seller&&!order.proofs.seller.skipped))fail('REFUND_REQUIRES_RECONCILIATION');
      if(order.proofs[leg])fail('LEG_ALREADY_CONFIRMED');
      const transfer=expected(order,leg);
      if(transfer.amount==='0')fail('ZERO_TRANSFER_NOT_REQUIRED');
      return {network:'testnet',signerId:transfer.sender,receiverId:transfer.token,actions:[{type:'FunctionCall',params:{methodName:'ft_transfer',args:{receiver_id:transfer.receiver,amount:transfer.amount,memo:transfer.memo},gas:'30000000000000',deposit:'1'}}]};
    },
    async expire(orderId){return withKeyLock('market-testnet-settlement',()=>{
      const draft=clone(current),order=find(draft,orderId);
      if(order.status!=='awaiting_payment'||now()<=order.expiresAt)fail('ORDER_NOT_EXPIRABLE');
      order.status='expired';releaseListing(draft,order);commit(draft,{action:'expired',orderId});return clone(order);
    });},
    async confirm({orderId,leg,txHash}){
      const initial=find(current,orderId);
      if(initial.proofs[leg]?.txHash===txHash)return clone(initial);
      if(current.transactions[txHash])fail('TRANSACTION_ALREADY_USED');
      // RPC reads happen outside the lock; every state condition is rechecked
      // after the response, immediately before the atomic file snapshot.
      const proof=await reader.verify({...expected(initial,leg),txHash});
      return withKeyLock('market-testnet-settlement',()=>{
        const draft=clone(current),order=find(draft,orderId);
        if(order.proofs[leg]?.txHash===txHash)return clone(order);
        if(draft.transactions[txHash]||order.proofs[leg])fail('TRANSACTION_ALREADY_USED');
        if(leg==='funding'){
          if(!['awaiting_payment','expired'].includes(order.status))fail('ORDER_STATE_INVALID');
          if(order.status==='expired'||now()>order.expiresAt){order.status='refund_required';releaseListing(draft,order);}
          else order.status='payment_confirmed';
        }else if(leg==='refund'){
          if(!order.proofs.funding||order.proofs.fee||order.proofs.seller&&!order.proofs.seller.skipped||!['payment_confirmed','refund_required'].includes(order.status))fail('REFUND_REQUIRES_RECONCILIATION');
          order.status='refunded';releaseListing(draft,order);
        }else{
          if(!order.proofs.funding||!['payment_confirmed','payout_pending'].includes(order.status))fail('FUNDING_REQUIRED');
          order.status='payout_pending';
        }
        order.proofs[leg]=clone(proof);draft.transactions[txHash]={orderId,leg};
        if(leg==='seller'||leg==='fee')complete(draft,order);
        commit(draft,{action:leg+'_confirmed',orderId,txHash,status:order.status});return clone(order);
      });
    },
  };
}
