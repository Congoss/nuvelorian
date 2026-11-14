export function createPartnerVisits(now = Date.now) {
  const visits = new Map();
  const keyFor = (playerId, partner) => JSON.stringify([playerId, partner.id, partner.link, partner.updated_at || '']);
  return {
    start(playerId, partner) {
      const time = now();
      for (const [key, visit] of visits) if (visit.expiresAt <= time) visits.delete(key);
      const key = keyFor(playerId, partner);
      if (!visits.has(key)) {
        if (visits.size >= 10000) throw new Error('Visit capacity reached');
        visits.set(key, { readyAt: time + 10000, expiresAt: time + 30 * 60 * 1000, repeatRequired: false, repeated: false });
      }
      const visit = visits.get(key);
      if (visit.repeatRequired && !visit.repeated) {
        visit.repeated = true;
        visit.readyAt = time + 10000;
      }
      return { readyInSeconds: Math.max(0, Math.ceil((visits.get(key).readyAt - time) / 1000)) };
    },
    status(playerId, partner) {
      const visit = visits.get(keyFor(playerId, partner));
      if (!visit || visit.expiresAt <= now()) return { status: 'VISIT_REQUIRED' };
      const remaining = Math.ceil((visit.readyAt - now()) / 1000);
      if (remaining > 0) return { status: 'VISIT_WAIT', readyInSeconds: remaining };
      if (!visit.repeated) {
        visit.repeatRequired = true;
        return { status: 'VISIT_REPEAT_REQUIRED' };
      }
      return { status: 'READY' };
    },
    consume(playerId, partner) { visits.delete(keyFor(playerId, partner)); },
  };
}
