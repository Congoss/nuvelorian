export function getRequestRatePolicy(method, path, authenticated) {
  const action = String(method || 'GET').toUpperCase();
  const route = String(path || '/');
  // Combat is governed by server-owned inventory, cooldowns and fight state.
  // A generic HTTP quota must not interrupt an authenticated player's battle.
  const combatAttack = action === 'POST' && (/^\/boss-fights\/[^/]+\/attack$/.test(route) || route === '/raid-boss/attack' || /^\/clans\/[^/]+\/ship\/(open|attack|sync)$/.test(route));
  const combatRead = action === 'GET' && (/^\/boss-fights(?:\/[^/]+(?:\/damage-logs(?:\/me)?)?)?$/.test(route) || /^\/raid-boss(?:\/leaderboard)?$/.test(route) || route === '/boss-damage-logs' || route === '/attack-logs' || /^\/clans\/[^/]+\/ship$/.test(route));
  if (authenticated && (combatAttack || combatRead)) return null;
  if (action === 'POST' && route === '/holder-pets/claim') return { bucket: 'nft-pet-claim', limit: 10 };
  if (action === 'GET' && route === '/holder-pet-status') return { bucket: 'nft-pet-check', limit: 20 };
  if (route === '/players/bootstrap') return { bucket: 'bootstrap', limit: authenticated ? 120 : 10 };
  if (action === 'GET' && (route === '/auth/me' || route === '/players/me')) return { bucket: 'profile-read', limit: authenticated ? 240 : 30 };
  // Hashed build assets can number in the hundreds on one scene load. They
  // are public static files, not API reads, and must not starve gameplay.
  if ((action === 'GET' || action === 'HEAD') && route.startsWith('/assets/')) {
    return null;
  }
  if (/^\/apps\/[^/]+\/analytics\//.test(route)) {
    return { bucket: 'analytics', limit: authenticated ? 600 : 600 };
  }
  if (combatAttack) return { bucket: 'boss-attack', limit: 30 };
  if (action === 'GET' || action === 'HEAD') {
    return { bucket: 'read', limit: authenticated ? 480 : 180 };
  }
  if (/^\/players\/[^/]+\/tasks\/complete$/.test(route)) {
    return { bucket: 'quest', limit: authenticated ? 120 : 30 };
  }
  if (/^\/players\/[^/]+$/.test(route) && action === 'PATCH') {
    return { bucket: 'profile', limit: authenticated ? 180 : 30 };
  }
  if (route === '/loot/claim') {
    return { bucket: 'loot', limit: authenticated ? 60 : 30 };
  }
  return { bucket: 'mutation', limit: authenticated ? 120 : 30 };
}
