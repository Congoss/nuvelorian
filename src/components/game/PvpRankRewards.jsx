import RewardPopup from './RewardPopup';
import { getResourceIcon } from '@/lib/resourceIcons';
import cardPlayIcon from '@/assets/card-game/extra-play.webp';
import { getPvpRankReward, canClaimPvpRankReward } from '@/lib/pvpRankRewards';

export default function PvpRankRewards({ rank, language = 'uk', progress, receipt, onClaim, onClose }) {
  const configured = getPvpRankReward(rank);
  if (!configured) return null;
  const reward = receipt?.reward || configured;
  const text = (uk, ru, en) => language === 'ru' ? ru : language === 'en' ? en : uk;
  const ready = canClaimPvpRankReward(rank, progress);
  const claimed = Boolean(receipt || progress?.claimedRanks?.includes(rank));
  const rows = [
    ['small-poison', reward.smallPoison, text('Мала отрута', 'Малый яд', 'Small poison')],
    ['medium-poison', reward.mediumPoison, text('Середня отрута', 'Средний яд', 'Medium poison')],
    ['large-poison', reward.largePoison, text('Велика отрута', 'Большой яд', 'Large poison')],
    ['spin', reward.spins, text('Спіни', 'Спины', 'Spins')],
    ['cardPlays', reward.cardPlays, text('Карткові ігри', 'Карточные игры', 'Card games')],
  ];
  const rankLabel = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][rank - 1];
  const status = claimed ? text('Отримано', 'Получено', 'Received') : rank === 1 && !progress?.hasVictory ? text('Після першої перемоги', 'После первой победы', 'After your first win') : `${configured.requiredRating} ${text('рейтингу', 'рейтинга', 'rating')}`;
  return <RewardPopup open language={language} title={`${text('Нагорода рангу', 'Награда ранга', 'Rank reward')} ${rankLabel} · ${status}`}
    items={rows.map(([id, amount, label]) => ({ id, icon: id === 'cardPlays' ? cardPlayIcon : getResourceIcon(id), label, text: `×${amount}` }))}
    confirmLabel={ready ? text('Забрати', 'Забрать', 'Claim') : text('Закрити', 'Закрыть', 'Close')}
    onClose={onClose} onConfirm={ready ? async () => { await onClaim(rank); onClose(); } : onClose}/>
}
