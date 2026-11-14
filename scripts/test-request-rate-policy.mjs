import assert from 'node:assert/strict';
import { getRequestRatePolicy } from '../server/utils/requestRatePolicy.js';

const authenticated = true;
const analytics = getRequestRatePolicy('POST', '/apps/test/analytics/track/batch', false);
const attack = getRequestRatePolicy('POST', '/boss-fights/fight-1/attack', authenticated);
const quest = getRequestRatePolicy('POST', '/players/player-1/tasks/complete', authenticated);
const profile = getRequestRatePolicy('PATCH', '/players/player-1', authenticated);
const loot = getRequestRatePolicy('POST', '/loot/claim', authenticated);
assert.equal(getRequestRatePolicy('GET', '/assets/boss-layer.webp', false), null);
assert.notEqual(analytics.bucket, attack.bucket);
assert.notEqual(attack.bucket, quest.bucket);
assert.notEqual(quest.bucket, profile.bucket);
assert.notEqual(profile.bucket, loot.bucket);
assert.ok(attack.limit >= 60);
assert.ok(analytics.limit > attack.limit);
console.log('Request rate policy checks passed');
