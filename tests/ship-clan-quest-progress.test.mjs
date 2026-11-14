import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.LOCAL_GAME_STATE_PATH='';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb},{paymentDb},{ensureShip},{createClanShipService}]=await Promise.all([
 import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js'),import('../server/utils/clanShip.js'),import('../server/services/clan-ship-service.js')]);
store.init=playerDb.init=paymentDb.init=async()=>{};
playerDb.flushDirtyPlayers=async()=>0;store.persistSoon=()=>{};
test('ship attacks complete clan damage and hit quests and reward once on replay',async()=>{
 const [player]=playerDb.attachPlayers([{id:'ship-quest-player',telegram_id:'99119',created_by:'telegram_99119@miniapp.local',level:80,clan_id:'ship-quest-clan',clan_name:'SHIPQUEST',tentacles:0,talent_tree_version:2,talent_levels:{},inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':100},weapon_cooldowns:{}}]);
 const quests=['damage','hits'].map(type=>({id:'ship-'+type,owner_id:player.id,participants:[],type,tier:1,status:'ACTIVE',progress:0,target:1,reward:{tentacles:7,xp:0},expires_at:new Date(Date.now()+3600000).toISOString()}));
 const clan={id:'ship-quest-clan',name:'SHIPQUEST',owner_id:player.id,quests};ensureShip(clan).progress.hull=100000000;
 store.players=[player];store.clans=[clan];
 const opened=await createClanShipService({store,persistLocal:()=>true}).combat(clan,player,'open',{requestId:'ship-quest-open-001',moduleId:'hull'});
 const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const body={requestId:'ship-quest-hit-0001',moduleId:'hull',fightId:opened.fight.id,weaponId:'c4',multiplier:1,compact:true};
 const hit=()=>fetch(`http://127.0.0.1:${app.address().port}/api/clans/${clan.id}/ship/attack`,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'99119'},body:JSON.stringify(body)});
 try{
  const response=await hit();assert.equal(response.status,200);const result=(await response.json()).data;
  for(const quest of quests){assert.equal(quest.status,'COMPLETED');assert(quest.rewards_granted_at);}
  assert.equal(quests[0].contributions[player.id],result.hit.damage);
  assert.equal(quests[1].contributions[player.id],1);
  assert.equal(player.tentacles,14);
  const replay=await hit();assert.equal(replay.status,200);await replay.json();
  assert.equal(player.tentacles,14);assert.equal(quests[1].contributions[player.id],1);
 }finally{await new Promise(resolve=>app.close(resolve));}
});
