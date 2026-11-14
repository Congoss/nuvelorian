// Keep the original composition usable even if a WebGL context or texture fails.
// Keep the existing frame rate and shader time; suspend work when it cannot be seen.
window.cleopatraRenderLoop=(canvas,render)=>{
 let raf=0,active=true,reset=true;
 const visible=()=>active&&!document.hidden&&canvas.isConnected&&!canvas.hidden;
 function schedule(){if(!raf&&visible())raf=requestAnimationFrame(frame);}
 function frame(now){raf=0;if(!visible()){reset=true;return;}render(now,reset);reset=false;schedule();}
 function sync(){cancelAnimationFrame(raf);raf=0;reset=true;schedule();}
 document.addEventListener('visibilitychange',sync);
 document.addEventListener('change',sync);
 window.addEventListener('pagehide',()=>{active=false;sync();});
 window.addEventListener('pageshow',()=>{active=true;sync();});
 const observer=new MutationObserver(sync);observer.observe(canvas,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('cleopatra-layer-error',()=>{if(!canvas.isConnected){active=false;sync();}});
 schedule();
};
const cleopatraLayers={boss:['#boss','boss-22.webp'],pet:['#pet','pet-base.webp'],background:['#arena','arena.webp']};
function restoreCleopatraLayer(layer){
 const config=cleopatraLayers[layer],canvas=config&&document.querySelector(config[0]);
 if(!canvas||canvas.tagName!=='CANVAS')return;
 const image=new Image();image.id=canvas.id;image.className=canvas.className;image.style.cssText=canvas.style.cssText;image.width=canvas.width;image.height=canvas.height;image.alt='';image.src=config[1];
 image.onload=()=>{canvas.replaceWith(image);parent.postMessage({type:'planet4:cleopatra-layer-ready',layer},location.origin);};
 image.onerror=()=>{parent.postMessage({type:'planet4:cleopatra-layer-ready',layer},location.origin);};
}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;if(event.data?.type==='cleopatra-hit')document.querySelector('#hit')?.click();});
window.addEventListener('cleopatra-layer-error',event=>{restoreCleopatraLayer(event.detail);parent.postMessage({type:'planet4:cleopatra-error',layer:event.detail},location.origin);});
const cleopatraWatchdog=setTimeout(()=>{for(const layer of Object.keys(cleopatraLayers))if(!window['__'+layer+'Ready']){restoreCleopatraLayer(layer);parent.postMessage({type:'planet4:cleopatra-error',layer},location.origin);}},5000);
window.addEventListener('pagehide',()=>clearTimeout(cleopatraWatchdog),{once:true});
