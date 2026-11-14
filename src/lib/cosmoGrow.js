export const GROW_DURATION = 120_000;
export const CARE_TYPES = ['water', 'light', 'feed'];
export const LAMP_LEVELS = [
  { name: 'Лампочка', duration: GROW_DURATION, bonus: 0, upgradeCost: 6 },
  { name: 'Фотопанель', duration: 100_000, bonus: 2, upgradeCost: 10 },
  { name: 'Зоряний спектр', duration: 80_000, bonus: 4, upgradeCost: null },
];
export const createGrowState = () => ({ plantedAt: null, care: [], harvest: 0, cycles: 0, tokens: 0, lampLevel: 1, cycleLampLevel: 1 });

export function lampConfig(level = 1) {
  return LAMP_LEVELS[Math.max(0, Math.min(2, Math.floor(Number(level) || 1) - 1))];
}

export const growDuration = state => lampConfig(state.cycleLampLevel).duration;
export const growYield = state => 5 + state.care.length * 3 + lampConfig(state.cycleLampLevel).bonus;

export function growProgress(state, now) {
  if (state.plantedAt === null) return 0;
  return Math.max(0, Math.min(1, (now - state.plantedAt) / growDuration(state)));
}

export function growAction(state, action, now = Date.now()) {
  if (action === 'upgrade-lamp') {
    const level = state.lampLevel || 1;
    const cost = lampConfig(level).upgradeCost;
    if (cost === null || state.harvest < cost) return state;
    return { ...state, harvest: state.harvest - cost, lampLevel: level + 1 };
  }
  if (action === 'plant' && state.plantedAt === null) return { ...state, plantedAt: now, care: [], cycleLampLevel: state.lampLevel || 1 };
  if (CARE_TYPES.includes(action) && state.plantedAt !== null && growProgress(state, now) < 1 && !state.care.includes(action)) {
    return { ...state, care: [...state.care, action] };
  }
  if (action === 'harvest' && growProgress(state, now) === 1) {
    return { ...state, plantedAt: null, care: [], harvest: state.harvest + growYield(state), cycles: state.cycles + 1 };
  }
  if (action === 'exchange' && state.harvest >= 20) return { ...state, harvest: state.harvest - 20, tokens: (state.tokens || 0) + 1 };
  return state;
}
