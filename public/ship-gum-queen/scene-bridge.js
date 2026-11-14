let previousHit=0,latest=null;
function apply(){
 if(!latest||!window.gumQueenPreview?.ready)return;
 const {active,hitToken}=latest;
 window.gumQueenPreview.setPaused(!active||matchMedia('(prefers-reduced-motion: reduce)').matches);
 if(active&&hitToken>0&&hitToken!==previousHit&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 document.querySelector('#scene').animate([{transform:'translateX(0)'},{transform:'translateX(-.6%)'},{transform:'translateX(.6%)'},{transform:'translateX(0)'}],{duration:240,easing:'ease-out'});
 }
 previousHit=hitToken;
}
addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='gum-queen-state')return;
 latest=event.data;apply();
});
await import('./animation.js?edge-clean=6&perf=1');apply();
if(window.gumQueenPreview?.ready){
 const canvas=document.querySelector('#scene');
 const stage=canvas.closest('.stage');
 let contextLost=false;
 canvas.addEventListener('webglcontextlost',()=>{
  contextLost=true;
  stage.removeAttribute('data-animated');
  if(parent!==window)parent.postMessage({type:'gum-queen-unavailable'},location.origin);
 },{once:true});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(contextLost)return;
  stage.setAttribute('data-animated','');
  if(parent!==window)parent.postMessage({type:'gum-queen-ready'},location.origin);
 }));
}
