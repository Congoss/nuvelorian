import { GAME_CONFIG } from '../../src/lib/gameConfig.js';

// Used only after admin authentication. Ordinary player patches keep their own whitelist.
export function pickAdminPlayerPatch(body, publicPatch = {}) {
  const patch = { ...publicPatch };
  for (const field of ['level','xp','tentacles','premium','energy','max_energy','stat_strength']) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (!Number.isSafeInteger(value) || value < (field === 'level' ? 1 : 0)) throw new Error(`Invalid ${field}`);
    patch[field] = value;
  }
  for (const [field, keys] of [
    ['keycards',new Set(GAME_CONFIG.BOSSES.map(boss=>boss.keycardLocation))],
    ['weapon_inventory',new Set(['small-poison','medium-poison','large-poison',...GAME_CONFIG.WEAPONS.map(weapon=>weapon.id)])],
  ]) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${field}`);
    patch[field] = {};
    for (const [key,count] of Object.entries(value)) {
      if (!keys.has(key) || !Number.isSafeInteger(count) || count < 0) throw new Error(`Invalid ${field}.${key}`);
      patch[field][key] = count;
    }
  }
  if (Object.hasOwn(body,'tutorial_disabled')) {
    if (typeof body.tutorial_disabled !== 'boolean') throw new Error('Invalid tutorial_disabled');
    patch.tutorial_disabled = body.tutorial_disabled;
  }
  return patch;
}
