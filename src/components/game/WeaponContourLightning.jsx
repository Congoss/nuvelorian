import {useEffect,useId,useRef} from 'react';
export default function WeaponContourLightning({src,color,bolts,paused,level=15,width=282,height=480}){
 const id=useId().replaceAll(':',''),svg=useRef(null);
 useEffect(()=>{if(paused)svg.current?.pauseAnimations?.();else svg.current?.unpauseAnimations?.();},[paused,level]);
 const count=level>=15?2:level>=12?1:0;
 return <svg ref={svg} className="p4-contour-lightning" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" data-paused={paused} data-lightning-level={level} aria-hidden="true"><defs><mask id={id+'mask'} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height} style={{maskType:'alpha'}}><image href={src} width={width} height={height}/></mask></defs><image href={src} width={width} height={height}/><g mask={'url(#'+id+'mask)'} fill="none" strokeLinecap="round" strokeLinejoin="round">{bolts?.slice(0,count).map((path,i)=>{
 const sequence=bolts.map((_,j)=>bolts[(j+i*2)%bolts.length]);sequence.push(sequence[0]);
 return <g className={'p4-axial-bolt p4-axial-bolt-'+i} key={i} style={{'--bolt-color':color,animationDelay:`${-i*1.7}s`,animationDuration:`${level>=15?4.7+i*.8:6.8}s`}}>{[[5.5,.2,color],[1.9,.9,color],[.7,.95,'#fff2d4']].map(([width,opacity,stroke],n)=><path key={n} d={path} stroke={stroke} strokeWidth={width} opacity={opacity}><animate attributeName="d" values={sequence.join(';')} dur={i?'.83s':'1.07s'} repeatCount="indefinite" calcMode="linear"/></path>)}</g>;
 })}</g></svg>;
}
