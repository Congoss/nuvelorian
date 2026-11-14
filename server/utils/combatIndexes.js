// Fight and damage-log IDs/owners are immutable. Terminal fights are never
// reopened; restores replace their arrays. Appends extend indexes incrementally.
const fightIndexes=new WeakMap(),damageIndexes=new WeakMap();
const ownerKey=value=>String(value ?? '').trim().toLowerCase();
function indexFor(rows,cache,create,add){
 let index=cache.get(rows);
 if(!index || rows.length<index.length || rows[0]!==index.first || (index.length && rows[index.length-1]!==index.last)){
  index={...create(),length:0,first:rows[0],last:undefined};cache.set(rows,index);
 }
 for(let i=index.length;i<rows.length;i++)add(index,rows[i],i);
 index.length=rows.length;index.first=rows[0];index.last=rows.at(-1);
 return index;
}
function fights(rows){
 return indexFor(rows,fightIndexes,()=>({byId:new Map(),byOwner:new Map(),active:new Set()}),(index,fight,position)=>{
  if(!fight)return;
  if(!index.byId.has(String(fight.id)))index.byId.set(String(fight.id),fight);
  if(String(fight.status || '').trim().toLowerCase()==='active'){
   const owner=ownerKey(fight.opened_by_email),list=index.byOwner.get(owner) || [];
   list.push({fight,position});index.byOwner.set(owner,list);index.active.add(fight);
  }
 });
}
export function findBossFight(rows,id){return fights(rows).byId.get(String(id));}
export function activeBossFights(rows){
 const index=fights(rows);
 for(const fight of index.active)if(String(fight.status || '').trim().toLowerCase()!=='active')index.active.delete(fight);
 return [...index.active];
}
export function activeBossFightsByOwners(rows,owners){
 const index=fights(rows),matches=[];
 for(const owner of new Set(Array.from(owners,ownerKey))){
  const live=(index.byOwner.get(owner) || []).filter(({fight})=>String(fight.status || '').trim().toLowerCase()==='active');
  index.byOwner.set(owner,live);matches.push(...live);
 }
 return matches.sort((a,b)=>a.position-b.position).map(row=>row.fight);
}
function damageLogs(rows) {
 return indexFor(rows,damageIndexes,()=>({byFight:new Map(),rowsByFight:new Map()}),(index,row)=>{
  if(!row)return;
  let players=index.byFight.get(row.fight_id);if(!players){players=new Map();index.byFight.set(row.fight_id,players);}
  if(!players.has(row.player_email))players.set(row.player_email,row);
  const key=String(row.fight_id),logs=index.rowsByFight.get(key)||[];
  logs.push(row);index.rowsByFight.set(key,logs);
 });
}
export function findBossDamageLog(rows,fightId,email){
 return damageLogs(rows).byFight.get(fightId)?.get(email);
}
export function bossDamageLogsForFights(rows,ids) {
 if (!ids.size) return [];
 const index=damageLogs(rows);
 return [...ids].flatMap(id=>index.rowsByFight.get(String(id))||[]);
}
