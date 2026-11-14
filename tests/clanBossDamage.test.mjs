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

test('solo fights block incoming and outgoing clan damage until opened', () => {
  const attacker = player({ id: 'solo-a', email: 'solo-a@test', clanId: 'solo-clan' });
  const mate = player({ id: 'solo-b', email: 'solo-b@test', clanId: 'solo-clan' });
  const sourceFight = { ...fight({ id: 'solo-source', ownerEmail: attacker.created_by }), solo: true };
  const mateFight = { ...fight({ id: 'solo-mate', ownerEmail: mate.created_by }), solo: true };
  const targets = () => getClanDamageFightTargets({ attacker, sourceFight, fights: [sourceFight, mateFight], players: [attacker, mate] }).map(f => f.id);
  assert.deepEqual(targets(), ['solo-source']);
  sourceFight.solo = false;
  assert.deepEqual(targets(), ['solo-source']);
  mateFight.solo = false;
  assert.deepEqual(targets(), ['solo-source', 'solo-mate']);
});

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

test('solo spawn rejects clan damage and joining until the owner calls the clan', async () => {
  await store.init(); await playerDb.init(store);
  const [owner, mate] = playerDb.attachPlayers([
    seededPlayer({id:'solo-owner',telegramId:'9801',username:'Solo owner',clanId:'solo-test',clanName:'Solo Test'}),
    seededPlayer({id:'solo-helper',telegramId:'9802',username:'Solo helper',clanId:'solo-test',clanName:'Solo Test'}),
  ]);
  store.players=[owner,mate]; store.bossFights=[]; store.bossDamageLogs=[]; store.chatMessages=[];
  const server=await openTestServer();
  const post=(path,id,body)=>fetch(server.url+path,{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':id},body:JSON.stringify(body)});
  try {
    const spawned=await post('/boss-fights/spawn','9801',{bossId:'heli',mode:'solo'});
    assert.equal(spawned.status,201);
    const {data:solo}=await spawned.json();
    assert.equal(solo.solo,true);
    const join=await post(`/boss-fights/${solo.id}/join`,'9802',{});
    assert.equal(join.status,403);
    const direct=await post(`/boss-fights/${solo.id}/attack`,'9802',{weaponId:'fist'});
    assert.equal(direct.status,403);
    const clanSpawn=await post('/boss-fights/spawn','9802',{bossId:'heli',mode:'clan'});
    assert.equal(clanSpawn.status,201);
    const {data:clan}=await clanSpawn.json();
    assert.equal(clan.solo,false);
    const hit=await post(`/boss-fights/${clan.id}/attack`,'9802',{weaponId:'fist'});
    assert.equal(hit.status,200);
    assert.equal(store.bossFights.find(f=>f.id===solo.id).current_hp,solo.current_hp);
    // Still not invited to the solo fight: ownership is checked before the second-boss rule.
    const denied=await post(`/boss-fights/${solo.id}/attack`,'9802',{weaponId:'fist'});
    assert.equal(denied.status,403);
    const forbidden=await post('/chat/messages','9802',{channel:'clan',text:'Join',kind:'boss_fight_invite',bossFightInvite:{fightId:solo.id}});
    assert.equal(forbidden.status,403);
    const invited=await post('/chat/messages','9801',{channel:'clan',text:'Join',kind:'boss_fight_invite',bossFightInvite:{fightId:solo.id}});
    assert.equal(invited.status,201);
    assert.equal(store.bossFights.find(f=>f.id===solo.id).solo,false);
    mate.weapon_cooldowns={};
    const after=await post(`/boss-fights/${clan.id}/attack`,'9802',{weaponId:'fist'});
    assert.equal(after.status,200);
    assert.ok(store.bossFights.find(f=>f.id===solo.id).current_hp<solo.current_hp);
  } finally { await server.close(); }
});

test('one paid poison batch cannot earn cashback in every clan fight', async () => {
  await store.init(); await playerDb.init(store);
  const players = playerDb.attachPlayers(Array.from({length:5},(_,i)=>seededPlayer({id:'cashback-'+i,telegramId:'920'+i,username:'Cashback '+i,clanId:'cashback-clan'})));
  store.players = players; store.bossDamageLogs = [];
  players[0].weapon_inventory = {'large-poison':100};
  store.bossFights = players.map((p,i)=>({id:'cashback-fight-'+i,boss_id:'boss7',max_hp:3000000,current_hp:10000,status:'active',opened_by_email:p.created_by,invited_player_ids:[players[0].id]}));
  const server = await openTestServer();
  try {
    const response = await fetch(server.url+'/boss-fights/cashback-fight-0/attack',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'9200'},body:JSON.stringify({weaponId:'c4',multiplier:100})});
    assert.equal(response.status,200);
    assert.equal(players[0].weapon_inventory['large-poison'],0);
    assert.equal(players[0].pending_boss_boxes.length,5);
    const logs = store.bossDamageLogs.filter(log=>log.player_email===players[0].created_by);
    assert.equal(logs.length,5);
    assert(Number(logs.find(log=>log.fight_id==='cashback-fight-0').direct_poison_refund_units.large)>0);
    for(const log of logs.filter(log=>log.fight_id!=='cashback-fight-0')) {
      assert(Number(log.cashback_poison_refund_units.large||0)>0);
      assert.equal(Number(log.direct_poison_refund_units.large||0),0);
    }
    const credited = logs.reduce((sum, log) => sum + Number(log.cashback_poison_refund_units.large || 0), 0);
    assert(credited > 0 && credited <= 100 + 1e-9, 'shared refund basis never exceeds the paid batch');
  } finally { await server.close(); }
});

test('resource-only profile action is recorded before and after without an XP grant', async () => {
  await store.init(); await playerDb.init(store);
  const [actor] = playerDb.attachPlayers([seededPlayer({id:'audit-resource-only',telegramId:'9300',username:'Audit'})]);
  actor.energy=100;actor.max_energy=100;actor.welcome_energy_granted=false;
  store.players=[actor];
  const server=await openTestServer();
  try {
    const response=await fetch(server.url+'/players/'+actor.id,{method:'PATCH',headers:{'content-type':'application/json','x-telegram-user-id':'9300'},body:JSON.stringify({claimWelcomeEnergy:true})});
    assert.equal(response.status,200);
    const {readPlayerAudit}=await import('../server/utils/playerAudit.js');
    const rows=await readPlayerAudit(actor.id);
    const event=rows.at(-1);
    assert.equal(event.before.energy,100);assert.equal(event.after.energy,231);assert.equal(event.xpGrants.length,0);
  }finally{await server.close();}
});

test('simultaneous finger attacks do not bypass the server cooldown', async () => {
  await store.init();await playerDb.init(store);
  const [actor]=playerDb.attachPlayers([seededPlayer({id:'cooldown-parallel',telegramId:'9400',username:'Cooldown'})]);
  actor.talent_tree_version=2;actor.talent_levels={t06:10,t11:10};
  store.players=[actor];store.bossDamageLogs=[];
  store.bossFights=[{id:'cooldown-fight',boss_id:'boss7',max_hp:3000000,current_hp:3000000,status:'active',opened_by_email:actor.created_by}];
  const server=await openTestServer();
  try{
    const results=await Promise.all(Array.from({length:8},()=>fetch(server.url+'/boss-fights/cooldown-fight/attack',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'9400'},body:JSON.stringify({weaponId:'fist'})})));
    assert.equal(results.filter(r=>r.status===200).length,1);
    for(const response of results.filter(r=>r.status!==200))assert.equal((await response.json()).code,'WEAPON_ON_COOLDOWN');
  }finally{await server.close();}
});

test('Cleopatrash invited assistance credits medal progression once and retains boxes', async () => {
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
    { id: 'fight-d', boss_id: 'boss7', max_hp: 1000, current_hp: 1, status: 'active', opened_by_email: nearDeadMate.created_by, invited_player_ids: [attacker.id] },
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
    assert.equal(attacker.boss_kills_by_id.boss7, 1);
    assert.equal(mate.boss_kills, 0);
    assert.equal(nearDeadMate.boss_kills, 1);
    assert.equal(nearDeadMate.boss_kills_by_id.boss7, 1);
    assert.equal(nearDeadMate.battle_pass.xp, 30, 'only the owner of the defeated clan fight gets boss-victory Battle Pass XP');
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
    assert.equal(attacker.boss_kills_by_id.boss7, 1);
    assert.equal(nearDeadMate.battle_pass.daily.metrics.bossKills, 1, 'retrying the defeated fight cannot advance kill-task progress twice');
    assert.equal(nearDeadMate.battle_pass.daily.metrics.bossKillXp, 30, 'retrying the defeated fight cannot award boss-victory XP twice');

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

for (const [bossId, petId] of [['boss4', 'pet5'], ['chinook', 'pet-skunk']]) {
test(`${bossId} victory queues ${petId}, chest claim grants it once and rejects other players`, async()=>{
 await store.init();await playerDb.init(store);
 const [owner,other]=playerDb.attachPlayers([seededPlayer({id:'worm-owner',telegramId:'3101',username:'Worm tester'}),seededPlayer({id:'worm-other',telegramId:'3102',username:'Other'})]);
 store.players=[owner,other];store.claimedLoot=[];
 store.bossDamageLogs=[{id:'worm-history',fight_id:'worm-pet-fight',player_email:owner.created_by,damage:99995,hits:3}];
 const fight={id:'worm-pet-fight',boss_id:bossId,max_hp:100000,current_hp:5,status:'active',opened_by_email:owner.created_by};store.bossFights=[fight];
 const previousConfig=store.bossRewardConfig;
 store.bossRewardConfig={specialDrop:{baseChance:{gear:0,pet:1,background:0},rankBonus:{rank1:0,top10:0,top100:0},maxChance:1},backgroundChanceByBoss:{[bossId]:0}};
 const now=Date.now();owner.talent_combat_state={'worm-pet-fight':{bleed:{damage:5,lastTickAt:now-1000,expiresAt:now+5000}}};
 let server;
 try{
  processTalentBleedTicks(now);assert.equal(fight.status,'dead');
  const box=owner.pending_boss_boxes[0];assert.ok(box.rewardSnapshot.some(d=>d.type==='pet'&&d.petId===petId));
  server=await openTestServer();
  const claim=async(id)=>{const r=await fetch(server.url+'/loot/claim',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':id},body:JSON.stringify({instanceId:box.instanceId})});return {status:r.status,body:await r.json()}};
  assert.equal((await claim('3102')).status,404);
  assert.equal((await claim('3101')).status,200);
  assert.equal(owner.inventory_items.filter(i=>i.id===petId&&i.slot==='pet').length,1);
  const retry=await claim('3101');assert.equal(retry.status,200);assert.equal(retry.body.data.replayed,true);
  assert.equal(owner.inventory_items.filter(i=>i.id===petId).length,1);
 }finally{store.bossRewardConfig=previousConfig;if(server)await server.close()}
});

}

test('claiming a ship gum chest twice credits the player material only once',async()=>{
 await store.init();await playerDb.init(store);
 const [owner]=playerDb.attachPlayers([seededPlayer({id:'gum-chest-owner',telegramId:'3401',username:'Gum owner'})]);store.players=[owner];store.claimedLoot=[];
 const box={instanceId:'ship-gum-chest',bossId:'ship-hull',fightId:'ship-gum-fight',boxType:'damage_box_5',rewardFormula:'boss_v2',rewardBalanceVersion:2,damage:2000000,maxHp:2000000,rewardSnapshot:[{type:'enhancement_gum',id:'improved',gum:'improved',qty:1}]};owner.pending_boss_boxes=[box];
 const server=await openTestServer();const claim=async()=>{const r=await fetch(server.url+'/loot/claim',{method:'POST',headers:{'content-type':'application/json','x-telegram-user-id':'3401'},body:JSON.stringify({instanceId:box.instanceId})});return {status:r.status,body:await r.json()}};
 try{assert.equal((await claim()).status,200);assert.equal(owner.enhancement_gums.improved,1);const retry=await claim();assert.equal(retry.status,200);assert.equal(retry.body.data.replayed,true);assert.equal(owner.enhancement_gums.improved,1);}finally{await server.close()}
});
