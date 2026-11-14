import { mergeShipCombatResponse } from './shipCombatResponse.js';

const scenes = new Map();
const listeners = new Map();

export function readShipScene(key, fightId) {
  const scene = scenes.get(key);
  return scene && (!fightId || scene.fight.id === fightId) ? scene : null;
}

export function saveShipScene(key, snapshot) {
  if (!snapshot?.fight?.id) return snapshot;
  const previous = scenes.get(key);
  const next = mergeShipCombatResponse(previous, snapshot);
  scenes.delete(key);
  scenes.set(key, next);
  if (scenes.size > 32) scenes.delete(scenes.keys().next().value);
  for (const listener of listeners.get(key) || []) listener(next);
  return next;
}

export function subscribeShipScene(key, listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(listener);
  return () => {
    listeners.get(key)?.delete(listener);
    if (!listeners.get(key)?.size) listeners.delete(key);
  };
}
