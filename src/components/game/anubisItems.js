import head from '@/assets/hero/anubis/head.png';
import armor from '@/assets/hero/anubis/armor.png';
import hands from '@/assets/hero/anubis/hands.png';
import legs from '@/assets/hero/anubis/legs.png';
import boots from '@/assets/hero/anubis/boots.png';
import weapon from '@/assets/hero/anubis/weapon.png';
import headIcon from '@/assets/hero/anubis/icons/head.png';
import armorIcon from '@/assets/hero/anubis/icons/armor.png';
import handsIcon from '@/assets/hero/anubis/icons/hands.png';
import legsIcon from '@/assets/hero/anubis/icons/legs.png';
import bootsIcon from '@/assets/hero/anubis/icons/boots.png';
import weaponIcon from '@/assets/hero/anubis/icons/weapon.png';

const art = { head, armor, hands, legs, boots, weapon };
const icons = {head:headIcon,armor:armorIcon,hands:handsIcon,legs:legsIcon,boots:bootsIcon,weapon:weaponIcon};
const names = {
  head:['Маска зоряного Анубіса','Маска звёздного Анубиса','Star Anubis Mask'],
  armor:['Панцир потойбіччя','Панцирь загробного мира','Afterlife Armor'],
  hands:['Наручі хранителя','Наручи хранителя','Guardian Bracers'],
  legs:['Бинти вічності','Бинты вечности','Eternal Wraps'],
  boots:['Кроки Дуату','Шаги Дуата','Duat Striders'],
  weapon:['Посохи двох світів','Посохи двух миров','Staves of Two Worlds'],
};
export const ANUBIS_ITEMS = Object.keys(art).map(slot => ({
  id:`anubis_${slot}`,slot,icon:icons[slot],layerSrc:art[slot],
  names:{ua:names[slot][0],ru:names[slot][1],en:names[slot][2]},
  setId:'anubis',setNameI18n:{ua:'Зоряний Анубіс',ru:'Звёздный Анубис',en:'Star Anubis'},
  setBonusNameI18n:{ua:'Вартовий двох світів',ru:'Страж двух миров',en:'Guardian of Two Worlds'},
  rarity:'epic',sourceType:'boss',dropSource:'Клеопатреш',dropBossId:'boss7',purchasable:false,bossDrop:true,
  attack:0,hp:0,locked:true,bonuses:[],
}));
