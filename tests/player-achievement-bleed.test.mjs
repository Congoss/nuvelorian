import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{processTalentBleedTicks},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
for(const raid of [false,true])test(`actual ${raid?'raid':'personal'} server ticks unlock 1 HP then bleed kill`,async t=>{
 await store.init();await playerDb.init(store);
 t.mock.method(store,'persistSoon',()=>{});t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const start=Date.parse('2026-10-16T12:00:00Z');
 const fight={id:raid?'achievement-raid':'achievement-personal',boss_id:'heli',opened_by_email:'achievement@test',status:'active',current_hp:6,max_hp:1000,started_at:new Date(start).toISOString(),ends_at:new Date(start+3600000).toISOString(),participants:{p:{name:'P',damage:994,hits:1}}};
 const key=raid?'raid:'+fight.id:fight.id;
 const [player]=playerDb.attachPlayers([{id:'p',created_by:'achievement@test',level:80,talent_tree_version:2,talent_levels:{},talent_combat_state:{[key]:{bleed:{damage:5,lastTickAt:start,expiresAt:start+6000}}}}]);
 store.players=[player];store.bossDamageLogs=[];store.clans=[];store.bossFights=raid?[]:[fight];store.raidBoss=raid?fight:null;
 assert.equal(processTalentBleedTicks(start+1000),1);
 assert.equal(fight.current_hp,1);
 assert.ok(player.player_achievements.still_breathing);
 assert.equal(player.player_achievements.hands_off,undefined);
 assert.equal(processTalentBleedTicks(start+2000),1);
 assert.equal(fight.current_hp,0);
 assert.ok(player.player_achievements.hands_off);
 assert.equal(player.player_achievements.ten_fingers,undefined);
 assert.equal(processTalentBleedTicks(start+3000),0);
 const record=playerDb.toDbPlayerRecord(player);
 const restored=playerDb.fromDbPlayerRecord(record);
 assert.deepEqual(restored.player_achievements,player.player_achievements);
});

