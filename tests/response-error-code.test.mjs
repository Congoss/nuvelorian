import test from 'node:test';
import assert from 'node:assert/strict';
import {responseErrorCode} from '../src/lib/responseErrorCode.js';
import {localizeApiError} from '../src/lib/apiErrorTranslations.js';
test('429 preserves gameplay cooldown instead of substituting generic rate limiting',()=>{
 const code=responseErrorCode(429,{code:'BOSS_ESCAPE_COOLDOWN'});
 assert.equal(code,'BOSS_ESCAPE_COOLDOWN');
 for(const lang of ['uk','ru','en'])assert.match(localizeApiError(code,'fallback',lang),/30/);
 assert.equal(responseErrorCode(429,{code:'SKILL_COOLDOWN_ACTIVE'}),'SKILL_COOLDOWN_ACTIVE');
});
test('generic 429 retains its fallback while other statuses preserve their codes',()=>{
 assert.equal(responseErrorCode(429,{}),'RATE_LIMITED');
 assert.equal(responseErrorCode(409,{code:'NO_POISON_INVENTORY'}),'NO_POISON_INVENTORY');
 assert.equal(responseErrorCode(500,{}),undefined);
});
