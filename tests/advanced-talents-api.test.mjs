import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb},{BASE_TALENT_DEFS}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../src/lib/talents.js')]);
test('server validates advanced upgrades/switches and blocked x100 neither damages nor awards progression',async()=>{
 await store.init();await playerDb.init(store);
 const [p]=playerDb.attachPlayers([{id:'advanced-http',telegram_id:'90521',created_by:'telegram_90521@miniapp.local',level:10,talent_tree_version:2,talent_levels:Object.fromEntries(BASE_TALENT_DEFS.map(t=>[t.id,10])),talent_combat_state:{},available_talent_points:1100,talent_points:1100,weapon_inventory:{'small-poison':100},weapon_cooldowns:{}}]);
 store.players=[p];store.bossDamageLogs=[];store.bossFights=[{id:'advanced-fight',boss_id:'boss8',status:'active',current_hp:100000,max_hp:100000,started_at:new Date().toISOString(),opened_by_email:p.created_by}];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 const send=async(path,body,method='POST')=>{const response=await fetch(url+path,{method,headers:{'x-telegram-user-id':'90521','content-type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
 const original=Math.random;
 try{
  let intro=await send('/players/advanced-http',{armorIntroSeen:true},'PATCH');assert.equal(intro.status,200);assert.equal(p.boss_armor_intro_seen,true);
  let r=await send('/players/advanced-http',{talentUpgrade:{id:'a01'}},'PATCH');assert.equal(r.status,200,JSON.stringify(r));assert.equal(p.available_talent_points,1098);
  r=await send('/players/advanced-http',{talentUpgrade:{id:'a01'}},'PATCH');assert.equal(r.status,200);assert.equal(p.available_talent_points,1094);
  r=await send('/players/advanced-http',{advancedAttack:{id:'fist',enabled:false}},'PATCH');assert.equal(r.status,200);assert.equal(p.advanced_attacks.fist,false);
  r=await send('/players/advanced-http',{advancedAttack:{id:'knuckle',enabled:true}},'PATCH');assert.equal(r.status,400);
  p.talent_levels.a03=10;p.talent_levels.a04=10;p.talent_levels.a17=10;
  Math.random=()=>0;
  r=await send('/boss-fights/advanced-fight/attack',{weaponId:'satchel',multiplier:100});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.data.hit.damage,0);assert.equal(p.weapon_inventory['small-poison'],100);assert.equal(store.bossFights[0].current_hp,100000);assert.equal(r.body.data.xpGranted,0);assert.equal(p.talent_combat_state['advanced-fight'].toxicMarks,0);assert.ok(p.talent_combat_state['advanced-fight'].breachUntil>Date.now());assert.equal(r.body.data.player.advanced_attacks.fist,false);
  Math.random=()=>.99;
  r=await send('/boss-fights/advanced-fight/attack',{weaponId:'satchel',multiplier:100});assert.equal(r.status,200,JSON.stringify(r));assert.ok(r.body.data.hit.damage>0);assert.ok(p.weapon_inventory['small-poison']<100);
 }finally{Math.random=original;await new Promise(r=>server.close(r));}
});
