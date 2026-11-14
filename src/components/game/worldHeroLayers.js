import { normalizeEquipmentInventory, normalizeEquippedLoadout, buildVisibleHeroSlots, NIGHT_DISINFECTOR_SET_ID, NUVELOR_SET_ID, SET5_SET_ID, SET4_SET_ID, NEWBIE_PACK_II_SET_ID } from './equipmentData';
import { applyAnubisLayerOverrides } from '@/lib/anubisEquipment';
import { getEquipmentEnhancementLevels } from '@/lib/equipmentEnhancementPresentation';

export function worldHeroLayers(profile) {
  const equipped=normalizeEquippedLoadout(profile);
  const items=new Map(normalizeEquipmentInventory(profile).map(item=>[item.id,item]));
  const map={equippedWeaponId:equipped.weapon,equippedHandsId:equipped.hands,weaponEnhancementVariant:'charged',weaponEnhancementLevel:Number(getEquipmentEnhancementLevels(profile)[equipped.weapon]||0)};
  for(const slot of ['weapon','head','hands','armor','legs','boots','accessory','animation']) {
    const item=items.get(equipped[slot]);
    if(item?.layerSrc) map[slot]=item.layerSrc;
  }
  applyAnubisLayerOverrides(map,equipped,items);
  for(const [name,setId] of Object.entries({nightDisinfector:NIGHT_DISINFECTOR_SET_ID,nuvelor:NUVELOR_SET_ID,set5:SET5_SET_ID,set4:SET4_SET_ID,halloween:'halloween_2026',bpLegendary:'bp_legendary',bpEpic:'bp_epic',newbiePackII:NEWBIE_PACK_II_SET_ID})) {
    map[name]=Object.fromEntries(['weapon','head','hands','armor','legs','boots'].map(slot=>[slot,items.get(equipped[slot])?.setId===setId]));
  }
  map.bpEpicAura=equipped.animation==='bp_epic_animation';
  map.bpLegendaryAura=equipped.animation==='bp_legendary_animation';
  return {visibleSlots:buildVisibleHeroSlots(equipped),layerOverrides:map};
}
