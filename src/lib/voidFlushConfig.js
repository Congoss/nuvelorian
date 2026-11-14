export const VOID_FLUSH_CONFIG = Object.freeze({
  event: {
    startsAt: '2026-10-11T00:00:00+03:00',
    endsAt: '2026-10-18T23:59:59+03:00',
  },
  rates: { tentaclesPerAp: 20000, tPapePerAp: 1 },
  demoPlayer: { tentacles: 2385000, tPape: 7, ap: 0, rank: null, testTentaclesGranted: true },
  server: { totalAp: 184200, levels: [0, 100000, 250000, 500000, 1000000, 2000000] },
  milestones: [
    { ap: 10, reward: { uk: 'Малий яд ×2', ru: 'Малый яд ×2', en: 'Small poison ×2' }, icon: 'small-poison' },
    { ap: 25, reward: { uk: 'Енергія ×50', ru: 'Энергия ×50', en: 'Energy ×50' }, icon: 'energy' },
    { ap: 50, reward: { uk: 'Середній яд ×1', ru: 'Средний яд ×1', en: 'Medium poison ×1' }, icon: 'medium-poison' },
    { ap: 100, reward: { uk: 'Великий яд ×1', ru: 'Большой яд ×1', en: 'Large poison ×1' }, icon: 'large-poison' },
  ],
  marketRefreshHour: 0,
  market: [
    { id: 'energy', icon: 'energy', name: { uk: 'Енергія ×50', ru: 'Энергия ×50', en: 'Energy ×50' }, price: 30000, limit: 2, status: 'available' },
    { id: 'small-poison', icon: 'small-poison', name: { uk: 'Малий яд ×3', ru: 'Малый яд ×3', en: 'Small poison ×3' }, price: 45000, limit: 1, status: 'available' },
    { id: 'free-spin', icon: 'free-spin', name: { uk: 'Прокрут рулетки ×1', ru: 'Прокрут рулетки ×1', en: 'Roulette spin ×1' }, price: 70000, limit: 1, status: 'locked', unlockLevel: 4 },
  ],
  leaderboardRewards: [
    { from: 1, to: 1, reward: { uk: 'Telegram Gift · корона · пет · набір', ru: 'Telegram Gift · корона · пет · набор', en: 'Telegram Gift · crown · pet · set' } },
    { from: 2, to: 2, reward: { uk: 'Telegram Gift · корона · набір', ru: 'Telegram Gift · корона · набор', en: 'Telegram Gift · crown · set' } },
    { from: 3, to: 3, reward: { uk: 'Telegram Gift · корона · набір', ru: 'Telegram Gift · корона · набор', en: 'Telegram Gift · crown · set' } },
    { from: 4, to: 5, reward: { uk: 'Telegram Gift · ігровий набір', ru: 'Telegram Gift · игровой набор', en: 'Telegram Gift · game bundle' } },
    { from: 6, to: 10, reward: { uk: '100 Telegram Stars · набір', ru: '100 Telegram Stars · набор', en: '100 Telegram Stars · bundle' } },
    { from: 11, to: 20, reward: { uk: '50 Telegram Stars · набір', ru: '50 Telegram Stars · набор', en: '50 Telegram Stars · bundle' } },
    { from: 21, to: 100, reward: { uk: 'Ігровий набір', ru: 'Игровой набор', en: 'Game bundle' } },
  ],
  leaderboard: [
    { id: 'rookyl', title: 'Rookyl', clan: 'VOID RUNNERS', ap: 842 },
    { id: 'mothbyte', title: 'MothByte', clan: 'COSMIC SLUDGE', ap: 719 },
    { id: 'toxicnova', title: 'ToxicNova', clan: 'NO SIGNAL', ap: 603 },
    { id: 'garbageking', title: 'GarbageKing', clan: 'VOID RUNNERS', ap: 488 },
    { id: 'p4pilot', title: 'P4_Pilot_0123456789', clan: 'SOUP CLUB', ap: 376 },
    { id: 'nobody', title: 'NobodyAtHome', clan: 'NO SIGNAL', ap: 291 },
    { id: 'spaceflush', title: 'SpaceFlush', clan: 'SOUP CLUB', ap: 205 },
  ],
});

export function normalizeFlushAmount(value, balance, step) {
  const numericValue = Math.max(0, Math.floor(Number(value) || 0));
  const numericBalance = Math.max(0, Math.floor(Number(balance) || 0));
  const numericStep = Math.max(1, Math.floor(Number(step) || 1));
  return Math.min(numericBalance - (numericBalance % numericStep), numericValue - (numericValue % numericStep));
}

export function getFlushAp(tentacles, tPape, rates = VOID_FLUSH_CONFIG.rates) {
  const tentaclesAp = Math.floor(Math.max(0, Number(tentacles) || 0) / rates.tentaclesPerAp);
  const tPapeAp = Math.floor(Math.max(0, Number(tPape) || 0) / rates.tPapePerAp);
  return tentaclesAp + tPapeAp;
}

export function getServerProgress(totalAp, levels = VOID_FLUSH_CONFIG.server.levels) {
  const value = Math.max(0, Number(totalAp) || 0);
  let levelIndex = 0;
  for (let index = 1; index < levels.length; index += 1) {
    if (value >= levels[index]) levelIndex = index;
    else break;
  }
  const currentThreshold = levels[levelIndex] || 0;
  const nextThreshold = levels[levelIndex + 1] ?? currentThreshold;
  const progress = nextThreshold > currentThreshold
    ? Math.min(100, ((value - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;
  return { level: levelIndex + 1, current: Math.max(0, value - currentThreshold), required: Math.max(0, nextThreshold - currentThreshold), percent: progress };
}

export function getLeaderboardReward(rank, rewards = VOID_FLUSH_CONFIG.leaderboardRewards) {
  return rewards.find((item) => rank >= item.from && rank <= item.to)?.reward || null;
}
