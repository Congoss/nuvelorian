import test from 'node:test';import assert from 'node:assert/strict';
import {requestPvpAiPolicy,schedulePvpAiCoaching,chooseCachedPvpAiMove} from '../server/services/pvp-near-ai.js';
import {emptyOnlineState,onlineDuelCommand,PVP_AI_FALLBACK_MS} from '../server/services/pvp-online.js';
import {duelCommitment} from '../server/services/pvp-duel.js';
test('NEAR AI sees completed moves only; policy remains bounded and legal',async()=>{
 let body;
 const result=await requestPvpAiPolicy([{playerChoice:'finger',opponentChoice:'pencil',winner:'player',email:'private',selectedChoice:'poison'}],{apiKey:'test',fetchImpl:async(url,options)=>{assert.equal(url,'https://cloud-api.near.ai/v1/chat/completions');body=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{message:{content:'{"finger":0,"pencil":0,"poison":1}'}}]})};}});
 assert.deepEqual(result,[.15,.15,.7000000000000001]);assert.ok(!JSON.stringify(body).includes('private'));assert.ok(!JSON.stringify(body).includes('selectedChoice'));
});
test('offline/invalid inference always returns local-fallback indication',async()=>{
 assert.equal(await requestPvpAiPolicy([]),null);
 for(const content of ['bad','{"finger":-1,"pencil":1,"poison":1}','{"finger":0,"pencil":0,"poison":0}'])assert.equal(await requestPvpAiPolicy([],{apiKey:'test',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content}}]})})}),null);
 assert.equal(await requestPvpAiPolicy([],{apiKey:'test',fetchImpl:async()=>{throw Error('offline');}}),null);
});

test('asynchronous coaching cannot rewrite a committed move; future NEAR AI move has a valid reveal',async()=>{
 const saved={fetch:globalThis.fetch,key:process.env.PVP_NEAR_AI_KEY,enabled:process.env.PVP_NEAR_AI_ENABLED};
 try{
  process.env.PVP_NEAR_AI_KEY='test';process.env.PVP_NEAR_AI_ENABLED='1';
  let requests=0;
  globalThis.fetch=async()=>{requests++;return {ok:true,json:async()=>({choices:[{message:{content:'{"finger":1,"pencil":0,"poison":0}'}}]})};};
  const state=emptyOnlineState(),actor={id:'policy-test'},now=Date.now();
  onlineDuelCommand(state,actor,{action:'queue'},now,()=>.1);
  const first=onlineDuelCommand(state,actor,undefined,now+PVP_AI_FALLBACK_MS,()=>.1).match;
  schedulePvpAiCoaching(first);schedulePvpAiCoaching(first);
  await new Promise(r=>setImmediate(r));
  assert.equal(requests,1);assert.ok(chooseCachedPvpAiMove(first.id,()=>.1));
  assert.equal(state.matches[first.id].ai.commitment,first.commitment);
  const next=onlineDuelCommand(state,actor,{action:'choose',matchId:first.id,round:1,choice:state.matches[first.id].choices[1]},now+PVP_AI_FALLBACK_MS+1,()=>.1).match;
  assert.equal(next.aiProvider,'near-ai');
  const reveal=onlineDuelCommand(state,actor,{action:'choose',matchId:first.id,round:2,choice:state.matches[first.id].choices[1]},now+PVP_AI_FALLBACK_MS+2,()=>.1).match.history[1];
  assert.equal(duelCommitment(first.id,2,reveal.opponentChoice,reveal.nonce),next.commitment);
 }finally{
  globalThis.fetch=saved.fetch;
  for(const [env,value] of [['PVP_NEAR_AI_KEY',saved.key],['PVP_NEAR_AI_ENABLED',saved.enabled]])if(value===undefined)delete process.env[env];else process.env[env]=value;
 }
});
