import { useEffect, useId, useRef } from 'react';
import { advanceToasterAnimation, hideToasterBread, newToasterAnimation, toasterBreadPose } from '@/lib/toasterPetAnimation';
import { SHKRABAN_ROOT } from '@/lib/shkrabanContent';

const root = `${SHKRABAN_ROOT}/toaster-layers/`;
// Measure alpha bounds without changing any generated bitmap. Each layer is
// positioned independently in this rig; feet remain fixed to the ground.
function Art({ name, box, x, y, width, height }) {
  const sizes = name === 'legs' ? [1774, 887] : name === 'lever' ? [1536, 1024] : [1374, 1145];
  return <svg x={x} y={y} width={width} height={height} viewBox={box.join(' ')} preserveAspectRatio="none" overflow="hidden" pointerEvents="none"><image href={`${root}${name}.webp`} width={sizes[0]} height={sizes[1]} /></svg>;
}

export default function LocalToasterPet({ active = true }) {
  const id = useId().replace(/:/g, '');
  const body = useRef(null), feet = useRef(null), bread = useRef(null), lever = useRef(null), eyes = useRef(null), steam = useRef(null);
  const lifecycle = useRef(newToasterAnimation()), clock = useRef(0), paint = useRef(() => {});
  useEffect(() => {
    let raf = 0, last = null;
    paint.current = () => {
      const t = clock.current / 1000, pose = toasterBreadPose(lifecycle.current);
      const crouch = (1 + Math.sin(t * 2.8)) * 2.3 + pose.recoil;
      body.current?.setAttribute('transform', `translate(0 ${crouch})`);
      feet.current?.setAttribute('transform', `translate(0 277) scale(1 ${1 - crouch / 48}) translate(0 -277)`);
      const face = Math.cos(pose.rotation * Math.PI / 180);
      const thickness = Math.abs(face) < .055 ? (face < 0 ? -.055 : .055) : face;
      bread.current?.setAttribute('transform', `translate(0 ${pose.y}) rotate(${pose.tilt || 0} 125 100) translate(125 100) scale(${thickness} 1) translate(-125 -100)`);
      bread.current?.setAttribute('style', `filter:brightness(${face < 0 ? .6 : 1})`);
      lever.current?.setAttribute('transform', `translate(0 ${pose.lever * 43})`);
      eyes.current?.setAttribute('opacity', String(pose.heat * (.75 + Math.sin(t * 3.3) * .15)));
      steam.current?.setAttribute('opacity', String(pose.heat * (.17 + Math.sin(t * 1.8) * .035)));
      steam.current?.setAttribute('transform', `translate(${Math.sin(t * 1.3) * 2} ${-2 - Math.sin(t * 1.8) * 2}) skewX(${Math.sin(t * 1.6) * 4})`);
    };
    const frame = now => {
      const running = active && !document.hidden;
      if (running && last !== null) {
        const delta = Math.min(now - last, 100);
        clock.current += delta;
        lifecycle.current = advanceToasterAnimation(lifecycle.current, delta);
      }
      last = running ? now : null;
      paint.current();
      if (active) raf = requestAnimationFrame(frame);
    };
    paint.current();
    if (active) raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); paint.current = () => {}; };
  }, [active]);
  const hide = () => { lifecycle.current = hideToasterBread(lifecycle.current); if (!active) lifecycle.current = advanceToasterAnimation(lifecycle.current, 440); paint.current(); };
  return <svg x="310" y="630" width="220" height="265" viewBox="0 0 260 300" overflow="visible" role="button" tabIndex="0" aria-label="Тостер-привид: натисніть, щоб сховати тост на 30–60 секунд" className="local-toaster-pet" onClick={event => { event.stopPropagation(); hide(); }} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); hide(); } }}>
    <defs>
      <clipPath id={`${id}-bread`}><path d="M20 -50H230V137L54 125H20Z" /></clipPath>
      <radialGradient id={`${id}-eyes`}><stop offset="0" stopColor="#fffbd0"/><stop offset=".32" stopColor="#fff078"/><stop offset=".6" stopColor="#ffc12c" stopOpacity=".9"/><stop offset="1" stopColor="#ff9b11" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="260" height="300" fill="transparent" />
    <g ref={feet}><Art name="legs" box={[218, 315, 360, 353]} x="46" y="232" width="45" height="44"/><Art name="legs" box={[1187, 311, 349, 370]} x="157" y="232" width="44" height="46"/></g>
    <g ref={body}>
      <Art name="body-no-lever" box={[111, 215, 1185, 812]} x="15" y="110" width="225" height="154.18"/>
      <g ref={steam} opacity=".17" pointerEvents="none" style={{ filter: 'saturate(.25)' }}><Art name="smoke" box={[253, 105, 828, 946]} x="100" y="68" width="34" height="58"/><Art name="smoke" box={[253, 105, 828, 946]} x="133" y="87" width="22" height="41"/></g>
      <g clipPath={`url(#${id}-bread)`}><g ref={bread} transform="translate(0 100)"><Art name="bread" box={[265, 105, 842, 922]} x="84" y="55" width="82" height="90"/></g></g>
      <g ref={lever} transform="translate(0 43)"><Art name="lever" box={[412, 346, 710, 330]} x="170" y="152" width="31" height="14.4"/></g>
      <g ref={eyes} opacity=".8" pointerEvents="none"><ellipse cx="65" cy="174" rx="15" ry="18" fill={`url(#${id}-eyes)`}/><ellipse cx="114" cy="176" rx="16" ry="19" fill={`url(#${id}-eyes)`}/></g>
    </g>
  </svg>;
}
