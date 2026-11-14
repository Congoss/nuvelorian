import {useEffect,useState} from 'react';
import './desktopSpaceBackdrop.css';

const ROOT='/desktop-space-v1/';
const STARS=Array.from({length:16},(_,i)=>({left:7+(i*37)%87,top:4+(i*23)%91,delay:-(i*1.7),duration:4+(i%5),size:i%4===0?3:2}));
function SpaceSide({side}){
 return <div className={`desktop-space-side is-${side}`}>
  {side==='right'&&<div className="desktop-space-galaxy"><img src={ROOT+'galaxy.webp'} alt="" decoding="async"/></div>}
  <div className={`desktop-space-planet ${side==='left'?'is-violet':'is-teal'}`}><img src={ROOT+(side==='left'?'planet-violet':'planet-teal')+'.webp'} alt="" decoding="async"/></div>
  {side==='left'&&<div className="desktop-space-planet is-moon"><img src={ROOT+'moon-orange.webp'} alt="" decoding="async"/></div>}
  <div className={`desktop-space-junk ${side==='left'?'is-satellite':'is-boot'}`}><img src={ROOT+(side==='left'?'junk-satellite':'junk-boot')+'.webp'} alt="" decoding="async"/></div>
  <div className="desktop-space-stars">{STARS.map((star,i)=><i key={i} style={{left:star.left+'%',top:star.top+'%',width:star.size,height:star.size,'--star-delay':star.delay+'s','--star-duration':star.duration+'s'}}/>)}</div>
  <i className="desktop-space-comet"/>
 </div>;
}
export default function DesktopSpaceBackdrop(){
 const [wide,setWide]=useState(false),[paused,setPaused]=useState(()=>document.hidden);
 useEffect(()=>{const query=window.matchMedia('(min-width: 800px)');const update=()=>setWide(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 useEffect(()=>{const update=()=>setPaused(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[]);
 if(!wide)return null;
 return <div className="desktop-space-backdrop" aria-hidden="true" data-paused={paused}><div className="desktop-space-nebula"/><SpaceSide side="left"/><SpaceSide side="right"/></div>;
}
