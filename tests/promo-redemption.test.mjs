import test from 'node:test';
import assert from 'node:assert/strict';
import {redeemPromoCode} from '../server/utils/promoRedemption.js';
const codes=[{code:'TEST',enabled:true,rewards:[{type:'tentacles',amount:100},{type:'small_poison',amount:3}]}];
test('promo pays once per account and rejects repeated and differently cased submissions',()=>{
 const a={tentacles:5};
 redeemPromoCode(a,' test ',codes);
 assert.equal(a.tentacles,105); assert.equal(a.weapon_inventory['small-poison'],3);
 assert.throws(()=>redeemPromoCode(a,'TEST',codes),{code:'PROMO_ALREADY_USED'});
 assert.equal(a.tentacles,105);assert.deepEqual(a.used_promo_codes,['TEST']);
 const b={};redeemPromoCode(b,'TEST',codes);assert.equal(b.tentacles,100);
});
test('disabled and unknown promos do not grant or consume codes',()=>{
 const player={};assert.throws(()=>redeemPromoCode(player,'TEST',[{...codes[0],enabled:false}]),{code:'PROMO_NOT_FOUND'});
 assert.throws(()=>redeemPromoCode(player,'missing',codes),{code:'PROMO_NOT_FOUND'});assert.deepEqual(player,{});
});

test('global activation limit blocks other accounts after limit is reached',()=>{
 const limited=[{...codes[0],maxActivations:1,activationCount:0}];redeemPromoCode({},'TEST',limited);assert.equal(limited[0].activationCount,1);
 const p={};assert.throws(()=>redeemPromoCode(p,'TEST',limited),{code:'PROMO_LIMIT_REACHED'});assert.deepEqual(p,{});
});
