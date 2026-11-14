import {useEffect,useRef,useState} from 'react';
import {getShipBossName} from '@/lib/shipBattleText';

export default function ShipGumQueenBoss({hp,hitToken=0,language='uk'}){
 const frame=useRef(null),[ready,setReady]=useState(false),[visible,setVisible]=useState(()=>!document.hidden);
 const [mountAnimation,setMountAnimation]=useState(false);
 useEffect(()=>{
  const receive=event=>{
   if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
   if(event.data?.type==='gum-queen-ready')setReady(true);
   if(event.data?.type==='gum-queen-unavailable')setReady(false);
  };
  window.addEventListener('message',receive);
  const timeout=window.setTimeout(()=>setMountAnimation(true),500);
  return()=>{window.removeEventListener('message',receive);window.clearTimeout(timeout);};
 },[]);
 useEffect(()=>{const sync=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',sync);return()=>document.removeEventListener('visibilitychange',sync);},[]);
 useEffect(()=>{if(ready)frame.current?.contentWindow?.postMessage({type:'gum-queen-state',active:visible&&hp>0,hitToken},window.location.origin);},[ready,visible,hp,hitToken]);
 return <div className="absolute inset-0 overflow-hidden bg-[#14151b]" data-scene-ready={ready} role="img" aria-label={getShipBossName('portal',language)}>
  <img src="/ship-gum-queen/battle-poster-v1.webp" alt="" fetchPriority="high" onLoad={()=>setMountAnimation(true)} className="absolute inset-0 h-full w-full object-contain"/>
  {mountAnimation&&<iframe ref={frame} src="/ship-gum-queen/scene-contour-v5.html?poster=1" title={getShipBossName('portal',language)} tabIndex={-1} aria-hidden="true" style={{opacity:ready?1:0}} className="absolute inset-0 h-full w-full border-0 pointer-events-none"/>}
 </div>;
}
