import { useId } from 'react';

export default function ShipSectorOutline({src, unbuilt = false}) {
 const id='ship-outline-'+useId().replaceAll(':','');
 return <svg className="ship-sector-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <defs><filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
   <feMorphology in="SourceAlpha" operator="dilate" radius={unbuilt ? .7 : .45} result="outer"/>
   <feComposite in="outer" in2="SourceAlpha" operator="out" result="edge"/>
   <feFlood floodColor="#ffe7a0" floodOpacity={unbuilt ? .9 : .7}/><feComposite in2="edge" operator="in" result="line"/>
   <feGaussianBlur in="line" stdDeviation={unbuilt ? .75 : .55} result="glow"/>
   <feMerge><feMergeNode in="glow"/><feMergeNode in="line"/></feMerge>
  </filter></defs>
  <image href={src} width="100" height="100" preserveAspectRatio="none" filter={`url(#${id})`}/>
 </svg>;
}
