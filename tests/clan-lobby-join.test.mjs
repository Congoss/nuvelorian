import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/components/game/ClanPanel.jsx', 'utf8');
const rows = source.slice(source.indexOf('function buildClanRows('), source.indexOf('function ClanLobbyRow('));
const join = source.slice(source.indexOf('  const joinClan = async'), source.indexOf('  const createClan = async'));

function setup(request) {
  let feedback;
  let refreshes = 0;
  const context = vm.createContext({
    profile:{language:'ru'}, hasClan:false, joinBusyRef:{current:false},
    joinClanRequest:request, setJoiningClanId:() => {},
    setJoinFeedback:value => { feedback = value; },
    onRefreshProfile:async () => { refreshes++; }, loadClans:async () => {},
  });
  vm.runInContext(`${rows}\n${join}\nglobalThis.handlers = {joinClan, buildClanRows};`, context);
  return {context, feedback:() => feedback, refreshes:() => refreshes};
}

test('clan lobby keeps application policy and required level from server', () => {
  const {context} = setup(async () => ({}));
  const [row] = context.handlers.buildClanRows([{id:'secret', name:'Secret Rabbits', achievements:{}, join_type:'request', min_level:25}], key => key);
  assert.equal(row.join_type, 'request');
  assert.equal(row.min_level, 25);
});

test('application response is visible and does not reload the lobby', async () => {
  const game = setup(async () => ({requested:true}));
  await game.context.handlers.joinClan({id:'secret'});
  assert.equal(game.feedback().requested, true);
  assert.match(game.feedback().message, /одобрения/);
  assert.equal(game.refreshes(), 0);
  assert.equal(game.context.joinBusyRef.current, false);
});

test('server refusal is visible in the selected clan card and permits retry', async () => {
  const game = setup(async () => { throw Object.assign(new Error('Level is too low'), {code:'CLAN_LEVEL_REQUIRED'}); });
  await game.context.handlers.joinClan({id:'secret'});
  assert.equal(game.feedback().clanId, 'secret');
  assert.equal(game.feedback().error, true);
  assert.match(game.feedback().message, /уровень/);
  assert.equal(game.context.joinBusyRef.current, false);
});

test('open clan refreshes profile after successful membership', async () => {
  const game = setup(async () => ({player:{clan_id:'planet4'}}));
  await game.context.handlers.joinClan({id:'planet4'});
  assert.equal(game.refreshes(), 1);
});
