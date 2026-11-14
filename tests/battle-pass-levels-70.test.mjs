import test from 'node:test';import assert from 'node:assert/strict';import{BP_REWARDS,BP_LEVELS,BP_MAX_XP}from'../src/lib/battlePass.js';import{battlePassView,claimBattlePassReward,recordBattlePassEvent}from'../server/utils/battlePass.js';
process.env.BATTLE_PASS_TEST_START='2026-09-14T00:00:00Z';process.env.BATTLE_PASS_END='2026-11-04T00:00:00Z';const now=Date.parse('2026-10-26T10:00:00Z');
test('20 additional levels preserve old progress and have no premium currency or raffle tickets',()=>{
 assert.equal(BP_LEVELS,70);assert.equal(BP_REWARDS.length,70);assert.ok(BP_MAX_XP>=10500);
 for(const row of BP_REWARDS.slice(50))for(const track of ['free','epic','legendary'])for(const reward of row[track])assert.ok(['medium','large','dm','energy','spin'].includes(reward.type));
 const p={};p.battle_pass=p.battle_pass=battlePassView(p,now);p.battle_pass.xp=9600;p.battle_pass.tier='legendary';p.battle_pass.claims=['free:50'];const view=battlePassView(p,now);assert.equal(view.level,64);assert.deepEqual(view.claims,['free:50']);
 assert.equal(claimBattlePassReward(p,{level:57,track:'free'},now),true);assert.equal(p.roulette_bonus_spins,2);assert.equal(claimBattlePassReward(p,{level:57,track:'free'},now),false);assert.equal(p.roulette_bonus_spins,2);
 assert.throws(()=>claimBattlePassReward(p,{level:70,track:'legendary'},now));p.battle_pass.xp=10500;assert.equal(claimBattlePassReward(p,{level:70,track:'legendary'},now),true);assert.equal(p.weapon_inventory['large-poison'],20);
});
test('free accounts cannot claim paid extension rewards and XP continues past the old cap',()=>{const p={};p.battle_pass=battlePassView(p,now);p.battle_pass.xp=9600;assert.throws(()=>claimBattlePassReward(p,{level:57,track:'epic'},now));recordBattlePassEvent(p,{type:'mission',success:true,energy:100,dm:10},now);assert.ok(p.battle_pass.xp>9600);});

