import CombatLoader from './CombatLoader';
import { useLayoutEffect, useRef, useState } from 'react';

export default function AssetStage({ assetKey, className = '', blocking = true, children }) {
  const rootRef = useRef(null);
  const [readyKey, setReadyKey] = useState(null);
  const ready = readyKey === assetKey;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const reveal = () => { if (!cancelled) setReadyKey(assetKey); };
    // Embedded scenes own their initial picture; decorative layers never gate combat.
    const primary = root.querySelector('[data-scene-primary]') || root.querySelector('img, video');
    if (root.querySelector('iframe') || !primary) { reveal(); return; }
    const image = primary instanceof HTMLImageElement;
    if (image ? primary.complete : primary.readyState >= 2) { reveal(); return; }
    const events = ['load', 'error', 'loadeddata'];
    events.forEach(name => primary.addEventListener(name, reveal));
    const deadline = setTimeout(reveal, 800);
    return () => {
      cancelled = true; clearTimeout(deadline);
      events.forEach(name => primary.removeEventListener(name, reveal));
    };
  }, [assetKey]);
  return <div ref={rootRef} className={`relative ${className}`}>
    <div className={`h-full transition-opacity duration-150 ${ready || !blocking ? 'opacity-100' : 'opacity-0'}`}>{children}</div>
    {!ready && <div className={blocking ? 'absolute inset-0 z-30 flex items-center justify-center bg-[#070a06]' : 'pointer-events-none absolute right-3 top-3 z-30 rounded-full bg-black/50 p-2'} aria-label="Loading scene" role="status"><CombatLoader/></div>}
  </div>;
}
