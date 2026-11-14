import {createHash} from 'node:crypto';
import {recordGumAchievement} from './playerAchievements.js';
import {ENHANCEMENT_CONFIG as CONFIG} from './enhancementDemo.js';
import {getBalancedEquipmentItem} from '../../src/lib/equipmentBalance.js';
const slots=new Set(['weapon','head','hands','armor','legs','boots']);
const fail=(code,statusCode=400)=>{throw Object.assign(new Error(code),{code,statusCode})};
const eligible=item=>item?.type==='equipment'&&slots.has(item.slot||getBalancedEquipmentItem(item.id)?.slot)&&Number(item.count??1)>0;
export function forgeState(player){
 const seen=new Set(),items=[];
 for(const item of player.inventory_items||[]){if(!eligible(item)||seen.has(item.id))continue;seen.add(item.id);items.push({itemId:item.id,instanceId:item.id,enhancementLevel:Math.max(0,Math.min(15,Math.floor(Number(item.enhancementLevel)||0))),version:Number(item.enhancementVersion)||0})}
 return {level:Number(player.level)||1,gums:{normal:0,improved:0,premium:0,...player.enhancement_gums},items,settings:{normal:null,improved:null,pct:CONFIG.poisonPctPerLevel},bossClaims:0};
}
export function enhanceEquipment(player,body,{rng=Math.random}={}){
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId||''))fail('REQUEST_ID_REQUIRED');
 if(body.action!=='enhance')fail('UNKNOWN_ACTION');
 const fingerprint=createHash('sha256').update(JSON.stringify([body.action,body.instanceId,body.version,body.gum])).digest('hex');
 const prior=player.forge_receipts?.[body.requestId];
 if(prior){if(prior.fingerprint!==fingerprint)fail('REQUEST_ID_REUSED',409);return {state:forgeState(player),result:prior.result,replayed:true}}
 if(Number(player.level)<CONFIG.unlockLevel)fail('LEVEL_70_REQUIRED',403);
 const item=(player.inventory_items||[]).find(i=>i.id===body.instanceId);if(!eligible(item))fail('ITEM_NOT_OWNED',403);
 const level=Math.max(0,Math.min(15,Math.floor(Number(item.enhancementLevel)||0))),version=Number(item.enhancementVersion)||0;
 if(!Number.isInteger(body.version)||version!==body.version)fail('STALE_ITEM',409);
 if(level>=CONFIG.maxLevel)fail('MAX_ENHANCEMENT');
 if(!['normal','improved','premium'].includes(body.gum))fail('INVALID_GUM');
 const balance=Number(player.enhancement_gums?.[body.gum]||0);if(!Number.isSafeInteger(balance)||balance<1)fail('NO_GUM');
 const chance=body.gum==='premium'?100:CONFIG[body.gum==='normal'?'normalChances':'improvedChances'][level];
 const success=body.gum==='premium'||rng()*100<chance,after=success?level+1:Math.max(0,level-1);
 player.enhancement_gums={normal:0,improved:0,premium:0,...player.enhancement_gums,[body.gum]:balance-1};
 item.enhancementLevel=after;item.enhancementVersion=version+1;
 recordGumAchievement(player,success);
 const result={type:'enhance',instanceId:item.id,gum:body.gum,chance,success,before:level,after};
 player.forge_receipts={...player.forge_receipts,[body.requestId]:{fingerprint,result}};
 return {state:forgeState(player),result};
}
