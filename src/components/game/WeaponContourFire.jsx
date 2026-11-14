import {useEffect,useRef} from 'react';
export default function WeaponContourFire({paused,color,anchors,level=15,width=282,height=480,countLimit=120,emberBoost=1,padding=0,effectScale=1}){
 const canvas=useRef(null),settings=useRef({paused,color,anchors,level,countLimit,emberBoost});settings.current={paused,color,anchors,level,countLimit,emberBoost};
 useEffect(()=>{
  const node=canvas.current,ctx=node.getContext('2d');let raf=0,last=0,disposed=false;
  const particles=Array.from({length:120},(_,i)=>({age:i/120,life:.5+Math.random()*.7,t:Math.random(),drift:(Math.random()-.5)*22,size:5+Math.random()*8}));
  function reset(p){p.age=0;p.life=.5+Math.random()*.7;p.t=Math.random();p.drift=(Math.random()-.5)*22;p.size=5+Math.random()*8;}
  function frame(now){raf=0;if(disposed||document.hidden||settings.current.paused)return;
   if(!last||now-last>=1000/30){const dt=last?Math.min(.08,(now-last)/1000):1/30;last=now;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,node.width,node.height);ctx.translate(padding,padding);ctx.globalCompositeOperation='lighter';
    const count=Math.min(settings.current.countLimit,settings.current.level>=15?120:settings.current.level>=10?80:48);
    for(let index=0;index<count;index++){const p=particles[index];p.age+=dt;if(p.age>=p.life)reset(p);const u=p.age/p.life;
     const points=settings.current.anchors,point=points?.[Math.min(points.length-1,Math.floor(p.t*points.length))];
     const power=(settings.current.level>=15?1.5:settings.current.level>=12?1.3:settings.current.level>=10?1.1:settings.current.level>=8?.95:.8)*effectScale;
     const nx=point?.[2]??0,ny=point?.[3]??-1;
     const rootX=point?point[0]*width/100:77+p.t*160,rootY=point?point[1]*height/100:250+p.t*98;
     const ember=index%(settings.current.emberBoost>=1.7?2:settings.current.emberBoost>1?3:4)===0;
     ctx.globalAlpha=Math.sin(u*Math.PI)*(ember?.9:.65);
     if(ember){
      // Small detached embers rise above the flame, then cool and disappear.
      const x=rootX+nx*(5+u*18)*power+p.drift*u*.35;
      const y=rootY+ny*(5+u*18)*power-u*9;
      const radius=(.55+(p.size-5)*.055)*(1-u*.65)*settings.current.emberBoost*effectScale;
      ctx.fillStyle=u<.35?'#fff5bc':u<.75?settings.current.color:'#b46c27';
      ctx.beginPath();ctx.ellipse(x,y,radius,radius*1.6,-.25,0,Math.PI*2);ctx.fill();
     }else{
      // Soft overlapping filaments, not closed leaf-shaped polygons.
      const tx=-ny,ty=nx,wave=Math.sin(now*.007+p.t*31+u*5);
      const x=rootX+nx*.5,y=rootY+ny*.5;
      const length=(5+p.size*.65)*power*(.7+.3*Math.sin(u*Math.PI));
      const curl=wave*length*.4,slide=Math.sin(now*.003+p.t*19)*2;
      // Mostly follows the silhouette; a small buoyant bias prevents radial spikes.
      const dx=nx*.8,dy=ny*.8-.2;
      const tipX=x+dx*length+tx*(curl+slide),tipY=y+dy*length+ty*(curl+slide);
      const gradient=ctx.createLinearGradient(x,y,tipX,tipY);
      gradient.addColorStop(0,'#f4ffd0');gradient.addColorStop(.12,settings.current.color+'cc');gradient.addColorStop(.5,settings.current.color+'70');gradient.addColorStop(1,settings.current.color+'00');
      ctx.strokeStyle=gradient;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(x-tx*2,y-ty*2);
      ctx.bezierCurveTo(x+dx*length*.25-tx*curl*.35,y+dy*length*.25-ty*curl*.35,x+dx*length*.65+tx*curl,y+dy*length*.65+ty*curl,tipX,tipY);
      const alpha=ctx.globalAlpha;
      ctx.globalAlpha=alpha*.25;ctx.lineWidth=(3+p.size*.3)*power;ctx.stroke();
      ctx.globalAlpha=alpha*.6;ctx.lineWidth=(.7+p.size*.09)*power;ctx.stroke();
      // A small moving root joins neighboring wisps into a continuous hot edge.
      ctx.globalAlpha=alpha*.22;ctx.fillStyle=settings.current.color;
      ctx.beginPath();ctx.ellipse(x,y,2.2*power,1.4*power,Math.atan2(ty,tx),0,Math.PI*2);ctx.fill();

     }

    }ctx.globalAlpha=1;
   }raf=requestAnimationFrame(frame);
  }
  const sync=()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!disposed&&!document.hidden&&!settings.current.paused)raf=requestAnimationFrame(frame);};
  node.__wake=sync;document.addEventListener('visibilitychange',sync);sync();
  return()=>{disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',sync);delete node.__wake;};
 },[width,height,padding,effectScale]);
 useEffect(()=>{canvas.current?.__wake?.();},[paused]);
 return <canvas ref={canvas} width={width+padding*2} height={height+padding*2} style={padding?{left:`${-padding/width*100}%`,top:`${-padding/height*100}%`,width:`${(width+padding*2)/width*100}%`,height:`${(height+padding*2)/height*100}%`}:undefined} className="p4-contour-fire" aria-hidden="true"/>;
}
