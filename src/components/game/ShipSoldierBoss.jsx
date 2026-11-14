import { useEffect, useRef } from 'react';
import { drawSoldierFrame } from '@/lib/soldierMesh';
import './shipSoldierBoss.css';
const base='/ship-soldier-boss/';
export default function ShipSoldierBoss({hp,hitToken=0,language='uk'}) {
 const canvasRef=useRef(null),hitRef=useRef(0),aliveRef=useRef(hp>0);
 useEffect(()=>{aliveRef.current=hp>0},[hp]);
 useEffect(()=>{if(hitToken)hitRef.current=performance.now()},[hitToken]);
 useEffect(()=>{
  const canvas=canvasRef.current,context=canvas.getContext('2d');
  const image=new Image(),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const lowDetail=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
  let frame=0,disposed=false,last=0,announced=false;
  const paint=time=>{
   if(disposed)return;
   frame=requestAnimationFrame(paint);
   if(document.hidden||time-last<(lowDetail?1000/15:40))return;
   last=time;
   const width=Math.max(160,Math.min(lowDetail?320:640,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,lowDetail?1:2))));
   if(canvas.width!==width){canvas.width=width;canvas.height=width*2}
   const animated=!motion.matches&&aliveRef.current;
   drawSoldierFrame(context,image,canvas.width,canvas.height,animated?time/1000:0,animated?Math.max(0,1-(time-hitRef.current)/300):0,{lowDetail});
   if(!announced){announced=true;canvas.closest('[data-scene-ready]')?.setAttribute('data-scene-ready','true');canvas.dispatchEvent(new Event('scene-ready',{bubbles:true}));}
  };
  image.onload=()=>{if(!disposed)frame=requestAnimationFrame(paint)};
  image.onerror=()=>{if(!disposed&&image.src.endsWith('soldier-intact-v3.webp'))image.src=base+'reference.png'};
  image.src=base+'soldier-intact-v3.webp';
  return()=>{disposed=true;cancelAnimationFrame(frame);image.onload=null;image.onerror=null};
 },[]);
 const label={uk:'Заражений солдат у корабельному арсеналі',ru:'Заражённый солдат в корабельном арсенале',en:'Infected soldier in the spaceship armory'}[language];
 return <div data-scene-ready="false" className={`soldier-arena ${hp>0?'is-animated':'is-defeated'}`} role="img" aria-label={label}>
  <img className="soldier-background soldier-growth-background" src={base+'growth-room-v2.webp'} alt=""/>
  <div aria-hidden="true" className="soldier-room-props">
   <img className="soldier-room-fan" src={base+'room-fan-v2.webp'} alt=""/>
   <img className="soldier-room-helmet" src={base+'room-helmet-v2.webp'} alt=""/>
   <img className="soldier-room-mushrooms" src={base+'room-mushrooms-v2.webp'} alt=""/>
   <img className="soldier-room-vine" src={base+'room-vine-v2.webp'} alt=""/>
   <i className="soldier-room-leak"/>
  </div>
  <div aria-hidden="true" className="soldier-emergency-light"/>
  <div className="soldier-rig"><canvas ref={canvasRef} aria-hidden="true" className="soldier-intact"/>
   <div aria-hidden="true" className="soldier-spores">{Array.from({length:9},(_,i)=><i key={i} style={{'--spore':i}}/>)}</div>
  </div><div className="soldier-vignette"/>
 </div>;
}
