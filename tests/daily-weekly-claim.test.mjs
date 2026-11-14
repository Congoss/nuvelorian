import test from 'node:test';
import assert from 'node:assert/strict';
import { getDayTasks, WEEKLY_BONUSES } from '../src/lib/questNotifications.js';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { getGlobalWeekMeta } from '../server/utils/globalWeeklyCycle.js';

test('weekly bonus is granted only after Claim Day records the final full day', () => {
  const meta = getGlobalWeekMeta();
  const day = meta.currentDayIndex;
  const player = {
    level: 3,
    tentacles: 0,
    energy: 0,
    currentWeekKey: meta.currentWeekKey,
    daily_event_week: meta.currentWeekKey,
    daily_event: {
      fullDays: Array.from({ length: day - 1 }, (_, index) => index + 1),
      claimedRewards: { [day]: getDayTasks(day).map((task) => task.id) },
      claimedBonuses: [3, 5],
    },
  };

  const action = { type: 'daily-bonus', fullDays: 7 };
  if (day < 7) {
    assert.throws(() => applyPlayerAction(player, action), { code: 'DAILY_BONUS_UNAVAILABLE' });
    return;
  }

  assert.throws(() => applyPlayerAction(player, action), { code: 'DAILY_BONUS_UNAVAILABLE' });
  assert.equal(player.tentacles, 0);
  applyPlayerAction(player, { type: 'daily-day', day });
  const result = applyPlayerAction(player, action);
  assert.deepEqual(result.reward, WEEKLY_BONUSES.find((bonus) => bonus.fullDays === 7).reward);
  assert.equal(player.tentacles, 60000);
  assert.equal(player.energy, 200);
  assert.throws(() => applyPlayerAction(player, action), { code: 'DAILY_BONUS_UNAVAILABLE' });
});
