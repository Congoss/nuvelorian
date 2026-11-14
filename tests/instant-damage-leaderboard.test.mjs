import test from 'node:test';
import assert from 'node:assert/strict';
import {instantDamageRow} from '../src/lib/instantDamageLeaderboard.js';
test('all accepted taps appear immediately without modifying confirmed damage',()=>{
 const confirmed={damage:1000,hits:1};
 const row=instantDamageRow({confirmedDamageLog:confirmed,damageLog:{damage:101000,hits:101}},confirmed);
 assert.equal(row.damage,101000);assert.equal(row.pending_damage,100000);assert.equal(row.hits,101);
 assert.equal(confirmed.damage,1000);
});
test('server acknowledgement replaces settled taps rather than counting them twice',()=>{
 const row=instantDamageRow({confirmedDamageLog:{damage:61000,hits:51},damageLog:{damage:111000,hits:101}},{});
 assert.equal(row.damage,111000);assert.equal(row.pending_damage,50000);
 const done=instantDamageRow({confirmedDamageLog:{damage:125000,hits:101},damageLog:{damage:125000,hits:101}},{});
 assert.equal(done.damage,125000);assert.equal(done.pending_damage,0);
});
test('without a projected view the authoritative row is returned',()=>{
 const row={damage:125000};assert.equal(instantDamageRow(null,row),row);
});
