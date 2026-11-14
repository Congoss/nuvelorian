import {SKELETON_BP_EQUIPMENT} from './skeletonBattlePassSet.js';
// Reserve each accepted tap immediately; send in order so slow responses cannot
// overwrite newer inventory or spend the same dose twice. Never retry a mutation.
export function canCombinePoisonTaps(profile, fight) {
  // These effects roll once per button press, not once per dose. Combining
  // presses would change their probability/stack progression.
  return fight?.boss_id !== 'boss8'
    && !['a12','a15','a19','a20'].some(id => Number(profile?.talent_levels?.[id] || 0) > 0)
    && !profile?.bone_curse
    && !Object.values(SKELETON_BP_EQUIPMENT).every(item=>profile?.equipped_items?.[item.slot]===item.id);
}
// Taps that arrive while a request is in flight travel together in the next
// request. Each press keeps its own server-side roll, so this changes latency,
// not combat results.
export const MAX_QUEUED_PRESSES = 50;
export function createPoisonAttackQueue({ send, onChange, onSettled = () => {}, batch = false, pressBatch = false }) {
  let entries = [];
  let running = false;
  let sequence = 0;
  const publish = () => onChange([...entries]);
  const clear = () => { entries = []; publish(); };
  async function drain() {
    if (running) return;
    running = true;
    try {
      while (entries.length) {
        const entry = entries[0];
        let group=[entry],request=entry;
        const canSendPresses=typeof pressBatch==='function'?pressBatch(entry):pressBatch;
        if(canSendPresses){
          group=[];
          for(const item of entries){
            if(item.fightId!==entry.fightId || group.length>=MAX_QUEUED_PRESSES)break;
            group.push(item);
          }
          request={...entry,presses:group.map(item=>({weaponId:item.weapon.id,multiplier:item.multiplier}))};
        }else if((typeof batch==='function'?batch(entry):batch) && ['satchel','f4','c4'].includes(entry.weapon.id)){
          let total=0;const candidates=[];
          for(const item of entries){
            if(item.fightId!==entry.fightId || item.weapon.id!==entry.weapon.id || total+item.multiplier>100 || !(typeof batch==='function'?batch(item):batch))break;
            total+=item.multiplier;candidates.push(item);
            if([5,10,100].includes(total)){group=[...candidates];request={...entry,multiplier:total};}
          }
        }
        let result,error;
        try { result = await send(request); } catch (caught) { result = null; error=caught; }
        entries = entries.filter(item => !group.includes(item));
        const rejectedPress=result?.rejected && Number.isInteger(result.rejected.index) ? group[result.rejected.index] : null;
        if(rejectedPress && ['NOT_ENOUGH_POISON','NO_POISON_INVENTORY'].includes(result.rejected.code)){
          entries=entries.filter(item=>item.fightId!==entry.fightId || item.weapon.id!==rejectedPress.weapon.id);
        }
        if(error?.combatSnapshot?.fight && error.combatSnapshot.fight.status!=='active'){
          entries=entries.filter(item=>item.fightId!==entry.fightId);
        }else if(error?.code==='NO_POISON_INVENTORY'){
          // Rejected before spending: discard only this depleted poison type.
          // Other accepted weapons keep their original order; never replay the
          // rejected mutation or silently replace its weapon.
          entries=entries.filter(item=>item.fightId!==entry.fightId || item.weapon.id!==entry.weapon.id);
        }else if (!result || result.fight?.status !== 'active') entries = entries.filter(item => item.fightId !== entry.fightId);
        onSettled(request, result, [...entries],error);
        publish();
      }
    } finally { running = false; }
  }
  return {
    get size() { return entries.length; },
    reserved(weaponId, fightId) {
      return entries.filter(item => item.fightId === fightId && item.weapon.id === weaponId).reduce((sum, item) => sum + item.multiplier, 0);
    },
    clear,
    enqueue(attack, stock) {
      const count = Number(attack.multiplier);
      if (!Number.isInteger(count) || count < 1) return null;
      const reserved = entries.filter(item => item.fightId === attack.fightId && item.weapon.id === attack.weapon.id)
        .reduce((sum, item) => sum + item.multiplier, 0);
      if (!Number.isFinite(stock) || stock - reserved < count) return null;
      const entry = { ...attack, queuedAt: Date.now(), token: ++sequence };
      entries.push(entry);
      publish();
      // Let the tap handler show its feedback before starting the first request.
      queueMicrotask(() => { void drain(); });
      return entry;
    },
  };
}
