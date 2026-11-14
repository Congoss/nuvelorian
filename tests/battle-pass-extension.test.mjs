import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePassView} from '../server/utils/battlePass.js';
test('beta season has 27 days remaining on October 8 and preserves existing tier and XP',()=>{
 delete process.env.BATTLE_PASS_END;delete process.env.BATTLE_PASS_START;delete process.env.BATTLE_PASS_TEST_START;
 const p={battle_pass:{seasonId:'test-2026-09-14',tier:'legendary',xp:1200,claims:['1:free'],season:{key:'test-2026-09-14',metrics:{},awarded:[]}}};
 const view=battlePassView(p,Date.parse('2026-10-08T12:00:00Z'));
 assert.equal(view.daysLeft,27);assert.equal(view.tier,'legendary');assert.equal(view.xp,1200);assert.deepEqual(view.claims,['1:free']);
});
