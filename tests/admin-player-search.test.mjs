import test from 'node:test';
import assert from 'node:assert/strict';
import {filterAdminPlayers} from '../server/utils/adminPlayerSearch.js';
test('admin search finds players beyond initial 500 by nickname and profile identifiers',()=>{
 const players=Array.from({length:700},(_,i)=>({id:String(i),nickname:'Player'+i}));
 Object.assign(players[650],{username:'TargetUser',telegram_id:'987654321',near_wallet_id:'target.near',email:'target@example.com'});
 for(const query of [' Player650 ','@TARGETUSER','987654321','target.near','target@example.com']) assert.equal(filterAdminPlayers(players,query)[0].id,'650');
 assert.equal(filterAdminPlayers(players,'missing').length,0);assert.equal(filterAdminPlayers(players,' ').length,700);
});
