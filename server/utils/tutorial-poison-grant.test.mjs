import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerAction } from './playerActions.js';

test('tutorial poison grant repairs an earlier empty grant, then remains one-time', () => {
  const player = {
    tutorial_poison_granted: true,
    weapon_inventory: { 'large-poison': 0 },
  };
  applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(player.weapon_inventory['large-poison'], 5);
  assert.equal(player.tutorial_poison_grant_version, 1);

  player.weapon_inventory['large-poison'] = 2;
  applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(player.weapon_inventory['large-poison'], 2);
});

test('tutorial poison grant adds five to an existing stock and respects disabled tutorials', () => {
  // Current rule (playerActions.js): the one-time tutorial grant adds five large poisons.
  const player = { weapon_inventory: { 'large-poison': 3 } };
  applyPlayerAction(player, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(player.weapon_inventory['large-poison'], 8);

  const disabled = { tutorial_disabled: true, weapon_inventory: {} };
  applyPlayerAction(disabled, { type: 'tutorial-progress', step: 'boss-poison' });
  assert.equal(disabled.weapon_inventory['large-poison'], undefined);
});
