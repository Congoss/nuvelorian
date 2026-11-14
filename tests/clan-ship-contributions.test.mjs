import { SHIP_MODULES } from '../src/lib/clanShipPreview.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync,writeFileSync,renameSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
process.env.NODE_ENV='test';
const {createClanShipService}=await import('../server/services/clan-ship-service.js');
const {ensureShip}=await import('../server/utils/clanShip.js');
function fixture(persistLocal){
 const clan={id:'test-clan'},player={id:'p1',clan_id:'test-clan',tentacles:20000000,premium:2000};
 const ship=ensureShip(clan);ship.progress.hull=100000000;ship.kills.hull=1;
 const store={clans:[clan],players:[player]};
 return {clan,player,store,service:createClanShipService({store,persistLocal:persistLocal||(()=>true)})};
}
const body=(requestId='contribution-request-001',amount=1000,currency='tentacles')=>({requestId,moduleId:'engine',amount,currency});
test('contribution debits the correct currency, caps final cost and replays once',async()=>{
 const {clan,player,service}=fixture();
 const first=await service.contribute(clan,player,body());assert.equal(first.applied,1000);assert.equal(player.tentacles,19999000);
 const retry=await service.contribute(clan,player,body());assert.equal(retry.replayed,true);assert.equal(player.tentacles,19999000);assert.equal(clan.ship.donations.length,1);
 await assert.rejects(service.contribute(clan,player,body(undefined,1001)),/REQUEST_ID_REUSED/);
 clan.ship.progress.engine=SHIP_MODULES[1].cost-5000;
 const final=await service.contribute(clan,player,body('contribution-request-002',50000,'tentacles'));assert.equal(final.amount,5000);assert.equal(final.applied,5000);assert.equal(player.premium,2000);assert.equal(clan.ship.progress.engine,SHIP_MODULES[1].cost);
});
test('parallel duplicate and competing requests never double spend or overbuild',async()=>{
 const {clan,player,service}=fixture();
 const responses=await Promise.all(Array.from({length:10},()=>service.contribute(clan,player,body())));assert.equal(responses.filter(r=>!r.replayed).length,1);assert.equal(player.tentacles,19999000);
 clan.ship.progress.engine=SHIP_MODULES[1].cost-100;
 const results=await Promise.allSettled([service.contribute(clan,player,body('competing-request-001',100)),service.contribute(clan,player,body('competing-request-002',100))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(player.tentacles,19998900);assert.equal(clan.ship.progress.engine,SHIP_MODULES[1].cost);
});
test('unauthorized, invalid, locked and unaffordable requests never mutate resources',async()=>{
 const {clan,player,service}=fixture(),before=JSON.stringify({player,ship:clan.ship});
 for(const patch of [{amount:-1},{amount:1.5},{amount:Number.MAX_SAFE_INTEGER+1},{currency:'stars'},{currency:'paper'},{currency:'near'},{moduleId:'lab'},{moduleId:'unknown'}])await assert.rejects(service.contribute(clan,player,{...body(),...patch}));
 await assert.rejects(service.contribute(clan,{...player,id:'outsider',clan_id:'other'},body()),/CLAN_MEMBERSHIP_REQUIRED/);
 await assert.rejects(service.read(clan,{...player,is_banned:true}),/CLAN_MEMBERSHIP_REQUIRED/);
 await assert.rejects(service.contribute(clan,{...player,tentacles:0},body()),/NOT_ENOUGH_RESOURCES/);
 assert.equal(JSON.stringify({player,ship:clan.ship}),before);
});
test('storage failure publishes neither a debit nor progress or a success receipt',async()=>{
 const {clan,player,service}=fixture(()=>{throw Error('disk failed')});const before=JSON.stringify({player,ship:clan.ship});
 await assert.rejects(service.contribute(clan,player,body()),/disk failed/);assert.equal(JSON.stringify({player,ship:clan.ship}),before);
});
test('restart restores both wallet and clan progress and keeps the request receipt',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'p4-ship-')),file=path.join(dir,'state.json');
 try{
 const {clan,player,service}=fixture(snapshot=>{writeFileSync(file+'.tmp',JSON.stringify(snapshot));renameSync(file+'.tmp',file);return true;});
 await service.contribute(clan,player,body());
 const restored=JSON.parse(readFileSync(file,'utf8')),next=createClanShipService({store:restored,persistLocal:()=>true});
 const result=await next.contribute(restored.clans[0],restored.players[0],body());assert.equal(result.replayed,true);assert.equal(restored.players[0].tentacles,19999000);assert.equal(restored.clans[0].ship.progress.engine,1000);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
