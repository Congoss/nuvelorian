import {BASE_TALENT_DEFS,applyTalentUpgrade} from './talents.js';
import {EQUIPMENT_SET_BALANCE,getBalancedEquipmentItem} from './equipmentBalance.js';
export const DUEL_ACTIONS=['finger','pencil','poison'];
export const DUEL_BEATS={finger:'pencil',pencil:'poison',poison:'finger'};
export const DUEL_SETS=['cardboard_survivor','night_disinfector','nuvelor','set4','set5','anubis','shkraban'];
export const DUEL_SET_NAMES={cardboard_survivor:'Картонний',night_disinfector:'Дезінсектор',nuvelor:'NUVELOR',set4:'Четвертий сет',set5:'П’ятий сет',anubis:'Анубіс',shkraban:'Шкрябан'};
const hpBySlot={head:120,armor:210,legs:160,hands:80,boots:70};
const offense=new Set(['t01','t02','t03','t05','t10','t12','t13','t14','t20','t21','t28','t31','t35','t36','t41','t42','t43','t45','t46','t49','t50','t55','t56','t57','t58','t59','t60']);
const level=v=>Math.max(0,Math.min(15,Math.floor(Number(v)||0)));
function itemSet(item){return Object.entries(EQUIPMENT_SET_BALANCE).find(([,s])=>String(item?.id||'').startsWith(s.prefix+'_'))?.[0];}
function tierPower(item){const s=EQUIPMENT_SET_BALANCE[itemSet(item)];return Math.max(100,160+4*(Number(s?.hit)||10));}
export function duelStats(profile){
 const inv=profile.inventory_items||[],equipped=profile.equipped_items||{};
 const find=slot=>{const item=inv.find(i=>i.id===equipped[slot]&&i.slot===slot);return item?{...getBalancedEquipmentItem(item.id),...item}:null;};
 const weapon=find('weapon');const weaponBase=weapon?tierPower(weapon):100;
 const rawTalentLevels=Number(profile.talent_tree_version)>=2?profile.talent_levels||{}:{};
 const points=Object.entries(rawTalentLevels).reduce((n,[id,v])=>n+(offense.has(id)?Math.max(0,Math.min(10,Number(v)||0)):0),0);
 const talentBonus=Math.min(.3,points*.0025);
 const pet=find('pet'),petBonus=pet?Math.min(.1,(getBalancedEquipmentItem(pet.id)?.bonuses||[]).filter(b=>['small_poison_flat','poison_damage_flat'].includes(b.type)).reduce((n,b)=>n+Number(b.value||0),0)/1000):0;
 const attack=Math.round(weaponBase*(1+level(weapon?.enhancementLevel)*.05)*(1+talentBonus+petBonus));
 const pieces=Object.entries(hpBySlot).map(([slot,base])=>{const i=find(slot);return {slot,id:i?.id||null,enhancement:level(i?.enhancementLevel),hp:i?Math.round(base*tierPower(i)/200*(1+level(i.enhancementLevel)*.05)):0};});
 return {attack,maxHp:200+pieces.reduce((n,i)=>n+i.hp,0),weapon:weapon?.id||null,weaponLevel:level(weapon?.enhancementLevel),talentBonus,petBonus,pieces};
}
export function demoDuelProfile({set='cardboard_survivor',enhancement=15,talents=0}={}){
 if(!DUEL_SETS.includes(set)||!Number.isInteger(enhancement)||enhancement<0||enhancement>15||![0,50,100].includes(talents))throw Error('INVALID_PRESET');
 const prefix=EQUIPMENT_SET_BALANCE[set].prefix,items=['weapon',...Object.keys(hpBySlot)].map(slot=>({id:prefix+'_'+slot,type:'equipment',slot,enhancementLevel:enhancement}));
 // Synthetic sensitivity presets, never written into a game profile.
 let profile={nickname:'NUVELORIAN',level:120,max_energy:100,inventory_items:items,equipped_items:Object.fromEntries(items.map(i=>[i.slot,i.id])),talent_tree_version:2,talent_levels:{},available_talent_points:talents};
 const priorities=[...BASE_TALENT_DEFS].sort((a,b)=>Number(offense.has(b.id))-Number(offense.has(a.id))||a.sectorId-b.sectorId||a.id.localeCompare(b.id));
 while(profile.available_talent_points>0){let changed=false;for(const t of priorities){const patch=applyTalentUpgrade(profile,t.id);if(patch){profile={...profile,...patch};changed=true;break;}}if(!changed)break;}
 return profile;
}
