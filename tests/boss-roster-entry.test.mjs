import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/components/game/BossPanel.jsx', 'utf8').replace(/\r\n/g, '\n');
const a = source.indexOf('  const loadFight = async (');
const b = source.indexOf('\n  useEffect(', a);
assert.ok(a >= 0 && b > a, 'loadFight must be present');
const code = source.slice(a, b) + '\nglobalThis.load=loadFight;';

function setup() {
  let resolve;
  const loading = [], fights = [], epoch = { current: 0 };
  const context = vm.createContext({
    fightAdapter: null, raidMode: false, activeFight: null, attackEpochRef: epoch,
    fightLoadSequence: { current: 0 }, combatMountedRef: { current: true },
    confirmedFightOnReturn: new Map(), pendingFightRequests: new Map(), returnFightKey: 'p:boss',
    activeShipFight: null, readShipScene: () => null, resumeShip: false, setResumeShip: () => {},
    rememberFightOnReturn: () => true, isOlderCombatSnapshot: () => false,
    chooseFightSnapshot: (_reason, _current, next) => next, escapedFightIdRef: { current: null },
    loadLeaderboard: async () => [], loadMyDmg: async () => null, startPolling: () => {},
    setLoading: value => loading.push(value), profile: { created_by: 'p@test' },
    listActiveBossFights: () => new Promise(done => { resolve = done; }),
    claimedVictoryFightIdsRef: { current: new Set() }, setActiveShipFight: () => {},
    setActiveFight: value => fights.push(value), pollRef: { current: null }, loadRetryRef: { current: null },
    clearInterval: () => {}, clearTimeout: () => {}, setTimeout: () => 0,
  });
  vm.runInContext(code, context);
  return { context, loading, fights, epoch, resolve: rows => resolve(rows) };
}

test('boss roster is not blocked while the active fight check is pending', async () => {
  const s = setup();
  const task = s.context.load();
  assert(!s.loading.includes(true));
  s.resolve([]);
  await task;
  assert(!s.loading.includes(true));
  assert.equal(s.fights.length, 1);
});

test('an old fight check cannot overwrite a newly requested battle', async () => {
  const s = setup();
  const task = s.context.load();
  s.epoch.current++;
  s.resolve([]);
  await task;
  assert.equal(s.fights.length, 0);
});
