import { getBalancedEquipmentItem } from '@/lib/equipmentBalance';
import { SHKRABAN_ENABLED, SHKRABAN_ROOT, SHKRABAN_SLOTS, SHKRABAN_PET_ID } from '@/lib/shkrabanContent';
const names = {
  head: ['Телевізор Шкрябана','Телевизор Шкрябана','Shkraban TV Head'],
  armor: ['Пальто піратського ефіру','Пальто пиратского эфира','Pirate Broadcast Coat'],
  hands: ['Наручі передавача','Наручи передатчика','Transmitter Bracers'],
  legs: ['Карго телепірата','Карго телепирата','TV Pirate Cargo Pants'],
  boots: ['Кроси короткого замикання','Кроссы короткого замыкания','Short-Circuit Sneakers'],
  weapon: ['Механічні руки Шкрябана','Механические руки Шкрябана','Shkraban Mechanical Arms'],
};
const common = { attack: 0, hp: 0, rarity: 'epic', sourceType: 'boss', dropSource: 'Шкрябан', dropBossId: 'boss8', purchasable: false, bossDrop: true, locked: true };
export const SHKRABAN_ITEMS = SHKRABAN_ENABLED ? SHKRABAN_SLOTS.map(slot => ({
  ...common, ...getBalancedEquipmentItem(`shkraban_${slot}`), names: { ua: names[slot][0], ru: names[slot][1], en: names[slot][2] },
  icon: `${SHKRABAN_ROOT}/icons/${slot}.webp`, layerSrc: `${SHKRABAN_ROOT}/hero/${slot === 'head' ? 'head.svg' : slot + '.webp'}`,
  setId: 'shkraban', setNameI18n: { ua: 'Піратський ефір', ru: 'Пиратский эфир', en: 'Pirate Broadcast' },
})) : [];
export const SHKRABAN_PET = SHKRABAN_ENABLED ? [{ ...common, ...getBalancedEquipmentItem(SHKRABAN_PET_ID), balancePending: false, slot: 'pet', name: 'Тостер-привид', names: { ua: 'Тостер-привид', ru: 'Тостер-призрак', en: 'Haunted Toaster' }, icon: `${SHKRABAN_ROOT}/pet.webp`, renderArt: `${SHKRABAN_ROOT}/pet.webp` }] : [];
