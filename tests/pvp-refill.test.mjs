import test from 'node:test';import assert from 'node:assert/strict';
import {pvpRefillQuote,getPvpRefillProduct,PVP_COOLDOWN_MS} from '../src/lib/pvpRanks.js';
import {getShopPaymentProduct} from '../src/lib/shopCatalog.js';
import {emptyOnlineState,onlineDuelCommand,creditPvpRefill} from '../server/services/pvp-online.js';
test('missing attempts cost 20/40/60/80/99 Stars and event sales cannot change the charge',()=>{
 for(let missing=1;missing<=5;missing++){const expected=[20,40,60,80,99][missing-1];assert.equal(pvpRefillQuote(5-missing).stars,expected);const product=getShopPaymentProduct('pvp_refill_'+missing);assert.equal(product.stars,expected);assert.deepEqual(product.paymentMethods,['telegram_stars']);}
 assert.deepEqual(pvpRefillQuote(5),{attempts:0,stars:0});assert.equal(getPvpRefillProduct('pvp_refill_6'),null);
});
test('paid refill is idempotent and regen during checkout does not burn purchased attempts',()=>{
 const state=emptyOnlineState(),p={id:'paid'},other={id:'other'};onlineDuelCommand(state,p,undefined,1000);state.profiles.paid.attempts=0;state.profiles.paid.readyAt=1000;
 creditPvpRefill(state,p,'order',5,1000+PVP_COOLDOWN_MS);
 assert.equal(state.profiles.paid.attempts,5);assert.equal(state.profiles.paid.paidReserve,2);
 creditPvpRefill(state,p,'order',5,1000+PVP_COOLDOWN_MS);assert.equal(state.profiles.paid.paidReserve,2);
 onlineDuelCommand(state,p,{action:'queue'},1001+PVP_COOLDOWN_MS);const {match}=onlineDuelCommand(state,other,{action:'queue'},1001+PVP_COOLDOWN_MS);
 assert.equal(state.profiles.paid.attempts,5);assert.equal(state.profiles.paid.paidReserve,1);assert.equal(match.status,'active');
});
