import goldBox from '@/assets/box/yellow-box.png';
import silverBox from '@/assets/box/blue-box.png';
import bronzeBox from '@/assets/box/green-box.png';
import grayBox from '@/assets/box/gray-box.png';
import ProfileHeaderSkinPreview from './ProfileHeaderSkinPreview';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import cardPlayIcon from '@/assets/card-game/extra-play.webp';
import smallPoison from '@/assets/skills/small-poison.png';
import mediumPoison from '@/assets/skills/medium-poison.png';
import largePoison from '@/assets/skills/large-poison.png';
import { getResourceIcon } from '@/lib/resourceIcons';
const gumIcon = '/local-enhancement/gums.webp';
import { getFriday13PlayerReward, getFriday13GuildShipReward, FRIDAY13_FRAME_IDS } from '@/lib/friday13Event.js';


const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const label = (language, uk, ru, en) => language === 'en' ? en : language === 'ru' ? ru : uk;
const fmt = value => Number(value || 0).toLocaleString();

function DialogContent({ children, className = '' }) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-[120] bg-black/75" /><DialogPrimitive.Content className={`fixed left-1/2 top-1/2 z-[121] grid max-h-[88dvh] w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 gap-3 overflow-y-auto border p-4 shadow-xl ${className}`}><DialogPrimitive.Close aria-label="Close" className="absolute right-3 top-2 text-xl text-[#d8f67a]">×</DialogPrimitive.Close>{children}</DialogPrimitive.Content></DialogPrimitive.Portal>;
}

function FramePreview({ frameId, size = 'h-20 w-20' }) {
  return <div className={`relative mx-auto ${size.includes('h-9') ? 'h-8 w-20' : 'h-16 w-full'}`}><ProfileHeaderSkinPreview bossId={frameId}/></div>;
}

function PrizeButton({ rank, title }) {
  const icon = rank===1?goldBox:rank===2?silverBox:rank===3?bronzeBox:grayBox;
  return <DialogTrigger asChild><button type="button" aria-label={title} title={title} className="flex h-11 w-11 shrink-0 items-center justify-center hover:brightness-125 focus-visible:outline focus-visible:outline-[#28ee90]"><img src={icon} alt="" className="h-10 w-10 object-contain"/></button></DialogTrigger>;
}

export function PersonalRewardContent({ rank, language, reward, received = false }) {
  const frameId = rank <= 3 ? FRIDAY13_FRAME_IDS[rank - 1] : null;
  const rows = [[smallPoison,fmt(reward.smallPoison),label(language,'Мала отрута','Малый яд','Small poison')],[mediumPoison,fmt(reward.mediumPoison),label(language,'Середня отрута','Средний яд','Medium poison')],[largePoison,fmt(reward.largePoison),label(language,'Велика отрута','Большой яд','Large poison')],[gumIcon,fmt(reward.gums.normal),label(language,'Звичайна жуйка','Обычная жвачка','Regular gum')],[gumIcon,fmt(reward.gums.improved),label(language,'Покращена жуйка','Улучшенная жвачка','Improved gum')],[gumIcon,fmt(reward.gums.premium),label(language,'Преміум жуйка','Премиум жвачка','Premium gum')],[getResourceIcon('spin'),fmt(reward.spins),label(language,'Спіни','Спины','Spins')],[cardPlayIcon,fmt(reward.cardPlays),label(language,'Карткова гра','Карточная игра','Card game')]];
  return <>
    <div className="text-center"><DialogTitle className="font-black">{label(language, 'Нагорода гравця', 'Награда игрока', 'Player reward')} #{rank}</DialogTitle><DialogDescription>{received ? label(language, 'Уже зараховано. Перегляд без повторного отримання.', 'Уже начислено. Просмотр без повторного получения.', 'Already credited. Viewing does not grant rewards again.') : label(language, 'Після завершення рейду', 'После завершения рейда', 'Awarded after the raid ends')}</DialogDescription></div>
    {frameId && <div className="space-y-2 py-2 text-center"><FramePreview frameId={frameId} size="h-28 w-28" /><b className="mt-2 block font-mono text-sm text-[#f9df83]">{label(language, `РАМКА ПЕРЕМОЖЦЯ · #${rank}`, `РАМКА ПОБЕДИТЕЛЯ · #${rank}`, `CHAMPION FRAME · #${rank}`)}</b></div>}
    <div className="space-y-1.5">{rows.map(([icon, amount, name], index) => <div key={name} className="flex items-center gap-2 rounded bg-black/35 px-2 py-1.5"><span className="grid h-8 w-8 shrink-0 place-items-center">{icon === gumIcon ? <span className="block h-8 w-8" style={{backgroundImage:`url(${gumIcon})`,backgroundSize:'300% 100%',backgroundRepeat:'no-repeat',backgroundPosition:`${(index-3)*50}% center`}}/> : icon ? <img src={icon} alt="" className="h-8 w-8 object-contain" /> : <b className="text-[#d8f67a]">{index === 2 ? '🎰' : '🃏'}</b>}</span><span className="min-w-0 flex-1 text-xs font-bold">{name}</span><strong className="text-xs">×{amount}</strong></div>)}</div>
  </>;
}

export function RaidRankPrize({ rank, language }) {
  if (!Number.isInteger(rank) || rank < 1 || rank > 100) return null;
  const reward = getFriday13PlayerReward(rank);
  const frameId = rank <= 3 ? FRIDAY13_FRAME_IDS[rank - 1] : null;
  return <Dialog><PrizeButton frameId={frameId} rank={rank} language={language} title={`${label(language, 'Нагорода гравця', 'Награда игрока', 'Player reward')} #${rank}`} /><DialogContent className="max-w-[360px] border-[#28ee90] bg-[#10170d] text-[#eff7d1]"><PersonalRewardContent rank={rank} language={language} reward={reward} /></DialogContent></Dialog>;
}

export function RaidGuildRankPrize({ rank, language }) {
  const frameId = rank <= 3 ? FRIDAY13_FRAME_IDS[rank + 2] : null;
  const amount = getFriday13GuildShipReward(rank);
  return <Dialog><PrizeButton frameId={frameId} rank={rank} language={language} title={`${label(language, 'Нагорода гільдії', 'Награда гильдии', 'Guild reward')} #${rank}`} /><DialogContent className="max-w-[340px] border-[#28ee90] bg-[#10170d] text-[#eff7d1]">
    <div className="text-center"><DialogTitle className="font-black">{label(language, 'Нагорода гільдії', 'Награда гильдии', 'Guild reward')} #{rank}</DialogTitle><DialogDescription>{label(language, 'Після завершення рейду', 'После завершения рейда', 'Awarded after the raid ends')}</DialogDescription></div>
    {frameId && <div className="space-y-2 py-2 text-center"><FramePreview frameId={frameId} size="h-28 w-28" /><b className="mt-2 block font-mono text-sm text-[#f9df83]">{label(language, `РАМКА ГІЛЬДІЇ · #${rank}`, `РАМКА ГИЛЬДИИ · #${rank}`, `GUILD FRAME · #${rank}`)}</b></div>}
    <div className="flex items-center gap-3 rounded bg-black/35 p-3"><img src={getResourceIcon('tentacles')} alt="" className="h-12 w-12 shrink-0 object-contain"/><div className="min-w-0"><strong className="block text-xl text-[#d8ff86]">{fmt(amount)}</strong><span className="font-mono text-[11px] text-[#eff7d1]">{label(language, 'щупалець у банк корабля', 'щупалец в банк корабля', 'tentacles to clan ship bank')}</span></div></div>
  </DialogContent></Dialog>;
}

export function RaidRankRewardsGuide({ language }) {
  const title = label(language, 'Нагороди рейду', 'Награды рейда', 'Raid rewards');
  return <Dialog><DialogTrigger asChild><button type="button" className="mt-2 w-full rounded-lg border border-[#d4ac45] bg-[#2a220d] py-2 text-xs font-black text-[#ffe196]">{label(language, 'Нагороди топ-100', 'Награды топ-100', 'Top 100 rewards')}</button></DialogTrigger>
    <DialogContent className="max-w-[440px] border-[#28ee90] bg-[#10170d] text-[#eff7d1]"><div className="text-center"><DialogTitle className="font-black">{title}</DialogTitle><DialogDescription>{label(language, 'Особисті призи та окремий рейтинг гільдій', 'Личные призы и отдельный рейтинг гильдий', 'Personal prizes and separate guild ranking')}</DialogDescription></div>
      <h3 className="font-mono text-xs font-black text-[#f9df83]">{label(language, 'РАМКИ ГРАВЦІВ · ТОП-3', 'РАМКИ ИГРОКОВ · ТОП-3', 'PLAYER FRAMES · TOP 3')}</h3><div className="grid grid-cols-3 gap-1">{[1,2,3].map(rank=><div key={rank} className="rounded border border-white/10 bg-black/20 p-2 text-center"><FramePreview frameId={FRIDAY13_FRAME_IDS[rank-1]} size="h-16 w-16"/><b className="mt-1 block text-[10px]">#{rank}</b></div>)}</div>
      <h3 className="font-mono text-xs font-black text-[#f9df83]">{label(language, 'РАМКИ ГІЛЬДІЙ · ТОП-3', 'РАМКИ ГИЛЬДИЙ · ТОП-3', 'GUILD FRAMES · TOP 3')}</h3><div className="grid grid-cols-3 gap-1">{[1,2,3].map(rank=><div key={rank} className="rounded border border-white/10 bg-black/20 p-2 text-center"><FramePreview frameId={FRIDAY13_FRAME_IDS[rank+2]} size="h-16 w-16"/><b className="mt-1 block text-[10px]">#{rank} · {fmt(getFriday13GuildShipReward(rank))}</b></div>)}</div>
      <p className="rounded border border-[#28ee90]/40 bg-black/30 p-2 text-xs">{label(language, 'Гравці отримують отрути, жуйки, спіни та ігри в карткову гру. Кожна гільдія отримує щупальця в банк корабля: топ-1 — 100 млн, топ-2 — 75 млн, топ-3 — 50 млн, інші — 10 млн.', 'Игроки получают яд, жвачки, спины и игры в карточную игру. Каждая гильдия получает щупальца в банк корабля: топ-1 — 100 млн, топ-2 — 75 млн, топ-3 — 50 млн, остальные — 10 млн.', 'Players get poison, gums, spins and card plays. Every guild receives ship bank tentacles: #1 100M, #2 75M, #3 50M, all others 10M.')}</p>
    </DialogContent>
  </Dialog>;
}
