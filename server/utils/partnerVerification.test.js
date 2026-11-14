import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTelegramMembership, normalizePartnerLink, parseVerifiablePartnerLink, verifyXFollow } from './partnerVerification.js';

test('partner links accept Telegram chats and message links, and direct X profiles', () => {
  assert.equal(normalizePartnerLink('t.me/nuvelorian'), 'https://t.me/nuvelorian');
  assert.equal(normalizePartnerLink('x.com/Nuvelorian'), 'https://x.com/Nuvelorian');
  assert.deepEqual(parseVerifiablePartnerLink('https://t.me/planet4_game'), { type: 'telegram', handle: 'planet4_game' });
  assert.deepEqual(parseVerifiablePartnerLink('https://t.me/nuvelor_chat/16931'), { type: 'telegram', handle: 'nuvelor_chat' });
  assert.deepEqual(parseVerifiablePartnerLink('https://t.me/nuvelor_chat/100/16931'), { type: 'telegram', handle: 'nuvelor_chat' });
  for (const link of ['https://t.me/nuvelor_chat/not-a-message', 'https://t.me/c/123/456', 'https://t.me/nuvelor_chat/1/2/3']) assert.equal(parseVerifiablePartnerLink(link), null);
  assert.deepEqual(parseVerifiablePartnerLink('https://x.com/planet4_game'), { type: 'x', handle: 'planet4_game' });
  for (const link of ['http://t.me/planet4_game', 'https://t.me/+invite', 'https://x.com/planet4_game/status/1', 'https://x.com.evil.test/planet4_game', 'https://x.com/planet4_game?x=1']) {
    assert.equal(parseVerifiablePartnerLink(link), null);
  }
});

test('Telegram membership distinguishes subscribed, left and unavailable', () => {
  for (const status of ['creator', 'administrator', 'member']) assert.equal(classifyTelegramMembership({ status }), true);
  assert.equal(classifyTelegramMembership({ status: 'restricted', is_member: true }), true);
  assert.equal(classifyTelegramMembership({ status: 'restricted', is_member: false }), false);
  for (const status of ['left', 'kicked', 'banned']) assert.equal(classifyTelegramMembership({ status }), false);
  assert.throws(() => classifyTelegramMembership(null), /unavailable/);
  assert.throws(() => classifyTelegramMembership({ status: 'restricted' }), /unavailable/);
});

test('X follow verification checks pagination and fails closed', async () => {
  const pages = [
    { data: [{ username: 'other' }], meta: { next_token: 'next' } },
    { data: [{ username: 'Planet4_Game' }], meta: {} },
  ];
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url.toString());
    return { ok: true, json: async () => pages.shift() };
  };
  assert.equal(await verifyXFollow('token', '123', 'planet4_game', fetcher), true);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /pagination_token=next/);
  await assert.rejects(verifyXFollow('token', '123', 'planet4_game', async () => ({ ok: false, status: 429 })), /429/);
});
