import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DEFAULT_EQUIPMENT_ITEMS } from './equipmentData';
import { getRaidRankReward, RAID_RANK_TIERS, RAID_CROWN_IDS, RAID_PET_ID } from '@/lib/raidRankRewards.js';
import goldBox from '@/assets/box/yellow-box.png';
import silverBox from '@/assets/box/blue-box.png';
import bronzeBox from '@/assets/box/green-box.png';
import grayBox from '@/assets/box/gray-box.png';
import smallPoison from '@/assets/skills/small-poison.png';
import mediumPoison from '@/assets/skills/medium-poison.png';
import largePoison from '@/assets/skills/large-poison.png';
import { getResourceIcon } from '@/lib/resourceIcons';

const item = id => DEFAULT_EQUIPMENT_ITEMS.find(entry => entry.id === id);
const boxIcon = rank => rank === 1 ? goldBox : rank === 2 ? silverBox : rank === 3 ? bronzeBox : grayBox;
const text = (language, uk, ru, en) => language === 'en' ? en : language === 'ru' ? ru : uk;
const resourceNames = language => [
  text(language, 'Малий яд', 'Малый яд', 'Small poison'),
  text(language, 'Середній яд', 'Средний яд', 'Medium poison'),
  text(language, 'Великий яд', 'Большой яд', 'Large poison'),
  text(language, 'Спіни', 'Спины', 'Spins'),
  text(language, 'Енергія', 'Энергия', 'Energy'),
];
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const DialogHeader = ({ children }) => <div className="space-y-2 pr-5">{children}</div>;
function DialogContent({ children, className = '' }) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-[120] bg-black/75" /><DialogPrimitive.Content className={`fixed left-1/2 top-1/2 z-[121] grid w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 gap-4 border p-4 shadow-xl ${className}`}><DialogPrimitive.Close aria-label="Close" className="absolute right-3 top-2 text-xl text-[#d8f67a]">×</DialogPrimitive.Close>{children}</DialogPrimitive.Content></DialogPrimitive.Portal>;
}

export function RaidRankPrize({ rank, language }) {
  const reward = getRaidRankReward(rank);
  if (!reward) return null;
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="flex shrink-0 items-center gap-0.5 rounded-none hover:brightness-125 focus-visible:outline focus-visible:outline-[#28ee90]" aria-label={`${text(language, 'Нагорода', 'Награда', 'Reward')} #${rank}`}>
        {reward.crownId && <><img src={item(reward.crownId)?.icon} alt={text(language, 'Корона', 'Корона', 'Crown')} className="h-9 w-9 object-contain" /><img src={item(reward.petId)?.icon} alt={text(language, 'Пет', 'Пет', 'Pet')} className="h-9 w-9 object-contain" /></>}
        <img src={boxIcon(rank)} alt={text(language, 'Бокс', 'Бокс', 'Box')} className="h-9 w-9 object-contain" />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-[360px] border-[#28ee90] bg-[#10170d] text-[#eff7d1]">
      <DialogHeader><DialogTitle>{text(language, 'Нагорода за місце', 'Награда за место', 'Rank reward')} #{rank}</DialogTitle><DialogDescription>{text(language, 'Після завершення рейду. Вміст бокса гарантований.', 'После завершения рейда. Содержимое бокса гарантировано.', 'After the raid ends. Box contents are guaranteed.')}</DialogDescription></DialogHeader>
      {reward.crownId && <div className="flex justify-center gap-6">{[reward.crownId, reward.petId].map(id => <div key={id} className="text-center"><img src={item(id)?.icon} alt={item(id)?.name} className="mx-auto h-24 w-24 object-contain" /><span className="text-xs">{item(id)?.names?.[language === 'uk' ? 'ua' : language] || item(id)?.name}</span></div>)}</div>}
      <div className="space-y-2">{[[smallPoison, reward.small], [mediumPoison, reward.medium], [largePoison, reward.large], [getResourceIcon('spin'), reward.spins], [getResourceIcon('energy'), reward.energy]].map(([src, amount], i) => <div key={i} className="flex items-center gap-3 rounded bg-black/30 px-3 py-1"><img src={src} alt="" className="h-9 w-9 shrink-0 object-contain" /><span className="min-w-0 flex-1 text-sm font-bold">{resourceNames(language)[i]}</span><strong className="shrink-0">×{amount}</strong></div>)}</div>
    </DialogContent>
  </Dialog>;
}

export function RaidRankRewardsGuide({ language }) {
  return <Dialog><DialogTrigger asChild><button type="button" className="mt-2 w-full rounded-lg border border-[#d4ac45] bg-[#2a220d] py-2 text-xs font-black text-[#ffe196]">{text(language, 'Нагороди топ-100', 'Награды топ-100', 'Top 100 rewards')}</button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] max-w-[440px] overflow-y-auto border-[#28ee90] bg-[#10170d] text-[#eff7d1]">
      <DialogHeader><DialogTitle>{text(language, 'Нагороди рейду', 'Награды рейда', 'Raid rewards')}</DialogTitle><DialogDescription>{text(language, 'Топ-3: корона за місце + пет + бокс. Місця 4–100: бокс. Видача після завершення рейду.', 'Топ-3: корона за место + пет + бокс. Места 4–100: бокс. Выдача после завершения рейда.', 'Top 3: rank crown + pet + box. Ranks 4–100: box. Awarded after the raid ends.')}</DialogDescription></DialogHeader>
      <div className="flex justify-center gap-3">{[...RAID_CROWN_IDS, RAID_PET_ID].map((id, i) => <div key={id} className="text-center text-xs"><img src={item(id)?.icon} alt={item(id)?.name} className="h-16 w-16 object-contain" />{i < 3 ? `#${i + 1}` : 'TOP 3'}</div>)}</div>
      <table className="w-full text-center text-[11px]"><thead><tr><th>#</th>{[smallPoison, mediumPoison, largePoison, getResourceIcon('spin'), getResourceIcon('energy')].map((src, i) => <th key={i}><img src={src} alt={['Small poison','Medium poison','Large poison','Spins','Energy'][i]} className="mx-auto h-8 w-8 object-contain" /></th>)}</tr></thead><tbody>{RAID_RANK_TIERS.map(tier => <tr key={tier.from} className="border-t border-[#28ee90]/20"><td className="py-2">{tier.from === tier.to ? tier.from : `${tier.from}–${tier.to}`}</td>{[tier.small, tier.medium, tier.large, tier.spins, tier.energy].map((amount, i) => <td key={i}>{amount}</td>)}</tr>)}</tbody></table>
    </DialogContent>
  </Dialog>;
}
