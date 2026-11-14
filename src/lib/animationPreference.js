import { useEffect, useState, useSyncExternalStore } from 'react';
import {observeAutoplayVideos} from './videoVisibility.js';

const key = 'game-animations';
const event = 'game-animations-change';
// Low-memory Android WebViews lose GPU surfaces when many hero effects run at
// once (white screen). Default those devices to static art; a player can still
// turn animations on in settings, and an explicit choice always wins.
function lowMemoryAndroid() {
  try {
    const android = /Android/i.test(navigator.userAgent) || String(window.Telegram?.WebApp?.platform || '').toLowerCase().includes('android');
    const memory = Number(navigator.deviceMemory || 0);
    return android && memory > 0 && memory <= 2;
  } catch { return false; }
}
function enabled() {
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'off') return false;
    if (stored === 'on') return true;
  } catch { /* storage can be unavailable in private WebViews */ }
  return !lowMemoryAndroid();
}
function subscribe(listener) {
  window.addEventListener(event, listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener(event, listener); window.removeEventListener('storage', listener); };
}
export function setAnimationsEnabled(value) {
  try { localStorage.setItem(key, value ? 'on' : 'off'); } catch {}
  window.dispatchEvent(new Event(event));
}
export function useAnimationsEnabled() {
  return useSyncExternalStore(subscribe, enabled, () => true);
}

// CSS pausing alone does not stop JavaScript animation timers or canvas work.
export function useSceneAnimationsEnabled(root) {
  const preference = useAnimationsEnabled();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let inView = typeof IntersectionObserver === 'undefined';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setVisible(inView && !document.hidden && !reduced.matches
      && document.documentElement.dataset.gameHidden !== 'true'
      && !root.current?.closest('.preview-paused')
      && root.current?.closest('.game-app')?.dataset.modalOpen !== 'true');
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    if (root.current) intersection?.observe(root.current);
    const mutation = new MutationObserver(sync);
    for (let node = root.current?.parentElement; node; node = node.parentElement) mutation.observe(node, { attributes: true, attributeFilter: ['class', 'data-modal-open', 'data-game-hidden'] });
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    sync();
    return () => { intersection?.disconnect(); mutation.disconnect(); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); };
  }, [root]);
  return preference && visible;
}
export function useGlobalAnimations() {
  const active = useAnimationsEnabled();
  useEffect(() => {
    document.documentElement.dataset.animationsOff = String(!active);
    return observeAutoplayVideos(window,{enabled:active});
  }, [active]);
  return active;
}
