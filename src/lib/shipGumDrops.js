export const SHIP_GUM_DROP = Object.freeze({minimumDamageShare:0.01,normalChance:0.05,improvedChance:0.01});
const QUEEN_GUM_DROP = Object.freeze({...SHIP_GUM_DROP,normalChance:0.10,improvedChance:0.02});
export function getShipGumDropRates(moduleId){return moduleId==='portal'||moduleId==='ship-portal'?QUEEN_GUM_DROP:SHIP_GUM_DROP;}
