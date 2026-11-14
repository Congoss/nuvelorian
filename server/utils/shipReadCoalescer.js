const reads=new WeakMap();
// A database read can finish after a combat transaction publishes its commit.
export async function refreshShipSnapshot(clan, loadState) {
 const previous = clan.ship;
 const snapshot = await loadState();
 if (snapshot && clan.ship === previous) clan.ship = snapshot;
}
// A committed local transaction is at least as fresh as a completed display read.
export function primeShipRead(clan,{now=Date.now}={}){
 reads.set(clan,{ship:clan.ship,at:now(),pending:false,promise:Promise.resolve()});
}
// Short-lived coalescing of display-only state; mutations remain authoritative.
export async function coalesceShipRead(clan,load,{now=Date.now,ttl=750}={}){
 const current=reads.get(clan);
 if(current&&current.ship===clan.ship&&(current.pending||now()-current.at<ttl))return current.promise;
 const entry={ship:clan.ship,at:now(),pending:true,promise:null};
 entry.promise=Promise.resolve().then(load).then(value=>{entry.ship=clan.ship;entry.at=now();entry.pending=false;return value;},error=>{if(reads.get(clan)===entry)reads.delete(clan);throw error;});
 reads.set(clan,entry);return entry.promise;
}
