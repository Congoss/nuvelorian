import { GAME_CONFIG } from './gameConfig.js';
import { buildEffectiveWeapon, getTalentLevels } from './talents.js';
import { getBleedTicks, resolveTalentAttack, resolveTalentBatch } from './talentCombat.js';

export const SHIP_POISON_KEYS = {satchel:'small-poison', f4:'medium-poison', c4:'large-poison'};
export function createShipBossCombat(maxHp = 2000000) {
  return {hp:maxHp,maxHp,damage:0,hits:0,cooldowns:{},stock:{'small-poison':100,'medium-poison':100,'large-poison':100},runtime:{},feedback:null};
}
export function tickShipBossCombat(state, now) {
  if (state.hp <= 0) return state;
  const tick = getBleedTicks(state.runtime, now);
  if (!tick.damage) return state;
  const damage = Math.min(state.hp, tick.damage);
  return {...state,hp:state.hp-damage,damage:state.damage+damage,runtime:tick.state,feedback:{id:now,damage,kind:'bleed'}};
}
export function attackShipBoss(state, id, count = 1, now = Date.now(), profile = {}, random = Math.random) {
  if (state.hp <= 0 || (state.cooldowns[id] || 0) > now) return state;
  const base = GAME_CONFIG.WEAPONS.find(w => w.id === id);
  if (!base) return state;
  const key = SHIP_POISON_KEYS[id];
  const uses = key && [1,5,10,100].includes(count) ? count : 1;
  if (key && state.stock[key] < uses) return state;
  const weapon = buildEffectiveWeapon(base, profile);
  let runtime = state.runtime, damage = 0, consumed = 0, critical = false;
  const batch=resolveTalentBatch({weapon,levels:getTalentLevels(profile),state:runtime,fight:{current_hp:state.hp,max_hp:state.maxHp},now,count:uses,random});
  runtime=batch.state;damage=batch.damage+batch.bleedDamage;critical=batch.isCrit;
  if(key)for(let i=0;i<uses;i++)if(random()>=Number(weapon.saveChance||0))consumed++;
  damage = Math.min(state.hp, damage);
  const cooldowns={...state.cooldowns,[id]:now+weapon.cooldownMin*60000};for(const reset of batch.cooldownResets)delete cooldowns[reset];
  return {...state,hp:state.hp-damage,damage:state.damage+damage,hits:state.hits+uses,runtime,
    cooldowns,
    stock:key?{...state.stock,[key]:state.stock[key]-consumed}:state.stock,
    feedback:{id:now,damage,kind:critical?'critical':key?'poison':'hit',weapon:id}};
}
