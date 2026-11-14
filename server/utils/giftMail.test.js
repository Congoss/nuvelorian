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


test('pumpkin mail credits event balance once and preserves mail outside the event', () => {
  const originalNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-22T12:00:00Z');
    const player = { gift_mail: [{ id: 'pumpkins', rewards: [{ field: 'halloween_pumpkin', amount: 7 }] }] };
    claimGiftMail(player, 'pumpkins');
    assert.equal(player.halloween_event.balance, 7);
    assert.equal(claimGiftMail(player, 'pumpkins').alreadyClaimed, true);
    assert.equal(player.halloween_event.balance, 7);
    player.gift_mail = [{ id: 'expired', rewards: [{ field: 'premium', amount: 2 }, { field: 'halloween_pumpkin', amount: 3 }] }];
    Date.now = () => Date.parse('2026-11-05T12:00:00Z');
    assert.throws(() => claimGiftMail(player, 'expired'), { code: 'HALLOWEEN_CLOSED' });
    assert.equal(player.premium, undefined);
    assert.equal(player.gift_mail.length, 1);
  } finally { Date.now = originalNow; }
});
