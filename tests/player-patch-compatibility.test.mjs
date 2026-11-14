import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizePlayerPatch } from '../server/utils/playerPatchCompatibility.js';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';

test('profile sync with legacy AFK fields cannot claim rewards or reset the timer', () => {
  const player = { tentacles: 100, stat_strength: 1, xp: 0,
    task_completions: Object.fromEntries(['scout','loot','repair','trade','fight','cache','final'].map(slug => {
      const mission = getQuestMission(`p4-u00-${slug}`); return [mission.id, mission.target];
    })), location_passive_ready_at: { global: new Date(0).toISOString() },
    location_passive_last_claim_at: new Date(-1000).toISOString() };
  const payload = normalizePlayerPatch({ language: 'ru', tentacles: 999999999, energy: 999999,
    location_passive_ready_at: { global: new Date(0).toISOString() } });
  assert.deepEqual(payload, { language: 'ru', tentacles: 999999999, energy: 999999 });
  assert.equal(normalizePlayerPatch({ location_passive_ready_at: { global: new Date(0).toISOString() } }).playerAction, undefined);
  assert.equal(player.tentacles, 100);
  assert.equal(player.location_passive_last_claim_at, new Date(-1000).toISOString());
  assert.equal(player.location_passive_ready_at.global, new Date(0).toISOString());
});

test('explicit AFK claim action grants once', () => {
  const player = { tentacles: 100, stat_strength: 1, xp: 0,
    task_completions: Object.fromEntries(['scout','loot','repair','trade','fight','cache','final'].map(slug => {
      const mission = getQuestMission(`p4-u00-${slug}`); return [mission.id, mission.target];
    })), location_passive_ready_at: { global: new Date(0).toISOString() } };
  const payload = normalizePlayerPatch({ playerAction: { type: 'claim-afk' } });
  assert.deepEqual(payload, { playerAction: { type: 'claim-afk' } });
  applyPlayerAction(player, payload.playerAction);
  const balance = player.tentacles;
  assert.ok(balance > 100);
  assert.throws(() => applyPlayerAction(player, payload.playerAction), { code: 'AFK_NOT_READY' });
  assert.equal(player.tentacles, balance);
});

test('modern actions remain unchanged', () => {
  const payload = { playerAction: { type: 'claim-afk' } };
  assert.equal(normalizePlayerPatch(payload), payload);
});

test('tutorial completion accepts true only and cannot change economy fields', () => {
  const source = fs.readFileSync(new URL('../server/app.js', import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function pickSafePlayerPatch('), source.indexOf('function pickSafePlayerCreate('));
  const pick = vm.runInNewContext('(' + fn.trim() + ')');
  assert.equal(pick({ first_boss_tutorial_seen: true, tentacles: 999 }).first_boss_tutorial_seen, true);
  assert.equal(pick({ tentacles: 999 }).tentacles, undefined);
  for (const value of [false, 'true', 1, null]) assert.equal(pick({ first_boss_tutorial_seen: value }).first_boss_tutorial_seen, undefined);
});

test('mail read markers accept bounded unique IDs without allowing economy changes', () => {
  const source = fs.readFileSync(new URL('../server/app.js', import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function pickSafePlayerPatch('), source.indexOf('function pickSafePlayerCreate('));
  const pick = vm.runInNewContext('(' + fn.trim() + ')');
  const result = pick({ gift_mail_read_ids: ['a', 'a', '', null, 42, 'x'.repeat(161), 'b'], tentacles: 999 });
  assert.deepEqual(Array.from(result.gift_mail_read_ids), ['a', 'b']);
  assert.equal(result.tentacles, undefined);
  assert.equal(pick({ gift_mail_read_ids: 'all' }).gift_mail_read_ids, undefined);
  const many = pick({ clan_mail_read_ids: Array.from({ length: 250 }, (_, i) => String(i)) });
  assert.equal(many.clan_mail_read_ids.length, 200);
  assert.equal(many.clan_mail_read_ids[0], '50');
});
