export function getRequestRatePolicy(method, path, authenticated) {
  const action = String(method || 'GET').toUpperCase();
  const route = String(path || '/');
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
  if (action === 'GET' || action === 'HEAD') {
    return { bucket: 'read', limit: authenticated ? 480 : 180 };
  }
  if (/^\/boss-fights\/[^/]+\/attack$/.test(route)) {
    return { bucket: 'boss-attack', limit: authenticated ? 120 : 30 };
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
