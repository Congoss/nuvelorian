import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.ADMIN_TOKEN='anubis-admin-test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('admin grants just Anubis once and preserves other equipment',async()=>{
 await store.init();await playerDb.init(store);
 const [player]=playerDb.attachPlayers([{id:'admin-anubis',telegram_id:'90724',created_by:'telegram_90724@miniapp.local',level:80,inventory_items:[{id:'cardboard_head',type:'equipment',slot:'head'}]}]);store.players=[player];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const grant=token=>fetch(`http://127.0.0.1:${server.address().port}/api/admin/players/admin-anubis/equipment-sets`,{method:'POST',headers:{'content-type':'application/json','x-admin-token':token},body:JSON.stringify({setId:'anubis'})});
 try{
  assert.equal((await grant('invalid')).status,401);
  let res=await grant('anubis-admin-test');assert.equal(res.status,200);assert.equal((await res.json()).data.added,6);
  assert.equal(player.inventory_items.length,7);assert.ok(player.inventory_items.some(i=>i.id==='cardboard_head'));
  const items=player.inventory_items.filter(i=>i.setId==='anubis');assert.equal(items.length,6);assert.ok(items.every(i=>i.bonuses.length===1));
  res=await grant('anubis-admin-test');assert.equal((await res.json()).data.added,0);assert.equal(player.inventory_items.length,7);
 }finally{await new Promise(r=>server.close(r));}
});
