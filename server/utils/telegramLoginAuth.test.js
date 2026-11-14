import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { verifyTelegramLoginData } from './telegramAuth.js';

const botToken = '123456:test-token';
const now = 1792573200000;

function signedLogin(overrides = {}) {
  const payload = { id: 777, first_name: 'Web', username: 'web_player', auth_date: Math.floor(now / 1000), ...overrides };
  const check = Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHash('sha256').update(botToken).digest();
  return { ...payload, hash: createHmac('sha256', secret).update(check).digest('hex') };
}

test('Telegram Login Widget payload is verified and normalized', () => {
  const result = verifyTelegramLoginData(signedLogin(), { botToken, now: () => now });
  assert.equal(result.ok, true);
  assert.deepEqual(result.user, { id: 777, username: 'web_player', photo_url: '' });
});

test('Telegram Login Widget rejects forged and expired payloads', () => {
  assert.equal(verifyTelegramLoginData({ ...signedLogin(), username: 'forged' }, { botToken, now: () => now }).reason, 'invalid_hash');
  assert.equal(verifyTelegramLoginData(signedLogin({ auth_date: Math.floor(now / 1000) - 86401 }), { botToken, now: () => now }).reason, 'expired_login_data');
});
