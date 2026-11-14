import { getCombatPoisonSlot } from './combatPoison.js';
import { isOlderCombatSnapshot } from './combatSnapshotOrder.js';
import { GAME_CONFIG, getCollectionDamageBonus } from './gameConfig.js';
import { buildEffectiveWeapon } from './talents.js';
import { resolveTalentAttack, resolveTalentBatch } from './talentCombat.js';
import { awardTalentDamage } from './talentTreeState.js';


// Acknowledged hits are already in the response. Replay only unsent/unconfirmed
// taps, rebuilding marks, stock and HP from the same authoritative checkpoint.
export function rebasePoisonQueue(previous, result, pending, mode = 'personal') {
  if (!result?.fight || !result?.player) return null;
  const checkpoint = {
    fight: previous?.confirmedFight,
    player: previous?.confirmedProfile,
    playerDamageLog: previous?.confirmedDamageLog,
  };
  if (checkpoint.player && isOlderCombatSnapshot(checkpoint, result)) result = checkpoint;
  let view = {fight:result.fight,profile:{...previous?.profile,...result.player},damageLog:result.playerDamageLog || null,
    confirmedFight:result.fight,confirmedProfile:{...previous?.profile,...result.player},confirmedDamageLog:result.playerDamageLog || null};
  for (const entry of pending) {
    if (entry.fightId !== view.fight.id) continue;
    const projected = projectPoisonTap(view,{weaponId:entry.weapon.id,count:entry.multiplier,mode,now:entry.projectedAt ?? entry.queuedAt});
    if (projected) view = projected;
  }
  // Keep the tap totals stable while replies for a rapid series arrive one at
  // a time. The final response replaces the estimate in a single update.
  const hasPendingHits = pending.some(entry => entry.fightId === view.fight.id);
  view.holdVictoryPreview = hasPendingHits && view.fight.status === 'active'
    && previous?.fight?.id === view.fight.id
    && Boolean(previous.pendingDefeat || previous.holdVictoryPreview);
  view.displayDamageLog = hasPendingHits
    ? previous?.displayDamageLog || previous?.damageLog || view.damageLog
    : view.damageLog;
  // Intermediate acknowledgements can change the estimate as queued taps are
  // replayed. Hold the displayed bar until the queue drains.
  if (hasPendingHits && view.fight.current_hp > 0) {
    const previousHp = previous?.displayHp ?? previous?.fight?.current_hp;
    if (previous?.fight?.id === view.fight.id && previousHp > 0) {
      view.displayHp = Math.min(previousHp, view.fight.current_hp);
    }
  }
  return view;
}

// Local presentation only. Server responses still own inventory, rewards and
// victory. Advance the same talent state on every tap, not on network replies.
export function projectPoisonTap(view, { weaponId, count = 1, mode = 'personal', now = Date.now() }) {
  const key = getCombatPoisonSlot(weaponId);
  const base = GAME_CONFIG.WEAPONS.find(weapon => weapon.id === weaponId);
  const basic = ['fist','knuckle'].includes(weaponId);
  if (view?.pendingDefeat || !view?.fight || view.fight.status !== 'active' || (!key && !basic) || !base || ![1,5,10,100].includes(count) || (basic && count!==1)) return null;
  const { profile, fight } = view;
  const stock = Number(profile.weapon_inventory?.[key] || 0);
  const hp = Math.max(0, Number(fight.current_hp) || 0);
  if ((key && stock < count) || !hp) return null;
  const weapon = buildEffectiveWeapon(base, profile);
  const last=Date.parse(profile.weapon_cooldowns?.[weaponId] || '') || 0;
  if(basic && last && now-last < weapon.cooldownMin*60000)return null;
  const multiplier = (mode !== 'raid' ? getCollectionDamageBonus(profile) : 1)
    * (1 + Number(weapon.equipmentBossDamagePct || 0));
  const stateKey = mode === 'raid' ? `raid:${fight.id || 'active'}` : fight.id;
  let runtime = profile.talent_combat_state?.[stateKey] || {};
  let damage = 0, poisonDamage = 0, isCrit = false;
  const hit=resolveTalentBatch({weapon,levels:Number(profile.talent_tree_version||0)>=2?profile.talent_levels||{}:{},state:runtime,fight,now,count,random:()=>1-Number.EPSILON});
  runtime=hit.state;
  // Closed armor must await the authoritative block roll, not invent successful damage.
  const uncertainArmor=fight.boss_id==='boss8'&&Number(profile.talent_combat_state?.[stateKey]?.breachUntil||0)<=now;
  damage=uncertainArmor?0:mode==='ship'?Math.floor(hit.damage*multiplier)+hit.bleedDamage:hit.damage+hit.bleedDamage;
  poisonDamage=uncertainArmor?0:hit.damage;isCrit=hit.isCrit;
  damage = Math.min(hp, Math.max(0, Math.floor(damage * (mode === 'ship' ? 1 : multiplier))));
  const nextProfile = {
    ...(key || mode==='ship' ? awardTalentDamage(profile, mode === 'ship' ? damage : Math.min(damage, Math.floor(poisonDamage * multiplier))) : profile),
    weapon_inventory: key ? { ...profile.weapon_inventory, [key]: stock - count } : profile.weapon_inventory,
    weapon_cooldowns: basic ? {...profile.weapon_cooldowns,[weaponId]:new Date(now).toISOString()} : profile.weapon_cooldowns,
    talent_combat_state: { ...profile.talent_combat_state, [stateKey]: runtime },
  };
  const displayBase = view.displayDamageLog || view.damageLog;
  return {
    // HP and damage use the same estimate; victory still waits for confirmation.
    fight: { ...fight, current_hp: Math.max(0, hp - damage) }, pendingDefeat: damage >= hp, profile: nextProfile,
    ...(view.displayHp > 0 && damage < hp ? {displayHp: Math.min(view.displayHp, hp - damage)} : {}),
    confirmedFight:view.confirmedFight || fight,confirmedProfile:view.confirmedProfile || profile,confirmedDamageLog:view.confirmedDamageLog ?? view.damageLog ?? null,
    damageLog: { ...view.damageLog, damage: Number(view.damageLog?.damage || 0) + damage, hits: Number(view.damageLog?.hits || 0) + count },
    displayDamageLog: { ...displayBase, damage: Number(displayBase?.damage || 0) + damage, hits: Number(displayBase?.hits || 0) + count },
    hit: { damage, isCrit },
  };
}
