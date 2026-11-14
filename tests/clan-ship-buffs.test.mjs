import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIP_BUFFS, getShipBuff } from '../src/lib/clanShipBuffs.js';
import { SHIP_MODULES, createShipProgress } from '../src/lib/clanShipPreview.js';
import { getShipSectorState } from '../src/lib/clanShipSectorState.js';
test('all fourteen sectors including platform have localized ten-level buffs',()=>{
 assert.equal(SHIP_BUFFS.length,14);
 const maxima=[10,10,300,400,150,5,5,50,300,50,200,300,1000,10];
 SHIP_MODULES.forEach((module,i)=>{
  for(const lang of ['uk','ru','en']) {
   const buff=getShipBuff(module.id,10,lang);
   assert.equal(buff.value,maxima[i]);
   assert.ok(buff.name && buff.description);
   assert.equal(getShipBuff(module.id,0,lang).value,0);
   assert.equal(getShipBuff(module.id,100,lang).value,maxima[i]);
  }
 });
 const hull=SHIP_MODULES[0];
 for(const wins of [0,10,50,100]){
  const state=getShipSectorState(hull,SHIP_MODULES,{...createShipProgress(),hull:hull.cost},{hull:wins});
  assert.equal(getShipBuff(hull.id,state.level).value,wins/10);
 }
});
