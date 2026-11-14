import test from 'node:test';
import assert from 'node:assert/strict';
import { createGrowState, growAction, growProgress, growDuration, growYield, GROW_DURATION } from '../src/lib/cosmoGrow.js';

test('growth survives elapsed time, rejects early and duplicate harvests', () => {
  const planted = growAction(createGrowState(), 'plant', 1000);
  assert.equal(growProgress(planted, 1000 + GROW_DURATION / 2), .5);
  assert.equal(growAction(planted, 'harvest', 2000), planted);
  const harvested = growAction(planted, 'harvest', 1000 + GROW_DURATION);
  assert.equal(harvested.harvest, 5);
  assert.equal(harvested.cycles, 1);
  assert.equal(growAction(harvested, 'harvest', 200000), harvested);
});

test('care is once per cycle, locks at maturity and increases the yield', () => {
  let state = growAction(createGrowState(), 'plant', 1000);
  for (const action of ['water', 'water', 'light', 'feed']) state = growAction(state, action, 2000);
  assert.equal(state.care.length, 3);
  state = growAction(state, 'harvest', 1000 + GROW_DURATION);
  assert.equal(state.harvest, 14);
  state = growAction(state, 'plant', 200000);
  assert.deepEqual(state.care, []);
  assert.equal(growAction(state, 'water', 200000 + GROW_DURATION), state);
});

test('exchange requires sufficient harvest and cannot overspend', () => {
  const empty = createGrowState();
  assert.equal(growAction(empty, 'exchange'), empty);
  const exchanged = growAction({ ...empty, harvest: 28 }, 'exchange');
  assert.equal(exchanged.harvest, 8);
  assert.equal(exchanged.tokens, 1);
  assert.equal(growAction(exchanged, 'exchange'), exchanged);
});

test('lamp upgrades cost harvest, cap at three and affect only new cycles', () => {
  const empty = createGrowState();
  assert.equal(growAction(empty, 'upgrade-lamp'), empty);
  const planted = growAction({ ...empty, harvest: 30 }, 'plant', 1000);
  const upgraded = growAction(planted, 'upgrade-lamp', 2000);
  assert.equal(upgraded.lampLevel, 2);
  assert.equal(upgraded.harvest, 24);
  assert.equal(growDuration(upgraded), GROW_DURATION);
  assert.equal(growYield(upgraded), 5);
  const harvested = growAction(upgraded, 'harvest', 121000);
  const next = growAction(harvested, 'plant', 200000);
  assert.equal(growDuration(next), 100000);
  assert.equal(growYield(next), 7);
  const max = growAction(next, 'upgrade-lamp');
  assert.equal(max.lampLevel, 3);
  assert.equal(growAction(max, 'upgrade-lamp'), max);
  const third = growAction(growAction(max, 'harvest', 300000), 'plant', 400000);
  assert.equal(growDuration(third), 80000);
  assert.equal(growYield(third), 9);
});
