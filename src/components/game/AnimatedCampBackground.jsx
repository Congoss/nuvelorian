import { useEffect, useState } from 'react';
import boss1Base from '@/assets/boss/boss_1/boss1_bck/background.png';
import boss1Star from '@/assets/boss/boss_1/boss1_bck/STAR.png';
import boss1Meteors from '@/assets/boss/boss_1/boss1_bck/METEORS.png';
import boss1BlueMonitors from '@/assets/boss/boss_1/boss1_bck/BLUE MONITORS.png';
import boss1RedMonitor from '@/assets/boss/boss_1/boss1_bck/RED MONITOR.png';
import boss1RedLights from '@/assets/boss/boss_1/boss1_bck/LENTA RED LIGHT.png';
import boss1TopLight from '@/assets/boss/boss_1/boss1_bck/LIGHT RED TOP.png';
import boss2Base from '@/assets/boss/boss_1/boss1_bck/background_b2.png';
import boss2Chameleon from '@/assets/boss/boss_1/boss1_bck/hameleon.png';
import boss2OutColours from '@/assets/boss/boss_1/boss1_bck/out colours.png';
import boss2Point from '@/assets/boss/boss_1/boss1_bck/point.png';
import boss2Rainbow from '@/assets/boss/boss_1/boss1_bck/rainbow.png';
import boss2Smoke from '@/assets/boss/boss_1/boss1_bck/smoke.png';
import boss2SmokeTwo from '@/assets/boss/boss_1/boss1_bck/smoke2.png';
import shorkBase from '@/assets/optimized/all/boss/boss_1/boss1_bck/background3.webp';
import shorkBigPlanet from '@/assets/optimized/all/boss/boss_1/boss1_bck/bigplanet.webp';
import shorkMiniPlanet from '@/assets/optimized/all/boss/boss_1/boss1_bck/miniplanet.webp';
import shorkCrane from '@/assets/optimized/all/boss/boss_1/boss1_bck/kran3.webp';
import shorkLightboard from '@/assets/optimized/all/boss/boss_1/boss1_bck/lightboard.webp';
import shorkScreen from '@/assets/optimized/all/boss/boss_1/boss1_bck/ekran.webp';
import shorkLamp from '@/assets/optimized/all/boss/boss_1/boss1_bck/1lamp.webp';
import shorkEye from '@/assets/optimized/all/boss/boss_1/boss1_bck/glaz.webp';
import shorkSlime from '@/assets/optimized/all/boss/boss_1/boss1_bck/slyz3.webp';
import wormBase from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/background4.webp';
import wormEye from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/eye fon.webp';
import wormPupil from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/zrachok.webp';
import wormBlinkEye from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/eye-3 92484d.webp';
import wormPendulumEye from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/eye-3 mayatnic.webp';
import wormWheel from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/koleso.webp';
import wormRedLamp from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/redlamp.webp';
import wormCone from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/shashka.webp';
import wormCow from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/cow4.webp';
import wormSlime from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/slyz big.webp';
import wormWaterfall from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/vodopad.webp';
import sporgolBase from '@/assets/optimized/all/boss/boss_1/boss1_bck/background5.webp';
import sporgolMoon from '@/assets/optimized/all/boss/boss_1/boss1_bck/planet moon.webp';
import sporgolPlanets from '@/assets/optimized/all/boss/boss_1/boss1_bck/planety.webp';
import sporgolMushroom from '@/assets/optimized/all/boss/boss_1/boss1_bck/gryb.webp';
import sporgolHand from '@/assets/optimized/all/boss/boss_1/boss1_bck/fak.webp';
import sporgolEye from '@/assets/optimized/all/boss/boss_1/boss1_bck/oko51.webp';
import sporgolPupil from '@/assets/optimized/all/boss/boss_1/boss1_bck/zrachok51.webp';
import suckholeBase from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/background-kosmo.webp';
import suckholeBlackHole from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/black hole.webp';
import suckholeTentacle from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/shchupalcya.webp';
import suckholeToiletPaper from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/tual bumaga.webp';

const CHAMELEON_FILTERS = [
  'sepia(.92) hue-rotate(68deg) saturate(2.4) brightness(1.05)',
  'sepia(.44) hue-rotate(142deg) saturate(2.45) brightness(1.04)',
  'sepia(.68) hue-rotate(184deg) saturate(2.35) brightness(1.03)',
  'sepia(.78) hue-rotate(226deg) saturate(2.5) brightness(1.05)',
  'sepia(.86) hue-rotate(286deg) saturate(2.45) brightness(1.06)',
  'sepia(.95) hue-rotate(332deg) saturate(2.4) brightness(1.08)',
];

function BossOneRoomScene() {
  return (
    <div className="animated-camp-scene" aria-hidden="true">
      <img src={boss1Base} alt="" className="animated-camp-layer" />
      <div className="animated-camp-window">
        <img src={boss1Star} alt="" className="animated-camp-layer animated-camp-star" />
        <img src={boss1Meteors} alt="" className="animated-camp-layer animated-camp-meteors" />
      </div>
      <img src={boss1BlueMonitors} alt="" className="animated-camp-layer animated-camp-blue" />
      <img src={boss1RedMonitor} alt="" className="animated-camp-layer animated-camp-red-monitor" />
      <img src={boss1RedLights} alt="" className="animated-camp-layer animated-camp-red-lights" />
      <img src={boss1TopLight} alt="" className="animated-camp-layer animated-camp-top-light" />
      <SceneStyles />
    </div>
  );
}

function BossTwoRoomScene() {
  const [chameleonFilter, setChameleonFilter] = useState('');
  const [rainbowActive, setRainbowActive] = useState(false);

  useEffect(() => {
    let timer;
    let alive = true;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        setChameleonFilter(CHAMELEON_FILTERS[Math.floor(Math.random() * CHAMELEON_FILTERS.length)]);
        timer = setTimeout(() => {
          if (!alive) return;
          setChameleonFilter('');
          schedule();
        }, 1500 + Math.random() * 850);
      }, 3600 + Math.random() * 5200);
    };
    schedule();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    let timer;
    let alive = true;
    const schedule = (first = false) => {
      timer = setTimeout(() => {
        if (!alive) return;
        setRainbowActive(true);
        timer = setTimeout(() => {
          if (!alive) return;
          setRainbowActive(false);
          schedule();
        }, 2900);
      }, first ? 2600 : 8000 + Math.random() * 7000);
    };
    schedule(true);
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  return (
    <div className="animated-camp-scene" aria-hidden="true">
      <img src={boss2Base} alt="" className="animated-camp-layer" />
      <img src={boss2Chameleon} alt="" className="animated-camp-layer animated-camp-chameleon" style={{ filter: chameleonFilter || undefined }} />
      <img src={boss2OutColours} alt="" className="animated-camp-layer animated-camp-out" />
      <img src={boss2Point} alt="" className="animated-camp-layer" />
      <span className="animated-camp-mask animated-camp-point" style={{ '--scene-mask': `url(${boss2Point})` }} />
      <img src={boss2Point} alt="" className="animated-camp-layer animated-camp-detail" />
      <img src={boss2Rainbow} alt="" className="animated-camp-layer" />
      <img src={boss2Rainbow} alt="" className="animated-camp-layer animated-camp-rainbow-detail" />
      <span className={`animated-camp-mask animated-camp-rainbow${rainbowActive ? ' is-active' : ''}`} style={{ '--scene-mask': `url(${boss2Rainbow})` }} />
      <img src={boss2Smoke} alt="" className="animated-camp-layer animated-camp-smoke" />
      <img src={boss2SmokeTwo} alt="" className="animated-camp-layer animated-camp-smoke-two" />
      <SceneStyles />
    </div>
  );
}

function ShorkRoomScene() {
  return <div className="animated-camp-scene" aria-hidden="true">
    <img src={shorkBase} alt="" className="animated-camp-layer" />
    <img src={shorkBigPlanet} alt="" className="animated-camp-layer camp-shork-planet" />
    <img src={shorkMiniPlanet} alt="" className="animated-camp-layer camp-shork-mini-planet" />
    <img src={shorkCrane} alt="" className="animated-camp-layer camp-shork-crane" />
    <img src={shorkLightboard} alt="" className="animated-camp-layer camp-shork-light" />
    <img src={shorkScreen} alt="" className="animated-camp-layer camp-shork-screen" />
    <img src={shorkLamp} alt="" className="animated-camp-layer camp-shork-lamp" />
    <img src={shorkEye} alt="" className="animated-camp-layer camp-shork-eye" />
    <img src={shorkSlime} alt="" className="animated-camp-layer camp-shork-slime" />
    <SceneStyles />
  </div>;
}

function WormRoomScene() {
  return <div className="animated-camp-scene" aria-hidden="true">
    <img src={wormBase} alt="" className="animated-camp-layer" />
    <img src={wormEye} alt="" className="animated-camp-layer" />
    <img src={wormPupil} alt="" className="animated-camp-layer camp-worm-pupil" />
    <img src={wormBlinkEye} alt="" className="animated-camp-layer camp-worm-blink" />
    <img src={wormPendulumEye} alt="" className="animated-camp-layer camp-worm-pendulum" />
    <img src={wormWheel} alt="" className="animated-camp-layer camp-worm-wheel" />
    <img src={wormRedLamp} alt="" className="animated-camp-layer camp-worm-lamp" />
    <img src={wormCone} alt="" className="animated-camp-layer camp-worm-cone" />
    <img src={wormCow} alt="" className="animated-camp-layer camp-worm-cow" />
    <img src={wormSlime} alt="" className="animated-camp-layer camp-worm-slime" />
    <img src={wormWaterfall} alt="" className="animated-camp-layer camp-worm-waterfall" />
    <SceneStyles />
  </div>;
}

function SporgolRoomScene() {
  return <div className="animated-camp-scene" aria-hidden="true">
    <img src={sporgolBase} alt="" className="animated-camp-layer" />
    <img src={sporgolMoon} alt="" className="animated-camp-layer camp-sporgol-moon" />
    <img src={sporgolPlanets} alt="" className="animated-camp-layer camp-sporgol-planets" />
    <img src={sporgolMushroom} alt="" className="animated-camp-layer camp-sporgol-mushroom" />
    <img src={sporgolHand} alt="" className="animated-camp-layer camp-sporgol-hand" />
    <img src={sporgolEye} alt="" className="animated-camp-layer" />
    <img src={sporgolPupil} alt="" className="animated-camp-layer camp-sporgol-pupil" />
    <SceneStyles />
  </div>;
}

function SuckholeRoomScene() {
  return <div className="animated-camp-scene" aria-hidden="true">
    <img src={suckholeBase} alt="" className="animated-camp-layer" />
    <img src={suckholeBlackHole} alt="" className="animated-camp-layer camp-suckhole-hole" />
    <img src={suckholeTentacle} alt="" className="animated-camp-layer camp-suckhole-tentacle" />
    <img src={suckholeToiletPaper} alt="" className="animated-camp-layer camp-suckhole-paper" />
    <SceneStyles />
  </div>;
}

function SceneStyles() {
  return <style>{`
    .animated-camp-scene { position:absolute; inset:0; overflow:hidden; pointer-events:none; isolation:isolate; }
    .animated-camp-layer, .animated-camp-mask { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .animated-camp-layer { object-fit:cover; will-change:transform, opacity, filter; }
    .animated-camp-mask { -webkit-mask-image:var(--scene-mask); mask-image:var(--scene-mask); -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat; -webkit-mask-position:center; mask-position:center; -webkit-mask-size:cover; mask-size:cover; }
    .animated-camp-window { position:absolute; inset:0; overflow:hidden; clip-path:polygon(22.5% 20.1%,70.8% 20.1%,70.8% 38.8%,22.5% 38.8%); }
    .animated-camp-blue { animation:animated-camp-blue 2.57s ease-in-out infinite; }
    .animated-camp-red-monitor { animation:animated-camp-red-monitor 1.93s ease-in-out -.71s infinite; }
    .animated-camp-red-lights { animation:animated-camp-red-lights 1.32s ease-in-out -.38s infinite; }
    .animated-camp-top-light { animation:animated-camp-top-light 5.6s ease-in-out -1.8s infinite; }
    .animated-camp-meteors { transform-origin:49% 29%; animation:animated-camp-meteors 6.7s ease-in-out infinite; }
    .animated-camp-star { transform-origin:60% 23%; animation:animated-camp-star 4.1s ease-in-out infinite alternate; }
    .animated-camp-chameleon { transition:filter 760ms ease-in-out; }
    .animated-camp-out { animation:animated-camp-out 5.8s ease-in-out infinite; }
    .animated-camp-point { opacity:.82; background:linear-gradient(120deg,#ff304d,#ff8a22,#ffe942,#51e86f,#39d9ff,#3d6fff,#b449ff,#ff35aa,#ff304d); background-size:360% 100%; animation:animated-camp-point 8.2s linear infinite; }
    .animated-camp-detail { opacity:.42; }
    .animated-camp-rainbow-detail { opacity:.68; }
    .animated-camp-rainbow { opacity:0; background:repeating-linear-gradient(105deg,rgba(255,42,68,.72) 0%,rgba(255,42,68,.72) 8%,rgba(255,220,46,.84) 17%,rgba(75,236,104,.86) 33%,rgba(45,218,255,.86) 49%,rgba(57,100,255,.82) 65%,rgba(179,64,255,.72) 81%,rgba(255,42,68,.72) 96%); background-size:150% 100%; mix-blend-mode:color; }
    .animated-camp-rainbow.is-active { animation:animated-camp-rainbow 2.7s ease-in-out both; }
    .animated-camp-smoke { transform-origin:84% 20%; animation:animated-camp-smoke 7.6s ease-in-out infinite; }
    .animated-camp-smoke-two { transform-origin:77% 16%; animation:animated-camp-smoke-two 9.4s ease-in-out -3.2s infinite; }
    .camp-shork-planet { transform-origin:86.3% 5%; animation:camp-scene-drift 13.5s ease-in-out infinite; }
    .camp-shork-mini-planet { transform-origin:28.5% 3.8%; animation:camp-scene-drift 17.2s ease-in-out -6s infinite reverse; }
    .camp-shork-crane { transform-origin:15.6% 2.4%; animation:camp-scene-swing 5.2s ease-in-out -1.8s infinite; }
    .camp-shork-light { opacity:.88; animation:camp-scene-flicker 2.6s ease-in-out infinite; }
    .camp-shork-screen { filter:brightness(1.14); animation:camp-scene-screen 180ms steps(2,end) infinite; }
    .camp-shork-lamp { animation:camp-scene-glow 3.1s ease-in-out -.8s infinite; }
    .camp-shork-eye { transform-origin:96.8% 48.4%; animation:camp-scene-blink 5.3s ease-in-out infinite; }
    .camp-shork-slime { animation:camp-scene-pulse 3.6s ease-in-out infinite; }
    .camp-worm-pupil, .camp-sporgol-pupil { animation:camp-scene-look 3.4s ease-in-out infinite alternate; }
    .camp-worm-blink { transform-origin:50% 14%; animation:camp-scene-blink 5s ease-in-out infinite; }
    .camp-worm-pendulum { transform-origin:82.9% 0%; animation:camp-scene-swing 5.1s ease-in-out -1.4s infinite; }
    .camp-worm-wheel { transform-origin:51.1% 4%; animation:camp-scene-swing 5.3s ease-in-out -.8s infinite; }
    .camp-worm-lamp { animation:camp-scene-flicker 1.63s ease-in-out infinite; }
    .camp-worm-cone { transform-origin:33.4% 4%; animation:camp-scene-swing 7.2s ease-in-out -2.2s infinite; }
    .camp-worm-cow { transform-origin:38.5% 8.5%; animation:camp-scene-swing 8.4s ease-in-out -3.7s infinite; }
    .camp-worm-slime { animation:camp-scene-pulse 4.3s ease-in-out infinite; }
    .camp-worm-waterfall { animation:camp-scene-waterfall 1.1s linear infinite; }
    .camp-sporgol-moon { transform-origin:75% 10%; animation:camp-scene-drift 12.4s ease-in-out -2.8s infinite; }
    .camp-sporgol-planets { animation:camp-scene-orbit 19s ease-in-out infinite alternate; }
    .camp-sporgol-mushroom { transform-origin:93% 64%; animation:camp-scene-shake 4.3s ease-in-out infinite; }
    .camp-sporgol-hand { transform-origin:29.7% 79%; animation:camp-scene-swing 3.7s ease-in-out -.9s infinite; }
    .camp-suckhole-hole { transform-origin:50% 50%; animation:camp-scene-spin 18.3s linear infinite; }
    .camp-suckhole-tentacle { transform-origin:50% 63%; animation:camp-scene-swing 5.2s ease-in-out -2.7s infinite; }
    .camp-suckhole-paper { transform-origin:47% 84%; animation:camp-scene-swing 4.1s ease-in-out -2.9s infinite; }
    @keyframes camp-scene-drift { 0%,100%{transform:scale(1)} 50%{transform:scale(1.025) translateY(-2px)} }
    @keyframes camp-scene-swing { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
    @keyframes camp-scene-flicker { 0%,100%{opacity:.78;filter:brightness(.95)} 52%{opacity:1;filter:brightness(1.18)} }
    @keyframes camp-scene-screen { 0%,100%{opacity:.9;filter:brightness(1.08)} 45%{opacity:.72;filter:brightness(.94)} 49%{opacity:1;filter:brightness(1.26)} }
    @keyframes camp-scene-blink { 0%,46%,50%,100%{transform:scaleY(1)} 48%{transform:scaleY(.08)} }
    @keyframes camp-scene-pulse { 0%,100%{filter:brightness(.94) saturate(1)} 50%{filter:brightness(1.2) saturate(1.15)} }
    @keyframes camp-scene-look { from{transform:translate(-1.3%,.4%)} to{transform:translate(1.3%,-.4%)} }
    @keyframes camp-scene-waterfall { from{filter:brightness(.93);transform:translateY(-1px)} to{filter:brightness(1.1);transform:translateY(1px)} }
    @keyframes camp-scene-orbit { from{transform:translateY(-2px)} to{transform:translateY(3px)} }
    @keyframes camp-scene-shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-.5deg)} 50%{transform:rotate(.35deg)} 75%{transform:rotate(-.2deg)} }
    @keyframes camp-scene-spin { to{transform:rotate(360deg)} }
    @keyframes animated-camp-blue { 0%,100%{opacity:.82;filter:brightness(.98)} 46%{opacity:.76;filter:brightness(.94)} 63%{opacity:1;filter:brightness(1.08)} }
    @keyframes animated-camp-red-monitor { 0%,100%{opacity:.78;filter:brightness(.96)} 54%{opacity:.72;filter:brightness(.92)} 60%{opacity:1;filter:brightness(1.14)} }
    @keyframes animated-camp-red-lights { 0%,100%{opacity:.65;filter:brightness(.92)} 50%{opacity:1;filter:brightness(1.18)} }
    @keyframes animated-camp-top-light { 0%,19%,100%{opacity:.78} 24%,32%,40%{opacity:1;filter:brightness(1.2)} 28%,36%{opacity:.55;filter:brightness(.84)} }
    @keyframes animated-camp-meteors { 0%,100%{transform:scale(1)} 50%{transform:scale(1.032)} }
    @keyframes animated-camp-star { from{opacity:.7;transform:scale(.98)} to{opacity:1;transform:scale(1.03);filter:brightness(1.22) drop-shadow(0 0 6px rgba(255,241,158,.72))} }
    @keyframes animated-camp-out { 0%,100%,12%,24%,67%,73%{opacity:.12} 15%{opacity:.72;filter:sepia(1) saturate(5) hue-rotate(-26deg) brightness(1.2)} 21%{opacity:.56;filter:sepia(1) saturate(4.5) hue-rotate(-26deg)} 70%{opacity:.48;filter:sepia(1) saturate(4) hue-rotate(-26deg)} }
    @keyframes animated-camp-point { from{background-position:0% 50%} to{background-position:100% 50%} }
    @keyframes animated-camp-rainbow { 0%{opacity:0;background-position:0% 50%} 12%{opacity:.24;background-position:18% 50%} 48%{opacity:.44;background-position:52% 50%} 78%{opacity:.3;background-position:82% 50%} 100%{opacity:0;background-position:100% 50%} }
    @keyframes animated-camp-smoke { 0%,100%{opacity:.52;transform:translate(0,0) scale(1)} 28%{opacity:.84;transform:translate(3px,-6px) scale(1.018)} 58%{opacity:.63;transform:translate(-2px,-11px) scale(1.035)} 80%{opacity:.78;transform:translate(2px,-5px) scale(1.016)} }
    @keyframes animated-camp-smoke-two { 0%,100%{opacity:.4;transform:translate(0,0) scale(1)} 24%{opacity:.7;transform:translate(-3px,-5px) scale(1.014)} 52%{opacity:.5;transform:translate(2px,-10px) scale(1.03)} 76%{opacity:.66;transform:translate(-1px,-6px) scale(1.012)} }
    @media (prefers-reduced-motion:reduce) { .animated-camp-scene * { animation:none !important; } }
  `}</style>;
}

export default function AnimatedCampBackground({ sceneId }) {
  if (sceneId === 'boss1') return <BossOneRoomScene />;
  if (sceneId === 'boss2') return <BossTwoRoomScene />;
  if (sceneId === 'boss3') return <ShorkRoomScene />;
  if (sceneId === 'boss4') return <WormRoomScene />;
  if (sceneId === 'boss5') return <SporgolRoomScene />;
  if (sceneId === 'boss6') return <SuckholeRoomScene />;
  return null;
}
