import test from 'node:test';import assert from 'node:assert/strict';import {resetPlayerTalents} from '../server/utils/talentReset.js';
test('first reset is free, refunds points and energy cap; later resets cost 50',()=>{
 const p={talent_tree_version:2,talent_levels:{t01:10,t04:4},available_talent_points:2,premium:81,talent_base_max_energy:100,max_energy:140,energy:1531,talent_combat_state:{fight:{}}};
 assert.equal(resetPlayerTalents(p).reset.cost,0);assert.equal(p.available_talent_points,16);assert.equal(p.max_energy,105);assert.equal(p.energy,1531);assert.equal(p.premium,81);assert.deepEqual(p.talent_combat_state,{});
 assert.throws(()=>resetPlayerTalents(p),{code:'TALENT_RESET_EMPTY'});
 p.talent_levels={t01:1};p.available_talent_points=15;resetPlayerTalents(p);assert.equal(p.premium,31);assert.equal(p.available_talent_points,16);
 p.talent_levels={t01:1};const before=structuredClone(p);assert.throws(()=>resetPlayerTalents(p),{code:'TALENT_RESET_FUNDS'});assert.deepEqual(p,before);
});
