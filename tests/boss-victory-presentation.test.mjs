import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/components/game/BossPanel.jsx', 'utf8');
const refresh = source.slice(source.indexOf('  const refreshFight ='), source.indexOf('  const loadFight ='));
const attack = source.slice(source.indexOf('  const handleAttack ='), source.indexOf('  const getWeaponCdLeft ='));
const deadFight = {id:'fight', boss_id:'heli', status:'dead', current_hp:0};
const finalRows = [{id:'winner', damage:1000}];

function harness() {
  let resolveRanking;
  const ranking = new Promise(resolve => { resolveRanking = resolve; });
  const snapshots = [];
  let summary = null;
  const noop = () => {};
  const context = vm.createContext({
    raidMode:false, profile:{id:'player', language:'uk'}, attacking:false,
    activeFight:{...deadFight, status:'active', current_hp:1},
    leaderboard:[{id:'stale', damage:500}],
    attackEpochRef:{current:0}, pollRef:{current:null},
    hitEffectTimerRef:{current:null},
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
    setActiveFight:fight => snapshots.push({type:'fight', fight}),
    setVictorySummary:update => {
      summary = typeof update === 'function' ? update(summary) : update;
      snapshots.push({type:'summary', summary});
    },
    clearInterval:noop, window:{setTimeout:noop, clearTimeout:noop}, console,
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
    assert.equal(snapshots.length, kind === 'finishing attack' ? 2 : 0);
    if (kind === 'finishing attack') assert.equal(snapshots[1].summary.fightId, 'fight');
    resolveRanking(finalRows);
    await pending;
    assert.equal(snapshots.length, kind === 'finishing attack' ? 3 : 2);
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
  assert.equal(snapshots.length, 0);
});

test('a claimed result is not reopened by a late ranking response', async () => {
  const {context, snapshots, resolveRanking} = harness();
  const pending = context.handlers.refreshFight('fight', deadFight);
  context.claimedVictoryFightIdsRef.current.add('fight');
  resolveRanking(finalRows);
  await pending;
  assert.equal(snapshots.find(snapshot => snapshot.type === 'summary').summary, null);
});
