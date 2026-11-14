const weight=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2)*2);
export function soldierPoint(x,y,time,hit=0) {
 const fixed=Math.max(0,Math.min(1,(.94-y)/.13));
 const head=weight(x,y,.65,.15,.31,.19);
 const chest=weight(x,y,.5,.38,.44,.26);
 const armLeft=weight(x,y,.31,.5,.15,.27);
 const armRight=weight(x,y,.77,.52,.15,.28);
 const twitch=Math.sin(time*23)*Math.max(0,Math.sin(time*.83)-.94)*.08;
 const dx=(head*(Math.sin(time*.9)*.008+twitch)+armLeft*Math.sin(time*1.4)*.006-armRight*Math.sin(time*1.8)*.009+hit*Math.sin(hit*17)*.018)*fixed;
 const dy=(chest*Math.sin(time*1.25)*.0025+head*Math.sin(time*.9)*.002)*fixed;
 return {x:x+dx,y:y+dy};
}
function triangle(ctx,image,w,h,source,destination) {
 const [p,q,r]=source,[a,b,c]=destination;
 const det=(q.x-p.x)*(r.y-p.y)-(r.x-p.x)*(q.y-p.y);
 const m1=((b.x-a.x)*(r.y-p.y)-(c.x-a.x)*(q.y-p.y))/det;
 const m2=((b.y-a.y)*(r.y-p.y)-(c.y-a.y)*(q.y-p.y))/det;
 const m3=((c.x-a.x)*(q.x-p.x)-(b.x-a.x)*(r.x-p.x))/det;
 const m4=((c.y-a.y)*(q.x-p.x)-(b.y-a.y)*(r.x-p.x))/det;
 ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();
 ctx.transform(m1,m2,m3,m4,a.x-m1*p.x-m3*p.y,a.y-m2*p.x-m4*p.y);
 ctx.drawImage(image,0,0,w,h);ctx.restore();
}
export function drawSoldierFrame(ctx,image,w,h,time,hit=0,{lowDetail=false}={}) {
 ctx.clearRect(0,0,w,h);
 ctx.drawImage(image,0,0,w,h);
 if(time===0&&hit===0)return;
 const cols=lowDetail?6:10,rows=lowDetail?14:24,points=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
  const p=soldierPoint(x/cols,y/rows,time,hit);
  points.push({s:{x:x/cols*w,y:y/rows*h},d:{x:p.x*w,y:p.y*h}});
 }
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*(cols+1)+x;
  for(const ids of [[i,i+1,i+cols+1],[i+1,i+cols+2,i+cols+1]])triangle(ctx,image,w,h,ids.map(k=>points[k].s),ids.map(k=>points[k].d));
 }
 // Pupils use the same deformation as the head, clipped within the original eyes.
 for(const [x,y,rx,ry,phase]of [[.642,.142,.029,.015,0],[.729,.163,.021,.013,1.8]]){
  const center=soldierPoint(x,y,time,hit);
  ctx.save();ctx.beginPath();ctx.ellipse(center.x*w,center.y*h,rx*w,ry*h,0,0,Math.PI*2);ctx.clip();
  const px=center.x+Math.sin(time*1.1+phase)*rx*.45,py=center.y+Math.sin(time*.8+phase)*ry*.35;
  ctx.fillStyle='#211b11';ctx.beginPath();ctx.ellipse(px*w,py*h,.004*w,.002*h,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
