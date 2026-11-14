import { LockKeyhole } from 'lucide-react';
import EquipmentRarityBadge from './EquipmentRarityBadge';
import {equipmentRarity} from '@/lib/equipmentRarity';
import cardboardHeadLayer from '@/assets/hero/set1-head.png';
import { getEquipmentSourceLabel } from './equipmentData';

export default function EquipmentCatalogCard({ item, itemName, locked, equipped, selected, onClick, language, statusLabel, detailLabel, footer, disabled = false }) {
  const lang = language === 'ua' ? 'uk' : language;
  const baseName = itemName || item.name || item.id;
  const rarity=equipmentRarity(item);
  const enhancementLevel = Math.max(0, Number(item.enhancementLevel) || 0);
  const name = baseName + (enhancementLevel > 0 ? ` +${enhancementLevel}` : '');
  const iconClass = `relative h-[84px] w-full min-w-0 object-contain ${locked ? 'grayscale opacity-55' : 'drop-shadow-[0_3px_2px_#0008]'}`;
  const status = statusLabel || (locked
    ? lang === 'ru' ? 'Заблокировано' : lang === 'en' ? 'Locked' : 'Заблоковано'
    : equipped ? lang === 'ru' ? 'Надето' : lang === 'en' ? 'Equipped' : 'Надіто'
      : lang === 'ru' ? 'Доступно' : lang === 'en' ? 'Owned' : 'Отримано');
  return <button type="button" disabled={disabled} onClick={onClick} aria-label={name} data-equipment-card={item.id} data-locked={locked} className={`relative flex ${footer ? 'h-[202px]' : 'h-[178px]'} w-full min-w-0 flex-col items-center gap-1 overflow-hidden rounded-[10px_14px_9px_12px] border p-2 text-center transition disabled:cursor-wait disabled:opacity-50 ${locked ? selected ? 'border-[#949b96] bg-[#222623]' : 'border-[#414844] bg-[#141815]' : selected || equipped ? 'border-[#28ee90] bg-[#102219]' : 'border-[#28583d] bg-[#0d1410]'}`}>
    <span className="flex h-8 w-full shrink-0 items-start gap-1" title={name}>
      <span className={`line-clamp-2 min-w-0 flex-1 break-words text-left font-sans text-[11px] font-black uppercase leading-4 ${locked ? 'text-[#a6ada8]' : 'text-[#f4f8ed]'}`}>{baseName}</span>
      {enhancementLevel > 0 && <span className="shrink-0 whitespace-nowrap rounded border border-[#d4f08a]/50 bg-[#27351b] px-1 font-mono text-[11px] font-black leading-4 text-[#d4f08a]">+{enhancementLevel}</span>}
    </span>
    <span className="relative flex h-[78px] w-full min-w-0 shrink-0 items-center justify-center rounded-lg" style={{background:locked?'radial-gradient(ellipse at 50% 65%,#8a887b14,transparent 70%)':'radial-gradient(ellipse at 50% 65%,#b5bb6d24,transparent 72%)'}}>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-1 left-[18%] right-[18%] h-px bg-[#9d9c6b]/20"/>
      {item.id === 'cardboard_head' ? (
        <svg aria-hidden="true" className={iconClass} viewBox="134 -30 236 236">
          <image href={cardboardHeadLayer} width="500" height="896" />
        </svg>
      ) : (
        <img src={item.icon} alt="" className={iconClass} />
      )}
    </span>
    <span className={`flex min-h-6 w-full min-w-0 shrink-0 items-center justify-center gap-1 rounded-md border px-1 py-1 text-[9px] font-bold leading-3 ${locked ? 'border-[#555e57] bg-[#242a25] text-[#a9b2ac]' : 'border-[#287158] bg-[#10291e] text-[#6bffc4]'}`}>{locked && <LockKeyhole aria-hidden="true" className="h-3 w-3 shrink-0" />}<span className="min-w-0 break-words">{status}</span></span>
    <span title={getEquipmentSourceLabel(item,language)} className={`line-clamp-2 w-full min-w-0 break-words text-[9px] leading-3 ${locked ? 'text-[#89938c]' : 'text-[#b9cbb5]'}`}>{detailLabel ?? <EquipmentRarityBadge item={item} language={language}/>}</span>
    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]" style={{backgroundColor:rarity.color}}/>
    {footer && <span className="mt-auto flex w-full items-center justify-center gap-1 border-t border-[#28583d] pt-1 font-mono text-xs font-black text-[#d8f67a]">{footer}</span>}
  </button>;
}

