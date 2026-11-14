import assert from 'node:assert/strict';
import test from 'node:test';
import { playerDb } from '../server/data/player-db.js';

test('playerDb deduplicates players by session key and keeps the progressed profile', () => {
  const deduped = playerDb.dedupePlayersBySessionKey([
    { id: 'p1', telegram_id: '777000', username: 'blank', level: 1, xp: 0, tentacles: 0, energy: 100, created_at: '2026-06-14T08:50:56.262Z' },
    { id: 'p2', telegram_id: '777000', username: 'main', level: 31, xp: 158, tentacles: 12191060, energy: 6.15, created_at: '2026-06-12T04:57:58.510Z' },
    { id: 'p3', created_by: 'telegram_1@miniapp.local', username: 'gamma', level: 1, xp: 0, tentacles: 0, energy: 100, created_at: '2026-06-14T08:50:56.262Z' },
    { id: 'p4', created_by: 'telegram_1@miniapp.local', username: 'delta', level: 4, xp: 99, tentacles: 1500, energy: 75, created_at: '2026-06-13T08:50:56.262Z' },
  ]);

  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].id, 'p2');
  assert.equal(deduped[1].id, 'p4');
});

test('playerDb addPlayer reuses an existing session player', () => {
  const players = playerDb.attachPlayers([]);
  const first = playerDb.addPlayer({
    id: 'player-a',
    telegram_id: '777000',
    created_by: 'telegram_777000@miniapp.local',
    username: 'local_tester',
  });
  const second = playerDb.addPlayer({
    id: 'player-b',
    telegram_id: '777000',
    created_by: 'telegram_777000@miniapp.local',
    username: 'local_tester',
  });

  assert.equal(first, second);
  assert.equal(players.length, 1);
  assert.equal(playerDb.getPlayerBySession({ telegramId: '777000' }), first);
});

test('playerDb serializes database timestamps as ISO strings', () => {
  const createdAt = new Date('2026-10-05T22:16:18.000Z');
  const loaded = playerDb.fromDbPlayerRecord({ id: 'p1', created_at: createdAt, data: {} });
  assert.equal(loaded.created_at, '2026-10-05T22:16:18.000Z');
  assert.equal(playerDb.toDbPlayerRecord(loaded).created_at, '2026-10-05T22:16:18.000Z');
  assert.equal(playerDb.toDbPlayerRecord({ id: 'p2', created_at: String(createdAt) }).created_at, '2026-10-05T22:16:18.000Z');
});
