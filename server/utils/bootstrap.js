import { getGlobalWeekMeta } from './globalWeeklyCycle.js';
import { normalizePlayerProgression } from './progression.js';

function pickState(source, keys) {
  const target = {};
  for (const key of keys) {
    if (source?.[key] !== undefined) target[key] = source[key];
  }
  return target;
}

export function buildBootstrapPayload(player, session = null) {
  const normalizedPlayer = normalizePlayerProgression(player || {});
  const weekMeta = getGlobalWeekMeta();

  return {
    session,
    player: normalizedPlayer,
    bootstrap: {
      player: normalizedPlayer,
      inventory: pickState(normalizedPlayer, [
        'inventory_items',
        'weapon_inventory',
        'equipped_items',
        'collection_items',
        'collection_item_counts',
        'collection_rewards_claimed',
        'collection_boxes',
        'keycards',
        'boss_key_pity',
        'poison_refund_progress',
        'boss_reward_carries',
        'pending_boss_boxes',
        'unlocked_profile_banners',
        'unlocked_avatar_frames',
        'profile_banner_id',
        'avatar_frame_id',
      ]),
      fishing_state: pickState(normalizedPlayer, [
        'cosmofish_inventory',
        'cosmo_fish_inventory',
        'cosmo_fishing_cycle',
        'cosmo_fishing_last_result',
        'cosmo_fishing_last_result_seen',
      ]),
      progression: {
        level: normalizedPlayer.level || 1,
        xp: normalizedPlayer.xp || 0,
        xp_to_next_level: normalizedPlayer.xp_to_next_level || 0,
        level_milestone_rewards_claimed: normalizedPlayer.level_milestone_rewards_claimed || [],
        ca_rank_rewards_claimed: normalizedPlayer.ca_rank_rewards_claimed || [],
        hero_tier: normalizedPlayer.hero_tier || 'scavenger',
        stat_strength: normalizedPlayer.stat_strength || 1,
        stat_stealth: normalizedPlayer.stat_stealth || 1,
        stat_endurance: normalizedPlayer.stat_endurance || 1,
        stat_craft: normalizedPlayer.stat_craft || 1,
        talent_points: normalizedPlayer.talent_points || 0,
        talent_progress: normalizedPlayer.talent_progress || 0,
        talent_progress_goal: normalizedPlayer.talent_progress_goal || 0,
        boss_talent_progress: normalizedPlayer.boss_talent_progress || 0,
        boss_talent_progress_goal: normalizedPlayer.boss_talent_progress_goal || 0,
        boss_talent_level: normalizedPlayer.boss_talent_level || 1,
        talent_tree_version: normalizedPlayer.talent_tree_version || 0,
        talent_levels: normalizedPlayer.talent_levels || {},
        available_talent_points: normalizedPlayer.available_talent_points || 0,
        total_talent_points_earned: normalizedPlayer.total_talent_points_earned || 0,
        total_talent_points_spent: normalizedPlayer.total_talent_points_spent || 0,
        talent_damage_progress: normalizedPlayer.talent_damage_progress || 0,
        next_talent_threshold_index: normalizedPlayer.next_talent_threshold_index || 0,
        unlocked_talent_sectors: normalizedPlayer.unlocked_talent_sectors || [1],
        weekly_cycle: weekMeta,
      },
      daily_tasks_state: pickState(normalizedPlayer, [
        'daily_event',
        'daily_event_week',
        'daily_event_day',
        'daily_event_last_claim',
        'daily_event_pending_claims',
        'daily_claimable_count',
        'total_tasks_today',
        'task_completions',
        'starter_guide_claimed',
        'starter_guide_final_claimed',
        'newbie_claimed_quests',
        'newbie_claimed_parts',
        'newbie_survival_claimed',
        'newbie_stats',
        'unopened_newbie_packs',
        'newbie_pack_1_unlocked_at',
        'newbie_pack_1_expires_at',
        'newbie_pack_1_purchased_at',
        'newbie_pack_2_unlocked_at',
        'newbie_pack_2_expires_at',
        'newbie_pack_2_purchased_at',
      ]),
      leaderboard_meta: {
        ...weekMeta,
        total_boss_damage: normalizedPlayer.total_boss_damage || 0,
        boss_kills: normalizedPlayer.boss_kills || 0,
        boss_kills_by_id: normalizedPlayer.boss_kills_by_id || {},
        best_medal: normalizedPlayer.best_medal || '',
        level: normalizedPlayer.level || 1,
      },
      meta: {
        currentDayIndex: normalizedPlayer.currentDayIndex,
        currentDateKey: normalizedPlayer.currentDateKey,
        previousDateKey: normalizedPlayer.previousDateKey,
        currentWeekKey: normalizedPlayer.currentWeekKey,
      },
    },
  };
}
