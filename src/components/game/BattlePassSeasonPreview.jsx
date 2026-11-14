import { useTranslation } from 'react-i18next';
import { SKELETON_SEASON_TEXT, SKELETON_REWARD_NAMES, skeletonLanguage } from '@/lib/skeletonSeasonText';
import { useState } from 'react';
import BattlePassScene from './BattlePassScene';
import season from '@/lib/skeletonSeasonPreview.json';
import seasonBanner from '@/assets/ui/skeleton-season-banner-v1.webp';
import './battlePassSeasonPreview.css';
import { BP_TASKS } from '@/lib/battlePass';
import curseIcon from '@/assets/buffs/bone-curse-v2.webp';

const illustratedSeason = { ...season, banner: seasonBanner, curseIcon, prices: { epic: 599, legendary: 999 } };

export default function BattlePassSeasonPreview({ profile, onClose, onNavigate }) {
  const { i18n } = useTranslation();
  const language = skeletonLanguage(i18n.resolvedLanguage || i18n.language || profile?.language);
  const copy = SKELETON_SEASON_TEXT[language];
  const localizedSeason = { ...illustratedSeason, title: copy.title, rewards: season.rewards.map(row => ({ ...row, ...Object.fromEntries(['free','epic','legendary'].map(track => [track, row[track].map(reward => ({ ...reward, label: SKELETON_REWARD_NAMES[language][reward.type] || reward.label }))])) })) };
  const [level, setLevel] = useState(1);
  const [tier, setTier] = useState('legendary');
  const [claims, setClaims] = useState([]);
  const tasks = profile?.battle_pass_view?.tasks || Object.fromEntries(Object.entries(BP_TASKS).map(([scope, items]) => [scope, items.map(task => ({ ...task, progress: 0, done: false }))]));
  const view = { active: true, level, tier, claims, daysLeft: 28, tickets: 0, levelXp: 0, xp: level * 150, tasks };
  const update = async ({ battlePassAction: action }) => {
    if (action.type === 'claim') setClaims(current => [...new Set([...current, `${action.track}:${action.level}`])]);
    if (action.type === 'claim-all') {
      const tracks = ['free', 'epic', 'legendary'].slice(0, ['free', 'epic', 'legendary'].indexOf(tier) + 1);
      const claimed = season.rewards.filter(row => row.level <= level).flatMap(row => tracks.filter(track => !claims.includes(`${track}:${row.level}`)).map(track => ({ level: row.level, track })));
      setClaims(current => [...new Set([...current, ...claimed.map(item => `${item.track}:${item.level}`)])]);
      return { battlePassClaimed: claimed };
    }
    return {};
  };
  return <div className="bp-season-preview" style={{ '--bp-season-backdrop': `url(${seasonBanner})` }}>
    <div className="bp-preview-controls"><span>{copy.preview}</span><label>LVL <input aria-label="Рівень прев’ю" type="number" min="1" max="70" value={level} onChange={event => setLevel(Math.max(1, Math.min(70, Number(event.target.value) || 1)))} /></label><select aria-label="Гілка прев’ю" value={tier} onChange={event => setTier(event.target.value)}><option value="free">Free</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></div>
    <BattlePassScene profile={{ ...profile, language, battle_pass_view: view }} onUpdateProfile={update} onClose={onClose} onNavigate={onNavigate} seasonPreview={localizedSeason} />
  </div>;
}
