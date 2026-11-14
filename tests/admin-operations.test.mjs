import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {serverConfig} from '../server/config.js';
import {eventParticipantRows} from '../server/utils/adminEventParticipants.js';
process.env.NODE_ENV='test';for(const k of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[k]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('event eligibility counts earned pumpkins after spending, excludes other events and filters account/level',()=>{
 const rows=eventParticipantRows([{id:'a',level:22,telegram_id:'123',halloween_event:{id:'halloween-2026',earned:220,balance:0}},{id:'b',level:10,near_wallet_id:'b.near',halloween_event:{id:'halloween-2026',activityTotal:250,balance:5}},{id:'c',halloween_event:{id:'other',earned:500}}],{min:200});
 assert.deepEqual(rows.map(r=>r.id),['b','a']);assert.equal(rows[1].collected,220);assert.equal(rows[1].balance,0);
 assert.equal(eventParticipantRows([{id:'a',level:4,halloween_event:{id:'halloween-2026',earned:300}}],{min:200,account:'near'}).length,0);
});
test('bug report is stored, throttled, and only admin can read or change its status',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'planet4-support-'));process.env.LOCAL_GAME_STATE_PATH=join(dir,'state.json');
 await store.init();await playerDb.init(store);t.mock.method(store,'persistSoon',()=>{});t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const [p]=playerDb.attachPlayers([{id:'support-player',telegram_id:'990033',created_by:'telegram_990033@miniapp.local',level:20,tutorial_disabled:true}]);store.players=[p];store.supportReports=[];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=body=>fetch(base+'/support/reports',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'990033'},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'/api/admin/support')).status,401);
  assert.equal((await post({text:'ab'})).status,400);
  const sent=await post({text:'тестдрайв',version:'3.40'});assert.equal(sent.status,201);const id=(await sent.json()).data.id;
  assert.equal((await post({text:'Cannot claim my reward after opening a card'})).status,429);
  const headers={'x-admin-token':'dev-admin','content-type':'application/json'};
  const list=await fetch(base+'/api/admin/support',{headers});assert.equal(list.status,200);assert.equal((await list.json()).data[0].playerId,p.id);
  assert.equal((await fetch(base+'/api/admin/support',{method:'PATCH',headers,body:JSON.stringify({id,status:'closed'})})).status,200);assert.equal(store.supportReports[0].status,'closed');
  assert.equal((await fetch(base+'/api/admin/support',{method:'PATCH',headers,body:JSON.stringify({id,status:'forged'})})).status,400);
  assert.equal((await fetch(base+'/api/admin/events?min=200',{headers})).status,200);
  assert.equal((await fetch(base+'/api/admin/events/telegram',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:[p.id]})})).status,401);
  assert.equal((await fetch(base+'/api/admin/events/telegram',{method:'POST',headers,body:JSON.stringify({ids:Array(6).fill(p.id)})})).status,serverConfig.telegramBotToken?400:503);
 }finally{await new Promise(r=>server.close(r));delete process.env.LOCAL_GAME_STATE_PATH;await rm(dir,{recursive:true,force:true});}
});
