export function getShipSectorState(module, modules, progress, kills) {
  const previous = modules[module.level - 2];
  const built = (progress[module.id] || 0) >= module.cost;
  const unlocked = !previous || ((progress[previous.id] || 0) >= previous.cost && (kills[previous.id] || 0) > 0);
  const wins = Math.max(0, kills[module.id] || 0);
  const level = Math.min(10, Math.floor(wins / 10));
  return { built, unlocked, wins, level, bonus: level * 2, nextWins: level >= 10 ? 0 : 10 - wins % 10, state: built ? 'built' : unlocked ? 'building' : 'locked', previous };
}
export function getShipGoal(modules, progress, kills) {
  return modules.find(m => (progress[m.id] || 0) < m.cost || !(kills[m.id] > 0)) || modules.at(-1);
}

export function getShipBossRoster(modules, progress) {
  const next = modules.find(module => (progress[module.id] || 0) < module.cost);
  return modules.filter(module => (progress[module.id] || 0) >= module.cost || module.id === next?.id);
}
