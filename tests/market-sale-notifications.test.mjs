import test from 'node:test';
import assert from 'node:assert/strict';
import {saleNotice,queueSaleNotice,sendSaleNotice} from '../server/services/market-sale-notifications.js';
const order={id:'sale-1',sellerId:'p1',item:{id:'night_disinfector_weapon',enhancementLevel:7},price:1446014,txHash:'test-hash'};
test('sale text uses seller language, authoritative item name, enhancement and exact net after rounded fee',()=>{
 for(const [language,expected] of [['uk','Продано'],['ua','Продано'],['ru','Продано'],['en','Sold']]){
  const text=saleNotice(order,{language});assert.match(text,new RegExp(expected));assert.match(text,/\+7/);assert.match(text,/5%/);assert.match(text,/test-hash/);assert.doesNotMatch(text,/night_disinfector_weapon/);
 }
 const text=saleNotice(order,{language:'en'});assert.match(text,/723\.01/);assert.match(text,/13,737\.13/);
});
test('queue suppresses replay and agent seller notices',()=>{
 const b={agents:[{id:'ai'}]};queueSaleNotice(b,order);queueSaleNotice(b,order);queueSaleNotice(b,{...order,id:'ai-sale',sellerId:'ai'});assert.deepEqual(Object.keys(b.saleNotices),['sale-1']);
});
test('Telegram payload targets seller, uses plain text and confirms Telegram API success',async()=>{
 let payload;const id=await sendSaleNotice('test-token','100000001','sale',async(url,opts)=>{payload=JSON.parse(opts.body);return {ok:true,json:async()=>({ok:true,result:{message_id:42}})}});
 assert.equal(id,42);assert.equal(payload.chat_id,'100000001');assert.equal(payload.text,'sale');assert.equal(payload.parse_mode,undefined);
 await assert.rejects(sendSaleNotice('test-token','100000001','sale',async()=>({ok:true,json:async()=>({ok:false})})),/FAILED/);
});

test('durable dispatch survives restarts without duplicate delivery, and never sends before claim commit',async()=>{
 const {dispatchMarketSaleNotices}=await import('../server/services/market-sale-dispatcher.js');
 let state={orders:[{...order,status:'completed'}],saleNotices:{[order.id]:{orderId:order.id,sellerId:'p1',status:'queued'}}},sent=0;
 const players=[{id:'p1',telegram_id:'100000001',language:'uk'}];
 const transaction=async work=>{let pending=structuredClone(state);await work(async(strings,...values)=>{if(strings.join('').includes('SELECT'))return [{state:structuredClone(pending)}];pending=JSON.parse(values[0]);return [];});state=pending;};
 const send=async()=>{assert.equal(state.saleNotices[order.id].status,'sending');sent++;return 123;};
 await dispatchMarketSaleNotices(players,{token:'test',transaction,send});await dispatchMarketSaleNotices(players,{token:'test',transaction,send});
 assert.equal(sent,1);assert.equal(state.saleNotices[order.id].status,'sent');
 state.saleNotices[order.id].status='queued';
 await assert.rejects(dispatchMarketSaleNotices(players,{token:'test',transaction:async work=>{await transaction(work);throw Error('commit uncertain');},send}),/uncertain/);
 await dispatchMarketSaleNotices(players,{token:'test',transaction,send});assert.equal(sent,1);
});
