import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromoUpdates, isPromoCodeActive, resolvePromoCode } from '../src/lib/promoCodes.js';

test('promo date range is inclusive for the Europe/Kyiv calendar date', () => {
  const promo = { enabled: true, startsOn: '2026-10-05', expiresOn: '2026-10-12' };
  assert.equal(isPromoCodeActive(promo, new Date('2026-10-04T18:00:00Z')), false);
  assert.equal(isPromoCodeActive(promo, new Date('2026-10-04T21:00:00Z')), true);
  assert.equal(isPromoCodeActive(promo, new Date('2026-10-12T20:59:00Z')), true);
  assert.equal(isPromoCodeActive(promo, new Date('2026-10-12T21:00:00Z')), false);
});

test('dynamic promo grants every selected reward and accumulates repeated resource types', () => {
  const codes = [{
    code: 'OCTOBER', enabled: true, label: 'Test rewards',
    rewards: [
      { type: 'tentacles', amount: 500 },
      { type: 'tentacles', amount: 300 },
      { type: 'xp', amount: 25 },
      { type: 'small_poison', amount: 2 },
      { type: 'small_poison', amount: 1 },
    ],
  }];
  assert.equal(resolvePromoCode('october', codes).rewards.length, 5);
  const { updates } = buildPromoUpdates({ tentacles: 10, xp: 4, weapon_inventory: { 'small-poison': 1 } }, 'october', codes);
  assert.equal(updates.tentacles, 810);
  assert.equal(updates.xp, 29);
  assert.equal(updates.weapon_inventory['small-poison'], 4);
});

test('disabled and out-of-date promo codes do not resolve', () => {
  assert.equal(resolvePromoCode('off', [{ code: 'OFF', enabled: false, rewards: [{ type: 'tentacles', amount: 1 }] }]), null);
  assert.equal(isPromoCodeActive({ enabled: true, startsOn: '2026-10-13' }, new Date('2026-10-12T12:00:00Z')), false);
});
