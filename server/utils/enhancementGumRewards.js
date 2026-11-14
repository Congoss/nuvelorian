import {getShipGumDropRates} from '../../src/lib/shipGumDrops.js';
export {SHIP_GUM_DROP} from '../../src/lib/shipGumDrops.js';
export function rollShipEnhancementGum({damage,maxHp,moduleId,rng=Math.random}) {
 const rates=getShipGumDropRates(moduleId);
 if(!(Number(maxHp)>0)||!(Number(damage)>=Number(maxHp)*rates.minimumDamageShare))return null;
 const roll=rng();
 const gum=roll<rates.normalChance?'normal':roll<rates.normalChance+rates.improvedChance?'improved':null;
 return gum?{type:'enhancement_gum',id:gum,gum,qty:1}:null;
}
export function grantEnhancementGum(player,drop) {
 if(drop?.type!=='enhancement_gum')return false;
 const gum=drop.gum||drop.id;
 if(!['normal','improved','premium'].includes(gum)||!Number.isSafeInteger(drop.qty)||drop.qty<1)throw Object.assign(new Error('INVALID_GUM_REWARD'),{statusCode:400});
 const balance=Number(player.enhancement_gums?.[gum]||0);
 if(!Number.isSafeInteger(balance+drop.qty))throw new Error('GUM_BALANCE_OVERFLOW');
 player.enhancement_gums={normal:0,improved:0,premium:0,...player.enhancement_gums,[gum]:balance+drop.qty};return true;
}
