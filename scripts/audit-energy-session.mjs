import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { GAME_CONFIG, calculateEnergy } from '../src/lib/gameConfig.js';
import { calculateBossReward, getBossDailyRewardState, getStandardBossRewardFund } from '../src/lib/bossRewardSystem.js';
import { getDayTasks, getDailyCompletionReward, WEEKLY_BONUSES } from '../src/lib/questNotifications.js';
import { ROULETTE_REWARD_DEFS } from '../src/lib/rouletteRewards.js';
import { normalizePlayerProgression } from '../server/utils/progression.js';

// Pure configuration audit. Does not load the store, contact a database, or grant rewards.
const weight = ROULETTE_REWARD_DEFS.reduce((sum, item) => sum + item.weight, 0);
const energyPerSpin = ROULETTE_REWARD_DEFS.reduce((sum, item) => sum + (item.type === 'energy' ? item.amount * item.weight : 0), 0) / weight;
const daily = Array.from({ length: 7 }, (_, i) => {
  const day = i + 1, tasks = getDayTasks(day);
  return { day, tasks: tasks.length, taskEnergy: tasks.reduce((sum, task) => sum + task.energyBonus, 0), completionEnergy: getDailyCompletionReward(day).energy, freeSpins: tasks.length, expectedSpinEnergy: tasks.length * energyPerSpin, spendGoal: tasks.find(task => task.baseId === 'spendEnergy')?.goal || 0 };
}).map(row => ({ ...row, grossEnergy: row.taskEnergy + row.completionEnergy + row.expectedSpinEnergy }));
const bosses = GAME_CONFIG.BOSSES.map(boss => {
  const scenarios = [1, 11, 91].map(dailyKillNumber => {
    const reward = calculateBossReward({ bossId: boss.id, maxHp: boss.maxHp, actualDamageTotal: boss.maxHp, rank: 1, dailyKillNumber, availableSpecials: [], rng: () => .5 });
    return { dailyKillNumber, energy: reward.drops.filter(drop => drop.type === 'energy').reduce((sum, drop) => sum + drop.qty, 0) };
  });
  return { id: boss.id, hp: boss.maxHp, fundEnergy: ['heli', 'tank'].includes(boss.id) ? (boss.id === 'heli' ? 50 : 300) : getStandardBossRewardFund(boss.maxHp).energy, soloRank1Scenarios: scenarios };
});
const player = { id: 'energy-audit', level: 20, xp: 0, energy: 100, max_energy: 100, talent_tree_version: 2, talent_levels: {}, task_completions: {} };
const first = normalizePlayerProgression(structuredClone(player));
const second = normalizePlayerProgression(structuredClone(first));
const stablePlayer = { ...player, talent_base_max_energy: 100 };
const stableFirst = normalizePlayerProgression(structuredClone(stablePlayer));
const stableSecond = normalizePlayerProgression(structuredClone(stableFirst));
assert.equal(stableFirst.max_energy, stableSecond.max_energy);
assert.equal(calculateEnergy(new Date(Date.now() - 3600000).toISOString(), 500, 100, 2), 500);
assert.equal(getBossDailyRewardState({}, 'boss8', Date.now(), 99).multiplier, 1);
assert.equal(getBossDailyRewardState({ day: new Date().toISOString().slice(0, 10), counts: { boss8: 90 } }, 'boss8', Date.now(), 100).multiplier, .1);
const report = {
  auditDate: '2026-11-03', scope: 'Local source defaults only; no production telemetry or admin reward overrides.',
  passiveRegenPerMinute: GAME_CONFIG.ENERGY_REGEN_PER_MIN,
  roulette: { energyPerSpin, probability: 40 / weight }, daily,
  fullWeek: { taskAndCompletionEnergy: daily.reduce((sum, row) => sum + row.taskEnergy + row.completionEnergy, 0), milestoneEnergy: WEEKLY_BONUSES.reduce((sum, row) => sum + row.reward.energy, 0), expectedSpinEnergy: daily.reduce((sum, row) => sum + row.expectedSpinEnergy, 0) },
  bosses,
  legacyCapacity: { withMissingBase: [first.max_energy, second.max_energy], withExplicitBase: [stableFirst.max_energy, stableSecond.max_energy] },
};
const rows = bosses.map(boss => `| ${boss.id} | ${boss.hp.toLocaleString('en-US')} | ${boss.soloRank1Scenarios.map(s => s.energy.toLocaleString('en-US')).join(' | ')} |`).join('\n');
const text = `# Аудит енергії · 2026-11-03

Обсяг: локальні вихідні конфігурації, без production-даних і можливих адмінських перевизначень. Баланс не змінено. Час сесії без журналу дій гравця оцінити точно неможливо.

## Чому енергія не закінчується

1. Енергетичні нагороди додаються понад max_energy. Ліміт обмежує лише пасивне відновлення; запас 500/100 залишається 500. Джерела: server/app.js: grantEnergyGain; server/utils/playerActions.js: addReward; server/utils/battlePass.js: claimBattlePassReward; src/lib/gameConfig.js: calculateEnergy.
2. Кожне денне завдання дає 20 енергії та безкоштовний спін. Рулетка повертає в середньому ${energyPerSpin} енергії/спін (40% шанс на 50). За повний перший день із ${daily[0].tasks} завданнями: ${daily[0].taskEnergy} + ${daily[0].completionEnergy} за всі завдання + очікувані ${daily[0].expectedSpinEnergy} зі спінів = ${daily[0].grossEnergy} енергії. Інші дні з ${daily[1].tasks} завданнями: очікувані ${daily[1].grossEnergy}. Це валове надходження, без віднімання витрат на виконання всіх умов; результат рулетки не гарантований. Джерела: src/lib/questNotifications.js; src/lib/rouletteRewards.js; server/utils/playerActions.js (daily-task).
3. За всі 7 днів: ${report.fullWeek.taskAndCompletionEnergy} енергії із завдань і завершення днів + ${report.fullWeek.milestoneEnergy} тижневих бонусів + очікувані ${report.fullWeek.expectedSpinEnergy} зі спінів. Не враховано босів, ранги CA, сезонний пропуск, магазин, риболовлю, стартові нагороди, клан і соціальні дії.
4. Базові атаки Пальцем/Олівцем не мають енергетичної ціни, але босові коробки видають енергію. Це конверсія часу, ключів і/або отрут в енергію, а не замкнений безкоштовний нескінченний цикл. Перші 100 перемог по кожному стандартному босу йдуть без щоденного зменшення; після золотої медалі множник поступово падає до 10%, але не до нуля. Джерела: src/lib/gameConfig.js WEAPONS; src/lib/bossRewardSystem.js; server/app.js boss attacks/box opening.

## Босові нагороди: порівнювані сценарії

Ранг 1, 100% HP завдано одним гравцем, rng=0.5, базовий конфіг, без стартових/спеціальних нагород. У кооперативі фонд розподіляється за часткою шкоди; ці цифри не видаються кожному учаснику. Стовпці 11/91 описують вже активний щоденний лічильник після 100 довічних перемог.

| Бос | HP | 1-й за день | 11-й | 91-й |
|---|---:|---:|---:|---:|
${rows}

## Окремий дефект сумісності

normalizePlayerProgression для legacy-профілю рівня 20 без talent_base_max_energy неідемпотентний: max_energy ${first.max_energy} → ${second.max_energy} при повторній нормалізації. Із явно заданою базою 100: ${stableFirst.max_energy} → ${stableSecond.max_energy}. Це ризик росту місткості в старих профілях; не доказ того, що саме цей гравець зачеплений. Джерела: server/utils/progression.js; src/lib/talents.js. Потрібна перевірка на знеособленій вибірці production-профілів перед міграцією.

## Рекомендації для коротших сесій

- Спочатку додати зведення «отримано / витрачено енергії за сесію» з розбивкою джерел і часовими інтервалами. Перевірити distribution тривалості сесій, переповнення, кількості відкритих коробок.
- Прибрати тиск переповнення: окремий запас нагород або явний текст, що надлишок не зникає й гру можна закрити. Не обрізати вже накопичену енергію.
- Перерахувати одночасні нагороди денних завдань + фіналу + спінів як один бюджет; окремо перевірити босову конверсію. Зміни розмірів нагород потребують погодженого цільового часу сесії.
- Виправлення legacy-місткості робити окремо після перевірки даних. Аудит нічого не мігрує.
`;
await mkdir(new URL('../.local/audits/', import.meta.url), { recursive: true });
await writeFile(new URL('../.local/audits/energy-session-2026-11-03.json', import.meta.url), JSON.stringify(report, null, 2));
await writeFile(new URL('../ENERGY_AUDIT_2026-11-03.md', import.meta.url), text);
console.log(JSON.stringify({ dailyGross: daily.map(row => row.grossEnergy), ...report.fullWeek, legacyCapacity: report.legacyCapacity, bosses: bosses.length }, null, 2));
