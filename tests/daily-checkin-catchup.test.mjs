import test from 'node:test';import assert from 'node:assert/strict';import {getTaskState,getDayTasks} from '../src/lib/questNotifications.js';import {applyPlayerAction} from '../server/utils/playerActions.js';import {getGlobalWeekMeta} from '../server/utils/globalWeeklyCycle.js';
test('only current-day checkin is claimable once',()=>{
 for(let currentDay=1;currentDay<=7;currentDay++)for(let day=1;day<=7;day++){
  const task=getDayTasks(day).find(t=>t.baseId==='checkin');assert.equal(getTaskState({},task,day,currentDay,[]).claimable,day===currentDay);assert.equal(getTaskState({},task,day,currentDay,[task.id]).claimable,false);
 }
});
test('server pays each unlocked checkin once and rejects repeats',()=>{
 const meta=getGlobalWeekMeta(),p={level:1,xp:0,tentacles:0,energy:0};
 for(const day of [meta.currentDayIndex]){
  const task=getDayTasks(day).find(t=>t.baseId==='checkin');applyPlayerAction(p,{type:'daily-task',day,taskId:task.id});const balance=p.tentacles;
  assert.equal(applyPlayerAction(p,{type:'daily-task',day,taskId:task.id}).alreadyClaimed,true);assert.equal(p.tentacles,balance);
 }
 assert.equal(p.roulette_bonus_spins,1);
});

test('past energy tasks can be claimed from accumulated weekly spend',()=>{
 const meta=getGlobalWeekMeta();
 if(meta.currentDayIndex<3)return;
 const p={level:3,xp:0,tentacles:0,energy:100,energy_spent_today:100,currentWeekKey:meta.currentWeekKey,
  daily_task_progress:{week:meta.currentWeekKey,date:meta.currentDateKey,last:{spendEnergy:100},days:{1:{spendEnergy:70},2:{spendEnergy:80}}}};
 const dayOneTask=getDayTasks(1).find(t=>t.baseId==='spendEnergy');
 applyPlayerAction(p,{type:'daily-task',day:1,taskId:dayOneTask.id});
 assert.equal(p.tentacles,getDayTasks(1)[0].tentacles);
 const dayTwoTask=getDayTasks(2).find(t=>t.baseId==='spendEnergy');
 applyPlayerAction(p,{type:'daily-task',day:2,taskId:dayTwoTask.id});
 assert.equal(p.tentacles,getDayTasks(1)[0].tentacles + getDayTasks(2)[0].tentacles);
});
