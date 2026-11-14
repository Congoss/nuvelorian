import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyResourceFields, normalizePlayerProgression } from '../server/utils/progression.js';

test('legacy resource fields migrate without losing balances or nested rewards', () => {
  const player = {
    scrap: 2412,
    safe_scrap: 120,
    scrap_per_hour: 14,
    pending_rewards: [{ type: 'scrap', qty: 50 }],
  };

  assert.equal(migrateLegacyResourceFields(player), true);
  assert.equal(player.tentacles, 2412);
  assert.equal(player.safe_tentacles, 120);
  assert.equal(player.tentacles_per_hour, 14);
  assert.deepEqual(player.pending_rewards, [{ type: 'tentacles', qty: 50 }]);
  assert.equal('scrap' in player, false);
  assert.equal('safe_scrap' in player, false);
  assert.equal('scrap_per_hour' in player, false);
});

test('canonical tentacles balance wins when both old and new fields exist', () => {
  const player = { tentacles: 900, scrap: 2412 };
  migrateLegacyResourceFields(player);
  assert.equal(player.tentacles, 900);
  assert.equal('scrap' in player, false);
});

test('API normalization emits canonical balance fields for legacy profiles', () => {
  const normalized = normalizePlayerProgression({ level: 1, xp: 0, scrap: 2412, safe_scrap: 3 });
  assert.equal(normalized.tentacles, 2412);
  assert.equal(normalized.safe_tentacles, 3);
  assert.equal('scrap' in normalized, false);
  assert.equal('safe_scrap' in normalized, false);
});
