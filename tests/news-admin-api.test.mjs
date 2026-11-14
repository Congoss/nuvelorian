import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.ADMIN_TOKEN='news-test-owner';process.env.ADMIN_OPERATOR_PASSWORD='news-test-operator';process.env.TELEGRAM_BOT_TOKEN='test-not-a-real-token';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js')]);
test('news admin previews never send, require reviewed start, and rollback queue state on failed persistence',async t=>{
 await store.init();store.players=[{id:'p',telegram_id:'100001',language:'ru'}];store.newsCampaigns=[];
 t.mock.method(store,'persistSoon',()=>{});const save=t.mock.method(store,'persistNow',async()=>{});
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const post=(path,body,token='news-test-owner')=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-admin-token':token},body:JSON.stringify(body)});
 try{
  const unauthorized=await post('/admin/news',{texts:{}},'');assert.equal(unauthorized.status,401);
  assert.equal((await post('/admin/news',{texts:{}},'news-test-operator')).status,403);
  const draft=await post('/admin/news',{texts:{uk:'Новина',ru:'Новость',en:'News'},segment:'all'});assert.equal(draft.status,201);
  const job=(await draft.json()).data;assert.equal(job.status,'draft');assert.equal(job.total,1);
  assert.equal((await post('/admin/news/'+job.id+'/start',{})).status,400);assert.equal(store.newsCampaigns[0].status,'draft');
  save.mock.mockImplementation(async()=>{throw Error('disk failed');});
  assert.equal((await post('/admin/news/'+job.id+'/start',{confirmation:job.id,recipientCount:1})).status,500);assert.equal(store.newsCampaigns[0].status,'draft');
  save.mock.mockImplementation(async()=>{});
  assert.equal((await post('/admin/news/'+job.id+'/start',{confirmation:job.id,recipientCount:1})).status,200);assert.equal(store.newsCampaigns[0].status,'queued');
  assert.equal((await post('/admin/news/'+job.id+'/start',{confirmation:job.id,recipientCount:1})).status,409);
  const retention=await fetch(base+'/admin/retention?days=30',{headers:{'x-admin-token':'news-test-operator'}});assert.equal(retention.status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
