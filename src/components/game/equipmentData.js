import { EPIC_BP_ITEMS } from '../../lib/epicBattlePassSet.js';
import { BP_ANIMATION_ITEMS, inventoryWithBattlePassAnimations } from '../../lib/battlePassAnimations.js';
import epicAnimationIcon from '@/assets/hero/animation-icons/epic-ravens.png';
import legendaryAnimationIcon from '@/assets/hero/animation-icons/legendary-blue-fire.png';
import raidCrown from '@/assets/hero/accessories/raidboss2-place1.png';
import raidCrownIcon from '@/assets/hero/accessories/raidboss2-place1-icon.png';
import raidCrown2 from '@/assets/hero/accessories/raidboss2-place2.png';
import raidCrown3 from '@/assets/hero/accessories/raidboss2-place3.png';
import raidCrown2Icon from '@/assets/hero/accessories/raidboss2-place2-icon.png';
import raidCrown3Icon from '@/assets/hero/accessories/raidboss2-place3-icon.png';
import raidPet from '@/assets/hero/accessories/raidboss2-pet.png';
import raidPetIcon from '@/assets/hero/accessories/raidboss2-pet-ico.png';
import hereEarlyPetArt from '@/assets/hero/hereearlypet/hereearlypet.webp';
import hereEarlyPetIcon from '@/assets/hero/hereearlypet/hereearlypet-icon.webp';
import { LEGENDARY_BP_ITEMS } from '../../lib/legendaryBattlePassSet.js';
import bpEpicarmorIcon from '@/assets/hero/bp epic set/setbp1-armor-ico.png';
import bpEpicbootsIcon from '@/assets/hero/bp epic set/setbp1-boots-ico.png';
import bpEpichandsIcon from '@/assets/hero/bp epic set/setbp1-hands-ico.png';
import bpEpicheadIcon from '@/assets/hero/bp epic set/setbp1-head-ico.png';
import bpEpiclegsIcon from '@/assets/hero/bp epic set/setbp1-legs-ico.png';
import bpEpicweaponIcon from '@/assets/hero/bp epic set/setbp1-weap-ico.png';
import bpEpicpetIcon from '@/assets/hero/bp epic set/setbp1-pet-ico.png';
import bpEpicarmorLayer from '@/assets/hero/bp epic set/setbp1-armor.png';
import bpEpicbootsLayer from '@/assets/hero/bp epic set/setbp1-boots.png';
import bpEpichandsLayer from '@/assets/hero/bp epic set/setbp1-hands.png';
import bpEpicheadLayer from '@/assets/hero/bp epic set/setbp1-head.png';
import bpEpiclegsLayer from '@/assets/hero/bp epic set/setbp1-legs.png';
import { getBalancedEquipmentItem } from '../../lib/equipmentBalance.js';
import { calculateEquipmentEffects as sharedEquipmentEffects, applyEquipmentEffectsToWeapon as sharedWeaponEffects } from '../../lib/equipmentEffects.js';
import headIcon from '@/assets/hero/eq-icons/head-icon.png';
import armorIcon from '@/assets/hero/eq-icons/armor-icon.png';
import handsIcon from '@/assets/hero/eq-icons/hands-icon.png';
import trousersIcon from '@/assets/hero/eq-icons/legs-icon.png';
import bootsIcon from '@/assets/hero/eq-icons/boots-icon.png';
import weaponIcon from '@/assets/hero/eq-icons/weapon-icon.png';
import pet1Icon from '@/assets/hero/eq-icons/pet-1.png';
import pet2Icon from '@/assets/hero/eq-icons/pet-2.png';
import newbieSoulArt from '@/assets/hero/newbie-soul.png';
import newbieSoulIcon from '@/assets/hero/pet-newbie-soul-ico.png';
import pet4Icon from '@/assets/hero/eq-icons/pet-4.png';
import pet1Full from '@/assets/hero/pet-1-full.png';
import pet2Full from '@/assets/hero/pet-2-full.png';
import pet4Full from '@/assets/hero/pet-4-full.png';
import pet5Body from '@/assets/hero/pet5/pet5-body.png';
import pet5Icon from '@/assets/hero/pet5/pet5-ico.png';
import nightArmorLayer from '@/assets/hero/night-disinfector/set2-armor.png';
import nightBootsLayer from '@/assets/hero/night-disinfector/set2-boots.png';
import nightHandsIcon from '@/assets/hero/night-disinfector/set2-hands-ico.png';
import nightHeadIcon from '@/assets/hero/night-disinfector/set2-head-ico.png';
import nightLegsLayer from '@/assets/hero/night-disinfector/set2-legs.png';
import nightWeaponIcon from '@/assets/hero/night-disinfector/set2-hands-weap1-ico.png';
import nightArmorIcon from '@/assets/hero/night-disinfector/set2-armor-ico.png';
import nightBootsIcon from '@/assets/hero/night-disinfector/set2-boots-ico.png';
import nightLegsIcon from '@/assets/hero/night-disinfector/set2-legs-ico.png';
import nuvelorArmorLayer from '@/assets/hero/nuvelor/set3-armor.png';
import nuvelorBootsLayer from '@/assets/hero/nuvelor/set3-boots.png';
import nuvelorHandsIcon from '@/assets/hero/nuvelor/set3-hands-ico.png';
import nuvelorHeadIcon from '@/assets/hero/nuvelor/set3-head-ico.png';
import nuvelorLegsLayer from '@/assets/hero/nuvelor/set3-legs.png';
import nuvelorWeaponIcon from '@/assets/hero/nuvelor/set3-weap1-ico.png';
import nuvelorArmorIcon from '@/assets/hero/nuvelor/set3-armor-ico.png';
import nuvelorBootsIcon from '@/assets/hero/nuvelor/set3-boots-ico.png';
import nuvelorLegsIcon from '@/assets/hero/nuvelor/set3-legs-ico.png';
import set5ArmorLayer from '@/assets/hero/cosmo set/set5-armor.png';
import set5ArmorIcon from '@/assets/hero/cosmo set/set5-armor-ico.png';
import set5BootsIcon from '@/assets/hero/cosmo set/set5-boots-ico.png';
import set5LegsIcon from '@/assets/hero/cosmo set/set5-legs-ico.png';
import set5BootsLayer from '@/assets/hero/cosmo set/set5-boots.png';
import set5HandsIcon from '@/assets/hero/cosmo set/set5-hands-ico.png';
import set5HeadIcon from '@/assets/hero/cosmo set/set5-head-ico.png';
import set5LegsLayer from '@/assets/hero/cosmo set/set5-legs.png';
import set5WeaponIcon from '@/assets/hero/cosmo set/set5-hands-weap5-ico.png';
import set4ArmorLayer from '@/assets/hero/gumset/set4-armor.png';
import set4LegsLayer from '@/assets/hero/gumset/set4-legs.png';
import set4BootsLayer from '@/assets/hero/gumset/set4-boots.png';
import set4HandsLayer from '@/assets/hero/gumset/set4-hands.png';
import set4HeadLayer from '@/assets/hero/gumset/set4-head.png';
import set4HeadIcon from '@/assets/hero/gumset/set4-head-ico.png';
import set4ArmorIcon from '@/assets/hero/gumset/set4-armor-ico.png';
import set4HandsIcon from '@/assets/hero/gumset/set4-hands-ico.png';
import set4LegsIcon from '@/assets/hero/gumset/set4-legs-ico.png';
import set4BootsIcon from '@/assets/hero/gumset/set4-boots-ico.png';
import set4WeaponIcon from '@/assets/hero/gumset/set4-weap4-without-hands-ico.png';
import newbiePack2Armor from '@/assets/hero/newbie pack/set-newbiepack-armor.png';
import newbiePack2ArmorIcon from '@/assets/hero/newbie pack/set-newbiepack-armor-ico.png';
import newbiePack2Boots from '@/assets/hero/newbie pack/set-newbiepack-boots.png';
import newbiePack2BootsIcon from '@/assets/hero/newbie pack/set-newbiepack-boots-ico.png';
import newbiePack2Hands from '@/assets/hero/newbie pack/set-newbiepack-hands.png';
import newbiePack2HandsIcon from '@/assets/hero/newbie pack/set-newbiepack-hands-ico.png';
import newbiePack2WeaponIcon from '@/assets/hero/newbie pack/set-newbiepack-hands-weap-ico.png';
import newbiePack2Head from '@/assets/hero/newbie pack/set-newbiepack-head.png';
import newbiePack2HeadIcon from '@/assets/hero/newbie pack/set-newbiepack-head-ico.png';
import newbiePack2Legs from '@/assets/hero/newbie pack/set-newbiepack-legs.png';
import newbiePack2LegsIcon from '@/assets/hero/newbie pack/set-newbiepack-legs-ico.png';
import { GAME_CONFIG } from '@/lib/gameConfig';

export const EQUIPMENT_SLOTS = [
  { id: 'accessory', label: 'Аксесуари', shortLabel: 'Аксесуари', icon: raidCrownIcon },
  { id: 'animation', label: 'Анімація', shortLabel: 'Анімація', icon: raidCrownIcon },
  { id: 'weapon', label: 'Weapon', shortLabel: 'Wpn', icon: weaponIcon },
  { id: 'head', label: 'Head', shortLabel: 'Head', icon: headIcon },
  { id: 'hands', label: 'Hands', shortLabel: 'Hands', icon: handsIcon },
  { id: 'armor', label: 'Armor', shortLabel: 'Armor', icon: armorIcon },
  { id: 'legs', label: 'Legs', shortLabel: 'Legs', icon: trousersIcon },
  { id: 'boots', label: 'Boots', shortLabel: 'Boots', icon: bootsIcon },
  { id: 'pet', label: 'Pet', shortLabel: 'Pet', icon: pet1Icon },
];

export const CARDBOARD_SURVIVOR_SET_ID = 'cardboard_survivor';
export const NIGHT_DISINFECTOR_SET_ID = 'night_disinfector';
export const NUVELOR_SET_ID = 'nuvelor';
export const SET5_SET_ID = 'set5';
export const SET4_SET_ID = 'set4';
export const NEWBIE_PACK_II_SET_ID = 'newbie_pack_ii_gear';
export const NEWBIE_PACK_II_SET_NAME_I18N = { ua: 'Спорядження новачка II', ru: 'Снаряжение новичка II', en: 'Newbie Pack II Gear' };
const FIRST_BOSS = GAME_CONFIG.BOSSES?.[0] || null;
export const FIRST_BOSS_ID = FIRST_BOSS?.id || 'heli';
export const FIRST_BOSS_NAME = FIRST_BOSS?.name || 'Boss';
const SECOND_BOSS = GAME_CONFIG.BOSSES?.[1] || null;
export const SECOND_BOSS_ID = SECOND_BOSS?.id || 'tank';
export const SECOND_BOSS_NAME = SECOND_BOSS?.name || 'Tank';
const THIRD_BOSS = GAME_CONFIG.BOSSES?.[2] || null;
export const THIRD_BOSS_ID = THIRD_BOSS?.id || 'chinook';
export const THIRD_BOSS_NAME = THIRD_BOSS?.name || 'Shork';

export const CARDBOARD_SET_NAME_I18N = {
  ua: 'Картонний виживальник',
  ru: 'Картонный выживальщик',
  en: 'Cardboard Survivor',
};
export const CARDBOARD_SET_BONUS_NAME_I18N = {
  ua: 'Тримається на скотчі',
  ru: 'Держится на скотче',
  en: 'Held by Tape',
};

export const NIGHT_DISINFECTOR_SET_NAME_I18N = {
  ua: 'Нічний дезінсектор',
  ru: 'Ночной дезинсектор',
  en: 'Night Exterminator',
};
export const NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N = {
  ua: 'Нічний імпульс',
  ru: 'Ночной импульс',
  en: 'Night Pulse',
};
export const NUVELOR_SET_NAME_I18N = {
  ua: 'NUVELOR',
  ru: 'NUVELOR',
  en: 'NUVELOR',
};
export const NUVELOR_SET_BONUS_NAME_I18N = {
  ua: 'Жива банка',
  ru: 'Живая банка',
  en: 'Living Canister',
};
export const SET5_SET_NAME_I18N = { ua: 'Космічний мандрівник', ru: 'Космический странник', en: 'Cosmic Explorer' };
export const SET5_SET_BONUS_NAME_I18N = { ua: 'Сингулярність', ru: 'Сингулярность', en: 'Singularity' };
export const SET4_SET_NAME_I18N = { ua: 'Кислотний комплект', ru: 'Кислотный комплект', en: 'Acid Suit' };
export const SET4_SET_BONUS_NAME_I18N = { ua: 'Жива кислота', ru: 'Живая кислота', en: 'Living Acid' };

const TENTACLES_PRICE = { currency: 'tentacles', amount: 10000 };

const CARD_SET_ITEMS = [
  {
    id: 'cardboard_weapon',
    slot: 'weapon',
    icon: weaponIcon,
    names: { ua: 'Не Ніж', ru: 'Не Нож', en: 'Not a Knife' },
    rarity: 'common',
    price: TENTACLES_PRICE,
    sourceType: 'boss',
    dropSource: FIRST_BOSS_NAME,
    dropBossId: FIRST_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: CARDBOARD_SURVIVOR_SET_ID,
    setNameI18n: CARDBOARD_SET_NAME_I18N,
    setBonusNameI18n: CARDBOARD_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'pencil_damage_pct', value: 0.05 }],
    attack: 38,
    hp: 0,
    locked: true,
    buyPrice: 10000,
  },
  {
    id: 'cardboard_head',
    slot: 'head',
    icon: headIcon,
    names: { ua: 'Крихке', ru: 'Хрупкое', en: 'FRAGILE' },
    rarity: 'common',
    price: TENTACLES_PRICE,
    sourceType: 'boss',
    dropSource: FIRST_BOSS_NAME,
    dropBossId: FIRST_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: CARDBOARD_SURVIVOR_SET_ID,
    setNameI18n: CARDBOARD_SET_NAME_I18N,
    setBonusNameI18n: CARDBOARD_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'boss_damage_pct', value: 0.03 }],
    attack: 0,
    hp: 120,
    locked: true,
    buyPrice: 10000,
  },
  {
    id: 'cardboard_armor',
    slot: 'armor',
    icon: armorIcon,
    names: { ua: 'Тримається', ru: 'Держится', en: 'Still Holds' },
    rarity: 'common',
    price: TENTACLES_PRICE,
    sourceType: 'boss',
    dropSource: FIRST_BOSS_NAME,
    dropBossId: FIRST_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: CARDBOARD_SURVIVOR_SET_ID,
    setNameI18n: CARDBOARD_SET_NAME_I18N,
    setBonusNameI18n: CARDBOARD_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'finger_damage_pct', value: 0.05 }],
    attack: 0,
    hp: 210,
    locked: true,
    buyPrice: 10000,
  },
  {
    id: 'cardboard_legs',
    slot: 'legs',
    icon: trousersIcon,
    names: { ua: 'Майже Сухі', ru: 'Почти Сухие', en: 'Almost Dry' },
    rarity: 'common',
    price: TENTACLES_PRICE,
    sourceType: 'boss',
    dropSource: FIRST_BOSS_NAME,
    dropBossId: FIRST_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: CARDBOARD_SURVIVOR_SET_ID,
    setNameI18n: CARDBOARD_SET_NAME_I18N,
    setBonusNameI18n: CARDBOARD_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'finger_cooldown_sec', value: -10 }],
    attack: 0,
    hp: 160,
    locked: true,
    buyPrice: 10000,
  },
  {
    id: 'cardboard_boots',
    slot: 'boots',
    icon: bootsIcon,
    names: { ua: 'Пішки', ru: 'Пешком', en: 'On Foot' },
    rarity: 'common',
    price: TENTACLES_PRICE,
    sourceType: 'boss',
    dropSource: FIRST_BOSS_NAME,
    dropBossId: FIRST_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: CARDBOARD_SURVIVOR_SET_ID,
    setNameI18n: CARDBOARD_SET_NAME_I18N,
    setBonusNameI18n: CARDBOARD_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'pencil_cooldown_sec', value: -15 }],
    attack: 5,
    hp: 70,
    locked: true,
    buyPrice: 10000,
  },
  {
    id: 'cardboard_hands',
    slot: 'hands',
    icon: handsIcon,
    names: { ua: 'Вижила', ru: 'Выжила', en: 'Survived' },
    rarity: 'common',
    price: TENTACLES_PRICE,
    sourceType: 'boss',
    dropSource: FIRST_BOSS_NAME,
    dropBossId: FIRST_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: CARDBOARD_SURVIVOR_SET_ID,
    setNameI18n: CARDBOARD_SET_NAME_I18N,
    setBonusNameI18n: CARDBOARD_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'poison_damage_pct', value: 0.04 }],
    attack: 8,
    hp: 80,
    locked: true,
    buyPrice: 10000,
  },
];

const NIGHT_DISINFECTOR_ITEMS = [
  {
    id: 'night_disinfector_weapon',
    slot: 'weapon',
    icon: nightWeaponIcon,
    names: { ua: 'Газетний кийок', ru: 'Газетная дубинка', en: 'Newspaper Baton' },
    rarity: 'rare',
    sourceType: 'boss',
    dropSource: SECOND_BOSS_NAME,
    dropBossId: SECOND_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NIGHT_DISINFECTOR_SET_ID,
    setNameI18n: NIGHT_DISINFECTOR_SET_NAME_I18N,
    setBonusNameI18n: NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'finger_damage_pct', value: 0.06 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'night_disinfector_head',
    slot: 'head',
    icon: nightHeadIcon,
    names: { ua: 'Електроімпульсний шолом', ru: 'Электроимпульсный шлем', en: 'Electro-Impulse Helmet' },
    rarity: 'rare',
    sourceType: 'boss',
    dropSource: SECOND_BOSS_NAME,
    dropBossId: SECOND_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NIGHT_DISINFECTOR_SET_ID,
    setNameI18n: NIGHT_DISINFECTOR_SET_NAME_I18N,
    setBonusNameI18n: NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'boss_damage_pct', value: 0.04 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'night_disinfector_hands',
    slot: 'hands',
    icon: nightHandsIcon,
    names: { ua: 'Гумові рукавиці', ru: 'Резиновые перчатки', en: 'Rubber Gloves' },
    rarity: 'rare',
    sourceType: 'boss',
    dropSource: SECOND_BOSS_NAME,
    dropBossId: SECOND_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NIGHT_DISINFECTOR_SET_ID,
    setNameI18n: NIGHT_DISINFECTOR_SET_NAME_I18N,
    setBonusNameI18n: NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'finger_cooldown_sec', value: -12 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'night_disinfector_legs',
    slot: 'legs',
    icon: nightLegsIcon,
    layerSrc: nightLegsLayer,
    names: { ua: 'Шорти з качками', ru: 'Шорты с утками', en: 'Duck Shorts' },
    rarity: 'rare',
    sourceType: 'boss',
    dropSource: SECOND_BOSS_NAME,
    dropBossId: SECOND_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NIGHT_DISINFECTOR_SET_ID,
    setNameI18n: NIGHT_DISINFECTOR_SET_NAME_I18N,
    setBonusNameI18n: NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'poison_damage_pct', value: 0.05 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'night_disinfector_boots',
    slot: 'boots',
    icon: nightBootsIcon,
    layerSrc: nightBootsLayer,
    names: { ua: 'Домашні капці', ru: 'Домашние тапки', en: 'House Slippers' },
    rarity: 'rare',
    sourceType: 'boss',
    dropSource: SECOND_BOSS_NAME,
    dropBossId: SECOND_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NIGHT_DISINFECTOR_SET_ID,
    setNameI18n: NIGHT_DISINFECTOR_SET_NAME_I18N,
    setBonusNameI18n: NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'pencil_cooldown_sec', value: -18 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'night_disinfector_armor',
    slot: 'armor',
    icon: nightArmorIcon,
    layerSrc: nightArmorLayer,
    names: { ua: 'Халат дезінсектора', ru: 'Халат дезинсектора', en: 'Exterminator Robe' },
    rarity: 'rare',
    sourceType: 'boss',
    dropSource: SECOND_BOSS_NAME,
    dropBossId: SECOND_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NIGHT_DISINFECTOR_SET_ID,
    setNameI18n: NIGHT_DISINFECTOR_SET_NAME_I18N,
    setBonusNameI18n: NIGHT_DISINFECTOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'pencil_damage_pct', value: 0.06 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
];

const NUVELOR_ITEMS = [
  {
    id: 'nuvelor_weapon',
    slot: 'weapon',
    icon: nuvelorWeaponIcon,
    names: { ua: 'Свинячий кийок', ru: 'Свиная дубинка', en: 'Pig Baton' },
    rarity: 'epic',
    sourceType: 'boss',
    dropSource: THIRD_BOSS_NAME,
    dropBossId: THIRD_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NUVELOR_SET_ID,
    setNameI18n: NUVELOR_SET_NAME_I18N,
    setBonusNameI18n: NUVELOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'finger_damage_pct', value: 0.08 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'nuvelor_head',
    slot: 'head',
    icon: nuvelorHeadIcon,
    names: { ua: 'Протигаз NUVELOR', ru: 'Противогаз NUVELOR', en: 'NUVELOR Gas Mask' },
    rarity: 'epic',
    sourceType: 'boss',
    dropSource: THIRD_BOSS_NAME,
    dropBossId: THIRD_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NUVELOR_SET_ID,
    setNameI18n: NUVELOR_SET_NAME_I18N,
    setBonusNameI18n: NUVELOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'boss_damage_pct', value: 0.06 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'nuvelor_hands',
    slot: 'hands',
    icon: nuvelorHandsIcon,
    names: { ua: 'Бинтові рукавиці', ru: 'Бинтовые перчатки', en: 'Bandage Gloves' },
    rarity: 'epic',
    sourceType: 'boss',
    dropSource: THIRD_BOSS_NAME,
    dropBossId: THIRD_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NUVELOR_SET_ID,
    setNameI18n: NUVELOR_SET_NAME_I18N,
    setBonusNameI18n: NUVELOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'finger_cooldown_sec', value: -14 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'nuvelor_legs',
    slot: 'legs',
    icon: nuvelorLegsIcon,
    layerSrc: nuvelorLegsLayer,
    names: { ua: 'Штани мандрівника', ru: 'Штаны странника', en: 'Wanderer Pants' },
    rarity: 'epic',
    sourceType: 'boss',
    dropSource: THIRD_BOSS_NAME,
    dropBossId: THIRD_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NUVELOR_SET_ID,
    setNameI18n: NUVELOR_SET_NAME_I18N,
    setBonusNameI18N: NUVELOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'poison_damage_pct', value: 0.07 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'nuvelor_boots',
    slot: 'boots',
    icon: nuvelorBootsIcon,
    layerSrc: nuvelorBootsLayer,
    names: { ua: 'Крокси NUVELOR', ru: 'Кроксы NUVELOR', en: 'NUVELOR Crocs' },
    rarity: 'epic',
    sourceType: 'boss',
    dropSource: THIRD_BOSS_NAME,
    dropBossId: THIRD_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NUVELOR_SET_ID,
    setNameI18n: NUVELOR_SET_NAME_I18N,
    setBonusNameI18n: NUVELOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'pencil_cooldown_sec', value: -20 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
  {
    id: 'nuvelor_armor',
    slot: 'armor',
    icon: nuvelorArmorIcon,
    layerSrc: nuvelorArmorLayer,
    names: { ua: 'Панцир NUVELOR', ru: 'Панцирь NUVELOR', en: 'NUVELOR Harness' },
    rarity: 'epic',
    sourceType: 'boss',
    dropSource: THIRD_BOSS_NAME,
    dropBossId: THIRD_BOSS_ID,
    purchasable: false,
    bossDrop: true,
    setId: NUVELOR_SET_ID,
    setNameI18n: NUVELOR_SET_NAME_I18N,
    setBonusNameI18n: NUVELOR_SET_BONUS_NAME_I18N,
    bonuses: [{ type: 'pencil_damage_pct', value: 0.08 }],
    attack: 0,
    hp: 0,
    locked: true,
  },
];

const SET5_ITEMS = [
  { id: 'set5_weapon', slot: 'weapon', icon: set5WeaponIcon, names: { ua: 'Променевий бластер', ru: 'Лучевой бластер', en: 'Particle Blaster' }, bonuses: [{ type: 'finger_damage_pct', value: 0.08 }] },
  { id: 'set5_head', slot: 'head', icon: set5HeadIcon, names: { ua: 'Шолом сингулярності', ru: 'Шлем сингулярности', en: 'Singularity Helmet' }, bonuses: [{ type: 'boss_damage_pct', value: 0.06 }] },
  { id: 'set5_hands', slot: 'hands', icon: set5HandsIcon, names: { ua: 'Рукавиці космонавта', ru: 'Перчатки космонавта', en: 'Astronaut Gloves' }, bonuses: [{ type: 'finger_cooldown_sec', value: -14 }] },
  { id: 'set5_armor', slot: 'armor', icon: set5ArmorIcon, layerSrc: set5ArmorLayer, names: { ua: 'Скафандр сингулярності', ru: 'Скафандр сингулярности', en: 'Singularity Suit' }, bonuses: [{ type: 'pencil_damage_pct', value: 0.08 }] },
  { id: 'set5_legs', slot: 'legs', icon: set5LegsIcon, layerSrc: set5LegsLayer, names: { ua: 'Космічні штани', ru: 'Космические штаны', en: 'Space Trousers' }, bonuses: [{ type: 'poison_damage_pct', value: 0.07 }] },
  { id: 'set5_boots', slot: 'boots', icon: set5BootsIcon, layerSrc: set5BootsLayer, names: { ua: 'Магнітні черевики', ru: 'Магнитные ботинки', en: 'Magnetic Boots' }, bonuses: [{ type: 'pencil_cooldown_sec', value: -20 }] },
].map((item) => ({
  ...item,
  rarity: 'epic', sourceType: 'boss', dropSource: GAME_CONFIG.BOSSES?.find((boss) => boss?.names?.en === 'Suckhole')?.names?.ua || 'Засмокт',
  dropBossId: GAME_CONFIG.BOSSES?.find((boss) => boss?.names?.en === 'Suckhole')?.id || 'boss6', purchasable: false, bossDrop: true,
  setId: SET5_SET_ID, setNameI18n: SET5_SET_NAME_I18N, setBonusNameI18n: SET5_SET_BONUS_NAME_I18N,
  attack: 0, hp: 0, locked: true,
}));

const SET4_BOSS = GAME_CONFIG.BOSSES?.[3] || null;
const SET4_ITEMS = [
  { id: 'set4_weapon', slot: 'weapon', icon: set4WeaponIcon, names: { ua: 'Кислотомет', ru: 'Кислотомёт', en: 'Acid Blaster' } },
  { id: 'set4_head', slot: 'head', icon: set4HeadIcon, layerSrc: set4HeadLayer, names: { ua: 'Кислотний шолом', ru: 'Кислотный шлем', en: 'Acid Helmet' } },
  { id: 'set4_hands', slot: 'hands', icon: set4HandsIcon, layerSrc: set4HandsLayer, names: { ua: 'Рукавиці мутанта', ru: 'Перчатки мутанта', en: 'Mutant Gloves' } },
  { id: 'set4_armor', slot: 'armor', icon: set4ArmorIcon, layerSrc: set4ArmorLayer, names: { ua: 'Живий панцир', ru: 'Живой панцирь', en: 'Living Harness' } },
  { id: 'set4_legs', slot: 'legs', icon: set4LegsIcon, layerSrc: set4LegsLayer, names: { ua: 'Кислотні штани', ru: 'Кислотные штаны', en: 'Acid Trousers' } },
  { id: 'set4_boots', slot: 'boots', icon: set4BootsIcon, layerSrc: set4BootsLayer, names: { ua: 'Черевики мутанта', ru: 'Ботинки мутанта', en: 'Mutant Boots' } },
].map((item) => ({
  ...item,
  rarity: 'epic',
  sourceType: 'boss',
  dropSource: SET4_BOSS?.name || 'Глиста',
  dropBossId: SET4_BOSS?.id || 'boss4',
  purchasable: false,
  bossDrop: true,
  setId: SET4_SET_ID,
  setNameI18n: SET4_SET_NAME_I18N,
  setBonusNameI18n: SET4_SET_BONUS_NAME_I18N,
  bonuses: [],
  attack: 0,
  hp: 0,
  locked: true,
}));

const NEWBIE_PACK_II_ITEMS = [
  { id: 'newbie_pack_ii_weapon', slot: 'weapon', icon: newbiePack2WeaponIcon, names: { ua: 'Бита для виживання', ru: 'Бита для выживания', en: 'Survival Bat' }, bonuses: [{ type: 'pencil_damage_pct', value: 0.05 }], attack: 38, hp: 0 },
  { id: 'newbie_pack_ii_head', slot: 'head', icon: newbiePack2HeadIcon, layerSrc: newbiePack2Head, names: { ua: 'Пекельна маска', ru: 'Адская маска', en: 'Hellfire Mask' }, bonuses: [{ type: 'boss_damage_pct', value: 0.03 }], attack: 0, hp: 120 },
  { id: 'newbie_pack_ii_hands', slot: 'hands', icon: newbiePack2HandsIcon, layerSrc: newbiePack2Hands, names: { ua: 'Рукавиці шукача', ru: 'Перчатки искателя', en: 'Scavenger Gloves' }, bonuses: [{ type: 'poison_damage_pct', value: 0.04 }], attack: 8, hp: 80 },
  { id: 'newbie_pack_ii_armor', slot: 'armor', icon: newbiePack2ArmorIcon, layerSrc: newbiePack2Armor, names: { ua: 'Худі виживальника', ru: 'Худи выжившего', en: 'Survivor Hoodie' }, bonuses: [{ type: 'finger_damage_pct', value: 0.05 }], attack: 0, hp: 210 },
  { id: 'newbie_pack_ii_legs', slot: 'legs', icon: newbiePack2LegsIcon, layerSrc: newbiePack2Legs, names: { ua: 'Карго-штани', ru: 'Карго-штаны', en: 'Cargo Trousers' }, bonuses: [{ type: 'finger_cooldown_sec', value: -10 }], attack: 0, hp: 160 },
  { id: 'newbie_pack_ii_boots', slot: 'boots', icon: newbiePack2BootsIcon, layerSrc: newbiePack2Boots, names: { ua: 'Помаранчеві кросівки', ru: 'Оранжевые кроссовки', en: 'Ember Sneakers' }, bonuses: [{ type: 'pencil_cooldown_sec', value: -15 }], attack: 5, hp: 70 },
].map((item) => ({
  ...item,
  rarity: 'rare', sourceType: 'newbie_pack', purchasable: false, bossDrop: false,
  setId: NEWBIE_PACK_II_SET_ID, setNameI18n: NEWBIE_PACK_II_SET_NAME_I18N,
  attack: item.attack || 0, hp: item.hp || 0, locked: true,
}));

const legendaryFiles = import.meta.glob('/src/assets/hero/bp leg set/*.png', { eager:true, query:'?url', import:'default' });
export const DEFAULT_EQUIPMENT_ITEMS = [
  { id: 'hereearlypet', slot: 'pet', name: 'HERE Early Pet', names: { ua: 'HERE Early Pet', ru: 'HERE Early Pet', en: 'HERE Early Pet' }, icon: hereEarlyPetIcon, renderArt: hereEarlyPetArt, sourceType: 'holder', rarity: 'legendary', attack: 0, hp: 0, bonuses: [], locked: true, purchasable: false },
  ...BP_ANIMATION_ITEMS.map(item => ({ ...item, icon: item.rarity === 'epic' ? epicAnimationIcon : legendaryAnimationIcon })),
  { id: 'raidboss2_crown_accessory', slot: 'accessory', name: 'Raid Champion Crown', names: { ua: 'Корона чемпіона рейду', ru: 'Корона чемпиона рейда', en: 'Raid Champion Crown' }, icon: raidCrownIcon, layerSrc: raidCrown, sourceType: 'raid', rarity: 'legendary', attack: 0, hp: 0, bonuses: [], locked: true, purchasable: false },
  ...[{ rank: 2, layerSrc: raidCrown2, icon: raidCrown2Icon }, { rank: 3, layerSrc: raidCrown3, icon: raidCrown3Icon }].map(({ rank, layerSrc, icon }) => ({ id: `raidboss2_crown${rank}_accessory`, slot: 'accessory', name: `Raid Crown #${rank}`, names: { ua: `Корона рейду · ${rank} місце`, ru: `Корона рейда · ${rank} место`, en: `Raid Crown · #${rank}` }, layerSrc, icon, sourceType: 'raid', raidRank: rank, rarity: 'legendary', attack: 0, hp: 0, bonuses: [], locked: true, purchasable: false })),
  { id: 'raidboss2_pet', slot: 'pet', name: 'Raid Scarecrow', names: { ua: 'Рейдове опудало', ru: 'Рейдовое пугало', en: 'Raid Scarecrow' }, icon: raidPetIcon, renderArt: raidPet, sourceType: 'raid', rarity: 'legendary', attack: 0, hp: 0, bonuses: [], locked: true, purchasable: false },
  ...LEGENDARY_BP_ITEMS.map(item=>({...item,icon:legendaryFiles['/src/assets/hero/bp leg set/setbp2-'+(item.slot==='weapon'?'weap':item.slot)+'.png'],locked:true})),
  ...EPIC_BP_ITEMS.map(item => ({ ...item,
    icon: { armor: bpEpicarmorIcon, boots: bpEpicbootsIcon, hands: bpEpichandsIcon, head: bpEpicheadIcon, legs: bpEpiclegsIcon, weapon: bpEpicweaponIcon, pet: bpEpicpetIcon }[item.slot],
    layerSrc: { armor: bpEpicarmorLayer, boots: bpEpicbootsLayer, hands: bpEpichandsLayer, head: bpEpicheadLayer, legs: bpEpiclegsLayer }[item.slot], locked: true,
  })),
  ...CARD_SET_ITEMS,
  ...NIGHT_DISINFECTOR_ITEMS,
  ...NUVELOR_ITEMS,
  ...SET4_ITEMS,
  ...SET5_ITEMS,
  ...NEWBIE_PACK_II_ITEMS,
  { id: 'pet-skunk', slot: 'pet', name: 'Junk Skunk', icon: pet1Icon, renderArt: pet1Full, attack: 18, hp: 110, locked: true, buyPrice: 5000 },
  { id: 'pet-raccoon', slot: 'pet', name: 'Trash Panda', icon: pet2Icon, renderArt: pet2Full, attack: 14, hp: 140, locked: true, buyPrice: 5000 },
  { id: 'pet-cthulhu', slot: 'pet', name: 'Mr.Newbie', icon: newbieSoulIcon, renderArt: newbieSoulArt, attack: 24, hp: 95, locked: true, buyPrice: 5000, bonuses: [
    { type: 'small_poison_flat', value: 20 },
    { type: 'medium_poison_flat', value: 35 },
    { type: 'large_poison_flat', value: 50 },
    { type: 'crit_chance_pct', value: 0.01 },
  ] },
  { id: 'pet-bot', slot: 'pet', name: 'Box Bot', names: { ua: 'Робот-коробка', ru: 'Робот-коробка', en: 'Box Bot' }, icon: pet4Icon, renderArt: pet4Full, attack: 10, hp: 170, locked: true, sourceType: 'boss', dropSource: FIRST_BOSS_NAME, dropBossId: FIRST_BOSS_ID, purchasable: false, bossDrop: true, bonuses: [
    { type: 'small_poison_flat', value: 10 },
    { type: 'medium_poison_flat', value: 20 },
    { type: 'large_poison_flat', value: 30 },
    { type: 'energy_capacity_flat', value: 25 },
  ] },
  { id: 'pet5', slot: 'pet', name: 'Gum Blob', icon: pet5Icon, renderArt: pet5Body, attack: 28, hp: 190, locked: true, sourceType: 'boss', dropSource: 'Глиста', dropBossId: 'boss4', purchasable: false, bossDrop: true },
].map((item) => {
  const balance = getBalancedEquipmentItem(item.id);
  return balance ? { ...item, ...balance } : item;
});

function toLang(language = 'en') {
  return language === 'uk' ? 'ua' : language === 'ua' || language === 'ru' ? language : 'en';
}

export function localizeEquipmentItemName(item, language = 'en') {
  const lang = toLang(language);
  if (item?.names?.[lang]) return item.names[lang];
  if (item?.names?.ua) return item.names.ua;
  return item?.name || '';
}

export function getShopSourceLabel(language = 'en') {
  const lang = toLang(language);
  if (lang === 'en') return 'Shop';
  return 'Магазин';
}

export function getEquipmentSourceLabel(item, language = 'en') {
  const lang = toLang(language);
  if (item?.sourceType === 'holder' || item?.sourceType === 'nft_holder') return lang === 'en' ? 'NFT collection · HERE Early' : lang === 'ru' ? 'NFT-коллекция · HERE Early' : 'NFT-колекція · HERE Early';
  if (item?.sourceType === 'raid') {
    const place = item.slot === 'pet' ? 'TOP 3' : `#${item.raidRank || 1}`;
    return `${lang === 'en' ? 'Raid Boss' : lang === 'ru' ? 'Рейд-босс' : 'Рейд-бос'} · ${place}`;
  }
  if (item?.sourceType === 'battle_pass') return item?.setId === 'bp_legendary' || item?.rarity === 'legendary' ? 'Battle Pass · LEGENDARY' : 'Battle Pass · EPIC';
  if (item?.sourceType === 'newbie_pack') {
    if (lang === 'en') return 'Newbie Pack II';
    if (lang === 'ru') return 'Пак новичка II';
    return 'Пак новачка II';
  }
  if (item?.sourceType === 'boss') {
    const bossName = GAME_CONFIG.BOSSES?.find((boss) => boss?.id === item?.dropBossId)?.names?.[lang]
      || item?.dropSource
      || SECOND_BOSS_NAME;
    if (lang === 'en') return `Drops from: ${bossName}`;
    if (lang === 'ru') return `Дроп с босса: ${bossName}`;
    return `Дроп з боса: ${bossName}`;
  }
  return getShopSourceLabel(language);
}

export function getEquipmentSourceDescription(item, language = 'en') {
  const lang = toLang(language);
  const source = getEquipmentSourceLabel(item, language);
  if (['holder', 'nft_holder'].includes(item?.sourceType)) return lang === 'en' ? 'Hold an unused HERE Early collection NFT in your verified NEAR wallet, then press Check NFT below. Each NFT can redeem one pet.' : lang === 'ru' ? 'Нужна неиспользованная NFT коллекции HERE Early в подтверждённом NEAR-кошельке. Нажми «Проверить NFT» ниже. Одна NFT даёт одного питомца.' : 'Потрібна невикористана NFT колекції HERE Early у підтвердженому NEAR-гаманці. Натисни «Перевірити NFT» нижче. Одна NFT дає одного пета.';
  if (item?.sourceType === 'raid') return lang === 'en' ? `Reward for ${source} at the end of the raid. Earn your place by dealing damage to the raid boss.` : lang === 'ru' ? `Награда за ${source} после завершения рейда. Наноси урон рейд-боссу, чтобы занять призовое место.` : `Нагорода за ${source} після завершення рейду. Завдавай шкоди рейд-босу, щоб посісти призове місце.`;
  if (item?.sourceType === 'battle_pass') return lang === 'en' ? `${source} reward. Reach the required pass level and claim this item from its reward track.` : lang === 'ru' ? `Награда ${source}. Достигни нужного уровня пропуска и забери предмет на соответствующей дорожке наград.` : `Нагорода ${source}. Досягни потрібного рівня пропуску й забери предмет на відповідній доріжці нагород.`;
  if (item?.sourceType === 'boss') return lang === 'en' ? `${source}. Defeat this boss and open its reward chests. The item is a random drop.` : lang === 'ru' ? `${source}. Побеждай этого босса и открывай наградные сундуки. Предмет выпадает случайно.` : `${source}. Перемагай цього боса й відкривай нагородні скрині. Предмет випадає випадково.`;
  if (item?.sourceType === 'newbie_pack') return lang === 'en' ? `Included in ${source}. Obtain the corresponding newbie pack in the game.` : lang === 'ru' ? `Входит в ${source}. Получи соответствующий пак новичка в игре.` : `Входить до ${source}. Отримай відповідний пак новачка у грі.`;
  return lang === 'en' ? `Source: ${source}. Look for this item in the in-game shop.` : lang === 'ru' ? `Источник: ${source}. Ищи этот предмет в магазине игры.` : `Джерело: ${source}. Шукай цей предмет у магазині гри.`;
}

export function getNoBonusLabel(language = 'en') {
  const lang = toLang(language);
  if (lang === 'en') return 'No extra bonus';
  if (lang === 'ru') return 'Без дополнительного бонуса';
  return 'Без додаткового бонусу';
}

export function normalizeEquipmentInventory(profile) {
  const items = inventoryWithBattlePassAnimations(profile);
  return items
    .filter((item) => item?.type === 'equipment')
    .map((item) => {
      const catalogItem = DEFAULT_EQUIPMENT_ITEMS.find((entry) => entry.id === item.id) || {};
      return ({
      id: item.id,
      slot: item.slot || catalogItem.slot,
      name: item.name || catalogItem.name,
      names: { ...item.names, ...catalogItem.names },
      icon: [NIGHT_DISINFECTOR_SET_ID, NUVELOR_SET_ID, SET5_SET_ID].includes(catalogItem.setId) ? catalogItem.icon : (item.icon || catalogItem.icon),
      layerSrc: item.layerSrc || catalogItem.layerSrc || null,
      renderArt: item.renderArt || catalogItem.renderArt || null,
      attack: item.attack || catalogItem.attack || 0,
      hp: item.hp || catalogItem.hp || 0,
      setId: item.setId || null,
      setName: item.setName || null,
      setNameI18n: catalogItem.setNameI18n || item.setNameI18n || null,
      setBonusNameI18n: catalogItem.setBonusNameI18n || item.setBonusNameI18n || null,
      rarity: item.rarity || null,
      price: item.price || null,
      sourceType: item.sourceType || null,
      dropSource: item.dropSource || catalogItem.dropSource || null,
      dropBossId: item.dropBossId || catalogItem.dropBossId || null,
      purchasable: Boolean(item.purchasable),
      bossDrop: Boolean(item.bossDrop),
      bonuses: getBalancedEquipmentItem(item.id)?.bonuses || (Array.isArray(item.bonuses) && item.bonuses.length ? item.bonuses : (catalogItem.bonuses || [])),
      poisonPct: item.poisonPct || 0,
      smallPoisonPct: item.smallPoisonPct || 0,
      mediumPoisonPct: item.mediumPoisonPct || 0,
      largePoisonPct: item.largePoisonPct || 0,
      locked: item.locked || false,
      buyPrice: item.buyPrice || 0,
      });
    });
}

export function normalizeEquippedLoadout(profile) {
  const equipped = profile?.equipped_items || {};
  return {
    weapon: equipped.weapon || null,
    head: equipped.head || null,
    hands: equipped.hands || null,
    armor: equipped.armor || null,
    legs: equipped.legs || null,
    boots: equipped.boots || null,
    pet: equipped.pet || null,
    accessory: equipped.accessory || null,
    animation: equipped.animation || null,
  };
}

export function buildVisibleHeroSlots(equippedItems) {
  return {
    weapon: Boolean(equippedItems.weapon),
    head: Boolean(equippedItems.head),
    hands: Boolean(equippedItems.hands),
    armor: Boolean(equippedItems.armor),
    legs: Boolean(equippedItems.legs),
    boots: Boolean(equippedItems.boots),
  };
}

export function getEquippedSetCounts(profile, equipmentInventory = []) {
  const equipped = normalizeEquippedLoadout(profile);
  const byId = new Map((equipmentInventory || []).map((item) => [item.id, item]));
  const counts = {};
  Object.values(equipped).forEach((itemId) => {
    const item = byId.get(itemId);
    if (!item?.setId || item.slot === 'pet') return;
    counts[item.setId] = (counts[item.setId] || 0) + 1;
  });
  return counts;
}

export function calculateEquipmentEffects(profile, equipmentInventory = []) {
  return sharedEquipmentEffects({ ...profile, inventory_items: equipmentInventory.length ? equipmentInventory : profile?.inventory_items });
}

export function applyEquipmentEffectsToWeapon(baseWeapon, profile, equipmentInventory = []) {
  return sharedWeaponEffects(baseWeapon, { ...profile, inventory_items: equipmentInventory.length ? equipmentInventory : profile?.inventory_items });
}

export function calculateEquipmentStats(equippedItems, equipmentInventory) {
  const byId = new Map(equipmentInventory.map((item) => [item.id, item]));
  const setCounts = new Map();
  const setTotals = new Map();
  const setNames = new Map();

  equipmentInventory.forEach((item) => {
    if (!item?.setId || item.slot === 'pet') return;
    setTotals.set(item.setId, (setTotals.get(item.setId) || 0) + 1);
    if (item.setName) setNames.set(item.setId, item.setName);
  });

  Object.values(equippedItems).forEach((itemId) => {
    if (!itemId) return;
    const item = byId.get(itemId);
    if (!item?.setId || item.slot === 'pet') return;
    setCounts.set(item.setId, (setCounts.get(item.setId) || 0) + 1);
  });

  const baseStats = Object.values(equippedItems).reduce(
    (totals, itemId) => {
      if (!itemId) return totals;
      const item = byId.get(itemId);
      if (!item) return totals;
      return {
        attack: totals.attack + (item.attack || 0),
        hp: totals.hp + (item.hp || 0),
      };
    },
    { attack: 0, hp: 0 }
  );

  const completeSets = Array.from(setCounts.entries())
    .filter(([setId, count]) => count > 0 && count === setTotals.get(setId))
    .map(([setId]) => setNames.get(setId) || setId);

  return {
    ...baseStats,
    completeSets,
    setBonusAttack: 0,
    setBonusHp: 0,
  };
}

export function describeEquipmentBonuses(item, language = 'ua') {
  if (!item) return [];
  const lang = toLang(language);
  const ua = {
    finger_damage_flat: 'Палець: +{{v}}',
    pencil_damage_flat: 'Олівець: +{{v}}',
    poison_damage_flat: 'Уся отрута: +{{v}}',
    boss_damage_flat: 'Шкода босам: +{{v}}',
    finger_damage_pct: 'Палець: шкода +{{v}}%',
    pencil_damage_pct: 'Олівець: шкода +{{v}}%',
    finger_cooldown_sec: 'Палець: КД {{v}} сек',
    pencil_cooldown_sec: 'Олівець: КД {{v}} сек',
    poison_damage_pct: 'Уся отрута: шкода +{{v}}%',
    small_poison_flat: 'Малий яд: +{{v}} шкоди',
    medium_poison_flat: 'Середній яд: +{{v}} шкоди',
    large_poison_flat: 'Фляга з отрутою: +{{v}} шкоди',
    crit_chance_pct: 'Шанс криту +{{v}}%',
    poison_preserve_chance_pct: 'Шанс не витратити яд +{{v}}%',
    energy_capacity_flat: 'Запас енергії +{{v}}',
    energy_regen_pct: 'Швидкість відновлення енергії +{{v}}%',
    boss_damage_pct: 'Урон по босах +{{v}}%',
  };
  const ru = {
    finger_damage_flat: 'Палец: +{{v}}',
    pencil_damage_flat: 'Карандаш: +{{v}}',
    poison_damage_flat: 'Весь яд: +{{v}}',
    boss_damage_flat: 'Урон по боссам: +{{v}}',
    finger_damage_pct: 'Палец: урон +{{v}}%',
    pencil_damage_pct: 'Карандаш: урон +{{v}}%',
    finger_cooldown_sec: 'Палец: КД {{v}} сек',
    pencil_cooldown_sec: 'Карандаш: КД {{v}} сек',
    poison_damage_pct: 'Весь яд: урон +{{v}}%',
    small_poison_flat: 'Малый яд: +{{v}} урона',
    medium_poison_flat: 'Средний яд: +{{v}} урона',
    large_poison_flat: 'Фляга с ядом: +{{v}} урона',
    crit_chance_pct: 'Шанс крита +{{v}}%',
    poison_preserve_chance_pct: 'Шанс не потратить яд +{{v}}%',
    energy_capacity_flat: 'Запас энергии +{{v}}',
    energy_regen_pct: 'Скорость восстановления энергии +{{v}}%',
    boss_damage_pct: 'Урон по боссам +{{v}}%',
  };
  const en = {
    finger_damage_flat: 'Finger: +{{v}}',
    pencil_damage_flat: 'Pencil: +{{v}}',
    poison_damage_flat: 'All poison: +{{v}}',
    boss_damage_flat: 'Boss damage: +{{v}}',
    finger_damage_pct: 'Finger damage +{{v}}%',
    pencil_damage_pct: 'Pencil damage +{{v}}%',
    finger_cooldown_sec: 'Finger cooldown {{v}} sec',
    pencil_cooldown_sec: 'Pencil cooldown {{v}} sec',
    poison_damage_pct: 'All poison damage +{{v}}%',
    small_poison_flat: 'Small poison: +{{v}} damage',
    medium_poison_flat: 'Medium poison: +{{v}} damage',
    large_poison_flat: 'Poison flask: +{{v}} damage',
    crit_chance_pct: 'Critical chance +{{v}}%',
    poison_preserve_chance_pct: 'Chance to preserve poison +{{v}}%',
    energy_capacity_flat: 'Energy capacity +{{v}}',
    energy_regen_pct: 'Energy regeneration speed +{{v}}%',
    boss_damage_pct: 'Boss damage +{{v}}%',
  };
  const dict = lang === 'en' ? en : lang === 'ru' ? ru : ua;

  const lines = [];
  (item.bonuses || []).forEach((bonus) => {
    const tpl = dict[bonus.type];
    if (!tpl) return;
    const value = bonus.type.includes('cooldown') || bonus.type.includes('_flat') ? String(Math.abs(Number(bonus.value || 0))) : String(Math.round(Number(bonus.value || 0) * 100));
    lines.push(tpl.replace('{{v}}', value));
  });
  return lines;
}

export function findEquipmentItem(itemId, equipmentInventory) {
  return equipmentInventory.find((item) => item.id === itemId) || null;
}
