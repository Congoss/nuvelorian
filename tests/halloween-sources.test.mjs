import { FEATURE_FLAGS } from '../src/lib/featureFlags.js';
FEATURE_FLAGS.halloween = true;
import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';
process.env.NODE_ENV='test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('authoritative boss, final quest and fishing actions award pumpkins once',async t=>{
 t.mock.method(Date,'now',()=>Date.parse('2026-10-21T12:00:00Z'));
 t.mock.method(Math,'random',()=>0);
 await store.init();await playerDb.init(store);
 const [p,mate]=playerDb.attachPlayers([
  {id:'halloween-actor',telegram_id:'90991',created_by:'telegram_90991@miniapp.local',level:10,energy:500,max_energy:500,weapon_inventory:{'small-poison':5},weapon_cooldowns:{},clan_id:'pumpkin-clan',clan_name:'Pumpkin Clan',task_completions:{}},
  {id:'halloween-mate',telegram_id:'90992',created_by:'telegram_90992@miniapp.local',level:10,clan_id:'pumpkin-clan',clan_name:'Pumpkin Clan'},
 ]);
 store.players=[p,mate];store.bossDamageLogs=[{id:'prior-hit',fight_id:'pumpkin-direct',player_email:p.created_by,damage:80,direct_damage:80,hits:2}];
 store.bossFights=[{id:'pumpkin-direct',boss_id:'heli',max_hp:100,current_hp:20,status:'active',opened_by_email:p.created_by},
 {id:'pumpkin-indirect',boss_id:'tank',max_hp:100,current_hp:20,status:'active',opened_by_email:mate.created_by,invited_player_ids:['another-helper']}];
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const headers={'x-telegram-user-id':'90991','content-type':'application/json'};
 const post=async(path,body)=>{const response=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});const json=await response.json();assert.equal(response.status,200,JSON.stringify(json));return json.data;};
 try{
  await post('/boss-fights/pumpkin-direct/attack',{weaponId:'satchel'});
  assert.equal(store.bossFights[0].status,'dead',JSON.stringify(store.bossDamageLogs));
  assert.equal(p.halloween_event?.daily.boss,1,JSON.stringify(store.bossDamageLogs));
  assert.equal(p.pending_boss_boxes.length,1);
  assert.equal(p.pending_boss_boxes[0].pumpkins,1);
  const boxId = p.pending_boss_boxes[0].instanceId;
  const opened = await post('/loot/claim',{instanceId:boxId});
  assert.equal(opened.drops.find(drop=>drop.type==='pumpkin').qty,1);
  assert.equal(p.halloween_event.balance,1);
  const replayed = await post('/loot/claim',{instanceId:boxId});
  assert.equal(replayed.replayed,true);assert.equal(p.halloween_event.balance,1);
  assert.equal(store.bossDamageLogs.find(log=>log.fight_id==='pumpkin-direct').direct_damage,100);
  assert.equal(store.bossDamageLogs.find(log=>log.fight_id==='pumpkin-indirect').direct_damage,0);
  const mission=getQuestMission('p4-u00-final');
  for(const slug of ['scout','loot','repair','trade','fight','cache']){const entry=getQuestMission('p4-u00-'+slug);p.task_completions[entry.id]=entry.target;}
  p.task_completions[mission.id]=mission.target-1;
  const action={task:{id:mission.id,locationId:mission.locationId},requestId:'halloween-mission-once'};
  const completed=await post('/players/'+p.id+'/tasks/complete',action);
  assert.equal(completed.pumpkins,1);assert.equal(p.halloween_event.daily.quest,1);
  await post('/players/'+p.id+'/tasks/complete',action);assert.equal(p.halloween_event.daily.quest,1);
  p.cosmo_fishing_cycle={startAt:Date.now()-1200000,finishAt:Date.now()-1,claimed:false,resolved:false};
  const {applyPlayerAction}=await import('../server/utils/playerActions.js');
  const caught=applyPlayerAction(p,{type:'fishing-resolve'});
  assert.equal(caught.result.pumpkins,1);
  assert.throws(()=>applyPlayerAction(p,{type:'fishing-resolve'}));
  const event=await(await fetch(base+'/events/halloween',{headers})).json();
  assert.equal(event.data.state.activityEarned,3);
  assert.equal(event.data.serverTotal,3);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('referral level 20 box adds two pumpkins once and rejects premature or unrelated claims',async t=>{
 t.mock.method(Date,'now',()=>Date.parse('2026-10-22T12:00:00Z'));
 await store.init();await playerDb.init(store);
 const [p,friend,other]=playerDb.attachPlayers([{id:'ref-parent',telegram_id:'91991',created_by:'telegram_91991@miniapp.local',level:10,referral_code:'PUMPKIN',referred_friends:[{playerId:'ref-child',rewardClaimed:true,newbiePart1Done:true}]},{id:'ref-child',created_date:'2026-10-21T12:00:00Z',telegram_id:'91992',created_by:'telegram_91992@miniapp.local',level:19,referred_by:'PUMPKIN'},{id:'not-a-ref',telegram_id:'91993',created_by:'telegram_91993@miniapp.local',level:30}]);store.players=[p,friend,other];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const claim=async id=>{const r=await fetch('http://127.0.0.1:'+server.address().port+'/players/'+p.id,{method:'PATCH',headers:{'content-type':'application/json','x-telegram-user-id':'91991'},body:JSON.stringify({claimReferralReward:{kind:'friend20',rewardId:id}})});return {status:r.status,body:await r.json()};};
 try{assert.equal((await claim(friend.id)).status,400);assert.equal((await claim(other.id)).status,400);friend.level=20;const first=await claim(friend.id);assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.data.reward.drops.find(d=>d.type==='pumpkin').qty,2);assert.equal(p.halloween_event.balance,2);assert.equal((await claim(friend.id)).body.data.status,'already_claimed');assert.equal(p.halloween_event.balance,2);}finally{await new Promise(r=>server.close(r));}
});
