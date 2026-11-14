import test from 'node:test';
import assert from 'node:assert/strict';
import {getDayTasks,getTaskState} from '../src/lib/questNotifications.js';
test('past check-ins stay locked; claimed rewards stay unavailable',()=>{
 for(const day of [1,2,3,4]){
  const task=getDayTasks(day).find(t=>t.baseId==='checkin');
  assert.equal(getTaskState({},task,day,4,[]).claimable,day===4);
  const claimed=getTaskState({},task,day,4,[task.id]);
  assert.equal(claimed.claimable,false);
  assert.equal(claimed.complete,true);
 }
});

import {applyPlayerAction} from '../server/utils/playerActions.js';
test('server rejects past checkins and pays current checkin once',()=>{
 const now=Date.now; Date.now=()=>Date.parse('2026-10-08T12:00:00Z');
 try{
  const player={level:3,xp:0,energy:100,max_energy:100,tentacles:0};
  for(const day of [1,2,4]){
   const task=getDayTasks(day).find(t=>t.baseId==='checkin');
   const action={type:'daily-task',day,taskId:task.id};
   if(day<4){assert.throws(()=>applyPlayerAction(player,action),e=>e.code==='DAILY_TASK_INCOMPLETE');continue;}
   applyPlayerAction(player,action);
   const balance=player.energy;
   assert.equal(applyPlayerAction(player,action).alreadyClaimed,true);
   assert.equal(player.energy,balance);
  }
  assert.equal(player.roulette_bonus_spins,1);
 }finally{Date.now=now;}
});
