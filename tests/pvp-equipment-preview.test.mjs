import test from 'node:test';
import assert from 'node:assert/strict';
import { pvpEquipmentPreview } from '../src/lib/pvpEquipmentPreview.js';
import { demoDuelProfile, duelStats } from '../src/lib/pvpDuel.js';

test('item preview agrees with duel stats for mixed loadouts and canonical enhancements', () => {
  const current = demoDuelProfile({set:'cardboard_survivor',enhancement:0,talents:50});
  const upgrade = demoDuelProfile({set:'nuvelor',enhancement:0,talents:0});
  for (const slot of ['weapon','head','armor','hands','legs','boots']) {
    const item = upgrade.inventory_items.find(i=>i.slot===slot);
    const profile = {...current,equipment_enhancement_levels:{[item.id]:10}};
    const actual = duelStats({...profile,inventory_items:[...current.inventory_items,{...item,enhancementLevel:10}],equipped_items:{...current.equipped_items,[slot]:item.id}});
    const preview = pvpEquipmentPreview(profile,item);
    assert.equal(preview.attack,actual.attack);
    assert.equal(preview.totalHp,actual.maxHp);
    assert.equal(preview.attackDelta,actual.attack-duelStats(current).attack);
    assert.equal(preview.hpDelta,actual.maxHp-duelStats(current).maxHp);
    if(slot!=='weapon')assert.equal(preview.hp,actual.pieces.find(p=>p.slot===slot).hp);
  }
});
test('equipped item shows zero replacement difference and preview never changes equipment', () => {
  const profile = demoDuelProfile({set:'nuvelor',enhancement:15,talents:0});
  const before=JSON.stringify(profile);
  for(const item of profile.inventory_items){const preview=pvpEquipmentPreview(profile,item);assert.equal(preview.attackDelta,0);assert.equal(preview.hpDelta,0);}
  assert.equal(JSON.stringify(profile),before);
  assert.equal(pvpEquipmentPreview(profile,{id:'garage',slot:'background'}),null);
});
