export function selectGiftAudience(players, target = {}) {
  for (const key of ['minLevel', 'maxLevel', 'minStrength', 'maxStrength']) {
    if (target[key] != null && target[key] !== '' && (!Number.isFinite(Number(target[key])) || Number(target[key]) < 0)) throw new Error('Invalid audience threshold');
  }
  if (target.minLevel != null && target.maxLevel != null && Number(target.minLevel) > Number(target.maxLevel)) throw new Error('Minimum level exceeds maximum');
  if (target.battlePass && !['any', 'paid', 'free', 'epic', 'legendary'].includes(target.battlePass)) throw new Error('Invalid Battle Pass filter');
  return players.filter(player => {
    if (player.is_banned) return false;
    if (target.playerId && String(player.id) !== String(target.playerId)) return false;
    for (const [key, field, fallback, minimum] of [['minLevel', 'level', 1, true], ['maxLevel', 'level', 1, false], ['minStrength', 'stat_strength', 0, true], ['maxStrength', 'stat_strength', 0, false]]) {
      if (target[key] != null && target[key] !== '' && (minimum ? Number(player[field] ?? fallback) < Number(target[key]) : Number(player[field] ?? fallback) > Number(target[key]))) return false;
    }
    const tier = player.battle_pass?.tier || 'free';
    if (target.battlePass === 'paid' && !['epic', 'legendary'].includes(tier)) return false;
    if (['free', 'epic', 'legendary'].includes(target.battlePass) && tier !== target.battlePass) return false;
    if (target.walletRequired && (!player.near_wallet_verified || !String(player.near_wallet_id || '').trim())) return false;
    return true;
  });
}
