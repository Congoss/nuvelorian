import { CLAN_ACHIEVEMENT_CONFIG, getClanAchievementState } from './clanAchievements.js';

export const CLAN_DONATION_WINDOW_MS = 12 * 60 * 60 * 1000;

// Cached clan reads can outlive their contribution window. Expiration changes
// availability only; the server still validates every contribution.
export function currentClanDonationWindow(donation, now = Date.now()) {
  if (!donation) return {contribution:0,contribution_cap:0,available_at:null};
  const expires = Date.parse(donation.available_at || '');
  return Number.isFinite(expires) && expires <= now
    ? {...donation,contribution:0,available_at:null} : donation;
}

export function getClanDonationState(profile, clan, now = Date.now()) {
  const state = getClanAchievementState('donations', clan?.achievements?.donations);
  const clanId = clan?.id || profile?.clan_id;
  const levelKey = String(state.level + 1);
  const window = profile?.clan_donation_limits?.[clanId]?.[levelKey];
  const availableAt = Date.parse(window?.available_at || '');
  const active = Number.isFinite(availableAt) && availableAt > now;
  return {
    contribution: active ? Math.max(0, Number(window?.used || 0)) : 0,
    contribution_cap: state.maxed ? 0 : CLAN_ACHIEVEMENT_CONFIG.donations.contributionCaps[state.level],
    available_at: active ? new Date(availableAt).toISOString() : null,
  };
}
