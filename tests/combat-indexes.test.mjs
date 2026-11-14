import test from 'node:test';
import assert from 'node:assert/strict';
import {activeBossFights,activeBossFightsByOwners,findBossFight,findBossDamageLog} from '../server/utils/combatIndexes.js';

test('fight indexes follow appends, completion, truncation and replaced arrays',()=>{
 const old={id:'old',status:'dead',opened_by_email:'a'},a={id:'a',status:'active',opened_by_email:'a'};
 const rows=[old,a];assert.equal(findBossFight(rows,'old'),old);assert.deepEqual(activeBossFights(rows),[a]);
 const b={id:'b',status:'active',opened_by_email:'b'};rows.push(b);
 assert.equal(findBossFight(rows,'b'),b);assert.deepEqual(activeBossFights(rows),[a,b]);
 a.status='dead';assert.deepEqual(activeBossFights(rows),[b]);
 rows.splice(0,rows.length,b);assert.equal(findBossFight(rows,'a'),undefined);
 const fresh={id:'a',status:'active'};assert.equal(findBossFight([fresh],'a'),fresh);
});
test('active clan targets retain original fight order and observe completion',()=>{
 const rows=[{id:'a',status:'active',opened_by_email:'a'},{id:'b',status:'active',opened_by_email:'B'},{id:'old',status:'dead',opened_by_email:'a'}];
 assert.deepEqual(activeBossFightsByOwners(rows,['b',' A ','b']).map(x=>x.id),['a','b']);
 rows[0].status='dead';assert.deepEqual(activeBossFightsByOwners(rows,['a','b']).map(x=>x.id),['b']);
});
test('damage lookup preserves first-match semantics and live row references',()=>{
 const a={fight_id:'f',player_email:'A',damage:1},b={fight_id:'f',player_email:'A',damage:99},rows=[a,b];
 assert.equal(findBossDamageLog(rows,'f','A'),a);assert.equal(findBossDamageLog(rows,'f','a'),undefined);
 a.damage=10;assert.equal(findBossDamageLog(rows,'f','A').damage,10);
 const c={fight_id:'g',player_email:'B'};rows.push(c);assert.equal(findBossDamageLog(rows,'g','B'),c);
 rows.splice(0,rows.length,c);assert.equal(findBossDamageLog(rows,'f','A'),undefined);
});
