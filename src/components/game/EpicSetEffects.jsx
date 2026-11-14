import RavenGasAura from './RavenGasAura';
import RavenVortex from './RavenVortex';
import { useId } from 'react';
import './epicSet.css';
import armor from '@/assets/hero/bp epic set/setbp1-armor.png';
import armorGlow from '@/assets/hero/bp epic set/setbp1-armor-anim.png';
import boots from '@/assets/hero/bp epic set/setbp1-boots.png';
import bootsShine from '@/assets/hero/bp epic set/setbp1-boots-anim.png';
import bottle from '@/assets/hero/bp epic set/setbp1-bottle.png';
import bottleGlow from '@/assets/hero/bp epic set/setbp1-bottle-anim.png';
import hands from '@/assets/hero/bp epic set/setbp1-hands.png';
import head from '@/assets/hero/bp epic set/setbp1-head.png';
import headSpark from '@/assets/hero/bp epic set/setbp1-head-anim.png';
import eyes from '@/assets/hero/bp epic set/setbp1-head-eyes-anim.png';
import legs from '@/assets/hero/bp epic set/setbp1-legs.png';
import pet from '@/assets/hero/bp epic set/setbp1-pet.png';
import petEye from '@/assets/hero/bp epic set/setbp1-pet-anim eye.png';
import weapon from '@/assets/hero/bp epic set/setbp1-weap.png';
import weaponGrip from '@/assets/hero/bp epic set/setbp1-weap1.png';
import weaponGripWithHands from '@/assets/hero/bp epic set/setbp1-weap1withweap.png';
import weaponGlow from '@/assets/hero/bp epic set/setbp1-weap-anim-acid.png';
import clawRight from '@/assets/hero/bp epic set/setbp1-weap-handanim.png';
import clawLeft from '@/assets/hero/bp epic set/setbp1-weap-handanimleft.png';
export const EPIC_SET_ART = { armor, armorGlow, boots, bootsShine, bottle, bottleGlow, hands, head, headSpark, eyes, legs, pet, petEye, weapon, weaponGrip, weaponGlow, clawRight, clawLeft };
const ImageLayer = ({ src, className = '', style }) => <img src={src} alt="" draggable="false" className={'bp-set-layer ' + className} style={style} />;
const Canvas = ({ children, className = '', style }) => <div className={'bp-set-canvas ' + className} style={style}>{children}</div>;
function Electricity({ head = false }) {
  return <svg viewBox="0 0 500 896" className={'bp-set-layer bp-set-electric ' + (head ? 'bp-set-head-electric' : '')} aria-hidden="true">
    <g fill="none" stroke="#75ecff" strokeWidth="1.3" strokeLinejoin="round">
      {head ? <><path d="M270 38 l-5 7 8 3 -9 7 5 5" /><path d="M278 44 l7 4 -9 5 5 6" /></> : <><path d="M275 482 l-5 8 7 5 -4 9 6 5" /><path d="M291 481 l6 6 -5 8 6 8 -8 6" /></>}
    </g>
  </svg>;
}
export function EpicArmorEffects() {
  return <>
    <ImageLayer src={armorGlow} className="bp-set-glow bp-set-acid" />
    <Canvas className="bp-set-bottle" style={{ transformOrigin: '56.8% 48.3%' }}>
      <ImageLayer src={bottle} />
      <ImageLayer src={bottleGlow} className="bp-set-glow bp-set-blue" />
      <Electricity />
    </Canvas>
  </>;
}
export function EpicBootEffects() {
  const mask = { maskImage: 'url("' + bootsShine + '")', WebkitMaskImage: 'url("' + bootsShine + '")' };
  return <Canvas className="bp-set-shine-mask" style={mask}><div className="bp-set-metal-shine" /></Canvas>;
}
export function EpicHeadEffects() {
  const clipId = useId();
  return <>
    <ImageLayer src={headSpark} className="bp-set-head-spark" />
    <Canvas>
      {[47, 56.4].map((left) => <div key={left} className="bp-set-eye-aura" style={{ left: left + '%', top: '11.05%' }}>
        <span className="bp-set-eye-mist" /><span className="bp-set-eye-mist bp-set-eye-mist-delayed" />
      </div>)}
      <svg viewBox="0 0 500 896" className="bp-set-layer bp-set-eyes" aria-hidden="true"><defs><clipPath id={clipId}><circle cx="235" cy="99" r="10"/><circle cx="282" cy="99" r="10"/></clipPath></defs><image href={eyes} width="500" height="896" clipPath={'url(#' + clipId + ')'}/><g fill="none" stroke="#ff2525" strokeWidth="2"><circle cx="235" cy="99" r="8"/><circle cx="282" cy="99" r="8"/></g></svg><Electricity head /></Canvas>
  </>;
}
export function EpicWeapon({ withHands = false }) {
  return <>
    <Canvas className="bp-set-weapon" style={{ transformOrigin: '33% 59.6%' }}>
      <ImageLayer src={weapon} />
      <ImageLayer src={weaponGlow} className="bp-set-glow bp-set-acid" />
      <ImageLayer src={clawRight} className="bp-set-claw-right" />
      <ImageLayer src={clawLeft} className="bp-set-claw-left" />
    </Canvas>
    <ImageLayer src={withHands ? weaponGripWithHands : weaponGrip} />
  </>;
}
export function EpicRaven({ className = '' }) {
  return <div className={'bp-set-pet ' + className} aria-label="Battle Pass raven"><ImageLayer src={pet} /><Canvas>
    <ImageLayer src={petEye} className="bp-set-raven-eye" style={{ transformOrigin: '23% 4.5%' }} />
    <svg viewBox="0 0 500 896" className="bp-set-layer" aria-hidden="true"><ellipse cx="115.5" cy="40" rx="6.5" ry="4.5" fill="#19201b" className="bp-set-raven-lid" /></svg>
  </Canvas></div>;
}

export function EpicDemonicAura() {
  return <Canvas className="bp-set-demonic-aura"><RavenGasAura /><RavenVortex /></Canvas>;
}
