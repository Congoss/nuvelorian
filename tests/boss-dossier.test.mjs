import test from 'node:test';
import assert from 'node:assert/strict';
import { DOSSIER_CHAPTERS, dossierRewardReady, getDossierChapters } from '../src/lib/bossDossier.js';
import { MOTH_DOSSIER_STORIES } from '../src/lib/mothDossierStories.js';
import { SHORK_DOSSIER_STORIES } from '../src/lib/shorkDossierStories.js';
import { WORM_DOSSIER_STORIES } from '../src/lib/wormDossierStories.js';
import { SPORGOL_DOSSIER_STORIES } from '../src/lib/sporgolDossierStories.js';
import { CLEOPATRASH_DOSSIER_STORIES } from '../src/lib/cleopatrashDossierStories.js';
import { SUCKHOLE_DOSSIER_STORIES } from '../src/lib/suckholeDossierStories.js';
import { claimDossierReward } from '../server/utils/bossDossier.js';
import { claimPlayerAchievement } from '../server/services/player-achievements.js';
import { playerDb } from '../server/data/player-db.js';

test('packs grant three poisons and spins additively, rounding each resource up',()=>{
  assert.deepEqual(getDossierChapters('tank')[0].rewards,{'small-poison':15,'medium-poison':8,'large-poison':3,spins:8});
  const player={boss_kills_by_id:{heli:100},weapon_inventory:{'small-poison':2,'medium-poison':3,'large-poison':4},roulette_bonus_spins:7};
  for(const chapter of DOSSIER_CHAPTERS)claimDossierReward(player,chapter.id);
  assert.deepEqual(player.weapon_inventory,{'small-poison':87,'medium-poison':53,'large-poison':26});
  assert.equal(player.roulette_bonus_spins,57);
  claimDossierReward(player,DOSSIER_CHAPTERS[2].id);
  assert.equal(player.roulette_bonus_spins,57);
});

test('Suckhole rewards require his wins, pay once, and have three localized chapters', () => {
  const player={boss_kills_by_id:{heli:100,boss5:100,boss7:100,boss6:0}};
  const chapters=getDossierChapters('boss6');
  assert.equal(chapters.length,3);
  for(const chapter of chapters){
    assert.throws(()=>claimDossierReward(player,chapter.id),/DOSSIER_LOCKED/);
    player.boss_kills_by_id.boss6=chapter.target;
    assert.equal(claimDossierReward(player,chapter.id).replayed,false);
    assert.equal(claimDossierReward(player,chapter.id).replayed,true);
  }
  assert.equal(player.weapon_inventory['small-poison'],340);
  assert.equal(dossierRewardReady(player,'boss6'),false);
  for(const lang of ['uk','ru','en']){
    assert.equal(SUCKHOLE_DOSSIER_STORIES[lang].length,3);
    assert.ok(SUCKHOLE_DOSSIER_STORIES[lang].every(story=>story[1].includes('P4-U05')));
  }
});

test('Cleopatrash claims require her wins and each localized medal has one chapter', () => {
  const player={boss_kills_by_id:{heli:100,boss5:100,boss7:0}};
  const chapters=getDossierChapters('boss7');
  assert.equal(chapters.length,3);
  for(const chapter of chapters){
    assert.throws(()=>claimDossierReward(player,chapter.id),/DOSSIER_LOCKED/);
    player.boss_kills_by_id.boss7=chapter.target;
    assert.equal(claimDossierReward(player,chapter.id).replayed,false);
    assert.equal(claimDossierReward(player,chapter.id).replayed,true);
  }
  assert.equal(player.weapon_inventory['small-poison'],383);
  assert.equal(dossierRewardReady(player,'boss7'),false);
  for(const lang of ['uk','ru','en']){
    assert.equal(CLEOPATRASH_DOSSIER_STORIES[lang].length,3);
    for(const [index,chapter] of chapters.entries()) assert.ok(CLEOPATRASH_DOSSIER_STORIES[lang][index][1].includes(String(chapter.target)));
  }
});

test('Sporgol claims require his medals and all three languages contain three chapters', () => {
  const player={boss_kills_by_id:{heli:100,tank:100,chinook:100,boss4:100,boss5:0}};
  const chapters=getDossierChapters('boss5');
  assert.equal(chapters.length,3);
  for(const chapter of chapters){
    assert.throws(()=>claimDossierReward(player,chapter.id),/DOSSIER_LOCKED/);
    player.boss_kills_by_id.boss5=chapter.target;
    assert.equal(claimDossierReward(player,chapter.id).replayed,false);
    assert.equal(claimDossierReward(player,chapter.id).replayed,true);
  }
  assert.equal(player.weapon_inventory['small-poison'],255);
  assert.equal(dossierRewardReady(player,'boss5'),false);
  for(const lang of ['uk','ru','en']){
    assert.equal(SPORGOL_DOSSIER_STORIES[lang].length,3);
    assert.ok(SPORGOL_DOSSIER_STORIES[lang].every(story=>story[1].includes('P4-U04')));
  }
});

test('Worm medals require Worm wins and pay each chapter once', () => {
  const player={boss_kills_by_id:{heli:100,tank:100,chinook:100,boss4:0}};
  const chapters=getDossierChapters('boss4');
  assert.equal(chapters.length,3);
  for(const chapter of chapters){
    assert.throws(()=>claimDossierReward(player,chapter.id),/DOSSIER_LOCKED/);
    player.boss_kills_by_id.boss4=chapter.target;
    assert.equal(claimDossierReward(player,chapter.id).replayed,false);
    assert.equal(claimDossierReward(player,chapter.id).replayed,true);
  }
  assert.equal(player.weapon_inventory['small-poison'],213);
  assert.equal(dossierRewardReady(player,'boss4'),false);
  for(const lang of ['uk','ru','en']){
    assert.equal(WORM_DOSSIER_STORIES[lang].length,3);
    assert.ok(WORM_DOSSIER_STORIES[lang].every(story=>story[1].includes('P4-U03')));
  }
});

test('Shork medals use Shork wins and each translated chapter appears once', () => {
  const player={boss_kills_by_id:{heli:100,tank:100,chinook:0}};
  const chapters=getDossierChapters('chinook');
  assert.equal(chapters.length,3);
  for(const chapter of chapters){
    assert.throws(()=>claimDossierReward(player,chapter.id),/DOSSIER_LOCKED/);
    player.boss_kills_by_id.chinook=chapter.target;
    assert.equal(claimDossierReward(player,chapter.id).replayed,false);
    assert.equal(claimDossierReward(player,chapter.id).replayed,true);
  }
  assert.equal(player.weapon_inventory['small-poison'],170);
  assert.equal(dossierRewardReady(player,'chinook'),false);
  for(const lang of ['uk','ru','en']){
    assert.equal(SHORK_DOSSIER_STORIES[lang].length,3);
    assert.ok(SHORK_DOSSIER_STORIES[lang][0][1].includes('10'));
    assert.ok(SHORK_DOSSIER_STORIES[lang][1][1].includes('50'));
    assert.ok(SHORK_DOSSIER_STORIES[lang][2][1].includes('100'));
  }
});

test('Moth dossiers require Moth wins and keep claims separate from Underweight', () => {
  const player = {boss_kills_by_id:{heli:100,tank:9}};
  const chapters = getDossierChapters('tank');
  assert.equal(chapters.length,3);
  assert.equal(dossierRewardReady(player,'tank'),false);
  assert.throws(()=>claimDossierReward(player,chapters[0].id),/DOSSIER_LOCKED/);
  player.boss_kills_by_id.tank=100;
  claimDossierReward(player,DOSSIER_CHAPTERS[0].id);
  for(const chapter of chapters){
    assert.equal(claimDossierReward(player,chapter.id).replayed,false);
    assert.equal(claimDossierReward(player,chapter.id).replayed,true);
  }
  assert.equal(player.weapon_inventory['small-poison'],138);
  assert.equal(dossierRewardReady(player,'tank'),false);
  assert.deepEqual(getDossierChapters('forged'),[]);
  for(const lang of ['uk','ru','en']){
    assert.equal(MOTH_DOSSIER_STORIES[lang].length,3);
    assert.ok(MOTH_DOSSIER_STORIES[lang].every(story=>story.length>=5));
  }
});

test('dossier medals unlock independently at 10/50/100 wins; forged and locked claims fail', () => {
  const player = { boss_kills_by_id: { heli: 9 } };
  for (const chapter of DOSSIER_CHAPTERS) assert.throws(() => claimDossierReward(player, chapter.id), /DOSSIER_LOCKED/);
  assert.equal(dossierRewardReady(player), false);
  for (const chapter of DOSSIER_CHAPTERS) {
    player.boss_kills_by_id.heli = chapter.target;
    assert.equal(dossierRewardReady(player), true);
    assert.equal(claimDossierReward(player, chapter.id).replayed, false);
    assert.equal(claimDossierReward(player, chapter.id).replayed, true);
    assert.equal(dossierRewardReady(player), false);
  }
  assert.equal(player.weapon_inventory['small-poison'], 85);
  assert.throws(() => claimDossierReward(player, 'dossier_heli_platinum'), /DOSSIER_LOCKED/);
});

test('ship medals persist rounded poisons and gums once and reject locked claims', async t => {
  let writes = 0;
  t.mock.method(playerDb, 'flushDirtyPlayers', async () => {});
  const player = {id:'ship-medals',ship_boss_kills:{engine:50}};
  const store = {players:[player]};
  const claim = id => claimPlayerAchievement(store,player,id,{hasDb:false,persistLocal:async next => {
    writes++;
    assert.equal(next.players[0].enhancement_gums.improved,2);
    return true;
  }});
  await assert.rejects(claim('dossier_ship-engine_gold'), /DOSSIER_LOCKED/);
  assert.equal(dossierRewardReady(player,'ship-engine'),true);
  assert.equal((await claim('dossier_ship-engine_silver')).replayed,false);
  assert.equal((await claim('dossier_ship-engine_silver')).replayed,true);
  assert.deepEqual(player.weapon_inventory,{'small-poison':175,'medium-poison':105,'large-poison':35});
  assert.deepEqual(player.enhancement_gums,{normal:3,improved:2,premium:0});
  assert.equal(writes,1);
});

test('a claimed gold medal leaves the beacon on for unclaimed lower tiers of that boss', () => {
  const player = {boss_kills_by_id:{heli:100,tank:10}};
  claimDossierReward(player,'dossier_heli_gold');
  assert.equal(dossierRewardReady(player,'heli'),true);
  claimDossierReward(player,'dossier_heli_bronze');
  assert.equal(dossierRewardReady(player,'heli'),true);
  claimDossierReward(player,'dossier_heli_silver');
  assert.equal(dossierRewardReady(player,'heli'),false);
  assert.equal(dossierRewardReady(player,'tank'),true);
});
