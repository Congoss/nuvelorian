import test from 'node:test';
import assert from 'node:assert/strict';
import { recordBattlePassEvent, claimBattlePassReward, battlePassView } from '../server/utils/battlePass.js';
process.env.BATTLE_PASS_START='2026-09-14T00:00:00Z';
process.env.BATTLE_PASS_END='2026-11-04T00:00:00Z';
const now=Date.parse('2026-10-09T12:00:00Z');
test('legendary gear and background grant once, including previously claimed placeholders',()=>{
 const p={level:1,inventory_items:[]};recordBattlePassEvent(p,{type:'login'},now);
 p.battle_pass.tier='legendary';p.battle_pass.xp=7500;
 for(const level of [5,10,15,20,25,30,40,50])claimBattlePassReward(p,{track:'legendary',level},now);
 assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length,6);assert.ok(p.unlocked_backgrounds.includes('bp-legendary'));
 p.inventory_items=[];battlePassView(p,now);assert.equal(p.inventory_items.filter(item => item.slot !== 'animation').length,0);
 const old={level:1,inventory_items:[],battle_pass:structuredClone(p.battle_pass)};
 old.battle_pass.items=old.battle_pass.items.map(item=>({...item,placeholder:true}));
 const premium=old.premium;battlePassView(old,now);assert.equal(old.inventory_items.filter(item => item.slot !== 'animation').length,6);assert.equal(old.premium,premium);
});
