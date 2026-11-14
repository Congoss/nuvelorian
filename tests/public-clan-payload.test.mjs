import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('clan list and member HTTP reads stay small and never normalize another player',async t=>{
 await store.init();await playerDb.init(store);t.mock.method(store,'persistSoon',()=>{});t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const [member]=playerDb.attachPlayers([{id:'summary-player',username:'P',level:20,clan_id:'summary-clan',clan_name:'Summary',avatar:'photo.webp',gift_mail:[{text:'x'.repeat(200000)}],weapon_inventory:{'large-poison':10}}]);
 store.players=[member];store.clans=[{id:'summary-clan',name:'Summary',owner_id:member.id,ship:{name:'Ship',progress:{hull:1},kills:{hull:1},receipts:{large:'x'.repeat(200000)},history:{large:'x'.repeat(200000)}}}];
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  await fetch(base+'/clans'); // Run the one-time startup migrations before the read-only comparison.
  const before=JSON.stringify(member);
  const clans=await fetch(base+'/clans').then(r=>r.text());assert(clans.length<5000);assert.equal(JSON.parse(clans).data[0].ship.receipts,undefined);
  const response=await fetch(base+'/clans/summary-clan/members').then(r=>r.text());assert(response.length<5000);
  const row=JSON.parse(response).data[0];assert.equal(row.avatar,'photo.webp');assert.equal(row.clan_role,'leader');assert.equal(row.gift_mail,undefined);assert.equal(row.weapon_inventory,undefined);
  assert.equal(JSON.stringify(member),before);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
