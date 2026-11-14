import test from 'node:test';
import assert from 'node:assert/strict';
import { applyWorldAction } from './planetWorld.js';
import { initialWorld, createWorldMap } from '../../src/lib/planetWorld.js';
test('generated maps are stable and connected with 91 cells',()=>{
  const a=initialWorld('a'), b=initialWorld('b');
  assert.equal(createWorldMap(a.seed).length,91);
  assert.deepEqual(createWorldMap(a.seed),createWorldMap(a.seed));
  assert.notDeepEqual(createWorldMap(a.seed),createWorldMap(b.seed));
});
test('invalid moves and upgrades cannot change persisted state',()=>{
  const p={id:'test',planet_world:initialWorld('test')};
  const before=structuredClone(p);
  assert.throws(()=>applyWorldAction(p,{type:'world-move',q:5,r:0}));
  assert.throws(()=>applyWorldAction(p,{type:'world-build',building:'mine'}));
  assert.deepEqual(p,before);
});
test('exploration rewards are one-time and return prevents being stranded',()=>{
  const p={id:'test',planet_world:initialWorld('test')};
  applyWorldAction(p,{type:'world-move',q:1,r:0});
  const crystals=p.planet_world.crystals;
  applyWorldAction(p,{type:'world-move',q:0,r:0});
  applyWorldAction(p,{type:'world-move',q:1,r:0});
  assert.equal(p.planet_world.crystals,crystals);
  applyWorldAction(p,{type:'world-return'});
  assert.equal(p.planet_world.moves,0);
  applyWorldAction(p,{type:'world-rest'});
  assert.equal(p.planet_world.moves,20);
});
test('buildings spend crystals and mine income is granted once per day',()=>{
  const p={id:'test',planet_world:initialWorld('test')};
  p.planet_world.crystals=30;
  applyWorldAction(p,{type:'world-build',building:'mine'});
  assert.equal(p.planet_world.crystals,18);
  applyWorldAction(p,{type:'world-rest'});
  assert.equal(p.planet_world.crystals,21);
  assert.throws(()=>applyWorldAction(p,{type:'world-rest'}));
});
