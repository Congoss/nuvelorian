import { getEquipmentSourceDescription } from './equipmentData';
export default function EquipmentSourceInfo({ item, language }) {
  return <details data-equipment-source={item.id} className="group mt-1 shrink-0 rounded-lg border border-[#39463c] bg-[#111912]">
    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] font-bold uppercase text-[#a9b9a4] marker:content-none">
      <span>{language === 'en' ? 'How to obtain' : language === 'ru' ? 'Где получить' : 'Де отримати'}</span>
      <span className="text-[#42f2b6] transition-transform group-open:rotate-180">⌄</span>
    </summary>
    <p className="border-t border-[#2b382e] px-3 py-2 text-[11px] leading-relaxed text-[#c3cec0]">{getEquipmentSourceDescription(item, language)}</p>
  </details>;
}
