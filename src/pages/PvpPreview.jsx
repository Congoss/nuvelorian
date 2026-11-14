import BossWeaponIcon from '@/components/game/BossWeaponIcon';
import PvpBattleEffects,{PvpDefeatSmoke,pvpRoundOutcome} from '@/components/game/PvpBattleEffects';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Settings2,Swords,Trophy} from 'lucide-react';
import {DUEL_ACTIONS,DUEL_SET_NAMES,duelStats,demoDuelProfile} from '../lib/pvpDuel.js';
import heroIcon from '@/assets/optimized/nav-hero.webp';
import bossesIcon from '@/assets/optimized/all/nav/boss-nav.webp';
import talentsIcon from '@/assets/optimized/all/nav/talents-nav.webp';
import PvpLobby,{PvpAttempts} from './PvpLobby';
import './pvpPreview.css';
const weaponIds = {finger: 'fist', pencil: 'knuckle', poison: 'satchel'};
const words={uk:{title:'ОРБІТАЛЬНА ДУЕЛЬ',finger:'ПАЛЕЦЬ',pencil:'ОЛІВЕЦЬ',poison:'МАЛИЙ ЯД',start:'ПОЧАТИ ДУЕЛЬ',again:'ЩЕ ОДНА ДУЕЛЬ',choose:'ОБЕРИ ПРИЙОМ',damage:'Шкода від зброї',round:'Раунд',win:'ПЕРЕМОГА!',loss:'ПОРАЗКА!',draw:'НІЧИЯ',settings:'ПРИМІРКА БІЛДУ',set:'Комплект',enh:'Заточка',talents:'Очки атакувальних талантів',local:'Локальний прототип · без ставок і нагород',prize:'Приз торговця',pending:'очікує виплати (симуляція)',noPrize:'Без призу',help:'Палець перемагає олівець. Олівець перемагає яд. Яд перемагає палець. Однаковий вибір — нічия. Усі три прийоми мають однакову шкоду від твоєї пухи. HP залежить від захисних речей. Хід ШІ фіксується до твого вибору; він вчиться лише на минулих ходах.',close:'Зрозуміло',ready:'ШІ вже обрав свій хід',wait:'Розкриваємо ходи…',abandon:'Вийти з дуелі',saved:'Оновлення сторінки зберігає поточний бій',error:'Не вдалося виконати дію. Повтори запит.',styles:{balanced:'Зважений пілот',counter:'Читає повтори',tricky:'Непередбачуваний пілот'}},ru:{title:'ОРБИТАЛЬНАЯ ДУЭЛЬ',finger:'ПАЛЕЦ',pencil:'КАРАНДАШ',poison:'МАЛЫЙ ЯД',start:'НАЧАТЬ ДУЭЛЬ',again:'ЕЩЁ ОДНА ДУЭЛЬ',choose:'ВЫБЕРИ ПРИЁМ',damage:'Урон от оружия',round:'Раунд',win:'ПОБЕДА!',loss:'ПОРАЖЕНИЕ!',draw:'НИЧЬЯ',settings:'ПРИМЕРКА БИЛДА',set:'Комплект',enh:'Заточка',talents:'Очки атакующих талантов',local:'Локальный прототип · без ставок и наград',prize:'Приз торговца',pending:'ожидает выплаты (симуляция)',noPrize:'Без приза',help:'Палец побеждает карандаш. Карандаш побеждает яд. Яд побеждает палец. Одинаковый выбор — ничья. Все приёмы наносят одинаковый урон от твоего оружия. HP зависит от защитных вещей. ИИ выбирает ход заранее и учится только на прошлых ходах.',close:'Понятно',ready:'ИИ уже выбрал свой ход',wait:'Раскрываем ходы…',abandon:'Выйти из дуэли',saved:'Обновление страницы сохраняет бой',error:'Не удалось выполнить действие. Повтори запрос.',styles:{balanced:'Взвешенный пилот',counter:'Читает повторы',tricky:'Непредсказуемый пилот'}},en:{title:'ORBITAL DUEL',finger:'FINGER',pencil:'PENCIL',poison:'SMALL POISON',start:'START DUEL',again:'ONE MORE DUEL',choose:'CHOOSE YOUR MOVE',damage:'Weapon damage',round:'Round',win:'VICTORY!',loss:'DEFEAT!',draw:'DRAW',settings:'TRY A BUILD',set:'Set',enh:'Enhancement',talents:'Offensive talent points',local:'Local prototype · no stakes or rewards',prize:'Merchant prize',pending:'pending payout (simulated)',noPrize:'No prize',help:'Finger beats pencil. Pencil beats poison. Poison beats finger. Equal choices draw. Every move deals the same damage from your weapon. Defensive gear determines HP. AI commits first and only learns from past moves.',close:'Got it',ready:'AI has already committed its move',wait:'Revealing moves…',abandon:'Leave duel',saved:'Refreshing keeps the current duel',error:'Could not complete the action. Retry.',styles:{balanced:'Balanced pilot',counter:'Reads repeated moves',tricky:'Unpredictable pilot'}}};
const nf=n=>Number(n).toLocaleString('uk-UA');
export default function PvpPreview(){
 const [mode,setMode]=useState('ranked'),[inLobby,setInLobby]=useState(false),[progress,setProgress]=useState(null);
 const [lang,setLang]=useState('uk'),[preset,setPreset]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('p4-pvp-preset'));demoDuelProfile(saved);return saved;}catch{return {set:'cardboard_survivor',enhancement:15,talents:0};}}),[match,setMatch]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState(''),[flash,setFlash]=useState(null),[retry,setRetry]=useState(null);
 const lock=useRef(false),timer=useRef(),help=useRef(),pending=useRef(null),build=useRef(null);
 const [session]=useState(()=>{const key='p4-pvp-local-session';const s=localStorage.getItem(key)||sessionStorage.getItem(key)||crypto.randomUUID();localStorage.setItem(key,s);return s;});
 useEffect(()=>{try{localStorage.setItem('p4-pvp-preset',JSON.stringify(preset));}catch{}},[preset]);
 const t=words[lang],preview=useMemo(()=>duelStats(demoDuelProfile(preset)),[preset]);
 async function api(body){const r=await fetch('/api/local-pvp',{method:body?'POST':'GET',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json','X-Pvp-Session':session},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(d.progress)setProgress(d.progress);if(!r.ok)throw Error(d.code||'REQUEST_FAILED');return d.match;}
 useEffect(()=>{let live=true;api().then(m=>{if(live)setMatch(m);}).catch(()=>{if(live)setError(t.error);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;clearTimeout(timer.current);};},[]);
 async function execute(body){if(lock.current)return;lock.current=true;setBusy(true);setError('');pending.current=body;if(body.action==='choose')setSelected(body.choice);
  try{const next=await api(body);if(body.action==='choose'){
    const last=next.history.find(h=>h.round===body.round);
    if(!last)throw Error('ROUND_RECEIPT_MISSING');
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${next.id}:${last.round}:${last.opponentChoice}:${last.nonce}`));
    if([...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')!==last.commitment)throw Error('COMMITMENT_INVALID');
    setFlash(last);timer.current=setTimeout(()=>{setFlash(null);setSelected('');},1100);
   }else{setFlash(null);setSelected('');}
   setMatch(next);
   if(body.action==='start')setInLobby(false);
   if(body.action==='abandon')setInLobby(true);
   setRetry(null);pending.current=null;
  }catch(e){setError(`${t.error} (${e.message})`);setRetry(body);}finally{lock.current=false;setBusy(false);}
 }
 useEffect(()=>{const art=new Image();art.src='/pvp/pilot-actions-v1.webp';art.decode?.().catch(()=>{});},[]);
 const active=match?.status==='active',me=match?.player||{name:'NUVELORIAN',...preview,hp:preview.maxHp},op=match?.opponent||{name:'ГРИМ',kind:'ai',style:'counter',...preview,hp:preview.maxHp};
 const playerPose={finger:1,pencil:2,poison:3}[selected]||0,opponentPose={finger:1,pencil:2,poison:3}[flash?.opponentChoice]||0;
 const finished=match?.status==='finished',playerDefeated=finished&&match.result==='loss',opponentDefeated=finished&&match.result==='win';
 const showArena=Boolean(match&&!inLobby);
 useEffect(()=>{
  if(showArena||loading||busy)return;
  const poll=setInterval(()=>{api().catch(()=>{});},4000);
  return()=>clearInterval(poll);
 },[showArena,loading,busy]);
 const last=flash||match?.history.at(-1),wins=match?.history.filter(h=>h.winner==='player').length||0,losses=match?.history.filter(h=>h.winner==='opponent').length||0;
 function pilot(p,enemy){return <section className="pvp-pilot" data-hit={!!flash&&(enemy?flash.winner==='player':flash.winner==='opponent')}><div className={'pvp-face '+(enemy?'enemy':'')}/><div><b>{p.name} {enemy&&<small>ШІ</small>}</b><div className="pvp-hp" role="progressbar" aria-label={p.name+' HP'} aria-valuenow={p.hp} aria-valuemin={0} aria-valuemax={p.maxHp}><i style={{width:`${100*p.hp/p.maxHp}%`}}/><span>{nf(p.hp)} / {nf(p.maxHp)} HP</span></div></div></section>;}
 return <main className="pvp-preview">
  <div className="pvp-space-backdrop" aria-hidden="true"><div className="pvp-space-art"/><div className="pvp-space-stars"/></div>
  <div className="pvp-local"><span>{t.local}</span><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)}><option value="uk">UA</option><option value="ru">RU</option><option value="en">EN</option></select></div>
  <header className={`pvp-title${showArena?'':' pvp-lobby-title'}`}>{showArena?<button aria-label="Back" onClick={()=>active?execute({action:'abandon'}):setInLobby(true)}><ArrowLeft size={21}/></button>:<Swords size={19} aria-hidden="true"/>}<h1>{t.title}</h1>{showArena?<span aria-hidden="true"/>:<><PvpAttempts lang={lang} progress={progress}/><button aria-label="Rules" onClick={()=>help.current.showModal()}>?</button></>}</header>
  {!showArena?<PvpLobby lang={lang} mode={mode} onMode={setMode} progress={progress} busy={busy||loading} onStart={merchant=>execute({action:'start',preset,...(merchant?{merchant}:{})})} error={error}/>:<>
  <div className="pvp-pilots">{pilot(me,false)}{pilot(op,true)}</div>
  <div className="pvp-round"><i/>{t.round} {flash?.round||match?.round||1}<i/></div>
  <section className="pvp-stage" data-winner={flash?.winner||''} data-match-result={finished?match.result:''} data-phase={flash?'impact':busy?'windup':'idle'} aria-label="Duel arena">
   <button className="pvp-help" onClick={()=>help.current.showModal()} aria-label="Rules">?</button>
   <div className="pvp-deck" aria-hidden="true"/>
   <div className={`pvp-fighter player${playerDefeated?' defeated':''}${opponentDefeated?' victorious':''}`} data-pose={playerPose}><div className="pvp-fighter-motion"><div className="pvp-sprite player"/>{playerDefeated&&<PvpDefeatSmoke/>}</div></div>
   {!flash&&<div className="pvp-vs" aria-hidden="true">VS</div>}
   <div className={`pvp-fighter opponent${opponentDefeated?' defeated':''}${playerDefeated?' victorious':''}`} data-pose={opponentPose} data-ai-style={op.kind==='ai'?op.style:undefined}><div className="pvp-fighter-motion"><div className="pvp-sprite opponent"/>{opponentDefeated&&<PvpDefeatSmoke/>}</div></div>
   <PvpBattleEffects round={flash} finished={playerDefeated||opponentDefeated} language={lang}/>
   {active&&!last&&<p className="pvp-ai-ready">{t.styles[op.style]} · {t.ready}{match.bounty&&<> · {t.prize} {nf(Math.round(match.bounty.amount/100))} $PL4</>}</p>}
   <span className="sr-only" role="status">{last && pvpRoundOutcome(lang, last.winner)}</span>
   {!active&&!flash&&<div className="pvp-start-overlay pvp-finish-overlay"><h2>{match.result==='win'?t.win:match.result==='loss'?t.loss:t.draw}</h2>{match.ranked&&<strong>{match.ratingDelta>0?'+':''}{match.ratingDelta??0}</strong>}{match.bounty&&<p className="pvp-bounty" style={{margin:"4px 0 10px",color:"#ffd66b",fontWeight:800}}>{match.bounty.award?<>{t.prize}: +{nf(Math.round(match.bounty.award.amount/100))} $PL4 · {t.pending}</>:t.noPrize}</p>}<button className="pvp-green" disabled={busy||loading} onClick={()=>setInLobby(true)}>{lang==='uk'?'До лобі':lang==='ru'?'В лобби':'Back to lobby'}</button></div>}
   <section className="pvp-controls"><div className="pvp-score"><span className="pvp-score-win">{wins}</span><span>:</span><span>{losses}</span>{match?.history.slice(-6).map(h=><i key={h.round} className={h.winner}/>)}</div>
   <h2>{busy?t.wait:t.choose}</h2><p className="pvp-shared"><Swords size={14}/><b title={t.damage} aria-label={t.damage + ": " + nf(me.attack)}>{nf(me.attack)}</b></p>
   <div className="pvp-actions">{DUEL_ACTIONS.map(a=><button key={a} className={'pvp-action '+(selected===a?'selected':'')} disabled={!active||busy||!!flash||!!retry} onClick={()=>execute({action:'choose',matchId:match.id,round:match.round,choice:a})}><BossWeaponIcon weapon={{id: weaponIds[a], name: t[a]}} showDamage={false}/><b>{t[a]}</b></button>)}</div>
   {error&&<div className="pvp-error" role="alert">{error}{retry&&<button onClick={()=>execute(retry)}>↻</button>}</div>}
  </section>
  </section>
  </>}
  <details ref={build} className="pvp-build"><summary><Settings2 size={13}/>{t.settings}</summary><div className="pvp-build-fields"><label>{t.set}<select disabled={active} value={preset.set} onChange={e=>setPreset({...preset,set:e.target.value})}>{Object.entries(DUEL_SET_NAMES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>{t.enh}<select disabled={active} value={preset.enhancement} onChange={e=>setPreset({...preset,enhancement:Number(e.target.value)})}>{[0,5,10,15].map(n=><option key={n} value={n}>+{n}</option>)}</select></label><label>{t.talents}<select disabled={active} value={preset.talents} onChange={e=>setPreset({...preset,talents:Number(e.target.value)})}>{[0,50,100].map(n=><option key={n}>{n}</option>)}</select></label></div><p>{t.saved}</p>{active&&<button className="pvp-leave" disabled={busy} onClick={()=>execute({action:'abandon'})}>{t.abandon}</button>}<small>HP {nf(preview.maxHp)} · ⚔ {nf(preview.attack)}</small></details>
  <footer className={`pvp-footer${showArena?'':' pvp-lobby-footer'}`}><button onClick={()=>{build.current.open=true;build.current.scrollIntoView({behavior:'smooth'});}}><img src={talentsIcon} alt=""/>{t.settings}</button><button onClick={()=>showArena?document.querySelector('.pvp-stage')?.scrollIntoView({behavior:'smooth',block:'center'}):window.scrollTo({top:0,behavior:'smooth'})}><img src={heroIcon} alt=""/>PvP</button>{showArena?<button onClick={()=>help.current.showModal()}><img src={bossesIcon} alt=""/>?</button>:<button onClick={()=>{setMode('ranked');requestAnimationFrame(()=>document.getElementById('pvp-leaderboard')?.scrollIntoView({behavior:'smooth'}));}}><Trophy size={24}/>{lang==='en'?'TOP':'ТОП'}</button>}</footer>
  <dialog ref={help} className="pvp-dialog"><h2>{t.title}</h2><p>{t.help}</p><p className="pvp-local">{t.local}</p>{match&&<small className="pvp-proof">SHA-256: {match.commitment}</small>}<button className="pvp-green" onClick={()=>help.current.close()}>{t.close}</button></dialog>
 </main>;
}
