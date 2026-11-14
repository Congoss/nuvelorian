import {useEffect,useState} from 'react';
export default function GumWelder({icon,chance,busy,label,result,gum='normal',gums={},onSelectGum,disabled,language='uk',onChooseItem}) {
 const [picker,setPicker]=useState(false),[pulse,setPulse]=useState(0);
 useEffect(()=>{if(result?.type==='enhance')setPulse(value=>value+1)},[result]);
 const copy=language==='ru'?{choose:'Жвачка',normal:'Бубс',improved:'Буба-Шмуба',premium:'Космол',close:'Закрыть'}:language==='en'?{choose:'Gum',normal:'Boobs',improved:'Booba-Shmooba',premium:'Cosmol',close:'Close'}:{choose:'Жуйка',normal:'Бубс',improved:'Буба-Шмуба',premium:'Космол',close:'Закрити'};
 const delta=result?.type==='enhance'?Number(result.after)-Number(result.before):0;
 const outcome=language==='ru'?(result?.success?'НАУКА, ДЕТКА!':'ПРЕСС ОБЛАЖАЛСЯ!'):language==='en'?(result?.success?'SCIENCE, BABY!':'THE PRESS SCREWED UP!'):(result?.success?'НАУКА, ДИТИНКО!':'ПРЕС ОБЛАЖАВСЯ!');
 return <div className={`gum-welder gum-user-press gum-press-six ${busy?'is-working':''}`} aria-label={label}>
  <div className="forge-ambient-steam" aria-hidden="true">{['left','right'].map(side=><div key={side} className={'forge-steam-vent forge-steam-vent-'+side}>{Array.from({length:4},(_,i)=><i key={i} style={{'--puff':i}}><b/><b/><b/></i>)}</div>)}</div><img className="forge-cut-body" src="/local-enhancement/forge-reference-body-mobile.webp" alt=""/>
  {icon&&<div className="forge-projector" aria-hidden="true"><i className="forge-projector-beam"/><i className="forge-projector-base"/><i className="forge-projector-scan"/></div>}<div className="forge-lights" aria-hidden="true">{[{x:14.8,y:12.1,w:3.6,h:6.2},{x:4.9,y:31.8,w:1.5,h:4.8},{x:78.8,y:17.1,w:3.2,h:6.1},{x:87.1,y:15.5,w:1.5,h:6.2},{x:94.2,y:53.7,w:1.3,h:7.2},{x:25.2,y:86.8,w:3.2,h:1.8},{x:71.7,y:86.8,w:3.2,h:1.8}].map((lamp,i)=><i key={i} style={{left:lamp.x+'%',top:lamp.y+'%',width:lamp.w+'%',height:lamp.h+'%',animationDelay:(i*-.37)+'s'}}/>)}</div><div className="forge-inner-shaft forge-inner-shaft-left" aria-hidden="true"/><div className="forge-inner-shaft forge-inner-shaft-right" aria-hidden="true"/><img className="forge-cut-ram forge-cut-ram-left" src="/local-enhancement/forge-reference-left-mobile.webp" alt=""/>
  <img className="forge-cut-ram forge-cut-ram-right" src="/local-enhancement/forge-reference-right-mobile.webp" alt=""/>
  <button type="button" className="gum-gear-slot" aria-label={language==='en'?'Choose equipment':language==='ru'?'Выбрать снаряжение':'Вибрати спорядження'} disabled={busy} onClick={onChooseItem}>{icon?<img src={icon} alt=""/>:<span>+</span>}</button>
  <button className="gum-user-slot" type="button" aria-label={copy.choose} aria-expanded={picker} disabled={busy||disabled} onClick={()=>setPicker(value=>!value)}><span className="gum-slot-content">{gum?<i style={{backgroundPosition:`${({normal:0,improved:50,premium:100})[gum]}% center`}}/>:<span>+</span>}</span></button>
  <b className="gum-six-stock">{gum?'×'+(gums[gum]||0):'—'}</b>
  
  <div className="gum-user-meter"><span style={{transform:`rotate(${-65+Math.max(0,Math.min(100,Number(chance)||0))*1.3}deg)`}}/><b>{chance==null?'—':chance+'%'}</b></div>
  <div className="gum-welder-particles" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{'--spark-angle':`${i*45}deg`,'--spark-delay':`${i*15}ms`}}/>)}</div>
  {busy&&<img className="gum-six-smoke" src="/local-enhancement/press-smoke-v6.webp" alt=""/>}
  {pulse>0&&!busy&&<div key={pulse} className={`gum-welder-result ${result?.success?'is-success':'is-failure'}`}><b>{delta>0?`+${delta}`:delta<0?`−${Math.abs(delta)}`:'0'}</b><strong className="gum-six-outcome" role="status">{outcome}</strong></div>}
  {picker&&<div className="gum-slot-picker" role="group" aria-label={copy.choose}><div><b>{copy.choose}</b><button type="button" aria-label={copy.close} onClick={()=>setPicker(false)}>×</button></div>{['normal','improved','premium'].map((type,i)=><button key={type} type="button" aria-pressed={gum===type} disabled={busy||disabled||!gums[type]} onClick={()=>{onSelectGum?.(type);setPicker(false)}}><i style={{backgroundPosition:`${i*50}% center`}}/><span>{copy[type]}</span><b>×{gums[type]||0}</b></button>)}</div>}
 </div>;
}
