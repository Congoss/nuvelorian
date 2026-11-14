import test from 'node:test';
import assert from 'node:assert/strict';
import {switchWebAccount} from '../src/lib/platform/switchWebAccount.js';
test('switching accounts clears the app session and wallet selection without unlinking identity',async()=>{
 const calls=[];
 await switchWebAccount({logout:async()=>{calls.push('logout');return {ok:true};},disconnect:async()=>{calls.push('disconnect');},clearSelection:()=>calls.push('clear-selection'),navigate:()=>calls.push('login')});
 assert.deepEqual(calls,['logout','disconnect','clear-selection','login']);
});
test('failed logout preserves current session view; wallet cleanup failure does not prevent a successful logout',async()=>{
 let navigated=false;
 await assert.rejects(switchWebAccount({logout:async()=>({ok:false}),disconnect:async()=>{},clearSelection:()=>{},navigate:()=>{navigated=true;}}));assert.equal(navigated,false);
 await switchWebAccount({logout:async()=>({ok:true}),disconnect:async()=>{throw Error('wallet unavailable');},clearSelection:()=>{},navigate:()=>{navigated=true;}});assert.equal(navigated,true);
});
