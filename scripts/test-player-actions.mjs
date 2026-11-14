import assert from 'node:assert/strict';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { getGlobalWeekMeta } from '../server/utils/globalWeeklyCycle.js';
import { getDayTasks } from '../src/lib/questNotifications.js';

const player = { id: 'test', level: 3, energy: 10, max_energy: 100, tentacles: 0, xp: 0, weapon_inventory: {} };
const day = getGlobalWeekMeta().currentDayIndex;
const task = getDayTasks(day).find((entry) => entry.baseId === 'checkin');
assert.ok(task);
applyPlayerAction(player, { type: 'daily-task', day, taskId: task.id });
assert.equal(player.energy, 30);

applyPlayerAction(player, { type: 'newbie-quest', questId: 1 });
assert.deepEqual(player.newbie_claimed_quests, [1]);
assert.throws(() => applyPlayerAction(player, { type: 'newbie-quest', questId: 1 }), { code: 'NEWBIE_QUEST_UNAVAILABLE' });
applyPlayerAction(player, { type: 'newbie-visit', target: 'hero' });
assert.equal(player.newbie_stats.hero_views, 1);

const tutorialPlayer = { id: 'tutorial', level: 8, energy: 0, max_energy: 100 };
applyPlayerAction(tutorialPlayer, { type: 'tutorial-final' });
assert.equal(tutorialPlayer.energy, 100);
assert.equal(tutorialPlayer.tutorial_level_eight_reward_claimed, true);
assert.throws(() => applyPlayerAction(tutorialPlayer, { type: 'tutorial-final' }), { code: 'TUTORIAL_ALREADY_CLAIMED' });

const shopper = { energy: 0, max_energy: 100, tentacles: 4000, premium: 30 };
applyPlayerAction(shopper, { type: 'shop-energy', itemId: 'energy_25' });
assert.equal(shopper.energy, 25);
assert.equal(shopper.tentacles, 2000);
assert.equal(shopper.shop_daily_limits.counts.energy_25, 1);
applyPlayerAction(shopper, { type: 'shop-energy', itemId: 'energy_full' });
assert.equal(shopper.energy, 100);
assert.equal(shopper.premium, 0);
assert.equal(player.daily_event.claimedRewards[day].length, 1);
assert.throws(() => applyPlayerAction(player, { type: 'daily-task', day, taskId: task.id }), { code: 'DAILY_TASK_UNAVAILABLE' });
assert.equal(player.energy, 30);

player.energy_spent_total = 100;
applyPlayerAction(player, { type: 'guide-step', stepId: 'spend-energy' });
assert.equal(player.energy, 55);
assert.deepEqual(player.starter_guide_claimed, ['spend-energy']);
assert.throws(() => applyPlayerAction(player, { type: 'guide-step', stepId: 'spend-energy' }), { code: 'GUIDE_STEP_UNAVAILABLE' });

player.collection_item_counts = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`p4-u00-artifact-${index + 1}`, 1]));
applyPlayerAction(player, { type: 'collection-claim', locationId: 'p4-u00' });
assert.equal(player.collection_item_counts['p4-u00-artifact-1'], 0);
assert.equal(player.weapon_inventory['small-poison'], 3);
assert.throws(() => applyPlayerAction(player, { type: 'collection-claim', locationId: 'p4-u00' }), { code: 'COLLECTION_INCOMPLETE' });

applyPlayerAction(player, { type: 'fishing-cast' });
assert.ok(player.cosmo_fishing_cycle.finishAt > Date.now());
assert.throws(() => applyPlayerAction(player, { type: 'fishing-cast' }), { code: 'FISHING_ACTIVE' });
player.cosmo_fishing_cycle.finishAt = Date.now() - 1;
applyPlayerAction(player, { type: 'fishing-resolve' });
assert.equal(player.cosmo_fishing_cycle.claimed, true);
assert.throws(() => applyPlayerAction(player, { type: 'fishing-resolve' }), { code: 'FISHING_NOT_ACTIVE' });
console.log('Player action checks passed');
