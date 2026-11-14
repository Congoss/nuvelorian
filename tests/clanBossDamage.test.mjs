import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arePlayersClanMates,
  getClanDamageFightTargets,
  isActiveBossFight,
} from '../server/utils/clanBossDamage.js';

process.env.NODE_ENV = 'test';
process.env.BATTLE_PASS_TEST_START = '2026-09-14T00:00:00Z';
process.env.BATTLE_PASS_END = '2026-11-04T00:00:00Z';
// Keep the integration test in-memory even if a developer has a local DB URL.
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) {
  process.env[key] = '';
}

const [{ createApp, processTalentBleedTicks }, { store }, { playerDb }] = await Promise.all([
  import('../server/app.js'),
  import('../server/data/store.js'),
  import('../server/data/player-db.js'),
]);

function player({ id, email, clanId = '', clanName = '' }) {
  return {
    id,
    created_by: email,
    clan_id: clanId,
    clan_name: clanName,
  };
}

function fight({ id, ownerEmail, status = 'active', hp = 100 }) {
  return {
    id,
    opened_by_email: ownerEmail,
    status,
    current_hp: hp,
  };
}

test('clan matching prefers canonical IDs and uses normalized names only when an ID is missing', () => {
  assert.equal(
    arePlayersClanMates(
      { clan_id: '  Night-Wolves ', clan_name: 'Alpha' },
      { clan_id: 'night-wolves', clan_name: 'Different name' },
    ),
    true,
  );
  assert.equal(
    arePlayersClanMates(
      { clan_id: 'night-wolves', clan_name: 'Same Name' },
      { clan_id: 'other-clan', clan_name: ' same name ' },
    ),
    false,
  );
  assert.equal(
    arePlayersClanMates(
      { clan_id: 'night-wolves', clan_name: '  Frost   Pack ' },
      { clan_id: '', clan_name: 'frost pack' },
    ),
    true,
  );
  assert.equal(
    arePlayersClanMates(
      { clan_id: '', clan_name: '   ' },
      { clan_id: '', clan_name: '' },
    ),
    false,
  );
});

test('a fight is active only with active status and positive HP', () => {
  assert.equal(isActiveBossFight({ status: 'active', current_hp: '1' }), true);
  assert.equal(isActiveBossFight({ status: 'active', current_hp: 0 }), false);
  assert.equal(isActiveBossFight({ status: 'dead', current_hp: 1 }), false);
  assert.equal(isActiveBossFight(null), false);
});

test('a player without a clan damages only the selected source fight', () => {
  const attacker = player({ id: 'a', email: 'a@example.test' });
  const sourceFight = fight({ id: 'source', ownerEmail: attacker.created_by, status: 'dead', hp: 0 });
  const targets = getClanDamageFightTargets({
    attacker,
    sourceFight,
    players: [attacker],
    fights: [
      sourceFight,
      fight({ id: 'other-own-fight', ownerEmail: attacker.created_by }),
    ],
  });

  assert.deepEqual(targets.map((item) => item.id), ['source']);
});

test('fan-out targets every active personal fight of clan mates, not outsiders', () => {
  const attacker = player({ id: 'a', email: 'a@example.test', clanId: 'night-wolves', clanName: 'Night Wolves' });
  const mate = player({ id: 'b', email: 'b@example.test', clanId: 'NIGHT-WOLVES', clanName: 'Different display name' });
  const outsider = player({ id: 'c', email: 'c@example.test', clanId: 'other-clan', clanName: 'Night Wolves' });
  const sourceFight = fight({ id: 'source', ownerEmail: attacker.created_by });

  const targets = getClanDamageFightTargets({
    attacker,
    sourceFight,
    players: [attacker, mate, outsider],
    fights: [
      sourceFight,
      fight({ id: 'own-second', ownerEmail: attacker.created_by }),
      fight({ id: 'mate-heli', ownerEmail: mate.created_by }),
      fight({ id: 'mate-boss4', ownerEmail: mate.created_by, hp: '50' }),
      fight({ id: 'mate-dead', ownerEmail: mate.created_by, status: 'dead' }),
      fight({ id: 'mate-empty', ownerEmail: mate.created_by, hp: 0 }),
      fight({ id: 'outsider', ownerEmail: outsider.created_by }),
      fight({ id: 'orphan', ownerEmail: 'missing@example.test' }),
      fight({ id: 'mate-heli', ownerEmail: mate.created_by }),
    ],
  });

  assert.deepEqual(targets.map((item) => item.id), [
    'source',
    'own-second',
    'mate-heli',
    'mate-boss4',
  ]);
});

test('legacy clan-name matching still resolves owners through opened_by_email', () => {
  const attacker = player({ id: 'a', email: 'a@example.test', clanName: '  Frost   Pack ' });
  const mate = player({ id: 'b', email: 'b@example.test', clanName: 'frost pack' });
  const unlistedMate = player({ id: 'c', email: 'c@example.test', clanName: 'frost pack' });
  const sourceFight = fight({ id: 'source', ownerEmail: attacker.created_by });

  const targets = getClanDamageFightTargets({
    attacker,
    sourceFight,
    players: [attacker, mate],
    fights: [
      sourceFight,
      fight({ id: 'mate', ownerEmail: mate.created_by }),
      fight({ id: 'unlisted-owner', ownerEmail: unlistedMate.created_by }),
    ],
  });

  assert.deepEqual(targets.map((item) => item.id), ['source', 'mate']);
});

function seededPlayer({ id, telegramId, username, clanId = '', clanName = '' }) {
  return {
    id,
    telegram_id: String(telegramId),
    created_by: `telegram_${telegramId}@miniapp.local`,
    username,
    clan_id: clanId,
    clan_name: clanName,
    level: 1,
    xp: 0,
    xp_to_next_level: 100,
    tentacles: 0,
    premium: 0,
    stat_strength: 1,
    weapon_inventory: { 'small-poison': 10 },
    weapon_cooldowns: {},
    collection_items: [],
    talent_levels: {},
    boss_talent_progress: 0,
    boss_talent_progress_goal: 500,
    boss_talent_level: 1,
    talent_points: 0,
    toxic_marks: 0,
    toxic_combo_chain: 0,
    boss_hits_today: 0,
    boss_damage_today: 0,
    boss_damage_lifetime: 0,
    boss_kills: 0,
    boss_kills_by_id: {},
    keycards: {},
    boss_key_pity: {},
    boss_gear_fragments: {},
    pending_boss_boxes: [],
  };
}

test('large poison ×100 applies 100 hits and consumes the matching inventory', async () => {
  await store.init();
  await playerDb.init(store);
  const [attacker] = playerDb.attachPlayers([
    seededPlayer({ id: 'poison-x100-player', telegramId: '9100', username: 'Poison X100' }),
  ]);
  attacker.weapon_inventory = { ...(attacker.weapon_inventory || {}), 'large-poison': 100 };
  attacker.weapon_cooldowns = {};
  store.players = [attacker];
  const fight = {
    id: 'poison-x100-fight', boss_id: 'heli', max_hp: 10000000, current_hp: 10000000,
    status: 'active', opened_by_email: attacker.created_by,
  };
  store.bossFights = [fight];

  const testServer = await openTestServer();
  try {
    const response = await fetch(`${testServer.url}/boss-fights/${fight.id}/attack`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-user-id': '9100' },
      body: JSON.stringify({ weaponId: 'c4', multiplier: 100 }),
    });
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(attacker.weapon_inventory['large-poison'], 0);
    assert.equal(attacker.boss_hits_today, 100);
    assert.equal(data.playerDamageLog.hits, 100);
    assert.equal(fight.current_hp, 10000000 - data.hit.damage);
    assert.equal(fight.status, 'active');
  } finally {
    await testServer.close();
  }
});

async function openTestServer() {
  const server = createApp();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('invited clan contributors receive Sporgol kill count once when their shared fight is defeated', async () => {
  await store.init();
  await playerDb.init(store);
  const [attacker, mate, nearDeadMate, outsider] = playerDb.attachPlayers([
    seededPlayer({ id: 'player-a', telegramId: '1001', username: 'Attacker', clanId: 'night-wolves', clanName: 'Night Wolves' }),
    seededPlayer({ id: 'player-b', telegramId: '1002', username: 'Mate', clanId: 'night-wolves', clanName: 'Night Wolves' }),
    seededPlayer({ id: 'player-d', telegramId: '1004', username: 'Near Dead Mate', clanId: 'night-wolves', clanName: 'Night Wolves' }),
    seededPlayer({ id: 'player-c', telegramId: '1003', username: 'Outsider', clanId: 'other-clan', clanName: 'Other Clan' }),
  ]);
  store.players = [attacker, mate, nearDeadMate, outsider];
  store.bossDamageLogs = [
    { id: 'assist-history', fight_id: 'fight-d', player_email: attacker.created_by, damage: 200, hits: 2 },
    { id: 'owner-history', fight_id: 'fight-d', player_email: nearDeadMate.created_by, damage: 150, hits: 2 },
  ];
  store.bossFights = [
    { id: 'fight-a', boss_id: 'heli', max_hp: 1000, current_hp: 1000, status: 'active', opened_by_email: attacker.created_by },
    { id: 'fight-b', boss_id: 'tank', max_hp: 1000, current_hp: 1000, status: 'active', opened_by_email: mate.created_by },
    { id: 'fight-d', boss_id: 'boss5', max_hp: 1000, current_hp: 1, status: 'active', opened_by_email: nearDeadMate.created_by, invited_player_ids: [attacker.id] },
    { id: 'fight-c', boss_id: 'boss4', max_hp: 1000, current_hp: 1000, status: 'active', opened_by_email: outsider.created_by },
  ];

  const testServer = await openTestServer();
  try {
    const response = await fetch(`${testServer.url}/boss-fights/fight-a/attack`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-user-id': '1001',
        'x-telegram-username': 'Attacker',
      },
      body: JSON.stringify({ weaponId: 'fist', multiplier: 1 }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    const result = payload.data;

    assert.equal(store.bossFights[0].current_hp, 1000 - result.hit.damage);
    assert.equal(store.bossFights[1].current_hp, 1000 - result.hit.damage);
    assert.equal(store.bossFights[2].current_hp, 0);
    assert.equal(store.bossFights[2].status, 'dead');
    assert.equal(store.bossFights[2].last_hit_player_id, attacker.id);
    assert.equal(store.bossFights[2].last_hit_player_name, attacker.nickname || attacker.username);
    assert.equal(store.bossFights[3].current_hp, 1000);
    assert.deepEqual(result.clanAssists.map((assist) => assist.fightId), ['fight-b', 'fight-d']);
    assert.equal(result.clanAssists[0].damage, result.hit.damage);
    assert.equal(result.clanAssists[1].defeated, true);
    assert.equal(attacker.boss_hits_today, 1);
    assert.equal(attacker.boss_damage_today, result.hit.damage);
    assert.equal(attacker.boss_kills, 1);
    assert.equal(attacker.boss_kills_by_id.boss5, 1);
    assert.equal(mate.boss_kills, 0);
    assert.equal(nearDeadMate.boss_kills, 1);
    assert.equal(nearDeadMate.battle_pass.xp, 20, 'only the owner of the defeated clan fight gets boss-victory Battle Pass XP');
    assert.equal(attacker.battle_pass.xp, 132, 'the clan helper gets login/attack-task XP but not the fight-victory XP');
    assert.equal(attacker.pending_boss_boxes.length, 1);
    assert.equal(nearDeadMate.pending_boss_boxes.length, 1);
    assert.equal(nearDeadMate.pending_boss_boxes[0].fightId, 'fight-d');
    assert.equal(store.bossDamageLogs.filter((entry) => entry.player_email === attacker.created_by).length, 3);

    const retry = await fetch(`${testServer.url}/boss-fights/fight-d/attack`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-user-id': '1004' },
      body: JSON.stringify({ weaponId: 'fist', multiplier: 1 }),
    });
    assert.notEqual(retry.status, 200);
    assert.equal(attacker.pending_boss_boxes.length, 1);
    assert.equal(nearDeadMate.pending_boss_boxes.length, 1);
    assert.equal(nearDeadMate.boss_kills, 1);
    assert.equal(attacker.boss_kills, 1);
    assert.equal(attacker.boss_kills_by_id.boss5, 1);
    assert.equal(nearDeadMate.battle_pass.daily.metrics.bossKills, 1, 'retrying the defeated fight cannot advance kill-task progress twice');
    assert.equal(nearDeadMate.battle_pass.daily.metrics.bossKillXp, 20, 'retrying the defeated fight cannot award boss-victory XP twice');

    const sourceHp = store.bossFights[0].current_hp;
    const forbidden = await fetch(`${testServer.url}/boss-fights/fight-a/attack`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-user-id': '1002',
        'x-telegram-username': 'Mate',
      },
      body: JSON.stringify({ weaponId: 'fist', multiplier: 1 }),
    });
    assert.equal(forbidden.status, 403);
    assert.equal(store.bossFights[0].current_hp, sourceHp);
  } finally {
    await testServer.close();
  }
});

test('lethal bleed settles victory and claiming the chest twice never duplicates rewards', async()=>{
 await store.init();await playerDb.init(store);
 const [owner,other]=playerDb.attachPlayers([seededPlayer({id:'bleed-owner',telegramId:'2001',username:'Bleed'}),seededPlayer({id:'other',telegramId:'2002',username:'Other'})]);
 store.players=[owner,other];store.bossDamageLogs=[{id:'history',fight_id:'bleed-fight',player_email:owner.created_by,damage:995,hits:5}];store.claimedLoot=[];
 const fight={id:'bleed-fight',boss_id:'heli',max_hp:1000,current_hp:5,status:'active',opened_by_email:owner.created_by};store.bossFights=[fight];
 const now=Date.now();owner.talent_combat_state={'bleed-fight':{bleed:{damage:5,lastTickAt:now-1000,expiresAt:now+5000}}};
 assert.equal(processTalentBleedTicks(now),1);assert.equal(fight.status,'dead');assert.equal(owner.boss_kills,1);assert.equal(owner.pending_boss_boxes.length,1);
 processTalentBleedTicks(now+1000);assert.equal(owner.boss_kills,1);assert.equal(owner.pending_boss_boxes.length,1);
 const box=owner.pending_boss_boxes[0];const server=await openTestServer();
 const claim=async(id,instanceId)=>{const r=await fetch(server.url+'/loot/claim',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':id},body:JSON.stringify({instanceId})});return {status:r.status,body:await r.json()}};
 try{
  assert.equal((await claim('2002',box.instanceId)).status,404);
  const first=await claim('2001',box.instanceId);assert.equal(first.status,200);assert.equal(owner.pending_boss_boxes.length,0);
  const snapshot=JSON.stringify({dm:owner.tentacles,xp:owner.xp,str:owner.stat_strength,inv:owner.weapon_inventory,count:owner.opened_boxes_total});
  const retry=await claim('2001',box.instanceId);assert.equal(retry.status,200);assert.equal(retry.body.data.replayed,true);
  assert.equal(JSON.stringify({dm:owner.tentacles,xp:owner.xp,str:owner.stat_strength,inv:owner.weapon_inventory,count:owner.opened_boxes_total}),snapshot);
  assert.equal((await claim('2001','fake-box')).status,404);
 }finally{await server.close()}
});
