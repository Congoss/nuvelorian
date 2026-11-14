import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedCriticalHit } from '../src/lib/attackFeedback.js';

test('a slow confirmation still shows the actual crit, independently of the visible tap', () => {
  const hit = {damage:200,isCrit:true};
  assert.equal(confirmedCriticalHit({hit},1900),hit);
});

test('mixed batches show a critical press instead of labeling the entire batch as a crit', () => {
  const crit = {damage:200,isCrit:true};
  const result = {hit:{damage:450,isCrit:true},hits:[crit,{damage:250,isCrit:false}]};
  assert.equal(confirmedCriticalHit(result,700),crit);
});

test('an old retry, blocked hit, or ordinary hit does not trigger a crit popup', () => {
  assert.equal(confirmedCriticalHit({hit:{damage:200,isCrit:true}},30000),null);
  assert.equal(confirmedCriticalHit({hit:{damage:0,isCrit:true,blocked:true}},100),null);
  assert.equal(confirmedCriticalHit({hit:{damage:200,isCrit:false}},100),null);
});
