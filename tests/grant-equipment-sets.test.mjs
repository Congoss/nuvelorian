import {EQUIPMENT_SET_BALANCE} from '../src/lib/equipmentBalance.js';
import {FEATURE_FLAGS} from '../src/lib/featureFlags.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { grantAllEquipmentSets } from '../server/utils/grantEquipmentSets.js';

test('grant all sets preserves existing gear and progression and does not duplicate items', () => {
  const existing = { id: 'cardboard_weapon', type: 'equipment', count: 3 };
  const player = { inventory_items: [existing], equipped_items: { weapon: existing.id }, battle_pass: { xp: 150, tier: 'free' }, tentacles: 12 };
  const expected=Object.values(EQUIPMENT_SET_BALANCE).filter(set=>set.prefix!=='halloween_2026'||FEATURE_FLAGS.halloween).length*6;
  assert.equal(grantAllEquipmentSets(player).added, expected-1);
  assert.equal(player.inventory_items.length, expected);
  assert.equal(player.inventory_items[0], existing);
  assert.equal(grantAllEquipmentSets(player).added, 0);
  assert.equal(new Set(player.inventory_items.map(item => item.id)).size, expected);
  assert.deepEqual(player.equipped_items, { weapon: existing.id });
  assert.deepEqual(player.battle_pass, { xp: 150, tier: 'free' });
  assert.equal(player.tentacles, 12);
  assert.ok(player.unlocked_backgrounds.includes('bp-legendary'));
  assert.equal(player.inventory_items.find(item => item.id === 'bp_legendary_head').setId, 'bp_legendary');
});
