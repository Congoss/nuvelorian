import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gameApi } from '@/services/gameApi';
import bossesIcon from '@/assets/optimized/all/nav/boss-nav.webp';
import questsIcon from '@/assets/optimized/all/nav/quests-nav.webp';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import inventoryIcon from '@/assets/optimized/all/nav/talents-nav.webp';
import clanIcon from '@/assets/optimized/all/nav/clans-nav.webp';
import marketIcon from '@/assets/nav/market-nav.png';

const BOTTOM_TABS = [
  { id: 'boss', icon: bossesIcon },
  { id: 'tasks', icon: questsIcon },
  { id: 'camp', icon: heroIcon },
  { id: 'skills', icon: inventoryIcon },
  { id: 'clan', icon: clanIcon },
  { id: 'market', icon: marketIcon },
];

function NavIcon({ src, active, locked = false, lockLabel = '' }) {
  return (
    <div
      className={cn(
        'relative flex h-[clamp(46px,13vw,66px)] w-[clamp(46px,13vw,66px)] items-center justify-center overflow-visible transition',
        locked ? 'grayscale' : active ? 'brightness-110' : 'opacity-80 grayscale-[0.12]'
      )}
    >
      <img src={src} alt="" aria-hidden="true" className="h-full w-full scale-[1.28] origin-bottom object-contain" />
      {locked && lockLabel ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="rounded-full border border-[#28ee90] bg-[rgba(20,20,20,0.92)] px-2 py-[2px] font-mono text-[10px] font-black uppercase text-[#e9ece7] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
            {lockLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function BottomNav({ activeTab, onTabChange, onTabIntent, language = 'uk', lockedTabs = {}, lockedTabLevels = {}, lightBlur = false, onHeightChange }) {
  const [marketAllowed,setMarketAllowed]=useState(false);
  useEffect(()=>{
    let live=true;
    const refresh=()=>gameApi.marketAccess().then(result=>{if(live)setMarketAllowed(result.allowed===true||result.view===true);}).catch(()=>{if(live)setMarketAllowed(false);});
    void refresh();const timer=setInterval(refresh,30000);
    return()=>{live=false;clearInterval(timer);};
  },[]);
  const navRef = useRef(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || !onHeightChange) return;
    const measure = () => onHeightChange(Math.ceil(nav.getBoundingClientRect().height));
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(nav);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [onHeightChange]);
  const { t } = useTranslation();
  const labels = {
    boss: t('bottom_nav.bosses'),
    tasks: t('bottom_nav.quests'),
    camp: t('bottom_nav.hero'),
    skills: t('bottom_nav.skills'),
    clan: t('bottom_nav.clans'),
    market: language === 'en' ? 'Market' : 'Маркет',
  };

  return (
    <div
      ref={navRef}
      className={`absolute inset-x-0 bottom-0 z-30 bg-transparent px-1 pt-1 shadow-none sm:px-2 sm:pt-2 ${lightBlur ? 'backdrop-blur-[3px]' : 'backdrop-blur-[10px]'}`}
      style={{ paddingBottom: '8px' }}
    >
      <div className={`grid min-w-0 ${marketAllowed ? 'grid-cols-6' : 'grid-cols-5'} items-end gap-0`}>
        {BOTTOM_TABS.filter(tab=>tab.id!=='market'||marketAllowed).map((tab) => {
          const isActive = activeTab === tab.id;
          const locked = Boolean(lockedTabs[tab.id]);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !locked && onTabChange(tab.id)}
              onPointerEnter={() => !locked && onTabIntent?.(tab.id)}
              onPointerDown={() => !locked && onTabIntent?.(tab.id)}
              onFocus={() => !locked && onTabIntent?.(tab.id)}
              data-tutorial-target={tab.id === 'tasks' ? 'quests-nav' : tab.id === 'camp' ? 'home-nav' : tab.id === 'boss' ? 'bosses-nav' : tab.id === 'skills' ? 'skills-nav' : undefined}
              className={`flex min-h-[clamp(66px,18vw,92px)] min-w-0 flex-col items-center justify-end rounded-[14px] px-0.5 pb-0.5 pt-0.5 transition sm:pb-1 sm:pt-1 ${locked ? 'grayscale' : ''}`}
              disabled={locked}
            >
              <NavIcon src={tab.icon} active={isActive} locked={locked} lockLabel={locked ? `lvl ${lockedTabLevels[tab.id] || ''}`.trim() : ''} />
              <span
                className={cn(
                  'relative z-10 mt-1 rounded-[4px] border border-white/10 bg-[rgba(5,9,7,0.82)] px-1.5 py-[3px] font-mono text-[clamp(8px,2.3vw,10px)] font-black leading-none [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]',
                  isActive ? 'text-[#d8f67a]' : 'text-[#e1e8d8]'
                )}
              >
                {labels[tab.id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
