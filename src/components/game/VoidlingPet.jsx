import {memo} from 'react';
import body from '@/assets/hero/bp leg set/voidling-pet-body.png';
import fullArt from '@/assets/hero/bp leg set/voidling-pet.png';
import shard from '@/assets/hero/bp leg set/voidling-pet-shard.png';
import './voidlingPet.css';

function VoidlingPet({ className = '' }) {
  // Keep sprite composition intact even while the animation stylesheet loads.
  const layer = {position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'};
  const bandage = clipPath => ({...layer,clipPath,WebkitClipPath:clipPath});
  return <div className={`voidling-pet ${className}`} style={{position:'absolute',pointerEvents:'none',isolation:'isolate'}} aria-hidden="true">
    <div className="voidling-pet__breath" style={{position:'absolute',inset:0}}>
      <img className="voidling-pet__body" style={layer} src={body} alt="" />
      <span className="voidling-pet__eye voidling-pet__eye--left" />
      <span className="voidling-pet__eye voidling-pet__eye--right" />
      <img className="voidling-pet__bandage voidling-pet__bandage--top" style={bandage('polygon(61% 0,86% 0,86% 23%,61% 23%)')} src={fullArt} alt="" />
      <img className="voidling-pet__bandage voidling-pet__bandage--left" style={bandage('polygon(6% 17%,29% 17%,29% 48%,6% 48%)')} src={fullArt} alt="" />
      <img className="voidling-pet__bandage voidling-pet__bandage--lower" style={bandage('polygon(2% 62%,24% 62%,24% 91%,2% 91%)')} src={fullArt} alt="" />
    </div>
    <svg className="voidling-pet__orbit" style={{position:'absolute',inset:0,width:'100%',height:'100%',overflow:'visible'}} viewBox="0 0 100 100" aria-hidden="true">
      {[
        ['green', '0s'],
        ['orange', '-3s'],
        ['violet', '-6s'],
      ].map(([color, begin]) => <g className={`voidling-pet__orb voidling-pet__orb--${color}`} key={color}>
        <image href={shard} x="-6" y="-9" width="12" height="18" />
        <animateMotion dur="9s" begin={begin} repeatCount="indefinite" path="M 28 11 A 22 7 0 1 1 72 11 A 22 7 0 1 1 28 11" />
      </g>)}
    </svg>
  </div>;
}

export default memo(VoidlingPet);
