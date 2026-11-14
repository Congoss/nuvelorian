import test from 'node:test';import assert from 'node:assert/strict';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
process.env.NODE_ENV='test';
const {createClanShipService}=await import('../server/services/clan-ship-service.js');
const {shipView}=await import('../server/utils/clanShip.js');
const fixture=(persistLocal=()=>true)=>{
 const clan={id:'rename-clan',name:'Test Clan',owner_id:'leader'};
 const leader={id:'leader',clan_id:clan.id,tentacles:12345},member={id:'member',clan_id:clan.id};
 const store={clans:[clan],players:[leader,member]};return {clan,leader,member,service:createClanShipService({store,persistLocal})};
};
test('clan name is exposed and only leader can use the one free rename',async()=>{
 const {clan,leader,member,service}=fixture();
 assert.equal(shipView(clan,leader).clanName,'Test Clan');assert.equal(shipView(clan,leader).canRename,true);assert.equal(shipView(clan,member).canRename,false);
 const body={name:'  Space  Junk  ',requestId:'rename-request-000001'};
 await assert.rejects(service.rename(clan,member,body),{code:'SHIP_RENAME_LEADER_ONLY'});
 const results=await Promise.all([service.rename(clan,leader,body),service.rename(clan,leader,body)]);
 for(const result of results){assert.equal(result.ship.shipName,'Space Junk');assert.equal(result.ship.canRename,false);}
 assert.equal(leader.tentacles,12345);assert.equal(clan.name,'Test Clan');
 await assert.rejects(service.rename(clan,leader,{...body,name:'Different',requestId:'rename-request-000002'}),{code:'SHIP_RENAME_USED'});
 clan.owner_id='member';assert.equal(shipView(clan,member).canRename,false);
});
test('rename validates names and does not consume the free use on persistence failure',async()=>{
 const {clan,leader,service}=fixture(()=>{throw new Error('disk unavailable')});
 for(const name of ['a','x'.repeat(33),'bad\nname'])await assert.rejects(service.rename(clan,leader,{name,requestId:'rename-request-000001'}),{code:'SHIP_NAME_INVALID'});
 await assert.rejects(service.rename(clan,leader,{name:'Valid',requestId:'rename-request-000001'}),/disk unavailable/);
 assert.equal(shipView(clan,leader).canRename,true);assert.equal(shipView(clan,leader).shipName,'');
});
