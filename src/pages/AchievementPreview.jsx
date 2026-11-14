import { useState } from 'react';
import AchievementUnlockPopup from '@/components/game/AchievementUnlockPopup';
import AchievementBadge from '@/components/game/AchievementBadge';
import { PLAYER_ACHIEVEMENTS } from '@/lib/playerAchievements';
export default function AchievementPreview() {
 const params=new URLSearchParams(window.location.search);
 const language=['ru','en'].includes(params.get('lang'))?params.get('lang'):'uk';
 const post=params.get('post')==='1';
 const [selected,setSelected]=useState(()=>PLAYER_ACHIEVEMENTS.find(item=>item.id===params.get('id'))?.id||PLAYER_ACHIEVEMENTS[0].id);
 const [locked,setLocked]=useState(false);
 return <main className="game-app h-[100dvh] overflow-y-auto bg-[#08110c] p-4 text-[#edf8d9]">
  <div className="mx-auto max-w-[460px]"><h1 className="mb-4 text-lg font-black">{language==='ru'?'Достижения · просмотр':language==='en'?'Achievements · preview':'Ачівки · перегляд'}</h1>
  <button type="button" onClick={()=>setLocked(!locked)} className="mb-5 border border-[#28ee90] px-3 py-2 text-xs">{language==='ru'?(locked?'Показать открытые':'Показать закрытые'):language==='en'?(locked?'Show unlocked':'Show locked'):(locked?'Показати відкриті':'Показати закриті')}</button>
  <div className="grid grid-cols-4 gap-2">{PLAYER_ACHIEVEMENTS.map(item=><button type="button" key={item.id} onClick={()=>setSelected(item.id)} className="min-w-0"><div className="aspect-square w-full"><AchievementBadge id={item.id} locked={locked} /></div><p className="mt-2 text-[9px]">{locked?'?':item[language][0]}</p></button>)}</div>
  </div>
  {selected&&<AchievementUnlockPopup key={selected} id={selected} language={language} preview post={post} onClose={()=>setSelected(null)} />}
 </main>;
}
