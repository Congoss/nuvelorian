import {readShipViewCache,writeShipViewCache} from '@/lib/shipViewCache';
import PaymentMethodPicker from '@/components/game/PaymentMethodPicker';
import { getShipConstructionProduct } from '@/lib/shipConstructionPayments';
import { gameApi } from '@/services/gameApi';
import BottomNav from '@/components/game/BottomNav';
import { shipText } from '@/lib/shipUiText';
import { useTranslation } from 'react-i18next';
import { shipLanguage } from '@/lib/clanShipBuffs';
import { createPortal } from 'react-dom';
import { getShipGoal, getShipSectorState } from '@/lib/clanShipSectorState';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { SHIP_ART_DIMENSIONS, SHIP_STORAGE_KEY, SHIP_ASSET_BASE, SHIP_PARTS, SHIP_MODULES, createShipLayout, createShipProgress, validateShipLayout } from '@/lib/clanShipPreview';
import './ClanShipPreview.css';
import ClanShipEffects from '@/components/game/ClanShipEffects';
import ShipSectorOutline from '@/components/game/ShipSectorOutline';
import { getShipConstructionClip } from '@/lib/shipConstructionFill';
import './ClanShipAnimation.css';
import ClanShipScenePanel from '@/components/game/ClanShipScenePanel';
import clanIcon from '@/assets/nav/clans-nav.png';
import TopBar from '@/components/game/TopBar';
import './ClanShipScene.css';

const fmt = (n) => Number(n).toLocaleString('uk-UA', { maximumFractionDigits: 3 });
const asset = (id) => `${SHIP_ASSET_BASE}${['background','hammer'].includes(id)?id+'.webp':id+'-mobile.webp'}`;
const ShipForge=lazy(()=>import('@/components/game/ShipForge'));
function initialLayout() {
  try { return validateShipLayout(JSON.parse(localStorage.getItem(SHIP_STORAGE_KEY))); } catch { return createShipLayout(); }
}

export default function ClanShipPreview({ onClose = null, profile = null, onNavigate = null }) {
  const { i18n } = useTranslation();
  const language = shipLanguage(profile?.language || i18n.resolvedLanguage || i18n.language);
  const tr=text=>shipText(text,language);
  const modules=SHIP_MODULES.map(m=>({...m,name:tr(m.name)}));
  const editorMode = !onClose && new URLSearchParams(window.location.search).get('editor') === '1';
  const serverMode = Boolean(onClose && profile?.id);
  const clanId = profile?.clan_id || profile?.clan_name;
  const [cachedShip]=useState(()=>serverMode?readShipViewCache(profile.id,clanId):null);
  const [wallet, setWallet] = useState(() => serverMode ? {tentacles:Number(profile.tentacles||0),energy:profile.energy,max_energy:profile.max_energy,premium:profile.premium,paidCredit:0} : { tentacles: 6000000, near:100, stars: 2500 });
  const [serverClanId,setServerClanId]=useState(cachedShip?.clanId||'');
  const [shipIdentity,setShipIdentity]=useState({clanName:cachedShip?.clanName||profile?.clan_name||'',shipName:cachedShip?.shipName||'',canRename:cachedShip?.canRename||false});
  const [renaming,setRenaming]=useState(false),[renameName,setRenameName]=useState(''),[renameBusy,setRenameBusy]=useState(false);
  const renamePending=useRef(null);
  const renameText=({uk:{action:'Перейменувати',hint:'Лідер може один раз безкоштовно назвати корабель. 2–32 символи.',save:'Зберегти',cancel:'Скасувати',name:'Назва корабля'},ru:{action:'Переименовать',hint:'Лидер может один раз бесплатно назвать корабль. 2–32 символа.',save:'Сохранить',cancel:'Отмена',name:'Название корабля'},en:{action:'Rename',hint:'The leader can name the ship once for free. 2–32 characters.',save:'Save',cancel:'Cancel',name:'Ship name'}})[language];
  const pendingContribution = useRef(null);
  const pendingStorageKey = 'ship-contribution:'+profile?.id+':'+clanId;
  const savePending = payload => { pendingContribution.current=payload;try{if(payload)sessionStorage.setItem(pendingStorageKey,JSON.stringify(payload));else sessionStorage.removeItem(pendingStorageKey);}catch{/* Server receipts remain authoritative. */} };
  useEffect(()=>{if(!serverMode)return;try{const saved=JSON.parse(sessionStorage.getItem(pendingStorageKey)||'null');if(saved?.requestId){pendingContribution.current=saved;setNotice(({uk:'Є незавершений внесок. Повторіть запит для перевірки.',ru:'Есть незавершённый взнос. Повторите запрос для проверки.',en:'A contribution is pending. Retry to check its result.'})[language]);}}catch{/* Ignore unavailable browser storage. */}},[serverMode,pendingStorageKey,language]);
  const contributionBusy = useRef(false);
  const serverEpoch = useRef(0);
  const aliveRef = useRef(true);
  useEffect(()=>{aliveRef.current=true;return()=>{aliveRef.current=false}},[]);
  const [help, setHelp] = useState(false);
  const [forgeOpen,setForgeOpen]=useState(false);
  const [shipGums,setShipGums]=useState(()=>({normal:0,improved:0,premium:0,...profile?.enhancement_gums}));
  const [layout, setLayout] = useState(() => editorMode ? initialLayout() : createShipLayout());
  const [progress, setProgress] = useState(()=>cachedShip?.progress||createShipProgress());
  const [sectorPanelOpen, setSectorPanelOpen] = useState(false);
  const [selected, setSelected] = useState(()=>getShipGoal(SHIP_MODULES,cachedShip?.progress||createShipProgress(),cachedShip?.bossKills||{}).id);
  const [allVisible, setAllVisible] = useState(false);
  const [editing, setEditing] = useState(editorMode);
  const [labels, setLabels] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('stars');
  const [nearRate, setNearRate] = useState(serverMode ? '0' : '2');
  const [constructionPayment,setConstructionPayment]=useState(null);
  useEffect(()=>{if(!serverMode)return;let alive=true;gameApi.getPaymentRates().then(rates=>{if(alive && Number(rates.nearUsd)>0)setNearRate(String(rates.nearUsd))}).catch(()=>{});return()=>{alive=false}},[serverMode]);
  const [hit, setHit] = useState(0);
  const [working, setWorking] = useState(false);
  const [constructionEffect, setConstructionEffect] = useState(null);
  const [bossKills, setBossKills] = useState(() => cachedShip?.bossKills||Object.fromEntries(SHIP_MODULES.map((entry) => [entry.id, 0])));
  const [ratios, setRatios] = useState({});
  const [personalKills,setPersonalKills]=useState(cachedShip?.personalKills||{});
  const [shipFights,setShipFights]=useState(cachedShip?.fights||{});
  const [lastWinnerProfiles,setLastWinnerProfiles]=useState(cachedShip?.lastWinnerProfiles||{});
  const [lastWinners,setLastWinners]=useState(cachedShip?.lastWinners||{});
  const applyServerShip = state => { if(!aliveRef.current || !state) return; if(serverMode)writeShipViewCache(profile.id,clanId,state); setShipGums(state.enhancementGums||{normal:0,improved:0,premium:0,...profile?.enhancement_gums});setServerClanId(state.clanId);setShipIdentity({clanName:state.clanName||profile?.clan_name||'',shipName:state.shipName||'',canRename:Boolean(state.canRename)});setWallet(state.wallet);setProgress(state.progress);setBossKills(state.bossKills);setPersonalKills(state.personalKills||{});setLastWinners(state.lastWinners||{});setLastWinnerProfiles(state.lastWinnerProfiles||{});setShipFights(state.fights||{}); };
  useEffect(()=>{
    if(!serverMode || !clanId)return;
    let alive=true;
    const refresh=()=>{if(contributionBusy.current)return;const epoch=serverEpoch.current;gameApi.getClanShip(clanId).then(state=>{if(alive && !contributionBusy.current && epoch===serverEpoch.current)applyServerShip(state)}).catch(error=>{if(alive)setNotice(error.message)});};
    refresh();const timer=setInterval(refresh,15000);
    return()=>{alive=false;clearInterval(timer)};
  },[serverMode,clanId]);

  const [notice, setNotice] = useState(serverMode ? '' : 'Тестові внески • справжні ресурси не списуються');
  const stage = useRef(null);
  const drag = useRef(null);
  const timer = useRef(null);
  const constructionTimer = useRef(null);
  const importInput = useRef(null);
  const rawPart = SHIP_PARTS.find((p) => p.id === selected);
  const part = {...rawPart,name:tr(rawPart.name)};
  const module = part.type === 'module' ? part : SHIP_MODULES.find((p) => progress[p.id] < p.cost) || SHIP_MODULES[0];
  const percent = Math.min(100, progress[module.id] / module.cost * 100);
  const completed = SHIP_MODULES.filter((p) => progress[p.id] >= p.cost).length;
  const scaffoldFill = (editorMode && allVisible) || completed === SHIP_MODULES.length ? 100 : 0;
  const available = module.level === 1 || (progress[SHIP_MODULES[module.level - 2].id] >= SHIP_MODULES[module.level - 2].cost && bossKills[SHIP_MODULES[module.level - 2].id] >= 1);
  useEffect(() => {
    if (!editorMode) return;
    try { localStorage.setItem(SHIP_STORAGE_KEY, JSON.stringify(layout)); } catch { setNotice('Не вдалося зберегти в браузері. Експортуй JSON.'); }
  }, [layout,editorMode]);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(constructionTimer.current); }, []);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionAllowed(!document.hidden && !reduced.matches);
    update(); document.addEventListener('visibilitychange', update); reduced.addEventListener('change', update);
    return () => { document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update); };
  }, []);
  function update(key, value) {
    if (!Number.isFinite(value)) return;
    setLayout((old) => validateShipLayout({ ...old, [selected]: { ...old[selected], [key]: value } }));
  }
  function startDrag(event, id) {
    if (!editorMode) return;
    setSelected(id);
    if (!editorMode && SHIP_MODULES.some(p=>p.id===id)) setSectorPanelOpen(true);
    if (!editing || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = stage.current.getBoundingClientRect();
    drag.current = { id, px: event.clientX, py: event.clientY, x: layout[id].x, y: layout[id].y, scale: 600 / rect.width };
  }
  function moveDrag(event) {
    if (!drag.current) return;
    const d = drag.current;
    setLayout((old) => ({ ...old, [d.id]: { ...old[d.id], x: Math.round(d.x + (event.clientX - d.px) * d.scale), y: Math.round(d.y + (event.clientY - d.py) * d.scale) } }));
  }
  function animate() {
    clearTimeout(timer.current);
    setHit((n) => n + 1); setWorking(true);
    timer.current = setTimeout(() => setWorking(false), 2400);
  }
  async function contribute(options = {}) {
    if(serverMode && ['stars','near'].includes(options.currency)) {
      const quantity=Number(options.amount);
      const stars=options.currency==='stars'?quantity:Math.ceil(quantity*Number(nearRate)*100);
      const item=getShipConstructionProduct(String(serverClanId||clanId),module.id,stars);
      if(!item || !(quantity>0)){setNotice(({uk:'Курс оплати або сума недоступні',ru:'Курс оплаты или сумма недоступны',en:'Payment rate or amount unavailable'})[language]);return false;}
      setConstructionPayment({...item,title:({uk:'Будівництво корабля',ru:'Строительство корабля',en:'Ship construction'})[language]+' · '+module.name,paymentMethod:options.currency==='stars'?'telegram_stars':'near'});return false;
    }
    if(serverMode){
      if(contributionBusy.current)return false;
      if(pendingContribution.current && !options.retry){setNotice(({uk:'Спочатку повторіть незавершений внесок.',ru:'Сначала повторите незавершённый взнос.',en:'Retry the pending contribution first.'})[language]);return false;}
      contributionBusy.current=true;serverEpoch.current++;
      const payload=pendingContribution.current || {requestId:crypto.randomUUID(),moduleId:module.id,currency:options.currency||currency,amount:Number(options.amount??amount)};
      savePending(payload);
      try{
        const result=await gameApi.contributeClanShip(clanId,payload);
        applyServerShip(result.ship);savePending(null);
        if(aliveRef.current){setNotice('');animate();}return result;
      }catch(error){
        if(error.status>=400 && error.status<500)savePending(null);
        if(aliveRef.current)setNotice(error.message);return false;
      }finally{contributionBusy.current=false;}
    }
    const chosen = options.currency || currency;
    const n = Number(options.amount ?? amount);
    const rate = chosen === 'tentacles' ? 1 : chosen === 'stars' ? 4000 : Number(nearRate) * 400000;
    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(rate) || rate <= 0 || !available || percent >= 100) return;
    const used = Math.min(Math.round(n * rate), module.cost - progress[module.id]);
    if (used <= 0) return;
    if (!editorMode && used / rate > wallet[chosen]) return;
    if (!editorMode) setWallet(old => ({ ...old, [chosen]: Math.max(0, old[chosen] - (chosen==='near'?used/rate:Math.ceil(used / rate))) }));
    setProgress((old) => ({ ...old, [module.id]: Math.min(module.cost, old[module.id] + used) }));
    clearTimeout(constructionTimer.current);
    setConstructionEffect({ id: module.id, completed: progress[module.id] + used >= module.cost, key: hit + 1 });
    constructionTimer.current = setTimeout(() => setConstructionEffect(null), 2400);
    setNotice(`Тест: +${fmt(used / rate)} ${chosen === 'tentacles' ? 'щупалець' : chosen === 'stars' ? 'Stars' : 'NEAR'} → ${module.name}`);
    animate();
    return {applied:used};
  }
  function exportLayout() {
    const blob = new Blob([JSON.stringify({ version: 1, layout }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clan-ship-layout.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importLayout(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setLayout(validateShipLayout(parsed.layout || parsed)); setNotice('Розкладку імпортовано');
    } catch { setNotice('Не вдалося імпортувати: перевір JSON розкладки.'); }
    event.target.value = '';
  }
  return <><main className={`ship-editor ${editorMode ? '' : 'ship-game-screen'} ${!editorMode && sectorPanelOpen ? 'ship-sector-expanded' : ''}`} onPointerDown={e=>{if(!editorMode&&!e.target.closest('.ship-inline-sector,.ship-part,.ship-module-rail')) setSectorPanelOpen(false)}}>
    <section className="ship-preview">
      {!editorMode && <div className="ship-top-bar"><TopBar mode="compact" profile={{ ...profile, ...wallet, language }} showSettings onOpenSettings={() => setHelp(value => !value)} /></div>}
      <header className="ship-header">
        {!editorMode && <button type="button" className="ship-header-back" onClick={()=>onClose ? onClose() : window.location.assign('/')}>{tr('← ДО КЛАНУ')}</button>}
        <div className="ship-header-title">{!editorMode && <img className="ship-clan-emblem" src={clanIcon} alt=""/>}<div><small>{editorMode ? 'КЛАНОВА ВЕРФ • ЛОКАЛЬНИЙ КОНЦЕПТ' : shipIdentity.clanName || profile?.clan_name || 'PLANET4'}</small><h1 title={shipIdentity.shipName||tr('КОРАБЕЛЬ КЛАНУ')}>{editorMode ? 'КОРАБЕЛЬ, ЩО ВИЖИВ' : shipIdentity.shipName || tr('КОРАБЕЛЬ КЛАНУ')}</h1>{serverMode&&shipIdentity.canRename&&<button type="button" className="ship-rename-trigger" onClick={()=>{setRenameName(shipIdentity.shipName);setRenaming(value=>!value)}}>{renameText.action} ✎</button>}</div></div>
        <div className="ship-header-status"><b>{tr('Збудовано')} {completed}/{SHIP_MODULES.length}</b>{!editorMode && <button className="ship-help" onClick={() => setHelp(!help)} aria-label={tr('Як працює корабель')}>?</button>}</div>
      </header>
      {!editorMode&&<div className="ship-gum-balances" aria-label={language==='ru'?'Запас жвачек':language==='en'?'Gum inventory':'Запас жуйок'}>{['normal','improved','premium'].map((type,index)=><button type="button" key={type} onClick={()=>setForgeOpen(true)} title={['Бубс','Буба-Шмуба','Космол'][index]}><i aria-hidden="true" style={{backgroundPosition:(index*50)+'% center'}}/><span>{['Бубс','Буба-Шмуба','Космол'][index]}</span><b>{Number(shipGums[type]||0).toLocaleString()}</b></button>)}</div>}
      {renaming&&shipIdentity.canRename&&<form className="ship-rename-form" onSubmit={async event=>{
        event.preventDefault();if(renameBusy)return;
        setRenameBusy(true);serverEpoch.current++;
        const name=renameName.trim();if(renamePending.current?.name!==name)renamePending.current={name,requestId:crypto.randomUUID()};
        try{const result=await gameApi.renameClanShip(serverClanId||clanId,renamePending.current);applyServerShip(result.ship);setRenaming(false);setNotice('');renamePending.current=null;}catch(error){setNotice(error.message)}finally{setRenameBusy(false);serverEpoch.current++;}
      }}><p>{renameText.hint}</p><input aria-label={renameText.name} value={renameName} maxLength={64} disabled={renameBusy} onChange={event=>setRenameName(event.target.value)}/><div><button type="button" disabled={renameBusy} onClick={()=>setRenaming(false)}>{renameText.cancel}</button><button type="submit" disabled={renameBusy||[...renameName.trim()].length<2||[...renameName.trim()].length>32}>{renameText.save}</button></div></form>}
      {!editorMode && help && <div className="ship-help-copy">{({uk:'Обирай відсік → роби внесок → завершуй будівництво. Кожен відсік має боса й баф. Внески заповнюють спільну шкалу.',ru:'Выбирай отсек → делай взнос → завершай строительство. У каждого отсека свой босс и баф. Взносы заполняют общую шкалу.',en:'Choose a sector → contribute → complete construction. Each sector has a boss and buff. Contributions fill a shared progress bar.'})[language]}</div>}
      {serverMode && notice && <div role="alert" className="p-3 text-sm text-[#f4d2a3]">{notice}{pendingContribution.current && <button type="button" onClick={()=>contribute({retry:true})}>{({uk:'Повторити внесок',ru:'Повторить взнос',en:'Retry contribution'})[language]}</button>}</div>}
      {serverMode && wallet.paidCredit > 0 && <div className="p-3 text-sm text-[#d3e4b1]">{({uk:'Резерв будівництва',ru:'Резерв строительства',en:'Construction reserve'})[language]}: {fmt(wallet.paidCredit)}{available && percent<100 && <button type="button" onClick={()=>contribute({currency:'paid_credit',amount:wallet.paidCredit})}>{({uk:'Використати',ru:'Использовать',en:'Apply'})[language]}</button>}</div>}
      <div className={`ship-stage ${editing ? 'ship-editing' : ''} ${animations && motionAllowed ? 'ship-live' : 'ship-motion-off'}`} ref={stage}>
        {!editorMode && <nav className="ship-module-rail" aria-label={({uk:'Відсіки корабля',ru:'Отсеки корабля',en:'Ship sectors'})[language]}>{[...modules].reverse().map(p=>{const state=getShipSectorState(p,SHIP_MODULES,progress,bossKills);return <button key={p.id} title={`${p.level}. ${p.name}`} aria-label={`${p.level}. ${p.name}, ${state.built?({uk:'збудовано',ru:'построено',en:'built'})[language]:state.unlocked?({uk:'будівництво',ru:'строительство',en:'building'})[language]:({uk:'закрито',ru:'закрыто',en:'locked'})[language]}`} aria-pressed={module.id===p.id} className={`${state.built?'is-built':state.unlocked?'is-building':'is-future'} ${module.id===p.id?'is-selected':''}`} onClick={()=>{setSelected(p.id);setSectorPanelOpen(true);setNotice('');}}><span className="ship-rail-marker"><img className="ship-rail-status-icon" src={'/clan-ship-status/'+(state.level===10?'complete':state.built?'battle':!state.unlocked?'locked':(progress[p.id]||0)>0?'building':'available')+'.webp'} alt=""/></span></button>})}</nav>}
        <img className="ship-background" src={asset('background')} alt="Клановий ангар" />
        {!editorMode && <nav className="ship-services ship-services-side" aria-label={language==='en'?'Ship services':language==='ru'?'Сервисы корабля':'Сервіси корабля'}><button type="button" onClick={()=>setForgeOpen(true)}><img className="ship-forge-logo" src="/local-enhancement/forge-logo.webp" alt=""/><span>{language==='en'?'Forge':'Кузня'}</span></button></nav>}
        <div className="ship-scene-art">
        {scaffoldFill < 100 && <div className="ship-blueprint" aria-hidden="true"><img src="/clan-ship-preview/blueprint-projection.webp" alt="" /></div>}
        {animations && motionAllowed && <div className="ship-ambient-dust" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i }}/>)}</div>}
        {SHIP_PARTS.map((p) => {
          const l = layout[p.id];
          const fill = p.type === 'module' ? Math.min(100, progress[p.id] / p.cost * 100) : 100;
          const ghost = !(editorMode && allVisible) && fill < 100;
          return <div key={p.id} role={editorMode ? 'button' : undefined} tabIndex={editorMode ? 0 : undefined} aria-label={p.name} data-part={p.id}
            className={`ship-part ${selected === p.id && editing ? 'ship-selected' : ''} ${!editorMode && module.id === p.id ? 'ship-part-active' : ''} ${p.type === 'worker' ? `ship-worker ${p.id}` : ''}`}
            style={{ left: `${l.x / 6}%`, top: `${l.y / 8.5}%`, width: `${l.width / 6}%`, zIndex: l.z, transform: `rotate(${l.angle}deg)` }}
            onPointerDown={(e) => startDrag(e, p.id)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(p.id); if(!editorMode&&p.type==='module') setSectorPanelOpen(true); }
              if (editing && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault(); setSelected(p.id); const step = e.shiftKey ? 10 : 1;
                setLayout((old) => ({ ...old, [p.id]: { ...old[p.id], x: old[p.id].x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0), y: old[p.id].y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0) } }));
              }
            }}>
            <div className={`ship-worker-body ship-art-${p.id} ${p.type === 'worker' && working ? 'ship-working' : ''} ${!ghost ? 'ship-operating' : ''} ${!editorMode && module.id === p.id ? 'ship-module-highlight' : ''}`} key={p.type === 'worker' ? hit : undefined}>
              <img draggable="false" className={ghost ? 'ship-unbuilt-placeholder' : ''} src={ghost ? `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${SHIP_ART_DIMENSIONS[p.id][0]}" height="${SHIP_ART_DIMENSIONS[p.id][1]}"/%3E` : asset(p.id)} alt={p.name} onLoad={(e) => { const ratio = e.currentTarget.naturalHeight / e.currentTarget.naturalWidth; setRatios((old) => old[p.id] === ratio ? old : { ...old, [p.id]: ratio }); }} />
              {ghost && fill > 0 && <img draggable="false" className="ship-built-part" style={{ opacity: .9, clipPath: `inset(${getShipConstructionClip(p.id,fill)}% 0 0 0)` }} src={asset(p.id)} alt="" />}
              {!editorMode && sectorPanelOpen && module.id === p.id && <ShipSectorOutline src={asset(p.id)} unbuilt={ghost}/>}
              {!ghost && animations && motionAllowed && p.type !== 'worker' && <ClanShipEffects id={p.id}/>}
              {constructionEffect?.id === p.id && animations && motionAllowed && <div key={constructionEffect.key} className={`ship-construction-fx ${constructionEffect.completed ? 'is-complete' : ''}`} aria-hidden="true"><i className="ship-construction-flash"/>{Array.from({ length: 7 }, (_, i) => <i key={i} className="ship-weld-spark" style={{ '--spark-angle': `${i * 51}deg`, '--spark-delay': `${i * 35}ms` }}/>)}</div>}
              {!ghost && animations && motionAllowed && ['garden', 'core', 'hangar', 'radar', 'bridge', 'habitat'].includes(p.id) && <img className={`ship-organic-patch ship-organic-${p.id}`} src={asset(p.id)} alt="" draggable="false"/>}
              {p.type === 'worker' && <svg className="ship-arm-rig" viewBox="0 0 200 1000" preserveAspectRatio="none" aria-hidden="true">
                <path d="M130 350 Q143 383 154 430" fill="none" stroke="#222720" strokeWidth="15" strokeLinecap="round"/>
                <path d="M130 350 Q143 383 154 430" fill="none" stroke="var(--arm-skin)" strokeWidth="10" strokeLinecap="round"/>
                <g transform="translate(154 430)"><g className="ship-hammer-arm">
                  <path d="M0 0 L64 -35" fill="none" stroke="#222720" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M0 0 L64 -35" fill="none" stroke="var(--arm-skin)" strokeWidth="10" strokeLinecap="round"/>
                  <image href={asset('hammer')} x="46" y="-112" width="48" height="82"/>
                  <ellipse cx="64" cy="-35" rx="9" ry="7" fill="var(--arm-skin)" stroke="#222720" strokeWidth="2"/>
                </g></g>
              </svg>}
              {p.type === 'worker' && working && <span className="ship-impact">✦</span>}
            </div>
            {(labels || (editing && selected === p.id)) && <span className="ship-part-label">{p.type === 'module' ? `${p.level}. ` : ''}{p.name}</span>}
          </div>;
        })}
        </div>
        {editorMode && <div className="ship-stage-caption">{editing ? 'Перетягуй деталі • стрілки — точне зміщення' : 'Натисни на відсік, щоб відкрити будівництво'}</div>}
      </div>
      {forgeOpen && createPortal(<div className="ship-forge-overlay"><Suspense fallback={<p>…</p>}><ShipForge profile={profile} language={language} onClose={()=>{setForgeOpen(false);if(serverMode)void gameApi.getClanShip(clanId).then(applyServerShip).catch(()=>{});}}/></Suspense></div>,document.body)}
      {!editorMode && <ClanShipScenePanel fights={shipFights} onNavigate={onNavigate} language={language} personalKills={personalKills} lastWinners={lastWinners} lastWinnerProfiles={lastWinnerProfiles} profile={profile} clanId={serverClanId||clanId} onServerChange={async()=>applyServerShip(await gameApi.getClanShip(clanId))} nearUsd={Number(nearRate)} allowStars={!serverMode || Boolean(profile?.telegram_id)} serverMode={serverMode} module={module} modules={modules} progress={progress} available={available} wallet={wallet} onContribute={contribute} notice={notice} selected={selected} bossKills={bossKills} onBossDefeat={(id)=>setBossKills(old=>({...old,[id]:Math.min(100,(old[id]||0)+1)}))} renderSectorPanel={panel=><div className="ship-sector-panel-slot">{panel}</div>} panelOpen={sectorPanelOpen} onClosePanel={()=>setSectorPanelOpen(false)} onSelectBoss={id=>{setSelected(id);setSectorPanelOpen(true)}} onNext={()=>setSelected(SHIP_MODULES[Math.min(SHIP_MODULES.length - 1,module.level)].id)}/>} 
      {editorMode && <section className="ship-donation">
        <div className="ship-module-heading"><h2>{module.name}</h2><span>МОДУЛЬ {module.level}/{SHIP_MODULES.length}</span></div>
        <p>{module.benefit}</p>
        <div className="ship-progress"><i style={{ width: `${percent}%` }}/><b>{fmt(percent)}%</b></div>
        <small>{fmt(progress[module.id])} / {fmt(module.cost)} щупалець · або {fmt(module.cost / 4000)} Stars</small>
        <div className="ship-payment"><select aria-label="Валюта внеску" value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="tentacles">Щупальця</option><option value="stars">Stars</option><option value="near">NEAR (тест)</option></select><input aria-label="Сума внеску" type="number" min="0" step={currency === 'near' ? '.01' : '1'} value={amount} onChange={(e) => setAmount(e.target.value)}/><button disabled={!available || percent >= 100 || !(Number(amount) > 0)} onClick={contribute}>ВНЕСТИ</button></div>
        {currency === 'near' && <label className="ship-near-rate">Тестовий курс USD за NEAR <input type="number" min=".01" step=".01" value={nearRate} onChange={(e) => setNearRate(e.target.value)}/></label>}
        {!available && <p>Спочатку добудуй попередній модуль.</p>}
        <p className="ship-notice" role="status">{notice}</p>
      </section>}
    </section>
    {editorMode && <aside className="ship-tools">
      <a className="ship-scene-link" href="/clan-ship-preview">← Ігровий вигляд</a>
      <small>РЕДАКТОР КОМПОЗИЦІЇ</small><h2>Твоя космічна халабуда</h2>
      <p>Позиції зберігаються в цьому браузері. Експортуй JSON, щоб передати розкладку.</p>
      <label><input type="checkbox" checked={editing} onChange={(e) => setEditing(e.target.checked)}/> Рухати деталі</label>
      <label><input type="checkbox" checked={allVisible} onChange={(e) => setAllVisible(e.target.checked)}/> Показати весь корабель</label>
      <label><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)}/> Назви відсіків</label>
      <label><input type="checkbox" checked={animations} onChange={(e) => setAnimations(e.target.checked)}/> Живий корабель</label>
      <select aria-label="Вибрати деталь" value={selected} onChange={(e) => setSelected(e.target.value)}>{SHIP_PARTS.map((p) => <option key={p.id} value={p.id}>{p.type === 'module' ? `${p.level}. ` : ''}{p.name}</option>)}</select>
      <div className="ship-fields">{[['x', 'X'], ['y', 'Y'], ['width', 'Ширина'], ['angle', 'Поворот °'], ['z', 'Шар']].map(([key, label]) => <label key={key}>{label}<input aria-label={label} type="number" value={layout[selected][key]} onChange={(e) => update(key, Number(e.target.value))}/></label>)}</div>
      <div className="ship-tool-buttons"><button onClick={exportLayout}>Експорт JSON</button><button onClick={() => importInput.current.click()}>Імпорт JSON</button><input ref={importInput} hidden type="file" accept=".json,application/json" onChange={importLayout}/><button onClick={animate}>Тест молотків</button><a href={asset(selected)} download={`${selected}.png`}>PNG деталі ↓</a><a href={asset('background')} download="background.png">PNG фону ↓</a><button onClick={() => { setLayout(createShipLayout()); setNotice('Початкову розкладку відновлено'); }}>Скинути позиції</button></div>
      <details><summary>Тест будівництва</summary><button onClick={() => { setProgress(Object.fromEntries(SHIP_MODULES.map((p) => [p.id, 0]))); setSelected('hull'); setAllVisible(false); }}>Почати з нуля</button><button onClick={() => setProgress(Object.fromEntries(SHIP_MODULES.map((p) => [p.id, p.cost])))}>Завершити всі модулі</button><button onClick={() => setProgress(createShipProgress())}>Повернути демо-прогрес</button></details>
      <p className="ship-footnote">Локальний прототип. Платежі, боси й бонуси ще не підключені. Курс: 1 Star = 4 000 одиниць будівництва; NEAR — за курсом оплати.</p>
    </aside>}
  </main>{constructionPayment && createPortal(<div className="fixed inset-0 z-[500]"><PaymentMethodPicker pack={constructionPayment} paymentMethods={[{id:constructionPayment.paymentMethod,title:constructionPayment.paymentMethod==='near'?'NEAR':'Stars'}]} initialMethodId={constructionPayment.paymentMethod} onClose={()=>setConstructionPayment(null)} onSuccess={async()=>{setConstructionPayment(null);try{applyServerShip(await gameApi.getClanShip(clanId));setNotice('');animate();}catch(error){setNotice(error.message)}}}/></div>,document.body)}{!editorMode&&<div className="ship-local-bottom-nav"><BottomNav activeTab="clan" language={language} onTabChange={onNavigate||(()=>onClose?onClose():window.location.assign('/'))}/></div>}</>;
}
