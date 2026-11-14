// Group only links already verified by the game. This is not a Sybil detector.
export function marketIdentity(player) {
  if(player?.near_wallet_verified===true && player.near_wallet_id)return 'near:'+String(player.near_wallet_id).trim().toLowerCase();
  if(player?.telegram_id)return 'telegram:'+String(player.telegram_id);
  return 'player:'+String(player?.id);
}
