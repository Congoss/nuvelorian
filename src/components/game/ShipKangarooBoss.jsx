import {useEffect,useId,useRef,useState} from 'react';
import './shipKangarooBoss.css';
const base='/ship-kangaroo-boss/';
const attachments=[
 {id:'ear-left',pivot:'291px 278px',points:'87,113 226,108 281,194 310,274 283,300 231,265 168,235 111,158'},
 {id:'ear-right',pivot:'377px 272px',points:'349,256 354,173 383,101 458,47 522,16 517,139 489,214 505,255 469,280 410,262 388,296'},
 {id:'glove-left',pivot:'315px 788px',points:'316,756 337,784 326,827 280,848 206,856 141,832 108,792 106,719 138,674 196,650 260,655 296,683 302,733 279,775'},
 {id:'straw',pivot:'229px 430px',points:'229,420 235,435 193,449 151,477 140,489 144,469 165,449 197,431'},
];
// Same runtime as the first boss: registered artwork layers, CSS idle, one hit animation.
export default function ShipKangarooBoss({hp,hitToken=0,language='uk'}){
 const id=useId().replaceAll(':',''),rig=useRef(null);
 const [visible,setVisible]=useState(()=>!document.hidden);
 useEffect(()=>{const sync=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',sync);return()=>document.removeEventListener('visibilitychange',sync);},[]);
 useEffect(()=>{
  if(!hitToken||!visible||hp<=0||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const animation=rig.current?.animate?.([{transform:'translateX(0)'},{transform:'translateX(-.6%)',offset:.25},{transform:'translateX(.6%)',offset:.55},{transform:'translateX(0)'}],{duration:240,easing:'ease-out'});
  return()=>animation?.cancel();
 },[hitToken,visible,hp]);
 const title=({uk:'Орбітальний нокаут',ru:'Орбитальный нокаут',en:'Orbital Knockout'})[language]||'Orbital Knockout';
 return <div className="kangaroo-arena" data-scene-ready="true" data-paused={!visible||hp<=0} role="img" aria-label={title}>
  <svg viewBox="0 0 941 1672" preserveAspectRatio="xMidYMid slice" className="kangaroo-art" aria-hidden="true">
   <defs>
    {attachments.map(part=><clipPath id={id+part.id} key={part.id}><polygon points={part.points}/></clipPath>)}
    <radialGradient id={id+'sun'}><stop stopColor="#ff9d3c"/><stop offset="1" stopColor="#e85a1d"/></radialGradient>
   </defs>
   <image href={base+'background.webp'} width="941" height="1672"/>
   <circle className="kangaroo-sun" cx="191" cy="695" r="138" fill={'url(#'+id+'sun)'} />
   <image href={base+'background-rocks.webp'} width="941" height="1672"/>
   <g ref={rig}>
    <g transform="translate(75.28 147.2) scale(.84)">
     <g className="kangaroo-idle">
      <image href={base+'body-underpaint.webp'} width="941" height="1672"/>
      <g className="kangaroo-cigarette-smoke" fill="none" stroke="#dddcd2" strokeWidth="3" strokeLinecap="round">
       {[0,1,2].map(index=><path key={index} className="kangaroo-smoke-wisp" style={{animationDelay:`${index*-1.1}s`}} d="M805 550 C795 537 818 531 808 517 C798 503 819 498 810 484"/>)}
      </g>
      {attachments.map(part=><g key={part.id} className={'kangaroo-part kangaroo-'+part.id} style={{transformOrigin:part.pivot}}><image href={base+'boss.webp'} width="941" height="1672" clipPath={'url(#'+id+part.id+')'}/></g>)}
      <g className="kangaroo-part kangaroo-glove-right" style={{transformOrigin:'576px 752px'}}><image href={base+'glove-right-cut.webp'} width="941" height="1672"/></g>
     </g>
    </g>
   </g>
  </svg>
 </div>;
}
