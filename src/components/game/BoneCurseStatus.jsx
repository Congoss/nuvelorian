import { effectDialogClass, effectCloseClass } from './combatEffectStyles';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import icon from '@/assets/buffs/bone-curse-v2.webp';
import { SKELETON_BP_CURSE as curse } from '@/lib/skeletonBattlePassSet';

export default function BoneCurseStatus({ state, language = 'uk' }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state?.expiresAt, state?.cooldownUntil]);
  useEffect(() => {
    if (!open) return undefined;
    const close = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  const active = Number(state?.expiresAt || 0) > now;
  const remaining = Math.max(0, Math.ceil(((active ? state.expiresAt : state?.cooldownUntil || 0) - now) / 1000));
  const text = language === 'en' ? {
    title: 'Bone Curse', active: 'ACTIVE', cooldown: 'COOLDOWN', ready: 'READY', close: 'Close',
    rules: ['Requires all 6 Skeleton set pieces.', `${curse.chance * 100}% chance on a poison hit.`, `Your poisons deal +${curse.poisonDamageBonusPct * 100}% damage for ${curse.durationSeconds} seconds.`, 'Cooldown: 1 hour after the effect ends.', 'Does not stack or refresh. Switching bosses or equipment does not reset the timer.'],
  } : language === 'ru' ? {
    title: 'Костяное проклятие', active: 'ДЕЙСТВУЕТ', cooldown: 'ПЕРЕЗАРЯДКА', ready: 'ГОТОВО', close: 'Закрыть',
    rules: ['Нужны все 6 предметов скелетного сета.', '5% шанс при попадании ядом.', 'Твои яды наносят +10% урона на протяжении 60 секунд.', 'Перезарядка: 1 час после окончания эффекта.', 'Не складывается и не продлевается. Смена босса или экипировки не сбрасывает таймер.'],
  } : {
    title: 'Кістяне прокляття', active: 'ДІЄ', cooldown: 'ПЕРЕЗАРЯДКА', ready: 'ГОТОВО', close: 'Закрити',
    rules: ['Потрібні всі 6 предметів скелетного сету.', '5% шанс при влучанні отрутою.', 'Твої отрути завдають +10% шкоди протягом 60 секунд.', 'Перезарядка: 1 година після завершення ефекту.', 'Не складається й не подовжується. Зміна боса чи спорядження не скидає таймер.'],
  };
  const time = active ? `${remaining}${language === 'en' ? 's' : language === 'ru' ? 'с' : 'с'}` : remaining ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : '—';
  return <>
    <button type="button" title={text.title} aria-label={text.title} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className="flex items-center gap-1 font-mono text-[11px] font-black text-[#afffe3]">
      <img src={icon} alt="" className={`h-9 w-9 rounded object-contain ${active ? 'drop-shadow-[0_0_5px_#41d5b6]' : 'opacity-55 grayscale'}`} /><span>{active ? `+10% · ${time}` : time}</span>
    </button>
    {open && createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black/80 p-3 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="bone-curse-title" className={effectDialogClass} onClick={event => event.stopPropagation()}>
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 id="bone-curse-title" className="font-sans text-base font-black uppercase">{text.title}</h2>
            <button autoFocus type="button" aria-label={text.close} onClick={() => setOpen(false)} className="rounded p-1 text-[#73f2ae]"><X className="h-5 w-5" /></button>
          </header>
          <div className="rounded-lg bg-black/25 p-3">
            <div className="flex items-center gap-2"><img src={icon} alt="" className="h-9 w-9 rounded object-contain" /><p className="text-sm font-black">{active ? `${text.active} · +10% · ${time}` : remaining ? `${text.cooldown} · ${time}` : text.ready}</p></div>
            {text.rules.map(line => <p key={line} className="mt-2 text-xs leading-snug">{line}</p>)}
          </div>
          <button type="button" onClick={() => setOpen(false)} className={effectCloseClass}>{text.close}</button>
        </section>
      </div>, document.body)}

  </>;
}
