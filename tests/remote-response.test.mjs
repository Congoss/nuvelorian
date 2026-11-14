import test from 'node:test';
import assert from 'node:assert/strict';
import {readRemoteResponse} from '../src/lib/remoteResponse.js';
import {localizeApiError} from '../src/lib/apiErrorTranslations.js';
import {settleCombatRecovery} from '../src/lib/combatRecovery.js';

test('nginx gateway HTML is never exposed as a player error',async()=>{
 const result=await readRemoteResponse(new Response('<html><head><title>502 Bad Gateway</title></head><body>nginx/1.24</body></html>',{status:502,headers:{'content-type':'text/html'}}));
 assert.deepEqual(result,{code:'GATEWAY_UNAVAILABLE'});
 for(const lang of ['uk','ru','en']){const message=localizeApiError(result.code,'fallback',lang);assert.notEqual(message,'fallback');assert(!/html|nginx|502/i.test(message));}
});
test('valid JSON survives; malformed JSON and HTML with a JSON content type do not',async()=>{
 assert.deepEqual(await readRemoteResponse(Response.json({data:{stock:45}})),{data:{stock:45}});
 assert.deepEqual(await readRemoteResponse(new Response('<html>broken</html>',{status:200,headers:{'content-type':'application/json'}})),{code:'REMOTE_INVALID_RESPONSE'});
 assert.deepEqual(await readRemoteResponse(Response.json({message:'<html>proxy</html>'},{status:500})),{code:'REMOTE_INVALID_RESPONSE'});
 assert.equal(await readRemoteResponse(new Response(null,{status:204})),null);
});
test('a failed combat recovery releases its wait even if one state read never responds',async()=>{
 let reads=0;
 const result=await settleCombatRecovery([()=>{reads++;return new Promise(()=>{});},()=>{reads++;throw Error('offline');}],{timeoutMs:10});
 assert.equal(result,null);assert.equal(reads,2);
});
test('completed recovery settles reads without issuing an attack',async()=>{
 const result=await settleCombatRecovery([async()=>({stock:44}),async()=>({hp:99})]);
 assert.equal(result.length,2);assert(result.every(x=>x.status==='fulfilled'));
});
