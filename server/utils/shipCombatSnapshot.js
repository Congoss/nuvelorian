const fields=['id','level','xp','xp_to_next_level','energy','max_energy','tentacles','premium','weapon_inventory','weapon_cooldowns','keycards','roulette_bonus_spins','player_achievements','battle_pass','battle_pass_archive','talent_tree_version','legacy_talent_levels','talent_levels','available_talent_points','total_talent_points_earned','total_talent_points_spent','talent_damage_progress','next_talent_threshold_index','unlocked_talent_sectors','talent_combat_state','talent_base_max_energy','talent_points','boss_talent_progress','boss_talent_level','boss_talent_progress_goal','pending_boss_boxes','boss_daily_rewards','ship_boss_kills','boss_hits_today','boss_damage_today','boss_damage_lifetime','poison_refund_progress'];
export function shipCombatPlayerSnapshot(player, runtimeKeys=null){
 // These fields drive the exact damage/crit/preservation calculation. Keeping
 // an old open-screen loadout while updating talents produces false lethal HP.
 const combatFields=[...fields,'equipped_items','inventory_items','collection_items','advanced_attacks','bone_curse'];
 const snapshot=Object.fromEntries(combatFields.filter(key=>Object.hasOwn(player,key)).map(key=>[key,player[key]]));
 if(runtimeKeys) snapshot.talent_combat_state=Object.fromEntries([...new Set(runtimeKeys)].filter(key=>Object.hasOwn(player.talent_combat_state||{},key)).map(key=>[key,player.talent_combat_state[key]]));
 return structuredClone(snapshot);
}
export function shipSyncNeedsTick(fight,now){
 if(!fight||fight.status!=='active'||Date.parse(fight.ends_at)<=now)return true;
 return Object.values(fight.participants||{}).some(p=>{
  const b=p.runtime?.bleed;if(!b)return false;
  return now>=Number(b.expiresAt)||Math.min(now,Number(b.expiresAt))-Number(b.lastTickAt)>=1000;
 });
}

// Combat mutates one module, its receipt and victory counters. Historical fights
// and construction records are immutable here; do not deep-clone them per tap.
export function shipCombatDraft(ship,moduleId,fightId){
 const draft={...ship,fights:{...ship.fights},history:{...ship.history},receipts:{...ship.receipts},kills:{...ship.kills},lastWinners:{...ship.lastWinners},lastWinnerProfiles:{...ship.lastWinnerProfiles}};
 if(ship.fights?.[moduleId])draft.fights[moduleId]=structuredClone(ship.fights[moduleId]);
 if(fightId && ship.history?.[fightId])draft.history[fightId]=structuredClone(ship.history[fightId]);
 return draft;
}

export function shipCombatCheckpoint(ship,moduleId,fightId,receiptKey){
 return JSON.stringify({fight:ship.fights?.[moduleId],historicalFight:ship.history?.[fightId],receipt:ship.receipts?.[receiptKey],kills:ship.kills,lastWinners:ship.lastWinners,lastWinnerProfiles:ship.lastWinnerProfiles});
}

// Capture only the locations combat can modify. Opening a new encounter can
// also archive the previous fight under its ID.
export function captureShipCombatChanges(ship, moduleId, fightId, receiptKey) {
 const paths = [
  ['fights', moduleId], ['receipts', receiptKey], ['kills', moduleId],
  ['lastWinners', moduleId], ['lastWinnerProfiles', moduleId],
  ...[...new Set([fightId, ship.fights?.[moduleId]?.id].filter(Boolean))].map(id => ['history', id]),
 ];
 const before = paths.map(([field, key]) => JSON.stringify(ship[field]?.[key]));
 return () => {
  const patch = {};
  for (const [i, [field, key]] of paths.entries()) {
   const value = ship[field]?.[key];
   if (JSON.stringify(value) !== before[i]) (patch[field] ||= {})[key] = value;
  }
  return patch;
 };
}
