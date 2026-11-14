import { getBalancedEquipmentItem } from './equipmentBalance.js';
export const EPIC_BP_SET_ID = 'bp_epic';
export const EPIC_BP_SET_NAME = { ua: 'Чумний алхімік', ru: 'Чумной алхимик', en: 'Plague Alchemist' };
export const EPIC_BP_REWARD_LEVELS = { boots: 5, legs: 10, hands: 15, armor: 20, head: 25, weapon: 30, epic_pet: 46 };
const names = {
  boots: { ua: 'Чумні черевики', ru: 'Чумные ботинки', en: 'Plague Boots' },
  legs: { ua: 'Штани алхіміка', ru: 'Штаны алхимика', en: 'Alchemist Trousers' },
  hands: { ua: 'Рукавиці алхіміка', ru: 'Перчатки алхимика', en: 'Alchemist Gloves' },
  armor: { ua: 'Плащ алхіміка', ru: 'Плащ алхимика', en: 'Alchemist Coat' },
  head: { ua: 'Чумна маска', ru: 'Чумная маска', en: 'Plague Mask' },
  weapon: { ua: 'Кислотний щур', ru: 'Кислотная крыса', en: 'Acid Rat' },
  epic_pet: { ua: 'Ворон алхіміка', ru: 'Ворон алхимика', en: 'Alchemist Raven' },
};
export const EPIC_BP_ITEMS = Object.keys(EPIC_BP_REWARD_LEVELS).map(rewardType => ({
  id: rewardType === 'epic_pet' ? 'bp_epic_pet' : 'bp_epic_' + rewardType,
  slot: rewardType === 'epic_pet' ? 'pet' : rewardType,
  type: 'equipment', rarity: 'epic', sourceType: 'battle_pass', purchasable: false,
  rewardType, names: names[rewardType], name: names[rewardType].en,
  setId: rewardType === 'epic_pet' ? null : EPIC_BP_SET_ID,
  setNameI18n: EPIC_BP_SET_NAME, bonuses: getBalancedEquipmentItem('bp_epic_' + rewardType)?.bonuses || [], attack: 0, hp: 0,
}));
export function getEpicBattlePassItem(rewardType) { return EPIC_BP_ITEMS.find(item => item.rewardType === rewardType) || null; }
