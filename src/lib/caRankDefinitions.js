export const CA_RANKS = [
  { rank: 1, id: 'null_sample', minCA: 0, maxCA: 99, rarity: 'common', color: '#8A8F8D', glow: '#7FE7D7', icon: 'ca_rank_01_null_sample.png', names: { ua: 'Нульовий Зразок', ru: 'Нулевой Образец', en: 'Null Sample' }, short: { ua: 'Зразок', ru: 'Образец', en: 'Sample' }, eye: { monster: 'slime larva', pupil: 'round', anatomy: 'soft pale sleepy eye' } },
  { rank: 2, id: 'sigma_trace', minCA: 100, maxCA: 299, rarity: 'uncommon', color: '#4CAF50', glow: '#8DFF7A', icon: 'ca_rank_02_sigma_trace.png', names: { ua: 'Сигма-Слід', ru: 'Сигма-След', en: 'Sigma Trace' }, short: { ua: 'Сигма', ru: 'Сигма', en: 'Sigma' }, eye: { monster: 'cave worm', pupil: 'horizontal slit', anatomy: 'wet stretched worm-like eyelids' } },
  { rank: 3, id: 'acid_carrier', minCA: 300, maxCA: 699, rarity: 'toxic', color: '#B6F500', glow: '#DFFF3A', icon: 'ca_rank_03_acid_carrier.png', names: { ua: 'Ацидний Носій', ru: 'Ацидный Носитель', en: 'Acid Carrier' }, short: { ua: 'Ацид', ru: 'Ацид', en: 'Acid' }, eye: { monster: 'toxic beetle', pupil: 'vertical slit', anatomy: 'faceted insect iris with toxic dots' } },
  { rank: 4, id: 'abyssal_type', minCA: 700, maxCA: 1199, rarity: 'rare', color: '#2F80ED', glow: '#65C7FF', icon: 'ca_rank_04_abyssal_type.png', names: { ua: 'Абісальний Тип', ru: 'Абиссальный Тип', en: 'Abyssal Type' }, short: { ua: 'Абіс', ru: 'Абисс', en: 'Abyss' }, eye: { monster: 'deep-space fish', pupil: 'V-shaped', anatomy: 'watery iris, glossy surface, bubble details' } },
  { rank: 5, id: 'crystal_object', minCA: 1200, maxCA: 1999, rarity: 'super_rare', color: '#00C2D1', glow: '#4FFFF0', icon: 'ca_rank_05_crystal_object.png', names: { ua: 'Кристальний Об’єкт', ru: 'Кристальный Объект', en: 'Crystal Object' }, short: { ua: 'Кристал', ru: 'Кристалл', en: 'Crystal' }, eye: { monster: 'crystal spider', pupil: 'diamond', anatomy: 'angular crystalline iris with sharp plates' } },
  { rank: 6, id: 'noct_form', minCA: 2000, maxCA: 3499, rarity: 'epic', color: '#7B3FF2', glow: '#B66DFF', icon: 'ca_rank_06_noct_form.png', names: { ua: 'Ноктова Форма', ru: 'Ноктовая Форма', en: 'Noct Form' }, short: { ua: 'Нокт', ru: 'Нокт', en: 'Noct' }, eye: { monster: 'night demon', pupil: 'X-shaped', anatomy: 'dark iris, glowing purple veins, broken look' } },
  { rank: 7, id: 'void_subject', minCA: 3500, maxCA: 5499, rarity: 'mythic', color: '#FF3FA4', glow: '#FF7AD7', icon: 'ca_rank_07_void_subject.png', names: { ua: 'Войд-Суб’єкт', ru: 'Войд-Субъект', en: 'Void Subject' }, short: { ua: 'Войд', ru: 'Войд', en: 'Void' }, eye: { monster: 'void panther', pupil: 'curved catlike slit', anatomy: 'glossy predatory eyelids, magenta/pink glow' } },
  { rank: 8, id: 'molten_grade', minCA: 5500, maxCA: 7999, rarity: 'legendary', color: '#FF8A00', glow: '#FFC247', icon: 'ca_rank_08_molten_grade.png', names: { ua: 'Молтен-Рівень', ru: 'Молтен-Уровень', en: 'Molten Grade' }, short: { ua: 'Молтен', ru: 'Молтен', en: 'Molten' }, eye: { monster: 'lava salamander', pupil: 'downward triangle', anatomy: 'molten iris, lava cracks, hot amber glow' } },
  { rank: 9, id: 'arch_host', minCA: 8000, maxCA: 11999, rarity: 'ancient', color: '#E32626', glow: '#FFD45A', icon: 'ca_rank_09_arch_host.png', names: { ua: 'Архі-Носій', ru: 'Архи-Носитель', en: 'Arch Host' }, short: { ua: 'Архі', ru: 'Архи', en: 'Arch' }, eye: { monster: 'phoenix dragon', pupil: 'eye-inside-eye / double slit', anatomy: 'fiery iris, golden veins, ancient boss look' } },
  { rank: 10, id: 'cosmo_glitch', minCA: 12000, maxCA: 19999, rarity: 'cosmic', color: '#FFD700', glow: '#FF4DFF', icon: 'ca_rank_10_cosmo_glitch.png', names: { ua: 'Космо-Збій', ru: 'Космо-Сбой', en: 'Cosmo Glitch' }, short: { ua: 'Збій', ru: 'Сбой', en: 'Glitch' }, eye: { monster: 'elder cosmic anomaly', pupil: 'spiral / black hole', anatomy: 'portal iris, cosmic particles, living core' } },
  { rank: 11, id: 'quantum_predator', minCA: 20000, maxCA: 34999, rarity: 'transcendent', color: '#39E6FF', glow: '#A0F7FF', icon: 'ca_rank_11_quantum_predator.png', names: { ua: 'Квантовий Хижак', ru: 'Квантовый Хищник', en: 'Quantum Predator' }, short: { ua: 'Хижак', ru: 'Хищник', en: 'Predator' }, eye: { monster: 'quantum predator', pupil: 'split particle', anatomy: 'shifting quantum iris with cyan energy trails' } },
  { rank: 12, id: 'reality_rift', minCA: 35000, maxCA: 59999, rarity: 'reality', color: '#A855F7', glow: '#E7A2FF', icon: 'ca_rank_12_reality_rift.png', names: { ua: 'Розлом Реальності', ru: 'Разлом Реальности', en: 'Reality Rift' }, short: { ua: 'Розлом', ru: 'Разлом', en: 'Rift' }, eye: { monster: 'reality-bending aberration', pupil: 'fractured oval', anatomy: 'broken-space iris with violet dimensional cracks' } },
  { rank: 13, id: 'galaxy_devourer', minCA: 60000, maxCA: 99999, rarity: 'galactic', color: '#FF4B2B', glow: '#FF9C52', icon: 'ca_rank_13_galaxy_devourer.png', names: { ua: 'Пожирач Галактик', ru: 'Пожиратель Галактик', en: 'Galaxy Devourer' }, short: { ua: 'Пожирач', ru: 'Пожиратель', en: 'Devourer' }, eye: { monster: 'galaxy devourer', pupil: 'stellar maw', anatomy: 'black-hole pupil ringed by burning stars' } },
  { rank: 14, id: 'multiverse_glitch', minCA: 100000, maxCA: 159999, rarity: 'multiversal', color: '#F3F0FF', glow: '#B76CFF', icon: 'ca_rank_14_multiverse_glitch.png', names: { ua: 'Мультивсесвітній Збій', ru: 'Сбой Мультивселенной', en: 'Multiverse Glitch' }, short: { ua: 'Мульти-збій', ru: 'Мульти-сбой', en: 'Multiglitch' }, eye: { monster: 'multiversal anomaly', pupil: 'overlapping spirals', anatomy: 'several realities reflected in a fractured iris' } },
  { rank: 15, id: 'beyond_the_edge', minCA: 160000, maxCA: null, rarity: 'absolute', color: '#FFFFFF', glow: '#F5D742', icon: 'ca_rank_15_beyond_the_edge.png', names: { ua: 'Поза Межами', ru: 'За Пределами', en: 'Beyond the Edge' }, short: { ua: 'Поза', ru: 'Предел', en: 'Beyond' }, eye: { monster: 'entity beyond known space', pupil: 'event horizon', anatomy: 'luminous eye with a horizon enclosing a starless void' } },
];
export function getCARank(ca = 0) {
  const value = Number(ca) || 0;
  return CA_RANKS.find((rank) => value >= rank.minCA && (rank.maxCA === null || value <= rank.maxCA)) || CA_RANKS[0];
}

export function getPlayerCA(player) {
  return Math.floor(Number(player?.stat_strength || player?.power || player?.attack_power || player?.clan_power || Number(player?.total_boss_damage || 0) / 10 || 0) || 0);
}

export function getNextCARank(ca = 0) {
  const current = getCARank(ca);
  return CA_RANKS.find((rank) => rank.rank === current.rank + 1) || null;
}

export function getCARankProgress(ca = 0) {
  const value = Number(ca) || 0;
  const current = getCARank(value);
  const next = getNextCARank(value);
  if (!next) return { current, next: null, progress: 1, needed: 0 };
  const progress = Math.max(0, Math.min(1, (value - current.minCA) / (next.minCA - current.minCA)));
  return { current, next, progress, needed: Math.max(0, next.minCA - value) };
}
