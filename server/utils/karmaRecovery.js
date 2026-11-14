// Recover only observable reactions; existing totals are never reduced or added twice.
export function recoverKarma(players = []) {
  const pending = players.filter(p => p.karma_recovery_version !== 1);
  if (!pending.length) return false;
  const byTarget = new Map();
  for (const actor of players) {
    for (const entry of actor.social_reaction_log || []) {
      if (!['like', 'dislike'].includes(entry.type)) continue;
      const key = String(entry.target_id);
      if (!byTarget.has(key)) byTarget.set(key, { like: new Set(), dislike: new Set() });
      byTarget.get(key)[entry.type].add(String(actor.id) + ':' + String(entry.created_at));
    }
  }
  for (const player of pending) {
    const observed = byTarget.get(String(player.id));
    const likes = new Set((player.like_box?.contributions || []).map(e => String(e.sender_id))).size;
    const dislikes = new Set((player.puddle_senders || []).map(e => String(e.sender_id))).size;
    player.likes_received_count = Math.max(Number(player.likes_received_count || 0), likes, observed?.like.size || 0);
    player.dislikes_received_count = Math.max(Number(player.dislikes_received_count || 0), dislikes, observed?.dislike.size || 0);
    player.karma_recovery_version = 1;
  }
  return true;
}
