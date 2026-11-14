import PvpResultCard from './PvpResultCard';
import PvpRefillButton from './PvpRefillButton';
import PvpRulesContent from './PvpRulesContent';
import BossWeaponIcon from '@/components/game/BossWeaponIcon';
import PvpBattleEffects,{PvpDefeatSmoke,pvpRoundOutcome} from '@/components/game/PvpBattleEffects';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Swords,X,HeartPulse} from 'lucide-react';
import {gameApi} from '@/services/gameApi';
import {DUEL_ACTIONS,duelStats} from '@/lib/pvpDuel.js';
import PvpLobby,{PvpAttempts} from '@/pages/PvpLobby.jsx';
import '@/pages/pvpPreview.css';
import './pvpPanel.css';
// One ranked queue: human matchmaking first, committed AI after ten seconds.
const weaponIds = {finger: 'fist', pencil: 'knuckle', poison: 'satchel'};
const words={uk:{title:'ОРБІТАЛЬНА ДУЕЛЬ',finger:'ПАЛЕЦЬ',pencil:'ОЛІВЕЦЬ',poison:'МАЛИЙ ЯД',choose:'ОБЕРИ ПРИЙОМ',damage:'Шкода від зброї',round:'Раунд',win:'ПЕРЕМОГА!',loss:'ПОРАЗКА!',draw:'НІЧИЯ',settings:'ПРИМІРКА БІЛДУ',set:'Комплект',enh:'Заточка',talents:'Очки атакувальних талантів',prize:'Приз торговця',pending:'очікує виплати (симуляція)',noPrize:'Без призу',help:'Палець перемагає олівець. Олівець перемагає яд. Яд перемагає палець. Однаковий вибір — нічия. Усі три прийоми мають однакову шкоду від твоєї зброї. HP залежить від вибраного білда. Хід ШІ фіксується до твого вибору; він вчиться лише на минулих ходах.',close:'Зрозуміло',ready:'ШІ вже обрав свій хід',wait:'Розкриваємо ходи…',abandon:'Вийти з дуелі',error:'Не вдалося виконати дію. Повтори запит.',styles:{balanced:'Зважений пілот',counter:'Читає повтори',tricky:'Непередбачуваний пілот'},closeLabel:'Закрити'},ru:{title:'ОРБИТАЛЬНАЯ ДУЭЛЬ',finger:'ПАЛЕЦ',pencil:'КАРАНДАШ',poison:'МАЛЫЙ ЯД',choose:'ВЫБЕРИ ПРИЁМ',damage:'Урон от оружия',round:'Раунд',win:'ПОБЕДА!',loss:'ПОРАЖЕНИЕ!',draw:'НИЧЬЯ',settings:'ПРИМЕРКА БИЛДА',set:'Комплект',enh:'Заточка',talents:'Очки атакующих талантов',prize:'Приз торговца',pending:'ожидает выплаты (симуляция)',noPrize:'Без приза',help:'Палец побеждает карандаш. Карандаш побеждает яд. Яд побеждает палец. Одинаковый выбор — ничья. Все приёмы наносят одинаковый урон от твоего оружия. HP зависит от выбранного билда. ИИ выбирает ход заранее и учится только на прошлых ходах.',close:'Понятно',ready:'ИИ уже выбрал свой ход',wait:'Раскрываем ходы…',abandon:'Выйти из дуэли',error:'Не удалось выполнить действие. Повтори запрос.',styles:{balanced:'Взвешенный пилот',counter:'Читает повторы',tricky:'Непредсказуемый пилот'},closeLabel:'Закрыть'},en:{title:'ORBITAL DUEL',finger:'FINGER',pencil:'PENCIL',poison:'SMALL POISON',choose:'CHOOSE YOUR MOVE',damage:'Weapon damage',round:'Round',win:'VICTORY!',loss:'DEFEAT!',draw:'DRAW',settings:'TRY A BUILD',set:'Set',enh:'Enhancement',talents:'Offensive talent points',prize:'Merchant prize',pending:'pending payout (simulated)',noPrize:'No prize',help:'Finger beats pencil. Pencil beats poison. Poison beats finger. Equal choices draw. Every move deals the same damage from your weapon. Defensive gear determines HP. AI commits first and only learns from past moves.',close:'Got it',ready:'AI has already committed its move',wait:'Revealing moves…',abandon:'Leave duel',error:'Could not complete the action. Retry.',styles:{balanced:'Balanced pilot',counter:'Reads repeated moves',tricky:'Unpredictable pilot'},closeLabel:'Close'}};
const nf=n=>Number(n).toLocaleString('uk-UA');

export default function PvpPanel({profile,onClose,onSyncProfile}){
 const lang=profile?.language==='ua'?'uk':(profile?.language||'uk');
 const t=words[lang]||words.uk;
 const [inLobby,setInLobby]=useState(true),[progress,setProgress]=useState(null);
 const online=true;
 const [queue,setQueue]=useState(null),[clock,setClock]=useState(Date.now);
 const serverOffset=useRef(0);
 const [match,setMatch]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState(''),[flash,setFlash]=useState(null),[retry,setRetry]=useState(null);
 const lock=useRef(false),timer=useRef(),help=useRef(),pending=useRef(null);
 const preview=duelStats(profile||{});
 const revision=useRef(0);
 async function claimRank(rank){
  if(lock.current)throw new Error(t.wait);
  lock.current=true;revision.current++;setBusy(true);
  try{
   const data=await gameApi.pvpOnline({action:'claim-rank',rank});
   if(data.player)onSyncProfile?.(data.player);
   serverOffset.current=data.progress.serverTime-Date.now();setProgress(data.progress);setQueue(data.queue||null);setMatch(data.match);
   if(data.match?.status==='active')setInLobby(false);
   return data.rankReward;
  }finally{lock.current=false;setBusy(false);}
 }
 async function api(body){try{const d=await gameApi.pvpOnline(body);if(d.progress){serverOffset.current=d.progress.serverTime-Date.now();setProgress(d.progress);}setQueue(d.queue||null);return d.match;}catch(e){if(e.details?.details?.progress)setProgress(e.details.details.progress);throw e;}}
 async function execute(body){if(lock.current)return;lock.current=true;setBusy(true);setError('');pending.current=body;if(body.action==='choose')setSelected(body.choice);
  revision.current++;
  try{const next=await api(body);if(body.action==='choose'&&next?.opponent?.kind==='ai'){
    const last=next.history.find(h=>h.round===body.round);
    if(!last)throw Error('ROUND_RECEIPT_MISSING');
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${next.id}:${last.round}:${last.opponentChoice}:${last.nonce}`));
    if([...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')!==last.commitment)throw Error('COMMITMENT_INVALID');
    setFlash(last);timer.current=setTimeout(()=>{setFlash(null);setSelected('');},1100);
   }else{setFlash(null);setSelected('');}
   setMatch(next);
   if(body.action==='start'||next?.status==='active')setInLobby(false);
   if(body.action==='abandon')setInLobby(true);
   if(online&&body.action==='choose')setSelected(next?.selectedChoice||'');
   setRetry(null);pending.current=null;
  }catch(e){setError(`${t.error} (${e.code||e.message})`);setRetry(body);}finally{lock.current=false;setBusy(false);}
 }
 useEffect(()=>{
  let live=true,polling=false;
  setLoading(true);setFlash(null);shownRound.current='';setMatch(null);setProgress(null);setQueue(null);setError('');setRetry(null);setSelected('');setInLobby(true);
  async function read(){
   if(!live||polling||lock.current||document.visibilityState==='hidden')return;
   polling=true;const version=revision.current;
   try{
    const d=await gameApi.pvpOnline();
    if(!live||version!==revision.current)return;
    serverOffset.current=d.progress.serverTime-Date.now();setProgress(d.progress);setQueue(d.queue||null);
    setMatch(current=>{
     const next=d.match;
     if(current&&next&&current.id===next.id&&(current.round>next.round||(current.status==='finished'&&next.status!=='finished')))return current;
     return next;
    });
    if(d.match?.status==='active')setInLobby(false);
    setSelected(d.match?.selectedChoice||'');setError('');setRetry(null);
   }catch{if(live&&version===revision.current)setError(t.error);}
   finally{polling=false;if(live)setLoading(false);}
  }
  void read();const poll=setInterval(read,online?1200:4000);
  const resume=()=>{if(document.visibilityState==='visible')void read();};document.addEventListener('visibilitychange',resume);
  return()=>{live=false;clearInterval(poll);document.removeEventListener('visibilitychange',resume);clearTimeout(timer.current);};
 },[profile?.id]);
 const shownRound=useRef('');
 useEffect(()=>{
  if(!online)return;
  const last=match?.history?.at(-1),key=last?`${match.id}:${last.round}`:'';
  if(!last||shownRound.current===key)return;
  shownRound.current=key;setFlash(last);setSelected('');clearTimeout(timer.current);timer.current=setTimeout(()=>setFlash(null),1100);
 },[online,match]);
 useEffect(()=>{if(!online)return;const timer=setInterval(()=>setClock(Date.now()),250);return()=>clearInterval(timer);},[online]);
 useEffect(()=>{const art=new Image();art.src='/pvp/pilot-actions-v1.webp';art.decode?.().catch(()=>{});},[]);
 const active=match?.status==='active',me=match?.player||{name:profile?.nickname||profile?.username||'NUVELORIAN',...preview,hp:preview.maxHp};
 const op=match?.opponent||{name:'',kind:'ai',style:'balanced',...preview,hp:preview.maxHp};
 const playerPose={finger:1,pencil:2,poison:3}[selected]||0,opponentPose={finger:1,pencil:2,poison:3}[flash?.opponentChoice]||0;
 const finished=match?.status==='finished',playerDefeated=finished&&match.result==='loss',opponentDefeated=finished&&match.result==='win';
 const showArena=Boolean(match&&!inLobby&&(active||finished));
 const last=flash||match?.history?.at(-1),wins=match?.history?.filter(h=>h.winner==='player').length||0,losses=match?.history?.filter(h=>h.winner==='opponent').length||0;
 function pilot(p,enemy){
  const ratio=p.hp/p.maxHp;
  return <section className="pvp-pilot" data-enemy={enemy} data-hit={!!flash&&(enemy?flash.winner==='player':flash.winner==='opponent')}><div><b>{p.name} {enemy&&op.kind==='ai'&&<small>{match?.aiProvider==='near-ai'?'NEAR AI':lang==='en'?'AI':lang==='ru'?'ИИ':'ШІ'}</small>}</b><div className="pvp-hp" role="progressbar" aria-label={p.name+' HP'} aria-valuenow={p.hp} aria-valuemin={0} aria-valuemax={p.maxHp} data-low={ratio<=.25} data-critical={ratio<=.1}><i className="pvp-hp-trail" style={{width:`${100*ratio}%`}}/><i className="pvp-hp-fill" style={{width:`${100*ratio}%`}}/><svg className="pvp-heartbeat" viewBox="0 0 180 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12H20l4-3 4 6 5-11 5 17 5-10 5 1H73l4-3 4 6 5-11 5 17 5-10 5 1H125l4-3 4 6 5-11 5 17 5-10 5 1H180"/></svg><em className="pvp-vital-sign" aria-hidden="true"><HeartPulse/></em><span>{nf(p.hp)} / {nf(p.maxHp)} HP</span></div></div></section>;
 }
 return <div className="pvp-preview pvp-panel">
  <header className={`pvp-title${showArena?'':' pvp-lobby-title'}`}>
   {showArena
     ? <button aria-label="Back" onClick={()=>active?execute({action:'abandon',matchId:match.id}):setInLobby(true)}><ArrowLeft size={21}/></button>
     : <button aria-label={t.closeLabel} onClick={()=>{if(queue)void execute({action:'cancel'});onClose();}}><ArrowLeft size={21}/></button>}
   <h1>{t.title}</h1>
   {showArena?<span aria-hidden="true"/>:<><PvpRefillButton language={lang} progress={progress} profile={profile} disabled={busy||loading||!!queue} onSuccess={result=>{if(result?.player)onSyncProfile?.(result.player);void api().then(setMatch);}}/><PvpAttempts lang={lang} progress={progress}/><button aria-label="Rules" onClick={()=>help.current.showModal()}>?</button><button aria-label={t.closeLabel} onClick={()=>{if(queue)void execute({action:'cancel'});onClose();}} className="pvp-close"><X size={18}/></button></>}
  </header>
  {!showArena?<PvpLobby lang={lang} mode="ranked" progress={progress} busy={busy||loading} online queue={queue} onCancel={()=>execute({action:'cancel'})} onStart={()=>execute({action:'queue'})} error={error} onClaimRank={claimRank} rewardReceipts={profile?.pvp_rank_rewards} selfPlayer={profile}/>:<>
  <div className="pvp-pilots">{pilot(me,false)}<div className="pvp-round"><span>{t.round}</span><strong>{flash?.round||match?.round||1}</strong>{online&&active&&<small>{Math.max(0,Math.ceil((match.deadline-(clock+serverOffset.current))/1000))}s</small>}</div>{pilot(op,true)}</div>
  <section className="pvp-stage" data-winner={flash?.winner||''} data-match-result={finished?match.result:''} data-phase={flash?'impact':busy?'windup':'idle'} aria-label="Duel arena">
   <button className="pvp-help" onClick={()=>help.current.showModal()} aria-label="Rules">?</button>
   <div className="pvp-deck" aria-hidden="true"/>
   <div className={`pvp-fighter player${playerDefeated?' defeated':''}${opponentDefeated?' victorious':''}`} data-pose={playerPose}><div className="pvp-fighter-motion"><div className="pvp-sprite player"/>{playerDefeated&&<PvpDefeatSmoke/>}</div></div>
   {!flash&&<div className="pvp-vs" aria-hidden="true">VS</div>}
   <div className={`pvp-fighter opponent${opponentDefeated?' defeated':''}${playerDefeated?' victorious':''}`} data-pose={opponentPose} data-ai-style={op.kind==='ai'?op.style:undefined}><div className="pvp-fighter-motion"><div className="pvp-sprite opponent"/>{opponentDefeated&&<PvpDefeatSmoke/>}</div></div>
   <PvpBattleEffects round={flash} finished={playerDefeated||opponentDefeated} language={lang}/>
   {active&&!online&&!last&&<p className="pvp-ai-ready">{t.styles[op.style]} · {t.ready}{match.bounty&&<> · {t.prize} {nf(Math.round(match.bounty.amount/100))} $PL4</>}</p>}
   <span className="sr-only" role="status">{last && pvpRoundOutcome(lang, last.winner)}</span>
   {!active&&!flash&&<PvpResultCard match={match} rating={progress?.rating ?? match.rating ?? 0} language={lang} busy={busy||loading} onClose={()=>setInLobby(true)}/>}
   <section className="pvp-controls"><div className="pvp-score"><span className="pvp-score-win">{wins}</span><span>:</span><span>{losses}</span>{match?.history?.slice(-6).map(h=><i key={h.round} className={h.winner}/>)}</div>
   {online&&active&&<p role="status">{match.submitted?(lang==='uk'?'Хід збережено. Чекаємо суперника…':lang==='ru'?'Ход сохранён. Ждём соперника…':'Move saved. Waiting for opponent…'):(op.kind==='ai'?t.ready:(lang==='uk'?'Оберіть хід за 30 секунд':lang==='ru'?'Выберите ход за 30 секунд':'Choose within 30 seconds'))}</p>}
   <h2>{busy?t.wait:t.choose}</h2><p className="pvp-shared"><Swords size={14}/><b title={t.damage} aria-label={t.damage + ": " + nf(me.attack)}>{nf(me.attack)}</b></p>
   <div className="pvp-actions">{DUEL_ACTIONS.map(a=><button key={a} className={'pvp-action '+(selected===a?'selected':'')} disabled={!active||busy||(!online&&!!flash)||!!retry||(online&&match.submitted)} onClick={()=>execute({action:'choose',matchId:match.id,round:match.round,choice:a})}><BossWeaponIcon weapon={{id: weaponIds[a], name: t[a]}} showDamage={false}/><b>{t[a]}</b></button>)}</div>
   {error&&<div className="pvp-error" role="alert">{error}{retry&&<button onClick={()=>execute(retry)}>↻</button>}</div>}
  </section>
  </section>
  </>}
  <dialog ref={help} className="pvp-dialog pvp-rules-dialog"><PvpRulesContent language={lang} online={online} onClose={()=>help.current.close()}/></dialog>
 </div>;
}
