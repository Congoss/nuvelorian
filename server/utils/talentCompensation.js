import { migrateTalentTreeState } from '../../src/lib/talentTreeState.js';

export function compensateTalentPoints(player, amount, requestId) {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000 ||
      typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(requestId)) {
    throw Object.assign(new Error('Invalid talent compensation'), { statusCode: 400, code: 'TALENT_COMPENSATION_INVALID' });
  }
  const history = player.talent_compensation_history || [];
  const previous = history.find(entry => entry.requestId === requestId);
  if (previous) return { granted: previous.amount, alreadyGranted: true };
  const next = migrateTalentTreeState(player);
  const available = Math.max(0, Number(next.available_talent_points || 0));
  const earned = Math.max(Number(next.total_talent_points_earned || 0), available + Number(next.total_talent_points_spent || 0));
  Object.assign(player, next, {
    available_talent_points: available + amount,
    talent_points: available + amount,
    total_talent_points_earned: earned + amount,
    talent_compensation_history: [...history, { requestId, amount, before: available, after: available + amount, created_at: new Date().toISOString() }].slice(-100),
  });
  return { granted: amount, alreadyGranted: false };
}
