import {useRef} from 'react';
import bat from '@/assets/optimized/enhancement-bat-contour-v3.webp';
import geometry from '@/lib/enhancementBatContour.json';
import {weaponEnhancementVisual} from '@/lib/weaponEnhancementVisuals';
import {useSceneAnimationsEnabled} from '@/lib/animationPreference';
import WeaponContourFire from './WeaponContourFire';
import WeaponContourLightning from './WeaponContourLightning';
import './weaponContourEffect.css';
import './enhancementBat.css';
const cuts={left:'polygon(0 0,38% 0,38% 41%,47% 50%,46% 58%,43% 70%,43% 100%,0 100%)',right:'polygon(100% 0,62% 0,62% 41%,53% 50%,54% 58%,57% 70%,57% 100%,100% 100%)',body:'polygon(38% 0,62% 0,62% 41%,54% 50%,54% 58%,58% 70%,58% 100%,42% 100%,42% 70%,46% 58%,46% 50%,38% 41%)'};
const points=Object.fromEntries(['left','right','body'].map(part=>[part,geometry.anchors.filter(([x,y])=>part==='left'?x<(y<41?38:46):part==='right'?x>(y<41?62:54):x>=38&&x<=62)]));
export function enhancementBatVisual(level){
 const safe=Math.max(4,Math.min(15,Number(level)||4)),stage=weaponEnhancementVisual(safe);
 const aura=stage.level>=15?[7,18,.6,.9]:stage.level>=12?[5,13,.5,.75]:stage.level>=10?[4,10,.42,.65]:stage.level>=8?[3,7,.35,.55]:stage.level>=6?[2,5,.28,.45]:[1,3,.2,.35];
 return {color:stage.color,size:.68+(safe-4)/11*.32,aura,emberBoost:safe>=15?1.9:safe>=12?1.35:1};
}
export default function EnhancementBat({level}){
 const root=useRef(null),active=useSceneAnimationsEnabled(root),visual=enhancementBatVisual(level),[near,far,min,max]=visual.aura;
 return <span ref={root} className="p4-enhancement-bat" data-paused={!active} aria-label={`Enhancement +${level}`} style={{width:(25*visual.size)+'%','--weapon-glow':visual.color,'--bat-near':near+'px','--bat-far':far+'px','--bat-min':min,'--bat-max':max}}>
  {['left','right','body'].map(part=><span key={part} className={'p4-bat-part p4-bat-'+part}>
   <span className="p4-bat-aura"><span className="p4-bat-art" style={{clipPath:cuts[part]}}><img src={bat} alt=""/></span></span>
   <span className="p4-bat-art" style={{clipPath:cuts[part]}}><img className="p4-bat-core" src={bat} alt=""/>
    <WeaponContourLightning src={bat} color={visual.color} bolts={geometry.bolts} level={level} paused={!active} width={282} height={188}/>
   </span>
   {level>=6&&<WeaponContourFire color={visual.color} anchors={points[part]} level={level} paused={!active} width={282} height={188} padding={48} effectScale={1.8} countLimit={part==='body'?24:48} emberBoost={visual.emberBoost}/>}
  </span>)}
 </span>;
}
