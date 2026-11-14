import test from 'node:test';
import assert from 'node:assert/strict';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING']) process.env[key]='';
const {normalizeEvent,recordDiagnosticEvent,listDiagnosticEvents}=await import('../server/data/diagnostics.js');

test('structured metrics preserve correlation and remove unknown fields and secrets',()=>{
  const id='72928fa0-f270-4980-b227-977f81a2f0d3';
  const event=normalizeEvent({source:'client',path:'/api/players/12345678?token=secret',code:'SLOW_API',details:{request_id:id,sample_fps:32.4,heap_used_mb:Infinity,initData:'secret',server_timing:'ship_write;dur=1420',user_agent:'token=supersecret'}});
  assert.equal(event.path,'/api/players/:id');
  assert.equal(event.details.request_id,id);
  assert.equal(event.details.sample_fps,32.4);
  assert.equal(event.details.server_timing,'ship_write;dur=1420');
  assert.equal(event.details.user_agent,'[redacted]');
  assert.equal(event.details.heap_used_mb,undefined);
  assert.equal(event.details.initData,undefined);
});

test('performance and error journals filter before limiting, by player, source and time',async()=>{
  await recordDiagnosticEvent({source:'api',player_id:'4411',code:'SLOW_REQUEST',duration_ms:1800,details:{player_name:'Deny',player_db_id:'player-abc',request_id:'request-123'}});
  await recordDiagnosticEvent({source:'client',player_id:'4411',code:'UI_STALL',details:{session_id:'session-123'}});
  await recordDiagnosticEvent({source:'client',player_id:'4411',code:'JS_ERROR'});
  assert.equal((await listDiagnosticEvents(10,true,{q:'denY'})).length,1);
  assert.equal((await listDiagnosticEvents(10,true,{q:'player-abc'})).length,1);
  assert.equal((await listDiagnosticEvents(10,true,{q:'4411'})).length,2);
  assert.equal((await listDiagnosticEvents(10,true,{q:'session-123',source:'client'})).length,1);
  assert.equal((await listDiagnosticEvents(10,true,{q:'request-123',source:'client'})).length,0);
  assert.equal((await listDiagnosticEvents(10,false,{q:'4411'})).length,1);
  assert.equal((await listDiagnosticEvents(10,true,{since:'2999-01-01'})).length,0);
});

test('performance traffic cannot evict error journal records',async()=>{
  for(let i=0;i<2010;i++) await recordDiagnosticEvent({source:'client',player_id:`budget-${i}`,code:'PERFORMANCE_SAMPLE'});
  assert.equal((await listDiagnosticEvents(10,false,{q:'4411'})).length,1);
  assert.equal((await listDiagnosticEvents(2000,true)).length,2000);
});
