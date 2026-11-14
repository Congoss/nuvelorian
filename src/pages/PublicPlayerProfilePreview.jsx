import PlayerCollection from '@/components/game/PlayerCollection';
import { PLAYER_ACHIEVEMENTS, ACHIEVEMENT_REWARDS, getAchievementLanguage } from '@/lib/playerAchievements';
import { useState } from 'react';
import PublicPlayerProfile from '@/components/game/PublicPlayerProfile';
import { DEFAULT_EQUIPMENT_ITEMS } from '@/components/game/equipmentData';
import avatar from '@/assets/optimized/all/profile/profile_1.webp';

const items = DEFAULT_EQUIPMENT_ITEMS.filter(item => item.id.startsWith('nuvelor_'));
const profile = {
  nickname: 'BiopHyzix', avatar, level: 422, stat_strength: 684031,
  boss_kills_by_id: {heli:181,tank:56,chinook:33,boss4:8,boss5:10}, ship_boss_kills: {hull:17,engine:3},
  clan_name: 'Kristian Diary', inventory_items: items,
  equipment_enhancement_levels: Object.fromEntries(items.map((item, index) => [item.id, [7, 3, 5, 0, 2, 4][index % 6]])),
  equipped_items: Object.fromEntries(items.map(item => [item.slot, item.id])),
};

export default function PublicPlayerProfilePreview() {
  const [language, setLanguage] = useState(() => getAchievementLanguage(new URLSearchParams(window.location.search).get('lang')));
  const [earnedCount, setEarnedCount] = useState(2);
  const previewProfile = { ...profile, player_achievements: Object.fromEntries(PLAYER_ACHIEVEMENTS.slice(0, earnedCount).map(item => [item.id, { unlocked_at: '2026-10-28T12:00:00Z', rewards: ACHIEVEMENT_REWARDS[item.id] }])) };
  const [open, setOpen] = useState(true);
  const [collectionOpen, setCollectionOpen] = useState(() => new URLSearchParams(window.location.search).get('collection') === '1');
  return <main className="game-app flex h-[100dvh] flex-col items-center gap-3 bg-[#080e0b] p-3 text-[#e7f0d3]">
    <div className="flex w-full max-w-[506px] shrink-0 items-center justify-between gap-2 text-xs">
      <span>Перегляд профілю</span>
      <div className="flex gap-1">{['uk', 'ru', 'en'].map(lang => <button key={lang} onClick={() => setLanguage(lang)} aria-pressed={language === lang} className={`rounded border px-3 py-2 ${language === lang ? 'border-[#a9ca6d] bg-[#283920]' : 'border-[#536b38]'}`}>{lang.toUpperCase()}</button>)}</div>
    </div>
    <div className="flex w-full max-w-[506px] shrink-0 items-center justify-center gap-2 text-[10px]">
      <button type="button" onClick={() => setCollectionOpen(true)} className="bg-[#354d25] px-2 py-2 text-[#dfff9c]">{language === 'ru' ? 'Все награды' : language === 'en' ? 'All awards' : 'Усі нагороди'}</button>
      <span>{language === 'ru' ? 'Открыто:' : language === 'en' ? 'Unlocked:' : 'Відкрито:'}</span>
      {[0, 2, 4].map(count => <button type="button" key={count} onClick={() => setEarnedCount(count)} aria-pressed={earnedCount === count} className={`px-3 py-2 ${earnedCount === count ? 'bg-[#354d25] text-[#dfff9c]' : 'bg-[#122017]'}`}>{count}/4</button>)}
    </div>
    <div className="min-h-0 w-full max-w-[506px] flex-1">
      {open ? <PublicPlayerProfile profile={previewProfile} language={language} onClose={() => setOpen(false)} onGoHome={() => setOpen(false)} /> : <button onClick={() => setOpen(true)} className="rounded-xl border border-[#a9ca6d] p-4">Відкрити профіль</button>}
    </div>
   {collectionOpen && <PlayerCollection preview profile={previewProfile} language={language} onClose={() => setCollectionOpen(false)} />}
 </main>;
}
