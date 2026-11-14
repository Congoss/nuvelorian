import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const dir=mkdtempSync(join(tmpdir(),'pvp-online-route-'));
process.env.NODE_ENV='test';
process.env.LOCAL_GAME_STATE_PATH=join(dir,'world.json');
const {createApp}=await import('../server/app.js');
const {store}=await import('../server/data/store.js');
const {playerDb}=await import('../server/data/player-db.js');
store.init=playerDb.init=async()=>{};
store.persistSoon=()=>{};store.persistNow=async()=>{};
playerDb.flushDirtyPlayers=async()=>{};
store.players=playerDb.attachPlayers([501,502,503].map(n=>({id:'online-'+n,telegram_id:String(n),created_by:`telegram_${n}@miniapp.local`,username:'Pilot '+n,level:10})));
test('two signed-in players match and reveal one round; unauthorized requests cannot enter or hijack',async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}/api/pvp/online`;
 const call=(id,body)=>fetch(url,{method:body?'POST':'GET',headers:{'x-telegram-user-id':String(id),'x-telegram-mock-user':'true',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await fetch(url)).status,401);
  let r=await call(501,{action:'queue',stats:{attack:999999},playerId:'online-502'});assert.equal(r.status,200);
  assert.equal((await r.json()).data.queue.status,'searching');
  r=await call(502,{action:'queue'});assert.equal(r.status,200);const {match}= (await r.json()).data;
  assert.equal(match.player.attack,100);assert.equal(match.opponent.kind,'human');
  r=await call(501,{action:'choose',matchId:match.id,round:1,choice:'finger'});assert.equal(r.status,200);
  const enemy=(await(await call(502)).json()).data.match;assert.equal(enemy.opponentReady,true);assert.equal(enemy.history.length,0);assert.equal(enemy.selectedChoice,null);
  assert.equal((await call(503,{action:'choose',matchId:match.id,round:1,choice:'poison'})).status,409);
  r=await call(502,{action:'choose',matchId:match.id,round:1,choice:'pencil'});
  const next=(await r.json()).data.match;assert.equal(next.round,2);assert.equal(next.player.hp,100);
  r=await call(501,{action:'abandon',matchId:match.id});assert.equal(r.status,200);
  assert.equal((await(await call(502)).json()).data.match.result,'win');
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
