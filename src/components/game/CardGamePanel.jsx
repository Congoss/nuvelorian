import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import GameTextureButton from '@/components/game/GameTextureButton';
import CasinoRulesDialog from '@/components/game/CasinoRulesDialog';
import { getResourceIcon } from '@/lib/resourceIcons';
import scene from '@/assets/card-game/dealer-scene.webp';
import back from '@/assets/card-game/card-back.webp';
import extraPlayIcon from '@/assets/card-game/extra-play.webp';
import '@/pages/CardGamePreview.css';
import {CARD_PRIZES, getCardPlayPack} from '@/lib/cardGameConfig';
import {gameApi} from '@/services/gameApi';
import PaymentMethodPicker from './PaymentMethodPicker';
import {isWebPlatform} from '@/lib/platform/config';
const RULES={
 uk:{title:'Правила',close:'Зрозуміло',items:['Щодня доступна одна безкоштовна спроба.','Одна спроба: вибери одну з чотирьох закритих карт, відкрий її та забери нагороду. Після цього побачиш решту карт.','За 20 Stars — нова роздача з вибором однієї закритої карти.','За 60 Stars — відкриваються всі чотири карти. Вибери та забери три нагороди.','Кожна нова роздача випадкова. Нагороди можуть повторюватися.','Додаткові карткові спроби та спіни рулетки — різні нагороди. Додаткова спроба дозволяє вибрати одну закриту карту.']},
 ru:{title:'Правила',close:'Понятно',items:['Каждый день доступна одна бесплатная попытка.','Одна попытка: выбери одну из четырёх закрытых карт, открой её и забери награду. После этого увидишь остальные карты.','За 20 Stars — новая раздача с выбором одной закрытой карты.','За 60 Stars — открываются все четыре карты. Выбери и забери три награды.','Каждая новая раздача случайная. Награды могут повторяться.','Дополнительные карточные попытки и вращения рулетки — разные награды. Дополнительная попытка позволяет выбрать одну закрытую карту.']},
 en:{title:'Rules',close:'Got it',items:['One free attempt is available each day.','Single play: choose one of four face-down cards, reveal it and claim your reward. The remaining cards are then revealed.','20 Stars starts a new deal: pick one face-down card.','60 Stars reveals all four cards: choose and claim three rewards.','Every new deal is random. Rewards may repeat.','Extra card plays and roulette spins are separate rewards. An extra card play lets you choose one face-down card.']}
};
const COPY={
 uk:{title:'Контрабанда',tag:'Космічна лавка',intro:'Обирай. Я сьогодні майже чесний.',pick:'Одна карта — твоя. Не підглядай.',claim:'Забрати',done:'Ось що ховалось під іншими…',three:'Вибери три нагороди. Одну залиш мені.',free:'Безкоштовна спроба',one:'1 карта · 20 ★',all:'3 з 4 · 60 ★',demo:'Макет · без оплат і нарахувань',again:'Нова примірка',small:'Мала отрута',medium:'Середня отрута',large:'Фляга з отрутою',energy:'Енергія',spin:'Спіни',paper:'Бумага',tentacles:'Щупальці',taken:'Твоє',leave:'Залишилось у жуліка'},
 ru:{title:'Контрабанда',tag:'Космическая лавка',intro:'Выбирай. Я сегодня почти честный.',pick:'Одна карта — твоя. Не подглядывай.',claim:'Забрать',done:'Вот что скрывалось под остальными…',three:'Выбери три награды. Одну оставь мне.',free:'Бесплатная попытка',one:'1 карта · 20 ★',all:'3 из 4 · 60 ★',demo:'Макет · без оплат и начислений',again:'Новая примерка',small:'Малый яд',medium:'Средний яд',large:'Фляга с ядом',energy:'Энергия',spin:'Вращения',paper:'Бумага',tentacles:'Щупальца',taken:'Твоё',leave:'Осталось у жулика'},
 en:{title:'Contraband',tag:'Cosmic oddities',intro:'Pick one. I’m almost honest today.',pick:'One card is yours. No peeking.',claim:'Claim',done:'Here’s what the others were hiding…',three:'Choose three rewards. Leave one for me.',free:'Free attempt',one:'1 card · 20 ★',all:'3 of 4 · 60 ★',demo:'Preview · no payments or rewards',again:'Try again',small:'Small poison',medium:'Medium poison',large:'Poison flask',energy:'Energy',spin:'Spins',paper:'T-Pape',tentacles:'Tentacles',taken:'Yours',leave:'The dealer keeps this'}
};
const PRIZES=CARD_PRIZES;
function deal(){return Array.from({length:4},()=>{let roll=Math.random()*100;return PRIZES.find(p=>(roll-=p[3])<0)||PRIZES[0];});}
const GUM={uk:['Звичайна жуйка','Покращена жуйка'],ru:['Обычная жвачка','Улучшенная жвачка'],en:['Normal gum','Improved gum']};
export default function CardGamePanel({embedded=false,language='uk',onClose,headerContent,live=false,onRewards,onAvailability,onBusy}){
 const [lang,setLang]=useState(()=>embedded?(language==='ua'?'uk':language):new URLSearchParams(location.search).get('lang')||'uk');
 const [showRules,setShowRules]=useState(false);
 const [busy,setBusy]=useState(live),[error,setError]=useState(''),[purchase,setPurchase]=useState(null),[credits,setCredits]=useState({paid1:0,paid3:0});
 const working=useRef(false),roundId=useRef(null),request=useRef(null),mounted=useRef(true);
 const callbacks=useRef({onRewards,onAvailability,onBusy});callbacks.current={onRewards,onAvailability,onBusy};
 const initialCards=()=>live?Array.from({length:4},()=>['small','small-poison',0]):deal();
 const [revealRest,setRevealRest]=useState(false);
 const [claimedBack,setClaimedBack]=useState(false);
 const [round,setRound]=useState(0);
 const [cards,setCards]=useState(initialCards),[selected,setSelected]=useState([]),[phase,setPhase]=useState(live?'loading':'pick'),[mode,setMode]=useState(1),[opened,setOpened]=useState(true),[freeGames,setFreeGames]=useState(0);
 const t=COPY[lang]||COPY.uk;
 const revealedLine={uk:'Тепер бачиш усе. Але твоє — лише вибране.',ru:'Теперь видишь всё. Но твоё — только выбранное.',en:'Now you see everything. But you only keep your pick.'}[lang];
 const freeButtonLabel={uk:'Безкоштовно',ru:'Бесплатно',en:'Free'}[lang];
 const freeLabel={uk:'Карткові спроби',ru:'Карточные попытки',en:'Card plays'}[lang];
 const fallbackError={uk:'Не вдалося виконати дію. Спробуй ще раз.',ru:'Не удалось выполнить действие. Попробуй ещё раз.',en:'Could not complete the action. Please retry.'}[lang];
 const hydrate=result=>{
  if(!mounted.current)return;
  setFreeGames(result.free);setCredits({paid1:result.paid1,paid3:result.paid3});callbacks.current.onAvailability?.(result.free);
  
  const r=result.round;roundId.current=r?.id||null;
  if(!r){setPhase('idle');return;}
  setCards(r.cards||Array.from({length:4},()=>['small','small-poison',0]));setMode(r.mode);setSelected(r.selected||[]);
  setRound(r.id);setClaimedBack(r.status==='claimed');setRevealRest(false);
  setPhase(r.status==='claimed'?'done':r.status==='chosen'?'claim':r.mode===3?'reveal':'pick');
 };
 const send=async(command,body={})=>{
  if(working.current)return null;working.current=true;setBusy(true);setError('');callbacks.current.onBusy?.(true);
  const key=JSON.stringify([command,body]);if(!request.current||request.current.key!==key)request.current={key,id:crypto.randomUUID()};
  try{const result=await gameApi.cardGame(command,{...body,requestId:request.current.id});request.current=null;return result;}
  catch(e){if(e.status>=400&&e.status<500)request.current=null;if(mounted.current)setError(fallbackError);return null;}
  finally{working.current=false;if(mounted.current)setBusy(false);callbacks.current.onBusy?.(false);}
 };
 useEffect(()=>{
  if(!live)return;
  mounted.current=true;let cancelled=false;
  gameApi.cardGame('state').then(result=>{
   if(cancelled)return;
   hydrate(result);
   if(result.showDaily)void gameApi.cardGame('shown').catch(()=>{});
  }).catch(()=>{if(!cancelled)setError(fallbackError);}).finally(()=>{if(!cancelled)setBusy(false);});
  return()=>{cancelled=true;mounted.current=false;callbacks.current.onBusy?.(false);};
 },[live]);
 useEffect(()=>{if(embedded)setLang(language==='ua'?'uk':['uk','ru','en'].includes(language)?language:'en');},[embedded,language]);
 const claim=async()=>{
  if(phase==='done'||busy)return;
  if(live){const result=await send('claim',{roundId:roundId.current,selected});if(result){hydrate(result);callbacks.current.onRewards?.(result.player);}return;}
  setFreeGames(n=>n+selected.reduce((sum,i)=>sum+(cards[i][0]==='freegame'?cards[i][2]:0),0));setClaimedBack(true);setPhase('done');
 };
 const start=async(count,free=false)=>{
  if(busy)return;
  if(live){
   if(count===1&&freeGames<1&&credits.paid1<1||count===3&&credits.paid3<1){setPurchase(getCardPlayPack(count));return;}
   const result=await send('begin',{mode:count});if(result)hydrate(result);return;
  }
  setClaimedBack(false);setRevealRest(false);setCards(deal());setMode(count);setSelected([]);setRound(n=>typeof n==='number'?n+1:1);setPhase(count===3?'reveal':'pick');setOpened(true);if(free)setFreeGames(n=>Math.max(0,n-1));
 };
 useEffect(()=>{if(phase!=='reveal')return;const timer=setTimeout(()=>setPhase('choose'),180);return()=>clearTimeout(timer);},[phase,round]);
 useEffect(()=>{if(phase!=='claim'||mode!==1)return;const timer=setTimeout(()=>setRevealRest(true),300);return()=>clearTimeout(timer);},[phase,mode,round]);
 const choose=async index=>{
  if(busy)return;
  if(phase==='pick'){
   if(live){const result=await send('choose',{roundId:roundId.current,index});if(result)hydrate(result);return;}
   setSelected([index]);setPhase('claim');
  }else if(phase==='choose')setSelected(current=>current.includes(index)?current.filter(i=>i!==index):current.length<3?[...current,index]:current);
 };
 const afterPayment=async()=>{
  const count=purchase.cardMode;setPurchase(null);
  const result=await send('state');if(!result)return;
  hydrate(result);
  const started=await send('begin',{mode:count});if(started)hydrate(started);
 };
 const singleLabel=isWebPlatform?(lang==='en'?'1 card · $0.20 · NEAR':lang==='ru'?'1 карта · $0,20 · NEAR':'1 карта · $0,20 · NEAR'):t.one;
 const tripleLabel=isWebPlatform?(lang==='en'?'3 of 4 · $0.60 · NEAR':lang==='ru'?'3 из 4 · $0,60 · NEAR':'3 з 4 · $0,60 · NEAR'):t.all;
 const note=live?({uk:'Щодня — 1 безкоштовна спроба',ru:'Ежедневно — 1 бесплатная попытка',en:'One free attempt every day'})[lang]:t.demo;
 const readyPaid={uk:'Оплачено',ru:'Оплачено',en:'Paid'}[lang];
 const rules=RULES[lang].items.map(item=>isWebPlatform?item.replace('20 Stars','$0.20 · NEAR').replace('60 Stars','$0.60 · NEAR'):item);

 return <main className={`contraband-preview ${embedded?'contraband-embedded':''}`}>{!embedded&&<div className="contraband-tools">{['uk','ru','en'].map(l=><button key={l} onClick={()=>setLang(l)} aria-pressed={lang===l}>{l.toUpperCase()}</button>)}<span>{t.demo}</span><button onClick={()=>{setFreeGames(0);start(1);}} title={t.again}><RotateCcw size={15}/></button></div>}
 {!opened?<GameTextureButton className="h-12 px-6" onClick={()=>setOpened(true)}><span className="contraband-button-label">{t.title}</span></GameTextureButton>:<section className="contraband-scene" role="dialog" aria-modal="true" aria-label={t.title} style={{backgroundImage:`url(${scene})`}}>
 <header>{headerContent||<div><small>{t.tag}</small><h1>{t.title}</h1></div>}<div className="contraband-header-actions"><button className="contraband-rules-button" aria-label={RULES[lang].title} aria-expanded={showRules} onClick={()=>setShowRules(true)}>?</button><button className="contraband-close" aria-label={lang==='en'?'Close':lang==='ru'?'Закрыть':'Закрити'} onClick={()=>onClose?onClose():setOpened(false)}><X/></button></div></header>
 <div className="contraband-talk"><span>{phase==='done'?t.intro:mode===3?t.three:revealRest?revealedLine:t.intro}</span></div>
 <div className="contraband-table"><p className="contraband-hint" aria-live="polite">{phase==='done'?t.pick:mode===3?`${t.three} ${selected.length}/3`:t.pick}</p><div className="contraband-cards">
 {cards.map(([kind,icon,amount],index)=>{const face=!claimedBack&&(revealRest||(mode===3&&phase==='choose')||selected.includes(index));const chosen=!claimedBack&&selected.includes(index);const gum=kind==='gum'||kind==='better';const label=gum?GUM[lang][kind==='better'?1:0]:kind==='freegame'?freeLabel:t[kind];return <button key={`${round}-${index}`} className={`contraband-card ${chosen?'is-selected':''} ${!claimedBack&&revealRest&&!chosen?'is-missed':''}`} aria-label={face?`${label} ×${amount}`:`${index+1}`} aria-pressed={chosen} disabled={busy||!['pick','choose'].includes(phase)} onClick={()=>choose(index)} style={{'--tilt':`${[-7,-2,2,7][index]}deg`,'--delay':`${index*90}ms`}}><div className={`contraband-flip ${face?'is-open':''}`} style={{transitionDelay:!claimedBack&&((mode===3&&phase==='choose')||(revealRest&&!chosen))?`${index*90}ms`:'0ms'}}><img className="contraband-back" src={back} alt=""/><div className="contraband-face">{gum?<span className={`contraband-gum ${kind==='better'?'is-better':''}`} style={{backgroundImage:"url('/local-enhancement/gums.webp')"}}/>:<img src={kind==='freegame'?extraPlayIcon:getResourceIcon(icon)} alt=""/>}<strong>×{amount>=1000?`${amount/1000}k`:amount}</strong><span>{label}</span></div></div>{chosen&&<b className="contraband-selected">✓ {t.taken}</b>}</button>;})}
 </div></div>
 <footer>{error&&<div className="mb-2 text-xs text-[#ffe2ad]" role="alert">{error}<button className="ml-2 underline" onClick={async()=>{const result=await send('state');if(result)hydrate(result);}}>↻</button></div>}{(phase==='claim'||phase==='choose')?<GameTextureButton tone="green" className="h-12 w-full" disabled={busy||selected.length!==mode} onClick={claim}><span className="contraband-button-label">{t.claim}{mode===3?` · ${selected.length}/3`:''}</span></GameTextureButton>:(phase==='done'||phase==='idle'||phase==='loading')?<div className="contraband-actions"><GameTextureButton disabled={busy} tone={freeGames>0?'green':'yellow'} onClick={()=>start(1,freeGames>0)}><span className="contraband-button-label">{freeGames>0?`${freeButtonLabel} · ${freeGames}`:credits.paid1>0?`${readyPaid} · ${credits.paid1}`:singleLabel}</span></GameTextureButton><GameTextureButton disabled={busy} tone="blue" onClick={()=>start(3)}><span className="contraband-button-label">{credits.paid3>0?`${readyPaid} · 3/4 · ${credits.paid3}`:tripleLabel}</span></GameTextureButton></div>:<p className="contraband-free">{t.free}</p>}
 <small>{note}</small></footer>
 {showRules&&<CasinoRulesDialog title={RULES[lang].title} items={rules} confirmLabel={RULES[lang].close} note={live?undefined:t.demo} onClose={()=>setShowRules(false)}/>}
 {purchase&&<PaymentMethodPicker pack={purchase} paymentMethods={isWebPlatform?[{id:'near',title:'NEAR'}]:[{id:'telegram_stars',title:'Stars'}]} initialMethodId={isWebPlatform?'near':'telegram_stars'} onClose={()=>setPurchase(null)} onSuccess={afterPayment}/>}
 </section>}</main>;
}
