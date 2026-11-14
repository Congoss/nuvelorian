import { LockKeyhole } from 'lucide-react';
import { getEquipmentSourceLabel } from './equipmentData';

export default function EquipmentCatalogCard({ item, itemName, locked, equipped, selected, onClick, language }) {
  const lang = language === 'ua' ? 'uk' : language;
  const name = itemName || item.name || item.id;
  const status = locked
    ? lang === 'ru' ? 'Заблокировано' : lang === 'en' ? 'Locked' : 'Заблоковано'
    : equipped ? lang === 'ru' ? 'Надето' : lang === 'en' ? 'Equipped' : 'Надіто'
      : lang === 'ru' ? 'Доступно' : lang === 'en' ? 'Owned' : 'Отримано';
  return <button type="button" onClick={onClick} aria-label={name} data-equipment-card={item.id} data-locked={locked} className={`flex h-[190px] w-full min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-2 text-center transition ${locked ? selected ? 'border-[#949b96] bg-[#222623]' : 'border-[#414844] bg-[#141815]' : selected || equipped ? 'border-[#28ee90] bg-[#102219]' : 'border-[#28583d] bg-[#0d1410]'}`}>
    <span className={`line-clamp-2 h-8 w-full shrink-0 break-words text-left font-sans text-[11px] font-black uppercase leading-4 ${locked ? 'text-[#a6ada8]' : 'text-[#f4f8ed]'}`}>{name}</span>
    <img src={item.icon} alt="" className={`h-[70px] w-full min-w-0 shrink-0 object-contain ${locked ? 'grayscale opacity-55' : ''}`} />
    <span className={`flex min-h-6 w-full min-w-0 shrink-0 items-center justify-center gap-1 rounded-md border px-1 py-1 text-[9px] font-bold leading-3 ${locked ? 'border-[#555e57] bg-[#242a25] text-[#a9b2ac]' : 'border-[#287158] bg-[#10291e] text-[#6bffc4]'}`}>{locked && <LockKeyhole aria-hidden="true" className="h-3 w-3 shrink-0" />}<span className="min-w-0 break-words">{status}</span></span>
    <span className={`line-clamp-2 w-full min-w-0 break-words text-[9px] leading-3 ${locked ? 'text-[#89938c]' : 'text-[#b9cbb5]'}`}>{getEquipmentSourceLabel(item, language)}</span>
  </button>;
}
