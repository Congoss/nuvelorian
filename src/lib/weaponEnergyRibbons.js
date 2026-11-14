export function energyRibbonPath(axis,phase=0,turns=3,width=16){
 const [x1,y1,x2,y2]=axis,dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
 return Array.from({length:65},(_,i)=>{
  const t=i/64,angle=t*Math.PI*2*turns+phase,envelope=.4+.6*Math.sin(Math.PI*t);
  const displacement=Math.sin(angle)*width*envelope;
  return (i?'L':'M')+(x1+dx*t+nx*displacement).toFixed(2)+' '+(y1+dy*t+ny*displacement).toFixed(2);
 }).join(' ');
}
export function ribbonFrames(axis,offset,turns,width){
 return Array.from({length:17},(_,i)=>energyRibbonPath(axis,offset+i/16*Math.PI*2,turns,width)).join(';');
}
