import { effectDialogClass, effectCloseClass } from './combatEffectStyles';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import {armorCopy,armorBreachSecondsLeft} from '@/lib/bossArmor';
import {serverNow} from '@/lib/serverClock';

function ArmorLegend({language,text}){
 const descriptions = language === 'en'
  ? ['Finger, Pencil, Two Fingers and Enema each have a 15% chance to be blocked. Throwing poison has a 20% chance to be blocked. ×1, ×5, ×10 and ×100 are how many doses you throw at once. If blocked, none of those doses deal direct damage.', 'Your attacks ignore armor while the timer runs (10–20 s). Use large poison batches before the timer ends.']
  : language === 'ru'
   ? ['Палец, Карандаш, Два пальца и Клизма: шанс блока 15% за удар. Бросок яда: шанс блока 20%. ×1, ×5, ×10 и ×100 показывают, сколько доз ты бросаешь за раз. Если сработает блок, ни одна из этих доз не нанесёт прямого урона.', 'Пока идёт таймер (10–20 с), твои атаки проходят без блока. Используй большие пачки яда до конца таймера.']
   : ['Шкрябан має 15% шансу заблокувати кожен удар Пальцем, Олівцем, Двома пальцями або Клізмою. Коли ти кидаєш отруту, Шкрябан має 20% шансу заблокувати весь кидок. Цей шанс однаковий для 1, 5, 10 і 100 доз за раз. Якщо Шкрябан заблокує кидок, жодна з цих доз не завдасть прямої шкоди.', 'Поки йде таймер (10–20 с), твої атаки проходять без блоку. Використовуй великі пачки отрути до кінця таймера.'];
 return <div className="space-y-2">
  {['armor-active-v6','armor-broken-v7'].map((icon,index)=><div key={icon} className="flex items-start gap-2 rounded-lg bg-black/25 p-2">
   <img src={'/skills/advanced/'+icon+'.webp'} alt="" className="h-9 w-9 shrink-0 rounded"/>
   <div><h3 className="text-xs font-black">{index?text.broken:text.active}</h3><p className="mt-1 text-xs leading-snug text-[#eaf5d8]">{descriptions[index]}</p></div>
  </div>)}
 </div>;
}

export function ArmorHelpDialog({language='uk',breachUntil=0,now=serverNow(),intro=false,onClose}){
 const text=armorCopy(language),closeRef=useRef(null),dialogRef=useRef(null),closeAction=useRef(onClose);
 closeAction.current=onClose;
 const left=Math.max(0,Math.ceil((breachUntil-now)/1000));
 useEffect(()=>{
  const before=document.activeElement;closeRef.current?.focus();
  const key=e=>{if(e.key==='Escape'){e.preventDefault();closeAction.current();}if(e.key==='Tab'){const buttons=dialogRef.current?.querySelectorAll('button:not([disabled])');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);before?.focus?.();};
 },[]);
 if(!intro) return createPortal(
  <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black/80 p-3 backdrop-blur-[2px]" onClick={onClose}>
   <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="boss-armor-help-title" onClick={e=>e.stopPropagation()} className={effectDialogClass}>
    <header className="mb-3 flex items-center justify-between gap-2">
     <h2 id="boss-armor-help-title" className="font-sans text-base font-black uppercase">{text.active}</h2>
     <button ref={closeRef} type="button" onClick={onClose} aria-label={text.close} className="rounded p-1 text-[#73f2ae]"><X className="h-5 w-5"/></button>
    </header>
    <ArmorLegend language={language} text={text}/>
    {left>0&&<p className="mt-2 text-xs font-bold text-[#b9ff68]">{text.broken} · {left} {text.seconds}</p>}
    <p className="mt-2 text-[11px] leading-snug text-[#c4d2b5]">{text.rules[1]}</p>
    <p className="mt-2 text-[11px] font-bold leading-snug text-[#b9ff68]">{text.tip}</p>
    <button type="button" onClick={onClose} className={effectCloseClass}>{language==='en'?'Close':language==='ru'?'Закрыть':'Закрити'}</button>
   </section>
  </div>,document.body);
 return createPortal(<div className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-black/80 p-3" onClick={onClose}>
  <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="boss-armor-help-title" onClick={e=>e.stopPropagation()} className="relative my-auto max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-2xl border border-[#75ae66] bg-[#101b19] text-[#e9f5e5] shadow-2xl">
   <div className="relative h-36 overflow-hidden bg-[#14232d] sm:h-44"><img src="/skills/advanced/armor-intro.webp" alt="" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-b from-black/10 to-[#101b19]"/><div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-4 pb-2"><img src={`/skills/advanced/${left?'armor-broken-v7':'armor-active-v6'}.webp`} alt="" className="h-16 w-20 object-contain drop-shadow-lg"/><h2 id="boss-armor-help-title" className="pb-2 text-xl font-black">{intro?text.title:left?text.broken:text.active}</h2></div></div>
   <button type="button" aria-label={text.close} onClick={onClose} className="absolute right-2 top-2 rounded-full bg-black/60 p-2"><X className="h-5 w-5"/></button>
   <div className="px-4 pb-4 text-[13px] leading-relaxed">
    {intro&&<p className="mb-3 font-bold text-[#d8e6bb]">{text.intro}</p>}
    {!intro&&<p className={`mb-3 font-bold ${left?'text-lime-300':'text-amber-300'}`}>{left?`${text.broken} · ${left} ${text.seconds}`:text.active}</p>}
    <ArmorLegend language={language} text={text}/>
    <p className="mt-2">{text.rules[1]}</p>
    <p className="my-4 rounded-lg border border-lime-700/60 bg-lime-950/70 p-3 font-bold text-lime-200">{text.tip}</p>
    <button ref={closeRef} type="button" onClick={onClose} className="w-full rounded-lg border border-lime-400 bg-[#b6e85b] py-3 font-black text-[#15220d]">{text.close}</button>
   </div>
  </section>
 </div>,document.body);
}

export default function BossArmorStatus({state={},profile={},language='uk',onAcknowledge,previewIntro=false}){
 const [now,setNow]=useState(serverNow),[help,setHelp]=useState(false),[intro,setIntro]=useState(false);
 const text=armorCopy(language);const left=armorBreachSecondsLeft(state,now);
 const seenKey=`boss-armor-intro-v1:${profile.id||profile.created_by||'guest'}`;
 useEffect(()=>{const timer=setInterval(()=>setNow(serverNow()),250);return()=>clearInterval(timer);},[]);
 useEffect(()=>{let seen=Boolean(profile.boss_armor_intro_seen);try{seen ||= localStorage.getItem(seenKey)==='1';}catch{}setIntro(previewIntro||!seen);},[profile.boss_armor_intro_seen,seenKey,previewIntro]);
 const dismissIntro=()=>{setIntro(false);try{localStorage.setItem(seenKey,'1');}catch{}onAcknowledge?.();};
 return <>
  <button type="button" onClick={()=>setHelp(true)} title={left?text.broken:text.active} aria-label={left?`${text.broken}: ${left} ${text.seconds}`:text.active} className={`relative flex shrink-0 items-center gap-0.5 font-mono text-[11px] font-black ${left?'text-lime-300':'text-amber-200'}`}>
   <img src={`/skills/advanced/${left?'armor-broken-v7':'armor-active-v6'}.webp`} alt="" className="h-9 w-9 rounded object-contain"/>
   {left > 0 && <span className="absolute inset-x-0 bottom-0 rounded bg-black/85 text-center text-[9px] leading-none">{left}{text.seconds}</span>}
  </button>
  {help&&<ArmorHelpDialog language={language} breachUntil={Number(state.breachUntil||0)} now={now} onClose={()=>setHelp(false)}/>}
  {intro&&<ArmorHelpDialog language={language} intro onClose={dismissIntro}/>}
 </>;
}
