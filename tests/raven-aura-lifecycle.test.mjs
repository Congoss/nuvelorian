import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/components/game/RavenGasAura.jsx', 'utf8');
const effect = source.slice(source.indexOf('    const canvas = ref.current'), source.indexOf('\n  }, []);'));
function setup({ legacy = false, modal = false, camp = false } = {}) {
  const target = () => {
    const listeners = new Map();
    return {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
      emit: (name, event = {}) => listeners.get(name)?.(event),
      listeners,
    };
  };
  let paints = 0, sequence = 0, mediaChange;
  const frames = new Map();
  const ctx = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => { if (key === 'clearRect') paints++; } });
  const html = { dataset: {}, parentElement: null };
  const canvas = { ...target(), parentElement: html, getContext: () => ctx, getBoundingClientRect: () => ({ width: 340 }), closest: selector => selector === '.game-app' ? { dataset: { modalOpen: String(modal) } } : selector === '.animated-camp-scene' && camp ? {} : null };
  const document = { ...target(), hidden: false, documentElement: html, createElement: () => ({ getContext: () => ctx }) };
  const media = { matches: false };
  if (legacy) { media.addListener = fn => { mediaChange = fn; }; media.removeListener = () => { mediaChange = null; }; }
  else { media.addEventListener = (_, fn) => { mediaChange = fn; }; media.removeEventListener = () => { mediaChange = null; }; }
  const window = { ...target(), devicePixelRatio: 1, matchMedia: () => media };
  const context = vm.createContext({ ref: { current: canvas }, document, window, cachedSprites: undefined, MutationObserver: class { observe() {} disconnect() {} }, requestAnimationFrame: fn => { frames.set(++sequence, fn); return sequence; }, cancelAnimationFrame: id => frames.delete(id) });
  const cleanup = vm.runInContext(`(() => { function smokeSprite(){return {}}; ${effect} })()`, context);
  const step = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(1000)); };
  return { canvas, document, media, frames, cleanup, step, paints: () => paints, mediaChange: () => mediaChange?.() };
}

test('legacy WebViews animate without observer APIs or modern media listeners', () => {
  const aura = setup({ legacy: true });
  assert.equal(aura.frames.size, 1);
  const before = aura.paints(); aura.step(); assert(aura.paints() > before);
  aura.media.matches = true; aura.mediaChange(); assert.equal(aura.frames.size, 0);
  aura.media.matches = false; aura.mediaChange(); assert.equal(aura.frames.size, 1);
  aura.cleanup(); assert.equal(aura.frames.size, 0); assert.equal(aura.canvas.listeners.size, 0);
});

test('canvas context restoration restarts the aura and hidden tabs resume safely', () => {
  const aura = setup(); let prevented = false;
  aura.canvas.emit('contextlost', { preventDefault() { prevented = true; } });
  assert(prevented); assert.equal(aura.frames.size, 0);
  aura.canvas.emit('contextrestored'); assert.equal(aura.frames.size, 1);
  aura.document.hidden = true; aura.document.emit('visibilitychange'); assert.equal(aura.frames.size, 0);
  aura.document.hidden = false; aura.document.emit('visibilitychange'); assert.equal(aura.frames.size, 1);
  aura.cleanup();
});

test('an equipment preview animates inside a modal while the covered camp stays paused', () => {
  const preview = setup({ modal: true }); assert.equal(preview.frames.size, 1); preview.cleanup();
  const camp = setup({ modal: true, camp: true }); assert.equal(camp.frames.size, 0); camp.cleanup();
});
