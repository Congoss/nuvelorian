import { useEffect, useRef } from 'react';
import { useAnimationsEnabled } from '@/lib/animationPreference';

const GREEN = { core: '#d9ff35', glow: '#54ff39', deep: '#092b19' };

export default function ProceduralPortalCanvas({ colors = GREEN, className = '', animated = true }) {
  const globallyEnabled = useAnimationsEnabled();
  animated = animated && globallyEnabled;
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!ctx) return undefined;
    let lastTime = 0;
    let raf = 0;
    let lastFrame = 0;
    let visible = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const frameInterval = 1000 / 24;
    const particles = Array.from({ length: 24 }, (_, i) => ({ angle: Math.random() * Math.PI * 2, radius: .48 + Math.random() * .5, speed: .15 + Math.random() * .3, size: 1 + Math.random() * 2, phase: i }));
    const resize = () => { const dpr = Math.min(1.5, window.devicePixelRatio || 1); const box = canvas.getBoundingClientRect(); canvas.width = box.width * dpr; canvas.height = box.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = (time, force = false) => {
      raf = 0;
      if ((!visible || document.hidden || !animated || reduced.matches) && !force) return;
      if (lastFrame && time - lastFrame < frameInterval) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = Math.min(34, lastTime ? time - lastTime : 16.7); lastTime = time;
      lastFrame = time;
      const w = canvas.clientWidth; const h = canvas.clientHeight; const cx = w / 2; const cy = h / 2; const scale = Math.min(w, h); const t = time * .001;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(cx, cy, scale * .08, cx, cy, scale * .8); bg.addColorStop(0, colors.deep); bg.addColorStop(.6, '#07130e'); bg.addColorStop(1, '#020706'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      for (let arm = 0; arm < 7; arm += 1) {
        ctx.beginPath();
        for (let i = 0; i <= 70; i += 1) { const r = scale * (.12 + i / 70 * .62); const a = t * (.22 + arm * .018) + arm * Math.PI * 2 / 7 + i * .12; const x = cx + Math.cos(a) * r; const y = cy + Math.sin(a) * r * .55; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = colors.glow; ctx.globalAlpha = .08 + arm * .012; ctx.lineWidth = scale * (.018 + arm * .002); ctx.shadowBlur = scale * .06; ctx.shadowColor = colors.glow; ctx.stroke();
      }
      ctx.shadowBlur = scale * .12; ctx.shadowColor = colors.glow;
      for (const p of particles) { p.angle += p.speed * dt * .00036; p.radius -= dt * .000034; if (p.radius < .1) p.radius = .9; const r = scale * p.radius; const x = cx + Math.cos(p.angle + t * .1) * r; const y = cy + Math.sin(p.angle + t * .1) * r * .55; ctx.fillStyle = colors.core; ctx.globalAlpha = .35 + Math.sin(t * 2 + p.phase) * .2; ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; const vignette = ctx.createRadialGradient(cx, cy, scale * .08, cx, cy, scale * .75); vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, 'rgba(0,0,0,.62)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
      if (animated && !reduced.matches) raf = requestAnimationFrame(draw);
    };
    const resizeCanvas = () => { resize(); if (!animated || reduced.matches) draw(0, true); };
    const resizeObserver = new ResizeObserver(resizeCanvas); resizeObserver.observe(canvas); resizeCanvas();
    const syncVisibility = () => {
      if (!visible || document.hidden || !animated || reduced.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lastFrame = 0;
        lastTime = 0;
        if (reduced.matches) draw(0, true);
        return;
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && animated;
      if (visible) lastTime = 0;
      syncVisibility();
    }, { threshold: 0.01 });
    visibilityObserver.observe(canvas);
    document.addEventListener('visibilitychange', syncVisibility);
    reduced.addEventListener('change', syncVisibility);
    return () => { cancelAnimationFrame(raf); resizeObserver.disconnect(); visibilityObserver.disconnect(); document.removeEventListener('visibilitychange', syncVisibility); reduced.removeEventListener('change', syncVisibility); };
  }, [colors, animated]);
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
