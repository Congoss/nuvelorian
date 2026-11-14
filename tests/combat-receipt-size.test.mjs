import test from 'node:test';
import assert from 'node:assert/strict';
import {compactCombatReceipt,cloneCombatPlayer,selectCombatRuntime} from '../server/utils/combatReceipt.js';
import {shipCombatPlayerSnapshot} from '../server/utils/shipCombatSnapshot.js';
const history=()=>Object.fromEntries(Array.from({length:1000},(_,i)=>['old-'+i,{toxicMarks:5,combo:['fist','satchel','knuckle'],bleed:null,hitHistory:'old'.repeat(20)}]));
test('legacy retry compaction preserves exact hit, crit, victory, reward and inventory',()=>{
 const player={id:'p',weapon_inventory:{'large-poison':7},talent_damage_progress:123,talent_combat_state:{...history(),current:{toxicMarks:4},'raid:live':{toxicMarks:2}}};
 const body={data:{fight:{id:'current',status:'dead',current_hp:0},hit:{damage:4321,isCrit:true},player,rewardSummary:{box:'saved'}}};
 const receipt={id:'retry',response:{statusCode:200,headers:{},body:JSON.stringify(body)}};
 const compact=compactCombatReceipt(receipt);
 assert.ok(JSON.stringify(compact).length<JSON.stringify(receipt).length/100);
 const result=JSON.parse(compact.response.body);
 assert.deepEqual(result.data.hit,body.data.hit);assert.deepEqual(result.data.fight,body.data.fight);assert.deepEqual(result.data.rewardSummary,body.data.rewardSummary);
 assert.deepEqual(result.data.player.weapon_inventory,player.weapon_inventory);assert.equal(result.data.player.talent_damage_progress,123);
 assert.deepEqual(Object.keys(result.data.player.talent_combat_state),['current','raid:live']);
 assert.equal(Object.keys(JSON.parse(receipt.response.body).data.player.talent_combat_state).length,1002);
 assert.equal(compactCombatReceipt(receipt),compact);assert.equal(compactCombatReceipt(compact),compact);
});
test('draft separates mutable gameplay fields while retaining immutable retry journals',()=>{
 const original={id:'p',weapon_inventory:{'large-poison':7},talent_combat_state:history(),combat_receipts:[{id:'a',response:{body:'immutable'}}],combat_retired_requests:['old']};
 const draft=cloneCombatPlayer(original);draft.weapon_inventory['large-poison']=0;
 assert.equal(original.weapon_inventory['large-poison'],7);assert.equal(draft.combat_receipts,original.combat_receipts);
 draft.combat_receipts=[...draft.combat_receipts,{id:'new'}];assert.equal(original.combat_receipts.length,1);
 assert.equal(Object.keys(draft.talent_combat_state).length,1000);
});
test('ship transport scopes runtime before cloning and never deletes server history',()=>{
 const player={id:'p',talent_combat_state:{...history(),current:{toxicMarks:4}}};
 const snapshot=shipCombatPlayerSnapshot(player,['current']);
 assert.deepEqual(snapshot.talent_combat_state,{current:{toxicMarks:4}});assert.equal(Object.keys(player.talent_combat_state).length,1001);
 assert.deepEqual(selectCombatRuntime(player.talent_combat_state,['current','missing']),{current:{toxicMarks:4}});
});
