import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {KeyPair} from '@near-js/crypto';
import {decodeSignedTransaction,encodeTransaction} from '@near-js/transactions';
import {baseEncode} from '@near-js/utils';
import {createAgentSigner,claimAgentPayment} from '../server/services/market-mainnet-signer.js';
import {createMainnetBook,marketBookCommand,mainnetBookProjection} from '../server/services/market-mainnet-book.js';
import {initializeMainnetAgents,chooseMainnetAgentAction,applyMainnetAgentAction} from '../server/services/market-mainnet-agents.js';
import {restockTicket} from '../server/services/market-restock.js';
const key=KeyPair.fromRandom('ed25519');
const order={id:randomUUID(),buyerWallet:'grym.nuvelorian.near',sellerWallet:'seller.near',feeRecipient:'nuvelorian.near',price:100,decimals:18};
const secrets=()=>({agents:{hunter:{accountId:'grym.nuvelorian.near',privateKey:key.toString()}}});
test('restart recovers an expired unsigned claim but can never replace a persisted signed transaction',()=>{
 const order={status:'awaiting_payment',createdAt:new Date(0).toISOString()};
 assert.equal(claimAgentPayment(order,'first',100000),true);
 assert.equal(claimAgentPayment(order,'second',100001),false);
 assert.equal(claimAgentPayment(order,'second',160001),true);
 assert.equal(order.signingClaim,'second');order.signedTx='persisted-signed-bytes';
 assert.equal(claimAgentPayment(order,'third',999999),false);
});
test('agent signer requires authorization, signs only PL4 and returns reusable identical bytes, not a new payment on retry',async()=>{
 const calls=[];
 const fetchImpl=async(url,options)=>{
  assert.equal(url,'https://free.rpc.fastnear.com');const req=JSON.parse(options.body);calls.push(req);
  return {ok:true,json:async()=>({result:req.method==='status'?{chain_id:'mainnet'}:req.method==='query'?{permission:'FullAccess',nonce:5,block_hash:baseEncode(new Uint8Array(32).fill(1))}:{final_execution_status:'FINAL'}})};
 };
 const blocked=createAgentSigner({secrets,fetchImpl});await assert.rejects(blocked.prepare(order,'hunter'),/SIGNER_SCOPE/);assert.equal(calls.length,0);
 const signer=createAgentSigner({secrets,fetchImpl,authorize:async()=>true});
 for(const patch of [{buyerWallet:'nuvelorian.near'},{feeRecipient:'attacker.near'},{network:'testnet'}])await assert.rejects(signer.prepare({...order,...patch},'hunter'),/SIGNER_SCOPE/);
 const prepared=await signer.prepare(order,'hunter'),tx=decodeSignedTransaction(Buffer.from(prepared.signedTx,'base64'));
 assert.equal(tx.transaction.signerId,'grym.nuvelorian.near');assert.equal(tx.transaction.receiverId,'pl4.nearlytrade.near');assert.equal(tx.transaction.nonce,6n);assert.equal(tx.transaction.actions.length,2);
 for(const action of tx.transaction.actions){assert.equal(action.functionCall.methodName,'ft_transfer');assert.equal(action.functionCall.deposit,1n);assert.equal(action.functionCall.gas,30000000000000n);}
 const digest=createHash('sha256').update(encodeTransaction(tx.transaction)).digest();assert.equal(key.verify(digest,new Uint8Array(tx.signature.ed25519Signature.data)),true);assert.equal(baseEncode(digest),prepared.txHash);
 await signer.broadcast(prepared);await signer.broadcast(prepared);
 assert.equal(calls.filter(r=>r.method==='send_tx').length,2);assert.equal(calls.at(-1).params.signed_tx_base64,calls.at(-2).params.signed_tx_base64);
});
test('real-money agent seed can list gear but cannot buy farm without retail demand',async()=>{
 const book=createMainnetBook({decimals:18,capHundredths:100000000});book.budgetQuote=.0000077;initializeMainnetAgents(book);
 const smith=book.agents[0],hunter=book.agents[1];hunter.local_market_p4=100000000;
 const farmer={id:'farmer',level:100,created_at:'2026-01-01',near_wallet_verified:true,near_wallet_id:'farmer.near',inventory_items:[{id:'night_disinfector_weapon',type:'equipment',slot:'weapon',count:1}],equipped_items:{}};
 const {lotId}=marketBookCommand(book,[farmer],farmer,{action:'list',itemId:'night_disinfector_weapon',price:2,requestId:randomUUID()});
 assert.throws(()=>marketBookCommand(book,[farmer],hunter,{action:'reserve',lotId,requestId:randomUUID()}),/RESTOCK_SALE_REQUIRED/);
 const action=await chooseMainnetAgentAction(book,[farmer],smith.id,{env:{}});assert.equal(action.action,'list');
 applyMainnetAgentAction(book,[farmer],smith.id,action);assert.ok(book.lots.some(l=>l.sellerAi&&l.status==='active'));assert.equal(book.orders.length,0);
});
test('pending acquisitions count toward the shared two-copy stock cap',()=>{
 const book=createMainnetBook({decimals:18,capHundredths:100000});book.budgetQuote=.0000077;initializeMainnetAgents(book);
 const item={id:'night_disinfector_weapon',type:'equipment',slot:'weapon',count:1};
 const farmer={id:'farmer',inventory_items:[item]},buyer={id:'buyer',inventory_items:[]};
 book.lots.push({id:'retail',sellerId:book.agents[0].id,sellerAi:true,status:'sold',buyerId:buyer.id,item,price:10000,fee:500,restockVersion:1});
 book.orders.push(...[0,1].map(n=>({id:'pending'+n,agentKey:'hunter',status:'awaiting_payment',item})));
 assert.equal(restockTicket(mainnetBookProjection(book,[farmer,buyer]),{id:'farm',sellerId:farmer.id,item,price:100}),null);
});
test('one completed retail payment enables one agent replacement and permanent no-buyback survives resale',async()=>{
 const book=createMainnetBook({decimals:18,capHundredths:1000000000});book.budgetQuote=.0000077;initializeMainnetAgents(book);
 const [smith,hunter]=book.agents;hunter.local_market_p4=100000000;
 const make=(id,inventory_items=[])=>({id,nickname:id,level:100,created_at:'2026-01-01T00:00:00Z',near_wallet_id:id+'.near',near_wallet_verified:true,inventory_items,equipped_items:{}});
 const customer=make('customer'),farmer=make('farmer',[{id:'night_disinfector_head',type:'equipment',slot:'head',count:1}]),players=[customer,farmer];
 const cmd=(actor,body,proof)=>marketBookCommand(book,players,actor,{requestId:randomUUID(),...body},{proof});
 const candidate=await chooseMainnetAgentAction(book,players,smith.id,{env:{}});applyMainnetAgentAction(book,players,smith.id,candidate);
 const retail=book.lots.find(l=>l.sellerId===smith.id&&l.item.id==='night_disinfector_head');
 const reserved=cmd(customer,{action:'reserve',lotId:retail.id});
 cmd(customer,{action:'confirm',orderId:reserved.orderId,txHash:'retail-proof'},{network:'mainnet',token:book.token,orderId:reserved.orderId,txHash:'retail-proof',final:true});
 assert.equal(customer.inventory_items[0].agentOrigin,true);
 const price=Math.floor(retail.price*.4),farm=cmd(farmer,{action:'list',itemId:retail.item.id,price});
 const buy=await chooseMainnetAgentAction(book,players,hunter.id,{env:{}});assert.equal(buy.action,'buy');assert.equal(buy.lotId,farm.lotId);
 const replacement=applyMainnetAgentAction(book,players,hunter.id,buy);
 assert.equal(retail.restockConsumedBy,replacement.orderId);
 cmd(hunter,{action:'confirm',orderId:replacement.orderId,txHash:'replacement-proof'},{network:'mainnet',token:book.token,orderId:replacement.orderId,txHash:'replacement-proof',final:true});
 assert.equal(hunter.inventory_items.find(i=>i.id===retail.item.id).agentCost,price);
 assert.ok(price<=Math.floor((retail.price-retail.fee)*.8));
 const resale=cmd(customer,{action:'list',itemId:retail.item.id,price:2});
 assert.equal(restockTicket(mainnetBookProjection(book,players),book.lots.find(l=>l.id===resale.lotId)),null);
});
test('the agent kill switch blocks both recommendations and application of a previously chosen action',async()=>{
 const previous=process.env.MARKET_AGENTS_ENABLED;
 const book=createMainnetBook({decimals:18,capHundredths:100000000});book.budgetQuote=.0000077;initializeMainnetAgents(book);
 const agent=book.agents[0],candidate=await chooseMainnetAgentAction(book,[],agent.id,{env:{}});assert.ok(candidate);
 try{
  process.env.MARKET_AGENTS_ENABLED='0';
  assert.equal(await chooseMainnetAgentAction(book,[],agent.id,{env:{}}),null);
  assert.equal(applyMainnetAgentAction(book,[],agent.id,candidate),null);assert.equal(book.lots.length,0);
 }finally{if(previous===undefined)delete process.env.MARKET_AGENTS_ENABLED;else process.env.MARKET_AGENTS_ENABLED=previous;}
});
