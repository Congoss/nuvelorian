import { useEffect,useRef,useState } from 'react';
import { useSceneAnimationsEnabled } from '@/lib/animationPreference';
import { weaponEnhancementVisual } from '@/lib/weaponEnhancementVisuals';
import { loadWeaponContour } from '@/lib/weaponContour';
import WeaponContourFire from './WeaponContourFire';
import WeaponContourLightning from './WeaponContourLightning';
import './weaponContourEffect.css';
export default function WeaponContourEffect({src,level=0,paused=false,showWeapon=false}){
 const root=useRef(null),active=useSceneAnimationsEnabled(root),[geometry,setGeometry]=useState(null);
 const stage=weaponEnhancementVisual(level);
 const [box,setBox]=useState(null);
 useEffect(()=>{const node=root.current;if(!node)return;const resize=()=>{const {width,height}=node.getBoundingClientRect();const scale=Math.min(width/500,height/896);setBox({left:(width-500*scale)/2-32*scale,top:height-896*scale-32*scale,width:564*scale,height:960*scale});};resize();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);observer?.observe(node);return()=>observer?.disconnect();},[]);
 useEffect(()=>{let disposed=false;setGeometry(null);if(level<4)return;loadWeaponContour(src).then(value=>{if(!disposed)setGeometry(value)}).catch(()=>{});return()=>{disposed=true};},[src,level>=4]);
 if(!stage)return <div ref={root} className="weapon-enhancement-effect p4-contour-effect" aria-hidden="true"/>;
 const stopped=paused||!active,art=geometry?.src;
 return <div ref={root} className="weapon-enhancement-effect p4-contour-effect" data-paused={stopped} style={{'--weapon-glow':stage.color}} aria-hidden="true">
  {showWeapon&&<img src={src} alt="" className="p4-contour-original"/>}
  {art&&<div className="p4-contour-space" style={box||{left:'-6.4%',top:'-3.571%',width:'112.8%',height:'107.143%'}} >
   <img src={art} alt="" className="p4-aura-outer"/><img src={art} alt="" className="p4-aura-inner"/>
   <WeaponContourLightning src={art} color={stage.color} bolts={geometry.bolts} paused={stopped} level={level}/>
   {level>=6&&geometry.anchors.length>0&&<WeaponContourFire paused={stopped} color={stage.color} anchors={geometry.anchors} level={level}/>}
  </div>}
 </div>;
}
