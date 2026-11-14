import test from 'node:test';
import assert from 'node:assert/strict';
import { getShipSectorState, getShipGoal } from '../src/lib/clanShipSectorState.js';
const modules=[{id:'a',level:1,cost:100},{id:'b',level:2,cost:200},{id:'c',level:3,cost:300}];
test('construction and first victory gate the next sector',()=>{
 const progress={a:0,b:0,c:0},kills={a:0,b:0,c:0};
 assert.equal(getShipSectorState(modules[0],modules,progress,kills).state,'building');
 assert.equal(getShipSectorState(modules[1],modules,progress,kills).state,'locked');
 progress.a=100;
 assert.equal(getShipSectorState(modules[0],modules,progress,kills).state,'built');
 assert.equal(getShipGoal(modules,progress,kills).id,'a');
 assert.equal(getShipSectorState(modules[1],modules,progress,kills).state,'locked');
 kills.a=1;
 assert.equal(getShipGoal(modules,progress,kills).id,'b');
 assert.equal(getShipSectorState(modules[1],modules,progress,kills).state,'building');
});
test('buff starts at zero and increases every ten victories through level ten',()=>{
 for(const [wins,level,bonus,nextWins] of [[0,0,0,10],[9,0,0,1],[10,1,2,10],[24,2,4,6],[99,9,18,1],[100,10,20,0]]){
 const state=getShipSectorState(modules[0],modules,{a:100},{a:wins});
 assert.deepEqual([state.level,state.bonus,state.nextWins],[level,bonus,nextWins]);
 }
});
test('viewing a different sector does not change the clan goal',()=>{
 const progress={a:100,b:40,c:0},kills={a:2,b:0};
 getShipSectorState(modules[0],modules,progress,kills);
 getShipSectorState(modules[2],modules,progress,kills);
 assert.equal(getShipGoal(modules,progress,kills).id,'b');
});
