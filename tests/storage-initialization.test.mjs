import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('simultaneous player requests wait for one complete initialization and retry failures', async () => {
  const source = fs.readFileSync('server/data/player-db.js', 'utf8');
  const helper = source.slice(source.indexOf('async function init(store)'), source.indexOf('export const playerDb'));
  let release;
  let scans = 0;
  const runtime = { initialized: false, initPromise: null };
  const context = vm.createContext({ runtime, console: {log(){}},
    getDatabaseUrl: () => 'db',
    ensureSchema: async () => { scans++; await new Promise(resolve => { release = resolve; }); },
    loadPlayers: async () => [{id:'saved-player'}], attachPlayers: players => players,
  });
  vm.runInContext(helper + '\nglobalThis.run = init;', context);
  const store = {};
  const first = context.run(store);
  const second = context.run(store);
  assert.equal(runtime.initialized, false);
  assert.equal(scans, 1);
  release();
  await Promise.all([first, second]);
  assert.equal(store.players[0].id, 'saved-player');
  assert.equal(runtime.initialized, true);
  runtime.initialized = false;
  context.ensureSchema = async () => { throw new Error('offline'); };
  await assert.rejects(context.run(store), /offline/);
  assert.equal(runtime.initialized, false);
  context.ensureSchema = async () => {};
  assert.equal((await context.run(store))[0].id, 'saved-player');
});

test('global storage can recover after a transient startup failure', async () => {
  const source = fs.readFileSync('server/data/store.js', 'utf8');
  const method = source.slice(source.indexOf('  async init() {'), source.indexOf('  async persistNow()'));
  let calls = 0;
  const context = vm.createContext({runtime:{initPromise:null}, getDatabaseUrl:() => 'db',
    ensureSchema:async () => { if (++calls === 1) throw new Error('offline'); },
    loadState:async () => ({players:[], raidBoss:{}}), isCurrentRaidBoss:() => true,
    applyStateToStore:() => {},
  });
  vm.runInContext(`globalThis.storage = {${method}}`, context);
  await assert.rejects(context.storage.init(), /offline/);
  const result = await context.storage.init();
  assert.equal(result.players.length, 0);
  assert.equal(calls, 2);
});
