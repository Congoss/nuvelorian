export function lightenKangarooScene(scene){
 scene=scene.replace('// One continuous skin',"// Store attachment pixels in tight buffers instead of seven full-scene canvases.\nfor(const p of parts){\n const bounds=p.id==='glove-right'?[300,725,610,1010]:p.id==='can'?[700,805,830,995]:[Math.min(...p.points.map(q=>q[0]))-4,Math.min(...p.points.map(q=>q[1]))-4,Math.max(...p.points.map(q=>q[0]))+4,Math.max(...p.points.map(q=>q[1]))+4];\n const [x,y,r,bottom]=bounds.map(Math.round),cropped=document.createElement('canvas');cropped.width=r-x;cropped.height=bottom-y;\n cropped.getContext('2d').drawImage(p.image,x,y,cropped.width,cropped.height,0,0,cropped.width,cropped.height);\n p.image.width=1;p.image.height=1;p.image=cropped;p.offset=[x,y];\n}\n"+'// One continuous skin');
 scene=scene.replace('ctx.drawImage(p.image,0,0);','ctx.drawImage(p.image,...p.offset);').replace('y+=28','y+=56').replace('x+=32','x+=64').replace('x+32','x+64').replace('y+28','y+56');
 scene=scene.replace('const W=canvas.width=941,H=canvas.height=1672;', 'const W=941,H=1672;\nconst renderScale=Math.min(1,Math.max(320,Math.min(640,canvas.clientWidth||640))/W);\ncanvas.width=Math.round(W*renderScale);canvas.height=Math.round(H*renderScale);display.scale(renderScale,renderScale);');
 scene=scene.replace('display.setTransform(a,b,c,d,q0[0]-a*p0[0]-c*p0[1],q0[1]-b*p0[0]-d*p0[1]);','display.setTransform(a*renderScale,b*renderScale,c*renderScale,d*renderScale,(q0[0]-a*p0[0]-c*p0[1])*renderScale,(q0[1]-b*p0[0]-d*p0[1])*renderScale);');
 scene=scene.replaceAll('y+=56','y+=112').replaceAll('x+=64','x+=128').replaceAll('x+64','x+128').replaceAll('y+56','y+112');
 const start=scene.indexOf('let lastDraw=-Infinity;');return scene.slice(0,start)+`let lastDraw=-Infinity,raf=0,pageActive=true;
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
`;
}
