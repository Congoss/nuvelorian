export const BOSS_ESCAPE_COOLDOWN_MS = 30 * 60 * 1000;
export const BOSS_ESCAPE_COOLDOWN_KEY = 'boss_escape_until';

export function getBossEscapeCooldownRemaining(cooldowns = {}, now = Date.now()) {
  const until = Date.parse(cooldowns?.[BOSS_ESCAPE_COOLDOWN_KEY] || '');
  return Number.isFinite(until) ? Math.max(0, until - now) : 0;
}

export function applyBossEscapeCooldown(cooldowns = {}, now = Date.now()) {
  return {
    ...cooldowns,
    [BOSS_ESCAPE_COOLDOWN_KEY]: new Date(now + BOSS_ESCAPE_COOLDOWN_MS).toISOString(),
  };
}
