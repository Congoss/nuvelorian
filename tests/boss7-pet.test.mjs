import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);

test('Cleopatrash pet reward grants Purrgulp once, replays safely, and salvages duplicates',async()=>{
 await store.init();await playerDb.init(store);
 const [player]=playerDb.attachPlayers([{id:'purrgulp-test',telegram_id:'90722',created_by:'telegram_90722@miniapp.local',level:80,tentacles:0,inventory_items:[]}]);
 store.players=[player];store.claimedLoot=[];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const claim=async(instanceId)=>{const response=await fetch(`http://127.0.0.1:${server.address().port}/loot/claim`,{method:'POST',headers:{'x-telegram-user-id':'90722','content-type':'application/json'},body:JSON.stringify({instanceId})});const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));return result.data;};
 const box=instanceId=>({instanceId,boxType:'wooden',bossId:'boss7',rewardFormula:'boss_v2',rewardSnapshot:[{type:'boss_pet',qty:1,bossId:'boss7'}]});
 try{
  player.pending_boss_boxes=[box('purrgulp-first')];
  const first=await claim('purrgulp-first');assert.equal(first.drops[0].petId,'pet-purrgulp');assert.equal(first.drops[0].type,'pet');assert.equal(player.inventory_items.filter(x=>x.id==='pet-purrgulp'&&x.slot==='pet').length,1);
  const equip=await fetch(`http://127.0.0.1:${server.address().port}/players/${player.id}`,{method:'PATCH',headers:{'x-telegram-user-id':'90722','content-type':'application/json'},body:JSON.stringify({equipped_items:{pet:'pet-purrgulp'}})});assert.equal(equip.status,200,await equip.text());assert.equal(player.equipped_items.pet,'pet-purrgulp');
  assert.equal((await claim('purrgulp-first')).replayed,true);assert.equal(player.inventory_items.length,1);
  player.pending_boss_boxes=[box('purrgulp-duplicate')];const duplicate=await claim('purrgulp-duplicate');assert.equal(duplicate.drops[0].type,'tentacles');assert.ok(duplicate.drops[0].qty>=250);assert.equal(player.inventory_items.length,1);
 }finally{await new Promise(r=>server.close(r));}
});
