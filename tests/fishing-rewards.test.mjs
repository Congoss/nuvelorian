import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerAction } from '../server/utils/playerActions.js';
const kinds=['common','uncommon','rare','epic','mythic','legendary','black_hole'];
test('fish exchanges grant new poison and energy rewards and consume fish once',()=>{
  for (const [rarity,expected] of [['uncommon',{energy:20}],['rare',{smallPoison:3}],['epic',{mediumPoison:2}],['legendary',{largePoison:3}],['black_hole',{smallPoison:8,mediumPoison:4,largePoison:2}]]) {
    const p={energy:1500,max_energy:100,cosmofish_inventory:{[rarity]:1}};
    assert.deepEqual(applyPlayerAction(p,{type:'fishing-exchange',rarity}).reward,expected);
    assert.equal(p.energy,1500+(expected.energy||0));
    assert.equal(p.weapon_inventory?.['small-poison']||0,expected.smallPoison||0);
    assert.equal(p.weapon_inventory?.['medium-poison']||0,expected.mediumPoison||0);
    assert.equal(p.weapon_inventory?.['large-poison']||0,expected.largePoison||0);
    assert.throws(()=>applyPlayerAction(p,{type:'fishing-exchange',rarity}));
  }
});
test('seven-rarity exchange credits 250 energy, 20 spins and 10 large poisons without reducing overflow',()=>{
  const p={level:1,xp:0,energy:1500,max_energy:100,cosmofish_inventory:Object.fromEntries(kinds.map(k=>[k,1]))};
  applyPlayerAction(p,{type:'fishing-exchange',comboKey:'combo_7'});
  assert.equal(p.energy,1750);assert.equal(p.roulette_bonus_spins,20);assert.equal(p.weapon_inventory['large-poison'],10);
  for(const k of kinds) assert.equal(p.cosmofish_inventory[k],0);
  assert.throws(()=>applyPlayerAction(p,{type:'fishing-exchange',comboKey:'combo_7'}));
});
test('four-rarity fish combo grants 150 XP and other listed rewards exactly once',()=>{
  const p={level:1,xp:0,energy:100,max_energy:100,cosmofish_inventory:{common:1,uncommon:1,rare:1,epic:1}};
  const result=applyPlayerAction(p,{type:'fishing-exchange',comboKey:'combo_4'});
  assert.deepEqual(result.reward,{xp:150,energy:25,mediumPoison:2});
  assert.equal(p.level,3);
  assert.equal(p.xp,54);
  assert.equal(p.energy,125);
  assert.equal(p.weapon_inventory['medium-poison'],2);
  assert.deepEqual(p.cosmofish_inventory,{common:0,uncommon:0,rare:0,epic:0});
  assert.throws(()=>applyPlayerAction(p,{type:'fishing-exchange',comboKey:'combo_4'}));
});
