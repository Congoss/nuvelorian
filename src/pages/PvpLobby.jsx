import { Clock3, Swords, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import token from '@/assets/ui/pl4-token.webp';
import MarkerFrame from '@/components/game/MarkerFrame';
import AchievementBadge from '@/components/game/AchievementBadge';
import PvpRankRewards from '@/components/game/PvpRankRewards';
import { canClaimPvpRankReward, getPvpRankReward } from '@/lib/pvpRankRewards';
import { LeaderboardRow, LeaderboardValuePill } from '@/components/game/LeaderboardShared';
import { PVP_RANK_THRESHOLDS, PVP_SERIES_SIZE, PVP_SEARCH_SECONDS } from '../lib/pvpRanks.js';
import './pvpLobby.css';

const copy = {
  uk: {
    ranked: 'За ранг', stakes: 'За $PL4', rank: 'Ранг', next: 'До наступного рангу',
    pilot: 'Пілот', quick: 'Швидкий бій', agents: '20 ШІ-суперників', title: 'Дошка викликів',
    empty: 'Відкритих викликів немає', demo: 'Онлайн-виклики та ставки ще готуються.',
    create: 'Створити виклик', rating: 'Рейтинг', example: 'Приклад картки', accept: 'Прийняти', stake: 'Ставка з гравця',
    attempts: 'Доступні спроби', cooldown: 'Наступна спроба через',
    win: 'Перемога', loss: 'Поразка',
    draw: 'Нічия', history: 'Історія боїв', noHistory: 'Завершених боїв ще немає',
    top: 'Топ сезону', noLeaders: 'Перші пілоти з’являться після завершених боїв', you: 'Ти',
    merchants: 'Виклик торговцям', merchantNote: 'Вхід безкоштовний. Поразка нічого не коштує. Приз за перемогу торговець платить зі свого прибутку на ринку.',
    prize: 'Приз за перемогу', fight: 'Бій', noPrize: 'Каса порожня — приз з’явиться після продажів на ринку', smith: 'Коваль', hunter: 'Скупник',
    pvpSoon: 'Виклики між гравцями ще готуються.',
  },
  ru: {
    ranked: 'За ранг', stakes: 'За $PL4', rank: 'Ранг', next: 'До следующего ранга',
    pilot: 'Пилот', quick: 'Быстрый бой', agents: '20 ИИ-соперников', title: 'Доска вызовов',
    empty: 'Открытых вызовов нет', demo: 'Онлайн-вызовы и ставки ещё готовятся.',
    create: 'Создать вызов', rating: 'Рейтинг', example: 'Пример карточки', accept: 'Принять', stake: 'Ставка с игрока',
    attempts: 'Доступные попытки', cooldown: 'Следующая попытка через',
    win: 'Победа', loss: 'Поражение',
    draw: 'Ничья', history: 'История боёв', noHistory: 'Завершённых боёв пока нет',
    top: 'Топ сезона', noLeaders: 'Первые пилоты появятся после завершённых боёв', you: 'Ты',
    merchants: 'Вызов торговцам', merchantNote: 'Вход бесплатный. Поражение ничего не стоит. Приз за победу торговец платит из своей прибыли на рынке.',
    prize: 'Приз за победу', fight: 'Бой', noPrize: 'Касса пуста — приз появится после продаж на рынке', smith: 'Кузнец', hunter: 'Скупщик',
    pvpSoon: 'Вызовы между игроками ещё готовятся.',
  },
  en: {
    ranked: 'Ranked', stakes: 'For $PL4', rank: 'Rank', next: 'To the next rank',
    pilot: 'Pilot', quick: 'Quick match', agents: '20 AI opponents', title: 'Challenge board',
    empty: 'No open challenges', demo: 'Online challenges and stakes are in development.',
    create: 'Create challenge', rating: 'Rating', example: 'Example card', accept: 'Accept', stake: 'Stake per player',
    attempts: 'Attempts available', cooldown: 'Next attempt in',
    win: 'Win', loss: 'Loss',
    draw: 'Draw', history: 'Match history', noHistory: 'No completed matches yet',
    top: 'Season standings', noLeaders: 'Pilots appear after completing a match', you: 'You',
    merchants: 'Challenge the merchants', merchantNote: 'Free entry. Losing costs nothing. The merchant pays the win prize from its own market profit.',
    prize: 'Win prize', fight: 'Fight', noPrize: 'Till is empty — a prize appears after market sales', smith: 'Blacksmith', hunter: 'Bargain hunter',
    pvpSoon: 'Player-vs-player challenges are in development.',
  },
};
// PL4 tab (merchant prizes / future player stakes) is hidden until after the hackathon.
const SHOW_TOKEN_TAB = false;
const rankMarks = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const rankNames = {
  uk: ['Орбітальний бомж', 'Накачаний псих', 'Токсичний тип', 'Череп без прописки', 'Космічний шкребун', 'Отруйний авторитет', 'Пожирач метеорів', 'Щелепа апокаліпсису', 'Ламач орбіт', 'Його Безумність'],
  ru: ['Орбитальный бомж', 'Накачанный псих', 'Токсичный тип', 'Череп без прописки', 'Космический писатель', 'Ядовитый авторитет', 'Пожиратель метеоров', 'Челюсть апокалипсиса', 'Ломатель орбит', 'Его Безумие'],
  en: ['Orbital Hobo', 'Pumped Psycho', 'Toxic Trouble', 'Homeless Skull', 'Cosmic Scribbler', 'Venom Boss', 'Meteor Muncher', 'Apocalypse Jaw', 'Orbit Breaker', 'His Madness'],
};
const getRank = rating => PVP_RANK_THRESHOLDS.findLastIndex(value => value <= Math.max(0, rating));
const rankIcon = tier => `/pvp/ranks-v1/rank-${tier + 1}.webp`;

export function PvpAttempts({lang, progress}) {
  const t = copy[lang];
  const {attempts = PVP_SERIES_SIZE, readyAt = 0, serverTime} = progress ?? {};
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (!readyAt) return;
    const timer = setInterval(() => setClock(Date.now()), 500);
    return () => clearInterval(timer);
  }, [readyAt, serverTime]);
  const remaining = Math.max(0, Math.ceil((readyAt - clock) / 1000));
  const countdown = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  return <div className="pvp-lobby-attempts">
    <span title={t.attempts} aria-label={`${t.attempts} ${attempts} / ${PVP_SERIES_SIZE}`}><Swords size={12}/>{attempts}/{PVP_SERIES_SIZE}</span>
    {readyAt > 0 && <span title={t.cooldown} aria-label={`${t.cooldown} ${countdown}`}><Clock3 size={12}/>{countdown}</span>}
  </div>;
}

export default function PvpLobby({ lang, mode, onMode, progress, busy, onStart, error, online = false, queue = null, onCancel, onClaimRank, rewardReceipts = {}, selfPlayer = null }) {
  const t = copy[lang];
  const {rating = 0, attempts = PVP_SERIES_SIZE, history = [], leaders = [], merchants = []} = progress ?? {};
  const [showHistory, setShowHistory] = useState(false);
  const [rewardRank, setRewardRank] = useState(null);
  const [searchClock, setSearchClock] = useState(Date.now);
  const serverOffset = useRef(0);
  useEffect(() => {
    if (progress?.serverTime) serverOffset.current = progress.serverTime - Date.now();
    setSearchClock(Date.now());
  }, [progress?.serverTime]);
  useEffect(() => {
    if (!queue) return;
    const timer = setInterval(() => setSearchClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, [Boolean(queue)]);
  const searchLeft = queue ? Math.max(0, Math.ceil(((queue.fallbackAt || queue.joinedAt + PVP_SEARCH_SECONDS * 1000) - searchClock - serverOffset.current) / 1000)) : PVP_SEARCH_SECONDS;
  const tier = getRank(rating);
  const next = PVP_RANK_THRESHOLDS[tier + 1];
  const formatRating = new Intl.NumberFormat(lang === 'uk' ? 'uk-UA' : lang).format;
  const selfAvatar = selfPlayer?.avatar || selfPlayer?.photoUrl || selfPlayer?.avatar_url || selfPlayer?.photo_url || null;
  const selfFrameId = selfPlayer?.avatar_frame_id || selfPlayer?.selected_avatar_frame || null;
  const leaderboardRows = leaders.map(pilot => ({...pilot, title: pilot.self ? (selfPlayer?.nickname || selfPlayer?.username || t.you) : `${pilot.name || `${t.pilot} ${pilot.number}`}${pilot.kind === 'ai' ? ' · AI' : ''}`, subtitle: t.rating}));
  return (
    <section className="pvp-lobby">
      {SHOW_TOKEN_TAB && <nav className="pvp-lobby-modes" aria-label="PvP">
        <button type="button" aria-pressed={mode === 'ranked'} onClick={() => onMode('ranked')}>
          <Swords size={18} /> {t.ranked}
        </button>
        <button type="button" aria-pressed={mode === 'stakes'} onClick={() => onMode('stakes')}>
          <img src={token} alt="" /> {t.stakes}
        </button>
      </nav>}
      {mode === 'ranked' || !SHOW_TOKEN_TAB ? (
        <>
          <div className="pvp-lobby-rank-card">
            <div className="pvp-lobby-rating">
              <img className="pvp-lobby-emblem" src={rankIcon(tier)} alt="" />
              <div><span>{t.rank} {rankMarks[tier]}{next !== undefined && <small className="pvp-lobby-next" title={t.next} aria-label={`${t.next} ${next - rating}`}> → {next - rating}</small>}</span><b>{rankNames[lang][tier]}</b><strong>{rating}</strong></div>
              <button type="button" className="pvp-lobby-history-toggle" aria-expanded={showHistory} aria-controls="pvp-match-history" onClick={()=>setShowHistory(!showHistory)}>{t.history}</button>
            </div>
            {next !== undefined && <div className="pvp-lobby-progress">
              <div className="pvp-rank-meter" role="progressbar" aria-label={t.next} aria-valuemin={0} aria-valuemax={next - PVP_RANK_THRESHOLDS[tier]} aria-valuenow={Math.max(0, rating - PVP_RANK_THRESHOLDS[tier])}>
                <div className="pvp-rank-meter-fill" style={{width:`${100 * Math.max(0, rating - PVP_RANK_THRESHOLDS[tier]) / (next - PVP_RANK_THRESHOLDS[tier])}%`}}>
                  <div className="pvp-rank-meter-energy"><i /></div>
                </div>
              </div>
            </div>}
            <ol className="pvp-lobby-rank-track" aria-label={t.rank}>
              {PVP_RANK_THRESHOLDS.map((threshold, index) => {
                const unlocked = index <= tier;
                const label = unlocked ? rankNames[lang][index] : lang === 'uk' ? 'Ранг ще не відкрито' : lang === 'ru' ? 'Ранг ещё не открыт' : 'Rank undiscovered';
                return <li key={threshold} data-unlocked={index <= tier} aria-current={index === tier ? 'step' : undefined} title={label}>
                  <button type="button" className="pvp-rank-reward-trigger" disabled={busy || !!queue || !onClaimRank} onClick={()=>setRewardRank(index+1)} aria-label={`${t.rank} ${rankMarks[index]} · ${lang === 'uk' ? 'Нагороди' : lang === 'ru' ? 'Награды' : 'Rewards'}`}>
                    {unlocked ? <img src={rankIcon(index)} alt={label} /> : <div className="pvp-lobby-rank-locked" role="img" aria-label={label}><AchievementBadge locked /></div>}
                    {canClaimPvpRankReward(index+1,progress) && <i className="pvp-rank-reward-ready"/>}
                    <small>{rankMarks[index]}</small>
                  </button>
                </li>;
              })}
            </ol>
            {onClaimRank && <button type="button" className="pvp-reward-summary" disabled={busy || !!queue} onClick={()=>setRewardRank(PVP_RANK_THRESHOLDS.map((_,i)=>i+1).find(rank=>canClaimPvpRankReward(rank,progress)) || Math.min(tier+2,PVP_RANK_THRESHOLDS.length))}>
              {lang === 'uk' ? 'Нагороди за ранг' : lang === 'ru' ? 'Награды за ранг' : 'Rank rewards'} · {lang === 'uk' ? 'Яди + спіни + карткові ігри' : lang === 'ru' ? 'Яды + спины + карточные игры' : 'Poison + spins + card games'}
              <small>{(()=>{const r=getPvpRankReward(Math.min(tier+2,PVP_RANK_THRESHOLDS.length));return `${rankMarks[r.rank-1]}: ${r.smallPoison} / ${r.mediumPoison} / ${r.largePoison} · ${r.spins} · ${r.cardPlays}`;})()}</small>
            </button>}
            <div id="pvp-match-history" hidden={!showHistory}>
              {history.length ? <ul className="pvp-lobby-rows">
                {history.map(match => <li key={match.id}><span>{match.opponent}</span><span>{t[match.result]}</span><b>{match.delta > 0 ? '+' : ''}{match.delta}</b></li>)}
              </ul> : <p className="pvp-lobby-empty">{t.noHistory}</p>}
            </div>
          </div>
          <div className="pvp-lobby-queue">
            {queue ? <button className="pvp-green pvp-search-button" disabled={busy} onClick={onCancel} title={lang === 'uk' ? 'Скасувати пошук' : lang === 'ru' ? 'Отменить поиск' : 'Cancel search'} aria-label={lang === 'uk' ? 'Скасувати пошук' : lang === 'ru' ? 'Отменить поиск' : 'Cancel search'}><Clock3 size={18} aria-hidden="true"/><span aria-live="polite">{busy ? (lang === 'uk' ? 'Скасовуємо…' : lang === 'ru' ? 'Отменяем…' : 'Cancelling…') : searchLeft > 0 ? <>{lang === 'uk' ? 'Шукаємо суперника…' : lang === 'ru' ? 'Ищем соперника…' : 'Finding an opponent…'} <b>00:{String(searchLeft).padStart(2,'0')}</b></> : (lang === 'uk' ? 'Підбираємо ШІ…' : lang === 'ru' ? 'Подбираем ИИ…' : 'Matching an AI pilot…')}</span></button> : <button className="pvp-green" disabled={busy || attempts === 0} onClick={() => onStart()}><Swords size={18} /> {busy ? (lang === 'uk' ? 'Починаємо…' : lang === 'ru' ? 'Начинаем…' : 'Starting…') : t.quick}</button>}
          </div>
          <MarkerFrame id="pvp-leaderboard" className="pvp-lobby-leaderboard trophy-ranking-background p-2" innerClassName="relative z-10">
            <h2><Trophy size={17}/>{t.top}</h2>
            {leaderboardRows.length ? <>

              <div className="space-y-1.5">
                {leaderboardRows.map(row => <LeaderboardRow key={row.position} compactRank rank={row.position} selected={row.self}
                  title={row.title} subtitle={rankNames[lang][getRank(row.rating)]} rightNodeClassName=""
                  mediaSrc={row.self ? selfAvatar : row.avatar} mediaFrameId={row.self ? selfFrameId : row.avatarFrameId}
                  titlePlayer={row.self ? selfPlayer : row.kind === 'human' ? { id: row.id, nickname: row.name, avatar: row.avatar, avatar_frame_id: row.avatarFrameId, profile_header_theme: row.profileHeaderTheme, battle_pass_tier: row.battlePassTier } : null}
                  rightNode={<LeaderboardValuePill compact icon={rankIcon(getRank(row.rating))} value={row.rating} valueFormatter={formatRating} />} />)}
              </div>
            </> : <p className="pvp-lobby-empty">{t.noLeaders}</p>}
          </MarkerFrame>
        </>
      ) : (
        <div className="pvp-lobby-challenges">
          <h2>{t.merchants}</h2>
          <small>{t.merchantNote}</small>
          {merchants.map(m => <article key={m.agentKey} className="pvp-lobby-challenge-card">
            <small>{t[m.agentKey]} · ШІ</small>
            <b>{m.merchant}</b>
            <span>{m.prize > 0 ? <>{t.prize} · {formatRating(Math.round(m.prize / 100))} $PL4</> : t.noPrize}</span>
            <button className="pvp-green" disabled={busy || attempts === 0} onClick={() => onStart(m.agentKey)}><Swords size={16} /> {t.fight}</button>
          </article>)}
          <p>{t.pvpSoon}</p>
        </div>
      )}
      {error && <p className="pvp-error" role="alert">{error}</p>}
      {rewardRank && <PvpRankRewards rank={rewardRank} language={lang} progress={progress} receipt={rewardReceipts[rewardRank]} onClaim={onClaimRank} onClose={()=>setRewardRank(null)}/>}
    </section>
  );
}
