import test from 'node:test';
import assert from 'node:assert/strict';
import {getShipConstructionProduct,parseShipConstructionProduct} from '../src/lib/shipConstructionPayments.js';
import {getShopPaymentProduct} from '../src/lib/shopCatalog.js';
import {ensureShip,applyShipConstructionPayment,contributeShip} from '../server/utils/clanShip.js';
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
import {createPaymentService} from '../server/services/payment-service.js';
const item=getShipConstructionProduct('clan-1','engine',25);
const payment=(overrides={})=>({id:'ship-payment-order-0001',user_id:'u1',item_id:item.id,payment_method:'telegram_stars',amount_paid:'25',status:'success',...overrides});
function fixture(){const clan={id:'clan-1'},ship=ensureShip(clan);ship.progress.hull=100000000;ship.kills.hull=1;return clan;}
test('construction products lock Stars price, USD price and build units, allow only Stars/NEAR',()=>{
 assert.equal(item.stars,25);assert.equal(item.usd,.25);assert.equal(item.constructionUnits,100000);assert.deepEqual(item.paymentMethods,['near','telegram_stars']);
 assert.deepEqual(getShopPaymentProduct(item.id),item);assert.deepEqual(parseShipConstructionProduct(item.id),item);
 for(const id of ['ship_build:clan-1:engine:0','ship_build:clan-1:engine:-1','ship_build:clan-1:engine:1.5','ship_build:clan-1:unknown:25','ship_build:%:engine:25'])assert.equal(parseShipConstructionProduct(id),null);
});
test('confirmed order contributes once and rejects unconfirmed, wrong order and wrong clan',()=>{
 const clan=fixture();const first=applyShipConstructionPayment(clan,payment(),item);assert.equal(first.applied,100000);assert.equal(clan.ship.progress.engine,100000);
 assert.equal(applyShipConstructionPayment(clan,payment(),item).replayed,true);assert.equal(clan.ship.progress.engine,100000);
 assert.throws(()=>applyShipConstructionPayment(clan,payment({status:'pending'}),item),/INVALID_SHIP_PAYMENT/);
 assert.throws(()=>applyShipConstructionPayment(clan,payment({item_id:'fake'}),item),/INVALID_SHIP_PAYMENT/);
 assert.throws(()=>applyShipConstructionPayment({id:'another'},payment(),item),/INVALID_SHIP_PAYMENT/);
});
test('overlapping paid contributions keep excess credit for later construction',()=>{
 const clan=fixture();clan.ship.progress.engine=SHIP_MODULES[1].cost-5000;
 applyShipConstructionPayment(clan,payment(),item);assert.equal(clan.ship.progress.engine,SHIP_MODULES[1].cost);assert.equal(clan.ship.paidCredit,95000);
 clan.ship.kills.engine=1;const player={id:'u1',tentacles:123,premium:999};
 const used=contributeShip(clan,player,{requestId:'use-paid-reserve-0001',moduleId:'hangar',currency:'paid_credit',amount:95000});assert.equal(used.applied,95000);assert.equal(clan.ship.paidCredit,0);assert.equal(player.tentacles,123);assert.equal(player.premium,999);
});
test('paper cannot fund ship construction',()=>{
 const clan=fixture(),player={id:'u1',tentacles:100000,premium:999};
 assert.throws(()=>contributeShip(clan,player,{requestId:'paper-not-allowed-001',moduleId:'engine',currency:'paper',amount:10}),/SHIP_CURRENCY_UNAVAILABLE/);assert.equal(player.premium,999);assert.equal(clan.ship.progress.engine,0);
});
test('Stars and NEAR orders grant construction only after confirmation and once per order',async()=>{
 const clan=fixture(),transactions=new Map();let grants=0;
 const service=createPaymentService({fetchRates:async()=>({tonUsd:'2',nearUsd:'5',starsPerUsd:100}),db:{createTransaction:async t=>{transactions.set(t.id,t);return t},findTransactionById:async id=>transactions.get(id),findTransactionByHash:async hash=>[...transactions.values()].find(t=>t.tx_hash===hash),updateTransaction:async(id,patch)=>{const next={...transactions.get(id),...patch};transactions.set(id,next);return next}},grantReward:async({transaction,itemId})=>{applyShipConstructionPayment(clan,transaction,parseShipConstructionProduct(itemId));grants++;}});
 for(const method of ['telegram_stars','near']){
  const order=await service.purchase({itemId:item.id,userId:'u1',paymentMethod:method});const before=clan.ship.progress.engine;assert.equal(order.status,'pending');
  const confirm=()=>method==='near'?service.confirmNearPayment({orderId:order.id,txHash:'hash-'+order.id,amount:order.near_amount_locked,recipient:'congos.tg',confirmed:true}):service.confirmStarsPayment({orderId:order.id,telegramPaymentChargeId:'charge-'+order.id,amount:25,currency:'XTR',confirmed:true});
  await confirm();await confirm();assert.equal(clan.ship.progress.engine,before+100000);
 }
 assert.equal(grants,2);assert.equal(clan.ship.progress.engine,200000);
 await assert.rejects(service.purchase({itemId:item.id,userId:'u1',paymentMethod:'ton'}),/not supported/);
});

test('public request IDs cannot collide with payment delivery receipts',()=>{
 const clan=fixture();contributeShip(clan,{id:'u1',tentacles:100},{requestId:payment().id,moduleId:'engine',currency:'tentacles',amount:1});
 applyShipConstructionPayment(clan,payment(),item);assert.equal(clan.ship.progress.engine,100001);
});
