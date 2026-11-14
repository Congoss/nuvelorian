import { useTranslation } from 'react-i18next';
import { SKELETON_SEASON_TEXT, skeletonLanguage } from '@/lib/skeletonSeasonText';
import { useMemo, useState } from 'react';
import BossPanel from '@/components/game/BossPanel';
import { GAME_CONFIG } from '@/lib/gameConfig';

const profile = { id: 'local-curse-preview', nickname: 'local_tester', language: 'uk', level: 100, stat_strength: 100, energy: 1000, max_energy: 1000, weapon_inventory: { 'small-poison': 100, 'medium-poison': 100, 'large-poison': 100 }, equipped_items: {}, equipment_inventory: [], talent_levels: {}, boss_kills_by_id: {} };
export default function BoneCursePreview() {
  const { i18n } = useTranslation();
  const language = skeletonLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = SKELETON_SEASON_TEXT[language];
  const [token, setToken] = useState(0);
  const [bossId, setBossId] = useState('boss7');
  const [curseState, setCurseState] = useState({ expiresAt: 0, cooldownUntil: 0 });
  const activateCurse = () => { const now = Date.now(); setCurseState({ expiresAt: now + 60000, cooldownUntil: now + 3660000 }); setToken(value => value + 1); };
  const adapter = useMemo(() => {
    const boss = GAME_CONFIG.BOSSES.find(item => item.id === bossId);
    const fight = { id: 'local-curse-fight', boss_id: bossId, boss_name: boss.names?.[language === 'uk' ? 'ua' : language] || boss.name, status: 'active', current_hp: boss.maxHp, max_hp: boss.maxHp, player_id: profile.id, created_at: new Date().toISOString() };
    return { fight, leaderboard: [], damageLog: {}, onClose: () => window.location.assign('/?localBattlePass=1'), attack: async () => { const active = curseState.expiresAt > Date.now(); return { fight, hit: { damage: active ? 110 : 100, isCrit: false }, playerDamageLog: {} }; } };
  }, [bossId, curseState.expiresAt, language]);
  return <main className="mx-auto flex h-[100dvh] max-w-[520px] flex-col overflow-hidden bg-[#07110e] text-white">
    <div className="flex shrink-0 items-center gap-2 border-b border-teal-800 bg-[#102621] p-2 text-xs"><a href="/?localBattlePass=1">← BP</a><select aria-label="Language" className="bg-[#142e25] p-1" value={language} onChange={event => i18n.changeLanguage(event.target.value)}><option value="uk">UK</option><option value="ru">RU</option><option value="en">EN</option></select><select aria-label={copy.boss} className="min-w-0 flex-1 bg-[#142e25] p-2" value={bossId} onChange={event => setBossId(event.target.value)}>{GAME_CONFIG.BOSSES.map(boss => <option key={boss.id} value={boss.id}>{boss.names?.[language === 'uk' ? 'ua' : language] || boss.name}</option>)}</select><button className="rounded border border-teal-400 bg-teal-900 p-2 font-bold" onClick={activateCurse}>{copy.trigger}</button></div>
    <div className="relative min-h-0 flex-1"><BossPanel key={bossId} profile={{ ...profile, language }} fightAdapter={adapter} cursePreviewToken={token} boneCursePreviewState={curseState} /></div>
  </main>;
}
