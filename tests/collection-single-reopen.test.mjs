import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionClaimSession } from '../src/lib/collectionClaimSession.js';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { reconcileGuaranteedQuestArtifacts } from '../server/utils/questArtifactRewards.js';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';
import { COLLECTION_REWARDS } from '../src/lib/questCollectionRewards.js';
test('reopening a single chest gets a new request while retrying one opening is idempotent',()=>{
 const location=Object.freeze({id:'p4-u00'});const a=collectionClaimSession(location),b=collectionClaimSession(location);
 assert.notEqual(a.claimRequestId,b.claimRequestId);assert.equal(location.claimRequestId,undefined);
 const p={level:80,energy:0,max_energy:1000,collection_item_counts:Object.fromEntries(Array.from({length:7},(_,i)=>['p4-u00-artifact-'+(i+1),2]))};
 const action=session=>({type:'collection-claim',locationId:session.id,count:session.claimCount,requestId:session.claimRequestId});
 applyPlayerAction(p,action(a));const once=JSON.stringify(p);applyPlayerAction(p,action(a));assert.equal(JSON.stringify(p),once);
 applyPlayerAction(p,action(b));assert.equal(p.collection_rewards_claimed['p4-u00'],2);assert.ok(Object.values(p.collection_item_counts).every(n=>n===0));
 assert.throws(()=>applyPlayerAction(p,action(collectionClaimSession(location))),/Collection is incomplete/);
});
test('each location consumes all seven artifact types and reconciliation never restores spent sets',()=>{
 for(const locationId of Object.keys(COLLECTION_REWARDS)){
  const missions=['scout','loot','repair','trade','fight','cache','final'].map(slug=>getQuestMission(locationId+'-'+slug));
  const p={level:80,energy:0,max_energy:1000,task_completions:Object.fromEntries(missions.map(m=>[m.id,m.target*3])),collection_item_counts:Object.fromEntries(missions.map((m,i)=>[m.artifactId,3+i]))};
  applyPlayerAction(p,{type:'collection-claim',locationId,count:3,requestId:crypto.randomUUID()});
  assert.deepEqual(Object.values(p.collection_item_counts),[0,1,2,3,4,5,6]);
  assert.equal(reconcileGuaranteedQuestArtifacts(p),false);
  assert.throws(()=>applyPlayerAction(p,{type:'collection-claim',locationId,count:1,requestId:crypto.randomUUID()}),/Collection is incomplete/);
 }
});
