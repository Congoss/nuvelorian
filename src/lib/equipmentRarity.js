// Presentation-only classification. Does not change stats, prices or drop rolls.
export const EQUIPMENT_RARITIES = Object.freeze({
  standard:{id:'standard',color:'#b0bac5',names:{uk:'Стандартна',ru:'Стандартная',en:'Standard'}},
  uncommon:{id:'uncommon',color:'#8fbbe8',names:{uk:'Незвична',ru:'Необычная',en:'Uncommon'}},
  rare:{id:'rare',color:'#668cff',names:{uk:'Рідкісна',ru:'Редкая',en:'Rare'}},
  epic:{id:'epic',color:'#ae85f7',names:{uk:'Епічна',ru:'Эпическая',en:'Epic'}},
  legendary:{id:'legendary',color:'#ed70d5',names:{uk:'Легендарна',ru:'Легендарная',en:'Legendary'}},
  mythic:{id:'mythic',color:'#ff7777',names:{uk:'Міфічна',ru:'Мифическая',en:'Mythic'}},
  artifact:{id:'artifact',color:'#efc45e',names:{uk:'Артефактна',ru:'Артефактная',en:'Artifact'}},
  event:{id:'event',color:'#ffa451',names:{uk:'Івентова',ru:'Ивентовая',en:'Event'}},
});
export const BOSS_EQUIPMENT_RARITY = Object.freeze({
  heli:'uncommon',tank:'uncommon',chinook:'rare',boss4:'rare',boss6:'epic',boss7:'legendary',boss8:'legendary',
});
const SET_RARITY = {cardboard:'uncommon',night_disinfector:'uncommon',nuvelor:'rare',set4:'rare',set5:'epic',anubis:'legendary',shkraban:'legendary'};
const PET_RARITY = {'pet-bot':'uncommon','pet-skunk':'rare',pet5:'epic','pet-purrgulp':'mythic','pet-toaster':'mythic'};
const PURCHASE_SOURCES = new Set(['shop','purchase','purchased','currency','newbie_pack','newbie_pack_ii','pack','battle_pass','battlepass']);
export function equipmentRarity(item={},catalog={}) {
  const merged={...catalog,...item},source=String(merged.sourceType || '').toLowerCase();
  const id=String(merged.id || '');
  // Pass reward classes follow their track, even for legacy rows with no source
  // or a Standard presentation field computed before this exception existed.
  if(id.startsWith('bp_legendary_') || id.startsWith('bp_skeleton_2026_') || merged.setId==='bp_legendary')return EQUIPMENT_RARITIES.legendary;
  if(id.startsWith('bp_epic_') || merged.setId==='bp_epic')return EQUIPMENT_RARITIES.epic;
  if(['battle_pass','battlepass'].includes(source)){
    const tier=merged.battlePassTier || merged.rarity;
    if(tier==='epic' || tier==='legendary')return EQUIPMENT_RARITIES[tier];
  }
  // Event collection is separate from the power ladder, including event-shop
  // rewards and older Halloween rows which only persisted the equipment ID.
  if(merged.rarityTier==='event' || ['event','halloween','seasonal_event','event_shop','event_reward'].includes(source)
    || merged.eventId || merged.event_id || id.startsWith('halloween_') || String(merged.setId || '').startsWith('halloween_'))return EQUIPMENT_RARITIES.event;
  // A shop purchase is standard, but a player-market transfer preserves the
  // original boss item. Never derive rarity from its sale price or enhancement.
  if(PURCHASE_SOURCES.has(source) || merged.purchasable===true || Number(merged.buyPrice)>0)return EQUIPMENT_RARITIES.standard;
  if(Object.hasOwn(EQUIPMENT_RARITIES,merged.rarityTier))return EQUIPMENT_RARITIES[merged.rarityTier];
  if(PET_RARITY[merged.id])return EQUIPMENT_RARITIES[PET_RARITY[merged.id]];
  for(const [prefix,tier] of Object.entries(SET_RARITY))if(String(merged.id || '').startsWith(prefix+'_'))return EQUIPMENT_RARITIES[tier];
  const boss=merged.dropBossId || merged.bossId;
  if(BOSS_EQUIPMENT_RARITY[boss])return EQUIPMENT_RARITIES[BOSS_EQUIPMENT_RARITY[boss]];
  // New bosses do not automatically consume the top rarity. Assign rarityTier
  // explicitly in their catalog; old rarity is only a fallback for boss drops.
  if((['boss','raid','event','holder','nft_holder'].includes(source) || merged.bossDrop || boss) && Object.hasOwn(EQUIPMENT_RARITIES,merged.rarity))return EQUIPMENT_RARITIES[merged.rarity];
  return EQUIPMENT_RARITIES.standard;
}
export function rarityLabel(rarity,language='uk') {
  const lang=language==='ua'?'uk':language;
  return rarity.names[lang] || rarity.names.uk;
}
