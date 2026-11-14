import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEquipmentLoadout} from './equipmentOwnership.js';
test('locked catalog items cannot be equipped by forging a profile patch',()=>{
  const player={inventory_items:[{id:'owned',type:'equipment',slot:'pet'},{id:'locked',type:'equipment',slot:'pet',locked:true}],equipped_items:{head:'legacy-head'}};
  assert.equal(validateEquipmentLoadout(player,{pet:'hereearlypet'}),false);
  assert.equal(validateEquipmentLoadout(player,{pet:'locked'}),false);
  assert.equal(validateEquipmentLoadout(player,{pet:'owned'}),true);
  assert.equal(validateEquipmentLoadout(player,{weapon:'owned'}),false);
  assert.equal(validateEquipmentLoadout(player,{pet:null,head:'legacy-head'}),true);
  assert.equal(validateEquipmentLoadout(player,[]),false);
  assert.equal(validateEquipmentLoadout(player,{pet:{id:'owned'}}),false);
  assert.equal(validateEquipmentLoadout({unlocked_backgrounds:['bp-epic']},{animation:'bp_epic_animation'}),true);
});
