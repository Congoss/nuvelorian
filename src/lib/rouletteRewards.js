export const ROULETTE_REWARD_DEFS = [
  {
    id: 'reward_nothing',
    type: 'nothing',
    amount: 0,
    weight: 20,
    wheelIndex: 2,
    iconKey: 'nothing',
    accent: '#f6c545',
    label: { ua: 'Лайно трапляється', en: 'Shit happens', ru: 'Дерьмо случается' },
    popupText: { ua: 'Лайно трапляється', en: 'Shit happens', ru: 'Дерьмо случается' },
  },
  {
    id: 'reward_energy_50',
    type: 'energy',
    amount: 50,
    weight: 40,
    wheelIndex: 1,
    iconKey: 'energy',
    accent: '#91ff47',
    label: {
      ua: 'Енергія',
      en: 'Energy',
      ru: 'Энергия',
    },
    popupText: {
      ua: '+50 Енергії',
      en: '+50 Energy',
      ru: '+50 Энергии',
    },
  },
  {
    id: 'reward_poison_large',
    type: 'poison_large',
    amount: 1,
    weight: 5,
    wheelIndex: 0,
    iconKey: 'poison_large',
    accent: '#dfe5f0',
    label: {
      ua: 'Фляга з отрутою',
      en: 'Poison flask',
      ru: 'Фляга с ядом',
    },
    popupText: {
      ua: '+1 Фляга з отрутою',
      en: '+1 Poison flask',
      ru: '+1 Фляга с ядом',
    },
  },
  {
    id: 'reward_poison_medium',
    type: 'poison_medium',
    amount: 2,
    weight: 15,
    wheelIndex: 3,
    iconKey: 'poison_medium',
    accent: '#ffc83d',
    label: {
      ua: 'Середні отрути',
      en: 'Medium Poisons',
      ru: 'Средние яды',
    },
    popupText: {
      ua: '+2 Середні отрути',
      en: '+2 Medium Poisons',
      ru: '+2 Средние яды',
    },
  },
  {
    id: 'reward_poison_small',
    type: 'poison_small',
    amount: 3,
    weight: 20,
    wheelIndex: 4,
    iconKey: 'poison_small',
    accent: '#4ec5ff',
    label: {
      ua: 'Малі отрути',
      en: 'Small Poisons',
      ru: 'Малые яды',
    },
    popupText: {
      ua: '+3 Малі отрути',
      en: '+3 Small Poisons',
      ru: '+3 Малые яды',
    },
  },
];

export const ROULETTE_REWARD_BY_ID = Object.fromEntries(ROULETTE_REWARD_DEFS.map((reward) => [reward.id, reward]));

export const ROULETTE_REWARD_ID_ALIASES = {
  nothing: 'reward_nothing',
  energy: 'reward_energy_50',
  free_spin: 'reward_nothing',
  reward_free_spin: 'reward_nothing',
  large_poison: 'reward_poison_large',
  medium_poison: 'reward_poison_medium',
  small_poison: 'reward_poison_small',
  'large-poison': 'reward_poison_large',
  'medium-poison': 'reward_poison_medium',
  'small-poison': 'reward_poison_small',
};

export function normalizeRouletteRewardId(rewardId) {
  const raw = String(rewardId || '').trim();
  if (!raw) return '';
  return ROULETTE_REWARD_ID_ALIASES[raw] || raw;
}

// Visual wheel order, clockwise from 12 o'clock.
export const ROULETTE_WHEEL_SECTOR_ORDER = [...ROULETTE_REWARD_DEFS]
  .sort((a, b) => Number(a.wheelIndex || 0) - Number(b.wheelIndex || 0))
  .map((reward) => reward.id);

export const ROULETTE_REWARD_COUNT = ROULETTE_REWARD_DEFS.length;
export const ROULETTE_WHEEL_POINTER_ANGLE = 90;

export function getRouletteRewardIndex(rewardId) {
  const reward = ROULETTE_REWARD_BY_ID[normalizeRouletteRewardId(rewardId)];
  return Number.isFinite(Number(reward?.wheelIndex)) ? Number(reward.wheelIndex) : -1;
}

export function getRouletteRewardCenterAngleByIndex(index, count = ROULETTE_REWARD_COUNT) {
  const safeCount = Math.max(1, Number(count || 0));
  const safeIndex = Number.isFinite(Number(index)) ? Number(index) : 0;
  const sectorAngle = 360 / safeCount;
  return (ROULETTE_WHEEL_POINTER_ANGLE - safeIndex * sectorAngle + 360) % 360;
}

export const ROULETTE_REWARD_WHEEL_CENTER_ANGLES = Object.fromEntries(
  ROULETTE_WHEEL_SECTOR_ORDER.map((rewardId, index) => {
    const angle = getRouletteRewardCenterAngleByIndex(index, ROULETTE_WHEEL_SECTOR_ORDER.length);
    return [rewardId, angle];
  })
);

export function selectRouletteReward(rng = Math.random) {
  const totalWeight = ROULETTE_REWARD_DEFS.reduce((sum, reward) => sum + Number(reward.weight || 0), 0);
  const roll = rng() * totalWeight;
  let cursor = 0;

  for (let index = 0; index < ROULETTE_REWARD_DEFS.length; index++) {
    const reward = ROULETTE_REWARD_DEFS[index];
    cursor += Number(reward.weight || 0);
    if (roll <= cursor) {
      return {
        reward,
        rewardIndex: Number.isFinite(Number(reward.wheelIndex)) ? Number(reward.wheelIndex) : index,
        sectorAngle: 360 / Math.max(1, ROULETTE_REWARD_DEFS.length),
        selectedAngle: getRouletteRewardCenterAngleByIndex(Number.isFinite(Number(reward.wheelIndex)) ? Number(reward.wheelIndex) : index),
      };
    }
  }

  const rewardIndex = ROULETTE_REWARD_DEFS.length - 1;
  const reward = ROULETTE_REWARD_DEFS[rewardIndex];
  return {
    reward,
    rewardIndex: Number.isFinite(Number(reward.wheelIndex)) ? Number(reward.wheelIndex) : rewardIndex,
    sectorAngle: 360 / Math.max(1, ROULETTE_REWARD_DEFS.length),
    selectedAngle: getRouletteRewardCenterAngleByIndex(Number.isFinite(Number(reward.wheelIndex)) ? Number(reward.wheelIndex) : rewardIndex),
  };
}

export function chooseRouletteReward(rng = Math.random) {
  return selectRouletteReward(rng).reward;
}

export function resolveRouletteRewardById(rewardId) {
  return ROULETTE_REWARD_BY_ID[normalizeRouletteRewardId(rewardId)] || null;
}

function getRewardDeltaReward(previousValue, nextValue, reward) {
  const before = Number(previousValue || 0);
  const after = Number(nextValue || 0);
  if (after > before) return reward;
  return null;
}

export function inferRouletteRewardFromState(previous = {}, next = {}) {
  const prev = previous || {};
  const curr = next || {};

  const poisonLarge = getRewardDeltaReward(prev?.weapon_inventory?.['large-poison'], curr?.weapon_inventory?.['large-poison'], resolveRouletteRewardById('reward_poison_large'));
  if (poisonLarge) return poisonLarge;

  const poisonMedium = getRewardDeltaReward(prev?.weapon_inventory?.['medium-poison'], curr?.weapon_inventory?.['medium-poison'], resolveRouletteRewardById('reward_poison_medium'));
  if (poisonMedium) return poisonMedium;

  const poisonSmall = getRewardDeltaReward(prev?.weapon_inventory?.['small-poison'], curr?.weapon_inventory?.['small-poison'], resolveRouletteRewardById('reward_poison_small'));
  if (poisonSmall) return poisonSmall;

  const spinsBefore = Number(prev?.roulette_bonus_spins || 0);
  const spinsAfter = Number(curr?.roulette_bonus_spins || 0);
  if (spinsAfter > spinsBefore) {
    return resolveRouletteRewardById('reward_free_spin');
  }

  const energyBefore = Number(prev?.energy || 0);
  const energyAfter = Number(curr?.energy || 0);
  if (energyAfter > energyBefore) {
    return resolveRouletteRewardById('reward_energy_50');
  }

  const legacyRewardId = normalizeRouletteRewardId(curr?.roulette_last_reward_id || prev?.roulette_last_reward_id);
  return resolveRouletteRewardById(legacyRewardId);
}

export function getRouletteRewardLabel(reward, lang = 'en') {
  return reward?.label?.[lang] || reward?.label?.en || reward?.label?.ua || reward?.label?.ru || reward?.id || '';
}

export function getRouletteRewardPopupText(reward, lang = 'en') {
  return reward?.popupText?.[lang] || reward?.popupText?.en || reward?.popupText?.ua || reward?.popupText?.ru || reward?.id || '';
}

export function applyRouletteReward(player, reward) {
  if (!player || !reward) return {};
  if (['reward_free_spin', 'free_spin'].includes(reward.id)) reward = resolveRouletteRewardById(reward.id);

  if (reward.type === 'energy') {
    player.energy = Number(player.energy || 0) + Number(reward.amount || 0);
  } else if (reward.type === 'poison_small') {
    player.weapon_inventory = {
      ...(player.weapon_inventory || {}),
      'small-poison': Number((player.weapon_inventory || {})['small-poison'] || 0) + Number(reward.amount || 0),
    };
  } else if (reward.type === 'poison_medium') {
    player.weapon_inventory = {
      ...(player.weapon_inventory || {}),
      'medium-poison': Number((player.weapon_inventory || {})['medium-poison'] || 0) + Number(reward.amount || 0),
    };
  } else if (reward.type === 'poison_large') {
    player.weapon_inventory = {
      ...(player.weapon_inventory || {}),
      'large-poison': Number((player.weapon_inventory || {})['large-poison'] || 0) + Number(reward.amount || 0),
    };
  } else if (reward.type === 'spin') {
    player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + Number(reward.amount || 0);
  }

  player.roulette_last_reward_id = reward.id;

  return {
    energy: Number(player.energy || 0),
    weapon_inventory: player.weapon_inventory || {},
    roulette_bonus_spins: Number(player.roulette_bonus_spins || 0),
    roulette_last_reward_id: reward.id,
  };
}
