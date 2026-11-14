import { useEffect, useState, useSyncExternalStore } from 'react';

const key = 'game-animations';
const event = 'game-animations-change';
function enabled() {
  try { return localStorage.getItem(key) !== 'off'; } catch { return true; }
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
    const syncVideos = () => document.querySelectorAll('video[autoplay]').forEach(video => {
      if (!active || document.hidden) video.pause();
      else if (video.paused) video.play().catch(() => {});
    });
    syncVideos();
    const onPlay = e => { if ((!active || document.hidden) && e.target instanceof HTMLVideoElement && e.target.autoplay) e.target.pause(); };
    document.addEventListener('play', onPlay, true);
    document.addEventListener('visibilitychange', syncVideos);
    return () => {
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('visibilitychange', syncVideos);
    };
  }, [active]);
  return active;
}
