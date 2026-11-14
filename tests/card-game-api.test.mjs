import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.NODE_ENV='test';for(const k of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[k]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('HTTP card deals cannot be forged, previewed early, rerolled or claimed twice',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'planet4-cards-'));process.env.LOCAL_GAME_STATE_PATH=join(dir,'state.json');
 await store.init();await playerDb.init(store);t.mock.method(store,'persistSoon',()=>{});t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const [p]=playerDb.attachPlayers([{id:'card-http',telegram_id:'990022',created_by:'telegram_990022@miniapp.local',level:80,tutorial_disabled:true,weapon_inventory:{},card_game_bonus:5,energy:100,max_energy:100}]);store.players=[p];store.cardGames={};
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(command,data={})=>{const response=await fetch(base+'/card-game/'+command,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'990022'},body:JSON.stringify(data)});return {status:response.status,body:await response.json()};};
 const requestId=()=>crypto.randomUUID();
 try{
  const state=await post('state');assert.equal(state.status,200);assert.equal(state.body.data.free,6);
  const forged=await fetch(base+'/players/'+p.id,{method:'PATCH',headers:{'content-type':'application/json','x-telegram-user-id':'990022'},body:JSON.stringify({card_game_bonus:999,cardGames:{},premium:999999})});assert.equal(forged.status,200);assert.equal(p.card_game_bonus,0);
  const denied=await post('begin',{mode:3,requestId:requestId()});assert.equal(denied.status,409);
  const opened=await post('begin',{mode:1,requestId:requestId()});assert.equal(opened.status,200);const r=opened.body.data.round;assert.equal(r.cards,null);
  const resumed=await post('begin',{mode:1,requestId:requestId()});assert.equal(resumed.body.data.round.id,r.id);assert.equal(resumed.body.data.free,5);
  const chosen=await post('choose',{roundId:r.id,index:1,requestId:requestId()});assert.equal(chosen.body.data.round.cards.length,4);
  const locked=await post('choose',{roundId:r.id,index:2,requestId:requestId()});assert.equal(locked.status,409);
  const claim={roundId:r.id,selected:[0,1,2,3],requestId:requestId()};const receipts=await Promise.all([post('claim',claim),post('claim',claim)]);assert(receipts.every(x=>x.status===200));
  const balance=JSON.stringify({weapons:p.weapon_inventory,gums:p.enhancement_gums,energy:p.energy,premium:p.premium,tentacles:p.tentacles,spins:p.roulette_bonus_spins});
  await post('claim',{...claim,requestId:requestId()});assert.equal(JSON.stringify({weapons:p.weapon_inventory,gums:p.enhancement_gums,energy:p.energy,premium:p.premium,tentacles:p.tentacles,spins:p.roulette_bonus_spins}),balance);
  assert.equal(store.cardGames[p.id].round.status,'claimed');
 }finally{await new Promise(r=>server.close(r));delete process.env.LOCAL_GAME_STATE_PATH;await rm(dir,{recursive:true,force:true});}
});
