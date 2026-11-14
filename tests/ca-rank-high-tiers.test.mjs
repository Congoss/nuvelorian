import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CA_RANKS,getCARank,getNextCARank,getCARankProgress} from '../src/lib/caRankDefinitions.js';
import {getPendingCARankRewards} from '../src/lib/caRankRewards.js';

test('new CA ranks unlock at exact boundaries and preserve existing ranks',()=>{
 assert.equal(getCARank(319999).rank,15);
 for(const [threshold,rank]of [[320000,16],[640000,17],[1280000,18],[2560000,19]]){
  assert.equal(getCARank(threshold-1).rank,rank-1);assert.equal(getCARank(threshold).rank,rank);
  assert.equal(getNextCARank(threshold-1).rank,rank);
 }
 assert.equal(getCARank(99999999).id,'crimson_raven');
 assert.equal(getNextCARank(2560000),null);
 assert.equal(getCARankProgress(160000).needed,160000);
});
test('new rank artwork is present and names are available in all three languages',()=>{
 for(const rank of CA_RANKS.slice(15)){
  assert(fs.existsSync('src/assets/hero/rangs/'+rank.icon));
  for(const lang of ['uk','ru','en']){assert(rank.names[lang]);assert(rank.short[lang]);}
 }
 assert.equal(CA_RANKS[18].names.uk,'Багряний Ворон');
});
test('new tiers queue only achieved unclaimed packs and never regrant previous rewards',()=>{
 const claimed=Array.from({length:14},(_,i)=>i+2);
 assert.deepEqual(getPendingCARankRewards({stat_strength:2560000,ca_rank_rewards_claimed:claimed}),[16,17,18,19]);
 assert.deepEqual(getPendingCARankRewards({stat_strength:320000,ca_rank_rewards_claimed:claimed.slice(0,-1)}),[15,16]);
 assert.deepEqual(getPendingCARankRewards({stat_strength:2560000,ca_rank_rewards_claimed:[...claimed,16,17,18,19]}),[]);
});
