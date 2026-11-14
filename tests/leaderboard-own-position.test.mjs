import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('server/app.js', 'utf8');
const start = source.indexOf("if ((url.pathname === '/leaderboard' ||");
const route = source.slice(start, source.indexOf("  if (url.pathname === '/chat/messages'", start));

async function request(pathname, players, me, query = {}) {
  let result;
  const context = vm.createContext({
    url:{pathname}, request:{method:'GET'}, response:{}, store:{players},
    getQuery:() => ({sort:'-stat_strength', ...query}),
    getPlayerReferralCount:player => player.referrals || 0,
    getPlayerReferralCounts:sourcePlayers => new Map(sourcePlayers.map(player => [String(player.id), player.referrals || 0])),
    getPowerForLeaderboard:player => player.stat_strength,
    ensureCurrentPlayer:() => me, publicPlayerProfile:player => player,
    sendData:(_res, status, data) => { result = {status, data}; },
    sendError:(_res, status) => { result = {status}; },
  });
  await vm.runInContext(`(async () => {${route}})()`, context);
  return result;
}

test('a player at 567 has a real global position without insertion into top 100', async () => {
  const players = Array.from({length:600}, (_, index) => ({id:String(index + 1), stat_strength:600 - index}));
  const me = players[566];
  const own = await request('/leaderboard/me', players, me);
  assert.equal(own.data.rank, 567);
  assert.equal(own.data.player.id, me.id);
  const top = await request('/leaderboard', players, me, {limit:100});
  assert.equal(top.data.length, 100);
  assert.equal(top.data.some(player => player.id === me.id), false);
});

test('referral rank uses the referral leaderboard order', async () => {
  const me = {id:'me', stat_strength:1, referrals:20};
  const result = await request('/leaderboard/me', [{id:'first', stat_strength:10, referrals:21}, me, {id:'last', stat_strength:999, referrals:1}], me, {sort:'-referrals'});
  assert.equal(result.data.rank, 2);
});

test('own position requires an authenticated player', async () => {
  assert.equal((await request('/leaderboard/me', [], null)).status, 401);
});
