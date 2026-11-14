import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyOnlineState, onlineDuelCommand, ONLINE_ROUND_MS, ONLINE_QUEUE_MS, PVP_AI_FALLBACK_MS } from '../server/services/pvp-online.js';
import { duelCommitment } from '../server/services/pvp-duel.js';
import { createOnlinePvpRepository } from '../server/services/pvp-online-store.js';
const a = { id:'a', nickname:'Alice' }, b = { id:'b', nickname:'Bob' }, c = { id:'c', nickname:'Carol' };
function setup() {
  const state = emptyOnlineState(); let now = 1000;
  const call = (p, body) => onlineDuelCommand(state,p,body,now);
  return { state, call, advance: ms => now += ms };
}
function pair(call) { call(a,{action:'queue'}); return call(b,{action:'queue'}).match; }
test('queue pairs distinct authenticated players, consumes attempts on match only, and uses real gear', () => {
  const {state,call} = setup();
  const searching=call(a,{action:'queue',preset:{attack:999999},stats:{attack:999999}});
  assert.equal(searching.progress.attempts,5); assert.equal(searching.queue.status,'searching');
  call(a,{action:'queue'}); assert.equal(state.queue.length,1);
  const match=call(b,{action:'queue'}).match;
  assert.equal(match.player.name,'Bob'); assert.equal(match.opponent.name,'Alice');
  assert.equal(match.player.attack,100); assert.equal(match.player.maxHp,200);
  assert.equal(call(a).match.id,match.id); assert.equal(call(a).progress.attempts,4);
  assert.equal(call(c).match,null); assert.equal(state.queue.length,0);
});
test('hidden simultaneous choices reveal only after both submit; retries never deal damage twice', () => {
  const {state,call}=setup(); const {id}=pair(call);
  const choice={action:'choose',matchId:id,round:1,choice:'finger'};
  const first=call(a,choice).match;
  assert.equal(first.submitted,true);assert.equal(first.history.length,0);
  const enemy=call(b).match;
  assert.equal(enemy.selectedChoice,null);assert.equal(enemy.opponentReady,true);
  assert.ok(!JSON.stringify(enemy).includes('finger'));
  call(a,choice);assert.throws(()=>call(a,{...choice,choice:'poison'}),/ROUND_ALREADY_PLAYED/);
  const resolved=call(b,{...choice,choice:'pencil'}).match;
  assert.equal(resolved.round,2);assert.equal(resolved.player.hp,100);
  assert.equal(resolved.history[0].winner,'opponent');
  assert.equal(call(a,choice).match.history.length,1);
  assert.throws(()=>call(a,{...choice,choice:'pencil'}),/ROUND_ALREADY_PLAYED/);
  assert.throws(()=>call(c,choice),/WRONG_DUEL/);
  assert.throws(()=>call(b,{...choice,round:99}),/STALE_ROUND/);
  assert.equal(state.matches[id].fighters[1].hp,100);
});
test('wins settle mirrored ratings and history once; stale abandon cannot affect a new match', () => {
  const {call}=setup();let match=pair(call);
  for(let round=1;round<=2;round++){
    call(a,{action:'choose',matchId:match.id,round,choice:'finger'});
    match=call(b,{action:'choose',matchId:match.id,round,choice:'pencil'}).match;
  }
  assert.equal(match.status,'finished');assert.equal(match.result,'loss');
  assert.equal(call(a).match.result,'win');assert.ok(call(a).progress.rating>0);
  const rating=call(a).progress.rating;
  call(a,{action:'choose',matchId:match.id,round:2,choice:'finger'});
  call(b,{action:'abandon',matchId:match.id});assert.equal(call(a).progress.rating,rating);
  assert.equal(call(a).progress.history.length,1);
  call(a,{action:'queue'});const next=call(b,{action:'queue'}).match;
  assert.notEqual(next.id,match.id);
  assert.throws(()=>call(a,{action:'abandon',matchId:match.id}),/WRONG_DUEL/);
  assert.equal(call(a).match.status,'active');
});
test('disconnect permits resuming saved choices; timeout forfeits once, both absent draw', () => {
  const {call,advance}=setup();const m=pair(call);
  call(a,{action:'choose',matchId:m.id,round:1,choice:'poison'});
  advance(ONLINE_ROUND_MS-1);assert.equal(call(a).match.submitted,true);
  advance(1);assert.equal(call(b).match.result,'loss');assert.equal(call(a).match.result,'win');
  assert.equal(call(a).progress.history.length,1);
  call(a,{action:'queue'});call(b,{action:'queue'});advance(ONLINE_ROUND_MS);
  assert.equal(call(a).match.result,'draw');assert.equal(call(b).match.result,'draw');
});
test('queue cancellation and stale searches never consume attempts or match absent players', () => {
  const {call,advance}=setup();call(a,{action:'queue'});call(a,{action:'cancel'});
  assert.equal(call(b,{action:'queue'}).match,null);call(b,{action:'cancel'});
  call(a,{action:'queue'});advance(ONLINE_QUEUE_MS);
  assert.equal(call(b,{action:'queue'}).match,null);assert.equal(call(a).progress.attempts,5);
});
test('gear is frozen at queue entry and canonical enhancement map is honored', () => {
  const {call}=setup();const player={...a,inventory_items:[{id:'set1_weapon',slot:'weapon'}],equipped_items:{weapon:'set1_weapon'},equipment_enhancement_levels:{set1_weapon:15}};
  call(player,{action:'queue'});const before=call(player);player.equipment_enhancement_levels.set1_weapon=0;
  const result=call({...player,...b,equipment_enhancement_levels:{set1_weapon:15}},{action:'queue'});const mine=call(player).match;
  assert.ok(result.match);assert.equal(mine.player.weaponLevel,15);assert.equal(before.match,null);
});
test('durable repository serializes simultaneous requests and resumes in a new service', async () => {
  const dir=mkdtempSync(join(tmpdir(),'pvp-online-'));const localPath=join(dir,'state.json');
  try {
    const repository=createOnlinePvpRepository({localPath,now:()=>1000});
    await Promise.all([repository.command(a,{action:'queue'}),repository.command(b,{action:'queue'})]);
    const {match}=await repository.command(a);
    await Promise.all([repository.command(a,{action:'choose',matchId:match.id,round:1,choice:'finger'}),repository.command(b,{action:'choose',matchId:match.id,round:1,choice:'pencil'})]);
    const restarted=createOnlinePvpRepository({localPath,now:()=>1100});
    const next=await restarted.command(a);
    assert.equal(next.match.id,match.id);assert.equal(next.match.round,2);assert.equal(next.match.history.length,1);
    await assert.rejects(restarted.command(a,{action:'choose',matchId:match.id,round:1,choice:'poison'}),/ROUND_ALREADY_PLAYED/);
    assert.equal((await restarted.command(b)).match.player.hp,100);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('attempts are spent only on pairing, no sixth fight, and one refills after eight minutes', () => {
  const {call,advance}=setup();
  for(let i=0;i<5;i++){
    const match=pair(call);call(a,{action:'abandon',matchId:match.id});
  }
  assert.equal(call(a).progress.attempts,0);
  assert.throws(()=>call(a,{action:'queue'}),/PVP_COOLDOWN/);
  advance(8*60_000);assert.equal(call(a).progress.attempts,1);
  assert.equal(pair(call).status,'active');assert.equal(call(a).progress.attempts,0);
});
test('round cap settles a draw and rejects new moves after completion', () => {
  const {call}=setup();const match=pair(call);
  for(let round=1;round<=30;round++)for(const p of [a,b])call(p,{action:'choose',matchId:match.id,round,choice:'finger'});
  assert.equal(call(a).match.result,'draw');assert.equal(call(b).progress.rating,0);
  assert.equal(call(a).match.history.length,30);
  assert.throws(()=>call(a,{action:'choose',matchId:match.id,round:31,choice:'finger'}),/STALE_ROUND/);
});
test('mismatched builds wait and queue heartbeat keeps a legitimate search alive', () => {
  const {call,advance,state}=setup();call(a,{action:'queue'});
  // A trusted, stronger snapshot models the wider pool without client-provided stats.
  state.queue[0].stats.attack=300;
  assert.equal(call(b,{action:'queue'}).match,null);
  advance(5_000);assert.equal(call(a).queue.status,'searching');call(b);
  advance(2_000);assert.equal(call(b,{action:'queue'}).match.status,'active');
});
test('one ranked queue falls back at 10 seconds, not before, with a hidden committed AI move', () => {
  const state=emptyOnlineState();const start=1000;
  const call=(body,now)=>onlineDuelCommand(state,a,body,now,()=>0);
  const search=call({action:'queue'},start);
  assert.equal(search.queue.fallbackAt,start+PVP_AI_FALLBACK_MS);
  assert.equal(call(undefined,start+PVP_AI_FALLBACK_MS-1).match,null);
  const next=call(undefined,start+PVP_AI_FALLBACK_MS);
  const match=next.match;
  assert.equal(next.queue,null);assert.equal(match.opponent.kind,'ai');assert.equal(match.opponent.name,'Тор');
  assert.equal(match.player.attack,100);assert.equal(match.opponent.attack,100);
  assert.equal(match.history.length,0);assert.equal(match.selectedChoice,null);assert.equal(match.opponentReady,true);
  assert.ok(match.commitment);assert.equal(next.progress.attempts,4);
  assert.equal(Object.keys(state.profiles).length,1,'AI does not create a player account');
  assert.equal(call(undefined,start+PVP_AI_FALLBACK_MS+1).match.id,match.id);
  assert.equal(call({action:'queue'},start+PVP_AI_FALLBACK_MS+2).progress.attempts,4,'retry never spends another attempt');
  let result=call({action:'choose',matchId:match.id,round:1,choice:'poison'},start+PVP_AI_FALLBACK_MS+3);
  const receipt=result.match.history[0];
  assert.equal(receipt.opponentChoice,'finger');assert.equal(receipt.commitment,match.commitment);
  assert.equal(duelCommitment(match.id,1,receipt.opponentChoice,receipt.nonce),match.commitment);
  result=call({action:'choose',matchId:match.id,round:2,choice:'poison'},start+PVP_AI_FALLBACK_MS+4);
  assert.equal(result.match.result,'win');assert.ok(result.progress.rating>0);assert.equal(result.progress.history.length,1);
  assert.equal(result.progress.history[0].opponentKind,'ai');assert.equal(result.progress.leaders.length,2);assert.equal(result.progress.leaders.filter(p=>p.kind==='ai').length,1);
  const rating=result.progress.rating;
  result=call({action:'choose',matchId:match.id,round:2,choice:'poison'},start+PVP_AI_FALLBACK_MS+5);
  assert.equal(result.progress.rating,rating);assert.equal(result.progress.history.length,1);
});
test('human pairing wins the race before fallback; cancel at deadline never starts AI', () => {
  const {call,advance}=setup();call(a,{action:'queue'});advance(PVP_AI_FALLBACK_MS-1);
  assert.equal(call(b,{action:'queue'}).match.opponent.kind,'human');
  advance(1);assert.equal(call(a).match.opponent.kind,'human');assert.equal(call(a).progress.attempts,4);
  const other=setup();other.call(a,{action:'queue'});other.advance(PVP_AI_FALLBACK_MS);
  const result=other.call(a,{action:'cancel'});assert.equal(result.match,null);assert.equal(result.queue,null);assert.equal(result.progress.attempts,5);
});
test('expired or cancelled searches never become background AI matches; AI timeout records a single loss', () => {
  const {call,advance}=setup();call(a,{action:'queue'});advance(ONLINE_QUEUE_MS);
  assert.equal(call(a).match,null);assert.equal(call(a).progress.attempts,5);
  call(a,{action:'queue'});advance(PVP_AI_FALLBACK_MS);const ai=call(a).match;
  advance(ONLINE_ROUND_MS);assert.equal(call(a).match.result,'loss');assert.equal(call(a).progress.history.length,1);
  assert.equal(call(a).match.id,ai.id);assert.equal(call(a).progress.history.length,1);
});
