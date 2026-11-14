import { getCombatPoisonSlot, countConsumedPoison } from '../../src/lib/combatPoison.js';
import { refundCriticalEnergy } from './energyRefund.js';
import {resetVictoryWeaponCooldowns} from './victoryWeaponCooldowns.js';
import { recordAchievementDamage, poisonCount, recordBossTimeoutAchievement } from './playerAchievements.js';
import { recordBattlePassEvent, recordBattlePassBossVictory } from './battlePass.js';
import { calculateShipBossReward } from '../../src/lib/shipBossRewards.js';
import { rollShipEnhancementGum } from './enhancementGumRewards.js';
import { randomUUID, createHash } from 'node:crypto';
import { SHIP_MODULES } from '../../src/lib/clanShipPreview.js';
import { GAME_CONFIG } from '../../src/lib/gameConfig.js';
import { getShipSectorState } from '../../src/lib/clanShipSectorState.js';
import { buildEffectiveWeapon, getTalentLevels } from '../../src/lib/talents.js';
import { applyTalentCooldownResets, getBleedTicks } from '../../src/lib/talentCombat.js';
import { resolveBossHit } from './bossHit.js';
import { getBossDailyRewardState } from '../../src/lib/bossRewardSystem.js';
import { awardTalentDamage } from '../../src/lib/talentTreeState.js';

const fail=(code,statusCode=400)=>{throw Object.assign(new Error(code),{code,statusCode});};
const clone=value=>JSON.parse(JSON.stringify(value));
export function ensureShip(clan) {
 return clan.ship ||= {version:1,progress:Object.fromEntries(SHIP_MODULES.map(m=>[m.id,0])),kills:{},fights:{},receipts:{},donations:[],lastWinners:{},history:{}};
}
export function lastWinnerProfiles(ship, players = []) {
 const result = {};
 for (const [moduleId, name] of Object.entries(ship.lastWinners || {})) {
  const saved = ship.lastWinnerProfiles?.[moduleId];
  const fight = ship.fights?.[moduleId];
  const winnerId = saved?.id || (fight?.status === 'dead' ? fight.last_hit_player_id : null);
  const matches = winnerId ? players.filter(p => String(p.id) === String(winnerId)) : players.filter(p => (p.nickname || p.username) === name);
  const current = matches.length === 1 ? matches[0] : null;
  result[moduleId] = { id: current?.id || winnerId || null, name: current?.nickname || current?.username || saved?.name || name, avatar: current ? current.avatar || current.photo_url || current.photoUrl || '' : saved?.avatar || '' };
 }
 return result;
}
export function shipView(clan, player, players = []) {
 const ship=ensureShip(clan);
 return {enhancementGums:{normal:0,improved:0,premium:0,...player.enhancement_gums},clanId:String(clan.id),clanName:String(clan.name||''),shipName:String(ship.name||''),canRename:!ship.rename && String(clan.owner_id)===String(player.id),personalKills:player.ship_boss_kills||{},progress:ship.progress,donations:ship.donations.slice(-50),bossKills:ship.kills,lastWinners:ship.lastWinners,lastWinnerProfiles:lastWinnerProfiles(ship,players),wallet:{energy:Number(player.energy||0),max_energy:Number(player.max_energy||0),premium:Number(player.premium||0),tentacles:Number(player.tentacles||0),paidCredit:Number(ship.paidCredit||0)},modules:SHIP_MODULES.map(m=>({...m,state:getShipSectorState(m,SHIP_MODULES,ship.progress,ship.kills)})),fights:Object.fromEntries(Object.entries(ship.fights).map(([id,f])=>[id,{...f,participants:Object.fromEntries(Object.entries(f.participants).map(([pid,p])=>[pid,{playerId:pid,name:p.name,damage:p.damage,hits:p.hits}]))}]))};
}
function once(ship,player,body,action){
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId||''))fail('REQUEST_ID_REQUIRED');
 const key=player.id+':'+body.requestId;
 const fingerprint=createHash('sha256').update(JSON.stringify(body)).digest('hex');
 if(ship.receipts[key]){if(ship.receipts[key].fingerprint!==fingerprint)fail('REQUEST_ID_REUSED',409);return {...ship.receipts[key].result,replayed:true};}
 const result=action();ship.receipts[key]={fingerprint,result:clone(result),at:Date.now()};return result;
}
export function contributeShip(clan,player,body){
 const ship=ensureShip(clan);
 return once(ship,player,body,()=>{
  const module=SHIP_MODULES.find(m=>m.id===body.moduleId);if(!module)fail('SHIP_MODULE_NOT_FOUND',404);
  const sector=getShipSectorState(module,SHIP_MODULES,ship.progress,ship.kills);if(!sector.unlocked||sector.built)fail('SHIP_SECTOR_UNAVAILABLE',409);
  const currency={tentacles:{field:'tentacles',rate:1},paid_credit:{field:'paidCredit',rate:1}}[body.currency];
  const source=body.currency==='paid_credit'?ship:player;
  if(!currency)fail('SHIP_CURRENCY_UNAVAILABLE');
  if(!Number.isSafeInteger(body.amount)||body.amount<1)fail('INVALID_AMOUNT');
  const amount=Math.min(body.amount,Math.ceil((module.cost-Number(ship.progress[module.id]||0))/currency.rate));
  if(Number(source[currency.field]||0)<amount)fail('NOT_ENOUGH_RESOURCES',409);
  source[currency.field]=Number(source[currency.field]||0)-amount;
  const applied=Math.min(module.cost-Number(ship.progress[module.id]||0),amount*currency.rate);
  ship.progress[module.id]=Number(ship.progress[module.id]||0)+applied;
  ship.donations.push({playerId:player.id,moduleId:module.id,currency:body.currency,amount,applied,at:Date.now()});
  return {amount,applied,moduleId:module.id};
 });
}
export function openShipFight(clan,player,body,now=Date.now()){
 const ship=ensureShip(clan);return once(ship,{id:'open:'+player.id},body,()=>{
 const module=SHIP_MODULES.find(m=>m.id===body.moduleId);if(!module)fail('SHIP_MODULE_NOT_FOUND',404);
 if(!getShipSectorState(module,SHIP_MODULES,ship.progress,ship.kills).built)fail('SHIP_SECTOR_NOT_BUILT',403);
 let fight=ship.fights[module.id];if(fight?.status==='active'){fight.escaped_player_ids=(fight.escaped_player_ids||[]).filter(id=>String(id)!==String(player.id));fight.joined_player_ids=[...new Set([...(fight.joined_player_ids||[]),String(player.id)])];return {fightId:fight.id};}
 if(fight?.status==='dead'&&(player.pending_boss_boxes||[]).some(box=>box.fightId===fight.id))return {fightId:fight.id};
 if(fight){ship.history||={};ship.history[fight.id]=fight;}
 const maxHp=module.level*2000000;
 fight={id:randomUUID(),moduleId:module.id,boss_id:'ship-'+module.id,current_hp:maxHp,max_hp:maxHp,status:'active',started_at:new Date(now).toISOString(),ends_at:new Date(now+6*3600000).toISOString(),participants:{},joined_player_ids:[String(player.id)],rewarded:false};
 ship.fights[module.id]=fight;return {fightId:fight.id};
 });
}
export function attackShipFight(clan,player,players,body,options={}){
 const ship=ensureShip(clan);
 // One receipt covers the whole batch, so a retried batch is replayed, never re-applied.
 if(Object.hasOwn(body,'presses'))return once(ship,{id:'combat:'+player.id},body,()=>applyShipPresses(clan,player,players,body,options));
 return once(ship,{id:'combat:'+player.id},body,()=>applyShipAttack(clan,player,players,body,options));
}
const SHIP_PRESS_LIMIT=50;
// Each press runs the unchanged single-attack rules in order on the same draft.
function applyShipPresses(clan,player,players,body,options){
 const presses=body.presses;
 if(!Array.isArray(presses)||presses.length<1||presses.length>SHIP_PRESS_LIMIT)fail('INVALID_COMBAT_PRESSES');
 for(const press of presses)if(typeof press?.weaponId!=='string'||![1,5,10,100].includes(press.multiplier??1))fail('INVALID_COMBAT_PRESSES');
 const hits=[];let rejected=null,last=null;
 for(let index=0;index<presses.length;index++){
  try{last=applyShipAttack(clan,player,players,{moduleId:body.moduleId,fightId:body.fightId,weaponId:presses[index].weaponId,multiplier:presses[index].multiplier??1},options);}
  catch(error){if(!hits.length)throw error;rejected={index,code:error.code||'API_ERROR',message:error.message||''};break;}
  hits.push({damage:last.damage,isCrit:last.isCrit,boneCurseApplied:last.boneCurseApplied});
  if(last.status!=='active'){if(index<presses.length-1)rejected={index:index+1,code:'SHIP_FIGHT_NOT_ACTIVE',message:''};break;}
 }
 return {...last,damage:hits.reduce((sum,hit)=>sum+Number(hit.damage||0),0),isCrit:hits.some(hit=>hit.isCrit),boneCurseApplied:hits.some(hit=>hit.boneCurseApplied),hits,processed:hits.length,rejected};
}
function applyShipAttack(clan,player,players,body,{now=Date.now(),rng=Math.random,rewardConfig}={}){
 const ship=ensureShip(clan);{
 const fight=ship.fights[body.moduleId];if(!fight||fight.id!==body.fightId||fight.status!=='active')fail('SHIP_FIGHT_NOT_ACTIVE',409);
 if((fight.escaped_player_ids||[]).map(String).includes(String(player.id)))fail('SHIP_FIGHT_LEFT',409);
 const base=GAME_CONFIG.WEAPONS.find(w=>w.id===body.weaponId);if(!base)fail('INVALID_WEAPON');
 const count=body.multiplier??1;if(![1,5,10,100].includes(count))fail('INVALID_MULTIPLIER');
 const poisonKey=getCombatPoisonSlot(base.id);if(!poisonKey&&count!==1)fail('INVALID_MULTIPLIER');
 const weapon=buildEffectiveWeapon(base,player),last=Date.parse(player.weapon_cooldowns?.[base.id]||'');
 if(Number.isFinite(last)&&now-last<weapon.cooldownMin*60000)fail('SKILL_COOLDOWN_ACTIVE',409);
 if(poisonKey&&Number(player.weapon_inventory?.[poisonKey]||0)<count)fail('NO_POISON_INVENTORY',409);
 const contribution=fight.participants[player.id]||{name:player.nickname||player.username,damage:0,hits:0,refund:{},runtime:{}};
 const levels = getTalentLevels(player);
 const talentBatch = resolveBossHit({ player, weapon, levels, state: contribution.runtime, fight, clan, now, count, random: rng });
 const { state: runtime, damage, isCrit, poisonDamage } = talentBatch;
 const consumed = poisonKey && !talentBatch.refundBatch ? countConsumedPoison(count, weapon.saveChance, rng) : 0;
 refundCriticalEnergy(player,isCrit,levels,rng);
 const hpBefore=fight.current_hp;
 const lastPoisonSaved=Boolean(poisonKey)&&count===1&&consumed===0&&poisonCount(player)===1;
 const actual=Math.min(fight.current_hp,damage);
 if(poisonKey){player.weapon_inventory={...player.weapon_inventory,[poisonKey]:Number(player.weapon_inventory[poisonKey])-consumed};const type=poisonKey.replace('-poison','');contribution.refund[type]=Number(contribution.refund[type]||0)+consumed*Math.min(hpBefore,poisonDamage)/Math.max(1,poisonDamage);}
 player.weapon_cooldowns={...player.weapon_cooldowns,[base.id]:new Date(now).toISOString()};
 applyTalentCooldownResets(player,talentBatch);
 player.boss_hits_today=Number(player.boss_hits_today||0)+count;
 player.boss_damage_today=Number(player.boss_damage_today||0)+actual;
 player.boss_damage_lifetime=Number(player.boss_damage_lifetime||0)+actual;
 recordBattlePassEvent(player,{type:'boss',damage:actual,smallPoison:!talentBatch.blocked&&base.id==='satchel'},now);
 if(poisonKey)Object.assign(player,awardTalentDamage(player,Math.min(hpBefore,poisonDamage)));
 contribution.damage+=actual;contribution.hits+=count;contribution.runtime=runtime;fight.participants[player.id]=contribution;fight.current_hp-=actual;fight.combat_revision=(Number(fight.combat_revision)||0)+1;
 recordAchievementDamage({fight,player,players,hpBefore,damage:actual,weaponId:base.id,lastPoisonSaved,now});
 if(fight.current_hp===0){fight.last_hit_player_id=player.id;fight.last_hit_player_name=contribution.name;settleShipFight(clan,fight,players,{now,rng,rewardConfig});}
 return {fightId:fight.id,damage:actual,isCrit,boneCurseApplied:talentBatch.boneCurseApplied,status:fight.status,current_hp:fight.current_hp};
 }
}
export function tickShipFight(clan,fight,players,options={}){
 if(fight.status!=='active')return false;
 const now=options.now??Date.now(),deadline=Date.parse(fight.ends_at||''),until=Number.isFinite(deadline)?Math.min(now,deadline):now;
 let changed=false;
 for(const [id,contribution] of Object.entries(fight.participants)){
  const tick=getBleedTicks(contribution.runtime,until);if(tick.state!==contribution.runtime)changed=true;contribution.runtime=tick.state;
  const hpBefore=fight.current_hp;
  const damage=Math.min(fight.current_hp,tick.damage);if(damage){changed=true;contribution.damage+=damage;fight.current_hp-=damage;fight.combat_revision=(Number(fight.combat_revision)||0)+1;}
  recordAchievementDamage({fight,player:players.find(p=>String(p.id)===id),players,hpBefore,damage,bleed:true,now:until});
  if(fight.current_hp===0){fight.last_hit_player_id=id;fight.last_hit_player_name=contribution.name;settleShipFight(clan,fight,players,{...options,now:until});break;}
 }
 if(fight.status==='active'&&Number.isFinite(deadline)&&now>=deadline){fight.status='expired';fight.ended_at=new Date(deadline).toISOString();recordBossTimeoutAchievement(fight,players,now);changed=true;}
 return changed;
}
function settleShipFight(clan,fight,players,{now=Date.now(),rng=Math.random,rewardConfig}={}){
 if(fight.rewarded)return;const ship=ensureShip(clan);fight.status='dead';fight.ended_at=new Date(now).toISOString();fight.rewarded=true;
 ship.kills[fight.moduleId]=Number(ship.kills[fight.moduleId]||0)+1;
 const rows=Object.entries(fight.participants).filter(([,p])=>p.damage>0).sort((a,b)=>b[1].damage-a[1].damage);
 ship.lastWinners[fight.moduleId]=fight.last_hit_player_name||rows[0]?.[1]?.name||'';
 const winnerId=fight.last_hit_player_id||rows[0]?.[0];
 const winner=players.find(p=>String(p.id)===String(winnerId));
 ship.lastWinnerProfiles={...ship.lastWinnerProfiles,[fight.moduleId]:{id:winnerId||null,name:winner?.nickname||winner?.username||ship.lastWinners[fight.moduleId],avatar:winner?.avatar||winner?.photo_url||winner?.photoUrl||''}};
 rows.forEach(([id,contribution],index)=>{
  const player=players.find(p=>String(p.id)===id);if(!player)return;
  resetVictoryWeaponCooldowns(player);
  recordBattlePassBossVictory(player,fight.id,Math.max(0,(SHIP_MODULES.find(m=>m.id===fight.moduleId)?.level||1)-1),now);
  const daily=getBossDailyRewardState(player.boss_daily_rewards,fight.boss_id,now);
  const reward=calculateShipBossReward({level:SHIP_MODULES.find(m=>m.id===fight.moduleId)?.level||1,bossId:fight.boss_id,maxHp:fight.max_hp,actualDamageTotal:contribution.damage,poisonRefundUnits:contribution.refund,carries:{poison:player.poison_refund_progress||{}},rank:index+1,dailyKillNumber:daily.killNumber,availableSpecials:[],rng,...(rewardConfig?{config:rewardConfig}:{})});
  if(reward.eligible){const gum=rollShipEnhancementGum({damage:contribution.damage,maxHp:fight.max_hp,moduleId:fight.moduleId||fight.boss_id,rng});if(gum)reward.drops.push(gum);player.poison_refund_progress=reward.carries.poison;player.boss_daily_rewards=daily.state;player.pending_boss_boxes=[...(player.pending_boss_boxes||[]),{instanceId:'ship-box-'+fight.id+'-'+id,fightId:fight.id,bossId:fight.boss_id,boxType:reward.boxType,rewardFormula:'boss_v2',rewardBalanceVersion:2,rewardSnapshot:reward.drops,damage:contribution.damage,maxHp:fight.max_hp,bossDefeated:true}];}
  player.ship_boss_kills={...player.ship_boss_kills,[fight.moduleId]:Number(player.ship_boss_kills?.[fight.moduleId]||0)+1};
 });
}

// Called only after the payment provider confirms this bound order.
export function applyShipConstructionPayment(clan,transaction,item) {
 if(transaction.status!=='success'||!['near','telegram_stars'].includes(transaction.payment_method)||transaction.item_id!==item.id||String(clan.id)!==item.clanId)fail('INVALID_SHIP_PAYMENT',403);
 const ship=ensureShip(clan);
 return once(ship,{id:'payment:'+transaction.user_id},{requestId:transaction.id,moduleId:item.moduleId,units:item.constructionUnits},()=>{
  const module=SHIP_MODULES.find(m=>m.id===item.moduleId);if(!module)fail('SHIP_MODULE_NOT_FOUND',404);
  ship.paidCredit=Number(ship.paidCredit||0)+item.constructionUnits;
  const sector=getShipSectorState(module,SHIP_MODULES,ship.progress,ship.kills);
  const applied=sector.unlocked&&!sector.built?Math.min(module.cost-Number(ship.progress[module.id]||0),ship.paidCredit):0;
  ship.progress[module.id]=Number(ship.progress[module.id]||0)+applied;ship.paidCredit-=applied;
  ship.donations.push({playerId:transaction.user_id,moduleId:module.id,currency:transaction.payment_method,amount:transaction.amount_paid,applied,credited:item.constructionUnits,paymentId:transaction.id,at:Date.now()});
  return {moduleId:module.id,applied,credited:item.constructionUnits};
 });
}

export function escapeShipFight(fight,player){const id=String(player.id);if(!fight.participants?.[id]&&!(fight.joined_player_ids||[]).map(String).includes(id)&&!(fight.escaped_player_ids||[]).map(String).includes(id))throw Object.assign(new Error('SHIP_FIGHT_NOT_JOINED'),{statusCode:403});fight.escaped_player_ids=[...new Set([...(fight.escaped_player_ids||[]).map(String),id])];fight.joined_player_ids=(fight.joined_player_ids||[]).filter(pid=>String(pid)!==id);return {fightId:fight.id,status:fight.status,damage:0,escaped:true};}
