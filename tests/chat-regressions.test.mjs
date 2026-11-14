import test from 'node:test';
import assert from 'node:assert/strict';
import {currentClanDonationWindow} from '../src/lib/clanDonationState.js';
import {armorBreachSecondsLeft} from '../src/lib/bossArmor.js';
import {serverNow,syncServerClock} from '../src/lib/serverClock.js';
import {getTalentUpgradeCost,applyTalentUpgrade} from '../src/lib/talents.js';
import {getQuestMission} from '../src/lib/questMissionCatalog.js';
import {passiveReward,claimPassiveReward} from '../server/utils/passiveRewards.js';

test('cached clan contribution unlocks exactly at the server deadline without refetch',()=>{
 const window={contribution:2500,contribution_cap:2500,available_at:new Date(10000).toISOString()};
 assert.equal(currentClanDonationWindow(window,9999).contribution,2500);
 assert.deepEqual(currentClanDonationWindow(window,10000),{...window,contribution:0,available_at:null});
 assert.equal(window.contribution,2500);
});
test('armor display uses synchronized time despite a device clock moved twelve hours',()=>{
 const original=Date.now;
 try{
  syncServerClock({headers:new Headers({date:'Wed, 04 Nov 2026 20:00:00 GMT'})});
  const state={breachUntil:serverNow()+10000};
  Date.now=()=>original()+12*3600000;
  assert.ok(armorBreachSecondsLeft(state,serverNow())>=9);
  assert.equal(armorBreachSecondsLeft(state,state.breachUntil),0);
 }finally{Date.now=original;}
});
test('all advanced displayed prices match spent points at each purchasable level',()=>{
 const base=Object.fromEntries(Array.from({length:60},(_,i)=>['t'+String(i+1).padStart(2,'0'),10]));
 for(let i=1;i<=20;i++)for(let level=0;level<10;level++){
  const id='a'+String(i).padStart(2,'0');
  const levels={...base,...Object.fromEntries(Array.from({length:20},(_,j)=>['a'+String(j+1).padStart(2,'0'),10])),[id]:level};
  const player={talent_tree_version:2,talent_levels:levels,available_talent_points:1000,total_talent_points_spent:5000};
  const price=getTalentUpgradeCost(player,id),result=applyTalentUpgrade(player,id);
  assert.ok(result,`${id}/${level} should be unlocked`);
  assert.equal(player.available_talent_points-result.available_talent_points,price);
  assert.equal(result.total_talent_points_spent-player.total_talent_points_spent,price);
 }
});
test('AFK percentage never decreases on advancing quest totals or collecting a reward',()=>{
 const slugs=['scout','loot','repair','trade','fight','cache','final'];
 const p={task_completions:{},location_passive_ready_at:{global:new Date(0).toISOString()}};
 let previous=0;
 for(let loops=1;loops<=20;loops++)for(let location=0;location<8;location++){
  for(const slug of slugs){const task=getQuestMission(`p4-u0${location}-${slug}`);p.task_completions[task.id]=task.target*loops;}
  const percent=passiveReward(p).percent;assert.ok(percent>=previous);previous=percent;
 }
 const reward=claimPassiveReward(p,1000);assert.equal(reward.percent,previous);assert.equal(passiveReward(p).percent,previous);
});
