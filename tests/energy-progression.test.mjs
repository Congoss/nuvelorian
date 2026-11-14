import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayerProgression } from '../server/utils/progression.js';

const basePlayer = (overrides = {}) => ({
  id: 'energy-test',
  level: 1,
  max_energy: 100,
  talent_base_max_energy: 100,
  talent_tree_version: 2,
  talent_levels: {},
  ...overrides,
});

test('player level and energy talents produce a 1000 cap at level 100', () => {
  const player = normalizePlayerProgression(basePlayer({
    level: 100,
    talent_levels: { t04: 10, t44: 10, t52: 10 },
  }));
  assert.equal(player.max_energy, 1000);
});

test('level 22 and level-10 energy reserve talent produce 310 cap', () => {
  const player = normalizePlayerProgression(basePlayer({
    level: 22,
    talent_levels: { t04: 10 },
  }));
  assert.equal(player.max_energy, 310);
});
