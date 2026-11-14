import WeaponContourEffect from './WeaponContourEffect';
import {chargeEnvelope,weaponDischarges,cachedPlasmaLoop} from '@/lib/weaponChargeEffects';
import {plasmaSamples,createPlasmaField} from '@/lib/weaponPlasmaField';
import { useEffect, useRef } from 'react';
import { ENHANCEMENT_VISUALS, weaponEnhancementVisual, weaponCanvasTransform } from '@/lib/weaponEnhancementVisuals';
import './weaponEnhancementEffect.css';
export { ENHANCEMENT_VISUALS };
const cache=new Map();
const surface=()=>{const c=document.createElement('canvas');c.width=564;c.height=960;return c;};
function loadSilhouette(src){
 if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{
   try{
    const mask=surface(),ctx=mask.getContext('2d',{willReadFrequently:true});
    const fit=Math.min(500/image.naturalWidth,896/image.naturalHeight);
    const artWidth=image.naturalWidth*fit,artHeight=image.naturalHeight*fit;
    ctx.drawImage(image,32+(500-artWidth)/2,32+896-artHeight,artWidth,artHeight);
    const pixels=ctx.getImageData(0,0,564,960).data;
    const alpha=(x,y)=>x<0||y<0||x>=564||y>=960?0:pixels[(Math.floor(y)*564+Math.floor(x))*4+3];
    const edge=[];
    for(let y=32;y<928;y+=2)for(let x=32;x<532;x+=2){
     if(alpha(x,y)<160)continue;
     const nx=alpha(x-3,y)-alpha(x+3,y),ny=alpha(x,y-3)-alpha(x,y+3),length=Math.hypot(nx,ny);
     if(length>100)edge.push({x:x-32,y:y-32,nx:nx/length,ny:ny/length});
    }
    const ring=surface(),rc=ring.getContext('2d');
    for(let i=0;i<8;i++){const a=i*Math.PI/4;rc.drawImage(mask,Math.cos(a)*.8,Math.sin(a)*.8);}
    rc.globalCompositeOperation='destination-out';rc.drawImage(mask,0,0);
    const strongRing=surface(),sc=strongRing.getContext('2d');
    for(let i=0;i<12;i++){const a=i*Math.PI/6;sc.drawImage(mask,Math.cos(a)*1.7,Math.sin(a)*1.7);}
    sc.globalCompositeOperation='destination-out';sc.drawImage(mask,0,0);
    const halo=surface(),hc=halo.getContext('2d');hc.filter='blur(6px)';hc.drawImage(mask,0,0);
    hc.filter='none';hc.globalCompositeOperation='destination-out';hc.drawImage(mask,0,0);
    let cx=0,cy=0;for(const p of edge){cx+=p.x;cy+=p.y;}cx/=edge.length||1;cy/=edge.length||1;
    let xx=0,yy=0,xy=0;for(const p of edge){xx+=(p.x-cx)**2;yy+=(p.y-cy)**2;xy+=(p.x-cx)*(p.y-cy);}
    const angle=.5*Math.atan2(2*xy,xx-yy);let ax=Math.cos(angle),ay=Math.sin(angle);
    if(ay>0){ax=-ax;ay=-ay;}
    const projections=edge.map(p=>p.x*ax+p.y*ay);
    resolve({mask,ring,strongRing,halo,fieldSamples:plasmaSamples(mask),edge,axis:{x:ax,y:ay,min:Math.min(...projections),max:Math.max(...projections)}});
   }catch(error){reject(error);}
  };
  image.onerror=()=>reject(Error('Weapon mask unavailable'));image.src=src;
 }).catch(error=>{cache.delete(src);throw error;}));
 return cache.get(src);
}
function colored(mask,color){
 const result=surface(),ctx=result.getContext('2d');ctx.drawImage(mask,0,0);
 ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,result.width,result.height);
 return result;
}
export function LegacyWeaponEnhancementEffect({src,level=0,viewBox='0 0 500 896',showWeapon=false,paused=false,variant='base'}){
 const canvas=useRef(null),settings=useRef({level,paused,variant}),wake=useRef(()=>{});
 settings.current={level,paused,variant};
 useEffect(()=>{wake.current();},[level,paused,variant]);
 useEffect(()=>{
  const node=canvas.current,ctx=node?.getContext('2d');if(!ctx)return;
  let disposed=false,raf=0,last=0,lastPaint=0,time=0,visible=true,loaded=false,lastLevel=-1,transition=1,current=null,previous=null;
  let geometry,field,particles=[],observer,resizeObserver,fieldLevel=-1,plasmaLoop=null,plasmaLevel=-1,logicalPadding=32,arcCycle=-1,arcs=[];
  const weak=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const frameRate=weak?15:24;
  const resize=()=>{
   const r=node.getBoundingClientRect(),dpr=Math.min(1,window.devicePixelRatio||1);
   node.width=Math.max(1,Math.round(r.width*dpr));node.height=Math.max(1,Math.round(r.height*dpr));
   logicalPadding=32*node.width/Math.max(1,r.width);
   paint(0);
  };
  const fresh=initial=>{
   const anchor=geometry.edge[Math.floor(Math.random()*geometry.edge.length)],life=1.2+Math.random()*1.4;
   return {...anchor,age:initial?Math.random()*life:0,life,phase:Math.random()*6.28,size:2+Math.random()*3};
  };
  const config=()=>{
   const value=weaponEnhancementVisual(settings.current.level);
   return value?{...value,ringBitmap:colored(value.level>=10?geometry.strongRing:geometry.ring,value.color),haloBitmap:colored(geometry.halo,value.halo)}:null;
  };
  const drawBase=(s,weight)=>{
   if(!s||weight<=0)return;
   const pulse=.82+.1*Math.sin(time*2.05)+.06*Math.sin(time*3.17+.7);
   ctx.globalAlpha=s.haloOpacity*s.intensity*pulse*weight;ctx.drawImage(s.haloBitmap,-32,-32);
   ctx.globalAlpha=(.4+(s.level-4)*.04)*s.intensity*pulse*weight;ctx.drawImage(s.ringBitmap,-32,-32);
  };
  function paint(dt){
   if(!loaded||disposed)return;
   if(lastLevel!==settings.current.level){
    previous=current;current=config();lastLevel=settings.current.level;transition=0;
   }
   transition=Math.min(1,transition+dt/.5);
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,node.width,node.height);
   const {scale,x,y}=weaponCanvasTransform(node.width,node.height,viewBox,logicalPadding);
   ctx.setTransform(scale,0,0,scale,x,y);ctx.globalCompositeOperation='screen';
   const blend=transition*transition*(3-2*transition);
   drawBase(previous,1-blend);drawBase(current,blend);
   const s=current;
   if(s){
    // Build reusable animation frames once; playback only blends bitmaps.
    if(plasmaLevel!==s.level){
     plasmaLevel=s.level;plasmaLoop=null;
     const expected=s.level;
     void cachedPlasmaLoop(src+':light-v2:'+s.level,createPlasmaField,geometry.fieldSamples,s,geometry.axis).then(value=>{
      if(!disposed&&plasmaLevel===expected)plasmaLoop=value;
     }).catch(()=>{});
    }
    if(plasmaLoop){
     const frame=(time/plasmaLoop.duration*plasmaLoop.frames.length)%plasmaLoop.frames.length;
     const index=Math.floor(frame),mix=frame-index,crop=plasmaLoop.crop;
     const x=crop.x*2-32,y=crop.y*2-32,w=crop.w*2,h=crop.h*2;
     ctx.globalAlpha=blend*(1-mix);ctx.drawImage(plasmaLoop.frames[index],x,y,w,h);
     ctx.globalAlpha=blend*mix;ctx.drawImage(plasmaLoop.frames[(index+1)%plasmaLoop.frames.length],x,y,w,h);
    }else{
     if(fieldLevel!==s.level){field.draw(0,s,geometry.axis);fieldLevel=s.level;}
     ctx.globalAlpha=blend;ctx.drawImage(field.canvas,-32,-32,564,960);
    }
    const limit=Math.min(particles.length,Math.ceil(s.density*(weak?.35:.6)));
    for(let i=0;i<limit;i++){
     let p=particles[i];p.age+=dt;if(p.age>=p.life)p=particles[i]=fresh(false);
     const u=p.age/p.life,fade=Math.sin(u*Math.PI)*blend,travel=2+u*s.reach;
     const bend=Math.sin(p.phase+u*5+time*.7)*s.reach*u*.3;
     const px=p.x+p.nx*travel-p.ny*bend,py=p.y+p.ny*travel+p.nx*bend-u*9;
     if(s.level>=10){
      const tx=-p.ny,ty=p.nx,tipX=px+p.nx*s.reach*.5,tipY=py+p.ny*s.reach*.5;
      const gradient=ctx.createLinearGradient(p.x,p.y,tipX,tipY);
      gradient.addColorStop(0,s.halo+'00');gradient.addColorStop(.3,s.halo+'70');gradient.addColorStop(.65,s.color+'85');gradient.addColorStop(1,s.color+'00');
      ctx.strokeStyle=gradient;ctx.globalAlpha=fade*.65;ctx.lineCap='round';ctx.lineWidth=s.level>=15?2.1:1.5;
      ctx.beginPath();ctx.moveTo(p.x+p.nx,p.y+p.ny);ctx.bezierCurveTo(p.x+p.nx*travel*.4+tx*bend,p.y+p.ny*travel*.4+ty*bend,px-tx*bend*.5,py-ty*bend*.5,tipX,tipY);ctx.stroke();
     }
     if(s.level<10||i%3===0){
      ctx.fillStyle=s.level>=15&&i%2?'#f1ffd5':s.color;ctx.globalAlpha=fade*(i%3?.4:.85);ctx.beginPath();ctx.ellipse(px,py,s.level>=15&&i===0?1.3:.65,1,-.4,0,Math.PI*2);ctx.fill();
     }
    }
    if(settings.current.variant==='charged'&&s.level>=12){
     const burst=chargeEnvelope(time,s.level);
     if(arcCycle!==burst.cycle||arcs.length!==(s.level>=15?3:1)){
      arcCycle=burst.cycle;arcs=weaponDischarges(geometry.edge,geometry.axis,arcCycle,s.level>=15?3:1);
     }
     if(burst.alpha>0){
      ctx.lineJoin='round';ctx.lineCap='round';
      for(const arc of arcs)for(const points of [arc.points,...(s.level>=15?arc.branches:[arc.branch])]){
       for(const [width,opacity,color] of [[5,.18,s.halo],[2,.55,s.color],[.8,.95,s.level>=15?'#f2ffd9':'#ffe8c2']]){
        ctx.lineWidth=width;ctx.globalAlpha=burst.alpha*opacity*blend;ctx.strokeStyle=color;
        ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
       }
      }
     }
    }
    if(s.level>=15){
     const flare=Math.pow(Math.max(0,Math.sin(time*1.1)),18);
     if(flare>.01){
      const p=geometry.edge[Math.floor(time/5)*241%geometry.edge.length];
      const star=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,16);
      star.addColorStop(0,'#f2ffd9');star.addColorStop(.12,'#dfffacc0');star.addColorStop(.45,'#9dff4355');star.addColorStop(1,'#9dff4300');
      ctx.globalAlpha=flare*.85*blend;ctx.fillStyle=star;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fill();
     }
    }
   }
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
   if(transition===1)previous=null;
  }
  const canAnimate=()=>!disposed&&loaded&&!!weaponEnhancementVisual(settings.current.level)&&visible&&!document.hidden&&!settings.current.paused&&!media.matches;
  const frame=stamp=>{
   raf=0;if(!canAnimate())return;
   if(!last||stamp-last>=1000/frameRate){const dt=lastPaint?Math.min(.08,(stamp-lastPaint)/1000):1/frameRate;const elapsed=last?stamp-last:0;last=stamp-elapsed%(1000/frameRate);lastPaint=stamp;time+=dt;paint(dt);}
   raf=requestAnimationFrame(frame);
  };
  const sync=()=>{
   if(disposed)return;
   if(!canAnimate()){cancelAnimationFrame(raf);raf=0;last=0;lastPaint=0;if(loaded)paint(.5);}
   else if(!raf)raf=requestAnimationFrame(frame);
  };
  wake.current=sync;
  loadSilhouette(src).then(value=>{
   if(disposed||!value.edge.length)return;
   geometry=value;field=createPlasmaField(value.fieldSamples);loaded=true;particles=Array.from({length:24},()=>fresh(true));
   resize();if(media.matches||settings.current.paused)paint(.5);sync();
  }).catch(()=>{});
  if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(node);}
  if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});observer.observe(node);}
  document.addEventListener('visibilitychange',sync);window.addEventListener('resize',resize);
  if(media.addEventListener)media.addEventListener('change',sync);else media.addListener?.(sync);
  return()=>{disposed=true;cancelAnimationFrame(raf);observer?.disconnect();resizeObserver?.disconnect();document.removeEventListener('visibilitychange',sync);window.removeEventListener('resize',resize);if(media.removeEventListener)media.removeEventListener('change',sync);else media.removeListener?.(sync);wake.current=()=>{};};
 },[src,viewBox]);
 const stage=weaponEnhancementVisual(level);
 return <div className="weapon-enhancement-effect" data-enhancement={stage?.level||0} aria-hidden="true">
  {showWeapon&&<svg viewBox={viewBox} preserveAspectRatio="xMidYMax meet"><image href={src} width="500" height="896"/></svg>}
  <canvas ref={canvas}/>
 </div>;
}

export default function WeaponEnhancementEffect(props){
 return props.viewBox&&props.viewBox!=='0 0 500 896'?<LegacyWeaponEnhancementEffect {...props}/>:<WeaponContourEffect {...props}/>;
}
