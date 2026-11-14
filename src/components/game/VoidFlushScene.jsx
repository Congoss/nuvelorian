import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BarChart3, ChevronDown, Clock3, Gift, Info, ShieldCheck, ShoppingBag, Trophy } from 'lucide-react';
import { createPortal } from 'react-dom';
import VoidExchangePanel from './VoidExchangePanel';
import MarkerFrame from './MarkerFrame';
import { LeaderboardPodium, LeaderboardRow } from './LeaderboardShared';
import { getLeaderboardReward, getServerProgress, VOID_FLUSH_CONFIG } from '@/lib/voidFlushConfig';
import { getResourceIcon } from '@/lib/resourceIcons';
import energyIcon from '@/assets/optimized/all/ui/energy.webp';
import voidFlushBanner from '@/assets/IVENTS/void-flush-banner.webp';
import VoidToiletScene from './VoidToiletScene';
import VoidFlushParticles from './VoidFlushParticles';
import smallPoisonIcon from '@/assets/optimized/all/skills/small-poison.webp';
import mediumPoisonIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import largePoisonIcon from '@/assets/optimized/all/skills/large-poison.webp';
import spinIcon from '@/assets/optimized/all/roulette/reward_free_spin.webp';
import heroAvatar from '@/assets/optimized/nav-hero.webp';
import prizeCrown from '@/assets/quests/P4 QUESTS/P4-U04/“Do Not Eat” Crown.png';
import prizePet from '@/assets/hero/eq-icons/pet-1.png';
import prizeBox from '@/assets/box/yellow-box.png';
import prizeStars from '@/assets/optimized/all/ui/star.webp';
import goldMedal from '@/assets/boss-ui/gold-medal.png';
import silverMedal from '@/assets/boss-ui/silver-medal.png';
import bronzeMedal from '@/assets/boss-ui/bronze-medal.png';

function getPrizeItems(prize, language) {
  const rank = prize.from;
  const items = [];
  if (rank <= 5) {
    items.push({ id: 'gift', label: locale(language, 'Telegram Gift', 'Telegram Gift', 'Telegram Gift'), icon: Gift });
  }
  if (rank <= 3) items.push({ id: 'crown', label: locale(language, 'Корона', 'Корона', 'Crown'), image: prizeCrown });
  if (rank === 1) items.push({ id: 'pet', label: locale(language, 'Пет', 'Пет', 'Pet'), image: prizePet });
  if (rank >= 6 && rank <= 10) items.push({ id: 'stars', count: 100, label: 'Telegram Stars', image: prizeStars });
  if (rank >= 11 && rank <= 20) items.push({ id: 'stars', count: 50, label: 'Telegram Stars', image: prizeStars });
  items.push({
    id: 'bundle',
    label: locale(language, 'Ігровий набір', 'Игровой набор', 'Game bundle'),
    image: prizeBox,
    clickable: true,
  });
  return items;
}

function getBoxContents(prize, language) {
  const rank = prize.from;
  const bundles = [
    { from: 1, items: [['tentacles', 50000], ['energy', 250], ['large-poison', 5], ['free-spin', 10]] },
    { from: 2, items: [['tentacles', 30000], ['energy', 150], ['large-poison', 3], ['free-spin', 7]] },
    { from: 4, items: [['tentacles', 20000], ['energy', 100], ['medium-poison', 3], ['free-spin', 5]] },
    { from: 6, items: [['tentacles', 12000], ['energy', 75], ['medium-poison', 2], ['free-spin', 3]] },
    { from: 11, items: [['tentacles', 6000], ['energy', 50], ['small-poison', 2], ['free-spin', 2]] },
    { from: 21, items: [['tentacles', 2500], ['energy', 25], ['small-poison', 1], ['free-spin', 1]] },
  ];
  const bundle = [...bundles].reverse().find((entry) => rank >= entry.from) || bundles[0];
  const labels = {
    tentacles: locale(language, 'щупалець', 'щупалец', 'tentacles'),
    energy: locale(language, 'енергії', 'энергии', 'energy'),
    'small-poison': locale(language, 'малих отрут', 'малых ядов', 'small poisons'),
    'medium-poison': locale(language, 'середніх отрут', 'средних ядов', 'medium poisons'),
    'large-poison': locale(language, 'великих отрут', 'больших ядов', 'large poisons'),
    'free-spin': locale(language, 'безкоштовних прокрутів', 'бесплатных прокруток', 'free spins'),
  };
  return bundle.items.map(([key, count]) => ({
    id: key,
    count,
    label: labels[key],
    image: key === 'tentacles' ? getResourceIcon('tentacles') : VOID_FLUSH_ICONS[key],
  }));
}

function getPrizeDescription(prize, language) {
  return getPrizeItems(prize, language).filter((item) => item.id !== 'bundle');
}

function getPlaceLabel(prize, language) {
  if (prize.from === prize.to) {
    return locale(language, `${prize.from} місце`, `${prize.from}-е место`, `${prize.from}${prize.from === 1 ? 'st' : prize.from === 2 ? 'nd' : prize.from === 3 ? 'rd' : 'th'} place`);
  }
  return locale(language, `Місця ${prize.from}–${prize.to}`, `Места ${prize.from}–${prize.to}`, `Places ${prize.from}–${prize.to}`);
}

function getPlaceMedals(prize) {
  if (prize.from === 1 && prize.to === 1) return [goldMedal];
  if (prize.from === 2 && prize.to === 2) return [silverMedal];
  if (prize.from === 3 && prize.to === 3) return [bronzeMedal];
  return [];
}

function TournamentPrizes({ language }) {
  const [selectedPrize, setSelectedPrize] = useState(null);
  const selectedItems = selectedPrize ? getBoxContents(selectedPrize, language) : [];
  return <>
    <div className="space-y-1">
      {VOID_FLUSH_CONFIG.leaderboardRewards.map((prize) => <div key={prize.from} className="flex min-h-[42px] items-center gap-2 border-b border-white/10 py-1 font-sans text-[10px]">
        <div className="flex w-[94px] shrink-0 items-center gap-1">
          {getPlaceMedals(prize).map((medal, index) => <img key={index} src={medal} alt="" aria-hidden="true" className="h-8 w-7 shrink-0 object-contain" />)}
          <strong className="min-w-0 text-[#d8ff5a]">{getPlaceLabel(prize, language)}</strong>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1">
          {getPrizeDescription(prize, language).map((item) => <span key={item.id} title={`${item.count ? `${format(item.count)} ` : '×1 '}${item.label}`} className="flex items-center gap-0.5 rounded border border-[#c6e77c]/20 bg-black/20 px-1 py-0.5">
            {item.image ? <img src={item.image} alt="" aria-hidden="true" className="h-8 w-8 object-contain" /> : <Gift className="h-7 w-7 text-[#ffe27c]" />}
            {item.count && item.count !== 1 ? <span className="font-mono text-[9px] font-black text-[#eaf5d8]">×{item.count}</span> : null}
          </span>)}
        </div>
        <button type="button" onClick={() => setSelectedPrize(prize)} aria-label={`${locale(language, 'Показати вміст набору', 'Показать состав набора', 'Show bundle contents')}: ${getPlaceLabel(prize, language)}`} className="relative shrink-0 rounded border border-[#c6e77c]/25 bg-black/20 p-1 transition hover:border-[#d8ff5a] hover:bg-[#25351a]"><img src={prizeBox} alt="" aria-hidden="true" className="h-6 w-6 object-contain" /><span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#d8ff5a] font-mono text-[8px] font-black text-[#111]">?</span></button>
      </div>)}
    </div>
    {selectedPrize ? createPortal(<div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedPrize(null)}>
      <div role="dialog" aria-modal="true" aria-label={locale(language, 'Вміст призу', 'Состав приза', 'Prize contents')} onClick={(event) => event.stopPropagation()} className="w-full max-w-[360px] rounded-lg border border-[#b9ff68] bg-[#0a1209] p-3 shadow-[0_0_28px_rgba(120,220,75,.2)]">
        <div className="flex items-center justify-between gap-2"><h3 className="font-mono text-[12px] font-black uppercase text-[#dfff9c]">{locale(language, 'ВМІСТ ІГРОВОГО НАБОРУ', 'СОСТАВ ИГРОВОГО НАБОРА', 'GAME BUNDLE CONTENTS')} · #{selectedPrize.from}{selectedPrize.to !== selectedPrize.from ? `–#${selectedPrize.to}` : ''}</h3><button type="button" onClick={() => setSelectedPrize(null)} className="px-2 text-xl text-[#dfff9c]" aria-label={locale(language, 'Закрити', 'Закрыть', 'Close')}>×</button></div>
        <div className="mt-2 space-y-1">{selectedItems.map((item) => <div key={item.id} className="flex items-center gap-2 rounded border border-[#28ee90]/30 bg-black/20 px-2 py-1.5"><img src={item.image} alt="" className="h-7 w-7 shrink-0 object-contain" /><span className="font-mono text-[10px] font-black text-[#eaf5d8]">{format(item.count)} {item.label}</span></div>)}</div>
      </div>
    </div>, document.body) : null}
  </>;
}

const VOID_FLUSH_ICONS = { energy: energyIcon, 'small-poison': smallPoisonIcon, 'medium-poison': mediumPoisonIcon, 'large-poison': largePoisonIcon, 'free-spin': spinIcon };

const locale = (language, uk, ru, en) => language === 'en' ? en : language === 'ru' ? ru : uk;
const format = (value) => new Intl.NumberFormat('uk-UA').format(Math.max(0, Math.floor(Number(value) || 0)));

function Countdown({ target, language }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  const value = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0'));
  return <span role="timer" className="inline-flex items-center gap-1 font-mono text-[9px] font-black tabular-nums text-[#dfff9c]"><Clock3 className="h-3 w-3" />{value[0]}{locale(language, 'д', 'д', 'd')} {value.slice(1).join(':')}</span>;
}

function SectionTitle({ icon: Icon, children, aside = null }) {
  return <div className="mb-2 flex items-center justify-between gap-2"><h2 className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] font-black uppercase tracking-[.08em] text-[#e8f6d8]"><Icon className="h-4 w-4 shrink-0 text-[#c9f43d]" />{children}</h2>{aside}</div>;
}

function StatCard({ label, value, detail = null, accent = 'green' }) {
  const accentClass = accent === 'gold' ? 'text-[#ffe076]' : 'text-[#d8ff5a]';
  return <div className="min-w-0 rounded-[11px] border border-[#28ee90]/70 bg-[#091009]/90 px-2.5 py-2 shadow-[inset_0_0_16px_rgba(95,150,38,.08)]"><p className="truncate font-mono text-[8px] font-black uppercase text-[#91ad75]">{label}</p><p className={`mt-0.5 truncate font-mono text-[17px] font-black leading-tight ${accentClass}`}>{value}</p>{detail ? <p className="mt-0.5 truncate font-mono text-[8px] text-[#a4b896]">{detail}</p> : null}</div>;
}

function ProgressBar({ percent, className = '', square = false }) {
  return <div className={`h-2 overflow-hidden ${square ? 'rounded-none' : 'rounded-full'} border border-[#4d7637] bg-[#0a110a] ${className}`}><div className={`h-full ${square ? 'rounded-none' : 'rounded-full'} bg-[linear-gradient(90deg,#5ab94b,#c7f33a)] shadow-[0_0_8px_rgba(182,240,60,.4)] transition-[width]`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div>;
}

function FlushTab({ language, demo, setDemo, claimedMilestones, setClaimedMilestones }) {
  const [resource, setResource] = useState('tentacles');
  const [requestedAp, setRequestedAp] = useState(1);
  const rate = resource === 'tentacles' ? VOID_FLUSH_CONFIG.rates.tentaclesPerAp : VOID_FLUSH_CONFIG.rates.tPapePerAp;
  const balance = resource === 'tentacles' ? demo.tentacles : demo.tPape;
  const maxAp = Math.floor(balance / rate);
  const ap = Math.max(1, Math.floor(Number(requestedAp) || 1));
  const cost = ap * rate;
  const balanceRef = useRef(null);
  const sceneRef = useRef(null);
  const [flight, setFlight] = useState(null);
  useEffect(() => {
    if (!flight) return;
    const timer = window.setTimeout(() => setFlight(null), 2200);
    return () => window.clearTimeout(timer);
  }, [flight]);
  const [feedback, setFeedback] = useState('');
  const [flushAnimation, setFlushAnimation] = useState(0);
  const serverProgress = getServerProgress(VOID_FLUSH_CONFIG.server.totalAp);
  const nextMarketReset = useMemo(() => {
    const next = new Date();
    next.setHours(VOID_FLUSH_CONFIG.marketRefreshHour, 0, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }, []);
  const flush = () => {
    if (ap > maxAp || flight) return;
    balanceRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    const source = sceneRef.current?.getBoundingClientRect();
    const target = balanceRef.current?.getBoundingClientRect();
    if (source && target) setFlight({ ap, resource, width: source.width, height: source.height, x: source.left + source.width / 2, y: source.top + source.height * .55, dx: target.left + target.width / 2 - source.left - source.width / 2, dy: target.top + target.height / 2 - source.top - source.height * .55 });
    setFlushAnimation((count) => count + 1);
    setDemo((current) => ({ ...current, [resource === 'tentacles' ? 'tentacles' : 'tPape']: current[resource === 'tentacles' ? 'tentacles' : 'tPape'] - cost, ap: current.ap + ap }));
    setRequestedAp(1);
    setFeedback(locale(language, `ДЕМО: +${format(ap)} AP.`, `ДЕМО: +${format(ap)} AP.`, `DEMO: +${format(ap)} AP.`));
  };
  const maxMilestoneAp = Math.max(...VOID_FLUSH_CONFIG.milestones.map((item) => item.ap));

  return <div className="space-y-3 pb-3">
    <div className="grid min-h-[44px] grid-cols-2 items-center rounded-none border-0 bg-transparent px-1 py-1 shadow-none">
      <div className="min-w-0 bg-transparent pr-3 text-center"><p className="font-mono text-[8px] font-bold uppercase text-[#9eb38d]">{locale(language, 'ТВОЇ AP', 'ТВОИ AP', 'YOUR AP')}</p><p ref={balanceRef} aria-live="polite" className="mt-0.5 font-mono text-[17px] font-black leading-tight text-[#a9df3d]">{format(demo.ap)} AP</p></div>
      <div className="min-w-0 border-l border-[#59724c] bg-transparent pl-3 text-center"><p className="font-mono text-[8px] font-bold uppercase text-[#9eb38d]">{locale(language, 'МІСЦЕ В ТОПІ', 'МЕСТО В ТОПЕ', 'TOP RANK')}</p><p className="mt-0.5 font-mono text-[17px] font-black leading-tight text-[#e2f1d6]">{demo.rank ? `#${demo.rank}` : '#—'}</p></div>
    </div>



    <MarkerFrame className="p-2" innerClassName="relative z-10"><div className="mb-1 flex items-center justify-between"><h2 className="font-mono text-[11px] font-black uppercase tracking-[.12em] text-[#dcff66]">VOID FLUSH</h2><span className="font-mono text-[7px] font-black uppercase text-[#90a784]">{locale(language, 'БЕЗОДНЯ ЖИВА', 'БЕЗДНА ЖИВА', 'THE VOID IS ALIVE')}</span></div><div ref={sceneRef}><VoidToiletScene language={language} flushAnimation={flushAnimation} /></div><div className="px-2.5 py-1.5"><div className="mb-1 flex items-center justify-between gap-2 font-mono text-[8px] font-black uppercase"><h2 className="text-[#e8f6d8]">{locale(language, 'ЗАГАЛЬНИЙ ПРОГРЕС СЕРВЕРА', 'ОБЩИЙ ПРОГРЕСС СЕРВЕРА', 'SERVER PROGRESS')}</h2><span className="shrink-0 text-[#b1c6a1] normal-case">{format(serverProgress.current)} / {format(serverProgress.required)} AP · {Math.floor(serverProgress.percent)}%</span></div><div className="relative"><ProgressBar percent={serverProgress.percent} className="!h-4" square /><span className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center font-mono text-[9px] font-black leading-none text-black [-webkit-text-stroke:0.35px_rgba(220,255,150,.65)]">LVL {serverProgress.level}</span></div></div>

    <VoidExchangePanel compact language={language} resource={resource} onResourceChange={(value) => { setResource(value); setFeedback(''); }} ap={ap} setAp={setRequestedAp} rate={rate} balance={balance} maxAp={maxAp} busy={Boolean(flight)} onFlush={flush} feedback={feedback} />
    </MarkerFrame>
    {flight && createPortal(<VoidFlushParticles flight={flight} />, document.body)}


    <MarkerFrame className="p-2.5" innerClassName="relative z-10"><SectionTitle icon={Gift}>{locale(language, 'ТВІЙ ПРОГРЕС', 'ТВОЙ ПРОГРЕСС', 'YOUR PROGRESS')}</SectionTitle><div className="relative mx-2 mt-1 h-[76px]"><div className="absolute inset-x-0 top-[35px]"><ProgressBar percent={(demo.ap / maxMilestoneAp) * 100} className="!h-2" /></div>{VOID_FLUSH_CONFIG.milestones.map((milestone) => { const claimed = claimedMilestones.includes(milestone.ap); const available = demo.ap >= milestone.ap && !claimed; const position = (milestone.ap / maxMilestoneAp) * 100; const edgeClass = position === 0 ? 'translate-x-0' : position === 100 ? '-translate-x-full' : '-translate-x-1/2'; return <div key={milestone.ap} className={`absolute top-0 flex -translate-x-1/2 flex-col items-center ${edgeClass}`} style={{ left: `${position}%` }}><button type="button" disabled={!available} onClick={() => available && setClaimedMilestones((items) => [...items, milestone.ap])} aria-label={`${milestone.ap} AP: ${milestone.reward[language] || milestone.reward.uk} · ${claimed ? locale(language, 'отримано', 'получено', 'claimed') : available ? locale(language, 'отримати', 'получить', 'claim') : locale(language, 'заблоковано', 'заблокировано', 'locked')}`} title={`${milestone.ap} AP · ${milestone.reward[language] || milestone.reward.uk}`} className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border ${claimed ? 'border-[#56674b] bg-[#101610] opacity-45' : available ? 'border-[#b9df39] bg-[#273c18] shadow-[0_0_8px_rgba(185,223,57,.45)]' : 'border-transparent bg-transparent opacity-75'}`}><img src={VOID_FLUSH_ICONS[milestone.icon]} alt="" className="h-8 w-8 object-contain" /></button><span className="mt-[13px] whitespace-nowrap font-mono text-[8px] font-black text-[#d8e8c9]">{format(milestone.ap)} AP</span></div>; })}</div><p className="mt-1 text-center font-mono text-[7px] text-[#75886a]">{locale(language, 'ДЕМО-КЛЕЙМ не видає предметів.', 'ДЕМО-КЛЕЙМ не выдаёт предметы.', 'Demo claims do not grant items.')}</p></MarkerFrame>

    <section><SectionTitle icon={Gift} aside={<Countdown target={nextMarketReset} language={language} />}>{locale(language, 'ЩОДЕННИЙ VOID МАРКЕТ', 'ЕЖЕДНЕВНЫЙ VOID МАРКЕТ', 'DAILY VOID MARKET')}</SectionTitle><div className="grid grid-cols-3 gap-1.5">{VOID_FLUSH_CONFIG.market.map((offer) => { const status = offer.status === 'locked' ? locale(language, 'ЗАБЛОКОВАНО', 'ЗАБЛОКИРОВАНО', 'LOCKED') : offer.status === 'sold-out' ? locale(language, 'РОЗПРОДАНО', 'РАСПРОДАНО', 'SOLD OUT') : locale(language, 'ДОСТУПНО', 'ДОСТУПНО', 'AVAILABLE'); return <div key={offer.id} className="flex min-w-0 flex-col rounded-[10px] border border-[#28ee90]/45 bg-[#091009] p-1.5"><img src={VOID_FLUSH_ICONS[offer.icon]} alt="" className="mx-auto h-10 w-10 object-contain" /><p className="mt-1 min-h-[28px] text-center font-mono text-[7px] font-black leading-tight text-[#e5f3d7]">{offer.name[language] || offer.name.uk}</p><p className="mt-1 text-center font-mono text-[8px] font-black text-[#d8ff5a]">{format(offer.price)} <img src={getResourceIcon('tentacles')} alt="" className="inline h-3 w-3 align-middle" /></p><p className="mt-1 text-center font-mono text-[6px] leading-tight text-[#94a888]">{locale(language, 'ЛІМІТ', 'ЛИМИТ', 'LIMIT')}: {offer.limit}</p><span className={`mt-1 rounded px-0.5 py-1 text-center font-mono text-[6px] font-black ${offer.status === 'available' ? 'bg-[#253414] text-[#d8ff5a]' : 'bg-[#20241e] text-[#889080]'}`}>{status}{offer.status === 'locked' ? ` · LVL ${offer.unlockLevel}` : ''}</span></div>; })}</div><p className="mt-1.5 text-center font-mono text-[7px] text-[#77896d]">{locale(language, 'Покупки у демо-режимі вимкнені.', 'Покупки в демо-режиме отключены.', 'Purchases are disabled in demo mode.')}</p></section>
  </div>;
}

function TopTab({ language, demo }) {
  const rows = VOID_FLUSH_CONFIG.leaderboard.map((row, index) => ({ ...row, rank: index + 1, value: row.ap, reward: getLeaderboardReward(index + 1)?.[language] || getLeaderboardReward(index + 1)?.uk || '—' }));
  const podium = rows.slice(0, 3);
  const currentRank = demo.rank || (demo.ap > 0 ? rows.filter((row) => row.ap >= demo.ap).length + 1 : null);
  const currentReward = currentRank ? getLeaderboardReward(currentRank)?.[language] || getLeaderboardReward(currentRank)?.uk : null;
  const apToNext = Math.max(0, (rows[rows.length - 1]?.ap || 0) - demo.ap + 1);
  return <div className="space-y-3 pb-3">
    <div className="grid grid-cols-3 gap-1.5"><StatCard label={locale(language, 'ТВОЄ МІСЦЕ', 'ТВОЁ МЕСТО', 'YOUR RANK')} value={currentRank ? `#${currentRank}` : '#—'} /><StatCard label={locale(language, 'ТВОЇ AP', 'ТВОИ AP', 'YOUR AP')} value={format(demo.ap)} accent="gold" /><StatCard label={locale(language, 'ДО НАСТУПНОГО', 'ДО СЛЕДУЮЩЕГО', 'AP TO NEXT')} value={currentRank ? format(apToNext) : '—'} /></div>
    <MarkerFrame className="trophy-ranking-background p-2" innerClassName="relative z-10"><SectionTitle icon={Trophy} aside={<span className="font-mono text-[8px] text-[#93a982]">{locale(language, 'ДЕМО-РЕЙТИНГ', 'ДЕМО-РЕЙТИНГ', 'MOCK RANKING')}</span>}>{locale(language, 'VOID FLUSH TOP', 'VOID FLUSH TOP', 'VOID FLUSH TOP')}</SectionTitle><LeaderboardPodium compact rows={podium} getRowValue={(row) => row.ap} /><div className="mb-2 grid grid-cols-3 gap-1">{podium.map((row) => <div key={row.id} className="min-w-0 rounded border border-[#d8b64a]/35 bg-[#17140b] px-1 py-1 text-center font-mono text-[6px] font-bold leading-tight text-[#efd98d]">#{row.rank} · {row.reward}</div>)}</div><p className="mb-1 font-mono text-[7px] font-black uppercase tracking-[.12em] text-[#a8bd91]">{locale(language, 'ЗАГАЛЬНИЙ СПИСОК', 'ОБЩИЙ СПИСОК', 'FULL RANKING')}</p><div className="space-y-1.5">{rows.map((row) => <LeaderboardRow key={row.id} rank={row.rank} compactRank mediaSrc={heroAvatar} title={row.title} subtitle={row.clan} titleClassName="text-[11px]" subtitleClassName="text-[7px]" className="gap-1.5 px-1.5 py-1.5" rightNodeClassName="" rightNode={<div className="flex h-7 w-16 items-center justify-center border border-[#28ee90] bg-[#10170d] px-1 font-mono text-[11px] font-black leading-none text-[#fff5ba]">{format(row.ap)}</div>} />)}</div><div className={`mt-2 border-t pt-2 ${currentRank ? 'border-[#e4bd37]/70 bg-[#201a0c] p-2' : 'border-[#28ee90]/45'}`}><div className="mb-1 font-mono text-[8px] font-black uppercase tracking-wide text-[#f1d66e]">{locale(language, 'ВАША ПОТОЧНА НАГОРОДА', 'ВАША ТЕКУЩАЯ НАГРАДА', 'YOUR CURRENT PRIZE')}</div><LeaderboardRow rank="YOU" showRankBadge={false} mediaSrc={null} title={locale(language, 'ТВОЯ ПОЗИЦІЯ', 'ТВОЯ ПОЗИЦИЯ', 'YOUR POSITION')} subtitle={currentRank ? `#${currentRank} · ${format(demo.ap)} AP · ${currentReward || '—'}` : '— · 0 AP'} rightNodeClassName="" rightNode={<div className="flex h-7 w-16 items-center justify-center border border-[#28ee90] bg-[#10170d] px-1 font-mono text-[11px] font-black leading-none text-[#fff5ba]">{format(demo.ap)}</div>} className={`gap-1.5 px-1.5 py-1.5 ${currentRank ? 'border-[#e4bd37] bg-[#241e0d]' : ''}`} /></div></MarkerFrame>
    <p className="text-center font-mono text-[8px] text-[#829476]">{locale(language, 'Цей рейтинг окремий і не змінює глобальний CA TOP.', 'Этот рейтинг отдельный и не меняет глобальный CA TOP.', 'This mock board is separate from the global CA TOP.')}</p>
  </div>;
}

function ConditionsTab({ language }) {
  const [openSection, setOpenSection] = useState(0);
  const sectionIcons = [Info, Trophy, BarChart3, ShoppingBag, Gift, ShieldCheck];
  const sections = [
    { title: locale(language, 'ЯК ЦЕ ПРАЦЮЄ', 'КАК ЭТО РАБОТАЕТ', 'HOW IT WORKS'), content: <><p>{locale(language, 'Змивай ресурси, отримуй AP і піднімайся в рейтингу. AP накопичуються та не витрачаються.', 'Смывай ресурсы, получай AP и поднимайся в рейтинге. AP накапливаются и не тратятся.', 'Flush resources, earn AP and climb the leaderboard. AP accumulate and are never spent.')}</p><div className="mt-2 grid grid-cols-2 gap-1.5"><div className="rounded border border-[#28ee90]/40 bg-black/25 p-2 text-center font-mono text-[9px] font-black text-[#d8ff5a]">{format(VOID_FLUSH_CONFIG.rates.tentaclesPerAp)} {locale(language, 'ЩУПАЛЕЦЬ', 'ЩУПАЛЕЦ', 'TENTACLES')} = 1 AP</div><div className="rounded border border-[#28ee90]/40 bg-black/25 p-2 text-center font-mono text-[9px] font-black text-[#d8ff5a]">1 T-PAPE = 1 AP</div></div><p className="mt-2 rounded bg-[#301a0d] px-2 py-1.5 font-bold text-[#ffd594]">{locale(language, 'Змиті ресурси не повертаються. У цьому демо списання вимкнене.', 'Смытые ресурсы не возвращаются. В этом демо списание отключено.', 'Flushed resources cannot be returned. Demo flushing does not spend anything.')}</p></> },
    { title: locale(language, 'ПРИЗИ ТУРНІРУ', 'ПРИЗЫ ТУРНИРА', 'TOURNAMENT PRIZES'), content: <TournamentPrizes language={language} /> },
    { title: locale(language, 'ЗАГАЛЬНИЙ ПРОГРЕС', 'ОБЩИЙ ПРОГРЕСС', 'SERVER PROGRESS'), content: <p>{locale(language, 'Кожен AP наповнює загальну шкалу сервера. Нові рівні відкривають можливості та пропозиції.', 'Каждый AP заполняет общую шкалу сервера. Новые уровни открывают возможности и предложения.', 'Every AP fills the server-wide bar. New levels unlock features and offers.')}</p> },
    { title: locale(language, 'ЩОДЕННИЙ МАРКЕТ', 'ЕЖЕДНЕВНЫЙ МАРКЕТ', 'DAILY MARKET'), content: <p>{locale(language, 'Щодня з’являються спеціальні товари за щупальця. Ліміт діє окремо для кожного гравця.', 'Каждый день появляются специальные товары за щупальца. Лимит действует для каждого игрока отдельно.', 'Special offers for tentacles refresh daily, with a per-player limit.')}</p> },
    { title: locale(language, 'ОСОБИСТІ БОНУСИ', 'ЛИЧНЫЕ БОНУСЫ', 'PERSONAL BONUSES'), content: <p>{locale(language, 'Досягай AP-порогів і забирай бонуси. AP залишаються в рейтингу.', 'Достигай порогов AP и забирай бонусы. AP остаются в рейтинге.', 'Reach AP milestones and claim bonuses. AP remain on your leaderboard score.')}</p> },
    { title: locale(language, 'ПРАВИЛА РЕЙТИНГУ', 'ПРАВИЛА РЕЙТИНГА', 'RANKING RULES'), content: <ul className="list-disc space-y-1 pl-4">{[locale(language, 'AP накопичуються до завершення івенту.', 'AP накапливаются до завершения ивента.', 'AP accumulate until the event ends.'), locale(language, 'Переможців визначають за фінальним рейтингом.', 'Победителей определяет итоговый рейтинг.', 'Final standings determine the winners.'), locale(language, 'За однакової кількості AP вище той, хто досягнув результату раніше.', 'При равном AP выше игрок, достигший результата раньше.', 'For a tie, the earlier score ranks higher.'), locale(language, 'Нагороди видаються після завершення турніру.', 'Награды выдаются после завершения турнира.', 'Prizes are distributed after the tournament.')].map((line) => <li key={line}>{line}</li>)}</ul> },
  ];
  return <div className="space-y-3 pb-3 font-sans text-[#eaf5d8]">
    <div className="rounded-lg bg-black/25 p-3">
      <div className="flex items-center gap-2"><Info className="h-9 w-9 shrink-0 text-[#b9ff68]" /><div className="min-w-0 flex-1"><h2 className="text-xs font-black uppercase text-[#dfffaa]">VOID FLUSH</h2><p className="mt-0.5 text-[10px] leading-snug text-[#c4d2b5]">{locale(language, 'Змий усе. Нагодуй безодню. Забери призи.', 'Смой всё. Накорми бездну. Забери призы.', 'Flush it all. Feed the void. Claim the prizes.')}</p></div></div>
      <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2 text-[10px] text-[#aab99a]"><Clock3 className="h-3.5 w-3.5 text-[#b9ff68]" /><Countdown target={VOID_FLUSH_CONFIG.event.endsAt} language={language} /></div>
    </div>
    <div className="flex items-center justify-between gap-2"><h3 className="text-[11px] font-black uppercase tracking-wide text-[#b9ff68]">{locale(language, 'Умови та підказки', 'Условия и подсказки', 'Rules and tips')}</h3><span className="text-[9px] text-[#aab99a]">{locale(language, 'Натисни для деталей', 'Нажми для деталей', 'Tap for details')}</span></div>
    <div className="space-y-1.5">{sections.map((section, index) => {
      const Icon = sectionIcons[index];
      const open = openSection === index;
      return <div key={index} className={`overflow-hidden rounded-lg border border-white/10 ${open ? 'bg-[#293b1d]' : 'bg-black/20'}`}>
        <button type="button" id={`void-condition-trigger-${index}`} aria-expanded={open} aria-controls={`void-condition-${index}`} onClick={() => setOpenSection(open ? null : index)} className="flex w-full items-center gap-2 px-2 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b9ff68]">
          <Icon className="h-7 w-7 shrink-0 text-[#b9ff68]" /><span className="min-w-0 flex-1 text-[10px] font-black uppercase text-[#eaf5d8]">{section.title}</span><ChevronDown className={`h-4 w-4 shrink-0 text-[#b9ff68] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div id={`void-condition-${index}`} role="region" aria-labelledby={`void-condition-trigger-${index}`} hidden={!open} className="mx-2 border-t border-white/10 px-1 py-2 text-[10px] leading-snug text-[#c4d2b5]">{section.content}</div>
      </div>;
    })}</div>
  </div>;
}

export default function VoidFlushScene({ profile, onClose }) {
  const language = profile?.language || 'uk';
  const [tab, setTab] = useState('flush');
  const [demo, setDemo] = useState(() => ({ ...VOID_FLUSH_CONFIG.demoPlayer }));
  useEffect(() => {
    setDemo((current) => current.testTentaclesGranted ? current : { ...current, tentacles: current.tentacles + 2000000, testTentaclesGranted: true });
  }, []);
  const [claimedMilestones, setClaimedMilestones] = useState([]);
  const tabs = useMemo(() => [
    { id: 'flush', label: locale(language, 'ЗМИВ', 'СМЫВ', 'FLUSH') },
    { id: 'top', label: locale(language, 'ТОП', 'ТОП', 'TOP') },
    { id: 'conditions', label: locale(language, 'УМОВИ', 'УСЛОВИЯ', 'RULES') },
  ], [language]);

  return <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#030504] px-2 pt-2" style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)', paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}>
    <header className="relative mb-2 h-[92px] shrink-0 overflow-hidden bg-[#080c08] sm:h-[112px]">
      <img src={voidFlushBanner} alt="VOID FLUSH" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/50" />
      <button type="button" onClick={onClose} className="absolute left-2 top-2 z-10 flex h-8 items-center gap-1 rounded border border-[#28ee90]/80 bg-[#07100ddd] px-2 font-mono text-[8px] font-black uppercase text-[#d8ff5a] shadow-lg"><ArrowLeft className="h-3.5 w-3.5" />{locale(language, 'НАЗАД', 'НАЗАД', 'BACK')}</button>
      <span className="absolute bottom-1.5 left-2 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[6px] font-black tracking-[.14em] text-[#a5ef70]">AIRDROPS</span>
      <div className="absolute bottom-1.5 right-2 rounded bg-black/70 px-1.5 py-1 text-right shadow"><p className="font-mono text-[5px] font-black uppercase text-[#9ab18c]">{locale(language, 'ДО ФІНІШУ', 'ДО ФИНИША', 'ENDS IN')}</p><Countdown target={VOID_FLUSH_CONFIG.event.endsAt} language={language} /></div>
    </header>
    <nav aria-label={locale(language, 'Розділи Void Flush', 'Разделы Void Flush', 'Void Flush sections')} className="mb-2 flex h-9 shrink-0 items-end gap-[3px] border-b-2 border-[#28ee90]/80">{tabs.map((item) => {
      const tabColor = item.id === 'flush' ? 'green' : item.id === 'top' ? 'yellow' : 'blue';
      const activeStyle = tabColor === 'green'
        ? 'border-[#d8ff5a] bg-[linear-gradient(180deg,#b8df3c_0%,#8cac21_100%)] text-[#17220e] shadow-[inset_0_1px_0_rgba(255,255,190,.45),0_-2px_7px_rgba(216,255,90,.18)]'
        : tabColor === 'yellow'
          ? 'border-[#ffd84a] bg-[linear-gradient(180deg,#f2ca49_0%,#c9941f_100%)] text-[#251d08] shadow-[inset_0_1px_0_rgba(255,255,190,.45),0_-2px_7px_rgba(255,205,54,.18)]'
          : 'border-[#53d9f4] bg-[linear-gradient(180deg,#50b9d5_0%,#176a86_100%)] text-[#061820] shadow-[inset_0_1px_0_rgba(200,250,255,.45),0_-2px_7px_rgba(83,217,244,.18)]';
      const idleStyle = tabColor === 'green' ? 'border-[#4d792f] text-[#a8d875]' : tabColor === 'yellow' ? 'border-[#8c7127] text-[#e6c45d]' : 'border-[#367b8c] text-[#75cee0]';
      return <button key={item.id} type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)} className={`relative -mb-[2px] flex h-8 min-w-0 flex-1 items-center justify-center rounded-t-[9px] border border-b-0 bg-[#11170f] px-1 font-mono text-[8px] font-black tracking-[.06em] transition ${tab === item.id ? `z-[1] ${activeStyle}` : `${idleStyle} hover:brightness-125`}`}>{item.label}</button>;
    })}</nav>
    <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pb-2 [scrollbar-width:thin] [scrollbar-color:#49653b_transparent]" key={tab}>{tab === 'flush' ? <FlushTab language={language} demo={demo} setDemo={setDemo} claimedMilestones={claimedMilestones} setClaimedMilestones={setClaimedMilestones} /> : tab === 'top' ? <TopTab language={language} demo={demo} /> : <ConditionsTab language={language} />}</main>
  </div>;
}
