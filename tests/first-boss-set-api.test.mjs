import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.LOCAL_GAME_STATE_PATH='';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb},{paymentDb},{FIRST_BOSS_SET_IDS}]=await Promise.all([
 import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js'),import('../src/lib/firstBossSet.js')]);
store.init=playerDb.init=paymentDb.init=async()=>{};playerDb.flushDirtyPlayers=async()=>0;store.persistSoon=()=>{};
test('41 real victories grant six unique parts, starter hint survives claim, replay grants nothing extra',async()=>{
 const [player]=playerDb.attachPlayers([{id:'starter-set-test',telegram_id:'99120',created_by:'telegram_99120@miniapp.local',level:20,tutorial_disabled:true,talent_tree_version:2,talent_levels:{},inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':1000},weapon_cooldowns:{},boss_kills_by_id:{}}]);
 store.players=[player];store.bossFights=[];store.bossDamageLogs=[];store.clans=[];store.claimedLoot=[];
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const originalRandom=Math.random;Math.random=()=>.99;
 const post=async(path,body)=>{const response=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'99120'},body:JSON.stringify(body)});const json=await response.json();assert(response.ok,JSON.stringify(json));return json.data;};
 try{
  for(let kill=1;kill<=41;kill++){
   const fight=await post('/boss-fights/spawn',{bossId:'heli'});
   const hit=await post(`/boss-fights/${fight.id}/attack`,{weaponId:'c4',multiplier:10});
   assert.equal(hit.fight.status,'dead');
   const box=player.pending_boss_boxes.find(b=>b.fightId===fight.id);assert(box);
   await post('/loot/claim',{instanceId:box.instanceId});
   if(kill===1){
    const starter=player.inventory_items.find(item=>item.starterEquipment);
    assert(starter);assert(['cardboard_head','cardboard_armor'].includes(starter.id));
    const before=player.inventory_items.length;
    assert.equal((await post('/loot/claim',{instanceId:box.instanceId})).replayed,true);
    assert.equal(player.inventory_items.length,before);
   }
  }
  assert.deepEqual(player.inventory_items.filter(item=>FIRST_BOSS_SET_IDS.includes(item.id)).map(item=>item.id).sort(),[...FIRST_BOSS_SET_IDS].sort());
 }finally{Math.random=originalRandom;await new Promise(resolve=>server.close(resolve));}
});
