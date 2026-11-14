import { getNewbieProgress } from './newbieQuest.js';

export const DAY_COUNT = 7;
export const DAILY_UNLOCK_LEVEL = 3;

function localizeCopy(copy, lang = 'en') {
  if (!copy || typeof copy !== 'object') return copy || '';
  return copy[lang] || copy.uk || copy.en || copy.ru || '';
}

function getStarterFragmentsProgress(profile) {
  const numericCandidates = [
    profile?.starter_set_fragments,
    profile?.starter_set_fragment,
    profile?.starter_fragments,
    profile?.set_fragments,
    profile?.starterFragments,
  ].map((v) => Number(v) || 0);

  const fromCollection = Object.entries(profile?.collection_item_counts || {}).reduce((sum, [key, value]) => {
    return /starter|fragment|set/i.test(String(key || '')) ? sum + (Number(value) || 0) : sum;
  }, 0);
  const fromInventory = (profile?.inventory_items || []).reduce((sum, item) => {
    const haystack = `${item?.id || ''} ${item?.name || ''}`.toLowerCase();
    return /(starter|fragment|set)/i.test(haystack) ? sum + (Number(item?.count) || 1) : sum;
  }, 0);
  const fromBossGear = Object.values(profile?.boss_gear_fragments || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return Math.max(fromCollection, fromInventory, fromBossGear, ...numericCandidates);
}

const TASK_METRICS = {
  checkin: (profile) => (profile?.daily_event_last_claim === profile?.currentDateKey ? 1 : 0),
  spendEnergy: (profile) => profile?.energy_spent_today || 0,
  missions: (profile) => profile?.total_tasks_today || 0,
  artifacts: (profile) => Object.values(profile?.collection_item_counts || {}).reduce((sum, v) => sum + (Number(v) || 0), 0),
  bossHits: (profile) => profile?.boss_hits_today || 0,
  bossDamage: (profile) => profile?.boss_damage_today || profile?.boss_damage_week || 0,
  boxes: (profile) => profile?.opened_boxes_total || 0,
  poisonUse: (profile) => Math.max(profile?.newbie_stats?.small_poison_uses || 0, profile?.poison_found_today || 0),
  setFragments: (profile) => getStarterFragmentsProgress(profile),
  // Day 5 used to require starter-set fragments. Retain that progress for
  // existing players while new players can always complete it through boss hits.
  bossHitsOrStarterFragments: (profile) => Math.max(profile?.boss_hits_today || 0, getStarterFragmentsProgress(profile)),
  raidBoss: (profile) => profile?.raid_boss_hits_today || 0,
};

const DAY_TASKS_BY_DAY = {
  1: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 30, title: { uk: 'Витрать 30 енергії на місії', en: 'Spend 30 energy on missions', ru: 'Потрать 30 энергии на миссии' } },
    { key: 'missions', goal: 5, title: { uk: 'Заверши 5 місій', en: 'Complete 5 missions', ru: 'Заверши 5 миссий' } },
    { key: 'artifacts', goal: 1, title: { uk: 'Збери 1 артефакт', en: 'Collect 1 artifact', ru: 'Собери 1 артефакт' } },
    { key: 'bossHits', goal: 3, title: { uk: 'Вдар першого боса 3 рази', en: 'Hit the first boss 3 times', ru: 'Ударь первого босса 3 раза' } },
    { key: 'boxes', goal: 1, title: { uk: 'Відкрий 1 Standard Boss Box', en: 'Open 1 Standard Boss Box', ru: 'Открой 1 Standard Boss Box' } },
  ],
  2: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 60, title: { uk: 'Витрать 60 енергії', en: 'Spend 60 energy', ru: 'Потрать 60 энергии' } },
    { key: 'missions', goal: 10, title: { uk: 'Заверши 10 місій', en: 'Complete 10 missions', ru: 'Заверши 10 миссий' } },
    { key: 'artifacts', goal: 2, title: { uk: 'Збери 2 артефакти', en: 'Collect 2 artifacts', ru: 'Собери 2 артефакта' } },
    { key: 'bossDamage', goal: 300, title: { uk: 'Нанеси 300 шкоди босу', en: 'Deal 300 damage to a boss', ru: 'Нанеси 300 урона боссу' } },
    { key: 'poisonUse', goal: 1, title: { uk: 'Використай 1 Poison', en: 'Use 1 Poison', ru: 'Используй 1 Poison' } },
    { key: 'bossDamage', goal: 1000, title: { uk: 'Нанеси 1000 шкоди босам', en: 'Deal 1,000 damage to bosses', ru: 'Нанеси 1 000 урона боссам' } },
  ],
  3: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 90, title: { uk: 'Витрать 90 енергії', en: 'Spend 90 energy', ru: 'Потрать 90 энергии' } },
    { key: 'missions', goal: 15, title: { uk: 'Заверши 15 місій', en: 'Complete 15 missions', ru: 'Заверши 15 миссий' } },
    { key: 'artifacts', goal: 3, title: { uk: 'Збери 3 артефакти', en: 'Collect 3 artifacts', ru: 'Собери 3 артефакта' } },
    { key: 'bossDamage', goal: 700, title: { uk: 'Нанеси 700 шкоди босам', en: 'Deal 700 damage to bosses', ru: 'Нанеси 700 урона боссам' } },
    { key: 'boxes', goal: 2, title: { uk: 'Відкрий 2 бокси', en: 'Open 2 boxes', ru: 'Открой 2 бокса' } },
    { key: 'bossHits', goal: 4, title: { uk: 'Допоможи добити першого боса', en: 'Help defeat the first boss', ru: 'Помоги добить первого босса' } },
  ],
  4: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 120, title: { uk: 'Витрать 120 енергії', en: 'Spend 120 energy', ru: 'Потрать 120 энергии' } },
    { key: 'missions', goal: 20, title: { uk: 'Заверши 20 місій', en: 'Complete 20 missions', ru: 'Заверши 20 миссий' } },
    { key: 'artifacts', goal: 4, title: { uk: 'Збери 4 артефакти', en: 'Collect 4 artifacts', ru: 'Собери 4 артефакта' } },
    { key: 'bossDamage', goal: 1200, title: { uk: 'Нанеси 1200 шкоди босам', en: 'Deal 1200 damage to bosses', ru: 'Нанеси 1200 урона боссам' } },
    { key: 'poisonUse', goal: 2, title: { uk: 'Використай 2 предметні скіли', en: 'Use 2 item skills', ru: 'Используй 2 предметных скилла' } },
    { key: 'boxes', goal: 3, title: { uk: 'Відкрий 3 бокси', en: 'Open 3 boxes', ru: 'Открой 3 бокса' } },
  ],
  5: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 150, title: { uk: 'Витрать 150 енергії', en: 'Spend 150 energy', ru: 'Потрать 150 энергии' } },
    { key: 'missions', goal: 25, title: { uk: 'Заверши 25 місій', en: 'Complete 25 missions', ru: 'Заверши 25 миссий' } },
    { key: 'artifacts', goal: 5, title: { uk: 'Збери 5 артефактів', en: 'Collect 5 artifacts', ru: 'Собери 5 артефактов' } },
    { key: 'bossDamage', goal: 2000, title: { uk: 'Нанеси 2000 шкоди босам', en: 'Deal 2000 damage to bosses', ru: 'Нанеси 2000 урона боссам' } },
    { key: 'boxes', goal: 1, title: { uk: 'Відкрий 1 Damage Box', en: 'Open 1 Damage Box', ru: 'Открой 1 Damage Box' } },
    { id: 'setFragments', key: 'bossHitsOrStarterFragments', goal: 2, title: { uk: 'Вдар боса 2 рази', en: 'Hit a boss 2 times', ru: 'Ударь босса 2 раза' } },
  ],
  6: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 180, title: { uk: 'Витрать 180 енергії', en: 'Spend 180 energy', ru: 'Потрать 180 энергии' } },
    { key: 'missions', goal: 30, title: { uk: 'Заверши 30 місій', en: 'Complete 30 missions', ru: 'Заверши 30 миссий' } },
    { key: 'artifacts', goal: 6, title: { uk: 'Збери 6 артефактів', en: 'Collect 6 artifacts', ru: 'Собери 6 артефактов' } },
    { key: 'bossDamage', goal: 3000, title: { uk: 'Нанеси 3000 шкоди босам', en: 'Deal 3000 damage to bosses', ru: 'Нанеси 3000 урона боссам' } },
    { key: 'raidBoss', goal: 1, title: { uk: 'Візьми участь у серверному рейдбосі', en: 'Join the server raid boss', ru: 'Прими участие в серверном рейдбоссе' } },
    { key: 'boxes', goal: 4, title: { uk: 'Відкрий 4 бокси', en: 'Open 4 boxes', ru: 'Открой 4 бокса' } },
  ],
  7: [
    { key: 'checkin', goal: 1, title: { uk: 'Check-in', en: 'Check-in', ru: 'Check-in' } },
    { key: 'spendEnergy', goal: 220, title: { uk: 'Витрать 220 енергії', en: 'Spend 220 energy', ru: 'Потрать 220 энергии' } },
    { key: 'missions', goal: 35, title: { uk: 'Заверши 35 місій', en: 'Complete 35 missions', ru: 'Заверши 35 миссий' } },
    { key: 'artifacts', goal: 7, title: { uk: 'Збери 7 артефактів', en: 'Collect 7 artifacts', ru: 'Собери 7 артефактов' } },
    { key: 'bossDamage', goal: 5000, title: { uk: 'Нанеси 5000 шкоди босам', en: 'Deal 5000 damage to bosses', ru: 'Нанеси 5000 урона боссам' } },
    { key: 'raidBoss', goal: 1, title: { uk: 'Візьми участь у рейдбосі', en: 'Join the raid boss', ru: 'Прими участие в рейдбоссе' } },
    { key: 'boxes', goal: 5, title: { uk: 'Відкрий 5 боксів', en: 'Open 5 boxes', ru: 'Открой 5 боксов' } },
  ],
};

export const WEEKLY_BONUSES = [
  { fullDays: 3, reward: { tentacles: 15000, energy: 50, small: 2 }, label: 'Starter Toxic Pack' },
  { fullDays: 5, reward: { tentacles: 30000, energy: 100, small: 3, medium: 1 }, label: 'Toxic Pack' },
  { fullDays: 7, reward: { tentacles: 60000, energy: 200, small: 5, medium: 3, large: 1, freeSpins: 1 }, label: 'Mega Toxic Pack' },
];

export function getDayTasks(day, language = 'uk') {
  const plan = DAY_TASKS_BY_DAY[day] || DAY_TASKS_BY_DAY[1];
  return plan.map((item, index) => ({
    id: `day-${day}-${item.id || item.key}-${index + 1}`,
    baseId: item.key,
    title: localizeCopy(item.title, language),
    goal: item.goal,
    xp: 5,
    tentacles: 10,
    energyBonus: 20,
    dayLocked: item.key === 'checkin',
    progress: (profile) => (TASK_METRICS[item.key] ? TASK_METRICS[item.key](profile) : 0),
  }));
}

export function captureDailyTaskProgress(profile, meta) {
  const current = Object.fromEntries(Object.entries(TASK_METRICS).filter(([key]) => key !== 'checkin').map(([key, read]) => [key, Math.max(0, Number(read(profile)) || 0)]));
  let state = profile.daily_task_progress;
  if (state?.week === meta.currentWeekKey && state.date === meta.currentDateKey && Object.entries(current).every(([key, value]) => value === state.last?.[key])) return;
  if (!state || state.week !== meta.currentWeekKey) {
    const migrated = !state;
    state = { week: meta.currentWeekKey, date: meta.currentDateKey, last: migrated ? Object.fromEntries(Object.keys(current).map(key => [key, 0])) : current, days: {} };
  } else if (state.date !== meta.currentDateKey) {
    state = { ...state, date: meta.currentDateKey, last: current };
  }
  const values = Object.fromEntries(Object.entries(current).map(([key, value]) => [key, Number(state.days?.[meta.currentDayIndex]?.[key] || 0) + Math.max(0, value - (state.last[key] || 0))]));
  profile.daily_task_progress = { ...state, last: current, days: { ...state.days, [meta.currentDayIndex]: values } };
}

export function getTaskState(profile, task, day, currentDay, claimedTasks) {
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const history = safeProfile.daily_task_progress;
  const historyObject = history && typeof history === 'object' ? history : null;
  const historyDays = historyObject?.days && typeof historyObject.days === 'object' && !Array.isArray(historyObject.days) ? historyObject.days : {};
  const hasCurrentWeekHistory = Boolean(historyObject && historyObject.week && safeProfile.currentWeekKey && historyObject.week === safeProfile.currentWeekKey);
  const stored = hasCurrentWeekHistory ? historyDays[day] : null;
  const hasStoredProgress = stored && Object.prototype.hasOwnProperty.call(stored, task.baseId);
  const weekEnergySpent = task.baseId === 'spendEnergy' && hasCurrentWeekHistory
    ? Object.entries(historyDays).reduce((sum, [progressDay, metrics]) => Number(progressDay) <= currentDay ? sum + Math.max(0, Number(metrics?.spendEnergy) || 0) : sum, 0)
    : 0;
  const raw = task.baseId === 'checkin'
    ? (day === currentDay ? task.progress(safeProfile) : 0)
    : task.baseId === 'spendEnergy' && day <= currentDay && hasCurrentWeekHistory
      ? weekEnergySpent
    : hasStoredProgress
      ? stored[task.baseId]
        : day <= currentDay ? task.progress(safeProfile) : 0;
  const current = Math.min(Math.max(raw || 0, 0), task.goal);
  const complete = current >= task.goal;
  const claimed = claimedTasks.includes(task.id);
  const canClaimCheckin = task.baseId === 'checkin' && (day >= 1 && day <= currentDay) && !claimed;
  return {
    ...task,
    current,
    complete: complete || claimed,
    claimed,
    claimable: (complete || canClaimCheckin) && !claimed,
    progressPct: Math.round((current / task.goal) * 100),
  };
}


export function getQuestRewardNotifications(profile) {
  const currentDay = Math.max(1, Math.min(DAY_COUNT, Number(profile?.currentDayIndex || 1)));
  const weekKey = profile?.currentWeekKey || '';
  const dailyState = profile?.daily_event_week === weekKey ? profile?.daily_event || {} : {};
  const fullDays = Array.isArray(dailyState.fullDays) ? dailyState.fullDays : [];
  const claimedBonuses = Array.isArray(dailyState.claimedBonuses) ? dailyState.claimedBonuses : [];
  const completeDays = new Set(fullDays);
  let daily = false;

  if (Number(profile?.level ?? profile?.player_level ?? profile?.lvl ?? 1) >= DAILY_UNLOCK_LEVEL) {
    for (let day = 1; day <= currentDay; day += 1) {
      const claimed = dailyState.claimedRewards?.[day] || [];
      const tasks = getDayTasks(day).map((task) => getTaskState(profile, task, day, currentDay, claimed));
      if (tasks.some((task) => task.claimable)) daily = true;
      // Completing tasks alone is not a recorded full day; Claim Day must be
      // collected before this day can unlock a weekly bonus.
      if (!fullDays.includes(day) && tasks.every((task) => task.complete && task.claimed)) daily = true;
    }
    if (WEEKLY_BONUSES.some((bonus) => completeDays.size >= bonus.fullDays && !claimedBonuses.includes(bonus.fullDays))) daily = true;
  }

  const { activePart, activeQuest } = getNewbieProgress(profile);
  const newbie = Boolean(
    (activeQuest?.done && !activeQuest.claimed) ||
    (activePart?.allClaimed && !activePart.partClaimed)
  );
  const extra = false;
  return { daily, newbie, extra, any: daily || newbie || extra };
}
