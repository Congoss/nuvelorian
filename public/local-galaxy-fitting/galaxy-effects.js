// Blue pixels are sampled once; animation uses cached masks and no blur filters.
const stage=document.querySelector('.stage');stage.style.position='relative';
const effectCanvas=document.createElement('canvas');effectCanvas.width=500;effectCanvas.height=896;
effectCanvas.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none;width:100%;height:100%';stage.append(effectCanvas);
const fx=effectCanvas.getContext('2d'),masks=new Map();
const buffer=document.createElement('canvas');buffer.width=500;buffer.height=896;
const paint=buffer.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const toggle=document.createElement('label');toggle.innerHTML='<input type="checkbox" checked> Анімація космосу';
document.querySelector('aside').append(toggle);const enabled=toggle.querySelector('input');
function maskFor(slot){
 if(masks.has(slot))return masks.get(slot);
 const image=imgs['galaxy_'+slot];if(!image)return null;
 const c=document.createElement('canvas');c.width=500;c.height=896;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
 const pixels=g.getImageData(0,0,500,896),data=pixels.data;
 for(let i=0;i<data.length;i+=4){
  const r=data[i],green=data[i+1],b=data[i+2];
  // Exclude navy fabric, ivory metal and transparent studio haze.
  const strength=Math.min(1,Math.max(0,(b-85)/85))*Math.min(1,Math.max(0,(b-r-28)/65))*Math.min(1,Math.max(0,(b-green-8)/35));
  data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(data[i+3]*strength);
 }
 g.putImageData(pixels,0,0);
 g.globalCompositeOperation='destination-out';
 if(slot==='weapon'&&imgs.base){
  // Match the preview's base-head cutout before subtracting the body.
  const body=document.createElement('canvas');body.width=500;body.height=896;
  const bg=body.getContext('2d');bg.drawImage(imgs.base,0,0);
  if(selected.head==='galaxy')bg.clearRect(150,0,201,165);
  g.drawImage(body,0,0);
 }
 for(const upper of order.slice(order.indexOf(slot)+1)){
  const cover=imgs[selected[upper]+'_'+upper];if(cover)g.drawImage(cover,0,0);
 }
 g.globalCompositeOperation='source-over';masks.set(slot,c);return c;
}
function render(time){
 fx.clearRect(0,0,500,896);if(!enabled.checked)return;
 const t=time/1000;
 for(const slot of order){
  if(selected[slot]!=='galaxy')continue;
  const mask=maskFor(slot);if(!mask)continue;
  paint.clearRect(0,0,500,896);paint.globalCompositeOperation='source-over';
  paint.globalAlpha=1;
  const pulse=.32+.23*Math.sin(t*1.25+order.indexOf(slot)*.6);
  paint.fillStyle=`rgba(64,149,255,${pulse})`;paint.fillRect(0,0,500,896);
  const y=slot==='head'?(t*35)%260-40:(t*90+order.indexOf(slot)*87)%1000-50;
  const band=paint.createLinearGradient(0,y-60,100,y+60);
  band.addColorStop(0,'rgba(85,100,255,0)');band.addColorStop(.5,'rgba(145,224,255,.55)');band.addColorStop(1,'rgba(85,100,255,0)');
  paint.fillStyle=band;paint.fillRect(0,y-65,500,135);
  if(slot==='head'){
   // Slow orbital streaks and stars stay inside the original blue face pixels.
   paint.save();paint.translate(252,89);paint.rotate(t*.15);
   paint.strokeStyle='rgba(98,197,255,.55)';paint.lineWidth=2;
   for(let a=0;a<3;a++){paint.beginPath();paint.ellipse(0,0,28+a*18,15+a*10,a*.7,t*.1,t*.1+1.6);paint.stroke();}
   for(let i=0;i<26;i++){
    const angle=i*2.39996,radius=12+(i*17)%75;
    const brightness=.25+.75*Math.pow((Math.sin(t*1.1+i*1.8)+1)/2,3);
    paint.fillStyle=`rgba(199,240,255,${brightness})`;
    const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*.8;
    paint.fillRect(x-1,y-1,2,2);
    if(i%5===0){paint.fillRect(x-3,y-.5,6,1);paint.fillRect(x-.5,y-3,1,6);}
   }
   paint.restore();
  }
  paint.globalCompositeOperation='destination-in';paint.drawImage(mask,0,0);
  fx.globalCompositeOperation='screen';fx.drawImage(buffer,0,0);
 }
 fx.globalCompositeOperation='source-over';
}
let frame=0,last=0;
function tick(time){frame=0;if(document.hidden||!enabled.checked)return;
 if(time-last>=(reduced.matches?100:50)){render(time);last=time;}frame=requestAnimationFrame(tick);
}
function resume(){if(frame)cancelAnimationFrame(frame);frame=0;
 if(document.hidden||!enabled.checked){fx.clearRect(0,0,500,896);return;}
 frame=requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);enabled.addEventListener('change',resume);
document.querySelector('#controls').addEventListener('change',()=>{masks.clear();fx.clearRect(0,0,500,896);});
// Rebuild masks after initial image loading so all occluding layers are available.
Promise.all(Object.values(imgs).map(im=>im.decode().catch(()=>{}))).then(()=>masks.clear());
resume();
