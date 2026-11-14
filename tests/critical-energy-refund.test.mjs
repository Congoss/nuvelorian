import test from 'node:test';
import assert from 'node:assert/strict';
import {refundCriticalEnergy} from '../server/utils/energyRefund.js';
for(const level of [1,5,10])test('T48 exact chance boundary at level '+level,()=>{
 const p={energy:10,max_energy:100};assert.equal(refundCriticalEnergy(p,true,{t48:level},()=>level*.02),false);assert.equal(p.energy,10);
 assert.equal(refundCriticalEnergy(p,true,{t48:level},()=>level*.02-.00001),true);assert.equal(p.energy,20);
});
test('normal hits and missing talent never refund; cap and overflow are preserved',()=>{
 const p={energy:10,max_energy:100};assert.equal(refundCriticalEnergy(p,false,{t48:10},()=>0),false);assert.equal(refundCriticalEnergy(p,true,{},()=>0),false);assert.equal(p.energy,10);
 p.energy=95;refundCriticalEnergy(p,true,{t48:10},()=>0);assert.equal(p.energy,100);
 p.energy=150;refundCriticalEnergy(p,true,{t48:10},()=>0);assert.equal(p.energy,150);
});
