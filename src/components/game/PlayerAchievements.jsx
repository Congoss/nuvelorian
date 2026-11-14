import { useAchievementLanguage } from '@/lib/useAchievementLanguage';
import { useState } from 'react';
import AchievementBadge from './AchievementBadge';
import AchievementUnlockPopup from './AchievementUnlockPopup';
import { PLAYER_ACHIEVEMENTS, ACHIEVEMENT_CAPACITY } from '@/lib/playerAchievements';

const FUTURE_ACHIEVEMENT_SLOTS = Math.max(0, ACHIEVEMENT_CAPACITY - PLAYER_ACHIEVEMENTS.length);

export default function PlayerAchievements({ profile, language = 'uk', preview = false }) {
  const lang = useAchievementLanguage(language, preview);
  const [selected, setSelected] = useState(null);
  const copy = { uk: ['Ачівки', 'Прихована ачівка', 'Знайди власний спосіб відкрити її.'], ru: ['Достижения', 'Скрытое достижение', 'Найди свой способ открыть его.'], en: ['Achievements', 'Hidden achievement', 'Discover how to unlock it yourself.'] }[lang];
  const unlocked = profile.player_achievements || {};
  const current = PLAYER_ACHIEVEMENTS.find(item => item.id === selected);
  return <section className="mt-3 bg-[#081108]/60 p-2">
    <div className="mb-2 flex justify-between text-[10px] font-black uppercase text-[#b9dc91]"><h3>{copy[0]}</h3><span>{PLAYER_ACHIEVEMENTS.filter(item => unlocked[item.id]).length}/{PLAYER_ACHIEVEMENTS.length + FUTURE_ACHIEVEMENT_SLOTS}</span></div>
    <div className="grid grid-cols-5 gap-1.5">{PLAYER_ACHIEVEMENTS.map((item) => {
      const earned = Boolean(unlocked[item.id]);
  
      return <button type="button" key={item.id} aria-label={earned ? item[lang][0] : copy[1]} aria-pressed={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)} className="flex min-w-0 flex-col items-center gap-1 p-1 focus-visible:outline focus-visible:outline-[#28ee90]"><div className="aspect-square w-full"><AchievementBadge id={item.id} locked={!earned} /></div><span className={`text-[8px] leading-tight ${earned ? 'text-[#ffe58a]' : 'text-[#718167]'}`}>{earned ? item[lang][0] : '?'}</span></button>;
    })}
    {Array.from({ length: FUTURE_ACHIEVEMENT_SLOTS }, (_, index) => <div key={`future-${index}`} aria-label={copy[1]} className="flex min-w-0 flex-col items-center gap-1 p-1"><div className="aspect-square w-full"><AchievementBadge locked /></div><span className="text-[8px] leading-tight text-[#718167]">?</span></div>)}
    </div>
    {current && !unlocked[current.id] && <div className="mt-2 pt-2"><p className="text-[11px] font-black text-[#ffe58a]">{copy[1]}</p><p className="mt-1 text-[10px] text-[#b9cbb5]">{current[lang][1] || copy[2]}</p></div>}
    {current && unlocked[current.id] && <AchievementUnlockPopup id={current.id} ownerId={profile.id} rewardStatus={unlocked[current.id]?.reward_status} language={lang} preview={preview} discovery={false} rewards={unlocked[current.id]?.rewards} onClose={() => setSelected(null)} />}
  </section>;
}
