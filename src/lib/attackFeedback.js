// Reconcile the existing floating number; never restart it or replace a newer tap.
export function confirmAttackFeedback(current, effectId, hit) {
  if (!current || current.effectId !== effectId || !hit) return current;
  return {...current,...hit,effectId:current.effectId,pending:false};
}
export const ATTACK_FEEDBACK_MS = 2200;

export function confirmedCriticalHit(result, elapsed) {
  if (elapsed >= 8000) return null;
  const hits = Array.isArray(result?.hits) ? result.hits : [result?.hit];
  return hits.findLast(hit => hit?.isCrit === true && !hit.blocked && hit.damage > 0) || null;
}


