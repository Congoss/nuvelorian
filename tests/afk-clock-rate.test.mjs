import test from 'node:test';
import assert from 'node:assert/strict';
import { syncServerClock, serverNow } from '../src/lib/serverClock.js';
import { getRequestRatePolicy } from '../server/utils/requestRatePolicy.js';

test('AFK clock ignores device clock differences after server synchronization', () => {
  const original = Date.now;
  try {
    syncServerClock({ headers: new Headers({ date: 'Wed, 07 Oct 2026 10:00:00 GMT' }) });
    const before = serverNow();
    Date.now = () => original() + 12 * 3600000;
    assert.ok(Math.abs(serverNow() - before) < 1000);
    Date.now = () => original() - 12 * 3600000;
    assert.ok(Math.abs(serverNow() - before) < 1000);
  } finally { Date.now = original; }
});
test('gameplay and other reads cannot consume profile and bootstrap request budgets', () => {
  const bootstrap = getRequestRatePolicy('POST', '/players/bootstrap', true);
  const profile = getRequestRatePolicy('GET', '/players/me', true);
  for (const [method, path] of [['PATCH', '/players/123'], ['POST', '/players/123/tasks/complete'], ['GET', '/partners']]) {
    const policy = getRequestRatePolicy(method, path, true);
    assert.notEqual(policy.bucket, bootstrap.bucket);
    assert.notEqual(policy.bucket, profile.bucket);
  }
  assert.notEqual(bootstrap.bucket, profile.bucket);
});
