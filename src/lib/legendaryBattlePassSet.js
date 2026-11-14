import { getBalancedEquipmentItem } from './equipmentBalance.js';
const names = {
 boots: {ua:'Черевики лавового женця',ru:'Ботинки лавового жнеца',en:'Lava Reaper Boots'},
 legs: {ua:'Штани лавового женця',ru:'Штаны лавового жнеца',en:'Lava Reaper Trousers'},
 hands: {ua:'Рукавиці лавового женця',ru:'Перчатки лавового жнеца',en:'Lava Reaper Gloves'},
 armor: {ua:'Броня лавового женця',ru:'Броня лавового жнеца',en:'Lava Reaper Armor'},
 head: {ua:'Гарбузовий шолом',ru:'Тыквенный шлем',en:'Pumpkin Helmet'},
 weapon: {ua:'Тризуб пильного ока',ru:'Трезубец недремлющего ока',en:'Watchful Eye Trident'},
 pet: {ua:'Пустотник',ru:'Пустотник',en:'Voidling'},
};
export const LEGENDARY_BP_ITEMS = ['boots','legs','hands','armor','head','weapon','pet'].map(slot => ({
  id: 'bp_legendary_' + slot, slot, type: 'equipment', rarity: 'legendary',
  sourceType: 'battle_pass', purchasable: false, setId: slot === 'pet' ? null : 'bp_legendary',
  rewardType: slot === 'pet' ? 'pet' : 'legendary_' + slot, name: names[slot].en, attack: 0, hp: 0,
  names: names[slot],
  setNameI18n: { ua: 'Лавовий жнець', ru: 'Лавовый жнец', en: 'Lava Reaper' },
  bonuses: getBalancedEquipmentItem('bp_legendary_' + slot)?.bonuses || [],
}));
export function getLegendaryBattlePassItem(type) { return LEGENDARY_BP_ITEMS.find(item => item.rewardType === type); }
