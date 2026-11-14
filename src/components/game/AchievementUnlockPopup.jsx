import { useAchievementLanguage, AchievementClaimContext } from '@/lib/useAchievementLanguage';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift } from 'lucide-react';
import AchievementBadge from './AchievementBadge';
import popupBackground from '@/assets/achievements/unlock-neutral-v1.webp';
import { getResourceIcon } from '@/lib/resourceIcons';
import { PLAYER_ACHIEVEMENTS, ACHIEVEMENT_REWARDS } from '@/lib/playerAchievements';

const REWARD_ICONS = { smallPoison: getResourceIcon('small-poison'), mediumPoison: getResourceIcon('medium-poison'), largePoison: getResourceIcon('large-poison'), spins: getResourceIcon('spins') };
const REWARD_LABELS = { uk: {smallPoison:'Мала отрута',mediumPoison:'Середня отрута',largePoison:'Фляга з отрутою',spins:'Оберти'}, ru: {smallPoison:'Малый яд',mediumPoison:'Средний яд',largePoison:'Фляга с ядом',spins:'Вращения'}, en: {smallPoison:'Small poison',mediumPoison:'Medium poison',largePoison:'Poison flask',spins:'Spins'} };
export default function AchievementUnlockPopup({ id, language = 'uk', onClose, preview = false, post = false, discovery = true, rewards, ownerId, rewardStatus }) {
  const lang = useAchievementLanguage(language, preview);
  const owner = useContext(AchievementClaimContext);
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(false);
  const isOwner = Boolean(ownerId && String(owner?.profile?.id) === String(ownerId));
  const status = isOwner ? owner.profile.player_achievements?.[id]?.reward_status : rewardStatus;
  const canClaim = !claimed && (preview ? discovery : isOwner && status === 'pending');
  const actions = {uk:{claim:'Забрати',busy:'Отримуємо…',pending:'Нагорода чекає на отримання',received:'Нагороду отримано',view:'Одноразова нагорода',error:'Не вдалося отримати. Спробуй ще раз.'},ru:{claim:'Забрать',busy:'Получаем…',pending:'Награда ожидает получения',received:'Награда получена',view:'Разовая награда',error:'Не удалось получить. Попробуй ещё раз.'},en:{claim:'Claim',busy:'Claiming…',pending:'Reward ready to claim',received:'Reward claimed',view:'One-time reward',error:'Could not claim. Please try again.'}}[lang];
  async function handleAction(){
    if(!canClaim){onClose();return;}
    if(busy)return;setBusy(true);setError(false);
    try{if(!preview)await owner.claim(id);setClaimed(true);if(!preview)onClose();}
    catch{setError(true);}finally{setBusy(false);}
  }
  const item = PLAYER_ACHIEVEMENTS.find(item => item.id === id);
  const pack = rewards || ACHIEVEMENT_REWARDS[id] || {};
  const titleId = useId();
  const root = useRef(null);
  const close = useRef(null);
  const copy = { uk: ['Ачівку відкрито!', 'Ачівка', 'Нагорода', 'Одноразова нагорода', 'Закрити', 'Закрити'], ru: ['Достижение открыто!', 'Достижение', 'Награда', 'Разовая награда', 'Закрыть', 'Закрыть'], en: ['Achievement unlocked!', 'Achievement', 'Reward', 'One-time reward', 'Close', 'Close'] }[lang];
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    return () => { if (previous?.isConnected) previous.focus?.(); };
  }, [id]);
  if (!item) return null;
  return createPortal(<div className="game-app fixed inset-x-0 top-0 z-[300] box-border flex items-center justify-center bg-[#020805]/90 px-4 backdrop-blur-sm" style={{height:'var(--app-viewport-height, 100dvh)',paddingTop:'calc(var(--app-top-offset, var(--app-safe-top, 0px)) + 12px)',paddingBottom:'calc(var(--app-safe-bottom, env(safe-area-inset-bottom, 0px)) + 12px)'}} onClick={event => { if(event.target===event.currentTarget)onClose(); }}>
    <div ref={root} data-achievement-popup="true" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={event => {
      if(event.key==='Escape'){event.stopPropagation();onClose();}
      if(event.key==='Tab'){
        const buttons=Array.from(root.current.querySelectorAll('button'));
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    }} className="game-modal-enter relative isolate max-h-full w-full max-w-[400px] overflow-x-hidden overflow-y-auto bg-[#0b211c] p-5 text-center font-mono text-[#edf8d9] shadow-[0_0_55px_#22d6b51f]">
      <img src={popupBackground} alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#05100c]/25" />
      <button ref={close} type="button" aria-label={copy[5]} onClick={onClose} className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center text-[#b4d69d] focus-visible:outline focus-visible:outline-[#28ee90]"><X className="h-5 w-5" /></button>
      <p className="relative mt-2 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-[#54e0c8]">{discovery ? copy[0] : copy[1]}</p>
      <div className="relative mx-auto mb-5 mt-7 h-[clamp(130px,25dvh,210px)] w-[clamp(130px,25dvh,210px)]"><AchievementBadge id={id} animated /></div>
      <h2 id={titleId} className="relative text-xl font-black leading-tight text-[#ffe49b]">{item[lang][0]}</h2>
      <p className="relative mt-3 text-[11px] leading-relaxed text-[#b9cbb5]">{item[lang][1]}</p>
      <div className="relative mt-6 px-1 py-3">
        <p className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider text-[#8bc7ab]"><Gift className="h-3.5 w-3.5" />{copy[2]}</p>
        <div className="mt-4 flex justify-center gap-2">{Object.entries(pack).filter(([,amount])=>amount>0).map(([key,amount])=><div key={key} className="min-w-0 max-w-[85px] flex-1 px-0.5 py-2"><img src={REWARD_ICONS[key]} alt="" className="mx-auto h-14 w-14 object-contain drop-shadow-[0_4px_6px_#0008]"/><p className="mt-1 text-base font-black text-[#ffe49b]">×{amount}</p><p className="mt-1 text-[8px] text-[#a9c399]">{REWARD_LABELS[lang][key]}</p></div>)}</div>
        {!(preview && post) && <p className="mt-3 text-[8px] text-[#839987]">{preview ? ({uk:'Тестовий перегляд · ресурси не видаються',ru:'Тестовый просмотр · ресурсы не выдаются',en:'Preview · no resources granted'})[lang] : (canClaim ? actions.pending : isOwner || claimed ? actions.received : actions.view)}</p>}
      </div>
      {error && <p role="alert" className="relative mt-2 text-xs text-[#ffb29b]">{actions.error}</p>}
      <button type="button" disabled={busy} onClick={handleAction} className="relative mt-5 h-11 w-full bg-[#a3ce35] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><span className="relative z-10 text-xs font-black uppercase text-[#14230d]">{busy ? actions.busy : canClaim ? actions.claim : copy[4]}</span></button>
    </div>
  </div>,document.body);
}
