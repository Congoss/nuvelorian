export const WORLD_RADIUS = 5;
export const BUILDINGS = ['citadel', 'mine', 'observatory'];
export const hexKey = (q, r) => `${q},${r}`;
export const hexDistance = (a, b) => Math.max(Math.abs(a.q-b.q), Math.abs(a.r-b.r), Math.abs(a.q+a.r-b.q-b.r));
export function worldSeed(id) {
  return Array.from(String(id || 'planet4')).reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
}
export function createWorldMap(seed) {
  const cells = [];
  for (let q=-WORLD_RADIUS; q<=WORLD_RADIUS; q++) for (let r=-WORLD_RADIUS; r<=WORLD_RADIUS; r++) {
    const distance = hexDistance({q,r}, {q:0,r:0});
    if (distance>WORLD_RADIUS) continue;
    const roll = (Math.imul(q+31, 73856093) ^ Math.imul(r+31, 19349663) ^ seed) >>> 0;
    cells.push({q,r,key:hexKey(q,r), kind:distance===0?'home':roll%11<3?'crystal':roll%11<5?'guardian':roll%11===5?'portal':roll%11===6?'ruins':'plain'});
  }
  return cells;
}
export function initialWorld(id) {
  return {version:1,seed:worldSeed(id),q:0,r:0,day:1,moves:18,crystals:0,cleared:[],discovered:createWorldMap(worldSeed(id)).filter(c=>hexDistance(c,{q:0,r:0})<=2).map(c=>c.key),buildings:{citadel:1,mine:0,observatory:0}};
}
export const buildingCost = (level) => 12*(level+1);
