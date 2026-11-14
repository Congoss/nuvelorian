import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingBossHp, pendingBossStock } from '../src/lib/pendingBossAttack.js';

test('pending hit responds immediately without predicting a victory or mutating server state', () => {
  const fight = { id: 'boss', status: 'active', current_hp: 100 };
  const pending = { fightId: 'boss', weaponId: 'satchel', damage: 45, count: 5 };
  assert.equal(pendingBossHp(fight, pending), 55);
  assert.equal(pendingBossHp(fight, { ...pending, damage: 200 }), 1);
  assert.equal(fight.current_hp, 100);
  assert.equal(pendingBossStock(8, 'satchel', pending), 3);
  assert.equal(pendingBossStock(8, 'c4', pending), 8);
  assert.equal(pendingBossStock(null, 'satchel', pending), null);
});

test('confirmation, rejection and switching fights remove the display prediction', () => {
  const pending = { fightId: 'boss', damage: 45 };
  assert.equal(pendingBossHp({ id: 'other', status: 'active', current_hp: 100 }, pending), 100);
  assert.equal(pendingBossHp({ id: 'boss', status: 'dead', current_hp: 0 }, pending), 0);
  assert.equal(pendingBossHp({ id: 'boss', status: 'active', current_hp: 80 }, null), 80);
  assert.equal(pendingBossHp({ id: 'boss', status: 'active', current_hp: 100 }, { ...pending, damage: NaN }), 100);
  assert.equal(pendingBossStock(8, 'satchel', null), 8);
});
