import { Swords, Heart } from 'lucide-react';
import { pvpEquipmentPreview } from '@/lib/pvpEquipmentPreview';

export default function PvpEquipmentStats({ profile, item, language = 'uk' }) {
  const preview = pvpEquipmentPreview(profile, item);
  if (!preview) return null;
  const text = (uk, ru, en) => language === 'ru' ? ru : language === 'en' ? en : uk;
  const weapon = item.slot === 'weapon', armor = preview.hp > 0, pet = item.slot === 'pet';
  if (!weapon && !armor && !(pet && preview.petBonusPct)) return null;
  const Icon = armor ? Heart : Swords;
  const label = armor ? 'PvP HP' : text('PvP шкода', 'PvP урон', 'PvP damage');
  const value = armor ? `+${preview.hp}` : weapon ? String(preview.attack) : `+${preview.petBonusPct}%`;
  return <div className="flex min-h-[34px] items-center gap-2 rounded-[9px] border border-[#287158] bg-[#101714]/70 px-2 py-1" data-pvp-stat={armor ? 'hp' : 'damage'}>
    <Icon aria-hidden="true" className="h-[15px] w-[15px] shrink-0 text-[#42f2d0]" strokeWidth={2.5}/>
    <span className="min-w-0 font-sans text-[10px] font-bold leading-tight text-[#d2f4e5]">{label}: {value}</span>
  </div>;
}
