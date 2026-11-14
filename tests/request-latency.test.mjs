import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { rateLimitedFetch } from '../src/lib/rateLimitedFetch.js';

test('long rate limits return immediately and release deduplicated reads', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('{}', {status:429, headers:{'Retry-After':'60'}}); };
  try {
    const responses = await Promise.all([rateLimitedFetch('/slow'), rateLimitedFetch('/slow')]);
    assert.equal(calls, 1);
    assert.ok(responses.every(response => response.status === 429));
    await rateLimitedFetch('/slow');
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});

test('concurrent API requests share the historical migration pass', async () => {
  const source = fs.readFileSync('server/app.js', 'utf8');
  const helper = source.slice(source.indexOf('let startupMigrationPromise ='), source.indexOf('export async function prepareGameState'));
  let scans = 0;
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const context = vm.createContext({store:{players:[{}],persistSoon(){}},recoverKarma:() => { scans++; return true; },migrateLegacyResourceFields:() => false,reconcilePlayerAchievements:() => {},playerDb:{flushDirtyPlayers:() => pending}});
  vm.runInContext(helper+'\nglobalThis.run = ensureStartupMigrations;', context);
  const first = context.run();
  const second = context.run();
  assert.equal(first, second);
  assert.equal(scans, 1);
  finish();
  await Promise.all([first,second]);
  await context.run();
  assert.equal(scans, 1);
});
