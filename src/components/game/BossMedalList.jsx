import { useLayoutEffect, useRef, useState } from 'react';
import { bossMedalLayout } from '@/lib/bossMedalLayout';

export default function BossMedalList({ medals, sceneRef, readonly = false, onOpenAwards, rewardReady = false, awardsLabel = 'Awards' }) {
  const listRef = useRef(null);
  const medalOrder = medals.map(medal => medal.bossId).join(',');
  const [layout, setLayout] = useState({ count: 4, size: 60 });
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const measure = () => {
      const bounds = scene.getBoundingClientRect();
      const list = listRef.current;
      if (!list || bounds.height <= 0 || bounds.width <= 0) return;
      const top = list.getBoundingClientRect().top - bounds.top;
      const navSpace = parseFloat(getComputedStyle(scene).getPropertyValue('--bottom-nav-space')) || 0;
      const chat = scene.querySelector('[data-camp-chat-launcher]');
      const bottomInset = Math.max(navSpace, chat ? bounds.bottom - chat.getBoundingClientRect().top : 0);
      const next = bossMedalLayout({ height: bounds.height, width: bounds.width, top, count: medals.length, bottomInset });
      if (next) setLayout(previous => previous.count === next.count && previous.size === next.size ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    const chat = scene.querySelector('[data-camp-chat-launcher]');
    if (chat) observer.observe(chat);
    const mutation = new MutationObserver(measure);
    for (let node = scene; node; node = node.parentElement) mutation.observe(node, {attributes:true,attributeFilter:['style','class']});
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); mutation.disconnect(); window.removeEventListener('resize', measure); };
  }, [sceneRef, readonly, medals.length]);
  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [layout.count, layout.size, medalOrder]);
  return <div className="shrink-0 p-1.5">
    <div ref={listRef} className="overflow-y-auto overscroll-contain touch-pan-y" style={{ height: Math.min(medals.length, layout.count) * layout.size, width: layout.size, scrollSnapType: 'y mandatory', overflowAnchor: 'none' }}>
      {medals.map((medal,index) => <button type="button" onClick={onOpenAwards} aria-label={awardsLabel} key={medal.bossId} className="relative block w-full focus-visible:outline focus-visible:outline-[#b5f761]" style={{ height: layout.size, scrollSnapAlign: 'start' }}><img data-medal-tier={medal.tier} src={medal.src} alt={medal.bossId + '-medal'} className={`block h-full w-full object-contain ${medal.bossId === 'collection' ? 'opacity-40 grayscale' : ''}`} draggable="false" />{!readonly && (medal.rewardReady || (rewardReady && index === 0)) && <span className="absolute right-1 top-2 h-3 w-3 rounded-full border-2 border-[#12291c] bg-[#b5f761] shadow-[0_0_10px_#b5f761] motion-safe:animate-pulse"/>}</button>)}
    </div>
  </div>;
}
