import test from 'node:test';
import assert from 'node:assert/strict';
import { getRequestRatePolicy } from '../server/utils/requestRatePolicy.js';
import { rateLimitedFetch } from '../src/lib/rateLimitedFetch.js';
import { localizeApiError } from '../src/lib/apiErrorTranslations.js';

const combatRoutes = [
  ['POST','/boss-fights/123/attack'], ['POST','/raid-boss/attack'],
  ['POST','/clans/123/ship/attack'], ['POST','/clans/123/ship/open'], ['POST','/clans/123/ship/sync'],
  ['GET','/boss-fights/123'], ['GET','/boss-fights/active'],
  ['GET','/boss-fights/123/damage-logs'], ['GET','/boss-fights/123/damage-logs/me'],
  ['GET','/raid-boss'], ['GET','/raid-boss/leaderboard'], ['GET','/clans/123/ship'],
];
test('authenticated combat and its refreshes have no HTTP quota or rate-limit wait', () => {
  for (const [method,path] of combatRoutes) assert.equal(getRequestRatePolicy(method,path,true),null,`${method} ${path}`);
});
test('anonymous combat and unrelated actions keep their abuse limits', () => {
  for (const [method,path] of combatRoutes) assert(getRequestRatePolicy(method,path,false)?.limit > 0);
  for (const [method,path] of [['POST','/chat/messages'],['POST','/loot/claim'],['POST','/holder-pets/claim'],['POST','/clans/123/ship/contribute'],['POST','/clans/123/ship/rename']]) {
    assert(getRequestRatePolicy(method,path,true)?.limit > 0);
  }
});
test('combat sends once without retries or hidden timers even on failure', async () => {
  const originalFetch=globalThis.fetch, originalTimeout=globalThis.setTimeout;
  try {
    globalThis.setTimeout=()=>{throw new Error('Unexpected combat wait');};
    const body='{"weaponId":"small-poison","multiplier":1}';
    for (const url of ['/api/boss-fights/123/attack','/api/raid-boss/attack','/api/clans/123/ship/attack']) {
      for (const status of [200,429,500,502]) {
        let count=0;
        globalThis.fetch=async (_url,options)=>{count++;assert.equal(options.body,body);return new Response('',{status,headers:{'retry-after':'1'}});};
        assert.equal((await rateLimitedFetch(url,{method:'POST',body})).status,status);
        assert.equal(count,1);
      }
      let count=0;
      globalThis.fetch=async()=>{count++;throw new Error('Disconnected');};
      await assert.rejects(rateLimitedFetch(url,{method:'POST',body}),/Disconnected/);
      assert.equal(count,1);
    }
  } finally {globalThis.fetch=originalFetch;globalThis.setTimeout=originalTimeout;}
});
test('technical rate limit text is localized for unrelated restricted actions', () => {
  for (const language of ['uk','ru','en']) for (const message of ['Too many requests','TOO_MANY_REQUESTS']) {
    assert.doesNotMatch(localizeApiError(undefined,message,language),/too.many.requests/i);
  }
});
