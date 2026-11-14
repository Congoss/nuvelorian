import GameTextureButton from './GameTextureButton';
import { PVP_RANK_THRESHOLDS } from '@/lib/pvpRanks';
import cardBackground from '@/assets/pvp/duel-card-bg-v1.webp';

export default function PvpResultCard({ match, rating = 0, language = 'uk', busy, onClose }) {
  const text = (uk, ru, en) => language === 'ru' ? ru : language === 'en' ? en : uk;
  const rank = Math.max(0, PVP_RANK_THRESHOLDS.findLastIndex(value => value <= rating));
  const title = match.result === 'win' ? text('ПЕРЕМОГА!', 'ПОБЕДА!', 'VICTORY!') : match.result === 'loss' ? text('ПОРАЗКА', 'ПОРАЖЕНИЕ', 'DEFEAT') : text('НІЧИЯ', 'НИЧЬЯ', 'DRAW');
  const delta = match.ratingDelta || 0;
  return <div className="pvp-result-scrim"><section className="pvp-result-card" data-result={match.result} style={{ backgroundImage: `url(${cardBackground})` }} role="region" aria-label={title}>
    <small>{text('ОРБІТАЛЬНА ДУЕЛЬ', 'ОРБИТАЛЬНАЯ ДУЭЛЬ', 'ORBITAL DUEL')}</small>
    <h2>{title}</h2>
    <div className="pvp-result-rank"><img src={`/pvp/ranks-v1/rank-${rank + 1}.webp`} alt={text(`Ранг ${rank + 1}`, `Ранг ${rank + 1}`, `Rank ${rank + 1}`)} /></div>
    <strong className="pvp-result-points">{delta > 0 ? '+' : delta < 0 ? '−' : ''}{Math.abs(delta)}</strong>
    <p>{text('очок рейтингу', 'очков рейтинга', 'rating points')}</p>
    <span className="pvp-result-total">{text('Твій рейтинг', 'Твой рейтинг', 'Your rating')}: {rating}</span>
    <GameTextureButton type="button" tone="green" disabled={busy} onClick={onClose} className="pvp-result-close"><span>{text('ДО ЛОБІ', 'В ЛОББИ', 'BACK TO LOBBY')}</span></GameTextureButton>
  </section></div>;
}
