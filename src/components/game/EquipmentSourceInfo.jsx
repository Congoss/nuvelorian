import { getEquipmentSourceDescription } from './equipmentData';
export default function EquipmentSourceInfo({ item, language }) {
  return <div data-equipment-source={item.id} className="mt-2 shrink-0 rounded-lg border border-[#39463c] bg-[#111912] px-3 py-2">
    <p className="text-[10px] font-bold uppercase text-[#a9b9a4]">{language === 'en' ? 'How to obtain' : language === 'ru' ? 'Где получить' : 'Де отримати'}</p>
    <p className="mt-1 text-[11px] leading-relaxed text-[#c3cec0]">{getEquipmentSourceDescription(item, language)}</p>
  </div>;
}
