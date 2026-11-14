export function findAvailableRevenge(logs, player, target, requested, now = Date.now()) {
  if (requested !== true) return null;
  return logs.find(log => {
    const age = now - Date.parse(log.created_date || '');
    return log.attacker_email === target.created_by && log.defender_email === player.created_by
      && log.success === true && !log.revenge_used_at && age >= 0 && age < 86400000;
  }) || null;
}
