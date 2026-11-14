import test from 'node:test';
import assert from 'node:assert/strict';
import {claimCARankRewardDurable} from '../server/services/ca-rank-rewards.js';
import {playerDb} from '../server/data/player-db.js';
import {getCARankReward,getPendingCARankRewards} from '../src/lib/caRankRewards.js';
process.env.NODE_ENV='test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const apply=(p,rank)=>{const reward=getCARankReward(rank);if(p.ca_rank_rewards_claimed?.includes(rank))throw Object.assign(Error('already claimed'),{code:'ALREADY_CLAIMED'});p.tentacles+=reward.tentacles;p.ca_rank_rewards_claimed=[...(p.ca_rank_rewards_claimed||[]),rank];return reward;};
test('rank grant and receipt stay invisible until commit; failed save grants nothing',async t=>{
 t.mock.method(playerDb,'flushDirtyPlayers',async()=>0);
 const player={id:'rank',username:'rank',tentacles:10,stat_strength:320000,ca_rank_rewards_claimed:[]};
 const store={players:[player]};let release,entered;
 const started=new Promise(resolve=>entered=resolve),barrier=new Promise(resolve=>release=resolve);
 const options={hasDb:true,transaction:async action=>action(async()=>[playerDb.toDbPlayerRecord(player)]),save:async()=>{entered();await barrier;}};
 const pending=claimCARankRewardDurable({store,player,rank:16,apply},options);
 await started;assert.equal(player.tentacles,10);assert.deepEqual(player.ca_rank_rewards_claimed,[]);
 release();await pending;assert.equal(player.tentacles,6500010);assert.deepEqual(player.ca_rank_rewards_claimed,[16]);
 await assert.rejects(claimCARankRewardDurable({store,player,rank:17,apply},{...options,save:async()=>{throw Error('SQL failed');}}),/SQL failed/);
 assert.equal(player.tentacles,6500010);assert.deepEqual(player.ca_rank_rewards_claimed,[16]);
 await assert.rejects(claimCARankRewardDurable({store,player,rank:16,apply},options),{code:'ALREADY_CLAIMED'});
});
test('high-rank backfill covers every achieved missing rank and preserves previous claims',()=>{
 for(const [ca,expected] of [[319999,[]],[320000,[16]],[640000,[16,17]],[1280000,[16,17,18]],[2560000,[16,17,18,19]]]){
  assert.deepEqual(getPendingCARankRewards({stat_strength:ca,ca_rank_rewards_claimed:Array.from({length:14},(_,i)=>i+2)}),expected);
 }
 for(let rank=16;rank<=19;rank++){
  const before=getCARankReward(rank-1),after=getCARankReward(rank);
  for(const field of ['tentacles','energy','largePoison','spins'])assert.ok(after[field]>before[field]&&after[field]/before[field]<1.8,field);
 }
});
