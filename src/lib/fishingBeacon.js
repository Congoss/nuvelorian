import { eventPhase } from './eventSchedule.js';

export function fishingBeaconState(profile, now) {
  if (Number(profile?.level || 0) < 10 || eventPhase('space-fishing', now) !== 'active') return null;
  if (profile.cosmo_fishing_last_result && !profile.cosmo_fishing_last_result_seen) return 'result';
  const cycle = profile.cosmo_fishing_cycle;
  if (!cycle?.startAt || cycle.claimed) return 'available';
  if (cycle.resolved) return null;
  if (now >= Number(cycle.finishAt)) return 'ready';
  if (now >= Number(cycle.hookStartAt) && now < Number(cycle.hookEndAt)) return 'bite';
  return null;
}
