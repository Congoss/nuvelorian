import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTalentAttack,getBleedTicks} from '../src/lib/talentCombat.js';
const fight={current_hp:1000,max_hp:1000};
const hit=(id,state,levels={},now=1000)=>resolveTalentAttack({weapon:{id,damage:20},state,levels,fight,now,random:()=>1});
test('base pencil bleed pays all six one-second ticks, including late processing, once',()=>{
 const state=hit('knuckle',{}).state;
 const tick=getBleedTicks(state,7000);
 assert.equal(tick.ticks,6);assert.equal(tick.damage,30);assert.equal(tick.state.bleed,null);
 assert.equal(getBleedTicks(tick.state,8000).damage,0);
 assert.equal(getBleedTicks(state,20000).damage,30);
});
test('bleed and toxic marks coexist; marks require talents to boost finger damage',()=>{
 const pencil=hit('knuckle',{toxicMarks:2});
 const poison=hit('satchel',pencil.state,{},1500);
 assert.equal(poison.state.toxicMarks,3);assert.deepEqual(poison.state.bleed,pencil.state.bleed);
 assert.equal(hit('fist',{toxicMarks:5}).damage,20);
 assert.equal(hit('fist',{toxicMarks:5},{t15:1,t17:1}).damage,45);
 const burst=hit('c4',{...pencil.state,toxicMarks:5},{t38:1},1500);
 assert.equal(burst.state.toxicMarks,0);assert.deepEqual(burst.state.bleed,pencil.state.bleed);
});

test('pencil bleed delivers one damage tick per second without repeated grants', () => {
 let state = hit('knuckle', {}).state;
 for (let now = 2000; now <= 7000; now += 1000) {
   const tick = getBleedTicks(state, now);
   assert.equal(tick.damage, 5);
   assert.equal(tick.ticks, 1);
   state = tick.state;
   assert.equal(getBleedTicks(state, now).damage, 0);
 }
 assert.equal(state.bleed, null);
});
