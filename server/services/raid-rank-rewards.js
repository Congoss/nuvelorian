import { rankRaidParticipants } from '../../src/lib/raidRankRewards.js';
import { FRIDAY13_FRAME_IDS, getFriday13GuildShipReward, getFriday13PlayerReward } from '../../src/lib/friday13Event.js';
import { recordBossTimeoutAchievement } from '../utils/playerAchievements.js';

export function repairRaidGuildFrames(raid, players, clans) {
  if (!raid || raid.guild_frames_migrated_at || !Object.keys(raid.guild_rewards_sent || {}).length) return { changed: [], clanChanged: false };
  const changed = [];
  let clanChanged = false;
  for (const clan of clans) {
    const rank = raid?.guild_rewards_sent?.[clan.id]?.rank;
    const frame = Number.isInteger(rank) && rank >= 1 && rank <= 3 ? FRIDAY13_FRAME_IDS[rank + 2] : null;
    if (frame && clan.raid_header_theme !== frame) { clan.raid_header_theme = frame; clanChanged = true; }
  }
  for (const player of players) {
    const guildFrame = id => typeof id === 'string' && id.startsWith('friday13_guild_');
    if (!(player.unlocked_profile_banners || []).some(guildFrame) && !guildFrame(player.profile_header_theme)) continue;
    player.unlocked_profile_banners = (player.unlocked_profile_banners || []).filter(id => !guildFrame(id));
    if (guildFrame(player.profile_header_theme)) player.profile_header_theme = null;
    changed.push(player.id);
  }
  if (raid.guild_rewards_completed_at) { raid.guild_frames_migrated_at = new Date().toISOString(); clanChanged = true; }
  return { changed, clanChanged };
}

export function awardRaidRankRewards(raid, players, { now = Date.now(), endAt, clans = [] } = {}) {
  if (!raid || (!['defeated', 'dead'].includes(raid.status) && !(Date.parse(raid.ends_at || endAt) <= now))) return [];
  const encounter = `${raid.id}:${raid.started_at}`;
  raid.rank_reward_snapshot ||= rankRaidParticipants(raid.participants).slice(0, 100);
  const byId = new Map(players.map(player => [String(player.id), player]));
  const changed = [];
  if (!['defeated', 'dead'].includes(raid.status)) {
    const before = new Map(players.map(p => [p.id, p.player_achievements]));
    recordBossTimeoutAchievement({ ...raid, status: 'expired' }, players, now);
    for (const player of players) if (before.get(player.id) !== player.player_achievements) changed.push(player.id);
  }
  raid.rank_rewards_sent ||= {};
  for (const [index, row] of raid.rank_reward_snapshot.entries()) {
    const player = byId.get(row.playerId);
    // A removed/test participant must not keep settlement permanently open and
    // force the server to repeat the PostgreSQL refresh/write cycle forever.
    if (!player) {
      raid.rank_rewards_sent[row.playerId] ||= { skipped: true, at: new Date(now).toISOString() };
      continue;
    }
    const eventReward = getFriday13PlayerReward(index + 1);
    const receipt = player.raid_rank_rewards?.[encounter];
    if (receipt) {
      raid.rank_rewards_sent[row.playerId] = receipt;
      continue;
    }
    const instanceId = `raid-rank:${encounter}:${row.playerId}`;
    player.weapon_inventory = { ...(player.weapon_inventory || {}) };
    for (const [key, qty] of Object.entries({ 'small-poison': eventReward.smallPoison, 'medium-poison': eventReward.mediumPoison, 'large-poison': eventReward.largePoison })) {
      player.weapon_inventory[key] = Number(player.weapon_inventory[key] || 0) + qty;
    }
    player.enhancement_gums = { normal: 0, improved: 0, premium: 0, ...(player.enhancement_gums || {}) };
    for (const [gum, qty] of Object.entries(eventReward.gums)) player.enhancement_gums[gum] += qty;
    player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + eventReward.spins;
    player.card_game_bonus = Number(player.card_game_bonus || 0) + eventReward.cardPlays;
    if (index < 3) {
      const frameId = FRIDAY13_FRAME_IDS[index];
      player.unlocked_profile_banners = Array.from(new Set([...(player.unlocked_profile_banners || []), frameId]));
    }
    const issued = { rank: index + 1, instanceId, reward: eventReward, at: new Date(now).toISOString() };
    player.raid_rank_rewards = { ...(player.raid_rank_rewards || {}), [encounter]: issued };
    raid.rank_rewards_sent[row.playerId] = issued;
    changed.push(player.id);
  }
  raid.guild_rewards_sent ||= {};
  if (!raid.guild_rewards_completed_at) {
    const byClan = new Map(clans.map(clan => [String(clan.id), { clanId: String(clan.id), damage: 0, members: [] }]));
    for (const row of rankRaidParticipants(raid.participants)) {
      const member = byId.get(String(row.playerId));
      if (!member) continue;
      const clan = clans.find(candidate => String(candidate.id) === String(member.clan_id || '') || String(candidate.name || '').trim().toLowerCase() === String(member.clan_name || '').trim().toLowerCase());
      const clanId = String(clan?.id || member.clan_id || member.clan_name || '').trim();
      if (!clanId) continue;
      const entry = byClan.get(clanId) || { clanId, damage: 0, members: [] };
      entry.damage += Number(row.damage || 0);
      entry.members.push(member);
      byClan.set(clanId, entry);
    }
    const rankedClans = [...byClan.values()].sort((a, b) => b.damage - a.damage || a.clanId.localeCompare(b.clanId));
    for (const [index, entry] of rankedClans.entries()) {
      const rank = index + 1;
      const guildFrameId = rank <= 3 ? FRIDAY13_FRAME_IDS[rank + 2] : null;
      const clan = clans.find(candidate => String(candidate.id) === entry.clanId || String(candidate.name || '').trim().toLowerCase() === entry.clanId.toLowerCase());
      if (!clan) continue;
      if (!raid.guild_rewards_sent[clan.id]) {
        clan.ship ||= { progress: {}, kills: {}, fights: {}, receipts: {}, donations: [], lastWinners: {}, history: {} };
        clan.ship.paidCredit = Number(clan.ship.paidCredit || 0) + getFriday13GuildShipReward(rank);
        clan.ship.donations ||= [];
        clan.ship.donations.push({ source: 'friday13_raid_reward', currency: 'tentacles', amount: getFriday13GuildShipReward(rank), rank, at: now });
        clan.ship.donations = clan.ship.donations.slice(-50);
      }
      if (guildFrameId) clan.raid_header_theme = guildFrameId;
      raid.guild_rewards_sent[clan.id] = { rank, amount: getFriday13GuildShipReward(rank), at: new Date(now).toISOString() };
    }
    if (rankedClans.every(entry => clans.some(candidate => (String(candidate.id) === entry.clanId || String(candidate.name || '').trim().toLowerCase() === entry.clanId.toLowerCase()) && raid.guild_rewards_sent[candidate.id]))) raid.guild_rewards_completed_at ||= new Date(now).toISOString();
  }
  if (raid.rank_reward_snapshot.every(row => raid.rank_rewards_sent[row.playerId])) raid.rank_rewards_completed_at ||= new Date(now).toISOString();
  return changed;
}
