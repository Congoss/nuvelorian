import test from 'node:test';import assert from 'node:assert/strict';
process.env.NODE_ENV='test';for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{processTalentBleedTicks},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('personal boss bleeding credits clan quest, contribution and achievement exactly once per actual tick',async t=>{
 await store.init();await playerDb.init(store);t.mock.method(store,'persistSoon',()=>{});t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const start=Date.now();const [player]=playerDb.attachPlayers([{id:'clan-bleed-player',created_by:'clan-bleed@test',clan_id:'bleed-clan',level:80,talent_combat_state:{'personal-bleed-fight':{bleed:{damage:5,lastTickAt:start,expiresAt:start+6000}}}}]);store.players=[player];store.bossDamageLogs=[];
 const quest={id:'damage-quest',owner_id:player.id,participants:[],type:'damage',target:7500,progress:0,contributions:{},status:'ACTIVE',expires_at:new Date(start+3600000).toISOString()};const clan={id:'bleed-clan',name:'Bleed clan',quests:[quest]};store.clans=[clan];store.bossFights=[{id:'personal-bleed-fight',boss_id:'boss7',opened_by_email:player.created_by,status:'active',current_hp:1000,max_hp:1000,started_at:new Date(start).toISOString()}];
 assert.equal(processTalentBleedTicks(start+1000),1);assert.equal(quest.progress,5);assert.equal(quest.contributions[player.id],5);
 assert.equal(processTalentBleedTicks(start+1000),0);assert.equal(quest.progress,5);
 assert.equal(processTalentBleedTicks(start+6000),1);assert.equal(quest.progress,30);assert.equal(quest.contributions[player.id],30);assert.equal(clan.achievements.damage.progress,30);assert.equal(store.bossDamageLogs[0].damage,30);assert.equal(player.boss_damage_lifetime,30);
});
