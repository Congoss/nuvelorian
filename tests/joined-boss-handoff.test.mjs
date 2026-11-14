import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('src/components/game/BossPanel.jsx','utf8').replaceAll('\r','');
const start=source.indexOf('    if (fightAdapter || raidMode || !joinedBossFight?.id) return;');
const end=source.indexOf('  }, [joinedBossFight?.id]);',start);
function apply(fight,ack=[]){const shown=[],consumed=[],epoch={current:0};vm.runInNewContext('(function(){'+source.slice(start,end)+'})()',{fightAdapter:null,raidMode:false,joinedBossFight:fight,onJoinedBossFightConsumed:id=>consumed.push(id),claimedVictoryFightIdsRef:{current:new Set(ack)},serverNow:()=>1000,attackEpochRef:epoch,setActiveFight:f=>shown.push(f),setLoading(){},setAttackError(){},loadLeaderboard:async()=>[],loadMyDmg:async()=>null,startPolling(){}});return {shown,consumed,epoch};}
const fight={id:'cleo',status:'active',current_hp:300,ends_at:new Date(10000).toISOString()};
test('acknowledged victory cannot reopen from an old invitation snapshot',()=>{const result=apply(fight,['cleo']);assert.equal(result.shown.length,0);assert.deepEqual(result.consumed,['cleo']);});
test('dead, zero HP and expired invitation snapshots are consumed without showing the battle',()=>{for(const patch of [{status:'dead'},{current_hp:0},{ends_at:new Date(500).toISOString()}]){const result=apply({...fight,...patch});assert.equal(result.shown.length,0);assert.deepEqual(result.consumed,['cleo']);}});
test('active invitation opens once and invalidates the previous roster request',()=>{const result=apply(fight);assert.equal(result.shown.length,1);assert.equal(result.epoch.current,1);assert.deepEqual(result.consumed,['cleo']);});
