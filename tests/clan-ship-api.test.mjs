import assert from 'node:assert/strict';
import test from 'node:test';
process.env.NODE_ENV='test';
process.env.CLAN_SHIP_TEST_PASSWORD='http-ship-test-password';
process.env.CLAN_SHIP_TEST_SESSION_SECRET='http-test-secret-only';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const cookies=new Map();
async function unlock(base,tg,clan){
 const r=await fetch(base+'/clans/'+clan+'/ship-access',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':tg,cookie:cookies.get(tg)||''},body:JSON.stringify({password:process.env.CLAN_SHIP_TEST_PASSWORD})});
 assert.equal(r.status,200,await r.clone().text());cookies.set(tg,r.headers.get('set-cookie').split(';')[0]);
}
const [{createApp},{store},{playerDb},{ensureShip}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/utils/clanShip.js')]);
test('ship API restricts clan access, serializes duplicate requests and returns shared committed state',async()=>{
 await store.init();await playerDb.init(store);
 const seed=(id,tg,clan)=>({id,telegram_id:tg,created_by:`telegram_${tg}@miniapp.local`,username:id,clan_id:clan,clan_name:clan,level:80,xp:0,tentacles:100000,premium:20,inventory_items:[],weapon_inventory:{},talent_levels:{},energy:100,max_energy:100});
 const [owner,mate,outsider]=playerDb.attachPlayers([seed('ship-owner','41001','ship-test'),seed('ship-mate','41002','ship-test'),seed('ship-other','41003','other')]);store.players=[owner,mate,outsider];const clan={id:'ship-test',name:'ship-test',owner_id:owner.id};store.clans=[clan];ensureShip(clan).progress.hull=100000000;ensureShip(clan).kills.hull=1;
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const get=async(tg)=>{const r=await fetch(base+'/clans/ship-test/ship',{headers:{'x-telegram-user-id':tg,cookie:cookies.get(tg)||''}});return {status:r.status,body:await r.json()}};
 const post=async(tg,amount=1000)=>{const r=await fetch(base+'/clans/ship-test/ship/contribute',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':tg,cookie:cookies.get(tg)||''},body:JSON.stringify({requestId:'http-contribution-0001',moduleId:'engine',currency:'tentacles',amount})});return {status:r.status,body:await r.json()}};
 try{
  assert.equal((await get('41003')).status,403);assert.equal((await post('41003')).status,403);
  const results=await Promise.all([post('41001'),post('41001')]);for(const result of results)assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(owner.tentacles,99000);assert.equal(clan.ship.progress.engine,1000);assert.equal(clan.ship.donations.length,1);
  assert.equal((await get('41002')).body.data.progress.engine,1000);
  assert.equal((await post('41001',2000)).status,409);assert.equal(owner.tentacles,99000);
  assert.equal((await get('')).status,401);
 }finally{await new Promise(r=>server.close(r));}
});

test('ship combat HTTP persists damage and poison, awards one victory and claims the real chest once',async()=>{
 await store.init();await playerDb.init(store);
 const [owner]=playerDb.attachPlayers([{id:'ship-real-fighter',telegram_id:'42001',created_by:'telegram_42001@miniapp.local',username:'Fighter',clan_id:'combat-clan',clan_name:'combat-clan',level:80,xp:0,tentacles:0,premium:0,inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':1000},weapon_cooldowns:{},talent_tree_version:2,talent_levels:{},energy:100,max_energy:100}]);store.players=[owner];const clan={id:'combat-clan',name:'combat-clan',owner_id:owner.id};store.clans=[clan];store.claimedLoot=[];ensureShip(clan).progress.hull=100000000;
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'42001',cookie:cookies.get('42001')||''},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}};
 try{
  const opened=await post('/clans/combat-clan/ship/open',{requestId:'http-open-fight-00001',moduleId:'hull'});assert.equal(opened.status,200,JSON.stringify(opened.body));const fightId=opened.body.data.fight.id;assert.equal(opened.body.data.fight.max_hp,2000000);
  const getActive=async()=>fetch(base+'/boss-fights/active',{headers:{'x-telegram-user-id':'42001'}}).then(r=>r.json());
  const active=await getActive();assert.equal(active.data.kind,'ship');assert.equal(active.data.id,fightId);assert.equal(active.data.clanId,clan.id);assert.equal(active.data.moduleId,'hull');
  const inviteBody={channel:'clan',text:'Help with the ship boss!',kind:'ship_boss_invite',bossFightInvite:{fightId,moduleId:'hull'}};
  const invite=await post('/chat/messages',inviteBody);assert.equal(invite.status,201,JSON.stringify(invite.body));assert.equal(invite.body.data.bossFightInvite.ship,true);
  assert.equal((await post('/chat/messages',inviteBody)).status,409);
  assert.equal((await post('/chat/messages',{...inviteBody,channel:'world'})).status,403);
  const messages=await fetch(base+'/chat/messages?channel=clan',{headers:{'x-telegram-user-id':'42001'}}).then(r=>r.json());
  assert(messages.data.some(m=>m.bossFightInvite?.fightId===fightId));
  const body={requestId:'http-attack-fight-0001',moduleId:'hull',fightId,weaponId:'c4',multiplier:100};
  const results=await Promise.all([post('/clans/combat-clan/ship/attack',body),post('/clans/combat-clan/ship/attack',body)]);for(const r of results)assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(owner.weapon_inventory['large-poison'],900);
  const hp=clan.ship.fights.hull.current_hp;
  const reopened=await post('/clans/combat-clan/ship/open',{requestId:'http-open-fight-00002',moduleId:'hull'});assert.equal(reopened.body.data.fight.id,fightId);assert.equal(reopened.body.data.fight.current_hp,hp);
  const fight=clan.ship.fights.hull;fight.participants[owner.id].damage=1999999;fight.current_hp=1;
  const killed=await post('/clans/combat-clan/ship/attack',{...body,requestId:'http-lethal-fight-001',multiplier:1});assert.equal(killed.status,200,JSON.stringify(killed.body));assert.equal(killed.body.data.fight.status,'dead');assert.equal(owner.ship_boss_kills.hull,1);assert.equal(clan.ship.kills.hull,1);assert.equal(owner.pending_boss_boxes.length,1);
  assert.equal((await getActive()).data,null,'A defeated ship fight must disappear from the boss menu');
  const expiredJoin=await post('/clans/combat-clan/ship/open',{requestId:'http-stale-invite-001',moduleId:'hull',fightId});assert.equal(expiredJoin.status,409);
  const afterDeath=await fetch(base+'/chat/messages?channel=clan',{headers:{'x-telegram-user-id':'42001'}}).then(r=>r.json());assert(!afterDeath.data.some(m=>m.bossFightInvite?.fightId===fightId));
  const box=owner.pending_boss_boxes[0];assert(box.rewardSnapshot.some(d=>d.type==='tentacles'));
  const claim=await post('/loot/claim',{instanceId:box.instanceId});assert.equal(claim.status,200,JSON.stringify(claim.body));const balance=owner.tentacles;
  const retry=await post('/loot/claim',{instanceId:box.instanceId});assert.equal(retry.status,200);assert.equal(retry.body.data.replayed,true);assert.equal(owner.tentacles,balance);
  const late=await post('/clans/combat-clan/ship/sync',{moduleId:'hull',fightId});assert.equal(late.status,200);assert.equal(owner.ship_boss_kills.hull,1);assert.equal(owner.pending_boss_boxes.length,0);
 }finally{await new Promise(r=>server.close(r));}
});
