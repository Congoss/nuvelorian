export function chargeEnvelope(time,level){
 if(level<12)return {cycle:0,alpha:0,charge:0};
 const period=level>=15?.85:5.2,duration=level>=15?.82:.52;
 const cycle=Math.floor(time/period),phase=time-cycle*period;
 const charge=phase<.65?Math.sin(phase/.65*Math.PI):0;
 const t=(phase-(level>=15?.015:.65))/duration;
 return {cycle,charge:level>=15?charge:0,alpha:t>0&&t<1?Math.sin(t*Math.PI)**1.4:0};
}
export function weaponDischarges(edge,axis,cycle,count=1){
 if(!edge.length)return [];
 const hash=n=>{const v=Math.sin(n*127.1+cycle*311.7)*43758.5453;return v-Math.floor(v);};
 return Array.from({length:count},(_,branch)=>{
  const start=edge[Math.floor(hash(branch+1)*edge.length)];
  const candidates=edge.filter(p=>{const d=Math.hypot(p.x-start.x,p.y-start.y),forward=(p.x-start.x)*axis.x+(p.y-start.y)*axis.y;return d>35&&d<110&&forward>20;});
  const end=candidates[Math.floor(hash(branch+6)*candidates.length)]||{x:start.x+axis.x*65,y:start.y+axis.y*65};
  let seed=branch*101+7;
  function subdivide(a,b,depth,spread){
   if(!depth)return [a,b];
   const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
   const offset=(hash(seed++)-.5)*spread,t=.4+hash(seed++)*.2;
   const mid={x:a.x+dx*t-dy/l*offset,y:a.y+dy*t+dx/l*offset};
   const left=subdivide(a,mid,depth-1,spread*.52),right=subdivide(mid,b,depth-1,spread*.52);
   return [...left.slice(0,-1),...right];
  }
  const points=subdivide({x:start.x+start.nx*2,y:start.y+start.ny*2},{x:end.x+(end.nx||0)*2,y:end.y+(end.ny||0)*2},4,24);
  const branches=[5,10].map((index,i)=>{
   const mid=points[index],reach=15+hash(seed++)*19;
   return subdivide(mid,{x:mid.x+start.nx*reach+axis.x*reach*.35,y:mid.y+start.ny*reach+axis.y*reach*.35},3,12-i*3);
  });
  return {points,branch:branches[0],branches};
 });
}
const loops=new Map();
export async function cachedPlasmaLoop(key,createField,samples,stage,axis){
 if(loops.has(key)){const result=loops.get(key);loops.delete(key);loops.set(key,result);return result;}
 const pending=(async()=>{
  const field=createField(samples),frames=[],count=24;
  let minX=282,minY=480,maxX=0,maxY=0;
  for(const p of samples){const x=(p.x+32)/2,y=(p.y+32)/2;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  const crop={x:Math.max(0,Math.floor(minX)-2),y:Math.max(0,Math.floor(minY)-2),w:Math.min(282,Math.ceil(maxX-minX)+5),h:Math.min(480,Math.ceil(maxY-minY)+5)};
  for(let i=0;i<count;i++){
   field.draw(i/count*3.6,stage,axis);
   const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(crop.w*.65));c.height=Math.max(1,Math.ceil(crop.h*.65));
   c.getContext('2d').drawImage(field.canvas,crop.x,crop.y,crop.w,crop.h,0,0,c.width,c.height);frames.push(c);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {frames,crop,duration:3.6,bytes:frames.reduce((sum,c)=>sum+c.width*c.height*4,0)};
 })();
 loops.set(key,pending);while(loops.size>2)loops.delete(loops.keys().next().value);
 try{return await pending;}catch(error){loops.delete(key);throw error;}
}
