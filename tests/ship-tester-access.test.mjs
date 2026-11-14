import test from 'node:test';
import assert from 'node:assert/strict';
import {createShipTesterAccess} from '../server/utils/shipTesterAccess.js';
test('server password creates an HttpOnly expiring account/clan-bound session',()=>{
 let clock=1000,password='unit-test-secret';const gate=createShipTesterAccess({password:()=>password,secret:'signing-secret',now:()=>clock,lifetimeMs:1000});
 assert(!gate.allowed({},'p1','c1'));
 const set=gate.unlock({},'p1','c1',password);assert(set.includes('HttpOnly'));assert(set.includes('Secure'));assert(set.includes('SameSite=Lax'));
 const headers={cookie:set.split(';')[0]};assert(gate.allowed(headers,'p1','c1'));assert(!gate.allowed(headers,'p2','c1'));assert(!gate.allowed(headers,'p1','c2'));
 assert(!gate.allowed({cookie:headers.cookie+'x'},'p1','c1'));
 clock=2000;assert(!gate.allowed(headers,'p1','c1'));clock=1000;password='rotated';assert(!gate.allowed(headers,'p1','c1'));
});
test('incorrect attempts are limited and a missing password closes the feature',()=>{
 let time=0;const gate=createShipTesterAccess({password:'correct',secret:'test',now:()=>time,maxAttempts:2,windowMs:1000});
 for(let i=0;i<2;i++)assert.throws(()=>gate.unlock({},'p','c','bad'),/PASSWORD_INVALID/);
 assert.throws(()=>gate.unlock({},'p','c','correct'),/RATE_LIMIT/);time=1000;assert(gate.unlock({},'p','c','correct',{secure:false}).includes('HttpOnly'));
 const closed=createShipTesterAccess({password:''});assert(!closed.enabled());assert.throws(()=>closed.unlock({},'p','c',''),/DISABLED/);
});
