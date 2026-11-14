import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('HTTP concurrent chest requests cannot duplicate rewards or restore spent artifacts through profile PATCH',async t=>{
 await store.init();await playerDb.init(store);t.mock.method(store,'persistSoon',()=>{});t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const counts=Object.fromEntries(Array.from({length:7},(_,i)=>['p4-u00-artifact-'+(i+1),2]));
 const [player]=playerDb.attachPlayers([{id:'artifact-audit',telegram_id:'990011',created_by:'telegram_990011@miniapp.local',level:80,tutorial_disabled:true,collection_item_counts:counts,task_completions:{},weapon_inventory:{},energy:100,max_energy:100}]);
 store.players=[player];const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const patch=body=>fetch(base+'/players/'+player.id,{method:'PATCH',headers:{'content-type':'application/json','x-telegram-user-id':'990011'},body:JSON.stringify(body)});
 const claim=id=>patch({playerAction:{type:'collection-claim',locationId:'p4-u00',count:1,requestId:id}});
 try{
  const forged=await patch({collection_item_counts:Object.fromEntries(Object.keys(counts).map(id=>[id,999999])),collection_rewards_claimed:{}});assert.equal(forged.status,200);assert.deepEqual(player.collection_item_counts,counts);
  const duplicate=await Promise.all([claim('audit-same-id-0001'),claim('audit-same-id-0001')]);assert.ok(duplicate.every(r=>r.status===200));assert.equal(player.collection_rewards_claimed['p4-u00'],1);
  const competing=await Promise.all([claim('audit-fresh-id-0001'),claim('audit-fresh-id-0002')]);assert.deepEqual(competing.map(r=>r.status).sort(),[200,409]);
  assert.equal(player.collection_rewards_claimed['p4-u00'],2);assert.equal(player.weapon_inventory['small-poison'],2);assert.equal(player.weapon_inventory['medium-poison'],2);assert.ok(Object.values(player.collection_item_counts).every(n=>n===0));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
