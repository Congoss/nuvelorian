import test from 'node:test';
import assert from 'node:assert/strict';
import { recordRetention, retentionReport } from '../server/utils/retentionMetrics.js';
const now=Date.parse('2026-10-28T15:00:00Z');
test('foreground telemetry records active days and sessions, not background snapshots',()=>{
 const p={id:'p',tutorial_step:'welcome'};recordRetention(p,now,false);assert.deepEqual(p.retention_metrics.activeDays,[]);
 recordRetention(p,now,true,'camp');recordRetention(p,now+60000,true,'tasks');assert.equal(p.retention_metrics.sessions,1);assert.equal(p.retention_metrics.observedSeconds,60);
 recordRetention(p,now+3600000,true,'camp');assert.equal(p.retention_metrics.sessions,2);assert.equal(p.retention_metrics.observedSeconds,60);
 p.tutorial_step='quests';recordRetention(p,now+3601000);assert.equal(p.retention_metrics.stepHistory.at(-1).step,'quests');
});
test('retention uses only matured observed cohorts and does not invent historical returns',()=>{
 const players=[
 {id:'a',created_at:'2026-10-20T12:00:00Z',level:15,retention_metrics:{trackingStartedAt:'2026-10-20T12:01:00Z',activeDays:['2026-10-20','2026-10-21','2026-10-27'],lastForegroundAt:'2026-10-27T12:00:00Z'}},
 {id:'b',created_at:'2026-10-20T12:00:00Z',level:2,retention_metrics:{trackingStartedAt:'2026-10-20T12:01:00Z',activeDays:['2026-10-20'],lastForegroundAt:'2026-10-20T12:00:00Z'}},
 {id:'legacy',created_at:'2026-10-20T12:00:00Z',level:100,last_seen_at:'2026-10-27T12:00:00Z'},
 {id:'immature',created_at:'2026-10-28T12:00:00Z',retention_metrics:{trackingStartedAt:'2026-10-28T12:01:00Z',activeDays:['2026-10-28']}}
 ];
 const report=retentionReport(players,{days:30,now});
 assert.equal(report.newPlayers,4);assert.equal(report.retention[0].eligible,2);assert.equal(report.retention[0].rate,50);
 assert.equal(report.cohorts.find(row=>row.date==='2026-10-20').rates[0].eligible,2);
 assert.equal(report.cohorts.find(row=>row.date==='2026-10-28').rates[0].rate,null);
 assert.equal(report.retention[2].rate,50);assert.equal(report.retention[1].rate,0);
 const empty=retentionReport([players[2]],{days:30,now});assert.equal(empty.retention[0].rate,null);
});
test('inactive stage counts exclude unknown and recently active players',()=>{
 const report=retentionReport([{id:'p',created_at:'2026-10-25',tutorial_step:'boss-finger',energy:0,last_seen_at:'2026-10-26',level:3},{id:'q',created_at:'2026-10-25',level:1},{id:'r',created_at:'2026-10-25',last_seen_at:'2026-10-28T14:00:00Z',level:2}],{days:7,now});
 assert.equal(report.inactive24h,1);assert.equal(report.unknownActivity,1);assert.equal(report.dropoff[0].step,'boss-finger');assert.equal(report.dropoff[0].emptyEnergy,1);assert.equal(report.stalledPlayers[0].id,'p');
});
