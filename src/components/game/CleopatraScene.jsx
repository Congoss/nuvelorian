import {reportClientDiagnostic} from '@/lib/diagnosticReporter';
import { useEffect, useRef, useState } from 'react';
export default function CleopatraScene({ hitToken }) {
  const frame=useRef(null),layers=useRef(new Set());
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    const receive=event=>{
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||!['planet4:cleopatra-layer-ready','planet4:cleopatra-error'].includes(event.data?.type))return;
      if(event.data.type==='planet4:cleopatra-error'){reportClientDiagnostic('SCENE_LOAD_ERROR',new Error('Cleopatra layer failed: '+event.data.layer),'/boss7-scene/');return;}
      layers.current.add(event.data.layer);
      if(event.data.layer==='boss'){setReady(true);frame.current?.parentElement?.setAttribute('data-scene-ready','true');frame.current?.dispatchEvent(new Event('scene-ready',{bubbles:true}));}
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[]);
  useEffect(()=>{if(hitToken)frame.current?.contentWindow?.postMessage({type:'cleopatra-hit'},window.location.origin);},[hitToken]);
  return <div data-scene-ready={ready?'true':'false'} className="absolute inset-0"><iframe ref={frame} src="/boss7-scene/index.html?v=5" title="Клеопатреш і Мурзаглот" className="pointer-events-none absolute inset-0 h-full w-full border-0" tabIndex={-1} aria-hidden="true"/></div>;
}
