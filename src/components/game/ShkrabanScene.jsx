import { useEffect, useRef } from 'react';
import { useSceneAnimationsEnabled } from '@/lib/animationPreference';
import { createShkrabanScene } from './shkrabanScene.js';

export default function ShkrabanScene({ backgroundOnly = false, hitToken, className = '' }) {
  const canvas = useRef(null);
  const scene = useRef(null);
  const lastHit = useRef(hitToken);
  const active = useSceneAnimationsEnabled(canvas);

  useEffect(() => {
    const current = createShkrabanScene(canvas.current, backgroundOnly);
    scene.current = current;
    if (!current) return;
    const draw = () => current.draw();
    current.images.forEach(image => image.addEventListener('load', draw));
    draw();
    return () => {
      current.images.forEach(image => image.removeEventListener('load', draw));
      scene.current = null;
    };
  }, [backgroundOnly]);

  useEffect(() => {
    if (!active || !scene.current) return;
    const current = scene.current;
    let last = performance.now();
    let request;
    const frame = now => {
      if (now - last >= 30) {
        current.draw(Math.min((now - last) / 1000, .05));
        last = now;
      }
      request = requestAnimationFrame(frame);
    };
    request = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(request);
  }, [active, backgroundOnly]);

  useEffect(() => {
    if (lastHit.current === hitToken) return;
    lastHit.current = hitToken;
    scene.current?.hit(active);
  }, [hitToken, active]);

  return <canvas ref={canvas} width={1024} height={1536}
    className={className} aria-hidden={backgroundOnly}
    aria-label={backgroundOnly ? undefined : 'Шкрябан'} />;
}
