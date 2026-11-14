const N=64;
const values=Float32Array.from({length:N*N},(_,i)=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);});
const smooth=x=>x*x*(3-2*x);
function noise(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),sx=smooth(x-ix),sy=smooth(y-iy);
 const at=(a,b)=>values[((b%N+N)%N)*N+(a%N+N)%N];
 const a=at(ix,iy),b=at(ix+1,iy),c=at(ix,iy+1),d=at(ix+1,iy+1);
 return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
}
const rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
export function plasmaSamples(mask){
 const c=document.createElement('canvas');c.width=282;c.height=480;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(mask,0,0,282,480);
 const pixels=ctx.getImageData(0,0,282,480).data,distance=new Float32Array(282*480);
 for(let i=0;i<distance.length;i++)distance[i]=pixels[i*4+3]>90?0:999;
 for(let y=1;y<479;y++)for(let x=1;x<281;x++){const i=y*282+x;distance[i]=Math.min(distance[i],distance[i-1]+1,distance[i-282]+1,distance[i-283]+1.414,distance[i-281]+1.414);}
 for(let y=478;y>0;y--)for(let x=280;x>0;x--){const i=y*282+x;distance[i]=Math.min(distance[i],distance[i+1]+1,distance[i+282]+1,distance[i+283]+1.414,distance[i+281]+1.414);}
 const samples=[];
 for(let y=1;y<479;y++)for(let x=1;x<281;x++){const i=y*282+x;if(distance[i]<20)samples.push({offset:i*4,x:x*2-32,y:y*2-32,d:distance[i]*2,inside:pixels[i*4+3]>90});}
 return samples;
}
export function createPlasmaField(samples){
 const canvas=document.createElement('canvas');canvas.width=282;canvas.height=480;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(282,480),out=pixels.data;
 return {canvas,draw(time,stage,axis){
  const cold=rgb(stage.halo),hot=rgb(stage.color),tier=stage.level;
  const reach=tier>=15?34:tier>=12?29:tier>=10?24:tier>=8?19:tier>=6?13:8;
  const phase=time/3.6*Math.PI*2,orbitX=Math.cos(phase),orbitY=Math.sin(phase);
  const rhythm=.9+.07*Math.sin(phase)+.03*Math.sin(phase*2+.9);
  for(const p of samples){
   if(p.d>reach){out[p.offset+3]=0;continue;}
   const along=p.x*axis.x+p.y*axis.y,across=-p.x*axis.y+p.y*axis.x;
   const warp=(noise(across*.035+orbitX*.7,along*.022+orbitY*.7)-.5)*2.8;
   const a=noise(across*.065+warp+orbitX*1.1, along*.032+orbitY*1.1);
   const b=noise(across*.14+warp*1.4+orbitX*1.7,along*.072+orbitY*1.7);
   const c=noise(across*.24+warp+orbitX*2,along*.12+orbitY*2);
   const texture=a*.58+b*.29+c*.13;
   const wave=.5+.5*Math.sin(along*.032+phase+warp*2);
   const proximity=Math.max(0,1-p.d/reach);
   const tip=Math.max(0,Math.min(1,(along-axis.min)/Math.max(1,axis.max-axis.min)));
   const threshold=.38+(1-proximity)*.39-tip*tip*.065;
   const tongues=Math.max(0,Math.min(1,(texture+(tier>=8?wave*.09:0)-threshold)*4.2));
   const heat=tier>=8?tongues:Math.max(0,Math.min(1,proximity*.65+texture*.28-.12));
   const strength=smooth(heat),rim=Math.exp(-p.d/(tier>=12?3:1.8));
   let alpha=(strength*.95+rim*.17)*rhythm*stage.intensity;
   if(p.inside)alpha*=tier>=10?.13:.07;
   else alpha*=tier>=10?.95:tier>=6?.75:.58;
   const white=tier>=15&&p.d<2?Math.max(0,(heat-.88)*3):0;
   for(let ch=0;ch<3;ch++){const color=cold[ch]+(hot[ch]-cold[ch])*Math.min(.88,heat*.85);out[p.offset+ch]=Math.round(color+(255-color)*white);}
   out[p.offset+3]=Math.min(235,Math.round(alpha*255));
  }
  ctx.putImageData(pixels,0,0);
 }};
}
