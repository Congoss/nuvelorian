import test from 'node:test';import assert from 'node:assert/strict';
process.env.NODE_ENV='test';for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb},{paymentDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js'),import('../server/data/payment-db.js')]);
store.init=playerDb.init=paymentDb.init=async()=>{};store.persistSoon=()=>{};
test('joining a clan quest is idempotent and returns participation and contribution on reload',async()=>{
store.players=playerDb.attachPlayers([{id:'helper',telegram_id:'90532',created_by:'telegram_90532@miniapp.local',clan_id:'help-clan',clan_name:'Help clan',level:20}]);
const quest={id:'help-quest',owner_id:'owner',participants:[],status:'ACTIVE',help_enabled:true,type:'missions',tier:8,target:40,progress:26,contributions:{helper:3},expires_at:new Date(Date.now()+60000).toISOString()};store.clans=[{id:'help-clan',name:'Help clan',quests:[quest]}];
const app=createApp();await new Promise(r=>app.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+app.address().port+'/clans/help-clan/quests';const headers={'x-telegram-user-id':'90532','content-type':'application/json'};
try{for(let i=0;i<2;i++){const response=await fetch(url+'/help-quest/help',{method:'POST',headers,body:'{}'});assert.equal(response.status,200);assert.deepEqual((await response.json()).data.participants,['helper']);}const response=await fetch(url,{headers});const result=(await response.json()).data;assert.equal(result.quests[0].contributions.helper,3);assert.equal(result.quests[0].progress,26);}finally{await new Promise(r=>app.close(r));}
});
