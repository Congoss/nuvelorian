export function filterAdminPlayers(players, query) {
  const needle = String(query || '').trim().replace(/^@/, '').toLowerCase();
  if (!needle) return players;
  return players.filter(player => ['nickname','username','id','email','telegram_id','near_wallet_id','created_by'].some(key => String(player[key] || '').toLowerCase().includes(needle)));
}
