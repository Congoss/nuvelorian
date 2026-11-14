export function combatSnapshotDecision(previous, next) {
 if(previous?.fight?.id && previous.fight.id===next?.fight?.id){
  const previousRevision=previous.fight.combat_revision,nextRevision=next.fight.combat_revision;
  if(Number.isSafeInteger(previousRevision)&&Number.isSafeInteger(nextRevision)){
   if(nextRevision<previousRevision)return {accept:false,reason:'older_revision'};
   if(nextRevision>previousRevision)return {accept:true,reason:'newer_revision'};
   const previousHp=Number(previous.fight.current_hp),nextHp=Number(next.fight.current_hp);
   if(Number.isFinite(previousHp)&&Number.isFinite(nextHp)&&previousHp!==nextHp&&!previous.fight.client_projected){
    return {accept:false,reason:'same_revision_hp_conflict'};
   }
   return {accept:true,reason:previous.fight.client_projected?'projected_confirmation':'same_revision'};
  }
  const before=Number(previous.fight.current_hp),after=Number(next.fight.current_hp);
  const beforeHits=Number(previous.playerDamageLog?.hits),afterHits=Number(next.playerDamageLog?.hits);
  const beforeDamage=Number(previous.playerDamageLog?.damage || 0),afterDamage=Number(next.playerDamageLog?.damage || 0);
  if((next.playerDamageLog !== undefined && afterDamage < beforeDamage)||
    (Number.isFinite(before)&&Number.isFinite(after)&&after>before)||
    (previous.fight.status==='dead'&&next.fight.status==='active')||
    (Number.isFinite(beforeHits)&&Number.isFinite(afterHits)&&afterHits<beforeHits))return {accept:false,reason:'legacy_rollback'};
 }
 return {accept:true,reason:'legacy_or_new_fight'};
}

export function isOlderCombatSnapshot(previous, next) {
 return !combatSnapshotDecision(previous,next).accept;
}
