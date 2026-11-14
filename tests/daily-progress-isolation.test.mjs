import test from 'node:test';
import assert from 'node:assert/strict';
import {captureDailyTaskProgress,getTaskState,getDayTasks} from '../src/lib/questNotifications.js';
const meta=(day)=>({currentWeekKey:'2026-10-05',currentDateKey:'2026-10-0'+(4+day),currentDayIndex:day});
const task=(day,key)=>getDayTasks(day).find(t=>t.baseId===key);
test('fishing replaces both raid tasks in three languages and preserves claimed rewards',()=>{
 const titles={uk:'Злови будь-яку рибу',en:'Catch any fish',ru:'Поймай любую рыбу'};
 for(const day of [6,7]) for(const [lang,title] of Object.entries(titles)) {
  const t=getDayTasks(day,lang).find(t=>t.baseId==='catchFish');
  assert.equal(t.title,title);
  assert.equal(t.id,`day-${day}-raidBoss-6`);
  assert.equal(getTaskState({},t,day,day,[t.id]).claimed,true);
 }
 const p={currentWeekKey:meta(6).currentWeekKey};
 captureDailyTaskProgress(p,meta(6));
 p.cosmo_fishing_caught_total=1;captureDailyTaskProgress(p,meta(6));
 assert.equal(getTaskState(p,task(6,'catchFish'),6,6,[]).claimable,true);
 assert.equal(getTaskState(p,task(7,'catchFish'),7,6,[]).claimable,false);
 captureDailyTaskProgress(p,meta(7));
 assert.equal(getTaskState(p,task(7,'catchFish'),7,7,[]).claimable,false);
 p.cosmo_fishing_caught_total++;captureDailyTaskProgress(p,meta(7));
 assert.equal(getTaskState(p,task(7,'catchFish'),7,7,[]).claimable,true);
});
test('today cannot complete future days; old days retain their own progress',()=>{
 const p={currentWeekKey:meta(1).currentWeekKey,total_tasks_today:5,energy_spent_today:30,collection_item_counts:{a:1}};
 captureDailyTaskProgress(p,meta(1));
 assert.equal(getTaskState(p,task(1,'missions'),1,1,[]).claimable,true);
 assert.equal(getTaskState(p,task(2,'missions'),2,1,[]).current,0);
 captureDailyTaskProgress(p,meta(2));
 assert.equal(getTaskState(p,task(2,'missions'),2,2,[]).current,0);
 p.total_tasks_today+=10;captureDailyTaskProgress(p,meta(2));
 assert.equal(getTaskState(p,task(2,'missions'),2,2,[]).claimable,true);
 assert.equal(getTaskState(p,task(1,'missions'),1,2,[]).current,5);
 assert.equal(getTaskState(p,task(3,'missions'),3,2,[]).current,0);
});
test('consuming artifacts does not undo daily collection progress',()=>{
 const p={currentWeekKey:meta(1).currentWeekKey,collection_item_counts:{a:1}};
 captureDailyTaskProgress(p,meta(1));p.collection_item_counts.a=0;captureDailyTaskProgress(p,meta(1));
 assert.equal(getTaskState(p,task(1,'artifacts'),1,1,[]).current,1);
});
test('energy spending accumulates across the event so past daily goals remain claimable',()=>{
 const p={currentWeekKey:meta(1).currentWeekKey,daily_task_progress:{week:meta(1).currentWeekKey,days:{4:{spendEnergy:120},5:{spendEnergy:0},6:{spendEnergy:0},7:{spendEnergy:220}}}};
 const dayFive=getTaskState(p,task(5,'spendEnergy'),5,7,[]);
 const daySix=getTaskState(p,task(6,'spendEnergy'),6,7,[]);
 assert.equal(dayFive.current,150);assert.equal(dayFive.claimable,true);
 assert.equal(daySix.current,180);assert.equal(daySix.claimable,true);
});

test('energy task state is safe before weekly progress is initialized',()=>{
 const energyTask=task(1,'spendEnergy');
 const state=getTaskState({},energyTask,1,1,[]);
 assert.equal(state.current,0);
 assert.equal(state.claimable,false);
});

test('day two replaces starter fragments with a tracked 1000 boss damage task in all languages',()=>{
 const expected={uk:'Нанеси 1000 шкоди босам',ru:'Нанеси 1 000 урона боссам',en:'Deal 1,000 damage to bosses'};
 for(const [language,title] of Object.entries(expected)){
  const replacement=getDayTasks(2,language).find(item=>item.baseId==='bossDamage'&&item.goal===1000);
  assert.ok(replacement);
  assert.equal(replacement.title,title);
  assert.equal(replacement.xp,5);assert.equal(replacement.tentacles,1000);assert.equal(replacement.energyBonus,20);
 }
 const p={currentWeekKey:meta(2).currentWeekKey,boss_damage_today:0};
 captureDailyTaskProgress(p,meta(2));
 p.boss_damage_today=1000;captureDailyTaskProgress(p,meta(2));
 const replacement=getDayTasks(2).find(item=>item.baseId==='bossDamage'&&item.goal===1000);
 const state=getTaskState(p,replacement,2,2,[]);
 assert.equal(state.current,1000);assert.equal(state.claimable,true);
});

test('server captures newly earned boss damage before validating the daily claim',()=>{
 const savedNow=Date.now;
 try{
  Date.now=()=>Date.parse('2026-10-06T12:00:00Z');
  const p={level:3,xp:0,currentWeekKey:meta(2).currentWeekKey,boss_damage_today:0};
  captureDailyTaskProgress(p,meta(2));
  p.boss_damage_today=1000;
  const damageTask=getDayTasks(2).find(item=>item.baseId==='bossDamage'&&item.goal===1000);
  const result=applyPlayerAction(p,{type:'daily-task',day:2,taskId:damageTask.id});
  assert.equal(result.reward.xp,5);
  assert.ok(p.daily_event.claimedRewards[2].includes(damageTask.id));
 }finally{Date.now=savedNow;}
});

test('server reports an unknown daily task separately from an already-claimed task',(t)=>{
 t.mock.method(Date,'now',()=>Date.parse('2026-10-06T12:00:00Z'));
 const p={level:3,xp:0,currentWeekKey:meta(2).currentWeekKey};
 assert.throws(
  ()=>applyPlayerAction(p,{type:'daily-task',day:2,taskId:'day-2-not-a-real-task'}),
  error=>error.code==='DAILY_TASK_UNKNOWN',
 );
});

import {applyPlayerAction} from '../server/utils/playerActions.js';
test('server rejects yesterday counters for next-day rewards and credits a new completion once',()=>{
 const savedNow=Date.now;
 try {
  const p={level:3,xp:0,currentWeekKey:meta(1).currentWeekKey,total_tasks_today:5};
  Date.now=()=>Date.parse('2026-10-05T12:00:00Z');captureDailyTaskProgress(p,meta(1));
  Date.now=()=>Date.parse('2026-10-06T12:00:00Z');captureDailyTaskProgress(p,meta(2));
  const action={type:'daily-task',day:2,taskId:task(2,'missions').id};
  assert.throws(()=>applyPlayerAction(p,action),error=>error.code==='DAILY_TASK_INCOMPLETE');
  p.total_tasks_today+=10;captureDailyTaskProgress(p,meta(2));
  const firstClaim=applyPlayerAction(p,action);
  assert.equal(firstClaim.alreadyClaimed,undefined);
  assert.equal(p.roulette_bonus_spins,1);
  const duplicateClaim=applyPlayerAction(p,action);
  assert.equal(duplicateClaim.alreadyClaimed,true);
  assert.equal(p.roulette_bonus_spins,1);
 } finally {Date.now=savedNow;}
});

test('unchanged daily metrics never dirty the player profile on repeated reads',()=>{
 let writes=0;
 const p=new Proxy({currentWeekKey:meta(1).currentWeekKey,total_tasks_today:5},{set(target,key,value){writes++;target[key]=value;return true;}});
 captureDailyTaskProgress(p,meta(1));const before=writes;
 for(let index=0;index<100;index++)captureDailyTaskProgress(p,meta(1));
 assert.equal(writes,before);
 p.total_tasks_today++;captureDailyTaskProgress(p,meta(1));
 assert.equal(p.daily_task_progress.days[1].missions,6);
});


test('server credits all Tuesday tasks on Wednesday once, except checkin',(t)=>{
 t.mock.method(Date,'now',()=>Date.parse('2026-10-07T12:00:00Z'));
 const p={level:3,xp:0,currentWeekKey:meta(2).currentWeekKey};
 captureDailyTaskProgress(p,meta(2));captureDailyTaskProgress(p,meta(3));
 Object.assign(p,{total_tasks_today:10,energy_spent_today:60,collection_item_counts:{a:2},boss_damage_today:1000,newbie_stats:{small_poison_uses:1}});
 for(const item of getDayTasks(2)){
  const action={type:'daily-task',day:2,taskId:item.id};
  if(item.baseId==='checkin')assert.throws(()=>applyPlayerAction(p,action),e=>e.code==='DAILY_TASK_INCOMPLETE');
  else {
   assert.ok(applyPlayerAction(p,action).reward);
   assert.equal(applyPlayerAction(p,action).alreadyClaimed,true);
  }
 }
 assert.equal(p.roulette_bonus_spins,6);
 for(const item of getDayTasks(4))assert.equal(getTaskState(p,item,4,3,[]).claimable,false);
});
