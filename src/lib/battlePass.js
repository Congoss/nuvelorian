export const BP_LEVEL_XP = 150;
export const BP_LEVELS = 50;
export const BP_MAX_XP = 9600;
export const BP_DAYS = 28;
export const BP_BOSS_DAILY_LIMIT = 3;
export function getBossVictoryXp(bossIndex) {
  if (!Number.isInteger(bossIndex) || bossIndex < 0) return 0;
  return bossIndex < 3 ? 10 : bossIndex < 6 ? 20 : 30;
}
export const BP_TRACKS = ['free', 'epic', 'legendary'];
export const BP_STAR_PRODUCTS = [
  { id: 'battle_pass_epic', tier: 'epic', title: 'Battle Pass Epic', stars: 299, usd: 2.99 },
  { id: 'battle_pass_legendary', tier: 'legendary', title: 'Battle Pass Legendary', stars: 699, usd: 6.99 },
];

const task = (id, label, metric, goal, xp) => ({ id, label, metric, goal, xp });
export const BP_TASKS = {
  daily: [
    task('login', 'Увійти в гру', 'login', 1, 12),
    task('energy', 'Витратити енергію у планетарних завданнях', 'energy', 100, 60),
    task('missions', 'Виконати планетарні завдання', 'missions', 10, 60),
    task('daily', 'Виконати завдання Daily', 'daily', 1, 48),
    task('bossKills', 'Перемогти до 3 босів', 'bossKills', BP_BOSS_DAILY_LIMIT, 0),
  ],
  weekly: [
    task('energy', 'Витратити енергію у планетарних завданнях', 'energy', 700, 180),
    task('missions', 'Виконати планетарні завдання', 'missions', 70, 180),
    task('daily', 'Виконати завдання Daily', 'daily', 5, 120),
    task('boss', 'Завдати шкоди босу', 'boss', 1, 120),
  ],
  season: [
    task('missions', 'Виконати планетарні завдання', 'missions', 100, 360),
    task('energy', 'Витратити енергію у планетарних завданнях', 'energy', 1500, 360),
    task('daily', 'Виконати завдання Daily', 'daily', 20, 360),
    task('weekly', 'Закрити тижневі завдання', 'weekly', 3, 360),
    task('dm', 'Заробити tentacles у грі (без покупок)', 'dm', 10000, 360),
    task('boss', 'Успішно атакувати босів', 'boss', 5, 360),
  ],
};

// One row per level: Free / Epic additional / Legendary additional.
const rows = [
  'large:1|large:2|large:4', 'dm:750|dm:780|dm:1560', 'energy:100|energy:125|energy:250',
  'large:1|medium:3|large:2', 'cdm:10|boots:1|legendary_boots:1', 'dm:900|dm:910|dm:1820',
  'energy:125|energy:150|energy:300', 'medium:2|large:2|large:3', 'dm:1050|cdm:20|cdm:50',
  'large:2|legs:1|legendary_legs:1', 'energy:150|energy:175|energy:350', 'cdm:15|dm:1040|dm:2080',
  'dm:1200|medium:4|large:3', 'medium:2|energy:175|energy:350', 'large:1|hands:1|legendary_hands:1',
  'energy:175|large:2|large:4', 'dm:1350|dm:1300|dm:2600', 'cdm:20|cdm:30|cdm:70',
  'medium:3|medium:5|large:3', 'large:2|armor:1|legendary_armor:1', 'energy:200|energy:225|energy:450',
  'dm:1500|dm:1560|dm:3120', 'cdm:25|large:2|large:4', 'medium:3|energy:225|energy:450',
  'large:2|head:1|legendary_head:1', 'energy:225|large:2|large:4', 'dm:1650|dm:1950|dm:3900',
  'cdm:30|cdm:40|cdm:90', 'medium:3|medium:5|large:4', 'large:2|weapon:1|legendary_weapon:1',
  'energy:250|energy:300|energy:600', 'dm:1800|dm:2210|dm:4420', 'cdm:35|large:3|large:5',
  'medium:4|energy:300|energy:600', 'large:2|ticket:3|ticket:6', 'energy:300|dm:2600|dm:5200',
  'dm:2250|medium:6|large:5', 'cdm:40|cdm:50|cdm:120', 'large:3|large:4|large:7',
  'ticket:1|epic_background:1|legendary_background:1', 'energy:350|energy:400|energy:800', 'dm:2625|dm:3250|dm:6500',
  'cdm:50|large:4|large:7', 'medium:5|medium:7|large:6', 'large:3|ticket:5|ticket:10',
  'energy:400|epic_pet:1|pet:1', 'dm:3000|large:5|large:8', 'cdm:60|cdm:70|cdm:180',
  'ticket:2|large:6|large:10', 'large:5|large:5,season_animation:1|cdm:300,exclusive_animation:1',
];
export const BP_REWARDS = rows.map((row, index) => ({
  level: index + 1,
  ...Object.fromEntries(row.split('|').map((cell, trackIndex) => [BP_TRACKS[trackIndex], cell.split(',').map((entry) => {
    const [type, amount] = entry.split(':');
    return { type, amount: Number(amount) };
  })])),
}));
export const BP_REWARD_LABELS = {
  epic_background: 'Епічний фон', legendary_background: 'Легендарний фон',
  large: 'Фляга з отрутою', medium: 'Середній яд', dm: 'tentacles', cdm: 'T-Pape', energy: 'Енергія',
  boots: 'Взуття', legs: 'Штани', hands: 'Рукавички', armor: 'Броня', head: 'Головний убір',
  epic_pet: 'Ворон алхіміка', weapon: 'Зброя', ticket: 'Квиток розіграшу', animated: 'Анімація', pet: 'Пет сезону',
  legendary_boots: 'Легендарне взуття', legendary_legs: 'Легендарні штани', legendary_hands: 'Легендарні рукавички', legendary_armor: 'Легендарна броня', legendary_head: 'Легендарний головний убір', legendary_weapon: 'Легендарна зброя', exclusive_effect: 'Ексклюзивний ефект', season_animation: 'Сезонна анімація', exclusive_animation: 'Ексклюзивна анімація',
};
export function bpTrackUnlocked(tier, track) {
  return BP_TRACKS.indexOf(track) >= 0 && BP_TRACKS.indexOf(track) <= BP_TRACKS.indexOf(tier || 'free');
}
