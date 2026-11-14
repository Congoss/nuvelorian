const templates = [
  ['scout', 3, 18, 2, 3, 4], ['loot', 4, 24, 2, 4, 5],
  ['repair', 4, 27, 2, 4, 5], ['trade', 5, 34, 3, 5, 6],
  ['fight', 6, 40, 3, 5, 6], ['cache', 7, 46, 3, 8, 7],
  ['final', 8, 58, 3, 10, 8],
];

export function getQuestMission(id) {
  const match = /^p4-u(0[0-7])-([a-z]+)$/.exec(String(id || ''));
  if (!match) return null;
  const locationIndex = Number(match[1]);
  const taskIndex = templates.findIndex(([slug]) => slug === match[2]);
  if (taskIndex < 0) return null;
  const [, energy, tentacles, strength, xp, target] = templates[taskIndex];
  const ramp = locationIndex < 3 ? locationIndex : 2 + (locationIndex - 2) * 2;
  const multiplier = 1 + locationIndex * 0.16 + Math.max(0, locationIndex - 3) * 0.04;
  return {
    id, locationId: `p4-u${match[1]}`, energy: energy + ramp,
    artifactId: `p4-u${match[1]}-artifact-${taskIndex + 1}`,
    tentacles: tentacles + locationIndex * 12 + taskIndex * locationIndex,
    strength: Math.max(strength, Math.round(strength * multiplier)),
    xp: Math.max(xp, Math.round(xp * multiplier)),
    target: target + Math.floor(locationIndex / 2), successRate: 1,
  };
}
