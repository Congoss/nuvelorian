import RaidRewardReceipt from './RaidRewardReceipt';
import { readLocalDossierView, saveLocalDossierView } from '@/lib/localDossierView';
import { useAchievementLanguage } from '@/lib/useAchievementLanguage';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, Trophy, X } from 'lucide-react';
import PlayerAchievements from './PlayerAchievements';
import AvatarWithFrame from './AvatarWithFrame';
import { getPlayerMedalCollection } from '@/lib/playerMedalCollection';
import { BOSS_MEDAL_IMGS, DEFAULT_MEDAL_IMGS } from '@/lib/playerMedalAssets';
import {CHEESE_BOSS_MEDALS, SOLDIER_BOSS_MEDALS, KANGAROO_BOSS_MEDALS, GUM_QUEEN_BOSS_MEDALS} from '@/lib/shipBossMedals';
import collectionBackground from '@/assets/achievements/collection-neutral-v1.webp';
import { ACHIEVEMENT_CAPACITY } from '@/lib/playerAchievements';
import { PLAYER_ACHIEVEMENTS } from '@/lib/playerAchievements';
import BossDossier from './BossDossier';
import { DOSSIER_BOSS_IDS, dossierRewardReady } from '@/lib/bossDossier';
import { AchievementClaimContext } from '@/lib/useAchievementLanguage';

export default function PlayerCollection({ profile, language = 'uk', preview = false, onClose: closeCollection }) {
  const lang = useAchievementLanguage(language, preview);
  const [tab, setTab] = useState('medals');
  const owner = useContext(AchievementClaimContext);
  const ownProfile = Boolean(profile?.id && String(owner?.profile?.id) === String(profile.id));
  const canOpenDossier = ownProfile || preview;
  const dossierViewKey = `p4-open-dossier:${profile?.id}`;
  const [savedDossier, setDossierState] = useState(() => {
    const saved = canOpenDossier && readLocalDossierView(dossierViewKey, false);
    return DOSSIER_BOSS_IDS.includes(saved) ? saved : false;
  });
  const dossier = canOpenDossier && savedDossier;
  function setDossier(value) {
    if (!canOpenDossier) return;
    saveLocalDossierView(dossierViewKey, value);
    setDossierState(value);
  }
  function onClose() {
    if (canOpenDossier) saveLocalDossierView(dossierViewKey, false);
    closeCollection();
  }
  const titleId = useId();
  const root = useRef(null);
  const closeRef = useRef(null);
  const copy = { uk: { title:'Медалі й ачівки', medals:'Медалі', achievements:'Ачівки', wins:'Перемог', locked:'Ще не відкрито', bronze:'Бронза', silver:'Срібло', gold:'Золото', next:'До наступної', close:'Закрити' }, ru: { title:'Медали и достижения', medals:'Медали', achievements:'Достижения', wins:'Побед', locked:'Ещё не открыто', bronze:'Бронза', silver:'Серебро', gold:'Золото', next:'До следующей', close:'Закрыть' }, en: { title:'Medals & achievements', medals:'Medals', achievements:'Achievements', wins:'Wins', locked:'Not unlocked yet', bronze:'Bronze', silver:'Silver', gold:'Gold', next:'Next medal', close:'Close' } }[lang];
  const medals = getPlayerMedalCollection(profile, lang);
  const earned = medals.filter(row => row.tier).length;
  const achievements = PLAYER_ACHIEVEMENTS.filter(item => profile.player_achievements?.[item.id]).length;
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => { if(previous?.isConnected)previous.focus?.(); };
  }, []);
  function switchTab(id) { setTab(id); setDossier(false); }
  return createPortal(<div className="game-app fixed inset-x-0 top-0 z-[240] box-border flex items-center justify-center bg-[#020806]/85 px-2 backdrop-blur-sm" style={{height:'var(--app-viewport-height, 100dvh)',paddingTop:'calc(var(--app-top-offset, var(--app-safe-top, 0px)) + 8px)',paddingBottom:'calc(var(--app-safe-bottom, env(safe-area-inset-bottom, 0px)) + 8px)'}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section ref={root} role="dialog" aria-modal="true" aria-labelledby={dossier ? undefined : titleId} aria-label={dossier ? medals.find(row=>row.id===dossier)?.name : undefined} onKeyDown={event=>{
      if(event.key==='Escape'&&!document.querySelector('[data-achievement-popup]')){event.stopPropagation();if(dossier)setDossier(false);else onClose();}
      if(event.key==='Tab'){
        const buttons=Array.from(root.current.querySelectorAll('button:not(:disabled), [tabindex="0"]'));
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    }} className="game-modal-enter relative isolate flex h-full max-h-[760px] w-full max-w-[510px] flex-col overflow-hidden bg-[#11271f] font-mono text-[#edf8d9] shadow-[0_20px_80px_#000a]">
      <img src={collectionBackground} alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#03110b]/35" />
      {!dossier && <><header className="flex shrink-0 items-center gap-3 bg-[#07150f]/60 px-4 py-4">
        <AvatarWithFrame src={profile.avatar} className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-[#a5c4a4]">{profile.nickname || profile.username || 'Player'}</p><h2 id={titleId} className="mt-1 text-base font-black text-[#ffe5a0]">{canOpenDossier ? copy.title : copy.medals}</h2></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={copy.close} className="flex h-11 w-11 shrink-0 items-center justify-center text-[#d5e9c1] focus-visible:outline focus-visible:outline-[#28ee90]"><X className="h-5 w-5" /></button>
      </header>
      {canOpenDossier && <div className="grid shrink-0 grid-cols-2 gap-2 px-3 pt-3">{[['medals',copy.medals,earned,medals.length,Trophy],['achievements',copy.achievements,achievements,ACHIEVEMENT_CAPACITY,Award]].map(([id,label,count,total,Icon])=><button key={id} type="button" aria-pressed={tab===id} onClick={()=>switchTab(id)} className={`flex min-h-11 items-center justify-center gap-2 px-2 text-[11px] font-black transition ${tab===id?'bg-[#3b5430]/85 text-[#ecedb0] shadow-[inset_0_-2px_0_#a5d66c]':'bg-[#0a1b13]/60 text-[#91ab8b]'}`}><Icon className="h-4 w-4" />{label}<span className="text-[9px] opacity-70">{count}/{total}</span></button>)}</div>}</>}
      <div className={`min-h-0 flex-1 px-3 pb-4 pt-3 ${dossier ? 'overflow-hidden' : 'touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'}`}>
        {!dossier && tab==='medals' && ownProfile && <RaidRewardReceipt profile={{...owner.profile, language:lang}} />}
        {dossier ? <BossDossier key={dossier} bossId={dossier} profile={profile} language={lang} preview={preview} onBack={()=>setDossier(false)}/> : canOpenDossier && tab==='achievements'?<PlayerAchievements profile={profile} language={lang} preview={preview}/>:<div className="grid grid-cols-4 gap-2">{medals.map(row=>{
          const images=row.moduleId==='hull'?CHEESE_BOSS_MEDALS:row.moduleId==='engine'?SOLDIER_BOSS_MEDALS:row.moduleId==='hangar'?KANGAROO_BOSS_MEDALS:row.moduleId==='portal'?GUM_QUEEN_BOSS_MEDALS:BOSS_MEDAL_IMGS[row.id]||DEFAULT_MEDAL_IMGS;
          return <article key={row.id} className="flex min-w-0 flex-col items-center px-0.5 pb-3 pt-2 text-center">
            <button type="button" disabled={!canOpenDossier || !DOSSIER_BOSS_IDS.includes(row.id)} onClick={()=>setDossier(row.id)} aria-label={row.name} className="relative flex aspect-square w-full max-w-[86px] items-center justify-center disabled:cursor-default focus-visible:outline focus-visible:outline-[#b5f761]">
              {row.tier&&<span className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse,#d8cf6533,transparent_70%)]"/>}
              <img data-medal-tier={row.tier||'bronze'} src={images[row.tier||'bronze']} alt={row.tier?copy[row.tier]:copy.locked} className={`relative h-full w-full object-contain ${row.tier?'drop-shadow-[0_4px_5px_#0008]':'opacity-20 grayscale'}`} />
              {DOSSIER_BOSS_IDS.includes(row.id) && ownProfile && !preview && dossierRewardReady(owner.profile, row.id) && <span className="absolute right-0 top-1 h-3 w-3 rounded-full border-2 border-[#12291c] bg-[#b5f761] shadow-[0_0_10px_#b5f761] motion-safe:animate-pulse"/>}
            </button>
            <h3 className="mt-1 min-h-8 text-[11px] font-black leading-tight text-[#e4edcc]">{row.name}</h3>

          </article>;
        })}</div>}
      </div>
    </section>
  </div>,document.body);
}
