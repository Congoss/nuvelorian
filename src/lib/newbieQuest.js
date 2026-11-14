export const NEWBIE_PARTS = [
  {
    id: 1,
    name: 'Знайомство',
    nameI18n: { ua: 'Знайомство', en: 'Introduction', ru: 'Знакомство' },
    packKey: 'newbie_pack_1',
    packLabel: 'NEWBIE PACK I',
    packLabelI18n: { ua: 'ПАК НОВАЧКА I', en: 'NEWBIE PACK I', ru: 'ПАК НОВИЧКА I' },
    quests: [
      { id: 1, title: 'Перший вхід', titleI18n: { ua: 'Перший вхід', en: 'First Login', ru: 'Первый вход' }, desc: 'Зайди в гру', descI18n: { ua: 'Зайди в гру', en: 'Enter the game', ru: 'Зайди в игру' }, reward: { tentacles: 100 } },
      { id: 2, title: 'Забери стартовий пак', titleI18n: { ua: 'Забери стартовий пак', en: 'Claim the Starter Pack', ru: 'Забери стартовый пак' }, desc: 'Відкрий стартовий набір', descI18n: { ua: 'Відкрий стартовий набір', en: 'Open the Starter Pack', ru: 'Открой стартовый набор' }, reward: { small: 2 } },
      { id: 3, title: 'Подивись героя', titleI18n: { ua: 'Подивись героя', en: 'Check Your Hero', ru: 'Посмотри героя' }, desc: 'Відкрий екран героя', descI18n: { ua: 'Відкрий екран героя', en: 'Open the hero screen', ru: 'Открой экран героя' }, reward: { xp: 50 } },
      { id: 4, title: 'Перша місія', titleI18n: { ua: 'Перша місія', en: 'First Mission', ru: 'Первая миссия' }, desc: 'Пройди 1 місію', descI18n: { ua: 'Пройди 1 місію', en: 'Complete 1 mission', ru: 'Пройди 1 миссию' }, reward: { tentacles: 100 } },
      { id: 5, title: 'Витрать енергію', titleI18n: { ua: 'Витрать енергію', en: 'Spend Energy', ru: 'Потрать энергию' }, desc: 'Витрать 10 енергії', descI18n: { ua: 'Витрать 10 енергії', en: 'Spend 10 energy', ru: 'Потрать 10 энергии' }, reward: { xp: 50 } },
    ],
    partReward: { pack: true, tentacles: 300, small: 3, freeSpins: 1, starterSetFragments: 1 },
  },
  {
    id: 2,
    name: 'Перший бій',
    nameI18n: { ua: 'Перший бій', en: 'First Fight', ru: 'Первый бой' },
    packKey: 'newbie_pack_2',
    packLabel: 'NEWBIE PACK II',
    packLabelI18n: { ua: 'ПАК НОВАЧКА II', en: 'NEWBIE PACK II', ru: 'ПАК НОВИЧКА II' },
    quests: [
      { id: 6, title: 'Знайди боса', titleI18n: { ua: 'Знайди боса', en: 'Find the Boss', ru: 'Найди босса' }, desc: 'Відкрий Boss 1', descI18n: { ua: 'Відкрий Boss 1', en: 'Open Boss 1', ru: 'Открой Boss 1' }, reward: { small: 2 } },
      { id: 7, title: 'Перший удар', titleI18n: { ua: 'Перший удар', en: 'First Hit', ru: 'Первый удар' }, desc: 'Використай Палець 1 раз', descI18n: { ua: 'Використай Палець 1 раз', en: 'Use Finger 1 time', ru: 'Используй Палец 1 раз' }, reward: { tentacles: 100 } },
      { id: 8, title: 'Сильний удар', titleI18n: { ua: 'Сильний удар', en: 'Strong Hit', ru: 'Сильный удар' }, desc: 'Використай Олівець 1 раз', descI18n: { ua: 'Використай Олівець 1 раз', en: 'Use Pencil 1 time', ru: 'Используй Карандаш 1 раз' }, reward: { xp: 100 } },
      { id: 9, title: 'Спробуй яд', titleI18n: { ua: 'Спробуй яд', en: 'Try Poison', ru: 'Попробуй яд' }, desc: 'Використай Малий яд 1 раз', descI18n: { ua: 'Використай Малий яд 1 раз', en: 'Use Small Poison 1 time', ru: 'Используй Малый яд 1 раз' }, reward: { small: 3 } },
      { id: 10, title: 'Перший внесок', titleI18n: { ua: 'Перший внесок', en: 'First Contribution', ru: 'Первый вклад' }, desc: 'Нанеси 150 урону по Boss 1', descI18n: { ua: 'Нанеси 150 урону по Boss 1', en: 'Deal 150 damage to Boss 1', ru: 'Нанеси 150 урона по Boss 1' }, reward: { medium: 1 } },
    ],
    partReward: { pack: true, tentacles: 500, small: 4, medium: 2, xp: 150 },
  },
  {
    id: 3,
    name: 'Скриня урону',
    nameI18n: { ua: 'Скриня урону', en: 'Damage Chest', ru: 'Сундук урона' },
    packKey: 'newbie_pack_3',
    packLabel: 'NEWBIE PACK III',
    packLabelI18n: { ua: 'ПАК НОВАЧКА III', en: 'NEWBIE PACK III', ru: 'ПАК НОВИЧКА III' },
    quests: [
      { id: 11, title: 'Перший сундук', titleI18n: { ua: 'Перший сундук', en: 'First Chest', ru: 'Первый сундук' }, desc: 'Скриня урону Tier I (50 урону)', descI18n: { ua: 'Скриня урону Tier I (50 урону)', en: 'Damage Chest Tier I (50 damage)', ru: 'Сундук урона Tier I (50 урона)' }, reward: { xp: 100 } },
      { id: 12, title: 'Апгрейд сундука', titleI18n: { ua: 'Апгрейд сундука', en: 'Chest Upgrade', ru: 'Апгрейд сундука' }, desc: 'Скриня урону Tier II (150 урону)', descI18n: { ua: 'Скриня урону Tier II (150 урону)', en: 'Damage Chest Tier II (150 damage)', ru: 'Сундук урона Tier II (150 урона)' }, reward: { tentacles: 150 } },
      { id: 13, title: 'Нормальний внесок', titleI18n: { ua: 'Нормальний внесок', en: 'Solid Contribution', ru: 'Нормальный вклад' }, desc: 'Скриня урону Tier III (300 урону)', descI18n: { ua: 'Скриня урону Tier III (300 урону)', en: 'Damage Chest Tier III (300 damage)', ru: 'Сундук урона Tier III (300 урона)' }, reward: { medium: 1 } },
      { id: 14, title: 'Майже топ', titleI18n: { ua: 'Майже топ', en: 'Almost Top', ru: 'Почти топ' }, desc: 'Скриня урону Tier IV (500 урону)', descI18n: { ua: 'Скриня урону Tier IV (500 урону)', en: 'Damage Chest Tier IV (500 damage)', ru: 'Сундук урона Tier IV (500 урона)' }, reward: { freeSpins: 1 } },
      { id: 15, title: 'Жирний внесок', titleI18n: { ua: 'Жирний внесок', en: 'Big Contribution', ru: 'Жирный вклад' }, desc: 'Нанеси 600+ урону', descI18n: { ua: 'Нанеси 600+ урону', en: 'Deal 600+ damage', ru: 'Нанеси 600+ урона' }, reward: { large: 1 } },
    ],
    partReward: { pack: true, tentacles: 700, medium: 3, large: 1, freeSpins: 2 },
  },
  {
    id: 4,
    name: 'Прокачка',
    nameI18n: { ua: 'Прокачка', en: 'Upgrade', ru: 'Прокачка' },
    packKey: 'newbie_pack_4',
    packLabel: 'NEWBIE PACK IV',
    packLabelI18n: { ua: 'ПАК НОВАЧКА IV', en: 'NEWBIE PACK IV', ru: 'ПАК НОВИЧКА IV' },
    quests: [
      { id: 16, title: 'Крути рулетку', titleI18n: { ua: 'Крути рулетку', en: 'Spin the Roulette', ru: 'Крути рулетку' }, desc: 'Зроби 1 прокрут', descI18n: { ua: 'Зроби 1 прокрут', en: 'Make 1 spin', ru: 'Сделай 1 прокрут' }, reward: { tentacles: 100 } },
      { id: 17, title: 'Відкрий пак', titleI18n: { ua: 'Відкрий пак', en: 'Open a Pack', ru: 'Открой пак' }, desc: 'Відкрий будь-який пак', descI18n: { ua: 'Відкрий будь-який пак', en: 'Open any pack', ru: 'Открой любой пак' }, reward: { small: 2 } },
      { id: 18, title: 'Отримай талант', titleI18n: { ua: 'Отримай талант', en: 'Get a Talent', ru: 'Получи талант' }, desc: 'Отримай 1 очко таланту', descI18n: { ua: 'Отримай 1 очко таланту', en: 'Get 1 talent point', ru: 'Получи 1 очко таланта' }, reward: { xp: 150 } },
      { id: 19, title: 'Вклади талант', titleI18n: { ua: 'Вклади талант', en: 'Spend a Talent', ru: 'Вложи талант' }, desc: 'Прокачай будь-який талант', descI18n: { ua: 'Прокачай будь-який талант', en: 'Upgrade any talent', ru: 'Прокачай любой талант' }, reward: { medium: 1 } },
      { id: 20, title: 'Закрий навчання', titleI18n: { ua: 'Закрий навчання', en: 'Finish Training', ru: 'Закрой обучение' }, desc: 'Виконай всі квести новачка', descI18n: { ua: 'Виконай всі квести новачка', en: 'Complete all Newbie Quests', ru: 'Выполни все квесты новичка' }, reward: { survival: true } },
    ],
    partReward: { pack: true, tentacles: 1000, small: 5, medium: 3, freeSpins: 3 },
  },
];

export const SURVIVAL_PACK = { packKey: 'newbie_survival_pack', tentacles: 1500, small: 5, medium: 5, large: 2, freeSpins: 5, xp: 500 };

function getCounters(profile) {
  return profile?.newbie_stats || {};
}

function totalTaskRuns(profile) {
  return Object.values(profile?.task_completions || {}).reduce((s, n) => s + (Number(n) || 0), 0);
}

export function isNewbieQuestComplete(profile, questId, claimed = []) {
  const counters = getCounters(profile);
  const claimedSet = new Set(claimed || []);
  const dmg = Number(profile?.boss_damage_lifetime || 0);
  if (questId === 1) return true;
  if (questId === 2) return (profile?.opened_boxes_total || 0) >= 1;
  if (questId === 3) return (counters.hero_views || 0) >= 1;
  if (questId === 4) return totalTaskRuns(profile) >= 1;
  if (questId === 5) return (profile?.energy_spent_total || 0) >= 10;
  if (questId === 6) return (counters.boss_tab_opens || 0) >= 1;
  if (questId === 7) return (counters.fist_uses || 0) >= 1;
  if (questId === 8) return (counters.knuckle_uses || 0) >= 1;
  if (questId === 9) return (counters.small_poison_uses || 0) >= 1;
  if (questId === 10) return dmg >= 150;
  if (questId === 11) return dmg >= 50;
  if (questId === 12) return dmg >= 150;
  if (questId === 13) return dmg >= 300;
  if (questId === 14) return dmg >= 500;
  if (questId === 15) return dmg >= 600;
  if (questId === 16) {
    // Older spins saved a reward ID, but did not update the Newbie counter.
    return (counters.roulette_spins || 0) >= 1 || Boolean(profile?.roulette_last_reward_id);
  }
  if (questId === 17) return (profile?.opened_boxes_total || 0) >= 1;
  if (questId === 18) return (profile?.talent_points || 0) > 0 || (profile?.boss_talent_level || 1) > 1;
  if (questId === 19) return Object.values(profile?.talent_levels || {}).some((n) => (Number(n) || 0) > 0);
  if (questId === 20) return Array.from({ length: 19 }, (_, i) => i + 1).every((id) => claimedSet.has(id));
  return false;
}

export function applyNewbieReward(profile, reward = {}) {
  const updates = {};
  if (reward.tentacles) updates.tentacles = (profile?.tentacles || 0) + reward.tentacles;
  if (reward.xp) updates.xp = (profile?.xp || 0) + reward.xp;
  if (reward.freeSpins) updates.roulette_bonus_spins = (profile?.roulette_bonus_spins || 0) + reward.freeSpins;
  if (reward.starterSetFragments || reward.starter_set_fragments) {
    updates.starter_set_fragments = (profile?.starter_set_fragments || 0) + (reward.starterSetFragments || reward.starter_set_fragments || 0);
  }
  const inv = { ...(profile?.weapon_inventory || {}) };
  if (reward.small) inv['small-poison'] = (inv['small-poison'] || 0) + reward.small;
  if (reward.medium) inv['medium-poison'] = (inv['medium-poison'] || 0) + reward.medium;
  if (reward.large) inv['large-poison'] = (inv['large-poison'] || 0) + reward.large;
  if (reward.small || reward.medium || reward.large) updates.weapon_inventory = inv;
  return updates;
}

export function getNewbieProgress(profile) {
  const claimed = [...new Set((profile?.newbie_claimed_quests || []).map(Number).filter(Number.isFinite))];
  const partClaims = [...new Set((profile?.newbie_claimed_parts || []).map(value=>Number(String(value).replace(/^part/,''))).filter(Number.isFinite))];

  const parts = NEWBIE_PARTS.map((part) => {
    const questStates = part.quests.map((q) => ({
      ...q,
      done: isNewbieQuestComplete(profile, q.id, claimed),
      claimed: claimed.includes(q.id),
    }));
    const claimedCount = questStates.filter((q) => q.claimed).length;
    const allClaimed = claimedCount === part.quests.length;
    return { ...part, quests: questStates, claimedCount, allClaimed, partClaimed: partClaims.includes(part.id) };
  });

  const activePart = parts.find((p) => !p.partClaimed) || parts[parts.length - 1];
  const activeQuest = activePart.quests.find((q) => !q.claimed) || activePart.quests[activePart.quests.length - 1];

  return { parts, activePart, activeQuest, claimed, partClaims };
}
