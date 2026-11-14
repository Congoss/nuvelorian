const DAY = 86400000;
export const retentionDay = time => new Date(time).toISOString().slice(0,10);
const time = value => { const n=Date.parse(value||'');return Number.isFinite(n)?n:null; };
export function recordRetention(player, now=Date.now(), foreground=false, screen='') {
 const previous=player.retention_metrics||{};
 const step=player.tutorial_disabled?'disabled':player.tutorial_step||'welcome';
 const changed=previous.lastStep!==step;
 const days=foreground?[...new Set([...(previous.activeDays||[]),retentionDay(now)])].slice(-400):previous.activeDays||[];
 if(!changed&&!foreground)return;
 const old=time(previous.lastForegroundAt);
 const session=foreground&&(!old||now-old>30*60000);
 player.retention_metrics={...previous,trackingStartedAt:previous.trackingStartedAt||new Date(now).toISOString(),activeDays:days,lastStep:step,stepHistory:changed?[...(previous.stepHistory||[]),{step,at:new Date(now).toISOString()}].slice(-100):previous.stepHistory||[],...(foreground?{lastForegroundAt:new Date(now).toISOString(),lastScreen:String(screen).slice(0,32),sessions:Number(previous.sessions||0)+(session?1:0),observedSeconds:Number(previous.observedSeconds||0)+(old&&now-old>=0&&now-old<90000?Math.min(60,Math.floor((now-old)/1000)):0)}:{})};
}
export function retentionReport(players,{days=7,now=Date.now()}={}) {
 const cohort=players.filter(p=>{const created=time(p.created_at||p.created_date);return created!==null&&created>=now-days*DAY&&created<=now&&!p.is_banned;});
 const seen=p=>time(p.retention_metrics?.lastForegroundAt)||time(p.last_seen_at)||time(p.last_login_date);
 const inactive=cohort.filter(p=>seen(p)!==null&&now-seen(p)>=DAY);
 const sum=predicate=>cohort.filter(predicate).length;
 const funnel=[['registered',()=>true],['startedGuide',p=>Number(p.energy_spent_total)>0||Number(p.level)>1],['firstQuest',p=>Object.values(p.task_completions||{}).some(n=>Number(n)>0)],['firstBoss',p=>Number(p.boss_kills)>0],['level8',p=>Number(p.level)>=8],['level15',p=>Number(p.level)>=15],['clan',p=>Boolean(p.clan_id||p.clan_name)]];
 const buckets=new Map();
 for(const p of inactive){const step=p.tutorial_disabled?'disabled':p.tutorial_step||'unknown';const row=buckets.get(step)||{step,players:0,emptyEnergy:0,medianLevel:0,levels:[]};row.players++;row.emptyEnergy+=Number(p.energy||0)<=0?1:0;row.levels.push(Number(p.level||1));buckets.set(step,row);}
 const retention=[1,3,7].map(offset=>{
  const eligible=cohort.filter(p=>{
   const created=time(p.created_at||p.created_date),start=time(p.retention_metrics?.trackingStartedAt);
   return start!==null&&start-created<DAY&&start>=created&&p.retention_metrics?.activeDays?.includes(retentionDay(created))&&Date.parse(retentionDay(created))+((offset+1)*DAY)<=now;
  });
  const returned=eligible.filter(p=>p.retention_metrics.activeDays.includes(retentionDay(time(p.created_at||p.created_date)+offset*DAY))).length;
  return {day:offset,eligible:eligible.length,returned,rate:eligible.length?Math.round(returned/eligible.length*1000)/10:null};
 });
 const cohorts=[...new Set(cohort.map(p=>retentionDay(time(p.created_at||p.created_date))))].sort().slice(-14).map(date=>{
  const pool=cohort.filter(p=>retentionDay(time(p.created_at||p.created_date))===date);
  const rates=[1,3,7].map(offset=>{
   const eligible=pool.filter(p=>{const created=time(p.created_at||p.created_date),started=time(p.retention_metrics?.trackingStartedAt);return started!==null&&started>=created&&started-created<DAY&&p.retention_metrics?.activeDays?.includes(date)&&Date.parse(date)+(offset+1)*DAY<=now;});
   const returned=eligible.filter(p=>p.retention_metrics.activeDays.includes(retentionDay(Date.parse(date)+offset*DAY))).length;
   return {day:offset,eligible:eligible.length,returned,rate:eligible.length?Math.round(returned/eligible.length*1000)/10:null};
  });
  return {date,players:pool.length,rates};
 });
 const levels=[[1,1],[2,3],[4,7],[8,14],[15,29],[30,99999]].map(([min,max])=>({label:max===99999?'30+':min===max?String(min):`${min}–${max}`,players:sum(p=>Number(p.level||1)>=min&&Number(p.level||1)<=max),inactive:inactive.filter(p=>Number(p.level||1)>=min&&Number(p.level||1)<=max).length}));
 const durations=cohort.filter(p=>p.retention_metrics?.stepHistory?.length>1).map(p=>{const history=p.retention_metrics.stepHistory;return history.slice(1).map((event,i)=>({step:history[i].step,seconds:Math.max(0,Math.round((time(event.at)-time(history[i].at))/1000))}));}).flat().filter(row=>row.seconds<=3600);
 return {cohorts,stalledPlayers:inactive.sort((a,b)=>seen(b)-seen(a)).slice(0,50).map(p=>({id:p.id,name:p.nickname||p.username||p.id,level:Number(p.level||1),step:p.tutorial_step||'unknown',energy:Number(p.energy||0),lastSeen:new Date(seen(p)).toISOString(),screen:p.retention_metrics?.lastScreen||'—'})),days,newPlayers:cohort.length,tracked:sum(p=>Boolean(p.retention_metrics?.lastForegroundAt)),active24h:sum(p=>seen(p)!==null&&now-seen(p)<DAY),inactive24h:inactive.length,unknownActivity:sum(p=>seen(p)===null),funnel:funnel.map(([id,test])=>({id,players:sum(test)})),retention,levels,dropoff:[...buckets.values()].map(row=>({...row,medianLevel:row.levels.sort((a,b)=>a-b)[Math.floor(row.levels.length/2)],levels:undefined})).sort((a,b)=>b.players-a.players),stepTimes:[...new Set(durations.map(row=>row.step))].map(step=>{const values=durations.filter(row=>row.step===step).map(row=>row.seconds).sort((a,b)=>a-b);return {step,samples:values.length,medianSeconds:values[Math.floor(values.length/2)]};}).sort((a,b)=>b.medianSeconds-a.medianSeconds).slice(0,10)};
}
