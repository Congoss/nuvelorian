import test from 'node:test';
import assert from 'node:assert/strict';
import { processTelegramReminders } from './telegram-reminders.js';
import { getQuestMission } from '../../src/lib/questMissionCatalog.js';

const now = Date.parse('2026-10-10T12:00:00.000Z');

function player(overrides = {}) {
  const task_completions = {};
  for (let location = 0; location < 8; location += 1) {
    for (const slug of ['scout', 'loot', 'repair', 'trade', 'fight', 'cache', 'final']) {
      const mission = getQuestMission(`p4-u0${location}-${slug}`);
      task_completions[mission.id] = mission.target;
    }
  }
  return {
    id: 'player-1',
    telegram_id: '12345',
    language: 'en',
    energy: 100,
    max_energy: 100,
    energy_regen_rate: 1,
    last_energy_update: new Date(now - 60_000).toISOString(),
    task_completions,
    location_passive_ready_at: {},
    last_seen_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

test('sends AFK, full-energy, and three-day reminders once per event', async () => {
  const target = player({ location_passive_ready_at: { global: new Date(now - 1).toISOString() } });
  const messages = [];
  const sendMessage = async (_token, _chatId, message) => messages.push(message);

  assert.equal(await processTelegramReminders({ players: [target], now, token: 'test-token', sendMessage }), 3);
  assert.equal(await processTelegramReminders({ players: [target], now: now + 60_000, token: 'test-token', sendMessage }), 0);
  assert.equal(messages.length, 3);
  assert.ok(messages.some((message) => message.includes('free loot')));
  assert.ok(messages.some((message) => message.includes('Fully charged')));
  assert.ok(messages.some((message) => message.includes('3 days away')));
});

test('repeats full-energy reminder after six hours, then rearms after spending and refilling', async () => {
  const target = player({ last_seen_at: new Date(now).toISOString() });
  const messages = [];
  const sendMessage = async (_token, _chatId, message) => messages.push(message);

  assert.equal(await processTelegramReminders({ players: [target], now, token: 'test-token', sendMessage }), 1);
  assert.equal(await processTelegramReminders({ players: [target], now: now + 5 * 60 * 60_000 + 59 * 60_000, token: 'test-token', sendMessage }), 0);
  assert.equal(await processTelegramReminders({ players: [target], now: now + 6 * 60 * 60_000, token: 'test-token', sendMessage }), 1);
  assert.equal(await processTelegramReminders({ players: [target], now: now + 6 * 60 * 60_000 + 60_000, token: 'test-token', sendMessage }), 0);
  target.energy = 90;
  target.last_energy_update = new Date(now + 6 * 60 * 60_000 + 2 * 60_000).toISOString();
  assert.equal(await processTelegramReminders({ players: [target], now: now + 6 * 60 * 60_000 + 2 * 60_000, token: 'test-token', sendMessage }), 0);
  assert.equal(target.telegram_reminder_attempts.energy.sent, true);
  target.energy = 30;
  target.last_energy_update = new Date(now + 6 * 60 * 60_000 + 3 * 60_000).toISOString();
  assert.equal(await processTelegramReminders({ players: [target], now: now + 6 * 60 * 60_000 + 3 * 60_000, token: 'test-token', sendMessage }), 0);
  assert.equal(target.telegram_reminder_attempts.energy.sent, true);
  target.last_seen_at = new Date(now + 6 * 60 * 60_000 + 4 * 60_000).toISOString();
  target.last_energy_update = target.last_seen_at;
  assert.equal(await processTelegramReminders({ players: [target], now: now + 6 * 60 * 60_000 + 4 * 60_000, token: 'test-token', sendMessage }), 0);
  assert.equal(target.telegram_reminder_attempts.energy, undefined);
  target.energy = target.max_energy;
  target.last_energy_update = new Date(now + 6 * 60 * 60_000 + 5 * 60_000).toISOString();
  assert.equal(await processTelegramReminders({ players: [target], now: now + 6 * 60 * 60_000 + 5 * 60_000, token: 'test-token', sendMessage }), 0);
  target.last_energy_update = new Date(now + 6 * 60 * 60_000 + 6 * 60_000).toISOString();
  assert.equal(await processTelegramReminders({ players: [target], now: now + 12 * 60 * 60_000, token: 'test-token', sendMessage }), 1);
  assert.equal(messages.length, 3);
});

test('uses the player language and does not send to profiles without Telegram IDs', async () => {
  const target = player({ language: 'uk', location_passive_ready_at: { global: new Date(now - 1).toISOString() } });
  const messages = [];
  const sendMessage = async (_token, _chatId, message) => messages.push(message);

  await processTelegramReminders({ players: [target, player({ telegram_id: '' })], now, token: 'test-token', sendMessage });
  assert.ok(messages.some((message) => message.includes('халява дозріла')));
  assert.equal(messages.length, 3);
});
