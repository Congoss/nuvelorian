import {createPlasmaField} from './weapon-plasma-field.js';
const W=941,H=1672;
export async function createBackgroundAnimator(load,original){
 const assets=Promise.all(['background-clear.webp','tumbleweed.webp','sun-mask.webp','background-rocks.webp'].map(load));
 const descriptors=await (await fetch('clouds.json')).json();
 const [[clear,tumbleweed,sunMask,rocks],clouds]=await Promise.all([assets,Promise.all(descriptors.map(async c=>({...c,image:await load(c.id+'.webp')})))]);
 const fire=Object.assign(document.createElement('canvas'),{width:W,height:H}),f=fire.getContext('2d');
 // Reuse the game's actual +15 plasma renderer, with a circular solar silhouette.
 const samples=[];
 for(let y=130;y<=350;y++)for(let x=30;x<=252;x++){
  const radius=Math.hypot((x-141)/88.5,(y-240)/84.5),distance=Math.max(0,radius-1)*177;
  if(distance<38)samples.push({offset:(y*282+x)*4,x:x*2-32,y:y*2-32,d:Math.max(2,distance),inside:radius<=1});
 }
 const solarPlasma=createPlasmaField(samples),solarStage={level:15,halo:'#cb3c19',color:'#ff873b',intensity:1.2};
 const solarAxis={x:0,y:-1,min:-690,max:-220};let lastPlasma=-Infinity;

 const sign=new Path2D('M766 0 L941 0 L941 810 L925 730 L914 355 L817 383 L800 260 L758 258 L754 124 L789 108 L806 48 Z');
 const foreground=new Path2D('M12 1337 L12 1148 Q25 1128 31 1151 L34 1244 L47 1257 L44 1024 Q41 981 56 977 Q71 979 72 1014 L86 1250 L101 1235 L104 1153 Q114 1130 125 1153 L126 1244 Q119 1274 89 1288 L104 1373 Z M143 1400 L153 1284 Q150 1248 164 1243 Q180 1245 175 1281 L172 1340 L189 1318 L196 1243 Q208 1227 213 1254 L207 1344 L176 1395 Z');
 function drawSun(ctx,t,amount){
  const power=Math.min(1,amount);
  ctx.save();ctx.globalAlpha=power;
  const glow=ctx.createRadialGradient(191,695,128,191,695,184);glow.addColorStop(0,'rgba(244,99,30,.24)');glow.addColorStop(.4,'rgba(239,103,35,.09)');glow.addColorStop(1,'rgba(239,103,35,0)');ctx.fillStyle=glow;ctx.fillRect(0,500,390,390);
  ctx.restore();
  f.clearRect(0,0,W,H);
  const core=f.createRadialGradient(183,681,12,191,695,140);core.addColorStop(0,'rgba(246,115,52,.48)');core.addColorStop(.72,'rgba(237,89,35,.57)');core.addColorStop(1,'rgba(202,58,23,.62)');f.fillStyle=core;f.fillRect(45,550,295,285);
  // Soft irregular patches suggest heat without visible rings or spinning spokes.
  for(let i=0;i<9;i++){
   const a=i*2.399,r=38+(i*31)%85,x=191+Math.cos(a+t*.015)*r,y=695+Math.sin(a+t*.015)*r;
   const patch=f.createRadialGradient(x,y,0,x,y,20+i%3*7);patch.addColorStop(0,`rgba(255,200,117,${.025+.018*Math.sin(t*.8+i)})`);patch.addColorStop(1,'rgba(255,200,117,0)');f.fillStyle=patch;f.fillRect(x-36,y-36,72,72);
  }
  f.globalCompositeOperation='destination-in';f.drawImage(sunMask,0,0,W,H);f.globalCompositeOperation='source-over';ctx.save();ctx.globalAlpha=power;ctx.drawImage(fire,0,0);ctx.restore();
  if(Math.abs(t-lastPlasma)>=1/18){solarPlasma.draw(t,solarStage,solarAxis);lastPlasma=t;}
  // Continuous overlapping rim joins sparse plasma tongues to the actual oval disc.
  ctx.save();ctx.globalAlpha=power*.75;ctx.strokeStyle='#e9672c';ctx.lineWidth=6;ctx.shadowColor='#e9672c';ctx.shadowBlur=5;ctx.beginPath();ctx.ellipse(190.5,693,136,129.5,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  const scale=138/90;
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=power;ctx.drawImage(solarPlasma.canvas,190.5-141*scale,693-240*scale,282*scale,480*scale);ctx.restore();

 }
 function drawTumbleweed(ctx,t,amount){
  if(amount<=0)return;const phase=(t+2)%29;if(phase<3||phase>16)return;
  const distance=(phase-3)/13*(W+150),x=-75+distance,ground=1298+Math.sin(x*.008)*5,bounce=Math.abs(Math.sin(distance/59))*11;
  ctx.save();ctx.globalAlpha=.15;ctx.fillStyle='#3b2b1c';ctx.beginPath();ctx.ellipse(x,ground+4,30-bounce*.3,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
  // Dust stays close to the ground and disperses behind the rolling bush.
  for(let i=0;i<4;i++){const drift=(t*.8+i/4)%1;ctx.save();ctx.globalAlpha=(1-drift)*.13;ctx.fillStyle='#d8a04d';ctx.beginPath();ctx.ellipse(x-20-drift*50,ground-2-drift*6,5+drift*12,2+drift*4,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.save();ctx.translate(x,ground-35-bounce);ctx.rotate(distance/34);ctx.drawImage(tumbleweed,-43,-43,86,86);ctx.restore();
  ctx.save();ctx.clip(foreground);ctx.drawImage(clear,0,0,W,H);ctx.restore();
 }
 return (ctx,t,amount=1,staticView=false)=>{
  ctx.drawImage(staticView?original:clear,0,0,W,H);if(staticView)return;
  drawSun(ctx,t,amount);
  for(const c of clouds){const wrap=W+c.w+100,shift=t*c.speed*amount,x=((c.x+shift+c.w+50)%wrap)-c.w-50;ctx.globalAlpha=c.opacity??1;ctx.drawImage(c.image,x,c.y,c.w,c.h);ctx.drawImage(c.image,x-wrap,c.y,c.w,c.h);ctx.globalAlpha=1;}
  ctx.drawImage(rocks,0,0,W,H);
  // Restore the sign and pole over clouds drifting behind it.
  ctx.save();ctx.clip(sign);ctx.drawImage(clear,0,0,W,H);ctx.restore();
  drawTumbleweed(ctx,t,amount);
 };
}
