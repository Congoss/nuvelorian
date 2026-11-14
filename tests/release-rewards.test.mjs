import test from 'node:test';
import assert from 'node:assert/strict';
import { claimReleaseReward } from '../server/services/release-rewards.js';
function fixture(extraReward={}){
 const player={id:'reward-player',weapon_inventory:{'medium-poison':2}};
 let stored=structuredClone(player),receipts=new Set(),fail=false;
 const options={flush:async()=>{},decode:row=>structuredClone(row),acknowledge:()=>{},save:async(sql,draft)=>{if(fail)throw Error('storage unavailable');await sql`SAVE ${JSON.stringify(draft)}`;},transaction:async action=>{
  let next=structuredClone(stored);const pending=new Set(receipts);
  const result=await action(async(strings,...values)=>{
   const query=strings.join('?');
   if(query.startsWith('SELECT message'))return values[0]==='3.26'?[{message:{reward:{field:'medium_poison',amount:11,...extraReward}}}]:[];
   if(query.startsWith('SELECT *'))return [structuredClone(next)];
   if(query.startsWith('INSERT')){const key=values[0]+':'+values[1];if(pending.has(key))return [];pending.add(key);return [{version:values[0]}];}
   if(query.startsWith('SAVE')){next=JSON.parse(values[0]);return [];}
   throw Error(query);
  });stored=next;receipts=pending;return result;
 }};
 return {player,options,fail:value=>{fail=value;},stored:()=>stored,receipts:()=>receipts};
}
test('repeat and concurrent release claims award medium poison once and survive stale client state',async()=>{
 const f=fixture();const results=await Promise.all([claimReleaseReward(f.player,'3.26',f.options),claimReleaseReward(f.player,'3.26',f.options)]);
 assert.equal(results.filter(r=>!r.replayed).length,1);assert.equal(f.stored().weapon_inventory['medium-poison'],13);
 f.player.weapon_inventory['medium-poison']=0;
 assert.equal((await claimReleaseReward(f.player,'3.26',f.options)).replayed,true);assert.equal(f.player.weapon_inventory['medium-poison'],13);assert.equal(f.receipts().size,1);
});
test('failed grant rolls back receipt and inventory; unknown releases grant nothing',async()=>{
 const f=fixture();f.fail(true);await assert.rejects(claimReleaseReward(f.player,'3.26',f.options),/storage unavailable/);
 assert.equal(f.receipts().size,0);assert.equal(f.player.weapon_inventory['medium-poison'],2);
 f.fail(false);await claimReleaseReward(f.player,'3.26',f.options);assert.equal(f.player.weapon_inventory['medium-poison'],13);
 await assert.rejects(claimReleaseReward(f.player,'3.27',f.options),error=>error.code==='RELEASE_REWARD_UNAVAILABLE');
 await assert.rejects(claimReleaseReward(f.player,'../3.26',f.options),error=>error.code==='INVALID_RELEASE');
});

test('release card gift is claimed exactly once alongside the patch reward',async()=>{
 const f=fixture({cardGamePlays:5});
 await Promise.all([claimReleaseReward(f.player,'3.26',f.options),claimReleaseReward(f.player,'3.26',f.options)]);
 assert.equal(f.stored().card_game_bonus,5);assert.equal(f.player.card_game_bonus,5);
 f.player.card_game_bonus=0;
 await claimReleaseReward(f.player,'3.26',f.options);
 assert.equal(f.player.card_game_bonus,5);assert.equal(f.receipts().size,1);
});
