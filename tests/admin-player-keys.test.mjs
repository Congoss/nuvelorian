import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.ADMIN_TOKEN='keys-admin-test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('only authenticated admin can save boss keys, including boss7, and poisons',async()=>{
 await store.init();await playerDb.init(store);
 const [player]=playerDb.attachPlayers([{id:'admin-key-target',telegram_id:'90723',created_by:'telegram_90723@miniapp.local',level:80,keycards:{parcel:2,teletron:0},weapon_inventory:{'small-poison':1},tentacles:0}]);store.players=[player];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const patch=(path,body,headers={})=>fetch(base+path,{method:'PATCH',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
 try{
  const fields={keycards:{parcel:2,teletron:7},weapon_inventory:{'small-poison':12,'medium-poison':3,'large-poison':1},tentacles:50};
  assert.equal((await patch('/api/admin/players/'+player.id,fields,{'x-admin-token':'invalid'})).status,401);
  const saved=await patch('/api/admin/players/'+player.id,fields,{'x-admin-token':'keys-admin-test'});assert.equal(saved.status,200);assert.equal((await saved.json()).data.keycards.teletron,7);assert.equal(player.keycards.parcel,2);assert.equal(player.weapon_inventory['small-poison'],12);assert.equal(player.tentacles,50);
  await patch('/players/'+player.id,{keycards:{teletron:999},tentacles:999},{'x-telegram-user-id':'90723'});assert.equal(player.keycards.teletron,7);assert.equal(player.tentacles,50);
  for(const bad of [{keycards:{teletron:-1}},{keycards:{teletron:1.5}},{keycards:{unknown:2}},{weapon_inventory:[]},{energy:-1}])assert.equal((await patch('/api/admin/players/'+player.id,bad,{'x-admin-token':'keys-admin-test'})).status,400);
  assert.equal(player.keycards.teletron,7);
 }finally{await new Promise(r=>server.close(r));}
});
