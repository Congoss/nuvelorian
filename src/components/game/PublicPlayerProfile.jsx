import { getEquipmentEnhancementLevels, ENHANCEMENT_SLOTS } from '@/lib/equipmentEnhancementPresentation';
import { useState } from 'react';
import profileBackground from '@/assets/ui/player-profile-cartoon-v2.webp';
import { MarkerBorder } from './MarkerFrame';
import GameTextureButton from './GameTextureButton';
import AvatarWithFrame from './AvatarWithFrame';
import { DEFAULT_EQUIPMENT_ITEMS, localizeEquipmentItemName, describeEquipmentBonuses } from './equipmentData';
import { getResourceIcon } from '@/lib/resourceIcons';
import { getPlayerCA, getCARank, getCARankIcon } from '@/lib/caRanks';

export default function PublicPlayerProfile({ profile, language = 'uk', onClose, onGoHome }) {
  const lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'uk';
  const copy = {
    uk: { title: 'Профіль гравця', home: 'До себе', close: 'Закрити', gear: 'Спорядження', level: 'Рівень', power: 'Сила', clan: 'Клан', empty: 'Немає даних про спорядження' },
    ru: { title: 'Профиль игрока', home: 'К себе', close: 'Закрыть', gear: 'Снаряжение', level: 'Уровень', power: 'Сила', clan: 'Клан', empty: 'Нет данных о снаряжении' },
    en: { title: 'Player profile', home: 'My camp', close: 'Close', gear: 'Equipment', level: 'Level', power: 'Power', clan: 'Clan', empty: 'No equipment data' },
  }[lang];
  const items = new Map([...DEFAULT_EQUIPMENT_ITEMS, ...(profile.inventory_items || [])].map(item => [item.id, item]));
  const enhancementLevels = getEquipmentEnhancementLevels(profile);
  const equipped = Object.entries(profile.equipped_items || {}).filter(([, id]) => id);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const selected = items.get(profile.equipped_items?.[selectedSlot] || equipped[0]?.[1]);
  const nickname = profile.nickname || profile.username || 'Player';
  return (
    <section aria-label={copy.title} className="relative isolate flex h-full min-h-0 flex-col overflow-hidden bg-[#14231c] p-[3px] font-mono text-[#edf8d9] shadow-[0_0_18px_#8fdc3729]">
      <img src={profileBackground} alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#05110b]/60" />
      <MarkerBorder />
      <header className="relative shrink-0 border-b border-[#28ee90] bg-[#050b05]/90 p-2 pr-9">
        <div className="flex items-center gap-2">
          <div className="w-12 shrink-0">
            <AvatarWithFrame src={profile.avatar} alt={nickname} roundedClassName="rounded-none" className="h-12 w-12 border border-[#28ee90]" />
            <div aria-label={copy.level} className="mt-1 border border-[#28ee90] bg-[#0b160b] text-center text-[10px] font-black leading-3">{profile.level ?? '—'}</div>
          </div>
          <img src={getCARankIcon(getCARank(getPlayerCA(profile)))} alt="" className="h-10 w-8 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-sm font-black leading-tight text-[#ffdf70]">{nickname}</h2>
            <p className="mt-1 break-words text-[8px] font-black uppercase text-[#b6d88b]">{profile.clan_name || '—'}</p>
          </div>
          <div aria-label={copy.power} className="relative ml-1 shrink-0 border border-[#28ee90] bg-[#091008] py-0.5 pl-4 pr-1 text-[11px] font-black tabular-nums text-[#ffe58a]">
            <img src={getResourceIcon('strength')} alt="" className="absolute -left-3 top-1/2 h-7 w-7 -translate-y-1/2 object-contain" />
            {Number(getPlayerCA(profile)).toLocaleString('en-US')}
          </div>
        </div>
        <button type="button" aria-label={copy.close} onClick={onClose} className="absolute right-0 top-0 flex h-9 w-8 items-center justify-center text-xl text-[#dfff9c] hover:text-white focus-visible:outline focus-visible:outline-[#28ee90]">×</button>
      </header>
      <div className="relative min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain p-3 [scrollbar-color:#28ee90_#071006] [-webkit-overflow-scrolling:touch]">
        <div className="mb-2 flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#dfff9c]">{copy.gear}</h3>
          <span className="h-px flex-1 bg-[#28ee90]/30" />
          <span className="text-xs tabular-nums text-[#93b765]">{equipped.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {equipped.map(([slot, id]) => {
            const item = items.get(id);
            const active = (selectedSlot || equipped[0]?.[0]) === slot;
            const name = item ? localizeEquipmentItemName(item, lang) : id;
            return <button type="button" key={slot} aria-label={name} aria-pressed={active} onClick={() => setSelectedSlot(slot)} className={`relative flex min-h-[104px] min-w-0 flex-col items-center justify-between border bg-[#0b1b12]/60 px-1 py-2 transition ${active ? 'border-[#e5d274] bg-[#35442a]/65 shadow-[inset_0_0_22px_#d0cf3820,0_0_10px_#e5d27422]' : 'border-[#28ee90]/50 hover:bg-[#17331b]/80'}`}>
              {ENHANCEMENT_SLOTS.includes(slot) && <span className="absolute right-0.5 top-0.5 z-10 border border-[#d4f08a]/50 bg-[#15230e]/95 px-1 text-[10px] font-black leading-4 text-[#e5f6aa]">+{enhancementLevels[id] || 0}</span>}
              <div className="flex h-[62px] w-full items-center justify-center bg-[radial-gradient(ellipse,#a8d77d20,transparent_68%)]">
                {item?.icon && <img src={item.icon} alt="" className="h-[60px] w-full object-contain drop-shadow-[0_5px_5px_#0009]" />}
              </div>
              <span className="mt-1 line-clamp-2 w-full break-words text-center text-[8px] font-black uppercase leading-snug text-[#edf8d9]">{name}</span>
            </button>;
          })}
        </div>
        {selected && <article className="mt-2 border border-[#28ee90]/60 bg-[#102017]/80 p-3">
          <h4 className="text-xs font-black uppercase text-[#ffdf70]">{localizeEquipmentItemName(selected, lang)}{ENHANCEMENT_SLOTS.includes(selected.slot) ? ` +${enhancementLevels[selected.id] || 0}` : ''}</h4>
          <ul className="mt-2 grid gap-1 text-[11px] text-[#d1e4bf] sm:grid-cols-2">{describeEquipmentBonuses(selected, lang).map((bonus, index) => <li key={index}>{bonus}</li>)}</ul>
        </article>}
        {!equipped.length && <p className="border border-dashed border-[#28ee90]/50 p-6 text-center text-sm text-[#93b765]">{copy.empty}</p>}
      </div>
      <footer className="relative shrink-0 border-t border-[#28ee90]/50 bg-[#081108]/80 p-2">
        <GameTextureButton type="button" onClick={onGoHome} tone="green" className="h-11 w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#28ee90]"><span className="relative z-10 text-xs font-black uppercase text-[#17220e]">{copy.home}</span></GameTextureButton>
      </footer>
    </section>
  );
}
