import test from 'node:test';
import assert from 'node:assert/strict';
import { claimGiftMail } from './giftMail.js';

test('legacy bonus mail can be dismissed once without granting its old bonus again', () => {
  const player = { tentacles: 50, gift_mail: [{ id: 'legacy-mail', title: 'Daily bonus' }] };

  const result = claimGiftMail(player, 'legacy-mail');

  assert.equal(result.legacy, true);
  assert.deepEqual(result.rewards, []);
  assert.equal(player.tentacles, 50);
  assert.deepEqual(player.gift_mail, []);
  assert.equal(claimGiftMail(player, 'legacy-mail').alreadyClaimed, true);
});

test('gift mail credits all poison sizes to inventory exactly once', () => {
  const player = {
    weapon_inventory: { 'small-poison': 2 },
    gift_mail: [{
      id: 'poison-mail',
      rewards: [
        { field: 'small_poison', amount: 10 },
        { field: 'medium_poison', amount: 7 },
        { field: 'large_poison', amount: 3 },
      ],
    }],
  };

  const result = claimGiftMail(player, 'poison-mail');

  assert.equal(result.alreadyClaimed, false);
  assert.deepEqual(player.weapon_inventory, {
    'small-poison': 12,
    'medium-poison': 7,
    'large-poison': 3,
  });
  assert.equal(claimGiftMail(player, 'poison-mail').alreadyClaimed, true);
  assert.equal(player.weapon_inventory['small-poison'], 12);
});
