import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebAuth } from './webAuth.js';

test('one-time launch preserves Telegram identity and signs a secure cookie', () => {
  let time = 1000;
  const auth = createWebAuth({ secret: 'test-secret', now: () => time });
  const token = auth.createLaunch({ telegramId: '123', username: 'player', email: 'telegram_123@miniapp.local' });
  const cookie = auth.exchange(token);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /; Secure/);
  assert.equal(auth.session({ cookie }).telegramId, '123');
  assert.throws(() => auth.exchange(token));
  assert.equal(auth.session({ cookie: cookie.replace('=', '=x') }), null);
  time += 8 * 24 * 60 * 60 * 1000;
  assert.equal(auth.session({ cookie }), null);
});

test('expired, superseded, forged and mock launches fail closed', () => {
  let time = 0;
  const auth = createWebAuth({ secret: 'test-secret', now: () => time });
  const identity = { telegramId: '123' };
  const first = auth.createLaunch(identity);
  const second = auth.createLaunch(identity);
  assert.throws(() => auth.exchange(first));
  assert.throws(() => auth.createLaunch({ ...identity, isMock: true }));
  assert.throws(() => auth.exchange('a'.repeat(43)));
  time += 120000;
  assert.throws(() => auth.exchange(second));
  assert.equal(auth.session({ cookie: 'p4_web_session=123.fake' }), null);
  assert.throws(() => createWebAuth().createLaunch(identity));
});

test('signed browser session survives server restarts with the same secret', () => {
  const auth = createWebAuth({ secret: 'test-secret' });
  const cookie = auth.exchange(auth.createLaunch({ telegramId: '123' }));
  assert.equal(createWebAuth({ secret: 'test-secret' }).session({ cookie }).telegramId, '123');
  assert.equal(createWebAuth({ secret: 'another-secret' }).session({ cookie }), null);
});
