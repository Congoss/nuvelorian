import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmAttackFeedback} from '../src/lib/attackFeedback.js';
import {projectPoisonTap} from '../src/lib/instantPoisonCombat.js';

test('ship tap provides damage synchronously before any server response',()=>{
 const view={fight:{id:'ship',status:'active',current_hp:100000,max_hp:100000},profile:{talent_tree_version:2,talent_levels:{},weapon_inventory:{'large-poison':10}}};
 const projection=projectPoisonTap(view,{weaponId:'c4',mode:'ship',count:5});
 assert(projection.hit.damage>0);
 assert.equal(view.fight.current_hp-projection.fight.current_hp,projection.hit.damage);
 assert.equal(view.profile.weapon_inventory['large-poison'],10);
});
test('confirmed crit updates the same effect key instead of spawning a second damage number',()=>{
 const preview={effectId:'tap:1',damage:4170,isCrit:false,pending:true};
 const result=confirmAttackFeedback(preview,'tap:1',{damage:8340,isCrit:true});
 assert.equal(result.effectId,preview.effectId);
 assert.equal(result.damage,8340);assert.equal(result.isCrit,true);assert.equal(result.pending,false);
 assert.equal(preview.damage,4170);
});
test('late responses cannot replace a newer tap or resurrect an expired damage number',()=>{
 const newer={effectId:'tap:2',damage:200,pending:true};
 assert.equal(confirmAttackFeedback(newer,'tap:1',{damage:400,isCrit:true}),newer);
 assert.equal(confirmAttackFeedback(null,'tap:1',{damage:400,isCrit:true}),null);
});
