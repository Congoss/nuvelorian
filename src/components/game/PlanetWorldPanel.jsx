import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LayeredHero from './LayeredHero';
import { worldHeroLayers } from './worldHeroLayers';
import { initialWorld, createWorldMap, hexDistance, BUILDINGS, buildingCost } from '@/lib/planetWorld';
import './planetWorld.css';

const TEXT={
  uk:{title:'НЕЗВІДАНА ПЛАНЕТА',back:'До персонажа',day:'День',moves:'Ходи',crystals:'Кристали',home:'Моя планета',rest:'Наступний день',hint:'Натисни сусідню клітинку. Вартовий коштує 3 ходи, інші поля — 1.',citadel:'Цитадель · більше ходів',mine:'Шахта · кристали щодня',observatory:'Обсерваторія · огляд',plain:'Пустка',crystal:'Кристали +8',guardian:'Вартовий · +12 кристалів',portal:'Портал додому',ruins:'Руїни · +6 кристалів',fog:'Невідома територія',error:'Дію не виконано. Спробуй ще раз.',WORLD_RETURN_HOME:'Повернися на свою планету.',WORLD_NO_MOVES:'Бракує ходів. Повертайся додому до завершення запасу.',WORLD_NO_CRYSTALS:'Бракує кристалів.',max:'Максимум',returnHint:'Залишай ходи на повернення. Портал одноразово переносить додому.',rescue:'Повернутися додому'},
  ru:{title:'НЕИЗВЕДАННАЯ ПЛАНЕТА',back:'К персонажу',day:'День',moves:'Ходы',crystals:'Кристаллы',home:'Моя планета',rest:'Следующий день',hint:'Нажми соседнюю клетку. Страж стоит 3 хода, остальные поля — 1.',citadel:'Цитадель · больше ходов',mine:'Шахта · кристаллы каждый день',observatory:'Обсерватория · обзор',plain:'Пустошь',crystal:'Кристаллы +8',guardian:'Страж · +12 кристаллов',portal:'Портал домой',ruins:'Руины · +6 кристаллов',fog:'Неизвестная территория',error:'Не удалось выполнить действие.',WORLD_RETURN_HOME:'Вернись на свою планету.',WORLD_NO_MOVES:'Не хватает ходов.',WORLD_NO_CRYSTALS:'Не хватает кристаллов.',max:'Максимум',returnHint:'Оставляй ходы на возвращение. Портал одноразово переносит домой.',rescue:'Вернуться домой'},
  en:{title:'UNCHARTED PLANET',back:'Back to character',day:'Day',moves:'Moves',crystals:'Crystals',home:'My planet',rest:'Next day',hint:'Tap an adjacent tile. Guardians cost 3 moves; other tiles cost 1.',citadel:'Citadel · more moves',mine:'Mine · daily crystals',observatory:'Observatory · vision',plain:'Wasteland',crystal:'Crystals +8',guardian:'Guardian · +12 crystals',portal:'Portal home',ruins:'Ruins · +6 crystals',fog:'Unexplored',error:'Action failed. Try again.',WORLD_RETURN_HOME:'Return to your planet.',WORLD_NO_MOVES:'Not enough moves.',WORLD_NO_CRYSTALS:'Not enough crystals.',max:'Maximum',returnHint:'Save moves for the return trip. Portals teleport home once.',rescue:'Return home'}
};
export default function PlanetWorldPanel({profile,onUpdateProfile,onClose}) {
  const {i18n}=useTranslation();
  const text=TEXT[i18n.language?.split('-')[0]]||TEXT.uk;
  const state=profile.planet_world||initialWorld(profile.id);
  const heroLayers=useMemo(()=>worldHeroLayers(profile),[profile]);
  const [camera,setCamera]=useState({q:state.q,r:state.r});
  const [walking,setWalking]=useState(false);
  useEffect(()=>{
    setWalking(true);
    const timer=setTimeout(()=>{setCamera({q:state.q,r:state.r});setWalking(false);},420);
    return ()=>clearTimeout(timer);
  },[state.q,state.r]);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function act(action) {
    if(busy)return;
    setBusy(true);setError('');
    try { const result=await onUpdateProfile({playerAction:action}); if(result===false) setError(text.error); }
    catch(e){setError(text[e.code]||text.error);} finally{setBusy(false);}
  }
  const atHome=state.q===0&&state.r===0;
  return <section className="planet-world" aria-busy={busy}>
    <header><button onClick={onClose}>← {text.back}</button><small>PLANET4 / EXPEDITION</small><h2>{text.title}</h2></header>
    <div className="pw-stats"><span>{text.day} <b>{state.day}</b></span><span>{text.moves} <b>{state.moves}</b></span><span>◆ <b>{state.crystals}</b></span></div>
    <p>{text.hint}</p>
    <div className="pw-map"><svg viewBox={`${54*(camera.q+camera.r/2)-185} ${30*camera.r-165} 370 330`} role="group" aria-label={text.title}>
      <defs>
        <linearGradient id="pw-stone" x2=".3" y2="1"><stop stopColor="#718993"/><stop offset=".5" stopColor="#4e6877"/><stop offset="1" stopColor="#3f5969"/></linearGradient>
        <radialGradient id="pw-space"><stop stopColor="#34575c"/><stop offset="1" stopColor="#152b34"/></radialGradient>
        <radialGradient id="pw-mist"><stop stopColor="#809c9d" stopOpacity=".35"/><stop offset="1" stopColor="#547d82" stopOpacity="0"/></radialGradient>
        <filter id="pw-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
        <g id="pw-platform">
          <path d="M-27-10V5L0 22V7Z" fill="#253e50" stroke="#152d3c" strokeWidth=".7"/>
          <path d="M0 7V22L27 5V-10Z" fill="#182d3e" stroke="#102333" strokeWidth=".7"/>
          <polygon points="0,-24 27,-10 27,7 0,22 -27,7 -27,-10" fill="url(#pw-stone)" transform="translate(0 -9) scale(1 .72)" stroke="#253e50" strokeWidth="1.4"/>
          <path d="M-26-15 0-29 26-15 26-4 0 11-26-4Z" fill="url(#pw-stone)" stroke="#263e50" strokeWidth="1"/>
          <path d="M-24-14 0-26 24-14M-24-13V-5L0 8 24-5V-13" fill="none" stroke="#8a9da4" strokeWidth=".7"/>
          <path d="M-19-12 0-22 19-12 19-6 0 4-19-6Z M-15-11 0-19 15-11 15-7 0 1-15-7Z" fill="none" stroke="#283f53" strokeWidth="1.1"/>
          <path d="M-17-11-8-6-14-2M-7-18-7-12 0-8 7-12 7-18M17-11 8-6 14-2M-5 1-5-4 0-7 5-4 5 1M-25-3-21-1-21 6M25-3 21-1 21 6M-15 4-15 12M15 4 15 12M-7 8-7 17M7 8 7 17" fill="none" stroke="#243a4e" strokeWidth=".8"/>
          <path d="M-22-16-17-13-19-10M12-19 9-17 12-15M-12-23-9-21M19-8 22-6M-10 3-8 5M4-25 8-23M-24 0-20 2M3 13 6 12M-17-7-13-9-10-7M10-5 13-7 16-5" fill="none" stroke="#a1b2ba" strokeOpacity=".45" strokeWidth=".5"/>
          <path d="M-26 1 0 15 26 1M-26 7 0 21 26 7" fill="none" stroke="#617c88" strokeOpacity=".35" strokeWidth=".7"/>
        </g>
        <g id="pw-crystal">
          <ellipse cy="-8" rx="20" ry="10" fill="#55ffff" opacity=".7" filter="url(#pw-glow)"/>
          <path d="M-17-8 0-23 18-8 0 1Z" fill="#60eff4" fillOpacity=".28" stroke="#afffff" strokeWidth="1.1"/>
          <path d="M-12-9 0-20 12-9 0-1Z M-12-9 12-9M0-20-5-9 0-1 5-9Z" fill="none" stroke="#baffff" strokeWidth="1.1"/>
          <path d="M-21-9-17-12-17-6ZM19-13 23-10 19-7Z" fill="#d1ffff"/>
        </g>
        <g id="pw-outpost">
          <ellipse cy="-6" rx="17" ry="9" fill="#152431"/>
          <path d="M-17-8-10-16 10-16 17-8 12 0-12 0Z" fill="#55616b" stroke="#b4aaa1" strokeWidth="1"/>
          <path d="M-10-12 0-17 11-12 8-5 0-2-8-5Z" fill="#7e469c" stroke="#c37ee4"/>
          <ellipse cy="-9" rx="7" ry="4" fill="#be62f1" filter="url(#pw-glow)"/>
          <path d="M-14-14-11-23-7-22-9-13M13-12 11-23 7-22 9-13" fill="#313e4d" stroke="#8d8b87" strokeWidth="1.2"/>
          <path d="M-9-17V-42" stroke="#303342" strokeWidth="2"/>
          <path d="M-8-41 5-38-1-32 3-25-8-28Z" fill="#852974" stroke="#bb4b9f" strokeWidth=".7"/>
          <path d="M-5-35 0-32-4-29Z" fill="#d180e8"/>
        </g>
      </defs>
      <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#pw-space)"/>
      {createWorldMap(state.seed).sort((a,b)=>a.r-b.r||a.q-b.q).map(cell=>{
        const x=54*(cell.q+cell.r/2),y=30*cell.r,known=state.discovered.includes(cell.key),here=state.q===cell.q&&state.r===cell.r,near=hexDistance(state,cell)===1;
        const visible=hexDistance(state,cell)<=2+Math.floor(state.buildings.observatory/2);
        const cleared=state.cleared.includes(cell.key)&&cell.kind!=='home';
        const move=()=>known&&near&&!busy&&act({type:'world-move',q:cell.q,r:cell.r});
        if(!known) return <ellipse key={cell.key} cx={x} cy={y} rx="42" ry="29" fill="url(#pw-mist)" pointerEvents="none"/>;
        return <g key={cell.key} transform={`translate(${x} ${y})`} opacity={visible ? 1 : .4} className={`pw-tile ${near?'reachable':''} ${here?'current':''}`} role="button" tabIndex={near&&!busy?0:-1} aria-disabled={!near||busy} aria-label={`${text[cell.kind]} (${cell.q}, ${cell.r})`} onClick={move} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();move();}}}>
          <use href="#pw-platform"/>
          {near&&<path className="pw-step" d="M-24-14 0-26 24-14 24-5 0 8-24-5Z"/>}
          {!cleared&&cell.kind==='crystal'&&<use href="#pw-crystal"/>}
          {!cleared&&(cell.kind==='guardian'||cell.kind==='ruins')&&<use href="#pw-outpost"/>}
          {!cleared&&cell.kind==='portal'&&<g><use href="#pw-crystal"/><path d="M-10-9V-32L0-42 10-32V-9L0-3Z" fill="#183e52" stroke="#7bffff"/><path d="M0-37 6-29 0-15-6-29Z" fill="#86ffff"/></g>}
          {cell.kind==='home'&&<g><path d="M-17-8V-27L-9-32-2-28V-13L8-18V-36L16-40 22-35V-5L2 6Z" fill="#576c80" stroke="#a1b3bb" strokeWidth=".8"/><path d="M-17-27-9-35-2-28-10-23ZM8-36 16-44 22-35 15-30Z" fill="#53858a" stroke="#a5eff0" strokeWidth=".7"/><path d="M-8-20V-11M15-27V-18M1-7V3" stroke="#82ffff" strokeWidth="2"/></g>}
          <title>{known?text[cell.kind]:text.fog}</title>
        </g>;
      })}
      <g className="pw-player" style={{transform:`translate(${54*(state.q+state.r/2)}px, ${30*state.r}px)`}} pointerEvents="none">
        <ellipse cy="-3" rx="11" ry="5" fill="#b8ffff" opacity=".35"/>
        <foreignObject x="-15" y="-87" width="30" height="84" overflow="visible">
          <div xmlns="http://www.w3.org/1999/xhtml" className={`pw-player-art ${walking?'pw-walking':''}`}><LayeredHero className="h-full w-full" {...heroLayers}/></div>
        </foreignObject>
      </g>
    </svg></div>
    <div className="pw-legend">◆ {text.crystals} · ⚔ {text.guardian} · ◎ {text.portal}</div>
    <p>{text.returnHint}</p>
    {!atHome&&<button disabled={busy} onClick={()=>act({type:'world-return'})}>{text.rescue}</button>}
    {error&&<p role="alert">{error}</p>}
    <div className="pw-base"><h3>⌂ {text.home}</h3><button disabled={busy||!atHome||state.moves===18+state.buildings.citadel*2} onClick={()=>act({type:'world-rest'})}>{text.rest}</button>
      {BUILDINGS.map(id=><div className="pw-building" key={id}><span>{text[id]}<small>LVL {state.buildings[id]} / 5</small></span><button disabled={busy||!atHome||state.buildings[id]>=5||state.crystals<buildingCost(state.buildings[id])} onClick={()=>act({type:'world-build',building:id})}>{state.buildings[id]>=5?text.max:`↑ ${buildingCost(state.buildings[id])} ◆`}</button></div>)}
    </div>
  </section>;
}
