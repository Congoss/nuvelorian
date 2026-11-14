export const COLLECTION_REWARDS = {
  'p4-u00': { mediumPoison: 1, tentacles: 1800, energy: 45, weapon: ['small-poison', 1] },
  'p4-u01': { mediumPoison: 1, tentacles: 2250, strength: 10, energy: 54, weapon: ['small-poison', 2] },
  'p4-u02': { largePoison: 1, tentacles: 2700, strength: 15, energy: 63, weapon: ['medium-poison', 3] },
  'p4-u03': { largePoison: 1, tentacles: 4050, strength: 20, energy: 90, freeSpins: 1, weapon: ['small-poison', 3] },
  'p4-u04': { largePoison: 2, tentacles: 5850, strength: 30, energy: 117, weapon: ['medium-poison', 1] },
  'p4-u05': { largePoison: 2, tentacles: 7200, strength: 40, energy: 135, freeSpins: 1, weapon: ['large-poison', 1] },
  'p4-u06': { largePoison: 3, tentacles: 9000, strength: 60, energy: 171, freeSpins: 2, weapon: ['medium-poison', 2] },
  'p4-u07': { largePoison: 4, tentacles: 11700, strength: 80, energy: 198, freeSpins: 2, weapon: ['large-poison', 1] },
};

export function getQuestCollectionDrops(locationId) {
  const reward = COLLECTION_REWARDS[locationId];
  if (!reward) return [];
  const weapons = new Map();
  for (const [field, id] of [['smallPoison','small-poison'],['mediumPoison','medium-poison'],['largePoison','large-poison']]) {
    if (reward[field]) weapons.set(id, reward[field]);
  }
  if (reward.weapon) weapons.set(reward.weapon[0], (weapons.get(reward.weapon[0]) || 0) + reward.weapon[1]);
  const drops = [...weapons].map(([id, qty]) => ({type:'weapon', id, qty}));
  for (const field of ['tentacles','premium','strength','energy','freeSpins']) {
    if (reward[field]) drops.push({type:field === 'freeSpins' ? 'spin' : field, qty:reward[field]});
  }
  return drops;
}
