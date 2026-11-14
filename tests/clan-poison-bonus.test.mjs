import test from 'node:test';
import assert from 'node:assert/strict';
import { clanPoisonMultiplier, resolveBossHit } from '../server/utils/bossHit.js';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';

// Level 8 of the clan damage achievement grants +8% poison damage.
const clan = { achievements: { damage: { progress: 25000000 } } };
const fight = { id: 'f', boss_id: 'heli', max_hp: 1e9, current_hp: 1e9, started_at: new Date(0).toISOString() };
const weapon = id => GAME_CONFIG.WEAPONS.find(item => item.id === id);

test('clan damage achievement level 8 gives exactly +8% poison damage', () => {
  assert.equal(clanPoisonMultiplier(clan), 1.08);
  assert.equal(clanPoisonMultiplier(null), 1);
});

for (const count of [1, 5, 10, 100]) for (const poison of [true, false]) {
  test(`v2 clan poison bonus +8% applies once, poison=${poison}, batch=${count}`, () => {
    const used = poison ? weapon('satchel') : weapon('fist');
    const hit = withClan => resolveBossHit({ player: {}, weapon: used, levels: {}, state: {}, fight, clan: withClan ? clan : null,
      count: poison ? count : 1, now: 1, random: () => 0.5 });
    const plain = hit(false), boosted = hit(true);
    assert.equal(boosted.damage, poison ? Math.floor(plain.damage * 1.08) : plain.damage);
    assert.equal(boosted.poisonDamage, poison ? Math.floor(plain.poisonDamage * 1.08) : 0);
  });
}
