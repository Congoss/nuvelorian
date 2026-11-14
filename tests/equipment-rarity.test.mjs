import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentRarity,rarityLabel,EQUIPMENT_RARITIES} from '../src/lib/equipmentRarity.js';

test('currency shop and regular paid pack items remain standard regardless of power or enhancement',()=>{
 for(const item of [{id:'pet-raccoon',buyPrice:5000},{id:'anubis_weapon',sourceType:'shop',enhancementLevel:15},{id:'newbie_pack_ii_head',sourceType:'newbie_pack'},{id:'future_head',purchasable:true,rarityTier:'artifact'}])assert.equal(equipmentRarity(item).id,'standard');
});
test('Epic and Legendary Battle Pass tracks retain their class across gear, pets and animations',()=>{
 for(const tier of ['epic','legendary'])for(const slot of ['head','weapon','armor','hands','legs','boots','pet','animation']){
  assert.equal(equipmentRarity({id:`bp_${tier}_${slot}`}).id,tier);
  assert.equal(equipmentRarity({id:`bp_${tier}_${slot}`,sourceType:'battle_pass',rarityTier:'standard',enhancementLevel:15}).id,tier);
 }
 assert.equal(equipmentRarity({id:'bp_skeleton_2026_head',rarityTier:'standard'}).id,'legendary');
 assert.equal(equipmentRarity({id:'next_season_pet',sourceType:'battle_pass',rarity:'epic'}).id,'epic');
});
test('legacy boss gear without metadata resolves to stable set classes',()=>{
 const tiers={cardboard:'uncommon',night_disinfector:'uncommon',nuvelor:'rare',set4:'rare',set5:'epic',anubis:'legendary',shkraban:'legendary'};
 for(const [prefix,tier] of Object.entries(tiers))for(const slot of ['weapon','head','hands','armor','legs','boots'])assert.equal(equipmentRarity({id:prefix+'_'+slot}).id,tier);
});
test('player resale and enhancement do not change a boss drop class',()=>{
 const item={id:'set5_weapon',enhancementLevel:0},before=structuredClone(item);
 const tier=equipmentRarity(item).id;
 assert.equal(equipmentRarity({...item,enhancementLevel:15,sourceType:'market',price:10000000}).id,tier);
 assert.equal(equipmentRarity({...item,forged:true,agentCost:0,marketBound:true}).id,tier);
 assert.deepEqual(item,before);
});
test('boss pets share the same extensible rarity scale',()=>{
 for(const [id,tier] of Object.entries({'pet-bot':'uncommon','pet-skunk':'rare',pet5:'epic','pet-purrgulp':'mythic','pet-toaster':'mythic'}))assert.equal(equipmentRarity({id,slot:'pet'}).id,tier);
 assert.equal(equipmentRarity({id:'future_pet',slot:'pet',rarityTier:'artifact'}).id,'artifact');
});
test('future bosses need explicit classification and do not automatically consume top rarity',()=>{
 assert.equal(equipmentRarity({id:'boss99_weapon',bossId:'boss99',sourceType:'boss'}).id,'standard');
 assert.equal(equipmentRarity({id:'boss99_weapon'}, {sourceType:'boss',rarityTier:'mythic'}).id,'mythic');
 assert.equal(equipmentRarity({id:'boss99_weapon',rarityTier:'nonsense'}).id,'standard');
 assert.equal(equipmentRarity({id:'future_pet',rarityTier:'__proto__'}).id,'standard');
});
test('rarity names are localized; event and raid legacy labels are retained',()=>{
 for(const tier of Object.values(EQUIPMENT_RARITIES))for(const lang of ['uk','ua','ru','en'])assert(rarityLabel(tier,lang).length>0);
 assert.equal(rarityLabel(EQUIPMENT_RARITIES.standard,'ru'),'Стандартная');
 assert.equal(equipmentRarity({id:'raidboss2_pet',sourceType:'raid',rarity:'legendary'}).id,'legendary');
});
test('event equipment, pets and accessories have a distinct orange collection class',()=>{
 for(const slot of ['weapon','head','hands','armor','legs','boots','pet','talisman'])assert.equal(equipmentRarity({id:'halloween_2026_'+slot,rarityTier:'standard'}).id,'event');
 for(const sourceType of ['event','halloween','seasonal_event','event_shop','event_reward'])assert.equal(equipmentRarity({id:'future_pet',sourceType,purchasable:true}).id,'event');
 assert.equal(equipmentRarity({id:'future_boots',eventId:'winter_2027'}).id,'event');
 assert.equal(equipmentRarity({id:'future_pet'},{sourceType:'event'}).id,'event');
 assert.equal(rarityLabel(EQUIPMENT_RARITIES.event,'uk'),'Івентова');
 assert.equal(equipmentRarity({id:'bp_epic_weapon',sourceType:'battle_pass'}).id,'epic');
});
