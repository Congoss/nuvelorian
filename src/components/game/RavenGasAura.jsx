import { useEffect, useRef } from 'react';

let cachedSprites;

// A small sprite emitter: cached smoke textures, no per-frame React updates.
function smokeSprite(tint) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 96;
  const ctx = sprite.getContext('2d');
  for (let i = 0; i < 15; i += 1) {
    const angle = i * 2.399, radius = 10 + i % 4 * 5;
    const x = 48 + Math.cos(angle) * radius, y = 48 + Math.sin(angle) * radius;
    const puff = ctx.createRadialGradient(x, y, 0, x, y, 16 + i % 5 * 2);
    puff.addColorStop(0, 'rgba(' + tint + ',.24)');
    puff.addColorStop(.45, 'rgba(' + tint + ',.12)');
    puff.addColorStop(1, 'rgba(' + tint + ',0)');
    ctx.fillStyle = puff; ctx.fillRect(0, 0, 96, 96);
  }
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i += 1) {
    const x = 25 + (i * 19) % 50, y = 20 + (i * 31) % 57;
    const hole = ctx.createRadialGradient(x, y, 0, x, y, 9);
    hole.addColorStop(0, 'rgba(0,0,0,.5)'); hole.addColorStop(1, 'transparent');
    ctx.fillStyle = hole; ctx.fillRect(0, 0, 96, 96);
  }
  return sprite;
}
export default function RavenGasAura() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d', { alpha: true });
    if (!ctx) return undefined;
    const sprites = cachedSprites ||= ['123,126,138', '182,185,198', '226,228,236'].map(smokeSprite);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, lastFrame = 0, lastStep = 0, visible = true, disposed = false, contextLost = false;
    const makeParticle = (initial = false) => {
      const side = Math.random() < .43 ? -1 : 1;
      const life = 6 + Math.random() * 5;
      return { side, x: side < 0 ? 66 + Math.random() * 60 : 364 + Math.random() * 60,
        y: 260 + Math.random() * 590, life, age: initial ? Math.random() * life : 0,
        speed: (Math.random() < .22 ? -1 : 1) * (10 + Math.random() * 30), phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - .5) * 9, frequency: .35 + Math.random() * .85,
        curl: 12 + Math.random() * 23, wobble: Math.random() * Math.PI * 2,
        size: 62 + Math.random() * 56, rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * .55, alpha: .3 + Math.random() * .36,
        texture: Math.random() < .3 ? 0 : Math.random() < .6 ? 1 : 2 };
    };
    const particles = Array.from({ length: 60 }, () => makeParticle(true));
    const resize = () => {
      const width = Math.max(1, Math.min(500, Math.round(canvas.getBoundingClientRect().width * Math.min(1.5, window.devicePixelRatio || 1))));
      canvas.width = width; canvas.height = Math.round(width * 896 / 500);
      ctx.setTransform(canvas.width / 500, 0, 0, canvas.height / 896, 0, 0);
    };
    const paused = () => contextLost || document.documentElement.dataset.animationsOff === 'true' || document.hidden || !visible || Boolean(canvas.closest('.preview-paused'))
      || (Boolean(canvas.closest('.animated-camp-scene')) && canvas.closest('.game-app')?.dataset.modalOpen === 'true');
    const paint = (dt) => {
      ctx.clearRect(0, 0, 500, 896);
      for (let i = 0; i < particles.length; i += 1) {
        let p = particles[i]; p.age += dt;
        if (p.age >= p.life) p = particles[i] = makeParticle();
        const progress = p.age / p.life;
        const alpha = Math.sin(progress * Math.PI) ** 1.4 * p.alpha;
        const turn = p.phase + p.age * p.frequency;
        const x = p.x + Math.sin(turn) * p.curl
          + Math.sin(p.wobble + p.age * p.frequency * 1.73) * 10
          + Math.tanh(p.age * p.drift / 45) * 20;
        const y = p.y - p.age * p.speed + Math.cos(turn * .83) * p.curl
          + Math.sin(p.wobble + p.age * .71) * 17;
        const size = p.size * (.65 + progress * 1.2);
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rotation + p.age * p.spin + Math.sin(turn) * .25);
        const stretch = 1.12 + Math.sin(turn + p.wobble) * .18;
        ctx.globalAlpha = alpha; ctx.drawImage(sprites[p.texture], -size / 2, -size * stretch / 2, size, size * stretch); ctx.restore();
      }
      ctx.globalAlpha = 1;
    };
    const frame = time => {
      raf = 0; if (disposed || paused() || reduced.matches) return;
      if (time - lastFrame >= 1000 / 24) {
        paint(lastStep ? Math.min(.08, (time - lastStep) / 1000) : 0);
        lastStep = lastFrame = time;
      }
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      if (disposed) return;
      if (paused() || reduced.matches) { cancelAnimationFrame(raf); raf = 0; lastStep = lastFrame = 0; }
      else if (!raf) raf = requestAnimationFrame(frame);
    };
    resize(); paint(0);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { if (!contextLost) { resize(); paint(0); } }); resizeObserver?.observe(canvas);
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); intersection?.observe(canvas);
    const mutation = new MutationObserver(sync);
    // Only ancestors can change whether this aura is paused.
    for (let ancestor = canvas.parentElement; ancestor; ancestor = ancestor.parentElement) {
      mutation.observe(ancestor, { attributes: true, attributeFilter: ['class', 'data-game-hidden', 'data-modal-open', 'data-animations-off'] });
    }
    const loseContext = event => { event.preventDefault(); contextLost = true; sync(); };
    const restoreContext = () => { contextLost = false; resize(); paint(0); sync(); };
    const onResize = () => { if (!contextLost) { resize(); paint(0); } sync(); };
    canvas.addEventListener('contextlost', loseContext);
    canvas.addEventListener('contextrestored', restoreContext);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', sync);
    if (reduced.addEventListener) reduced.addEventListener('change', sync);
    else reduced.addListener?.(sync);
    sync();
    return () => {
      disposed = true; cancelAnimationFrame(raf); resizeObserver?.disconnect(); intersection?.disconnect(); mutation.disconnect();
      canvas.removeEventListener('contextlost', loseContext); canvas.removeEventListener('contextrestored', restoreContext);
      window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', sync);
      if (reduced.removeEventListener) reduced.removeEventListener('change', sync);
      else reduced.removeListener?.(sync);
    };
  }, []);
  return <canvas ref={ref} className="bp-set-layer bp-set-gas-aura" aria-hidden="true" />;
}
