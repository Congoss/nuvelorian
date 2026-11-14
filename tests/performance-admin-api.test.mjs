import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
process.env.NODE_ENV='test';process.env.ADMIN_TOKEN='performance-test-owner';process.env.ADMIN_OPERATOR_PASSWORD='performance-test-operator';process.env.TELEGRAM_BOT_TOKEN='performance-test-not-real';
process.env.DIAGNOSTICS_READ_TOKEN='performance-test-read-only';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js')]);
function session(){
 const params=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:90807060,first_name:'Test'})});
 const text=[...params].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=createHmac('sha256','WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
 params.set('hash',createHmac('sha256',secret).update(text).digest('hex'));return params.toString();
}
test('performance admin export authenticates, links trusted identity and excludes telemetry recursion',async()=>{
 await store.init();store.players=[{id:'performance-player',telegram_id:'90807060',nickname:'PerfTester'}];
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const path='/api/admin/diagnostics?view=performance&q=PerfTester';
  assert.equal((await fetch(base+path)).status,401);
  assert.equal((await fetch(base+path,{headers:{'x-admin-token':'performance-test-operator'}})).status,403);
  assert.equal((await fetch(base+path,{headers:{'x-diagnostics-token':'wrong'}})).status,401);
  const readOnly=await fetch(base+path,{headers:{'x-diagnostics-token':process.env.DIAGNOSTICS_READ_TOKEN}});
  assert.equal(readOnly.status,200);assert.equal(readOnly.headers.get('cache-control'),'no-store');
  assert.equal((await fetch(base+'/api/admin/players',{headers:{'x-diagnostics-token':process.env.DIAGNOSTICS_READ_TOKEN}})).status,401);
  assert.equal((await fetch(base+'/api/admin/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:process.env.DIAGNOSTICS_READ_TOKEN})})).status,401);
  const sent=await fetch(base+'/api/diagnostics/client',{method:'POST',headers:{'content-type':'application/json','x-telegram-init-data':session()},body:JSON.stringify({kind:'PERFORMANCE_SAMPLE',version:'3.78',message:'sample',details:{player_name:'spoofed',player_db_id:'other',sample_fps:31,request_id:'request-test'}})});
  assert.equal(sent.status,204);
  const response=await fetch(base+path,{headers:{'x-admin-token':'performance-test-owner'}});
  assert.equal(response.status,200);assert(response.headers.get('x-request-id'));
  assert(response.headers.get('access-control-expose-headers').includes('Server-Timing'));
  const {data}=await response.json();
  assert.equal(data.events.length,1);assert.equal(data.events[0].player_id,'90807060');
  assert.equal(data.events[0].details.player_name,'PerfTester');assert.equal(data.events[0].details.player_db_id,'performance-player');
  assert.equal(data.events[0].details.sample_fps,31);assert(data.server.rss_mb>0);assert(Array.isArray(data.related_errors));
  assert(data.events.every(e=>!e.path.includes('diagnostics/client')));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
