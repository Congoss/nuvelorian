import test from 'node:test';
import assert from 'node:assert/strict';
import { getBalancedEquipmentItem } from '../src/lib/equipmentBalance.js';
import { calculateEquipmentEffects, applyEquipmentEffectsToWeapon } from '../src/lib/equipmentEffects.js';
import { GAME_CONFIG } from '../src/lib/gameConfig.js';

const cases=[
 ['bp_epic_pet',[30,45,60],'poisonPreserveChancePct',.03],
 ['bp_legendary_pet',[50,75,100],'poisonPreserveChancePct',.05],
 ['pet-bot',[10,20,30],'energyCapacityFlat',25],
 ['pet-skunk',[25,40,60],'poisonPreserveChancePct',.03],
 ['pet-cthulhu',[20,35,50],'critChancePct',.01],
 ['legion_pet',[10,20,30],'bleedChancePct',.05],
 ['hereearlypet',[50,75,100],'critChancePct',.05],
 ['raidboss2_pet',[30,40,50],'poisonPreserveChancePct',.02],
 ['pet5',[40,60,80],'energyCapacityFlat',20],
 ['halloween_2026_pet',[30,45,60],'critChancePct',.03],
 ['pet-purrgulp',[100,150,200],'poisonPreserveChancePct',.05],
];
for(const [id,damage,extra,value] of cases)test(`${id}: bare persisted drop and catalog produce identical combat effects`,()=>{
 const item=getBalancedEquipmentItem(id);assert.ok(item);
 const bare={equipped_items:{pet:id},inventory_items:[{id,slot:'pet',type:'equipment'}]};
 const full={equipped_items:{pet:id},inventory_items:[item]};
 const {effects,setCounts}=calculateEquipmentEffects(bare);assert.deepEqual(calculateEquipmentEffects(full).effects,effects);assert.deepEqual(setCounts,{});
 assert.deepEqual([effects.smallPoisonFlat,effects.mediumPoisonFlat,effects.largePoisonFlat],damage);assert.equal(effects[extra],value);
 for(const [index,weaponId] of ['satchel','f4','c4'].entries()){
  const base=GAME_CONFIG.WEAPONS.find(w=>w.id===weaponId);const result=applyEquipmentEffectsToWeapon(base,bare);assert.equal(result.damage,base.damage+damage[index]);
  if(extra==='poisonPreserveChancePct')assert.equal(result.saveChance,Math.min(1,Number(base.saveChance||0)+value));
 }
 assert.equal(applyEquipmentEffectsToWeapon(GAME_CONFIG.WEAPONS[0],bare).damage,GAME_CONFIG.WEAPONS[0].damage);
});
test('unequipped Purrgulp gives no effects; switching pets replaces bonuses',()=>{
 const inventory_items=[{id:'pet-purrgulp',slot:'pet'},{id:'pet5',slot:'pet'}];
 assert.equal(calculateEquipmentEffects({inventory_items}).effects.smallPoisonFlat,0);
 const switched=calculateEquipmentEffects({inventory_items,equipped_items:{pet:'pet5'}}).effects;
 assert.equal(switched.smallPoisonFlat,40);assert.equal(switched.poisonPreserveChancePct,0);
});
