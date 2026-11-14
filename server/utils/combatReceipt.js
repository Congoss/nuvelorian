const compacted = new WeakMap();
export function selectCombatRuntime(states = {}, keys = []) {
  return Object.fromEntries([...new Set(keys)].filter(key=>key && Object.hasOwn(states,key)).map(key=>[key,states[key]]));
}

// Old receipts keep exact damage/crit/inventory/reward outcomes. Only runtime
// belonging to unrelated historical fights is omitted from replay responses.
export function compactCombatReceipt(receipt) {
  if (!receipt?.response?.body || typeof receipt.response.body !== 'string') return receipt;
  if (compacted.has(receipt)) return compacted.get(receipt);
  let result=receipt;
  try {
    const parsed=JSON.parse(receipt.response.body),payload=parsed.data || parsed;
    const states=payload.player?.talent_combat_state;
    if(states && payload.fight?.id){
      const keys=[payload.fight.id,...Object.keys(states).filter(key=>key.startsWith('raid:'))];
      const current=selectCombatRuntime(states,keys);
      if(Object.keys(current).length<Object.keys(states).length){
        payload.player.talent_combat_state=current;
        result={...receipt,response:{...receipt.response,body:JSON.stringify(parsed)}};
      }
    }
  } catch { /* Legacy response formats remain replayable unchanged. */ }
  compacted.set(receipt,result);compacted.set(result,result);
  return result;
}

export function cloneCombatPlayer(player) {
  // Journals are immutable here: commands append/replace arrays, never edit an
  // existing receipt. Avoid cloning megabytes of unchanged response strings.
  const {combat_receipts,combat_retired_requests,...fields}=player;
  return {...JSON.parse(JSON.stringify(fields)),
    ...(combat_receipts ? {combat_receipts} : {}),
    ...(combat_retired_requests ? {combat_retired_requests} : {})};
}
