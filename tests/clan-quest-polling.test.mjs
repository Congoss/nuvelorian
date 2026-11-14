import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.LOCAL_GAME_STATE_PATH='';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb},{paymentDb}]=await Promise.all([
 import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js')]);
store.init=playerDb.init=paymentDb.init=async()=>{};
playerDb.flushDirtyPlayers=async()=>0;
let snapshots=0;store.persistSoon=()=>{snapshots++;};
test('unchanged clan quest polls preserve offers and do not schedule global database snapshots',async()=>{
 const [player]=playerDb.attachPlayers([{id:'poll-test',telegram_id:'99111',created_by:'telegram_99111@miniapp.local',level:20,clan_id:'audit',clan_name:'AUDIT',last_energy_update:'2026-01-01'}]);
 store.players=[player];store.clans=[{id:'audit',name:'AUDIT',owner_id:player.id,quests:[],energy_requests:[]}];
 const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const read=()=>fetch(`http://127.0.0.1:${app.address().port}/api/clans/audit/quests`,{headers:{'x-telegram-user-id':'99111'}});
 try{
  const initial=await read();assert.equal(initial.status,200);await initial.json();
  const offers=player.clan_quest_offers, baseline=snapshots;
  assert.equal(offers.audit.length,5);
  for(let i=0;i<3;i++){const response=await read();assert.equal(response.status,200);await response.json();}
  assert.equal(player.clan_quest_offers,offers);
  assert.equal(snapshots,baseline);
  assert.equal(player.last_energy_update,'2026-01-01');
 }finally{await new Promise(resolve=>app.close(resolve));}
});

test('clan chat cannot expose another clan through an empty name or all-scope query',async()=>{
 store.players=playerDb.attachPlayers([{id:'chat-viewer',telegram_id:'99114',created_by:'telegram_99114@miniapp.local',clan_id:'audit',clan_name:''}]);
 store.clans=[{id:'audit',name:'AUDIT',owner_id:'chat-viewer',quests:[]}];
 store.chatMessages=[{id:'mine',channel:'clan',clan:'AUDIT',text:'own'},{id:'other',channel:'clan',clan:'OTHER',text:'private'}];
 const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.address().port}/api/chat/messages?channel=clan&scope=all`;
 try{
  assert.equal((await fetch(base)).status,403);
  const response=await fetch(base,{headers:{'x-telegram-user-id':'99114'}});assert.equal(response.status,200);
  const messages=(await response.json()).data;assert.deepEqual(messages.map(m=>m.id),['mine']);
 }finally{await new Promise(resolve=>app.close(resolve));}
});
