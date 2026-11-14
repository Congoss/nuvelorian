import test from 'node:test';
import assert from 'node:assert/strict';
import { getClanMailReadIds, getGiftMailReadIds, getUnreadMailCount } from '../src/lib/mailNotifications.js';

test('mail badge counts unread gifts, clan letters and pending boxes', () => {
  const profile = {
    gift_mail: [{ id: 'gift-1' }, { id: 'gift-2' }],
    gift_mail_read_ids: ['gift-1'],
    clan_mail: [{ id: 'clan-1' }, { id: 'clan-2' }],
    clan_mail_read_ids: ['clan-2'],
    pending_boss_boxes: [{ instanceId: 'box-1' }],
  };
  assert.equal(getUnreadMailCount(profile), 3);
  assert.deepEqual(getGiftMailReadIds(profile), ['gift-1', 'gift-2']);
  const readProfile = { ...profile, clan_mail_read_ids: getClanMailReadIds(profile) };
  assert.equal(getUnreadMailCount(readProfile), 2);
});
