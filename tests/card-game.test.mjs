import test from 'node:test';
import assert from 'node:assert/strict';
import {CARD_PRIZES,getCardPlayPack} from '../src/lib/cardGameConfig.js';
import {newCardState,cardStateView,applyCardCommand,creditCardPayment} from '../server/utils/cardGame.js';
import {cardGameCommand} from '../server/services/card-game.js';
const now=Date.parse('2026-10-28T12:00:00Z');
const body=(extra={})=>({requestId:crypto.randomUUID(),...extra});
function fixture(){return {s:newCardState(),p:{id:'p',weapon_inventory:{}}};}
function begin(s,p,mode=1,rng=()=>0){applyCardCommand(s,p,'begin',body({mode}),{now,rng});return s.round.id;}
test('configured odds total 100%, minimum 1%; paid gum excluded',()=>{
 assert.equal(CARD_PRIZES.reduce((n,r)=>n+r[3],0),100);assert(CARD_PRIZES.every(r=>r[3]>=1));assert(!CARD_PRIZES.some(r=>r[0]==='gum'&&r[1]==='premium'));assert.equal(getCardPlayPack(1).stars,20);assert.equal(getCardPlayPack(3).usd,.6);
});
test('daily grant once per UTC day, no automatic release gift, and no free triple play',()=>{
 const {s,p}=fixture();assert.equal(cardStateView(s,now).free,1);assert.equal(s.bonus,0);
 assert.throws(()=>begin(s,p,3),/CARD_PAYMENT_REQUIRED/);const id=begin(s,p);assert.equal(cardStateView(s,now).free,0);
 assert.equal(cardStateView(s,now+86400000).free,1);assert.equal(s.round.id,id);
});
test('single deal hides rewards until immutable choice; claim is idempotent',()=>{
 const {s,p}=fixture();const id=begin(s,p);assert.equal(cardStateView(s,now).round.cards,null);
 applyCardCommand(s,p,'choose',body({roundId:id,index:2}),{now});assert.equal(cardStateView(s,now).round.cards.length,4);
 assert.throws(()=>applyCardCommand(s,p,'choose',body({roundId:id,index:1}),{now}),/CARD_SELECTION_LOCKED/);
 const claim=body({roundId:id,selected:[0,1,2,3]});applyCardCommand(s,p,'claim',claim,{now});assert.equal(p.weapon_inventory['small-poison'],6);
 applyCardCommand(s,p,'claim',claim,{now});assert.equal(p.weapon_inventory['small-poison'],6);
});
test('pending single can resume but cannot reroll or switch to triple for free',()=>{
 const {s,p}=fixture();const id=begin(s,p);begin(s,p,3,()=>.999);assert.equal(s.round.id,id);assert.equal(s.round.mode,1);assert.equal(s.round.cards[0][0],'small');
 assert.throws(()=>applyCardCommand(s,p,'claim',body({roundId:id}),{now}),/CARD_SELECTION_REQUIRED/);
});
test('release grants exactly five single choices; free card rewards are distinct from roulette spins',()=>{
 const {s,p}=fixture();s.dailyUsed=new Date(now).toISOString().slice(0,10);s.bonus=5;
 for(let i=0;i<5;i++){const id=begin(s,p);applyCardCommand(s,p,'choose',body({roundId:id,index:0}),{now});applyCardCommand(s,p,'claim',body({roundId:id}),{now});}
 assert.equal(s.bonus,0);assert.throws(()=>begin(s,p),/CARD_PAYMENT_REQUIRED/);assert.throws(()=>begin(s,p,3),/CARD_PAYMENT_REQUIRED/);
 s.bonus=1;const id=begin(s,p,1,()=>.99999);applyCardCommand(s,p,'choose',body({roundId:id,index:0}),{now});applyCardCommand(s,p,'claim',body({roundId:id}),{now});assert.equal(s.bonus,2);assert.equal(p.roulette_bonus_spins,undefined);
});
test('verified payment credits mode once; triple requires three distinct valid selections',()=>{
 const {s,p}=fixture();const tx={id:'paid1',item_id:'card_play_3',status:'success'};creditCardPayment(s,tx);creditCardPayment(s,tx);assert.equal(s.paid3,1);
 const id=begin(s,p,3);assert.equal(s.paid3,0);assert.equal(cardStateView(s,now).round.cards.length,4);
 for(const selected of [[0,0,1],[0,1],[0,1,4],['0',1,2]])assert.throws(()=>applyCardCommand(s,p,'claim',body({roundId:id,selected}),{now}),/CARD_SELECTION_INVALID/);
 applyCardCommand(s,p,'claim',body({roundId:id,selected:[0,2,3]}),{now});assert.equal(p.weapon_inventory['small-poison'],18);
 applyCardCommand(s,p,'claim',body({roundId:id,selected:[0,1,2]}),{now});assert.equal(p.weapon_inventory['small-poison'],18);
});
test('retry of a previous begin never consumes another play after claim',()=>{
 // Fixed deal: a random 'free game' prize would legitimately add plays and make this flaky.
 const {s,p}=fixture();s.bonus=5;const b=body({mode:1});const rng=()=>0;applyCardCommand(s,p,'begin',b,{now,rng});const id=s.round.id;
 applyCardCommand(s,p,'choose',body({roundId:id,index:0}),{now,rng});applyCardCommand(s,p,'claim',body({roundId:id}),{now,rng});applyCardCommand(s,p,'begin',b,{now,rng});assert.equal(s.round.id,id);assert.equal(s.bonus,5);
});
test('failed local save changes neither reward nor play balance; concurrent claim pays once',async()=>{
 const player={id:'p',weapon_inventory:{},card_game_bonus:5},store={players:[player],cardGames:{}};
 const options={now,hasDb:false,persistLocal:()=>true,rng:()=>0};
 await assert.rejects(cardGameCommand(store,player,'begin',body({mode:1}),{...options,persistLocal:()=>false}),/CARD_STORAGE_UNAVAILABLE/);
 assert.equal(player.card_game_bonus,5);assert.equal(store.cardGames.p,undefined);
 const opened=await cardGameCommand(store,player,'begin',body({mode:1}),options);assert.equal(opened.free,5);assert.equal(player.card_game_bonus,0);assert.equal(opened.round.cards,null);
 await cardGameCommand(store,player,'choose',body({roundId:opened.round.id,index:0}),options);
 const payload=body({roundId:opened.round.id});await Promise.all([cardGameCommand(store,player,'claim',payload,options),cardGameCommand(store,player,'claim',payload,options)]);
 assert.equal(player.weapon_inventory['small-poison'],6);
 const reloaded=JSON.parse(JSON.stringify(store));assert.equal((await cardGameCommand(reloaded,reloaded.players[0],'state',{},options)).round.status,'claimed');
});

test('card products lock Stars and NEAR prices through the existing payment service',async()=>{
 const {createPaymentService}=await import('../server/services/payment-service.js');
 const {getShopCatalog}=await import('../src/lib/shopCatalog.js');
 const payment=createPaymentService({fetchRates:async()=>({nearUsd:'5.00',tonUsd:'5.00',starsPerUsd:100}),catalog:getShopCatalog(),db:{async createTransaction(order){return order;}}});
 for(const mode of [1,3])for(const paymentMethod of ['telegram_stars','near']){
  const order=await payment.purchase({itemId:'card_play_'+mode,userId:'card-player',paymentMethod});
  assert.equal(order.usd_price,mode===1?'0.20':'0.60');
  if(paymentMethod==='telegram_stars')assert.equal(order.stars_amount_locked,mode===1?20:60);
 }
});

test('card products reject TON purchases',async()=>{
 const {createPaymentService}=await import('../server/services/payment-service.js');
 const {getShopCatalog}=await import('../src/lib/shopCatalog.js');
 const payment=createPaymentService({fetchRates:async()=>({nearUsd:'5',tonUsd:'5',starsPerUsd:100}),catalog:getShopCatalog(),db:{async createTransaction(order){return order;}}});
 for(const mode of [1,3])await assert.rejects(payment.purchase({itemId:'card_play_'+mode,userId:'card-player',paymentMethod:'ton'}),{code:'PAYMENT_METHOD_NOT_SUPPORTED'});
});
