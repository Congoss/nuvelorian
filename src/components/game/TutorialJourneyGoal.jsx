import { getXpForLevel } from '@/lib/gameConfig';
import GameTextureButton from './GameTextureButton';
export default function TutorialJourneyGoal({profile,language='uk',onContinue}) {
 const lang=language==='ru'?'ru':language==='en'?'en':'uk';
 const copy={uk:['8 рівень → відкриються таланти','Виконуй квести: кожна дія дає досвід і ресурси.','До квестів','До наступного рівня'],ru:['8 уровень → откроются таланты','Выполняй квесты: каждое действие даёт опыт и ресурсы.','К квестам','До следующего уровня'],en:['Level 8 → unlock talents','Complete quests: each action earns XP and resources.','Go to quests','Next level']}[lang];
 const level=Math.max(1,Number(profile?.level)||1),xp=Math.max(0,Number(profile?.xp)||0),target=Math.max(1,Number(profile?.xp_to_next_level)||getXpForLevel(level));
 return <aside data-tutorial-journey="true" className="w-full max-w-[380px] bg-[#101c10]/95 px-3 py-3 font-mono shadow-[0_4px_16px_#0007]">
  <div className="flex items-center justify-between gap-2"><h3 className="text-[11px] font-black text-[#e6ecad]">{copy[0]}</h3><span className="shrink-0 text-[10px] font-black text-[#a9db6a]">LVL {level}/8</span></div>
  <div className="mt-2 flex justify-between text-[9px] text-[#b2c69c]"><span>{copy[3]}</span><span>{Math.min(xp,target)}/{target} XP</span></div>
  <div role="progressbar" aria-label={copy[3]} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(xp,target)} className="mt-1 h-1.5 overflow-hidden rounded bg-black/50"><div className="h-full bg-[#aad54f] transition-[width]" style={{width:`${Math.min(100,xp/target*100)}%`}}/></div>
  <p className="mt-2 text-[10px] leading-relaxed text-[#bfd0ae]">{copy[1]}</p>
  <GameTextureButton type="button" onClick={onContinue} className="mt-2 h-9 w-full"><span className="relative z-10 text-[10px] font-black uppercase text-[#18260f]">{copy[2]} →</span></GameTextureButton>
 </aside>;
}
