import { useState } from 'react';
import TutorialJourneyGoal from '@/components/game/TutorialJourneyGoal';
import background from '@/assets/optimized/camp/hero-background.webp';
export default function TutorialJourneyPreview(){
 const [language,setLanguage]=useState('uk');const [level,setLevel]=useState(7);
 return <main className="relative flex h-[100dvh] flex-col bg-[#101b12] p-4 text-white"><img src={background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45"/><div className="relative mx-auto flex w-full max-w-[380px] gap-2">{['uk','ru','en'].map(lang=><button key={lang} onClick={()=>setLanguage(lang)} className="bg-black/60 p-2">{lang}</button>)}<select value={level} onChange={e=>setLevel(Number(e.target.value))} className="bg-[#15250f] p-2">{[4,5,6,7].map(n=><option key={n} value={n}>LVL {n}</option>)}</select></div><div className="relative mx-auto mt-auto w-full max-w-[380px]"><TutorialJourneyGoal profile={{level,xp:100}} language={language} onContinue={()=>window.location.assign('/')}/></div></main>;
}
