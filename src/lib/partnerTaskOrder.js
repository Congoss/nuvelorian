export function reorderPartner(partners, id, direction) {
  if (!['up', 'down'].includes(direction)) throw Object.assign(new Error('INVALID_PARTNER_DIRECTION'), {statusCode:400});
  const index = partners.findIndex(partner => partner.id === id);
  if (index < 0) throw Object.assign(new Error('PARTNER_NOT_FOUND'), {statusCode:404});
  const target = index + (direction === 'up' ? -1 : 1);
  if (target < 0 || target >= partners.length) return partners;
  const next = [...partners];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
export function unseenPartnerIds(tasks, seen, claims = {}) {
  return tasks.filter(task => task.enabled !== false && !seen.includes(task.id) && !claims[task.id]).map(task => task.id);
}
