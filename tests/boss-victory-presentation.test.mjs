import {confirmedCriticalHit, ATTACK_FEEDBACK_MS} from '../src/lib/attackFeedback.js';
import {hasPersonalBossVictory} from '../src/lib/personalBossVictory.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/components/game/BossPanel.jsx', 'utf8').replace(/\r\n/g, '\n');
const refresh = source.slice(source.indexOf('  const refreshFight ='), source.indexOf('  const loadFight ='));
const attack = source.slice(source.indexOf('  const handleAttack ='), source.indexOf('  queuedAttackHandlerRef.current ='));
const deadFight = {id:'fight', boss_id:'heli', status:'dead', current_hp:0};
const finalRows = [{id:'winner', damage:1000}];

test('pending lethal hit keeps the fight mounted under an immediate victory', () => {
  assert.match(source, /const displayedHp = localPoisonView \? localPoisonView\.displayHp \?\? localPoisonView\.fight\.current_hp/);
  assert.match(source, /'Завершальний удар'/);
  assert.match(source, /const victoryModal = visibleVictory \? <BossVictoryModal/);
  assert.doesNotMatch(source, /rewardInBackground/);
});

test('ship victory claim keeps the battle mounted and unlocks its chest modal',()=>{
 const start=source.indexOf('  const handleVictoryClaim =');
 const end=source.indexOf('  const handleBossSelection =',start);
 let closed=false,summary='victory',auto;
 const acknowledged=new Set();
 const context=vm.createContext({fightAdapter:{onClose:()=>{closed=true}},
  suppressLootModal:false,pendingBoxes:[{fightId:'ship-fight',rewardFormula:'boss_v2'}],profile:{},
  setActiveFight:()=>{},pollRef:{current:null},clearInterval:()=>{},
  victorySummary:{fightId:'ship-fight',bossId:'ship-hull'},activeFight:null,autoBoxFightId:null,
  claimedVictoryFightIdsRef:{current:acknowledged},setAutoBoxFightId:id=>{auto=id},
  setVictorySummary:value=>{summary=value},GAME_CONFIG:{BOSSES:[{id:'heli'}]},onUpdateProfile:()=>{}});
 vm.runInContext(source.slice(start,end)+'\nhandleVictoryClaim();',context);
 assert.equal(closed,false);assert.equal(summary,null);assert.equal(auto,'ship-fight');assert(acknowledged.has('ship-fight'));
});

function harness() {
  let resolveRanking;
  const ranking = new Promise(resolve => { resolveRanking = resolve; });
  const snapshots = [];
  let summary = null;
  const noop = () => {};
  const context = vm.createContext({
    hasPersonalBossVictory,myDmgLog:{damage:1},fightAdapter:null, raidMode:false, profile:{id:'player', language:'uk'}, attacking:false,
    activeFight:{...deadFight, status:'active', current_hp:1},
    leaderboard:[{id:'stale', damage:500}],
    escapedFightIdRef:{current:null}, attackEpochRef:{current:0}, attackBusyRef:{current:false}, pollRef:{current:null},
    hitEffectTimerRef:{current:null},
    combatMountedRef:{current:true}, poisonQueueRef:{current:{size:0}},
    rememberFightOnReturn:()=>true,returnFightKey:null,latestTapFeedback:{current:null}, confirmedCriticalHit, ATTACK_FEEDBACK_MS, performance, serverNow:Date.now,
    setCooldownNow:noop,setTapCooldowns:noop,setPendingAttack:noop,setCriticalFeedback:noop,
    confirmAttackFeedback:(_current,_id,hit)=>hit,
    handledBoxKeysRef:{current:new Set()},
    getPendingBoxKey:box => box.instanceId || box.fightId,
    setPendingBoxes:boxes => snapshots.push({type:'boxes',boxes}),
    claimedVictoryFightIdsRef:{current:new Set()},
    GAME_CONFIG:{BOSSES:[{id:'heli', name:'Boss'}]},
    getLocalizedBossName: boss => boss.name,
    loadLeaderboard:() => ranking,
    getBossFightById:async () => deadFight,
    attackBoss:async () => ({fight:deadFight, hit:{damage:1}}),
    isPoisonWeapon:() => false,
    onSyncProfile:noop, onRefreshProfile:async () => {},
    showClanAssistNotice:noop, setMyDmgLog:noop, setHitEffect:noop,
    setBossHitToken:noop, triggerBossEffect:noop, startPolling:noop,
    loadFight:noop,
    setAttacking:noop, setAttackError:error => { if (error) throw Error(error); },
    setActiveFight:update => { const fight = typeof update === 'function' ? update(snapshots.findLast(entry=>entry.type==='fight')?.fight ?? null) : update; snapshots.push({type:'fight', fight}); },
    setVictorySummary:update => {
      summary = typeof update === 'function' ? update(summary) : update;
      snapshots.push({type:'summary', summary});
    },
    clearInterval:noop, window:{setTimeout:noop, clearTimeout:noop}, console,
    pendingFightRequests:new Map(), settleCombatRecovery:async tasks => { for (const task of tasks) await task(); },
    chooseFightSnapshot:(_reason,_current,next)=>next, combatPlayerSnapshot:value=>value,
  });
  vm.runInContext(`${refresh}\n${attack}\nglobalThis.handlers = {refreshFight, handleAttack};`, context);
  return {context, snapshots, resolveRanking};
}

for (const kind of ['finishing attack', 'bleeding kill']) {
  test(`${kind} publishes its result and updates the final ranking safely`, async () => {
    const {context, snapshots, resolveRanking} = harness();
    const pending = kind === 'finishing attack'
      ? context.handlers.handleAttack({id:'finger'})
      : context.handlers.refreshFight('fight', deadFight);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(snapshots.length, 2, 'Victory must render before the ranking request completes');
    assert.equal(snapshots[1].summary.fightId, 'fight');
    resolveRanking(finalRows);
    await pending;
    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0].fight.status, 'dead');
    assert.equal(snapshots.at(-1).summary.leaderboard, finalRows);
    assert.equal(snapshots[1].summary.fightId, 'fight');
  });
}

test('a stale bleeding response cannot replace a newer fight', async () => {
  const {context, snapshots, resolveRanking} = harness();
  const pending = context.handlers.refreshFight('fight', deadFight);
  await new Promise(resolve => setImmediate(resolve));
  context.attackEpochRef.current++;
  resolveRanking(finalRows);
  await pending;
  assert.equal(snapshots.length, 2, 'Late ranking must not change the already displayed fight');
  assert.equal(snapshots.at(-1).summary.leaderboard[0].id, 'stale');
});

test('a claimed result is not reopened by a late ranking response', async () => {
  const {context, snapshots, resolveRanking} = harness();
  const pending = context.handlers.refreshFight('fight', deadFight);
  context.claimedVictoryFightIdsRef.current.add('fight');
  context.setVictorySummary(null);
  resolveRanking(finalRows);
  await pending;
  assert.equal(snapshots.at(-1).summary, null);
});

test('two clicks before a React rerender send only one attack', async () => {
  const {context, resolveRanking} = harness();
  let finish;
  let attacks = 0;
  context.attackBoss = () => { attacks++; return new Promise(resolve => { finish = resolve; }); };
  const first = context.handlers.handleAttack({id:'finger'});
  await context.handlers.handleAttack({id:'finger'});
  assert.equal(attacks, 1);
  assert.equal(context.attackBusyRef.current, true);
  finish({fight:deadFight, hit:{damage:1}});
  resolveRanking(finalRows);
  await first;
  assert.equal(context.attackBusyRef.current, false);
});

test('finishing response queues its chest without waiting for a parent profile refresh', async () => {
  const {context,snapshots,resolveRanking}=harness();
  const box={fightId:'fight',bossId:'heli',instanceId:'chest',rewardFormula:'boss_v2'};
  context.attackBoss=async () => ({fight:deadFight,hit:{damage:1},player:{id:'player',pending_boss_boxes:[box]}});
  await context.handlers.handleAttack({id:'finger'});
  assert.equal(snapshots.find(entry=>entry.type==='boxes').boxes[0].instanceId,'chest');
  assert.equal(snapshots.find(entry=>entry.type==='summary').summary.fightId,'fight');
  resolveRanking(finalRows);
});

test('a saved chest restores the missing victory before showing loot', async () => {
  const start=source.lastIndexOf('  useEffect(() => {',source.indexOf('    const box = pendingBoxes[0];'));
  const end=source.indexOf('  const bleedExpiresAt',start);
  let summary;
  const context=vm.createContext({raidMode:false,suppressLootModal:false,victorySummary:null,
    pendingBoxes:[{fightId:'completed',bossId:'heli'}],claimedVictoryFightIdsRef:{current:new Set()},
    profile:{language:'uk'},GAME_CONFIG:{BOSSES:[{id:'heli',name:'Boss'}]},getLocalizedBossName:boss=>boss.name,
    loadLeaderboard:async () => finalRows,useEffect:callback=>callback(),
    setVictorySummary:update=>{summary=typeof update==='function'?update(summary):update;},
  });
  vm.runInContext(source.slice(start,end),context);
  assert.equal(summary.fightId,'completed');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(summary.leaderboard,finalRows);
});

test('damage ranking closes on fight completion and does not reopen for a new boss', () => {
  const marker = '// Rankings belong to one fight;';
  const start = source.indexOf(marker);
  assert.ok(start >= 0);
  const effect = source.slice(source.indexOf('  useEffect(', start), source.indexOf('  const [secondBossWarning', start));
  let open = true, mode = 'clans', previous;
  const context = vm.createContext({ activeFight: {id:'old',status:'active'}, raidMode:false,
    setLeaderboardOpen:value => {open=value;}, setLeaderboardMode:value => {mode=value;},
    useEffect:(callback,deps) => { if (!previous || deps.some((value,index)=>value!==previous[index])) callback(); previous=deps; },
  });
  vm.runInContext(effect,context);
  open=true;mode='clans';vm.runInContext(effect,context);assert.equal(open,true);
  context.activeFight={id:'old',status:'dead'};vm.runInContext(effect,context);assert.equal(open,false);assert.equal(mode,'players');
  context.activeFight={id:'next',status:'active'};vm.runInContext(effect,context);assert.equal(open,false);
  open=true;context.activeFight={id:'third',status:'active'};vm.runInContext(effect,context);assert.equal(open,false);
});

test('a boss finished by others does not open an empty victory',async()=>{const {context,snapshots}=harness();context.myDmgLog={damage:0};await context.handlers.refreshFight('fight',deadFight);assert(!snapshots.some(entry=>entry.type==='summary'));assert.equal(snapshots[0].fight,null);});
test('a real pending reward keeps its victory available even without own damage',()=>{assert.equal(hasPersonalBossVictory('fight',{damage:0},[{fightId:'fight'}]),true);assert.equal(hasPersonalBossVictory('fight',{damage:0},[{fightId:'other'}]),false);});

test('re-entry ignores an older empty lookup and resumes a discovered ship fight', async () => {
 const load = source.slice(source.indexOf('  const loadFight ='), source.indexOf('  useEffect(() => {\n    if (fightAdapter || raidMode || !joinedBossFight',source.indexOf('  const loadFight =')));
 let resolveOld;
 const old = new Promise(resolve => { resolveOld = resolve; });
 const ship = {id:'ship-active',kind:'ship',current_hp:90,status:'active'};
 let calls=0, resumed=false, activeShip;
 const context=vm.createContext({
  fightAdapter:null,raidMode:false,activeFight:null,profile:{created_by:'test'},pendingFightRequests:new Map(),loadRetryRef:{current:null},chooseFightSnapshot:(_reason,current,next)=>next,readShipScene:()=>null,activeShipFight:null,resumeShip:false,clearInterval(){},clearTimeout(){},setTimeout:()=>0,
  combatMountedRef:{current:true},fightLoadSequence:{current:0},attackEpochRef:{current:0},
  confirmedFightOnReturn:new Map(),returnFightKey:null,rememberFightOnReturn(){},
  listActiveBossFights:()=>++calls===1?old:Promise.resolve([ship]),
  claimedVictoryFightIdsRef:{current:new Set()},pollRef:{current:null},
  setLoading(){},setActiveFight(){},setResumeShip(value){resumed=value;},
  setActiveShipFight(value){activeShip=value;},
 });
 const pending=vm.runInContext(load+'\nPromise.all([loadFight(),loadFight()])',context);
 await new Promise(resolve=>setImmediate(resolve));
 resolveOld([]);
 await pending;
 assert.equal(activeShip,ship);
 assert.equal(resumed,true);
});

test('returning to Sporgol keeps confirmed HP when lookup returns an older snapshot', async () => {
 const start=source.indexOf('  const loadFight =');
 const load=source.slice(start,source.indexOf('  useEffect(() => {\n    if (fightAdapter || raidMode || !joinedBossFight',start));
 const fight={id:'sporgol-active',boss_id:'boss4',status:'active',current_hp:80};
 let opened;
 const context=vm.createContext({
  fightAdapter:null,raidMode:false,activeFight:null,profile:{created_by:'test'},pendingFightRequests:new Map(),loadRetryRef:{current:null},readShipScene:()=>null,activeShipFight:null,resumeShip:false,clearInterval(){},clearTimeout(){},setTimeout:()=>0,
  combatMountedRef:{current:true},fightLoadSequence:{current:0},attackEpochRef:{current:0},
  listActiveBossFights:async()=>[{...fight,current_hp:95}],claimedVictoryFightIdsRef:{current:new Set()},
  confirmedFightOnReturn:new Map([['p:personal',fight]]),returnFightKey:'p:personal',rememberFightOnReturn(){},
  isOlderCombatSnapshot:({fight:previous},{fight:next})=>previous?.id===next.id&&previous.current_hp<next.current_hp,
  escapedFightIdRef:{current:null},pollRef:{current:null},setLoading(){},setActiveShipFight(){},chooseFightSnapshot:(_reason,_current,next)=>next,
  setActiveFight(update){opened=update(opened);},loadLeaderboard:async()=>{},loadMyDmg:async()=>{},startPolling(){},
 });
 await vm.runInContext(load+'\nloadFight()',context);
 assert.equal(opened.current_hp,80);
});
