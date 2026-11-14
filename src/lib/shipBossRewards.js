import { calculateBossReward, getBossResourceRewardMultiplier } from './bossRewardSystem.js';
export const SHIP_FIRST_BOSS_MAX_FUND = Object.freeze({tentacles:1540681,xp:15416,strength:3081,energy:6162});
export function getShipBossRewardFund(level) {
 const rank=Math.min(14,Math.max(1,Math.floor(Number(level)||1)));
 return Object.fromEntries(Object.entries(SHIP_FIRST_BOSS_MAX_FUND).map(([key,value])=>[key,Math.floor(value*Math.sqrt(rank))]));
}
export function calculateShipBossReward({level,...options}) {
 const result=calculateBossReward({...options,availableSpecials:[]});
 if(!result.eligible)return result;
 const fund=getShipBossRewardFund(level);
 const multiplier=result.dailyMultiplier*Math.min(1,result.randomMultiplier/1.15)*Math.min(1,result.rankMultiplier/1.5);
 const resources=Object.entries(fund).map(([type,total])=>({type,qty:Math.floor(total * result.damageShare * multiplier * getBossResourceRewardMultiplier(type))})).filter(drop=>drop.qty>0);
 return {...result,fund,fundMultiplier:multiplier,drops:[...result.drops.filter(drop=>!Object.hasOwn(fund,drop.type)),...resources]};
}
