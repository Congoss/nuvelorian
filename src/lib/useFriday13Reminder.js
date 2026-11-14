import { useEffect, useSyncExternalStore } from 'react';
import { isFriday13SaleActive } from './friday13Event.js';
const INTERVAL = 4 * 60 * 60 * 1000;
const entries = new Map();
function entry(id) {
  if (!entries.has(id)) {
    const key = `p4-friday13-reminder-v1:${id}`;
    let last = 0;
    try { last = Number(localStorage.getItem(key) || 0); } catch {}
    const now = Date.now();
    const visible = Boolean(id) && isFriday13SaleActive(now) && now - last >= INTERVAL;
    if (visible) { last = now; try { localStorage.setItem(key, String(last)); } catch {} }
    entries.set(id, { key, last, visible, listeners: new Set() });
  }
  return entries.get(id);
}
function notify(state) { for (const listener of state.listeners) listener(); }
export function useFriday13Reminder(profileId) {
  const id = String(profileId || '');
  const state = entry(id);
  const visible = useSyncExternalStore(listener => { state.listeners.add(listener); return () => state.listeners.delete(listener); }, () => state.visible, () => false);
  useEffect(() => {
    if (!id) return;
    const dismiss = () => { if (state.visible) { state.visible = false; notify(state); } };
    const tick = () => {
      const now = Date.now();
      if (!isFriday13SaleActive(now)) { dismiss(); return; }
      if (now - state.last < INTERVAL) return;
      state.last = now; state.visible = true;
      try { localStorage.setItem(state.key, String(now)); } catch {}
      notify(state);
    };
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('keydown', dismiss, true);
    window.addEventListener('popstate', dismiss);
    const timer = window.setInterval(tick, 60000);
    return () => { document.removeEventListener('pointerdown', dismiss, true); document.removeEventListener('keydown', dismiss, true); window.removeEventListener('popstate', dismiss); window.clearInterval(timer); };
  }, [id, state]);
  return visible;
}
