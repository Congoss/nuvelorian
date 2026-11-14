import test from 'node:test';
import assert from 'node:assert/strict';
import { canSpendTutorialEnergyOnMission, FIRST_QUEST_TUTORIAL_ENERGY, getQuestTutorialRecoveryStep, isNewbieTutorialActive, resolveTutorialStep } from '../src/lib/tutorialProgress.js';
import { getPendingCARankRewards } from '../src/lib/caRankRewards.js';

test('CA rewards accumulate during tutorial and remain pending after completion and reload', () => {
  const profile = { id: 'newbie', stat_strength: 1000000, tutorial_step: 'quest-sector', ca_rank_rewards_claimed: [2] };
  const pending = getPendingCARankRewards(profile);
  assert.ok(pending.length > 0);
  assert.equal(isNewbieTutorialActive(profile), true);
  assert.equal(isNewbieTutorialActive({ ...profile, tutorial_step: 'level-eight' }), true);
  const completed = { ...profile, tutorial_level_eight_reward_claimed: true };
  assert.equal(isNewbieTutorialActive(completed), false);
  assert.deepEqual(getPendingCARankRewards(completed), pending);
  const reloaded = JSON.parse(JSON.stringify(completed));
  assert.equal(isNewbieTutorialActive(reloaded), false);
  assert.deepEqual(getPendingCARankRewards(reloaded), pending);
  assert.deepEqual(profile.ca_rank_rewards_claimed, [2]);
});

test('admin-disabled tutorial permits pending CA reward popups', () => {
  assert.equal(isNewbieTutorialActive({ id: 'player', tutorial_disabled: true }), false);
  assert.equal(isNewbieTutorialActive(null), false);
});

test('legacy skip state resumes at the welcome step', () => {
  assert.equal(resolveTutorialStep('context-done', { level: 1 }), 'welcome');
  assert.equal(resolveTutorialStep('context-done', { level: 14 }), 'welcome');
  assert.equal(resolveTutorialStep('context-done', { level: 15 }), 'completed');
  assert.equal(resolveTutorialStep('welcome'), 'welcome');
  assert.equal(resolveTutorialStep('unknown-step'), null);
});

test('quest tutorial returns to location selection when only the planet picker is visible', () => {
  assert.equal(getQuestTutorialRecoveryStep({ questRowCount: 0, hasLocationPicker: true }), 'task-location');
  assert.equal(getQuestTutorialRecoveryStep({ questRowCount: 3, hasLocationPicker: true }), 'task-location');
  assert.equal(getQuestTutorialRecoveryStep({ questRowCount: 0, hasLocationPicker: false }), null);
  assert.equal(getQuestTutorialRecoveryStep({ questRowCount: 7, hasLocationPicker: true }), null);
  assert.equal(getQuestTutorialRecoveryStep({ questRowCount: 7, hasLocationPicker: false }), 'quest-sector');
});

test('first tutorial quest cycle reserves 231 energy and only permits the highlighted mission in order', () => {
  assert.equal(FIRST_QUEST_TUTORIAL_ENERGY, 231);
  const profile = { tutorial_step: 'quest-sector', task_completions: {} };
  assert.equal(canSpendTutorialEnergyOnMission(profile, 'p4-u00-scout'), true);
  assert.equal(canSpendTutorialEnergyOnMission(profile, 'p4-u01-scout'), false);
  assert.equal(canSpendTutorialEnergyOnMission(profile, 'p4-u00-loot'), false);
  assert.equal(canSpendTutorialEnergyOnMission({ ...profile, tutorial_step: 'task-location' }, 'p4-u00-scout'), false);
  assert.equal(canSpendTutorialEnergyOnMission({ tutorial_step: 'completed' }, 'p4-u01-scout'), true);
  assert.equal(canSpendTutorialEnergyOnMission({ ...profile, task_completions: { 'p4-u00-scout': 4 } }, 'p4-u00-loot'), true);
  assert.equal(canSpendTutorialEnergyOnMission({ ...profile, task_completions: { 'p4-u00-scout': 4 } }, 'p4-u00-scout'), false);
});
