import skeletonFireZones from './skeletonFireZones.json';
import './skeletonBattlePass.css';
import WeaponEnhancementEffect from './WeaponEnhancementEffect';
import {WeaponEnhancementContext,isWeaponArtLayer} from './weaponEnhancementContext';
import { EPIC_SET_ART, EpicArmorEffects, EpicBootEffects, EpicHeadEffects, EpicWeapon, EpicRaven, EpicDemonicAura } from './EpicSetEffects';
import HeroAccessory from './HeroAccessory';
import LocalRabbitHeadEffects from './LocalRabbitHeadEffects';
import LocalTvHead from './LocalTvHead';
import LocalToasterPet from './LocalToasterPet';
import { SHKRABAN_ENABLED } from '@/lib/shkrabanContent';
import AnubisSetEffects from './AnubisSetEffects';
import RegisteredWeaponCombo, { resolveRegisteredWeaponCombo } from './RegisteredWeaponCombo';
import { memo, useContext, useEffect, useId, useRef, useState } from 'react';
import { useAnimationsEnabled, useSceneAnimationsEnabled } from '@/lib/animationPreference';
import heroBase from '@/assets/hero/set1-body.png';
import trousers from '@/assets/hero/set1-legs.png';
import boots from '@/assets/hero/set1-boots.png';
import armor from '@/assets/hero/set1-armor.png';
import hands from '@/assets/hero/set1-hands.png';
import { LEGENDARY_SET_ART, LegendaryBack, LegendaryGlow, LegendaryAura } from './LegendarySetEffects';
import epicHandsWithFirstWeaponArt from '@/assets/hero/bp epic set/setbp1-hands+bpepichands.png';
import weapon from '@/assets/hero/set1-weap1.png';
import head from '@/assets/hero/set1-head.png';
import halloweenArmorHeart from '@/assets/hero/halloween-set/hellow-set-armor-heart-bottom54.png';
import halloweenPantsAnim from '@/assets/hero/halloween-set/hellow-set-pants-anim-bottom54.png';
import halloweenWeaponAnim from '@/assets/hero/halloween-set/hellow-set-hands-weap-anim-bottom54.png';
import halloweenHeadEyes from '@/assets/hero/halloween-set/hellow-set-head-eyes-bottom54.png';
import halloweenHeadAnim from '@/assets/hero/halloween-set/hellow-set-head-anim-bottom54.png';
import halloweenFullHead from '@/assets/hero/halloween-set/hellow-set-head.png';
import nightArmor from '@/assets/hero/night-disinfector/set2-armor.png';
import nightLegs from '@/assets/hero/night-disinfector/set2-legs.png';
import nightBoots from '@/assets/hero/night-disinfector/set2-boots.png';
import nightHead from '@/assets/hero/night-disinfector/set2-head.png';
import nightHands from '@/assets/hero/night-disinfector/set2-hands.png';
import nightWeaponHands from '@/assets/hero/night-disinfector/set2-hands-weap1.png';
import nightWeaponAndHands from '@/assets/hero/night-disinfector/set2-hands-weap1-extra-hands.png';
import nightHandsWeaponOne from '@/assets/optimized/all/hero/nuvelor/set2-hands-weap1.webp';
import nightSmoke from '@/assets/hero/night-disinfector/set2-effect-smoke-head.png';
import nightAero1 from '@/assets/hero/night-disinfector/set2-effect-aero1.png';
import nightAero2 from '@/assets/hero/night-disinfector/set2-effect-aero2.png';
import nightElectric1 from '@/assets/hero/night-disinfector/set2-effect-electric-head1.png';
import nightElectric2 from '@/assets/hero/night-disinfector/set2-effect-electric-head2.png';
import nightElectric3 from '@/assets/hero/night-disinfector/set2-effect-electric-head3.png';
import nightElectric4 from '@/assets/hero/night-disinfector/set2-effect-electric-head4.png';
import nuvelorArmor from '@/assets/hero/nuvelor/set3-armor.png';
import nuvelorBackEye1 from '@/assets/hero/nuvelor/set3-effect-backeye1.png';
import nuvelorBackEye2 from '@/assets/hero/nuvelor/set3-effect-backeye2.png';
import nuvelorCow from '@/assets/hero/nuvelor/set3-effect-cow.png';
import nuvelorCrocs from '@/assets/hero/nuvelor/set3-boots.png';
import nuvelorHands from '@/assets/hero/nuvelor/set3-hands.png';
import nuvelorHandsWeaponOne from '@/assets/optimized/all/hero/nuvelor/set3-hands-weap1.webp';
import nuvelorWeapon from '@/assets/optimized/all/hero/nuvelor/set3-weap1.webp';
import nightHandsWithThirdWeaponArt from '../../assets/hero/nuvelor/set2-hands-weap3.png';
import nuvelorHead from '@/assets/hero/nuvelor/set3-head.png';
import nuvelorLens from '@/assets/hero/nuvelor/set3-effect-lens.png';
import nuvelorLegs from '@/assets/hero/nuvelor/set3-legs.png';
import firstHandsWithThirdWeaponArt from '../../assets/hero/nuvelor/set3-weap3.png';
import anubisHandsWithPigClubArt from '@/assets/hero/anubis/hands-pig-club-v1.png';
import anubisOriginalHandsArt from '@/assets/hero/anubis/hands.png';
import legendaryPigClubArt from '@/assets/hero/bp leg set/hands-pig-club-v1.png';
import piratePigClubArt from '@/assets/hero/halloween-set/hands-pig-club-v1.png';
import pirateOriginalHandsArt from '@/assets/hero/halloween-set/hellow-set-hands-bottom54.png';
import nuvelorHandsWithThirdWeaponArt from '../../assets/hero/nuvelor/set3-hands-weap1-pet.png';
import set5HandsWithThirdWeaponArt from '../../assets/hero/set5-hands-weap3extra-hands.png';
import set5HandsWithFirstWeaponArt from '../../assets/hero/set5-hands-weap1.png';
import set5HandsWithSecondWeaponArt from '../../assets/hero/hand5+weap2.png';
import nuvelorSmokeLeft from '@/assets/hero/nuvelor/set3-effect-smoke-left.png';
import nuvelorSmokeRight from '@/assets/hero/nuvelor/set3-effect-smoke-right.png';
import nuvelorPupil1 from '@/assets/hero/nuvelor/set3-effect-pupil1.png';
import nuvelorPupil2 from '@/assets/hero/nuvelor/set3-effect-pupil2.png';
import nuvelorMoney from '@/assets/hero/nuvelor/set3-effect-money.png';
import set5Armor from '@/assets/hero/cosmo set/set5-armor.png';
import set5BlackHole from '@/assets/hero/cosmo set/set1-armor-black hole.png';
import set5Boots from '@/assets/hero/cosmo set/set5-boots.png';
import set5Hands from '@/assets/hero/cosmo set/set5-hands.png';
import set5Head from '@/assets/hero/cosmo set/set5-head.png';
import set5HeadAntenna from '@/assets/hero/cosmo set/set5-head-antena.png';
import set5HeadEye from '@/assets/hero/cosmo set/set5-head-oko.png';
import set5HeadLight from '@/assets/hero/cosmo set/set5-head-yellow-light.png';
import set5HeadPupil from '@/assets/hero/cosmo set/set5-head-zrachok.png';
import set5Legs from '@/assets/hero/cosmo set/set5-legs.png';
import set5WeaponHands from '@/assets/hero/cosmo set/set5-hands-weap5.png';
import set5WeaponHandsLaser from '@/assets/hero/cosmo set/set5-hands-weap5-laser.png';
import set5WeaponExtraHands from '@/assets/hero/cosmo set/set5-hands-weap5extra-hands.png';
import set5WeaponExtraHandsLaser from '@/assets/hero/cosmo set/set5-hands-weap5extra-hands-laser.png';
import set4Armor from '@/assets/hero/gumset/set4-armor.png';
import set4ArmorAnim from '@/assets/hero/gumset/set4-armor-anim.png';
import set4ArmorBack from '@/assets/hero/gumset/set4-armor-back.png';
import set4ArmorBackEye from '@/assets/hero/gumset/set4-armor-back-eye.png';
import set4ArmorBackPupil from '@/assets/hero/gumset/set4-armor-back-zrachok.png';
import set4ArmorEye from '@/assets/hero/gumset/set4-armor-eye.png';
import set4Boots from '@/assets/hero/gumset/set4-boots.png';
import set4BootsAnim from '@/assets/hero/gumset/set4-boots-anim.png';
import set4Hands from '@/assets/hero/gumset/set4-hands.png';
import set4HandsAnim from '@/assets/hero/gumset/set4-hands-anim.png';
import set4Head from '@/assets/hero/gumset/set4-head.png';
import set4HeadAnim from '@/assets/hero/gumset/set4-head-anim.png';
import set4Legs from '@/assets/hero/gumset/set4-legs.png';
import set4LegsAnim from '@/assets/hero/gumset/set4-legs-anim.png';
import set4WeaponWithHands from '@/assets/hero/gumset/set4-weap4-with-hands.png';
import set4WeaponWithHandsAnim from '@/assets/hero/gumset/set4-weap4-with-hands-anim.png';
import set4WeaponWithHandsAcid from '@/assets/hero/gumset/set4-weap4-with-hands-anim-acid.png';
import set4WeaponWithoutHands from '@/assets/hero/gumset/set4-weap4-without-hands.png';
import set4WeaponWithoutHandsAnim from '@/assets/hero/gumset/set4-weap4-without-hands-anim.png';
import set4HandsWithThirdWeaponArt from '../../assets/hero/gumset/set4-weap3-with-hands.png';
import set4HandsWithFirstWeaponArt from '../../assets/hero/hands4+weap1.png';
import set4HandsWithSecondWeaponArt from '../../assets/hero/hands4+weap2.png';
import set4HandsWithFifthWeaponArt from '../../assets/hero/gumset/hands4+weap5.png';
import set2HandsWithSet4Weapon from '../../assets/hero/set2-hands-weap4-extra-hands.png';
import newbiePack2HeadEye from '@/assets/hero/newbie pack/set-newbiepack-head-eye.png';
import newbiePack2WeaponHands from '@/assets/hero/newbie pack/set-newbiepack-hands-weap.png';
import newbiePack2WeaponHandsExtra from '@/assets/hero/newbie pack/set-newbiepack-hands-weap1-extra-hands.png';
import newbiePack2Hands from '@/assets/hero/newbie pack/set-newbiepack-hands.png';
import nightHandsWithNewbiePackWeaponArt from '../../assets/hero/nuvelor/set2-hands-weap-newbiepack.png';
import newbiePackHandsWithFirstWeaponArt from '../../assets/hero/newbiepack hands+weap1.png';
import newbiePackHandsWithSecondWeaponArt from '../../assets/hero/newbiepack hands+weap2.png';
import newbiePackHandsWithThirdWeaponArt from '../../assets/hero/newbiepack hands+weap3.png';
import newbiePackHandsWithFifthWeaponArt from '../../assets/hero/newbiepack hands+weap5.png';
import nuvelorHandsWithSecondWeaponArt from '../../assets/hero/set3hands+weap2.png';
import nuvelorHandsWithSet5WeaponArt from '../../assets/hero/gumset/hands3weap5.png';

const BASE_LAYERS = [
  { id: 'base', src: heroBase, alt: 'Hero body', slot: 'base' },
  { id: 'boots', src: boots, alt: 'Hero boots', slot: 'boots' },
  { id: 'trousers', src: trousers, alt: 'Hero trousers', slot: 'legs' },
  { id: 'armor', src: armor, alt: 'Hero armor', slot: 'armor' },
];

const ELECTRIC_LAYERS = [nightElectric1, nightElectric2, nightElectric3, nightElectric4];
const NUVELOR_BUBBLES = [
  { left: '48.8%', top: '41.8%', size: 2.6, delay: '-0.2s', duration: '2.8s' },
  { left: '51.2%', top: '42.4%', size: 3.4, delay: '-1.1s', duration: '3.4s' },
  { left: '53.1%', top: '41.5%', size: 2.1, delay: '-2.2s', duration: '2.6s' },
  { left: '50%', top: '43.4%', size: 1.8, delay: '-1.8s', duration: '3.1s' },
  { left: '47.4%', top: '42.9%', size: 2.2, delay: '-0.7s', duration: '3.7s' },
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function useRandomPulse(active, minPause, maxPause, duration) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!active) {
      setPulse(0);
      return undefined;
    }
    let timer;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setPulse((value) => value + 1);
        timer = window.setTimeout(schedule, duration + randomBetween(minPause, maxPause));
      }, randomBetween(minPause, maxPause));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [active, duration, maxPause, minPause]);
  return pulse;
}

function useWander(active, xRange, yRange, phase = 0) {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!active) {
      setPoint({ x: 0, y: 0 });
      return undefined;
    }
    let timer;
    const next = () => {
      setPoint({ x: randomBetween(-xRange, xRange), y: randomBetween(-yRange, yRange) });
      timer = window.setTimeout(next, randomBetween(1300 + phase, 2600 + phase));
    };
    timer = window.setTimeout(next, 700 + phase);
    return () => window.clearTimeout(timer);
  }, [active, phase, xRange, yRange]);
  return point;
}

function PigClubHands({ original, grip, x = 0, y = 0, width = 500, height = 896 }) {
  return <svg role="img" aria-label="Gloves holding pig club" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
    <svg x="0" y="0" width="500" height="465" viewBox="0 0 500 465" overflow="hidden"><image href={original} width="500" height="896" /></svg>
    <svg x="225" y="465" width="275" height="431" viewBox="225 465 275 431" overflow="hidden"><image href={original} width="500" height="896" /></svg>
    <svg x="0" y="465" width="225" height="431" viewBox="0 465 225 431" overflow="hidden"><image href={grip} x={x} y={y} width={width} height={height} /></svg>
    <svg x="225" y="520" width="275" height="376" viewBox="225 520 275 376" overflow="hidden"><image href={grip} x={x} y={y} width={width} height={height} /></svg>
  </svg>;
}

const skeletonBodyRegions = {
  head: '130,0 370,0 370,163 130,163',
  armor: '180,164 327,164 339,332 311,339 311,398 198,398 198,339 162,339|230,151 276,151 282,181 224,181',
  hands: '145,324 185,324 192,403 199,460 198,549 126,549 126,475 135,422|317,324 353,324 365,433 371,482 371,549 302,549 304,465 311,403',
  legs: '190,390 320,390 330,811 186,811',
  boots: '140,799 365,799 365,896 140,896',
};

function SkeletonFlames({ slots, weapon }) {
  if (!slots.length && !weapon) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] grid place-items-center">
    <div className="skeleton-bp-effects">
      {skeletonFireZones.filter(zone => zone.slot === 'weapon' ? weapon : slots.includes(zone.slot)).map(zone =>
        <div key={zone.asset} className="skeleton-bp-contour" style={{ maskImage: 'url(/skeleton-bp/' + zone.asset + ')' }}>
          <i className="skeleton-bp-tongues" style={zone.style}/>
        </div>)}
      {slots.includes('head') && <><i className="skeleton-bp-eye left-[43.95%]"/><i className="skeleton-bp-eye left-[53.1%]"/></>}
    </div>
  </div>;
}

function HeroLayer({ src, alt, className = '', style = undefined, hideHead = false, hideLeftHand = false, hideRightHand = false, offsetY = 0, skeletonSlots = [] }) {
  const enhancement=useContext(WeaponEnhancementContext);
  const handMaskId = useId();
  if (hideLeftHand || hideRightHand || skeletonSlots.length) return <svg role="img" aria-label={alt} viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className={`absolute inset-0 h-full w-full select-none ${className}`}>
    <defs><mask id={handMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
      <rect width="500" height="896" fill="white" />
      {hideLeftHand ? <rect x="145" y="475" width="48" height="65" fill="black" /> : null}
      {hideRightHand ? <rect x="310" y="475" width="48" height="65" fill="black" /> : null}
      {hideHead ? <rect width="500" height="161" fill="black" /> : null}
      {skeletonSlots.flatMap(slot => skeletonBodyRegions[slot].split('|')).map(points => <polygon key={points} points={points} fill="black" />)}
    </mask></defs>
    <image href={src} width="500" height="896" mask={`url(#${handMaskId})`} />
  </svg>;
  if(enhancement.visible&&enhancement.level>=4&&isWeaponArtLayer(alt)){
    return <div className={'absolute inset-0 '+className} style={style}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-contain object-bottom select-none" draggable="false"/>
      <WeaponEnhancementEffect src={src} level={enhancement.level} paused={enhancement.paused} variant={enhancement.variant}/>
    </div>;
  }

  if (offsetY) return <svg role="img" aria-label={alt} viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className={`absolute inset-0 h-full w-full select-none overflow-visible ${className}`}><image href={src} x="0" y={offsetY} width="500" height="896" /></svg>;
  if (hideHead) return <svg role="img" aria-label={alt} viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className={`absolute inset-0 h-full w-full select-none ${className}`}>
    <svg x="0" y="161" width="500" height="735" viewBox="0 161 500 735" overflow="hidden"><image href={src} x="0" y="0" width="500" height="896" /></svg>
  </svg>;
  return <img src={src} alt={alt} style={style} className={`absolute inset-0 h-full w-full object-contain object-bottom select-none ${className}`} draggable="false" />;
}

function HalloweenRespiratorBreath() {
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true"><i className="halloween-breath halloween-breath-one" /><i className="halloween-breath halloween-breath-two" /><i className="halloween-breath halloween-breath-three" /></div>;
}

function Set5Laser({ src, alt }) {
  const root = useRef(null);
  const enabled = useAnimationsEnabled();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    if (!enabled) return undefined;
    let timer;
    let disposed = false;
    let running = false;
    let visible = typeof IntersectionObserver === 'undefined';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canRun = () => !disposed && visible && !document.hidden && !reduced.matches
      && document.documentElement.dataset.gameHidden !== 'true'
      && !root.current?.closest('.preview-paused')
      && root.current?.closest('.game-app')?.dataset.modalOpen !== 'true';
    const show = () => {
      if (disposed) return;
      if (!canRun()) { running = false; setShown(false); return; }
      setShown(true);
      timer = window.setTimeout(() => {
        if (disposed) return;
        setShown(false);
        timer = window.setTimeout(show, randomBetween(20000, 30000));
      }, 2200);
    };
    const sync = () => {
      if (!canRun()) { running = false; window.clearTimeout(timer); setShown(false); }
      else if (!running) { running = true; show(); }
    };
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (root.current) intersection?.observe(root.current);
    const mutation = new MutationObserver(sync);
    for (let node = root.current?.parentElement; node; node = node.parentElement) mutation.observe(node, { attributes: true, attributeFilter: ['class', 'data-modal-open', 'data-game-hidden'] });
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    sync();
    return () => { disposed = true; window.clearTimeout(timer); intersection?.disconnect(); mutation.disconnect(); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); };
  }, [enabled, src]);
  return <div ref={root} className="pointer-events-none absolute inset-0" data-set5-laser="true">{shown ? <HeroLayer src={src} alt={alt} className="set5-laser" /> : null}</div>;
}

function AlignedCanvas({ children, className = '', style = undefined }) {
  return <div style={style} className={`absolute bottom-0 left-1/2 aspect-[500/896] w-full max-h-full -translate-x-1/2 ${className}`}>{children}</div>;
}

function MaskedPupil({ src, maskSrc, point, alt }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AlignedCanvas
        className="overflow-hidden"
        style={{
          maskImage: `url("${maskSrc}")`,
          maskPosition: '0 0',
          maskRepeat: 'no-repeat',
          maskSize: '100% 100%',
          WebkitMaskImage: `url("${maskSrc}")`,
          WebkitMaskPosition: '0 0',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
        }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain select-none transition-transform ease-in-out"
          style={{ transform: `translate(${point.x}px, ${point.y}px)`, transitionDuration: '1300ms' }}
          draggable="false"
        />
      </AlignedCanvas>
    </div>
  );
}

function Set4Glow({ src, maskSrc, className = '' }) {
  const maskStyle = {
    maskImage: `url("${maskSrc}")`, maskRepeat: 'no-repeat', maskSize: '100% 100%', maskMode: 'alpha',
    WebkitMaskImage: `url("${maskSrc}")`, WebkitMaskRepeat: 'no-repeat', WebkitMaskSize: '100% 100%',
    WebkitMaskMode: 'alpha', mixBlendMode: 'screen',
  };
  return (
    <AlignedCanvas className="pointer-events-none overflow-hidden" style={maskStyle}>
      <HeroLayer src={src} alt="" aria-hidden="true" className={`set4-glow ${className}`} />
    </AlignedCanvas>
  );
}

function Set4Bubbles({ maskSrc, positions, className = '' }) {
  const maskStyle = {
    maskImage: `url("${maskSrc}")`, maskRepeat: 'no-repeat', maskSize: '100% 100%', maskMode: 'alpha',
    WebkitMaskImage: `url("${maskSrc}")`, WebkitMaskRepeat: 'no-repeat', WebkitMaskSize: '100% 100%', WebkitMaskMode: 'alpha',
  };
  return (
    <AlignedCanvas className={`pointer-events-none overflow-hidden ${className}`} style={maskStyle}>
      {positions.map(([left, top, delay, size = 4, duration = 1.8], index) => <i key={index} className="set4-bubble absolute rounded-full" style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />)}
    </AlignedCanvas>
  );
}

function Set4Blink() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <AlignedCanvas className="set4-blink-canvas">
        <img src={set4ArmorEye} alt="" aria-hidden="true" className="set4-blink-half set4-blink-left" />
        <img src={set4ArmorEye} alt="" aria-hidden="true" className="set4-blink-half set4-blink-right" />
      </AlignedCanvas>
    </div>
  );
}

function Set4Fog() {
  return (
    <AlignedCanvas className="pointer-events-none overflow-hidden set4-fog-canvas">
      <div className="set4-fog-fill absolute inset-0" />
    </AlignedCanvas>
  );
}

function NuvelorBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AlignedCanvas
        className="overflow-hidden"
        style={{
          clipPath: 'ellipse(5% 3.7% at 51.6% 39.2%)',
          maskImage: `url("${nuvelorCow}")`,
          maskPosition: '0 0',
          maskRepeat: 'no-repeat',
          maskSize: '100% 100%',
          WebkitMaskImage: `url("${nuvelorCow}")`,
          WebkitMaskPosition: '0 0',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
        }}
      >
        {NUVELOR_BUBBLES.map((bubble, index) => (
          <span
            key={`nuvelor-bubble-${index}`}
            className="nuvelor-bubble absolute rounded-full"
            style={{
              left: bubble.left,
              top: bubble.top,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
            }}
          />
        ))}
      </AlignedCanvas>
    </div>
  );
}

function NuvelorSmoke() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <HeroLayer src={nuvelorSmokeLeft} alt="NUVELOR left smoke" className="nuvelor-smoke-left" />
      <HeroLayer src={nuvelorSmokeRight} alt="NUVELOR right smoke" className="nuvelor-smoke-right" />
    </div>
  );
}

function NuvelorLensFog() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AlignedCanvas
        className="nuvelor-lens-fog-canvas"
        style={{
          maskImage: 'radial-gradient(ellipse 4.7% 2.45% at 46.5% 10.9%, #000 0 70%, transparent 100%), radial-gradient(ellipse 4.7% 2.45% at 56.5% 10.9%, #000 0 70%, transparent 100%)',
          maskPosition: '0 0',
          maskRepeat: 'no-repeat',
          maskSize: '100% 100%',
          WebkitMaskImage: 'radial-gradient(ellipse 4.7% 2.45% at 46.5% 10.9%, #000 0 70%, transparent 100%), radial-gradient(ellipse 4.7% 2.45% at 56.5% 10.9%, #000 0 70%, transparent 100%)',
          WebkitMaskPosition: '0 0',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
        }}
      >
        <div className="nuvelor-lens-fog-fill absolute inset-0" />
        <img src={nuvelorLens} alt="NUVELOR lens fog texture" className="nuvelor-lens-fog-texture absolute inset-0 h-full w-full object-contain select-none" draggable="false" />
      </AlignedCanvas>
    </div>
  );
}

export function LegendaryCapeLayer({ className = '' }) {
  return <div className={`aspect-[284/950] pointer-events-none ${className}`} aria-hidden="true"><AlignedCanvas><HeroLayer src={LEGENDARY_SET_ART['armor-manta']} alt=""/></AlignedCanvas></div>;
}

function LayeredHero({ className = '', visibleSlots = null, baseOverride = null, layerOverrides = null, weaponEnhancementLevel = null }) {
  const sceneRoot = useRef(null);
  const animationsActive = useSceneAnimationsEnabled(sceneRoot);
  const enhancementLevel=Number(weaponEnhancementLevel ?? layerOverrides?.weaponEnhancementLevel ?? 0);
  const registeredCombo = resolveRegisteredWeaponCombo(layerOverrides?.equippedHandsId, layerOverrides?.equippedWeaponId);
  const visualSet = (set) => set ? { ...set, ...(layerOverrides?.accessory ? { head: false } : {}), ...(registeredCombo ? { hands: false, weapon: false } : {}) } : set;
  const epic = visualSet(layerOverrides?.bpEpic) || null;
  const legendary = visualSet(layerOverrides?.bpLegendary) || {};
  const night = visualSet(layerOverrides?.nightDisinfector) || null;
  const nuvelor = visualSet(layerOverrides?.nuvelor) || null;
  const set5 = visualSet(layerOverrides?.set5) || null;
  const set4 = visualSet(layerOverrides?.set4) || null;
  const newbiePackII = visualSet(layerOverrides?.newbiePackII) || null;
  const halloween = registeredCombo ? { ...layerOverrides?.halloween, hands: false, weapon: false } : layerOverrides?.halloween || {};
  const hasNightHands = Boolean(night?.weapon || night?.hands);
  const hasNuvelorHands = Boolean(nuvelor?.weapon || nuvelor?.hands);
  const hasFirstWeapon = layerOverrides?.equippedWeaponId === 'cardboard_weapon';
  const epicHandsWithFirstWeapon = Boolean(epic?.hands && (hasFirstWeapon || newbiePackII?.weapon));
  const hasFirstHands = layerOverrides?.equippedHandsId === 'cardboard_hands';
  const hideFirstHandsWithSet4Armor = Boolean(hasFirstHands && set4?.armor);
  const hasOtherSetHands = Boolean(legendary?.hands || epic?.hands || set4?.hands || set5?.hands || night?.hands || nuvelor?.hands || newbiePackII?.hands);
  const nuvelorHandsWithFirstWeapon = Boolean(nuvelor?.hands && hasFirstWeapon);
  const nuvelorHandsWithSecondWeapon = Boolean(nuvelor?.hands && night?.weapon);
  const nightHandsWithFirstWeapon = Boolean(night?.hands && hasFirstWeapon);
  const nightHandsWithThirdWeapon = Boolean(night?.hands && nuvelor?.weapon);
  const firstHandsWithThirdWeapon = Boolean(
    (hasFirstHands || (!layerOverrides?.equippedHandsId && !hasOtherSetHands))
      && (layerOverrides?.equippedWeaponId === 'nuvelor_weapon' || nuvelor?.weapon),
  );
  const nuvelorHandsWithThirdWeapon = Boolean(nuvelor?.hands && nuvelor?.weapon);
  const anubisHandsWithThirdWeapon = Boolean(layerOverrides?.equippedHandsId === 'anubis_hands' && layerOverrides?.equippedWeaponId === 'nuvelor_weapon');
  const legendaryHandsWithThirdWeapon = Boolean(legendary.hands && layerOverrides?.equippedWeaponId === 'nuvelor_weapon');
  const pirateHandsWithThirdWeapon = Boolean(halloween.hands && layerOverrides?.equippedWeaponId === 'nuvelor_weapon');
  const newPigClubCombo = anubisHandsWithThirdWeapon || legendaryHandsWithThirdWeapon || pirateHandsWithThirdWeapon;
  const handsWithThirdWeapon = firstHandsWithThirdWeapon || nuvelorHandsWithThirdWeapon || newPigClubCombo;
  const nightHandsWithNewbiePackWeapon = Boolean(night?.hands && newbiePackII?.weapon && !newbiePackII?.hands);
  const newbiePackHandsWithFirstWeapon = Boolean(newbiePackII?.hands && layerOverrides?.equippedWeaponId === 'cardboard_weapon');
  const newbiePackHandsWithSecondWeapon = Boolean(newbiePackII?.hands && night?.weapon);
  const newbiePackHandsWithThirdWeapon = Boolean(newbiePackII?.hands && nuvelor?.weapon);
  const smokePulse = useRandomPulse(animationsActive && Boolean(night?.head), 500, 1300, 2200);
  const aeroPulse = useRandomPulse(animationsActive && Boolean(night?.armor), 2000, 5000, 950);
  const electricPulseOne = useRandomPulse(animationsActive && Boolean(night?.head), 400, 2500, 250);
  const electricPulseTwo = useRandomPulse(animationsActive && Boolean(night?.head), 455, 2430, 250);
  const electricPulseThree = useRandomPulse(animationsActive && Boolean(night?.head), 510, 2360, 250);
  const electricPulseFour = useRandomPulse(animationsActive && Boolean(night?.head), 565, 2290, 250);
  const electricPulses = [electricPulseOne, electricPulseTwo, electricPulseThree, electricPulseFour];
  const nuvelorSmokePulse = useRandomPulse(animationsActive && Boolean(nuvelor?.head), 5000, 7000, 1550);
  const nuvelorMoneyPulse = useRandomPulse(animationsActive && Boolean(nuvelor?.weapon), 900, 1800, 2600);
  const nuvelorCowPulse = useRandomPulse(animationsActive && Boolean(nuvelor?.armor), 1000, 2200, 3600);
  const leftPupil = useWander(animationsActive && Boolean(nuvelor?.head), 5, 3, 0);
  const rightPupil = useWander(animationsActive && Boolean(nuvelor?.head), 4, 2.5, 420);
  const set5Pupil = useWander(animationsActive && Boolean(set5?.head), 2, 1.5, 180);
  const hasSet5HandsOrWeapon = Boolean(set5?.hands || set5?.weapon);
  const hasSet4HandsOrWeapon = Boolean(set4?.hands || set4?.weapon);
  const set4HandsWithSet5Weapon = Boolean(set4?.hands && set5?.weapon && !set5?.hands);
  const nuvelorHandsWithSet5Weapon = Boolean(nuvelor?.hands && set5?.weapon && !set5?.hands);
  const newbiePackHandsWithSet5Weapon = Boolean(newbiePackII?.hands && set5?.weapon && !set5?.hands && !newbiePackII?.weapon);
  const set5HandsWithThirdWeapon = Boolean(set5?.hands && layerOverrides?.equippedWeaponId === 'nuvelor_weapon');
  const set5HandsWithSecondWeapon = Boolean(set5?.hands && night?.weapon);
  const set5HandsWithFirstWeapon = Boolean(set5?.hands && layerOverrides?.equippedWeaponId === 'cardboard_weapon');
  const set2HandsWithSet4WeaponActive = Boolean(set4?.weapon && night?.hands && !set4?.hands);
  const set4HandsWithThirdWeapon = Boolean(set4?.hands && layerOverrides?.equippedWeaponId === 'nuvelor_weapon');
  const set4HandsWithSecondWeapon = Boolean(set4?.hands && night?.weapon);
  const set4HandsWithFirstWeapon = Boolean(set4?.hands && layerOverrides?.equippedWeaponId === 'cardboard_weapon');
  const set2HandsUnderSet4Armor = Boolean(
    set4?.armor && night?.hands && !night?.weapon && !set4?.weapon && !set5?.weapon
      && !hasFirstWeapon && !nuvelor?.weapon && !newbiePackII?.weapon,
  );
  const set5HandsUnderSet4Armor = Boolean(
    set4?.armor && set5?.hands && !set5?.weapon && !set4?.weapon && !night?.weapon
      && !hasFirstWeapon && !nuvelor?.weapon && !newbiePackII?.weapon,
  );
  // Move far enough to be perceptible at the hero's rendered scale; the eye
  // alpha mask still clips the pupil to the visible lens.
  const set4Pupil = useWander(animationsActive && Boolean(set4?.armor), 4.2, 2.8, 160);
  const set5WeaponWithHands = set5?.weapon
    ? set5?.hands ? set5WeaponExtraHands : set5WeaponHands
    : null;
  const set5Laser = set5?.weapon ? (set5?.hands ? set5WeaponExtraHandsLaser : set5WeaponHandsLaser) : null;
  const handLayer = nightHandsWithFirstWeapon
    ? nightHandsWeaponOne
    : night?.weapon && night?.hands
      ? nightWeaponAndHands
    : night?.weapon
      ? nightWeaponHands
      : night?.hands
        ? nightHands
        : null;
  const slotVisible = (slot) => !(registeredCombo && (slot === 'weapon' || slot === 'hands')) && !(slot === 'weapon' && (layerOverrides?.rearWeapon || halloween.weapon)) && !(slot === 'head' && layerOverrides?.accessory) && !((slot==='weapon'||slot==='hands') && legendary[slot]) && !(slot === 'weapon' && (epic?.weapon || epicHandsWithFirstWeapon)) && !(slot === 'hands' && epic?.hands) && !(slot === 'hands' && hideFirstHandsWithSet4Armor)
    && (!visibleSlots || slot === 'base' || Boolean(visibleSlots[slot]));
  const baseLayers = BASE_LAYERS.filter((layer) => slotVisible(layer.slot));
  const armorLayer = baseLayers.find((layer) => layer.slot === 'armor');
  const nonArmorLayers = baseLayers
    .filter((layer) => layer.slot !== 'armor')
    .sort((a, b) => {
      const order = layerOverrides?.bootsOverLegs || epic?.boots || newbiePackII?.boots || set4?.boots || (set5?.boots && !set5?.legs) || (night?.boots && !night?.legs)
        ? { base: 0, legs: 1, boots: 2 }
        : { base: 0, boots: 1, legs: 2 };
      return (order[a.slot] ?? 10) - (order[b.slot] ?? 10);
    });
  const layerSource = (layer) => {
    if (legendary[layer.slot] && LEGENDARY_SET_ART[layer.slot]) return LEGENDARY_SET_ART[layer.slot];
    if (layer.slot === 'base' && baseOverride) return baseOverride;
    if (epic?.[layer.slot] && EPIC_SET_ART[layer.slot]) return EPIC_SET_ART[layer.slot];
    if (set4?.boots && layer.slot === 'boots') return set4Boots;
    if (set4?.legs && layer.slot === 'legs') return set4Legs;
    if (set4?.armor && layer.slot === 'armor') return set4Armor;
    if (set4?.head && layer.slot === 'head') return set4Head;
    if (set5?.boots && layer.slot === 'boots') return set5Boots;
    if (set5?.legs && layer.slot === 'legs') return set5Legs;
    if (set5?.armor && layer.slot === 'armor') return set5Armor;
    if (set5?.head && layer.slot === 'head') return set5Head;
    if (nuvelor?.boots && layer.slot === 'boots') return nuvelorCrocs;
    if (nuvelor?.legs && layer.slot === 'legs') return nuvelorLegs;
    if (nuvelor?.armor && layer.slot === 'armor') return nuvelorArmor;
    if (night?.boots && layer.slot === 'boots') return nightBoots;
    if (night?.legs && layer.slot === 'legs') return nightLegs;
    if (night?.armor && layer.slot === 'armor') return nightArmor;
    return layerOverrides?.[layer.slot] || layer.src;
  };
  const selectedHandsLayer = set4?.hands
    ? set4Hands
    : set5?.hands
      ? set5Hands
      : nuvelor?.hands
        ? nuvelorHands
        : night?.hands
          ? nightHands
          : newbiePackII?.hands
            ? newbiePack2Hands
            : layerOverrides?.hands || hands;
  const renderHands = () => halloween.hands ? null : halloween.weapon ? (
    slotVisible('hands') ? <HeroLayer src={selectedHandsLayer} alt="Selected gloves over pirate hook" /> : null
  ) : epicHandsWithFirstWeapon ? null : newbiePackII?.weapon && newbiePackII?.hands ? (
    <HeroLayer src={newbiePack2WeaponHandsExtra} alt="Newbie Pack II weapon with both gloves" />
  ) : nightHandsWithNewbiePackWeapon ? (
    <HeroLayer src={nightHandsWithNewbiePackWeaponArt} alt="Set 2 gloves with Newbie Pack weapon" />
  ) : newbiePackII?.weapon ? (
    <>
      <HeroLayer src={newbiePack2WeaponHands} alt="Newbie Pack II weapon" />
      {slotVisible('hands') ? <HeroLayer src={selectedHandsLayer} alt="Selected gloves with Newbie Pack II weapon" /> : null}
    </>
  ) : newbiePackII?.hands ? (
    <>
      {newbiePackHandsWithFirstWeapon ? <HeroLayer src={newbiePackHandsWithFirstWeaponArt} alt="Newbie Pack gloves with first weapon" /> : newbiePackHandsWithSecondWeapon ? <HeroLayer src={newbiePackHandsWithSecondWeaponArt} alt="Newbie Pack gloves with Set 2 weapon" /> : newbiePackHandsWithThirdWeapon ? <HeroLayer src={newbiePackHandsWithThirdWeaponArt} alt="Newbie Pack gloves with NUVELOR weapon" style={{ transform: 'translate(0.5%, -2%)' }} /> : <>
        {slotVisible('weapon') ? <HeroLayer src={layerOverrides?.weapon || weapon} alt="Hero weapon" /> : null}
        <HeroLayer src={newbiePack2Hands} alt="Newbie Pack II gloves" />
      </>}
    </>
  ) : nightHandsWithFirstWeapon ? (
    <HeroLayer src={nightHandsWeaponOne} alt="Set 2 gloves with first weapon" />
  ) : night?.weapon && !night?.hands ? (
    <>
      <HeroLayer src={handLayer} alt="Set 2 weapon hand" />
      {slotVisible('hands') ? <HeroLayer src={selectedHandsLayer} alt="Selected gloves over Set 2 weapon" /> : null}
    </>
  ) : night?.hands && !night?.weapon ? (
    <>
      {slotVisible('weapon') ? <HeroLayer src={layerOverrides?.weapon || weapon} alt="Hero weapon" /> : null}
      {!set2HandsUnderSet4Armor ? <HeroLayer src={nightHands} alt="Night exterminator gloves" /> : null}
    </>
  ) : (hasNuvelorHands || hasNightHands) ? (
    <HeroLayer src={handLayer} alt="Night exterminator hands and weapon" />
  ) : (
    <>
      {slotVisible('weapon') ? <HeroLayer src={layerOverrides?.weapon || weapon} alt="Hero weapon" /> : null}
          {slotVisible('hands') ? <HeroLayer src={selectedHandsLayer} alt="Hero bracers" /> : null}
    </>
  );

  const skeletonSlots = Object.keys(skeletonBodyRegions).filter(slot =>
    (!visibleSlots || visibleSlots[slot]) && layerOverrides?.[slot]?.startsWith('/skeleton-bp/'));
  if (Object.values(layerOverrides || {}).some(value => typeof value === 'string' && ((SHKRABAN_ENABLED && value.startsWith('/shkraban/hero/')) || (import.meta.env.DEV && (value.startsWith('/local-rabbit/') || value === '/local-tv/head.svg'))))) {
    const fallback = { legs: trousers, boots, armor, hands, weapon, head };
    return <div ref={sceneRoot} className={`relative aspect-[284/950] ${className}`}><HeroLayer src={baseOverride || heroBase} alt="Hero body" skeletonSlots={skeletonSlots} hideHead={layerOverrides?.hideBaseHead && slotVisible('head')} /><svg viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 h-full w-full select-none overflow-visible" aria-label="Робозаєць — локальна примірка">

      {['legs', 'hands', 'armor', 'boots', 'weapon', 'head'].filter(slot => !visibleSlots || visibleSlots[slot]).map(slot => {
        if (slot === 'head' && (layerOverrides?.localTvHead || layerOverrides?.head === '/local-tv/head.svg' || layerOverrides?.head === '/shkraban/hero/head.svg')) return <LocalTvHead key={slot} active={animationsActive} channelIndex={layerOverrides.tvChannelIndex} onChannelChange={layerOverrides.onTvChannelChange} auto={layerOverrides.tvAuto !== false} />;
        const src = layerOverrides?.[slot] || fallback[slot];
        const local = src?.startsWith('/local-rabbit/') || src?.startsWith('/shkraban/hero/');
        return <image key={slot} href={src} x="0" y={local ? -224 : 0} width="500" height={local ? 1120 : 896} />;
      })}
      {(!visibleSlots || visibleSlots.head) && !layerOverrides?.localTvHead && layerOverrides?.head?.startsWith('/local-rabbit/') ? <LocalRabbitHeadEffects active={animationsActive} /> : null}
      {layerOverrides?.localTvPet ? layerOverrides.localTvPetKind === 'toaster' ? <LocalToasterPet key={layerOverrides.localTvPetReset || 0} active={animationsActive} /> : <image className={animationsActive ? 'local-tv-pet-idle' : ''} href="/local-tv/pet-tv-robot.webp" x="320" y="650" width="200" height="245" preserveAspectRatio="xMidYMax meet" aria-label="TV-робот — пет сету Шкрябана" /> : null}
    </svg>{animationsActive && <SkeletonFlames slots={skeletonSlots} weapon={(!visibleSlots || visibleSlots.weapon) && layerOverrides?.weapon?.startsWith('/skeleton-bp/')} />}{(!visibleSlots || visibleSlots.weapon) && enhancementLevel >= 4 && ['/local-rabbit/weapon.webp','/shkraban/hero/weapon.webp'].includes(layerOverrides?.weapon) ? <WeaponEnhancementEffect src="/shkraban/hero/weapon-aligned.svg" level={enhancementLevel} paused={!animationsActive} /> : null}</div>;
  }
  return (
    <WeaponEnhancementContext.Provider value={{variant:layerOverrides?.weaponEnhancementVariant||'base',level:enhancementLevel,paused:!animationsActive,visible:!visibleSlots||visibleSlots.weapon}}><div ref={sceneRoot} className={`relative aspect-[284/950] ${className}`}>
      {layerOverrides?.rearWeapon && (!visibleSlots || visibleSlots.weapon) ? <HeroLayer src={layerOverrides.rearWeapon} alt="Hero back weapon" className={animationsActive && layerOverrides?.anubisEffects ? 'anubis-rear-weapon' : ''} /> : null}
      <AlignedCanvas>{layerOverrides?.bpLegendaryAura && <LegendaryAura/>}<LegendaryBack enhancementLevel={enhancementLevel} enhancementVariant={layerOverrides?.weaponEnhancementVariant||'base'} enhancementPaused={!animationsActive} slots={layerOverrides?.separateLegendaryCape ? {...legendary,armor:false} : legendary}/></AlignedCanvas>
      {layerOverrides?.bpEpicAura ? <EpicDemonicAura /> : null}
      {layerOverrides?.bpEpicPet ? <EpicRaven className="absolute inset-0 h-full w-full" /> : null}
      {nonArmorLayers.map((layer) => (
        <HeroLayer key={layer.id} src={layerSource(layer)} alt={layer.alt} skeletonSlots={layer.slot === 'base' ? skeletonSlots : undefined} hideLeftHand={layer.slot === 'base' && (newPigClubCombo || (registeredCombo && !registeredCombo.right))} hideRightHand={layer.slot === 'base' && registeredCombo?.right} hideHead={layer.slot === 'base' && layerOverrides?.hideBaseHead && slotVisible('head')} />
      ))}
      {animationsActive && halloween.legs ? <HeroLayer src={halloweenPantsAnim} alt="" aria-hidden="true" className="halloween-acid-glow" /> : null}
      {halloween.hands && !pirateHandsWithThirdWeapon ? <HeroLayer src={layerOverrides.hands} alt="Halloween hands" /> : null}
      {epic?.hands ? <HeroLayer src={epicHandsWithFirstWeapon ? epicHandsWithFirstWeaponArt : EPIC_SET_ART.hands} alt={epicHandsWithFirstWeapon ? 'Epic Battle Pass gloves with first weapon' : 'Epic Battle Pass gloves under jacket'} /> : null}
      {legendary.hands && !legendaryHandsWithThirdWeapon && <HeroLayer src={LEGENDARY_SET_ART.hands} alt="Legendary gloves"/>}
      {set4?.armor ? <>
        <HeroLayer src={set4ArmorBack} alt="Set 4 back tanks" />
        <HeroLayer src={set4ArmorBackEye} alt="Set 4 back eye" />
        <MaskedPupil src={set4ArmorBackPupil} maskSrc={set4ArmorBackEye} point={set4Pupil} alt="Set 4 moving pupil" />
      </> : null}
      {set5?.armor ? (
        <AlignedCanvas className="set5-black-hole-canvas">
          <HeroLayer src={set5BlackHole} alt="Rotating black hole under set 5 armor" className="set5-black-hole" />
        </AlignedCanvas>
      ) : null}
      {set2HandsUnderSet4Armor ? <HeroLayer src={nightHands} alt="Set 2 gloves under Set 4 armor" /> : null}
      {set5HandsUnderSet4Armor ? <HeroLayer src={set5Hands} alt="Set 5 gloves under Set 4 armor" /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nuvelorHandsWithFirstWeapon ? <HeroLayer src={nuvelorHandsWeaponOne} alt="NUVELOR gloves with first weapon" /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nuvelor?.hands && !nuvelor?.weapon && !nuvelorHandsWithFirstWeapon && !nuvelorHandsWithSecondWeapon && slotVisible('weapon') ? <HeroLayer src={layerOverrides?.weapon || weapon} alt="Hero weapon" /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nuvelor?.hands && !nuvelorHandsWithFirstWeapon && !nuvelorHandsWithSecondWeapon && !handsWithThirdWeapon ? <HeroLayer src={nuvelorHands} alt="NUVELOR hands" /> : null}
      {armorLayer && !set4?.armor ? <HeroLayer src={layerSource(armorLayer)} alt={armorLayer.alt} /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && night?.armor && !hasNuvelorHands ? renderHands() : null}
      {animationsActive && halloween.armor ? <HeroLayer src={halloweenArmorHeart} alt="" aria-hidden="true" className="halloween-heartbeat" /> : null}
      {epic?.armor ? <EpicArmorEffects /> : null}
      {epic?.boots ? <EpicBootEffects /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nuvelor?.weapon && !nightHandsWithThirdWeapon && !handsWithThirdWeapon && !newbiePackHandsWithThirdWeapon ? <HeroLayer src={nuvelorWeapon} alt="NUVELOR weapon" /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nightHandsWithThirdWeapon ? <>
        <HeroLayer src={nightHandsWithThirdWeaponArt} alt="Set 2 gloves with NUVELOR weapon" />
        {slotVisible('hands') ? <svg role="img" aria-label="Set 2 free-hand glove" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
          <svg x="250" y="0" width="250" height="896" viewBox="250 0 250 896" overflow="hidden"><image href={nightHands} width="500" height="896" /></svg>
        </svg> : null}
      </> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nuvelorHandsWithSecondWeapon ? <HeroLayer src={nuvelorHandsWithSecondWeaponArt} alt="NUVELOR gloves with Set 2 weapon" /> : null}
      {!hideFirstHandsWithSet4Armor && !hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && firstHandsWithThirdWeapon ? <HeroLayer src={firstHandsWithThirdWeaponArt} alt="Set 1 gloves with NUVELOR weapon" /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && nuvelorHandsWithThirdWeapon ? <HeroLayer src={nuvelorHandsWithThirdWeaponArt} alt="NUVELOR gloves with NUVELOR weapon" /> : null}
      {anubisHandsWithThirdWeapon && slotVisible('hands') && slotVisible('weapon') ? <PigClubHands original={anubisOriginalHandsArt} grip={anubisHandsWithPigClubArt} x={13} y={-8} /> : null}
      {legendaryHandsWithThirdWeapon && (!visibleSlots || (visibleSlots.hands && visibleSlots.weapon)) ? <PigClubHands original={LEGENDARY_SET_ART.hands} grip={legendaryPigClubArt} x={50} y={80} width={450} height={806.4} /> : null}
      {pirateHandsWithThirdWeapon && (!visibleSlots || (visibleSlots.hands && visibleSlots.weapon)) ? <PigClubHands original={pirateOriginalHandsArt} grip={piratePigClubArt} x={15} y={10} /> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && newbiePackHandsWithThirdWeapon ? <HeroLayer src={newbiePackHandsWithThirdWeaponArt} alt="Newbie Pack gloves with NUVELOR weapon" style={{ transform: 'translate(0.5%, -2%)' }} /> : null}
      {!hideFirstHandsWithSet4Armor && !hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && firstHandsWithThirdWeapon ? <HeroLayer src={selectedHandsLayer} alt="Set 1 gloves over NUVELOR weapon combo" /> : null}
      {hasSet5HandsOrWeapon ? (
        <>
          {set5?.weapon ? <HeroLayer src={set4HandsWithSet5Weapon ? set4HandsWithFifthWeaponArt : newbiePackHandsWithSet5Weapon ? newbiePackHandsWithFifthWeaponArt : nuvelorHandsWithSet5Weapon ? nuvelorHandsWithSet5WeaponArt : set5WeaponWithHands} alt={set4HandsWithSet5Weapon ? 'Set 4 gloves with Set 5 weapon' : newbiePackHandsWithSet5Weapon ? 'Newbie Pack gloves with Set 5 weapon' : nuvelorHandsWithSet5Weapon ? 'Set 3 gloves with Set 5 weapon' : set5?.hands ? 'Set 5 gloves with weapon' : 'Set 5 weapon hand'} /> : null}
          {!set5?.weapon && set5HandsWithFirstWeapon ? <HeroLayer src={set5HandsWithFirstWeaponArt} alt="Set 5 gloves with first weapon" /> : null}
          {!set5?.weapon && !set5HandsWithFirstWeapon && set5HandsWithSecondWeapon ? <HeroLayer src={set5HandsWithSecondWeaponArt} alt="Set 5 gloves with Set 2 weapon" /> : null}
          {!set5?.weapon && !set5HandsWithFirstWeapon && !set5HandsWithSecondWeapon && set5HandsWithThirdWeapon ? <HeroLayer src={set5HandsWithThirdWeaponArt} alt="Set 5 gloves with NUVELOR weapon" /> : null}
          {!set5?.weapon && set5?.hands && !set5HandsWithFirstWeapon && !set5HandsWithSecondWeapon && !set5HandsWithThirdWeapon && slotVisible('weapon') ? <HeroLayer src={layerOverrides?.weapon || weapon} alt="Hero weapon" /> : null}
          {!set5?.weapon && set5?.hands && !set5HandsWithFirstWeapon && !set5HandsWithSecondWeapon && !set5HandsWithThirdWeapon && !set5HandsUnderSet4Armor ? <HeroLayer src={set5Hands} alt="Set 5 hands" /> : null}
          {set5?.weapon && !set5?.hands && !set4HandsWithSet5Weapon && !nuvelorHandsWithSet5Weapon && !newbiePackHandsWithSet5Weapon && slotVisible('hands') ? <HeroLayer src={selectedHandsLayer} alt="Selected gloves with Set 5 weapon" /> : null}
          {set5Laser ? <Set5Laser src={set5Laser} alt="Set 5 cyan laser" /> : null}
        </>
      ) : null}
      {hasSet4HandsOrWeapon ? <>
        {set4?.weapon ? <>
          <HeroLayer
            src={set2HandsWithSet4WeaponActive ? set2HandsWithSet4Weapon : set4?.hands ? set4WeaponWithHands : set4WeaponWithoutHands}
            alt={set2HandsWithSet4WeaponActive ? 'Set 2 gloves with Set 4 acid weapon' : set4?.hands ? 'Set 4 acid weapon with gloves' : 'Set 4 acid weapon'}
          />
          {set4?.hands ? <Set4Glow src={set4WeaponWithHandsAnim} maskSrc={set4WeaponWithHands} /> : <Set4Glow src={set4WeaponWithoutHandsAnim} maskSrc={set4WeaponWithoutHands} className="set4-acid-glow" />}
          {set4?.hands ? <Set4Glow src={set4WeaponWithHandsAcid} maskSrc={set4WeaponWithHands} className="set4-acid-glow" /> : null}
          {set4?.hands ? <Set4Bubbles maskSrc={set4WeaponWithHands} positions={[[24, 61, -.1, 4, 1.4], [28, 63, -.5, 5, 1.75], [31, 65, -1, 3, 1.5], [26, 67, -1.4, 4, 1.9], [22, 64, -1.8, 3, 1.6], [30, 60, -2.2, 4, 1.7], [27, 69, -2.6, 3, 1.45]]} /> : null}
        </> : set4HandsWithSet5Weapon ? null : set4HandsWithFirstWeapon ? (
          <HeroLayer src={set4HandsWithFirstWeaponArt} alt="Set 4 gloves with first weapon" />
        ) : set4HandsWithSecondWeapon ? (
          <HeroLayer src={set4HandsWithSecondWeaponArt} alt="Set 4 gloves with Set 2 weapon" />
        ) : set4HandsWithThirdWeapon ? (
          <HeroLayer src={set4HandsWithThirdWeaponArt} alt="Set 4 gloves with NUVELOR weapon" />
        ) : <>
          {slotVisible('weapon') ? <HeroLayer src={layerOverrides?.weapon || weapon} alt="Hero weapon" /> : null}
          <HeroLayer src={set4Hands} alt="Set 4 gloves" />
          <Set4Glow src={set4HandsAnim} maskSrc={set4Hands} />
          <Set4Bubbles maskSrc={set4Hands} positions={[[30, 50, -.1, 4, 1.5], [34, 53, -.5, 5, 1.85], [37, 55, -1, 3, 1.45], [32, 58, -1.5, 4, 1.7], [35, 51, -2, 3, 1.6], [68, 50, -.3, 4, 1.65], [65, 53, -.8, 5, 1.9], [62, 55, -1.3, 3, 1.5], [67, 58, -1.8, 4, 1.75], [64, 51, -2.4, 3, 1.45]]} />
        </>}
        {set4?.weapon && !set4?.hands && !set2HandsWithSet4WeaponActive && slotVisible('hands') ? <HeroLayer src={selectedHandsLayer} alt="Selected gloves over Set 4 weapon" /> : null}
      </> : null}
      {!hasSet5HandsOrWeapon && !hasSet4HandsOrWeapon && !hasNuvelorHands && !night?.armor ? renderHands() : null}
      {set4?.armor && armorLayer ? <>
        <HeroLayer src={set4Armor} alt="Set 4 armor over weapon combinations" />
        <Set4Glow src={set4ArmorAnim} maskSrc={set4Armor} />
        <Set4Bubbles maskSrc={set4Armor} positions={[[46, 35, -.1, 4, 1.55], [52, 38, -.7, 5, 1.85], [56, 34, -1.2, 3, 1.45], [43, 41, -.4, 4, 1.7], [49, 43, -1.8, 5, 2.1], [54, 45, -1.1, 3, 1.6], [47, 39, -2.3, 4, 1.9], [58, 40, -.9, 3, 1.5], [41, 37, -1.6, 4, 2], [51, 33, -2.7, 3, 1.65]]} />
        <Set4Blink />
      </> : null}
      {set4?.boots ? <>
        <Set4Glow src={set4BootsAnim} maskSrc={set4Boots} />
        <Set4Bubbles maskSrc={set4Boots} positions={[[30, 91, -.1, 4, 1.5], [35, 88, -.5, 5, 1.85], [40, 93, -1, 3, 1.45], [46, 90, -1.5, 4, 1.7], [53, 92, -2, 3, 1.6], [59, 89, -.3, 4, 1.65], [65, 92, -.8, 5, 1.9], [70, 90, -1.3, 3, 1.5], [55, 86, -1.8, 4, 1.75], [38, 86, -2.4, 3, 1.45]]} />
      </> : null}
      {set4?.legs ? <>
        <Set4Glow src={set4LegsAnim} maskSrc={set4Legs} />
        <Set4Bubbles maskSrc={set4Legs} positions={[[43, 53, -.1, 4, 1.55], [48, 56, -.6, 5, 1.85], [55, 59, -1.1, 3, 1.45], [45, 62, -1.6, 4, 1.7], [53, 65, -2.1, 3, 1.6], [47, 68, -.4, 4, 1.65], [56, 71, -.9, 5, 1.9], [43, 74, -1.4, 3, 1.5], [51, 76, -1.9, 4, 1.75], [58, 63, -2.5, 3, 1.45]]} />
      </> : null}
      {nuvelorCowPulse ? <HeroLayer key={`nuvelor-cow-${nuvelorCowPulse}`} src={nuvelorCow} alt="NUVELOR canister glow" className="nuvelor-cow-glow" /> : null}
      {smokePulse ? <HeroLayer key={`night-smoke-${smokePulse}`} src={nightSmoke} alt="Night exterminator smoke" className="night-disinfector-smoke" /> : null}
      {aeroPulse ? (
        <>
          <HeroLayer key={`night-aero-one-${aeroPulse}`} src={nightAero1} alt="Aerosol burst" className="night-disinfector-aero-one" />
          <HeroLayer key={`night-aero-two-${aeroPulse}`} src={nightAero2} alt="Aerosol burst" className={aeroPulse % 2 ? 'night-disinfector-aero-two night-disinfector-aero-delayed' : 'night-disinfector-aero-two'} />
        </>
      ) : null}

      {epic?.weapon ? <EpicWeapon enhancementVariant={layerOverrides?.weaponEnhancementVariant||'base'} enhancementLevel={enhancementLevel} enhancementPaused={!animationsActive} withHands={Boolean(epic?.hands)} /> : null}
      {slotVisible('head') ? <HeroLayer src={halloween.head ? halloweenFullHead : legendary?.head ? LEGENDARY_SET_ART.head : epic?.head ? EPIC_SET_ART.head : set4?.head ? set4Head : set5?.head ? set5Head : nuvelor?.head ? nuvelorHead : night?.head ? nightHead : layerOverrides?.head || head} offsetY={halloween.head ? -54 : 0} alt="Hero headgear" /> : null}
      {animationsActive && halloween.head && slotVisible('head') ? <>
        <HeroLayer src={halloweenHeadEyes} alt="" aria-hidden="true" className="halloween-eye-fire" />
        <HalloweenRespiratorBreath />
        <HeroLayer src={halloweenHeadAnim} alt="" aria-hidden="true" className="halloween-acid-glow" />
      </> : null}
      {newbiePackII?.head && slotVisible('head') ? <>
        <HeroLayer src={newbiePack2HeadEye} alt="Newbie Pack II burning eyes glow" className="newbie-pack2-hellfire-eyes-aura" />
        <HeroLayer src={newbiePack2HeadEye} alt="" className="newbie-pack2-hellfire-eyes" />
      </> : null}
      {set4?.head ? <>
        <Set4Glow src={set4HeadAnim} maskSrc={set4Head} />
        <Set4Bubbles maskSrc={set4Head} positions={[[44, 8, -.1, 4, 1.45], [49, 10, -.5, 5, 1.8], [54, 8, -.9, 3, 1.5], [46, 12, -1.3, 4, 1.7], [52, 13, -1.7, 3, 1.55], [50, 6, -2.1, 4, 1.9], [57, 11, -2.5, 3, 1.6], [43, 14, -2.9, 4, 1.75]]} />
        <AlignedCanvas className="set4-fog-clip"><Set4Fog /></AlignedCanvas>
      </> : null}
      {set5?.head ? (
        <>
          <HeroLayer src={set5HeadAntenna} alt="Set 5 antenna signal" className="set5-antenna-signal" />
          <HeroLayer src={set5HeadEye} alt="Set 5 helmet eye" />
          <MaskedPupil src={set5HeadPupil} maskSrc={set5HeadEye} point={set5Pupil} alt="Set 5 moving pupil" />
          <HeroLayer src={set5HeadLight} alt="Set 5 yellow warning light" className="set5-yellow-light" />
        </>
      ) : null}
      {nuvelor?.head ? (
        <>
          <HeroLayer src={nuvelorBackEye1} alt="NUVELOR left eye" />
          <HeroLayer src={nuvelorBackEye2} alt="NUVELOR right eye" />
          <NuvelorLensFog />
          <MaskedPupil src={nuvelorPupil1} maskSrc={nuvelorBackEye2} point={leftPupil} alt="NUVELOR left pupil" />
          <MaskedPupil src={nuvelorPupil2} maskSrc={nuvelorBackEye1} point={rightPupil} alt="NUVELOR right pupil" />
        </>
      ) : null}
      {nuvelorMoneyPulse ? <HeroLayer key={`nuvelor-money-${nuvelorMoneyPulse}`} src={nuvelorMoney} alt="NUVELOR coin glow" className="nuvelor-money-glow" /> : null}
      {nuvelorCowPulse ? <NuvelorBubbles /> : null}
      {nuvelorSmokePulse ? <NuvelorSmoke key={`nuvelor-smoke-${nuvelorSmokePulse}`} /> : null}
      {epic?.head ? <EpicHeadEffects /> : null}

      {night?.head ? ELECTRIC_LAYERS.map((src, index) => (
        electricPulses[index] ? <HeroLayer key={`night-electric-${index}-${electricPulses[index]}`} src={src} alt="Electric impulse" className="night-disinfector-electric" /> : null
      )) : null}

      {registeredCombo && (!visibleSlots || (visibleSlots.hands && visibleSlots.weapon)) ? <RegisteredWeaponCombo {...registeredCombo} /> : null}
      <AlignedCanvas><LegendaryGlow slots={registeredCombo ? {...legendary, hands: Boolean(layerOverrides?.bpLegendary?.hands)} : legendary}/></AlignedCanvas>
      {animationsActive && <SkeletonFlames slots={skeletonSlots} weapon={(!visibleSlots || visibleSlots.weapon) && layerOverrides?.weapon?.startsWith('/skeleton-bp/')} />}
      <HeroAccessory src={layerOverrides?.accessory} />
      {halloween.weapon && (!visibleSlots || visibleSlots.weapon) ? (
        <svg role="img" aria-label="Pirate hook over gloves" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
          <svg x="0" y="0" width="250" height="896" viewBox="0 0 250 896" overflow="hidden">
            <image href={layerOverrides.weapon} width="500" height="896" />
            {animationsActive ? <image href={halloweenWeaponAnim} width="500" height="896" className="halloween-acid-glow" /> : null}
          </svg>
        </svg>
      ) : null}
      {animationsActive && layerOverrides?.anubisEffects ? <AnubisSetEffects key={layerOverrides?.accessory ? 'crown' : 'head'} slots={visualSet(layerOverrides.anubisSlots || visibleSlots || {head:true,armor:true,hands:true,weapon:true})} frontMask={layerOverrides.anubisFrontMask} /> : null}
      <style>{`
          @keyframes halloween-heartbeat { 0%, 100% { opacity: .72; transform: scale(1); } 12% { opacity: 1; transform: scale(1.08); } 24% { opacity: .82; transform: scale(1.02); } 36% { opacity: 1; transform: scale(1.1); } 52% { opacity: .72; transform: scale(1); } }
          @keyframes halloween-acid-glow { 0%, 100% { opacity: .45; filter: brightness(.9) drop-shadow(0 0 1px #48ff75); } 50% { opacity: 1; filter: brightness(1.55) drop-shadow(0 0 7px #38ff6f); } }
          @keyframes halloween-eye-fire { 0%, 100% { opacity: .6; filter: brightness(1) drop-shadow(0 0 2px #ff2400); } 45% { opacity: 1; filter: brightness(1.8) drop-shadow(0 0 8px #ff1b00) drop-shadow(0 0 14px #8d0000); } }
          @keyframes halloween-respirator { 0%, 38%, 100% { opacity: 0; transform: translate(0, 0) scale(.45); } 48% { opacity: .9; } 78% { opacity: .18; transform: translate(22px, 3px) scale(1.55); } }
          .halloween-heartbeat { animation: halloween-heartbeat 1.15s ease-in-out infinite; transform-origin: 51% 34%; }
          .halloween-acid-glow { animation: halloween-acid-glow 2.1s ease-in-out infinite; }
          .halloween-eye-fire { animation: halloween-eye-fire 1.45s ease-in-out infinite; }
          .halloween-breath { position: absolute; left: 57%; top: 19%; width: 10px; height: 6px; border-radius: 999px; background: rgba(74,255,117,.72); filter: blur(2px) drop-shadow(0 0 5px #30ff68); animation: halloween-respirator 3.2s ease-out infinite; }
          .halloween-breath-two { animation-delay: .14s; width: 8px; height: 5px; }
          .halloween-breath-three { animation-delay: .28s; width: 6px; height: 4px; }
        @keyframes night-disinfector-smoke { 0% { opacity: 0; transform: translate(0, 8px) scale(.98); } 16% { opacity: .72; } 65% { opacity: .52; transform: translate(-3px, -14px) scale(1.02); } 100% { opacity: 0; transform: translate(4px, -24px) scale(1.04); } }
        @keyframes night-disinfector-aero { 0% { opacity: 0; transform: translate(-10px, 1px) scale(.9); } 12% { opacity: .9; } 78% { opacity: .35; transform: translate(14px, -2px) scale(1.12); } 100% { opacity: 0; transform: translate(22px, -3px) scale(1.17); } }
        @keyframes night-disinfector-electric { 0% { opacity: 0; filter: brightness(1) drop-shadow(0 0 0 rgba(57,217,255,0)); } 16% { opacity: 1; filter: brightness(1.8) drop-shadow(0 0 7px #39d9ff) drop-shadow(0 0 15px rgba(57,217,255,.75)); } 46% { opacity: .38; filter: brightness(1.2) drop-shadow(0 0 3px #39d9ff); } 67% { opacity: .88; filter: brightness(1.65) drop-shadow(0 0 9px #39d9ff); } 100% { opacity: 0; filter: brightness(1) drop-shadow(0 0 0 rgba(57,217,255,0)); } }
        @keyframes nuvelor-money-glow { 0%, 100% { opacity: .52; filter: brightness(1) drop-shadow(0 0 1px rgba(255,205,69,.2)); } 50% { opacity: 1; filter: brightness(1.45) drop-shadow(0 0 5px rgba(255,196,45,.95)) drop-shadow(0 0 11px rgba(255,173,32,.6)); } }
        @keyframes nuvelor-cow-glow { 0%, 100% { opacity: .72; filter: brightness(1) drop-shadow(0 0 2px rgba(72,212,255,.35)); } 50% { opacity: 1; filter: brightness(1.22) drop-shadow(0 0 8px rgba(58,205,255,.9)) drop-shadow(0 0 17px rgba(58,205,255,.48)); } }
        @keyframes nuvelor-bubble-rise { 0% { opacity: 0; transform: translate(-50%, 12px) scale(.55); } 14% { opacity: .78; } 58% { opacity: .62; transform: translate(calc(-50% + 4px), -12px) scale(1); } 100% { opacity: 0; transform: translate(calc(-50% - 5px), -34px) scale(.74); } }
        @keyframes nuvelor-lens-fog { 0%, 100% { opacity: .38; } 24% { opacity: .62; } 52% { opacity: .9; } 76% { opacity: .72; } }
        @property --nuvelor-smoke-progress { syntax: '<percentage>'; inherits: false; initial-value: 42%; }
        @property --nuvelor-smoke-band { syntax: '<percentage>'; inherits: false; initial-value: 4%; }
        @keyframes nuvelor-smoke-left { 0% { opacity: 0; transform: translateX(0) scale(.9); --nuvelor-smoke-progress: 42%; --nuvelor-smoke-band: 2.5%; } 14% { opacity: .94; transform: translateX(-2px) scale(.94); --nuvelor-smoke-progress: 42%; --nuvelor-smoke-band: 4%; } 78% { opacity: .55; transform: translateX(-14px) scale(1.1); --nuvelor-smoke-progress: 12%; --nuvelor-smoke-band: 5.5%; } 94% { opacity: 0; transform: translateX(-22px) scale(1.17); --nuvelor-smoke-progress: 8%; --nuvelor-smoke-band: 4%; } 97% { opacity: 0; transform: translateX(-22px) scale(1.17); --nuvelor-smoke-progress: 8%; --nuvelor-smoke-band: 4%; } 100% { opacity: 0; transform: translateX(0) scale(.9); --nuvelor-smoke-progress: 42%; --nuvelor-smoke-band: 2.5%; } }
        @keyframes nuvelor-smoke-right { 0% { opacity: 0; transform: translateX(0) scale(.9); --nuvelor-smoke-progress: 59%; --nuvelor-smoke-band: 2.5%; } 14% { opacity: .94; transform: translateX(2px) scale(.94); --nuvelor-smoke-progress: 59%; --nuvelor-smoke-band: 4%; } 80% { opacity: .55; transform: translateX(14px) scale(1.1); --nuvelor-smoke-progress: 89%; --nuvelor-smoke-band: 5.5%; } 95% { opacity: 0; transform: translateX(22px) scale(1.17); --nuvelor-smoke-progress: 93%; --nuvelor-smoke-band: 4%; } 97% { opacity: 0; transform: translateX(22px) scale(1.17); --nuvelor-smoke-progress: 93%; --nuvelor-smoke-band: 4%; } 100% { opacity: 0; transform: translateX(0) scale(.9); --nuvelor-smoke-progress: 59%; --nuvelor-smoke-band: 2.5%; } }
        .night-disinfector-smoke { animation: night-disinfector-smoke 2.2s ease-out both; }
        @keyframes set4-glow-pulse { 0%, 100% { opacity: .24; filter: brightness(1.12) saturate(1.15) drop-shadow(0 0 3px rgba(187,255,65,.28)); } 50% { opacity: .44; filter: brightness(1.34) saturate(1.3) drop-shadow(0 0 6px rgba(187,255,65,.48)); } }
        @keyframes set4-acid-pulse { 0%, 100% { opacity: .48; filter: brightness(1.2) saturate(1.25) drop-shadow(0 0 4px rgba(177,255,45,.42)); } 50% { opacity: .76; filter: brightness(1.48) saturate(1.42) drop-shadow(0 0 8px rgba(177,255,45,.68)); } }
        @keyframes set4-bubble-rise { 0% { opacity: 0; transform: translateY(8px) scale(.68); } 16% { opacity: .96; } 75% { opacity: .8; } 100% { opacity: 0; transform: translateY(-19px) scale(1.15); } }
        @keyframes set4-fog { 0%, 100% { opacity: .08; filter: blur(1.5px); } 48% { opacity: .32; filter: blur(3px); } 72% { opacity: .2; filter: blur(2px); } }
        @keyframes set4-blink-left { 0%, 84%, 100% { transform: scaleX(1); } 87% { transform: scaleX(.72); } 89% { transform: scaleX(.08); } 91% { transform: scaleX(.04); } 94% { transform: scaleX(.72); } 96% { transform: scaleX(1); } }
        @keyframes set4-blink-right { 0%, 84%, 100% { transform: scaleX(1); } 87% { transform: scaleX(.72); } 89% { transform: scaleX(.08); } 91% { transform: scaleX(.04); } 94% { transform: scaleX(.72); } 96% { transform: scaleX(1); } }
        .set4-glow { animation: set4-glow-pulse 4.8s ease-in-out infinite; }
        .set4-acid-glow { animation: set4-acid-pulse 3.6s ease-in-out infinite; }
        .set4-bubble { width: 4px; height: 4px; background: rgba(205,255,91,.86); border: 1px solid rgba(229,255,159,.95); box-shadow: 0 0 6px rgba(192,255,70,.98); animation: set4-bubble-rise 1.8s ease-in infinite; will-change: transform, opacity; }
        .set4-fog-clip { clip-path: ellipse(15% 8% at 50% 10%); }
        .set4-fog-canvas { animation: set4-fog 7s ease-in-out infinite; }
        .set4-fog-fill { background: radial-gradient(ellipse, rgba(241,245,208,.46), rgba(211,221,172,.18) 65%, transparent 100%); filter: blur(2px); }
        .set4-blink-canvas { overflow: hidden; }
        .set4-blink-half { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
        .set4-blink-left { clip-path: inset(0 48.4% 0 0); transform-origin: 51.6% 50%; animation: set4-blink-left 5.2s ease-in-out infinite; will-change: transform; }
        .set4-blink-right { clip-path: inset(0 0 0 51.6%); transform-origin: 51.6% 50%; animation: set4-blink-right 5.2s ease-in-out infinite; will-change: transform; }
        @keyframes set5-black-hole-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes set5-antenna-signal { 0%, 100% { opacity: .25; filter: brightness(1); } 8% { opacity: 1; filter: brightness(2.2) drop-shadow(0 0 5px #fff); } 13% { opacity: .35; } 18% { opacity: 1; filter: brightness(2) drop-shadow(0 0 4px #fff); } 27% { opacity: .3; } 30%, 76% { opacity: .28; filter: brightness(1); } 80% { opacity: 1; filter: brightness(2.2) drop-shadow(0 0 5px #fff); } 86% { opacity: .3; } }
        @keyframes set5-yellow-light { 0%, 65%, 100% { opacity: .12; filter: brightness(1); } 68% { opacity: 1; filter: brightness(2.5) drop-shadow(0 0 8px #ffe800); } 72% { opacity: .28; } 75% { opacity: .95; filter: brightness(2.2) drop-shadow(0 0 7px #ffe800); } 80% { opacity: .14; } }
        @property --set5-laser-reveal { syntax: "<percentage>"; inherits: false; initial-value: 62%; }
        @keyframes set5-laser-ignite { 0%, 10%, 100% { --set5-laser-reveal: 62%; opacity: 0; filter: brightness(1.2) hue-rotate(-8deg) drop-shadow(0 0 3px #20ddff); } 34% { --set5-laser-reveal: 94%; opacity: 1; filter: brightness(1.9) hue-rotate(-8deg) drop-shadow(0 0 10px #20ddff) drop-shadow(0 0 18px rgba(32,221,255,.75)); } 48% { --set5-laser-reveal: 94%; opacity: 1; filter: brightness(2.15) hue-rotate(-8deg) drop-shadow(0 0 13px #20ddff) drop-shadow(0 0 24px rgba(32,221,255,.9)); } 90% { --set5-laser-reveal: 62%; opacity: 0; filter: brightness(1.2) hue-rotate(-8deg) drop-shadow(0 0 3px #20ddff); } }
        .set5-black-hole { transform-origin: 50.9% 34.8%; animation: set5-black-hole-spin 8s linear infinite; mix-blend-mode: screen; }
        .set5-antenna-signal { animation: set5-antenna-signal 2.7s steps(1, end) infinite; }
        .set5-yellow-light { animation: set5-yellow-light 2.4s ease-in-out infinite; }
        .set5-laser { --set5-laser-reveal: 62%; -webkit-mask-image: linear-gradient(135deg, #000 0%, #000 calc(var(--set5-laser-reveal) - 2.2%), transparent var(--set5-laser-reveal)); mask-image: linear-gradient(135deg, #000 0%, #000 calc(var(--set5-laser-reveal) - 2.2%), transparent var(--set5-laser-reveal)); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; animation: set5-laser-ignite 2.2s ease-in-out both; }
        .night-disinfector-aero-one { animation: night-disinfector-aero .82s ease-out both; }
        .night-disinfector-aero-two { animation: night-disinfector-aero .82s ease-out both; }
        .night-disinfector-aero-delayed { animation-delay: .2s; }
        .night-disinfector-electric { animation: night-disinfector-electric .25s ease-out both; }
        .nuvelor-money-glow { animation: nuvelor-money-glow 2.6s ease-in-out both; }
        .nuvelor-cow-glow { animation: nuvelor-cow-glow 3.6s ease-in-out both; }
        .nuvelor-bubble { background: rgba(118,231,255,.72); box-shadow: 0 0 3px rgba(110,226,255,.95); animation: nuvelor-bubble-rise 3s ease-in-out infinite; }
        .nuvelor-lens-fog-canvas { animation: nuvelor-lens-fog 5.2s ease-in-out infinite; }
        .nuvelor-lens-fog-fill { background: radial-gradient(ellipse at center, rgba(232,239,235,.92) 0%, rgba(205,216,211,.74) 62%, rgba(183,196,190,.16) 100%); filter: blur(1.2px) saturate(.42); }
        .nuvelor-lens-fog-texture { opacity: .34; filter: brightness(2.2) grayscale(1) blur(.35px); }
        .nuvelor-smoke-left, .nuvelor-smoke-right { mask-repeat: no-repeat; mask-size: 100% 100%; mask-mode: alpha; -webkit-mask-repeat: no-repeat; -webkit-mask-size: 100% 100%; -webkit-mask-mode: alpha; }
        .nuvelor-smoke-left { animation: nuvelor-smoke-left .82s ease-out both; transform-origin: 42% 50%; mask-image: linear-gradient(to right, transparent calc(var(--nuvelor-smoke-progress) - var(--nuvelor-smoke-band)), #000 var(--nuvelor-smoke-progress), transparent calc(var(--nuvelor-smoke-progress) + var(--nuvelor-smoke-band))); -webkit-mask-image: linear-gradient(to right, transparent calc(var(--nuvelor-smoke-progress) - var(--nuvelor-smoke-band)), #000 var(--nuvelor-smoke-progress), transparent calc(var(--nuvelor-smoke-progress) + var(--nuvelor-smoke-band))); }
        .nuvelor-smoke-right { animation: nuvelor-smoke-right .82s ease-out both; transform-origin: 59% 50%; --nuvelor-smoke-progress: 59%; mask-image: linear-gradient(to right, transparent calc(var(--nuvelor-smoke-progress) - var(--nuvelor-smoke-band)), #000 var(--nuvelor-smoke-progress), transparent calc(var(--nuvelor-smoke-progress) + var(--nuvelor-smoke-band))); -webkit-mask-image: linear-gradient(to right, transparent calc(var(--nuvelor-smoke-progress) - var(--nuvelor-smoke-band)), #000 var(--nuvelor-smoke-progress), transparent calc(var(--nuvelor-smoke-progress) + var(--nuvelor-smoke-band))); }
        @media (prefers-reduced-motion: reduce) { .night-disinfector-smoke, .night-disinfector-aero-one, .night-disinfector-aero-two, .night-disinfector-electric, .nuvelor-money-glow, .nuvelor-cow-glow, .nuvelor-bubble, .nuvelor-lens-fog-canvas, .nuvelor-smoke-left, .nuvelor-smoke-right, .set5-black-hole, .set5-antenna-signal, .set5-yellow-light, .set5-laser { animation: none; opacity: .72; } .set5-laser { --set5-laser-reveal: 94%; } .set4-glow, .set4-acid-glow, .set4-bubble, .set4-fog-canvas { animation: none; } }
      `}</style>
    </div></WeaponEnhancementContext.Provider>
  );
}

export default memo(LayeredHero);
