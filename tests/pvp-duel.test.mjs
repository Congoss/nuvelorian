import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createDuelService} from '../server/services/pvp-duel.js';
import {duelStats,demoDuelProfile,DUEL_SETS,DUEL_ACTIONS,DUEL_BEATS} from '../src/lib/pvpDuel.js';
import {PVP_COOLDOWN_MS,PVP_SERIES_SIZE} from '../src/lib/pvpRanks.js';
const preset={set:'cardboard_survivor',enhancement:15,talents:0};
test('weapon controls common damage; armour controls HP; enhancement and sets are monotonic',()=>{
 for(const set of DUEL_SETS){const p=demoDuelProfile({set,enhancement:0,talents:0}),base=duelStats(p),max=duelStats(demoDuelProfile({set,enhancement:15,talents:0}));assert.ok(max.attack>base.attack&&max.maxHp>base.maxHp);
 const onlyWeapon=structuredClone(p);onlyWeapon.inventory_items.find(i=>i.slot==='weapon').enhancementLevel=15;assert.equal(duelStats(onlyWeapon).maxHp,base.maxHp);assert.ok(duelStats(onlyWeapon).attack>base.attack);
 const armour=structuredClone(p);armour.inventory_items.filter(i=>i.slot!=='weapon').forEach(i=>i.enhancementLevel=15);assert.equal(duelStats(armour).attack,base.attack);assert.ok(duelStats(armour).maxHp>base.maxHp);}
 assert.throws(()=>demoDuelProfile({set:'cheat'}),/INVALID/);
});
test('server commits before choice; all winning moves cause the same weapon damage; loser uses own damage',()=>{
 for(const enemy of DUEL_ACTIONS){let call=0;const random=()=>call++===0?0:(DUEL_ACTIONS.indexOf(enemy)+.01)/3;const s=createDuelService({random}),m=s.start('player',preset);assert.equal(m.secret,undefined);assert.equal(m.opponentChoice,undefined);
 const choice=DUEL_ACTIONS.find(a=>DUEL_BEATS[a]===enemy),r=s.choose('player',{matchId:m.id,round:1,choice}),h=r.history[0];assert.equal(h.damage,m.player.attack);assert.equal(r.opponent.hp,m.opponent.hp-m.player.attack);assert.equal(r.player.hp,m.player.hp);assert.equal(createHash('sha256').update(`${m.id}:1:${h.opponentChoice}:${h.nonce}`).digest('hex'),m.commitment);}
});
test('draw, loss, request replay, altered replay and out-of-order requests',()=>{
 const s=createDuelService({random:()=>0});let m=s.start('p',preset);let r=s.choose('p',{matchId:m.id,round:1,choice:'finger'});assert.equal(r.history[0].winner,'draw');assert.equal(r.player.hp,m.player.hp);
 const body={matchId:m.id,round:2,choice:'pencil'};r=s.choose('p',body);assert.equal(r.player.hp,m.player.hp-m.opponent.attack);assert.deepEqual(s.choose('p',body),r);assert.throws(()=>s.choose('p',{...body,choice:'poison'}),/ROUND_ALREADY/);assert.throws(()=>s.choose('p',{...body,round:99}),/STALE/);assert.throws(()=>s.choose('p',{...body,matchId:'other'}),/WRONG/);assert.throws(()=>s.choose('p',{...body,choice:'bomb'}),/INVALID/);
});
test('finish, session isolation, expiry and abandon; active match cannot be rerolled',()=>{
 let now=0;const s=createDuelService({random:()=>0,now:()=>now});let m=s.start('p',preset);assert.equal(s.start('p',{set:'shkraban',enhancement:15,talents:100}).id,m.id);assert.equal(s.read('other'),null);
 while(m.status==='active')m=s.choose('p',{matchId:m.id,round:m.round,choice:'poison'});
 assert.equal(m.result,'win');assert.equal(m.opponent.hp,0);assert.ok(m.history.every(h=>h.damage===m.player.attack));assert.equal(s.read('p').id,m.id);
 assert.equal(m.rating,23);assert.equal(m.ratingDelta,23);
 assert.equal(s.choose('p',{matchId:m.id,round:m.round,choice:'poison'}).rating,23);
 assert.deepEqual(s.standings('p').history.map(({result,delta})=>({result,delta})),[{result:'win',delta:23}]);
 assert.deepEqual(s.standings('p').leaders,[{number:1,rating:23,position:1,self:true}]);
 assert.equal(s.start('p',preset).rating,23);
 now=31*60000;assert.equal(s.read('p'),null);s.start('p',preset);s.abandon('p');assert.equal(s.read('p'),null);
});
test('AI responds only to historical repeated actions and round cap stops infinite draws',()=>{
 const s=createDuelService({random:()=>0});let m=s.start('p',preset);while(m.status==='active')m=s.choose('p',{matchId:m.id,round:m.round,choice:'finger'});assert.equal(m.history.length,30);assert.equal(m.result,'draw');
});
test('counter agent commits against history before it can see the next player choice',()=>{
 const s=createDuelService({random:()=>.4});let m=s.start('counter',preset);assert.equal(m.opponent.style,'counter');
 for(let i=0;i<2;i++)m=s.choose('counter',{matchId:m.id,round:m.round,choice:'pencil'});
 const old=m.commitment;m=s.choose('counter',{matchId:m.id,round:m.round,choice:'poison'});const h=m.history.at(-1);
 assert.equal(h.opponentChoice,'finger');assert.equal(h.winner,'player');assert.equal(h.commitment,old);
});
test('all 84 preview builds finish in 3 to 5 successful equal-power hits; legal talents are bounded',()=>{
 for(const set of DUEL_SETS)for(const enhancement of [0,5,10,15])for(const talents of [0,50,100]){
  const p=demoDuelProfile({set,enhancement,talents}),s=duelStats(p),hits=Math.ceil(s.maxHp/s.attack);
  assert.ok(hits>=3&&hits<=5,`${set}+${enhancement}/${talents}: ${hits}`);assert.ok(s.talentBonus<=.3);assert.ok(p.available_talent_points>=0);
 }
});
test('ranked attempts refill one at a time without a daily quota',()=>{
 let time=Date.UTC(2026,0,1);
 const service=createDuelService({random:()=>0,now:()=>time});
 const opponents=new Set();
 for(let i=0;i<25;i++){
  if(i>=PVP_SERIES_SIZE){
   assert.throws(()=>service.start('p',preset),/PVP_COOLDOWN/);
   time+=PVP_COOLDOWN_MS;
   assert.equal(service.standings('p').attempts,1);
  }
  const match=service.start('p',preset);
  assert.ok(service.standings('p').readyAt>time);
  assert.equal(service.start('p',preset).id,match.id);
  if(i<20)assert.ok(!opponents.has(match.opponent.name));
  opponents.add(match.opponent.name);
  service.abandon('p');
 }
 assert.equal(service.standings('p').rating,0);
 assert.ok(service.standings('p').history.every(entry=>entry.delta===0));
 time+=PVP_COOLDOWN_MS*10;
 assert.equal(service.standings('p').attempts,PVP_SERIES_SIZE);
 assert.equal(service.standings('p').readyAt,0);
});
