import test from 'node:test';
import assert from 'node:assert/strict';
import {withShipRequestTimeout} from '../src/lib/shipCombatRequest.js';
test('stalled requests abort with an ambiguous timeout instead of a definitive rejection',async()=>{
 let requestSignal;
 await assert.rejects(withShipRequestTimeout(signal=>{requestSignal=signal;return new Promise(()=>{});},{timeoutMs:10}),error=>error.code==='SHIP_REQUEST_TIMEOUT'&&error.status===undefined);
 assert.equal(requestSignal.aborted,true);
});
test('successful requests keep the confirmed response and do not abort',async()=>{
 let signal;const result=await withShipRequestTimeout(s=>{signal=s;return {fight:{current_hp:12}};},{timeoutMs:100});
 assert.equal(result.fight.current_hp,12);assert.equal(signal.aborted,false);
});
