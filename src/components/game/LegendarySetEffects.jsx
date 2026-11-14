import { useEffect, useRef } from 'react';
import { useAnimationsEnabled } from '@/lib/animationPreference';
import './legendarySet.css';
const glows = import.meta.glob('/src/assets/optimized/bp-legendary-glow/*.webp', { eager: true, query: '?url', import: 'default' });
const files = import.meta.glob('/src/assets/hero/bp leg set/*.png', { eager: true, query: '?url', import: 'default' });
const art = name => files['/src/assets/hero/bp leg set/setbp2-' + name + '.png'];
export const LEGENDARY_SET_ART = Object.fromEntries(['armor','boots','hands','head','legs','weap','armor-manta','oko','weap-zrachok'].map(key => [key === 'weap' ? 'weapon' : key, art(key)]));
const Layer = ({src,className=''}) => <img src={src} alt="" draggable={false} className={'legendary-layer '+className}/>;
export function LegendaryBack({ slots }) {
  return <>{slots.weapon && <><Layer src={art('weap')}/><Layer src={art('oko')}/><div className="legendary-pupil-clip"><Layer src={art('weap-zrachok')} className="legendary-pupil"/></div></>}{slots.armor && <Layer src={art('armor-manta')}/>}</>;
}
function LegendaryHandsFire() {
 const ref=useRef(null);const enabled=useAnimationsEnabled();
 useEffect(()=>{let dispose,cancelled=false;import('./legendaryFire.js').then(({startLegendaryHandsFire})=>{if(!cancelled)dispose=startLegendaryHandsFire(ref.current,enabled)});return()=>{cancelled=true;dispose?.()};},[enabled]);
 return <canvas ref={ref} width="250" height="448" className="legendary-layer" style={{opacity:.65}}/>;
}
export function LegendaryGlow({ slots }) {
  return <>
    {['armor','boots','legs','head','hands'].filter(slot=>slots[slot]).map((slot,index)=><img key={slot} src={glows['/src/assets/optimized/bp-legendary-glow/'+slot+'.webp']} alt="" className="legendary-layer legendary-glow" style={{animationDelay:`${-index*.8}s`,animationDuration:`${3.7+index*.4}s`}}/>)}
    {slots.hands && <LegendaryHandsFire/>}
    {slots.head && <div className="legendary-eye-fire" style={{maskImage:`url("${art('head-anim-yeys')}")`,WebkitMaskImage:`url("${art('head-anim-yeys')}")`}}/>}
  </>;
}
export function LegendaryAura() {
  const ref=useRef(null);const enabled=useAnimationsEnabled();
  useEffect(()=>{let dispose;let cancelled=false;import('./legendaryFire.js').then(({startLegendaryFire})=>{if(!cancelled)dispose=startLegendaryFire(ref.current,enabled)});return()=>{cancelled=true;dispose?.()};},[enabled]);
  return <canvas ref={ref} width="96" height="172" className="legendary-layer legendary-aura"/>;
}
