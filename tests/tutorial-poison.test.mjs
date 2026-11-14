import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerAction } from '../server/utils/playerActions.js';

test('tutorial awards five flasks once, preserves existing inventory and never refills after spending', () => {
  const player = { id: 'p1', weapon_inventory: { 'large-poison': 3, 'small-poison': 11 } };
  applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(player.weapon_inventory['large-poison'], 8);
  assert.equal(player.weapon_inventory['small-poison'], 11);
  assert.equal(player.tutorial_poison_granted, true);
  applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(player.weapon_inventory['large-poison'], 8);
  const reloaded = JSON.parse(JSON.stringify(player));
  reloaded.weapon_inventory['large-poison'] = 0;
  applyPlayerAction(reloaded, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(reloaded.weapon_inventory['large-poison'], 0);
});

test('other tutorial stages do not grant training poison', () => {
  const player = { id: 'p1' };
  applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-pencil' });
  assert.equal(player.tutorial_poison_granted, undefined);
  assert.equal(player.weapon_inventory, undefined);
});

test('completed or disabled tutorial cannot grant training poison', () => {
  for (const flags of [{ tutorial_disabled: true }, { tutorial_level_eight_reward_claimed: true }]) {
    const player = { id: 'p1', ...flags };
    applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-poison' });
    assert.equal(player.weapon_inventory, undefined);
  }
});
