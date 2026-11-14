import test from 'node:test';
import assert from 'node:assert/strict';
import {grantPet} from '../server/utils/grantPet.js';
import {ADMIN_PET_OPTIONS} from '../src/lib/adminPetCatalog.js';
test('every catalog pet can be granted once without changing equipment',()=>{
 const player={equipped_items:{pet:'existing'},inventory_items:[]};
 for(const pet of ADMIN_PET_OPTIONS){
  assert.equal(grantPet(player,pet.id).added,1);
  assert.equal(grantPet(player,pet.id).added,0);
  const item=player.inventory_items.find(item=>item.id===pet.id);
  assert.equal(item.slot,'pet');assert.equal(item.type,'equipment');assert.equal(item.count,1);
 }
 assert.equal(player.inventory_items.length,ADMIN_PET_OPTIONS.length);
 assert.equal(player.equipped_items.pet,'existing');
});
test('unknown pet is rejected without mutating inventory',()=>{
 const player={inventory_items:[]};
 assert.throws(()=>grantPet(player,'fake-pet'),{code:'PET_UNKNOWN'});
 assert.deepEqual(player.inventory_items,[]);
});
test('equipped pet is not duplicated even without an inventory row',()=>{
 const player={equipped_items:{pet:'pet-bot'}};
 assert.equal(grantPet(player,'pet-bot').added,0);
 assert.equal(player.inventory_items,undefined);
});
