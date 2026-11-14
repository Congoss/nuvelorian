import test from 'node:test';
import assert from 'node:assert/strict';
import { refundCombatEnergy } from '../server/utils/energyRefund.js';
import { applyTalentUpgrade } from '../src/lib/talents.js';
test('combat energy refunds never remove reward energy above regeneration cap', () => {
  for (const amount of [1,10]) {
    const player={energy:1500,max_energy:100};refundCombatEnergy(player,amount);assert.equal(player.energy,1500);
  }
  const player={energy:95,max_energy:100};refundCombatEnergy(player,10);assert.equal(player.energy,100);
});
test('upgrading a talent preserves accumulated energy above the cap', () => {
  const patch=applyTalentUpgrade({energy:1500,max_energy:100,talent_tree_version:2,available_talent_points:1,talent_points:1,talent_levels:{}},'t01');
  assert.ok(patch);assert.equal(patch.energy,1500);
});
