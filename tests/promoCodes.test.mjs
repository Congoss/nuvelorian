import assert from 'node:assert/strict';
import test from 'node:test';

import { PROMO_CODES } from '../src/lib/promoCodes.js';

test('promo codes include JOPKA with combo rewards', () => {
  assert.ok(PROMO_CODES.JOPKA);
  assert.deepEqual(PROMO_CODES.JOPKA.rewards, [
    { type: 'energy', amount: 100 },
    { type: 'currency', amount: 1500000 },
    { type: 'item', itemId: 'small-poison', amount: 3 },
    { type: 'item', itemId: 'medium-poison', amount: 2 },
    { type: 'item', itemId: 'large-poison', amount: 1 },
  ]);
});
