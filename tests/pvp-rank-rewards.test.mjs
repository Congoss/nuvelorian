import test from 'node:test';
import assert from 'node:assert/strict';
import { getPvpRankReward } from '../src/lib/pvpRankRewards.js';
import { applyPvpRankReward, claimPvpRankRewardDurable } from '../server/services/pvp-rank-rewards.js';
import { playerDb } from '../server/data/player-db.js';
playerDb.flushDirtyPlayers=async()=>{};
test('all ten ranks scale every base resource, without cosmetics',()=>{
 for(let rank=1;rank<=10;rank++){const r=getPvpRankReward(rank);assert.deepEqual([r.smallPoison,r.mediumPoison,r.largePoison,r.spins,r.cardPlays],[40*rank,40*rank,40*rank,10*rank,5*rank]);assert.equal(r.frame,undefined);}
 for(const rank of [0,11,1.5,'1'])assert.equal(getPvpRankReward(rank),null);
});
test('rank claim uses highest earned rating and first victory; receipt prevents all duplicate grants',()=>{
 const p={id:'p',weapon_inventory:{'small-poison':2},roulette_bonus_spins:1,card_game_bonus:3};
 assert.throws(()=>applyPvpRankReward(p,1,{highestRating:999,hasVictory:false}),/PVP_RANK_LOCKED/);
 assert.throws(()=>applyPvpRankReward(p,2,{highestRating:71,hasVictory:true}),/PVP_RANK_LOCKED/);
 applyPvpRankReward(p,2,{highestRating:72,hasVictory:true,rating:0});
 assert.deepEqual([p.weapon_inventory['small-poison'],p.weapon_inventory['medium-poison'],p.weapon_inventory['large-poison'],p.roulette_bonus_spins,p.card_game_bonus],[82,80,80,21,13]);
 const saved=JSON.stringify(p);assert.equal(applyPvpRankReward(p,2,{highestRating:0,hasVictory:false}).alreadyClaimed,true);assert.equal(JSON.stringify(p),saved);
});
test('failed persistence grants nothing; concurrent claims commit one receipt and one grant',async()=>{
 const player={id:'p'},store={players:[player]},standing={highestRating:0,hasVictory:true};
 await assert.rejects(claimPvpRankRewardDurable({store,player,rank:1,standing},{hasDb:false,persistLocal:()=>false}),/storage unavailable/);
 assert.deepEqual(player,{id:'p'});
 let writes=0;const results=await Promise.all([1,2].map(()=>claimPvpRankRewardDurable({store,player,rank:1,standing},{hasDb:false,persistLocal:()=>{writes++;return true;}})));
 assert.equal(writes,1);assert.equal(results.filter(r=>!r.alreadyClaimed).length,1);assert.equal(player.weapon_inventory['small-poison'],40);assert.equal(player.card_game_bonus,5);
});
