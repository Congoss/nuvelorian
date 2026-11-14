import {createBackgroundAnimator} from './background-animation.js?v=2';
const canvas=document.querySelector('#scene'),display=canvas.getContext('2d');
const images=new Map();
const load=src=>{if(!images.has(src))images.set(src,(async()=>{const im=new Image();im.src=src;await im.decode();return im;})());return images.get(src);};
// Start independent requests together instead of waiting through each rig stage.
for(const src of ['boss.webp','background.webp','body-underpaint.webp','can-underpaint.webp','glove-right-cut.webp?v=2','eye-whites-mask.webp','background-clear.webp','tumbleweed.webp','sun-mask.webp','background-rocks.webp','whole-cloud-1.webp','whole-cloud-2.webp','whole-cloud-3.webp'])void load(src).catch(()=>{});
const [art,bg,under]=await Promise.all(['boss.webp','background.webp','body-underpaint.webp'].map(load));
const W=941,H=1672;
// Bound the presentation buffer to mobile display size; retain logical rig coordinates.
const renderScale=Math.min(1,Math.max(320,Math.min(640,canvas.clientWidth||640))/W);
canvas.width=Math.round(W*renderScale);canvas.height=Math.round(H*renderScale);display.scale(renderScale,renderScale);
let drawBackground=(ctx)=>ctx.drawImage(bg,0,0,W,H);
createBackgroundAnimator(load,bg).then(draw=>{drawBackground=draw;}).catch(error=>console.warn('Background effects unavailable',error));
const surface=()=>Object.assign(document.createElement('canvas'),{width:W,height:H});
const sprite=surface(),ctx=sprite.getContext('2d');
const polygon=points=>{const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
// Upper attachments keep their original pixels and rotate rigidly at joints.
const parts=[
 {id:'ear-left',pivot:[291,278],angle:.09,phase:0,points:[[87,113],[226,108],[281,194],[310,274],[283,300],[231,265],[168,235],[111,158]]},
 {id:'ear-right',pivot:[377,272],angle:-.055,phase:1.8,points:[[349,256],[354,173],[383,101],[458,47],[522,16],[517,139],[489,214],[505,255],[469,280],[410,262],[388,296]]},
 {id:'baby-ear-left',pivot:[659,436],angle:.13,phase:0,points:[[540,285],[637,320],[680,389],[690,432],[670,453],[633,443],[598,428],[557,389],[540,344]]},
 {id:'glove-left',pivot:[315,788],angle:.065,phase:0,points:[[316,756],[337,784],[326,827],[280,848],[206,856],[141,832],[108,792],[106,719],[138,674],[196,650],[260,655],[296,683],[302,733],[279,775]]},
 {id:'glove-right',pivot:[576,752],angle:-.055,phase:1.3,outline:'M551 734 L598 745 Q600 772 579 800 L564 820 Q559 850 533 870 Q533 925 511 954 Q484 988 447 997 Q401 1008 365 982 Q338 963 329 941 Q313 920 315 889 Q304 873 318 850 Q331 827 362 824 Q363 809 403 799 Q448 784 484 806 Q503 794 525 793 L546 768 Z',points:[]},
 {id:'straw',pivot:[229,430],angle:.055,phase:2,points:[[229,420],[235,435],[193,449],[143,485],[122,476],[159,430],[198,412]]}
];
parts.push({id:'can',pivot:[751,814],angle:.045,phase:1.4,outline:'M741 835 C735 822 741 816 752 817 C765 818 771 825 768 835 C784 830 797 831 803 840 L819 970 Q815 985 776 986 L736 983 Q724 981 724 969 L711 849 Q707 838 741 835 Z'});
// Use the complete restored torso, rather than a glove-shaped repair patch.
const body=surface(),b=body.getContext('2d');b.drawImage(under,0,0,W,H);
for(const p of parts){
 p.path=p.outline?new Path2D(p.outline):polygon(p.points);p.image=surface();const c=p.image.getContext('2d');
 if(p.id==='can'){
  c.clip(p.path);c.drawImage(under,0,0,W,H);
  const plate=await load('can-underpaint.webp');
  b.save();b.clip(p.path);b.clearRect(0,0,W,H);b.drawImage(plate,-10,60,W,H);b.restore();
 }else if(p.id==='glove-right'){
  const cut=await load('glove-right-cut.webp?v=2');
  c.drawImage(cut,0,0);
  // Feather only the elbow attachment root; the glove ink stays sharp.
  const fade=c.createLinearGradient(0,733,0,770);fade.addColorStop(0,'transparent');fade.addColorStop(1,'white');
  c.globalCompositeOperation='destination-in';c.fillStyle=fade;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';
 }else{
  c.clip(p.path);c.drawImage(p.id==='baby-ear-left'?under:art,0,0,W,H);
  if(p.id==='baby-ear-left'){
   // Retain the head/root under the attachment, instead of cutting into the head.
   const rootFade=c.createLinearGradient(631,411,655,445);
   rootFade.addColorStop(0,'white');rootFade.addColorStop(1,'transparent');
   c.globalCompositeOperation='destination-in';c.fillStyle=rootFade;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';
   b.save();b.beginPath();b.rect(0,0,W,411);b.clip();b.globalCompositeOperation='destination-out';b.fill(p.path);b.restore();
  }
 }
}
const smoke=polygon([[804,359],[867,359],[880,475],[831,556],[805,550],[793,503],[810,456],[784,423]]);
b.save();b.globalCompositeOperation='destination-out';b.fill(smoke);b.restore();
// Store attachment pixels in tight buffers instead of seven full-scene canvases.
for(const p of parts){
 const bounds=p.id==='glove-right'?[300,725,610,1010]:p.id==='can'?[700,805,830,995]:[Math.min(...p.points.map(q=>q[0]))-4,Math.min(...p.points.map(q=>q[1]))-4,Math.max(...p.points.map(q=>q[0]))+4,Math.max(...p.points.map(q=>q[1]))+4];
 const [x,y,r,bottom]=bounds.map(Math.round),cropped=document.createElement('canvas');cropped.width=r-x;cropped.height=bottom-y;
 cropped.getContext('2d').drawImage(p.image,x,y,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
 p.image.width=1;p.image.height=1;p.image=cropped;p.offset=[x,y];
}
// One continuous skin below the hips: no calf/tail cuts or cloned texture strips.
const smooth=(a,b,v)=>{const x=Math.max(0,Math.min(1,(v-a)/(b-a)));return x*x*(3-2*x);};
function triangle(source,target){
 const [p0,p1,p2]=source,[q0,q1,q2]=target;
 const sx1=p1[0]-p0[0],sy1=p1[1]-p0[1],sx2=p2[0]-p0[0],sy2=p2[1]-p0[1],det=sx1*sy2-sx2*sy1;
 const dx1=q1[0]-q0[0],dy1=q1[1]-q0[1],dx2=q2[0]-q0[0],dy2=q2[1]-q0[1];
 const a=(dx1*sy2-dx2*sy1)/det,c=(dx2*sx1-dx1*sx2)/det,b=(dy1*sy2-dy2*sy1)/det,d=(dy2*sx1-dy1*sx2)/det;
 const cx=(q0[0]+q1[0]+q2[0])/3,cy=(q0[1]+q1[1]+q2[1])/3;
 display.save();display.beginPath();target.forEach(([x,y],i)=>{const dist=Math.hypot(x-cx,y-cy),pad=.45;const xx=x+(x-cx)/dist*pad,yy=y+(y-cy)/dist*pad;i?display.lineTo(xx,yy):display.moveTo(xx,yy);});display.closePath();display.clip();
 display.setTransform(a*renderScale,b*renderScale,c*renderScale,d*renderScale,(q0[0]-a*p0[0]-c*p0[1])*renderScale,(q0[1]-b*p0[0]-d*p0[1])*renderScale);
 const x=Math.max(0,Math.min(...source.map(p=>p[0]))-2),y=Math.max(0,Math.min(...source.map(p=>p[1]))-2),right=Math.min(W,Math.max(...source.map(p=>p[0]))+2),bottom=Math.min(H,Math.max(...source.map(p=>p[1]))+2);
 display.drawImage(sprite,x,y,right-x,bottom-y,x,y,right-x,bottom-y);display.restore();
}
function present(drop,t,amount){
 const bossScale=.84,fit=([x,y])=>[W/2+(x-W/2)*bossScale,920+(y-920)*bossScale];
 display.clearRect(0,0,W,H);drawBackground(display,t,amount);
 const age=(performance.now()-hitStarted)/1000,shake=age<.24?Math.sin(age*105)*5*(1-age/.24):0;
 const origin=fit([shake,drop]);display.drawImage(sprite,0,0,W,1030,origin[0],origin[1],W*bossScale,1030*bossScale);
 const map=([x,y])=>{const ankle=1280+80*smooth(430,640,x),tail=smooth(750,941,x)*smooth(1140,1270,y)*(1-smooth(1410,1470,y));return fit([x+shake+Math.sin(t*1.7)*-3*tail*amount,y+drop*(1-smooth(1030,ankle,y))+Math.sin(t*1.7+.4)*15*tail*amount]);};
 for(let y=1030;y<H;y+=112)for(let x=0;x<W;x+=128){
  const right=Math.min(W,x+128),bottom=Math.min(H,y+112),a=[x,y],b=[right,y],c=[x,bottom],d=[right,bottom];
  const aa=map(a),bb=map(b),cc=map(c),dd=map(d);triangle([a,b,c],[aa,bb,cc]);triangle([b,d,c],[bb,dd,cc]);
 }
}
let sceneAlive=true;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,original=false,time=0,last=performance.now();
let backgroundOnly=false;
const backgroundButton=document.createElement('button');backgroundButton.textContent='Тільки фон';
backgroundButton.onclick=()=>{backgroundOnly=!backgroundOnly;backgroundButton.textContent=backgroundOnly?'Показати боса':'Тільки фон';};
document.querySelector('#status').before(backgroundButton);
let hitStarted=-Infinity;
const impacts=[];
const hit=event=>{
 if(backgroundOnly)return;
 original=false;document.querySelector('#original').textContent='Оригінал';document.querySelector('#original').setAttribute('aria-pressed','false');hitStarted=performance.now();
 const rect=canvas.getBoundingClientRect();
 const point=event?.type==='pointerdown'?[(event.clientX-rect.left)*W/rect.width,(event.clientY-rect.top)*H/rect.height]:[475,850];
 impacts.push({x:point[0],y:point[1],born:hitStarted,angle:impacts.length*.73});if(impacts.length>8)impacts.shift();
};

canvas.style.cursor='pointer';
const hitButton=document.createElement('button');hitButton.textContent='Удар';hitButton.onclick=hit;
document.querySelector('#status').before(hitButton);
const pause=document.querySelector('#pause'),strength=document.querySelector('#strength');
const updatePause=()=>pause.textContent=paused?'Продовжити':'Пауза';updatePause();
pause.onclick=()=>{paused=!paused;updatePause();};
document.querySelector('#status').textContent='Жар сонця · хмари · перекотиполе';
document.title='Кенгуру — анімація через суглоби';
canvas.setAttribute('aria-label','Кенгуру: рух рукавиць, вух, соломинки, очей та диму');
document.querySelector('#original').onclick=e=>{original=!original;e.target.textContent=original?'Анімація':'Оригінал';e.target.setAttribute('aria-pressed',String(original));};
const eyes=[[376.6,333.9,5,11,5],[229.2,356.1,3.5,5,3],[674.8,480.5,3.5,8,4],[767,481.4,3,4,3]].map(([x,y,r,rx,ry])=>{
 const color=b.getImageData(x+Math.ceil(r)+4,y,1,1).data;
 return {x,y,r,rx,ry,white:`rgb(${color[0]},${color[1]},${color[2]})`};
});
const gazeTargets=[[0,0],[-.9,.1],[.65,-.5],[.95,.25],[-.45,.6],[0,-.3]];
function gazeAt(t){
 const step=t/1.45,index=Math.floor(step),phase=step-index;
 const a=gazeTargets[index%gazeTargets.length],z=gazeTargets[(index+1)%gazeTargets.length];
 const v=Math.max(0,Math.min(1,(phase-.76)/.24)),blend=v*v*(3-2*v);
 return [a[0]+(z[0]-a[0])*blend,a[1]+(z[1]-a[1])*blend];
}
function attachmentAngle(p,t,amount){
 if(p.id==='baby-ear-left'){
  const burst=(t+1.8)%7.3;
  if(burst>.82)return 0;
  return Math.sin(burst*34)*Math.pow(Math.sin(Math.PI*burst/.82),2)*p.angle*amount;
 }
 return Math.sin(t*1.6+p.phase)*p.angle*amount;
}
function drawEarringGlint(t,amount){
 const phase=(t+1.1)%4.7,brightness=phase<.65?Math.sin(Math.PI*phase/.65):0;
 if(brightness<=0)return;
 const ear=parts.find(p=>p.id==='ear-right');
 ctx.save();ctx.translate(...ear.pivot);ctx.rotate(attachmentAngle(ear,t,amount));ctx.translate(-ear.pivot[0],-ear.pivot[1]);ctx.translate(485,242);
 ctx.globalAlpha=brightness;ctx.shadowColor='#ffeaa0';ctx.shadowBlur=10;ctx.fillStyle='#fff8d4';
 const r=4+brightness*9;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(2,-2);ctx.lineTo(r*.65,0);ctx.lineTo(2,2);ctx.lineTo(0,r);ctx.lineTo(-2,2);ctx.lineTo(-r*.65,0);ctx.lineTo(-2,-2);ctx.closePath();ctx.fill();ctx.restore();
}
function drawCanSmoke(t,amount){
 const can=parts.find(p=>p.id==='can');
 ctx.save();ctx.translate(...can.pivot);ctx.rotate(attachmentAngle(can,t,amount));ctx.translate(-can.pivot[0],-can.pivot[1]);
 for(let i=0;i<7;i++){
  const life=(t*.23+i/7)%1,x=792+Math.sin(life*5+t*.5)*life*18,y=843-life*104;
  const radius=3+life*13,g=ctx.createRadialGradient(x,y,0,x,y,radius);
  g.addColorStop(0,`rgba(200,204,174,${(1-life)*.2*amount})`);g.addColorStop(1,'rgba(200,204,174,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
const eyeWhitesMask=await load('eye-whites-mask.webp');
const eyelids=surface(),lidContext=eyelids.getContext('2d');
function drawAnger(anger){
 if(anger<=0)return;
 lidContext.clearRect(0,0,W,H);
 for(const eye of [
  {x:377,y:335,rx:47,ry:44,ax:330,ay:329,bx:424,by:306,skin:[285,285,40,28]},
  {x:229,y:356,rx:21,ry:29,ax:208,ay:341,bx:251,by:357,skin:[285,285,40,28]},
  {x:675,y:481,rx:31,ry:32,ax:644,ay:464,bx:706,by:482,skin:[700,442,24,14]},
  {x:767,y:481,rx:18,ry:25,ax:749,ay:482,bx:785,by:465,skin:[700,442,24,14]}
 ]){
  const slope=(eye.by-eye.ay)/(eye.bx-eye.ax),left=eye.x-eye.rx-16,right=eye.x+eye.rx+16;
  const yLeft=eye.ay+(left-eye.ax)*slope,yRight=eye.ay+(right-eye.ax)*slope;
  lidContext.save();lidContext.beginPath();lidContext.moveTo(left,yLeft);lidContext.lineTo(right,yRight);lidContext.lineTo(right,eye.y-70);lidContext.lineTo(left,eye.y-70);lidContext.closePath();lidContext.clip();
  lidContext.drawImage(under,...eye.skin,left,eye.y-70,right-left,140);lidContext.restore();
  lidContext.strokeStyle='#241b12';lidContext.lineWidth=3;lidContext.lineCap='butt';lidContext.beginPath();lidContext.moveTo(left,yLeft);lidContext.lineTo(right,yRight);lidContext.stroke();
 }
 // Exact raster silhouettes of the original whites, not approximate ellipses.
 lidContext.globalCompositeOperation='destination-in';lidContext.drawImage(eyeWhitesMask,0,0);lidContext.globalCompositeOperation='source-over';
 ctx.save();ctx.globalAlpha=anger;ctx.drawImage(eyelids,0,0);ctx.restore();
}

function drawTowelMoisture(t,amount){
 if(amount<=0)return;
 ctx.save();ctx.globalAlpha=Math.min(1,amount);
 const hem=polygon([[317,705],[393,724],[390,769],[365,780],[354,766],[329,765],[309,754]]);
 hem.addPath(polygon([[411,721],[471,735],[473,759],[461,770],[444,766],[438,778],[419,769]]));
 ctx.clip(hem);const damp=ctx.createLinearGradient(0,710,0,780);damp.addColorStop(0,'rgba(50,74,66,0)');damp.addColorStop(1,'rgba(50,74,66,.24)');ctx.fillStyle=damp;ctx.fillRect(300,705,180,80);ctx.restore();
}
function drawSweatDrops(t,amount){
 if(amount<=0)return;
 const sources=[[329,754,0],[375,773,1.2],[427,767,2.7],[461,766,4.1]];
 for(const [sx,sy,delay] of sources){
  const phase=(t+delay)%6.7;if(phase>1.25)continue;
  const hanging=phase<.35,fall=Math.max(0,phase-.35),y=sy+(hanging?phase*5:2+30*fall+240*fall*fall),x=sx+Math.sin(fall*2)*1.8;
  const size=hanging?1+phase*5:2.7,alpha=Math.min(1,amount)*(hanging?.55:Math.max(0,.7-fall*.65));
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#b3d6c5';ctx.strokeStyle='#536c60';ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(x,y-size*2);ctx.bezierCurveTo(x-size*.5,y-size*.6,x-size*1.2,y,x-size,y+size*.5);ctx.bezierCurveTo(x-size*.6,y+size*1.6,x+size*.8,y+size*1.6,x+size,y+size*.4);ctx.bezierCurveTo(x+size,y-size*.3,x+size*.4,y-size,x,y-size*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#effff3';ctx.beginPath();ctx.ellipse(x-.6,y+.4,.65,1.2,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
function drawImpactEffects(){
 const now=performance.now();
 for(let i=impacts.length-1;i>=0;i--){
  const effect=impacts[i],age=(now-effect.born)/1000;
  if(age>.48){impacts.splice(i,1);continue;}
  const fade=1-age/.48;
  display.save();display.translate(effect.x,effect.y);display.rotate(effect.angle);display.globalAlpha=fade;
  if(age<.16){
   const radius=12+age*160;display.fillStyle='#fff3be';display.strokeStyle='#ae5728';display.lineWidth=2;
   display.beginPath();for(let n=0;n<16;n++){const a=n*Math.PI/8,r=n%2?radius*.3:radius;const x=Math.cos(a)*r,y=Math.sin(a)*r;n?display.lineTo(x,y):display.moveTo(x,y);}display.closePath();display.fill();display.stroke();
  }
  display.strokeStyle='#ffd47b';display.lineCap='round';display.lineWidth=2.8;
  for(let n=0;n<7;n++){const a=n*Math.PI*2/7+.2,distance=12+age*(95+n%3*32),length=4+fade*9;display.beginPath();display.moveTo(Math.cos(a)*distance,Math.sin(a)*distance+age*age*50);display.lineTo(Math.cos(a)*(distance+length),Math.sin(a)*(distance+length)+age*age*50);display.stroke();}
  display.restore();
 }
}
function draw(t){
 const amount=Number(strength.value);ctx.clearRect(0,0,W,H);
 if(backgroundOnly){display.clearRect(0,0,W,H);drawBackground(display,t,amount,original);return;}
 if(original){display.clearRect(0,0,W,H);display.drawImage(bg,0,0,W,H);display.drawImage(art,0,0,W,H);return;}
 const drop=(.5-.5*Math.cos(t*1.6))*12*amount;
 const hitAge=(performance.now()-hitStarted)/1000;
 const anger=hitAge<1.05?Math.min(1,hitAge/.065)*Math.min(1,(1.05-hitAge)/.3):0;
 ctx.save();ctx.drawImage(body,0,0);
 drawTowelMoisture(t,amount);
 for(const p of parts){ctx.save();ctx.translate(...p.pivot);ctx.rotate(attachmentAngle(p,t,amount));ctx.translate(-p.pivot[0],-p.pivot[1]);ctx.drawImage(p.image,...p.offset);ctx.restore();}
 drawEarringGlint(t,amount);
 drawCanSmoke(t,amount);
 drawSweatDrops(t,amount);
 for(let i=0;i<eyes.length;i++){
  const {x,y,r,rx,ry,white}=eyes[i],gaze=gazeAt(t+(i>1?2.1:0)),power=Math.min(1,amount);
  ctx.fillStyle=white;ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#171a12';ctx.beginPath();ctx.arc(x+gaze[0]*rx*power,y+gaze[1]*ry*power,r,0,Math.PI*2);ctx.fill();
 }
 drawAnger(anger);
 for(let i=0;i<9;i++){const phase=(t*.25+i/9)%1;ctx.globalAlpha=(1-phase)*.22*amount;ctx.strokeStyle='#dddcd2';ctx.lineWidth=3+phase*7;ctx.lineCap='round';ctx.beginPath();const x=803+Math.sin(phase*8+t*.3)*12,y=550-phase*155;ctx.moveTo(x,y);ctx.quadraticCurveTo(x+12,y-12,x+5,y-25);ctx.stroke();}ctx.globalAlpha=1;ctx.restore();
 if(hitAge<.12){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.22*(1-hitAge/.12);ctx.fillStyle='#fff0c9';ctx.fillRect(0,0,W,H);ctx.restore();}
 present(drop,t,amount);drawImpactEffects();
}
let lastDraw=-Infinity,raf=0,pageActive=true;
function schedule(){if(!raf&&pageActive&&!document.hidden&&sceneAlive&&!paused)raf=requestAnimationFrame(frame);}
function frame(now){raf=0;if(!pageActive||document.hidden||!sceneAlive||paused)return;time+=Math.min((now-last)/1000,.05);last=now;if(now-lastDraw>=50){draw(time);lastDraw=now;}schedule();}
function syncAnimation(){cancelAnimationFrame(raf);raf=0;last=performance.now();schedule();}
document.addEventListener('visibilitychange',syncAnimation);
window.addEventListener('pagehide',()=>{pageActive=false;syncAnimation();});
window.addEventListener('pageshow',()=>{pageActive=true;syncAnimation();});
window.addEventListener('message',event=>{
 if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='planet4:kangaroo-state')return;
 sceneAlive=event.data.alive!==false;
 if(event.data.hit&&sceneAlive)hit();
 syncAnimation();
});
draw(time);
requestAnimationFrame(()=>window.parent.postMessage({type:'planet4:kangaroo-ready'},location.origin));
schedule();
