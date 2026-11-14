import { CA_RANKS } from './caRankDefinitions.js';
import rank01 from '@/assets/hero/rangs/ca_rank_01_null_sample.png';
import rank02 from '@/assets/hero/rangs/ca_rank_02_sigma_trace.png';
import rank03 from '@/assets/hero/rangs/ca_rank_03_acid_carrier.png';
import rank04 from '@/assets/hero/rangs/ca_rank_04_abyssal_type.png';
import rank05 from '@/assets/hero/rangs/ca_rank_05_crystal_object.png';
import rank06 from '@/assets/hero/rangs/ca_rank_06_noct_form.png';
import rank07 from '@/assets/hero/rangs/ca_rank_07_void_subject.png';
import rank08 from '@/assets/hero/rangs/ca_rank_08_molten_grade.png';
import rank09 from '@/assets/hero/rangs/ca_rank_09_arch_host.png';
import rank10 from '@/assets/hero/rangs/ca_rank_10_cosmo_glitch.png';
import rank11 from '@/assets/hero/rangs/ca_rank_11_quantum_predator.png';
import rank12 from '@/assets/hero/rangs/ca_rank_12_reality_rift.png';
import rank13 from '@/assets/hero/rangs/ca_rank_13_galaxy_devourer.png';
import rank14 from '@/assets/hero/rangs/ca_rank_14_multiverse_glitch.png';
import rank15 from '@/assets/hero/rangs/ca_rank_15_beyond_the_edge.png';

import rank16 from '@/assets/hero/rangs/ca_rank_16_copper_allseer.png';
import rank17 from '@/assets/hero/rangs/ca_rank_17_short_circuit.png';
import rank18 from '@/assets/hero/rangs/ca_rank_18_pink_apocalypse.png';
import rank19 from '@/assets/hero/rangs/ca_rank_19_crimson_raven.png';

const RANK_ICONS = {
  'ca_rank_01_null_sample.png': rank01,
  'ca_rank_02_sigma_trace.png': rank02,
  'ca_rank_03_acid_carrier.png': rank03,
  'ca_rank_04_abyssal_type.png': rank04,
  'ca_rank_05_crystal_object.png': rank05,
  'ca_rank_06_noct_form.png': rank06,
  'ca_rank_07_void_subject.png': rank07,
  'ca_rank_08_molten_grade.png': rank08,
  'ca_rank_09_arch_host.png': rank09,
  'ca_rank_10_cosmo_glitch.png': rank10,
  'ca_rank_11_quantum_predator.png': rank11,
  'ca_rank_12_reality_rift.png': rank12,
  'ca_rank_13_galaxy_devourer.png': rank13,
  'ca_rank_14_multiverse_glitch.png': rank14,
  'ca_rank_15_beyond_the_edge.png': rank15,
  'ca_rank_16_copper_allseer.png': rank16,
  'ca_rank_17_short_circuit.png': rank17,
  'ca_rank_18_pink_apocalypse.png': rank18,
  'ca_rank_19_crimson_raven.png': rank19,
};

export { CA_RANKS };


export function getCARank(ca = 0) {
  const value = Number(ca) || 0;
  return (
    CA_RANKS.find((rank) => {
      const minOk = value >= rank.minCA;
      const maxOk = rank.maxCA === null || value <= rank.maxCA;
      return minOk && maxOk;
    }) || CA_RANKS[0]
  );
}

export function getPlayerCA(player) {
  return Math.floor(
    Number(
      player?.stat_strength ||
        player?.power ||
        player?.attack_power ||
        player?.clan_power ||
        (Number(player?.total_boss_damage || 0) / 10) ||
        0,
    ) || 0,
  );
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
  const start = current.minCA;
  const end = next.minCA;
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return { current, next, progress, needed: Math.max(0, next.minCA - value) };
}

export function getCARankIcon(rank) {
  if (!rank?.icon) return null;
  // Fall back to the latest existing badge if an icon has not been mapped yet.
  return RANK_ICONS[rank.icon] || rank10;
}


