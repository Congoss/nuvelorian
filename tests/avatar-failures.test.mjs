import test from 'node:test';import assert from 'node:assert/strict';
import {createAvatarFailures} from '../src/lib/failedAvatars.js';
test('failed remote avatars avoid repeated requests, expire and use bounded memory',()=>{
 let now=100;const cache=createAvatarFailures({ttl:10,max:2,now:()=>now});
 cache.remember('https://avatar.test/a');assert.equal(cache.has('https://avatar.test/a'),true);
 now=111;assert.equal(cache.has('https://avatar.test/a'),false);
 cache.remember('https://avatar.test/a');cache.remember('https://avatar.test/b');cache.remember('https://avatar.test/c');
 assert.equal(cache.has('https://avatar.test/a'),false);assert.equal(cache.has('https://avatar.test/c'),true);
 cache.remember('/assets/broken.webp');assert.equal(cache.has('/assets/broken.webp'),false);
});
