import test from 'node:test';
import assert from 'node:assert/strict';
import { unlockAchievement, claimAchievementReward } from '../server/utils/playerAchievements.js';
import { claimPlayerAchievement } from '../server/services/player-achievements.js';
import { playerDb } from '../server/data/player-db.js';
test('unlock does not grant resources, and unearned or previously auto-paid achievements cannot pay again',()=>{
 const player={id:'p'};unlockAchievement(player,'hands_off',{id:'f'});
 assert.equal(player.weapon_inventory,undefined);assert.equal(player.roulette_bonus_spins,undefined);
 assert.throws(()=>claimAchievementReward(player,'ten_fingers'),/ACHIEVEMENT_LOCKED/);
 const old={player_achievements:{hands_off:{unlocked_at:'2026-10-28',rewards:{mediumPoison:40}}}};
 assert.equal(claimAchievementReward(old,'hands_off').replayed,true);
 assert.equal(old.weapon_inventory,undefined);
});
test('failed durable claim leaves the reward pending and resources untouched',async t=>{
 t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const player={id:'p',weapon_inventory:{'small-poison':1}};unlockAchievement(player,'hands_off',{id:'f'});
 const store={players:[player]};
 await assert.rejects(claimPlayerAchievement(store,player,'hands_off',{hasDb:false,persistLocal:async()=>false}),/ACHIEVEMENT_STORAGE_UNAVAILABLE/);
 assert.equal(player.player_achievements.hands_off.reward_status,'pending');
 assert.deepEqual(player.weapon_inventory,{'small-poison':1});
});
test('concurrent claim requests pay once, save receipt with inventory, and survive retry',async t=>{
 t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const player={id:'p',roulette_bonus_spins:2};unlockAchievement(player,'hands_off',{id:'f'});
 const store={players:[player]};let snapshot,writes=0;
 const options={hasDb:false,persistLocal:async data=>{snapshot=JSON.parse(JSON.stringify(data));writes++;return true;}};
 const results=await Promise.all([claimPlayerAchievement(store,player,'hands_off',options),claimPlayerAchievement(store,player,'hands_off',options)]);
 assert.equal(results.filter(r=>!r.replayed).length,1);assert.equal(writes,1);
 assert.equal(player.weapon_inventory['medium-poison'],40);assert.equal(player.weapon_inventory['large-poison'],30);assert.equal(player.roulette_bonus_spins,27);
 assert.equal(snapshot.players[0].player_achievements.hands_off.reward_status,'claimed');
 const restored=snapshot.players[0];assert.equal(claimAchievementReward(restored,'hands_off').replayed,true);
 assert.equal(restored.weapon_inventory['medium-poison'],40);
});
