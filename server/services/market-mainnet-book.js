import {queueSaleNotice} from './market-sale-notifications.js';
import {randomUUID,createHash} from 'node:crypto';
import {marketEligible,npcEligible,npcQuote} from './local-market.js';
import {mainnetPayment,mainnetAccount} from './market-mainnet-rpc.js';
import {MAX_PRICE_HUNDREDTHS} from '../../src/lib/marketPricing.js';
import {restockTicket} from './market-restock.js';
const fail=code=>{throw Object.assign(new Error(code),{code,statusCode:409});};
const copy=v=>structuredClone(v);
export const marketRequestFingerprint=body=>createHash('sha256').update(JSON.stringify([body.action,body.itemId,body.lotId,body.orderId,body.price,body.txHash])).digest('hex');
export function mainnetBookProjection(book,players){
 const all=[...players,...(book.agents||[])];
 return {...book,local_market_pl4_usd:book.budgetQuote,local_market_journal:book.journal,local_market_agent_ledger:book.agentLedger,
  players:all.filter((p,i)=>all.findIndex(other=>String(other.id)===String(p.id))===i).map(p=>({...p,local_market_lots:book.lots.filter(l=>l.sellerId===String(p.id))}))};
}
export function verifiedMarketWallet(player){
 if(player?.near_wallet_verified!==true)fail('VERIFIED_WALLET_REQUIRED');return mainnetAccount(player.near_wallet_id);
}
export function createMainnetBook({decimals,capHundredths,feeRecipient='nuvelorian.near'}){
 if(!Number.isInteger(decimals)||decimals<2||decimals>24||!Number.isSafeInteger(capHundredths)||capHundredths<1)fail('INVALID_PILOT_CONFIG');
 return {version:1,network:'mainnet',token:'pl4.nearlytrade.near',decimals,capHundredths,feeRecipient:mainnetAccount(feeRecipient),feePercent:5,lots:[],orders:[],receipts:{},transactions:{},journal:[]};
}
export function marketBookCommand(book,players,actor,body,{proof,now=Date.now()}={}){
 if(!actor||actor.is_banned)fail('AUTH_REQUIRED');
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId||''))fail('REQUEST_ID_REQUIRED');
 const fingerprint=marketRequestFingerprint(body);
 const receiptKey=actor.id+':'+body.requestId,prior=book.receipts[receiptKey];
 if(prior){if(prior.fingerprint!==fingerprint)fail('REQUEST_ID_REUSED');return copy(prior.result);}
 let result;
 if(body.action==='list'||body.action==='npc'){
  const matches=(actor.inventory_items||[]).filter(i=>i.id===body.itemId);
  if(matches.length!==1||!(body.action==='npc'?npcEligible(actor,matches[0]):marketEligible(actor,matches[0])))fail('ITEM_UNAVAILABLE');
  if(body.action==='npc'){actor.tentacles=Number(actor.tentacles||0)+npcQuote(matches[0]);result={scrap:npcQuote(matches[0])};}
  else{
   const wallet=verifiedMarketWallet(actor);
   if(!Number.isSafeInteger(body.price)||body.price<2||body.price>MAX_PRICE_HUNDREDTHS)fail('INVALID_PRICE');
   const item={...copy(matches[0]),instanceId:matches[0].instanceId||randomUUID()};
   const lot={id:randomUUID(),status:'active',sellerId:String(actor.id),seller:actor.nickname||actor.username||'Player',sellerAi:Boolean(actor.ai_agent?.key),sellerWallet:wallet,item,price:body.price,createdAt:new Date(now).toISOString()};
   book.lots.push(lot);result={lotId:lot.id};
  }
  actor.inventory_items=actor.inventory_items.filter(i=>i!==matches[0]);
 }else if(body.action==='cancel'){
  const lot=book.lots.find(l=>l.id===body.lotId);if(!lot||lot.status!=='active')fail('LOT_UNAVAILABLE');if(lot.sellerId!==String(actor.id))fail('NOT_YOUR_LOT');
  if((actor.inventory_items||[]).some(i=>i.id===lot.item.id))fail('ITEM_ALREADY_OWNED');
  actor.inventory_items=[...(actor.inventory_items||[]),copy(lot.item)];lot.status='cancelled';result={lotId:lot.id};
 }else if(body.action==='reserve'){
  if(book.orders.length>=100)fail('PILOT_ORDER_LIMIT');
  const lot=book.lots.find(l=>l.id===body.lotId);if(!lot||lot.status!=='active')fail('LOT_UNAVAILABLE');
  if(lot.sellerId===String(actor.id))fail('OWN_LOT');
  const wallet=verifiedMarketWallet(actor);
  if(wallet===lot.sellerWallet)fail('OWN_WALLET_TRADE');
  if((actor.inventory_items||[]).some(i=>i.id===lot.item.id))fail('ITEM_ALREADY_OWNED');
  // Reservations belong to a lot, not to the buyer's entire account. Keep
  // an uncertain payment recoverable without blocking another item's checkout.
  const reserved=book.orders.reduce((sum,o)=>sum+o.price,0);if(reserved+lot.price>book.capHundredths)fail('PILOT_BUDGET_EXHAUSTED');
  const order={id:randomUUID(),status:'awaiting_payment',buyerId:String(actor.id),buyerWallet:wallet,sellerId:lot.sellerId,sellerWallet:lot.sellerWallet,feeRecipient:book.feeRecipient,decimals:book.decimals,price:lot.price,lotId:lot.id,item:copy(lot.item),createdAt:new Date(now).toISOString()};
  if(actor.ai_agent?.key){
   const ticket=restockTicket(mainnetBookProjection(book,players),lot);if(!ticket)fail('RESTOCK_SALE_REQUIRED');
   const sale=book.lots.find(l=>l.id===ticket.saleId);sale.restockConsumedBy=order.id;order.restockSaleId=sale.id;order.agentKey=actor.ai_agent.key;
   const day=new Date(now).toISOString().slice(0,10);
   const ledger=book.agentLedger?.day===day?book.agentLedger:{day,spent:0,sellers:{},identities:{},items:{}};
   ledger.spent+=lot.price;ledger.sellers[lot.sellerId]=(ledger.sellers[lot.sellerId]||0)+1;ledger.items[lot.item.id]=(ledger.items[lot.item.id]||0)+1;book.agentLedger=ledger;
  }
  mainnetPayment(order);book.orders.push(order);lot.status='reserved';lot.orderId=order.id;result={orderId:order.id,instruction:mainnetPayment(order)};
 }else if(body.action==='confirm'){
  const order=book.orders.find(o=>o.id===body.orderId);if(!order||order.buyerId!==String(actor.id))fail('ORDER_NOT_FOUND');
  if(order.status==='completed'||order.status==='claim_pending'){
   if(order.txHash!==body.txHash)fail('ORDER_ALREADY_PAID');result={orderId:order.id,status:order.status};
  }else{
   if(!proof?.final||proof.network!=='mainnet'||proof.token!==book.token||proof.orderId!==order.id||proof.txHash!==body.txHash)fail('VERIFIED_PAYMENT_REQUIRED');
   if(book.transactions[body.txHash])fail('TRANSACTION_ALREADY_USED');
   const lot=book.lots.find(l=>l.id===order.lotId);if(!lot||lot.status!=='reserved'||lot.orderId!==order.id)fail('ESCROW_RESERVATION_LOST');
   const item={...copy(order.item),...(lot.sellerAi?{agentOrigin:true,agentSoldAt:new Date(now).toISOString()}:{} )};
   if(actor.ai_agent?.key)item.agentCost=order.price;else delete item.agentCost;
   const duplicate=(actor.inventory_items||[]).some(i=>i.id===item.id);
   if(duplicate)actor.market_pending_deliveries=[...(actor.market_pending_deliveries||[]),{orderId:order.id,item}];
   else actor.inventory_items=[...(actor.inventory_items||[]),item];
   order.status=duplicate?'claim_pending':'completed';order.txHash=body.txHash;order.completedAt=new Date(now).toISOString();
   book.transactions[body.txHash]=order.id;lot.status='sold';lot.buyerId=String(actor.id);lot.txHash=body.txHash;lot.soldAt=order.completedAt;lot.fee=Math.ceil(lot.price*0.05);
   if(lot.sellerAi&&!actor.ai_agent?.key)lot.restockVersion=1;
   queueSaleNotice(book,order);
   result={orderId:order.id,status:order.status};
  }
 }else if(body.action==='claim'){
  const delivery=(actor.market_pending_deliveries||[]).find(d=>d.orderId===body.orderId);if(!delivery)fail('DELIVERY_NOT_FOUND');
  if((actor.inventory_items||[]).some(i=>i.id===delivery.item.id))fail('ITEM_ALREADY_OWNED');
  actor.inventory_items=[...(actor.inventory_items||[]),copy(delivery.item)];actor.market_pending_deliveries=actor.market_pending_deliveries.filter(d=>d!==delivery);
  const order=book.orders.find(o=>o.id===body.orderId);order.status='completed';result={orderId:order.id,status:'completed'};
 }else fail('UNKNOWN_ACTION');
 book.receipts[receiptKey]={fingerprint,result:copy(result)};
 book.journal.push({id:randomUUID(),at:new Date(now).toISOString(),actorId:String(actor.id),action:body.action,...result});
 return result;
}
