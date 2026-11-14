import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createMainnetBook,marketBookCommand} from '../server/services/market-mainnet-book.js';
const item=()=>({id:'night_disinfector_weapon',type:'equipment',slot:'weapon',count:1});
function fixture(){
 const seller={id:'s',near_wallet_id:'seller.near',near_wallet_verified:true,inventory_items:[item()],equipped_items:{}},buyer={id:'b',near_wallet_id:'buyer.near',near_wallet_verified:true,inventory_items:[]};
 const book=createMainnetBook({decimals:18,capHundredths:1000});
 const run=(p,b,options)=>marketBookCommand(book,[seller,buyer],p,{requestId:randomUUID(),...b},options);
 return {seller,buyer,book,run};
}

test('selling Acid Blaster to NPC releases ownership for a player purchase, including after reload and retry',()=>{
 const {seller,buyer,book,run}=fixture();
 const acid={id:'set4_weapon',type:'equipment',slot:'weapon',count:1};
 seller.inventory_items=[{...acid}];buyer.inventory_items=[{...acid}];
 const {lotId}=run(seller,{action:'list',itemId:acid.id,price:100});
 assert.throws(()=>run(buyer,{action:'reserve',lotId}),/ITEM_ALREADY_OWNED/);
 const sale={action:'npc',itemId:acid.id,requestId:randomUUID()};
 run(buyer,sale);const paid=buyer.tentacles;run(buyer,sale);
 assert.equal(buyer.tentacles,paid);assert.equal(buyer.inventory_items.length,0);
 const restored=JSON.parse(JSON.stringify(buyer));
 const command=body=>marketBookCommand(book,[seller,restored],restored,{requestId:randomUUID(),...body});
 const {orderId}=command({action:'reserve',lotId});
 const proof={network:'mainnet',token:book.token,orderId,txHash:'acid-repurchase-test',final:true};
 marketBookCommand(book,[seller,restored],restored,{action:'confirm',orderId,txHash:proof.txHash,requestId:randomUUID()},{proof});
 assert.equal(restored.inventory_items.filter(i=>i.id===acid.id).length,1);
 assert.equal(restored.tentacles,paid);
});
test('real item escrow, reservation and verified payment deliver once, without virtual PL4 balances',()=>{
 const {seller,buyer,book,run}=fixture();const {lotId}=run(seller,{action:'list',itemId:item().id,price:100});
 assert.equal(seller.inventory_items.length,0);const {orderId,instruction}=run(buyer,{action:'reserve',lotId});
 assert.equal(instruction.network,'mainnet');assert.equal(instruction.actions.length,2);
 assert.throws(()=>run(seller,{action:'cancel',lotId}),/LOT_UNAVAILABLE/);
 assert.throws(()=>run(buyer,{action:'confirm',orderId,txHash:'test'}),/VERIFIED_PAYMENT_REQUIRED/);
 const proof={network:'mainnet',token:book.token,orderId,txHash:'test',final:true};
 run(buyer,{action:'confirm',orderId,txHash:'test'},{proof});run(buyer,{action:'confirm',orderId,txHash:'test'},{proof});
 assert.equal(Object.keys(book.saleNotices).length,1);assert.equal(book.saleNotices[orderId].status,'queued');assert.equal(buyer.inventory_items.length,1);assert.equal(book.lots[0].fee,5);assert.equal(buyer.local_market_p4,undefined);assert.equal(book.orders[0].status,'completed');
});
test('wallet changes, budget exhaustion, own-wallet trades and ambiguous ownership reject before payment',()=>{
 const {seller,buyer,book,run}=fixture();const {lotId}=run(seller,{action:'list',itemId:item().id,price:1001});
 assert.throws(()=>run(buyer,{action:'reserve',lotId}),/PILOT_BUDGET/);
 book.lots[0].price=100;buyer.near_wallet_id='seller.near';assert.throws(()=>run(buyer,{action:'reserve',lotId}),/OWN_WALLET/);
 buyer.near_wallet_verified=false;assert.throws(()=>run(buyer,{action:'reserve',lotId}),/VERIFIED_WALLET/);
});
test('a drop acquired while payment settles becomes a durable pending delivery rather than lost paid gear',()=>{
 const {seller,buyer,book,run}=fixture();const {lotId}=run(seller,{action:'list',itemId:item().id,price:100});const {orderId}=run(buyer,{action:'reserve',lotId});
 buyer.inventory_items.push(item());run(buyer,{action:'confirm',orderId,txHash:'test'},{proof:{network:'mainnet',token:book.token,orderId,txHash:'test',final:true}});
 assert.equal(book.orders[0].status,'claim_pending');assert.equal(buyer.market_pending_deliveries.length,1);
 buyer.inventory_items=[];run(buyer,{action:'claim',orderId});assert.equal(buyer.inventory_items.length,1);assert.equal(buyer.market_pending_deliveries.length,0);
});
test('request replay cannot reserve or sell twice and altered request bodies are rejected',()=>{
 const {seller,book,run}=fixture();const body={requestId:randomUUID(),action:'list',itemId:item().id,price:100};
 run(seller,body);run(seller,body);assert.equal(book.lots.length,1);assert.throws(()=>run(seller,{...body,price:200}),/REQUEST_ID_REUSED/);
});

test('NPC never sells equipped, locked, protected or ambiguous copies',()=>{
 for(const variant of ['equipped','locked','protected','duplicate']){
  const {seller,book,run}=fixture();
  if(variant==='equipped')seller.equipped_items.weapon=item().id;
  else if(variant==='duplicate')seller.inventory_items.push(item());
  else seller.inventory_items[0][variant]=true;
  const before=JSON.stringify({seller,book});
  assert.throws(()=>run(seller,{action:'npc',itemId:item().id}),/ITEM_UNAVAILABLE/);
  assert.equal(JSON.stringify({seller,book}),before,variant);
 }
});

test('one lot admits one buyer; seller cannot cancel a reserved item',()=>{
 const {seller,buyer,book,run}=fixture();
 const {lotId}=run(seller,{action:'list',itemId:item().id,price:100});
 run(buyer,{action:'reserve',lotId});
 const other={...buyer,id:'other',near_wallet_id:'other.near',inventory_items:[]};
 const before=JSON.stringify(book);
 assert.throws(()=>run(other,{action:'reserve',lotId}),/LOT_UNAVAILABLE/);
 assert.throws(()=>run(seller,{action:'cancel',lotId}),/LOT_UNAVAILABLE/);
 assert.equal(JSON.stringify(book),before);
});

test('cancel returns the exact enhancement once and permits a new listing',()=>{
 const {seller,book,run}=fixture();
 seller.inventory_items[0].enhancementLevel=7;
 seller.inventory_items[0].instanceId='enhanced-instance';
 const {lotId}=run(seller,{action:'list',itemId:item().id,price:100});
 const cancel={action:'cancel',lotId,requestId:randomUUID()};
 run(seller,cancel);run(seller,cancel);
 assert.equal(seller.inventory_items.length,1);
 assert.equal(seller.inventory_items[0].enhancementLevel,7);
 assert.equal(seller.inventory_items[0].instanceId,'enhanced-instance');
 run(seller,{action:'list',itemId:item().id,price:120});
 assert.equal(seller.inventory_items.length,0);
 assert.equal(book.lots.filter(l=>l.status==='active').length,1);
});

test('an unrelated proof or buyer cannot deliver gear, and a paid order cannot switch hashes',()=>{
 const {seller,buyer,book,run}=fixture();
 const {lotId}=run(seller,{action:'list',itemId:item().id,price:100});
 const {orderId}=run(buyer,{action:'reserve',lotId});
 const body={action:'confirm',orderId,txHash:'verified-hash'};
 const proof={network:'mainnet',token:book.token,orderId,txHash:body.txHash,final:true};
 for(const bad of [{...proof,final:false},{...proof,network:'testnet'},{...proof,orderId:'other'},{...proof,txHash:'other'}]){
  const before=JSON.stringify({buyer,book});
  assert.throws(()=>run(buyer,body,{proof:bad}),/VERIFIED_PAYMENT_REQUIRED/);
  assert.equal(JSON.stringify({buyer,book}),before);
 }
 assert.throws(()=>run(seller,body,{proof}),/ORDER_NOT_FOUND/);
 run(buyer,body,{proof});
 assert.throws(()=>run(buyer,{...body,txHash:'different'}),/ORDER_ALREADY_PAID/);
 assert.equal(buyer.inventory_items.length,1);
});

test('a paid duplicate remains claimable through reload, NPC sale and repeated claim request',()=>{
 const {seller,buyer,book,run}=fixture();
 const {lotId}=run(seller,{action:'list',itemId:item().id,price:100});
 const {orderId}=run(buyer,{action:'reserve',lotId});
 buyer.inventory_items=[item()];
 run(buyer,{action:'confirm',orderId,txHash:'pending-hash'},{proof:{network:'mainnet',token:book.token,orderId,txHash:'pending-hash',final:true}});
 assert.throws(()=>run(buyer,{action:'claim',orderId}),/ITEM_ALREADY_OWNED/);
 const restored=JSON.parse(JSON.stringify(buyer)),restoredBook=JSON.parse(JSON.stringify(book));
 const command=body=>marketBookCommand(restoredBook,[restored],restored,{requestId:randomUUID(),...body});
 command({action:'npc',itemId:item().id});
 const claim={action:'claim',orderId,requestId:randomUUID()};
 command(claim);command(claim);
 assert.equal(restored.inventory_items.length,1);
 assert.equal(restored.market_pending_deliveries.length,0);
 assert.equal(restoredBook.orders[0].status,'completed');
});

test('an unpaid reservation does not block another purchase and a late payment still delivers its own lot',()=>{
 const {seller,buyer,book,run}=fixture();
 seller.inventory_items=[item(),{id:'set4_weapon',type:'equipment',slot:'weapon',count:1}];
 const first=run(seller,{action:'list',itemId:item().id,price:100});
 const second=run(seller,{action:'list',itemId:'set4_weapon',price:120});
 const firstRequest={action:'reserve',lotId:first.lotId,requestId:randomUUID()};
 const a=run(buyer,firstRequest),b=run(buyer,{action:'reserve',lotId:second.lotId});
 assert.deepEqual(run(buyer,firstRequest),a);assert.equal(book.orders.length,2);
 const confirm=(orderId,txHash)=>run(buyer,{action:'confirm',orderId,txHash},{proof:{network:'mainnet',token:book.token,orderId,txHash,final:true}});
 confirm(b.orderId,'second-payment');
 assert.deepEqual(buyer.inventory_items.map(i=>i.id),['set4_weapon']);
 assert.equal(book.lots.find(l=>l.id===first.lotId).status,'reserved');
 confirm(a.orderId,'late-first-payment');
 assert.deepEqual(new Set(buyer.inventory_items.map(i=>i.id)),new Set(['set4_weapon',item().id]));
 assert.equal(book.orders.filter(o=>o.status==='completed').length,2);
});
