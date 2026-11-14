import { ALL_DOSSIER_CHAPTERS, dossierChapterUnlocked } from '../../src/lib/bossDossier.js';

import { grantEnhancementGum } from './enhancementGumRewards.js';

export function claimDossierReward(player, id, now = Date.now()) {
  const chapter = ALL_DOSSIER_CHAPTERS.find(row => row.id === id);
  if (!chapter || !dossierChapterUnlocked(player, chapter)) throw Object.assign(new Error('DOSSIER_LOCKED'), { statusCode: 403 });
  if (player.player_achievements?.[id]?.reward_status === 'claimed') return { claimed: true, replayed: true };
  const inventory = {...player.weapon_inventory};
  for(const id of ['small-poison','medium-poison','large-poison']) inventory[id]=Math.max(0,Number(inventory[id])||0)+chapter.rewards[id];
  const gums = { enhancement_gums: player.enhancement_gums };
  for (const gum of ['normal', 'improved']) {
    const qty = chapter.rewards['gum-' + gum];
    if (qty) grantEnhancementGum(gums, { type: 'enhancement_gum', gum, qty });
  }
  if (gums.enhancement_gums) player.enhancement_gums = gums.enhancement_gums;
  player.weapon_inventory=inventory;
  player.roulette_bonus_spins=Math.max(0,Number(player.roulette_bonus_spins)||0)+chapter.rewards.spins;
  player.player_achievements = { ...player.player_achievements, [id]: { reward_status: 'claimed', claimed_at: new Date(now).toISOString() } };
  return { claimed: true, replayed: false };
}
