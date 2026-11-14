import test from 'node:test';
import assert from 'node:assert/strict';
import { reorderPartner, unseenPartnerIds } from '../src/lib/partnerTaskOrder.js';
import { operatorAllowed } from '../server/utils/adminRoles.js';
test('reordering preserves task identity and supports both directions and boundaries',()=>{
 const tasks=[{id:'a',clickCount:3},{id:'b'},{id:'c'}];
 const up=reorderPartner(tasks,'c','up');
 assert.deepEqual(up.map(p=>p.id),['a','c','b']);assert.equal(up[1],tasks[2]);
 assert.deepEqual(reorderPartner(up,'a','down').map(p=>p.id),['c','a','b']);
 assert.equal(reorderPartner(tasks,'a','up'),tasks);
 assert.throws(()=>reorderPartner(tasks,'missing','up'),/PARTNER_NOT_FOUND/);
 assert.throws(()=>reorderPartner(tasks,'a','invalid'),/INVALID_PARTNER_DIRECTION/);
});
test('partner beacon ignores seen, disabled and claimed tasks',()=>{
 const tasks=[{id:'new'},{id:'seen'},{id:'disabled',enabled:false},{id:'claimed'}];
 assert.deepEqual(unseenPartnerIds(tasks,['seen'],{claimed:true}),['new']);
 assert.deepEqual(unseenPartnerIds(tasks,['new','seen'],{claimed:true}),[]);
 assert.equal(operatorAllowed('/api/admin/partners/reorder','POST'),true);
});
process.env.NODE_ENV='test';process.env.ADMIN_TOKEN='test-partner-order';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js')]);
test('partner API prepends new tasks, persists admin order and protects reordering',async t=>{
 await store.init();t.mock.method(store,'persistSoon',()=>{});
 store.partners=[{id:'old-a',enabled:true},{id:'old-b',enabled:true}];
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const post=(path,body,token='test-partner-order')=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-admin-token':token},body:JSON.stringify(body)});
 try{
  const created=await post('/admin/partners',{names:{uk:'Новий',ru:'Новый',en:'New'},link:'https://example.com',icon:'https://example.com/icon.png',verificationMode:'visit',rewardItems:[{type:'energy',amount:1}]});
  assert.equal(created.status,201,await created.clone().text());const item=(await created.json()).data;
  const list=async()=> (await (await fetch(base+'/partners')).json()).data.map(p=>p.id);
  assert.deepEqual(await list(),[item.id,'old-a','old-b']);
  assert.equal((await post('/admin/partners/reorder',{id:'old-b',direction:'up'},'invalid')).status,401);
  assert.equal((await post('/admin/partners/reorder',{id:'old-b',direction:'up'})).status,200);
  assert.deepEqual(await list(),[item.id,'old-b','old-a']);
  assert.equal((await post('/admin/partners/reorder',{id:'old-b',direction:'bad'})).status,400);
  assert.deepEqual(await list(),[item.id,'old-b','old-a']);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
