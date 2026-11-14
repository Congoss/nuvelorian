const contours=new Map();
export function buildWeaponContour(data,width=282,height=480){
 const alpha=(x,y)=>x<0||y<0||x>=width||y>=height?0:data[(y*width+x)*4+3];
 const pixels=[],edge=[];
 for(let y=1;y<height-1;y+=2)for(let x=1;x<width-1;x+=2){
  if(alpha(x,y)<160)continue;pixels.push([x,y]);
  const dx=alpha(x-2,y)-alpha(x+2,y),dy=alpha(x,y-2)-alpha(x,y+2),length=Math.hypot(dx,dy);
  if(length>100)edge.push([x/width*100,y/height*100,dx/length,dy/length]);
 }
 if(!pixels.length||!edge.length)return {anchors:[],bolts:[]};
 const anchors=Array.from({length:160},(_,i)=>edge[Math.floor((i+.5)/160*edge.length)]);
 const cx=pixels.reduce((s,p)=>s+p[0],0)/pixels.length,cy=pixels.reduce((s,p)=>s+p[1],0)/pixels.length;
 let xx=0,xy=0,yy=0;for(const [x,y]of pixels){xx+=(x-cx)**2;xy+=(x-cx)*(y-cy);yy+=(y-cy)**2;}
 const angle=.5*Math.atan2(2*xy,xx-yy),dx=Math.cos(angle),dy=Math.sin(angle),tx=-dy,ty=dx;
 const projected=pixels.map(([x,y])=>[(x-cx)*dx+(y-cy)*dy,(x-cx)*tx+(y-cy)*ty]);
 let lo=Infinity,hi=-Infinity;for(const p of projected){lo=Math.min(lo,p[0]);hi=Math.max(hi,p[0]);}
 const bands=[];for(let a=lo+3;a<hi-3;a+=7){const cross=projected.filter(p=>Math.abs(p[0]-a)<4).map(p=>p[1]).sort((a,b)=>a-b);if(cross.length)bands.push({a,center:cross[Math.floor(cross.length/2)],spread:Math.min(8,(cross.at(-1)-cross[0])*.38)});}
 const bolts=Array.from({length:6},(_,k)=>bands.map(({a,center,spread},i)=>{const hash=Math.sin((i+1)*127.1+k*311.7)*43758.5453,side=center+(hash-Math.floor(hash)-.5)*2*spread;return (i?'L':'M')+(cx+dx*a+tx*side).toFixed(2)+' '+(cy+dy*a+ty*side).toFixed(2);}).join(' '));
 return {anchors,bolts};
}
export function loadWeaponContour(src){
 if(contours.has(src))return contours.get(src);
 const task=new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>{
   try{const canvas=document.createElement('canvas');canvas.width=282;canvas.height=480;
    const context=canvas.getContext('2d',{willReadFrequently:true}),fit=Math.min(500/image.naturalWidth,896/image.naturalHeight);
    const w=image.naturalWidth*fit,h=image.naturalHeight*fit;
    context.drawImage(image,(32+(500-w)/2)/2,(32+896-h)/2,w/2,h/2);
    const geometry=buildWeaponContour(context.getImageData(0,0,282,480).data);
    resolve({...geometry,src:canvas.toDataURL('image/png')});canvas.width=canvas.height=1;
   }catch(error){reject(error);}
  };image.onerror=()=>reject(Error('Weapon silhouette unavailable'));image.src=src;
 }).catch(error=>{contours.delete(src);throw error;});
 contours.set(src,task);while(contours.size>24)contours.delete(contours.keys().next().value);return task;
}
