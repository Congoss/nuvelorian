import { getFriday13BossName } from '@/lib/raidBossConfig';
import './bossProfileFrame.css';
import { warmFirstFrameImages } from '@/lib/sceneAssets';
import FirstFrameImage from './FirstFrameImage';
import eventsBannerFull from '@/assets/IVENTS/event-banner.png';
import { usePartnerTasks } from '@/lib/usePartnerTasks';
import pumpkinIcon from '@/assets/ui/halloween-pumpkin.webp';
import EventPoisonShop from './EventPoisonShop';
import { Fragment } from 'react';
import { translateUiText } from '@/lib/uiTextTranslations';
import { eventPhase, eventCountdown } from '@/lib/eventSchedule.js';
import FishingBeacon from './FishingBeacon';
import { serverNow } from '@/lib/serverClock.js';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Lock, ShieldCheck, X } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import { getTelegramSession } from '@/lib/platform/telegram';
import tentaclesRewardIcon from '@/assets/optimized/cosmohand.webp';
import rewardStarIcon from '@/assets/optimized/paper.webp';
import poisonIcon from '@/assets/skills/small-poison.png';
import cosmoFishBg from '@/assets/optimized/video/cosmofish.mp4';
import fishCommon from '@/assets/IVENTS/COSMOFISH/cosmofish_common.png';
import fishTrash from '@/assets/IVENTS/COSMOFISH/cosmofish_trash.png';
import fishUncommon from '@/assets/IVENTS/COSMOFISH/cosmofish_uncommon.png';
import fishRare from '@/assets/IVENTS/COSMOFISH/cosmofish_rare.png';
import fishEpic from '@/assets/IVENTS/COSMOFISH/cosmofish_epic.png';
import fishMythic from '@/assets/IVENTS/COSMOFISH/cosmofish_mythic.png';
import fishLegendary from '@/assets/IVENTS/COSMOFISH/cosmofish_legendary.png';
import fishBlackHole from '@/assets/IVENTS/COSMOFISH/cosmofish_black_hole.png';
import fishExchangeIcon from '@/assets/IVENTS/COSMOFISH/Fish Exchange.png';
import eventSpaceFishingImg from '@/assets/IVENTS/event-space-fishing.png';
import eventSpaceFishingCard from '@/assets/optimized/first-frame/event-space-fishing.webp?inline';
import eventsBannerImg from '@/assets/optimized/first-frame/events-banner.webp?inline';
import dailyEventBannerImg from '@/assets/IVENTS/daily-event-banner.png';
import newbieQuestBannerImg from '@/assets/IVENTS/newbie-quest-banner.png';
import extraQuestsBannerImg from '@/assets/IVENTS/Extra-Quests-banner.png';
import mediumPoisonIcon from '@/assets/skills/medium-poison.png';
import largePoisonIcon from '@/assets/skills/large-poison.png';
import spinx1Ui from '@/assets/ui/spinx1.png';
import dailyToxicPackBox from '@/assets/box/Daily Toxic Pack.png';
import MarkerFrame, { MarkerBorder } from './MarkerFrame';
import RewardPopup from './RewardPopup';
import { SURVIVAL_PACK, getNewbieProgress } from '@/lib/newbieQuest';
import { getResourceIcon } from '@/lib/resourceIcons';
const BossPanel = lazy(() => import('./BossPanel'));
import ScrambleLockHint from './ScrambleLockHint';
import checkInIcon from '@/assets/daily-icons/Check-In.png';
import energyIcon from '@/assets/daily-icons/Energy.png';
import missionIcon from '@/assets/daily-icons/Mission.png';
import artifactIcon from '@/assets/daily-icons/Artifact.png';
import dailyBossIcon from '@/assets/daily-icons/Boss.png';
import fingerAttackIcon from '@/assets/daily-icons/Finger Attack.png';
import pencilAttackIcon from '@/assets/daily-icons/Pencil Attack.png';
import dailyPoisonIcon from '@/assets/daily-icons/Poison.png';
import standardBossBoxIcon from '@/assets/daily-icons/Standard Boss Box.png';
import damageChestIcon from '@/assets/daily-icons/Damage Chest.png';
import openBoxIcon from '@/assets/daily-icons/Open Box.png';
import setFragmentIcon from '@/assets/daily-icons/Set Fragment.png';
import raidBossIcon from '@/assets/daily-icons/Raid Boss.png';
import rouletteSpinIcon from '@/assets/daily-icons/Roulette Spin.png';
import starterPackIcon from '@/assets/daily-icons/Starter Pack.png';
import heroIcon from '@/assets/daily-icons/Hero.png';
import talentPointIcon from '@/assets/daily-icons/Talent Point.png';
import talentUpgradeIcon from '@/assets/daily-icons/Talent Upgrade.png';
import tutorialCompleteIcon from '@/assets/daily-icons/Tutorial Complete.png';

import { DAY_COUNT, DAILY_UNLOCK_LEVEL, WEEKLY_BONUSES, getDailyCompletionReward, getDayTasks as getDailyTasks, getTaskState, getQuestRewardNotifications } from '@/lib/questNotifications';
const EVENT_PLACEHOLDERS = [
  {
    id: 'raid-boss',
    requiredLevel: 18,
    guildOnly: true,
    title: { uk: 'Рейдбос', en: 'Raid Boss', ru: 'Рейдбосс' },
    subtitle: { uk: 'Скоро старт', en: 'Starting soon', ru: 'Скоро старт' },
    image: '/friday13/raid-boss-event-avatar.webp',
    rewardPreview: [
      { type: 'strength', qty: '+CA' },
      { type: 'xp', qty: '+EXP' },
      { type: 'poison', qty: '+3 Малий яд', qtyI18n: { en: '+3 Small Poison', ru: '+3 Малый яд' } },
    ],
  },
  {
    id: 'space-fishing',
    requiredLevel: 10,
    title: { uk: 'Косморибалка', en: 'Space Fishing', ru: 'Косморыбалка' },
    subtitle: { uk: 'Скоро старт', en: 'Starting soon', ru: 'Скоро старт' },
    image: eventSpaceFishingCard, fullImage: eventSpaceFishingImg,
    rewardPreview: [
      { type: 'strength', qty: '+CA' },
      { type: 'xp', qty: '+EXP' },
      { type: 'poison', qty: '+2 Малий яд', qtyI18n: { en: '+2 Small Poison', ru: '+2 Малый яд' } },
    ],
  },
];
const COSMO_FISH_ASSETS = {
  trash: fishTrash,
  common: fishCommon,
  uncommon: fishUncommon,
  rare: fishRare,
  epic: fishEpic,
  mythic: fishMythic,
  legendary: fishLegendary,
  black_hole: fishBlackHole,
};
const COSMO_FISH_ORDER = ['trash', 'common', 'uncommon', 'rare', 'epic', 'mythic', 'legendary', 'black_hole'];
const COSMO_FISH_RARITY_COLORS = {
  trash: '#6E746C',
  common: '#D8D8C8',
  uncommon: '#8CB138',
  rare: '#26B6D4',
  epic: '#8B4DFF',
  mythic: '#E84BCB',
  legendary: '#F2B632',
  black_hole: '#15101F',
};
const COSMO_BLACK_HOLE_STYLE = {
  base: '#050505',
  glow: '#FFFFFF',
  accent: '#D8F3FF',
};
const COMBO_REWARD_COLOR_TOKENS = {
  Trash: 'trash',
  Common: 'common',
  Uncommon: 'uncommon',
  Rare: 'rare',
  Epic: 'epic',
  Mythic: 'mythic',
  Legendary: 'legendary',
  'Black Hole': 'black_hole',
};

function buildClaimRewardItems(reward = {}) {
  const entries = [
    ['xp', 'XP', 'XP'],
    ['energy', 'Energy', 'Energy'],
    ['tentacles', 'tentacles', 'tentacles'],
    ['premium', 'Stars', 'Stars'],
    ['freeSpins', 'Bonus spin', 'Spin'],
  ];
  const items = entries.filter(([key]) => Number(reward[key] || 0) > 0).map(([key, label, suffix]) => ({
    id: key,
    icon: getResourceIcon(key === 'freeSpins' ? 'spin' : key),
    label,
    text: `+${Number(reward[key])} ${suffix}`,
  }));
  if (Number(reward.pumpkins || 0) > 0) items.push({ id: 'pumpkins', icon: pumpkinIcon, label: '🎃', text: '+' + reward.pumpkins });
  [['small', 'Small poison', poisonIcon], ['medium', 'Medium poison', mediumPoisonIcon], ['large', 'Poison flask', largePoisonIcon]].forEach(([key, label, icon]) => {
    if (Number(reward[key] || 0) > 0) items.push({ id: key, icon, label, text: `+${Number(reward[key])}` });
  });
  return items;
}
const COSMO_RARITY_NAME = {
  ua: { trash: 'Мотлох', common: 'Звичайна', uncommon: 'Незвичайна', rare: 'Рідкісна', epic: 'Епічна', mythic: 'Міфічна', legendary: 'Легендарна', black_hole: 'Чорнодірна' },
  en: { trash: 'Trash', common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', mythic: 'Mythic', legendary: 'Legendary', black_hole: 'Black Hole' },
  ru: { trash: 'Мусор', common: 'Обычная', uncommon: 'Необычная', rare: 'Редкая', epic: 'Эпическая', mythic: 'Мифическая', legendary: 'Легендарная', black_hole: 'Чернодырная' },
};
const COSMO_COMBO_ORDER = [
  { key: 'combo_2', fishes: ['common', 'uncommon'] },
  { key: 'combo_3', fishes: ['common', 'uncommon', 'rare'] },
  { key: 'combo_4', fishes: ['common', 'uncommon', 'rare', 'epic'] },
  { key: 'combo_5', fishes: ['common', 'uncommon', 'rare', 'epic', 'mythic'] },
  { key: 'combo_6', fishes: ['common', 'uncommon', 'rare', 'epic', 'mythic', 'legendary'] },
  { key: 'combo_7', fishes: ['common', 'uncommon', 'rare', 'epic', 'mythic', 'legendary', 'black_hole'] },
];
const COSMO_FISHING_UI = {
  ua: { title: 'Космо-рибалка', cast: 'Закинути', waiting: 'Очікування', hook: 'Підсікти!', pullOut: 'Дістати', reward: 'Нагорода', caught: 'Спіймано', noFish: 'Риба втекла, але щось зачепилось', nextCast: 'Наступний закид', bonus: 'Бонус' },
  en: { title: 'Cosmo Fishing', cast: 'Cast', waiting: 'Waiting', hook: 'Hook!', pullOut: 'Pull Out', reward: 'Reward', caught: 'Caught', noFish: 'The fish escaped, but something got hooked', nextCast: 'Next cast', bonus: 'Bonus' },
  ru: { title: 'Космо-рыбалка', cast: 'Закинуть', waiting: 'Ожидание', hook: 'Подсечь!', pullOut: 'Достать', reward: 'Награда', caught: 'Поймано', noFish: 'Рыба сбежала, но что-то зацепилось', nextCast: 'Следующий заброс', bonus: 'Бонус' },
};
const FISH_EXCHANGE_TEXT = {
  ua: {
    title: 'Обмін риби',
    description: 'Здавай рибу одразу за меншу нагороду або збирай комбо для кращого луту.',
    singleExchangeTitle: 'Одиночний обмін',
    comboExchangeTitle: 'Комбо-обмін',
    trashNote: 'Мотлох не входить у комбо. Його можна здати тільки окремо.',
    notEnoughFish: 'Не вистачає риби',
    exchange: 'Здати',
    exchangeOne: 'Здати 1',
    reward: 'Нагорода',
    singleRewards: {
      trash: 'Мотлох x1 > EXP +10',
      common: 'Звичайна x1 > EXP +25',
      uncommon: 'Незвичайна x1 > Енергія +20',
      rare: 'Рідкісна x1 > Мала отрута x3',
      epic: 'Епічна x1 > Середня отрута x2',
      mythic: 'Міфічна x1 > Фляга з отрутою x1',
      legendary: 'Легендарна x1 > Фляга з отрутою x3',
      black_hole: 'Чорнодірна x1 > Мала отрута x8, Середня отрута x4, Фляга з отрутою x2',
    },
    comboRewards: {
      combo_2: 'Звичайна + Незвичайна > EXP +50, Енергія +25',
      combo_3: 'Звичайна + Незвичайна + Рідкісна > Мала отрута x2, EXP +100',
      combo_4: 'Звичайна + Незвичайна + Рідкісна + Епічна > Середня отрута x2, Енергія +25, EXP +150',
      combo_5: 'Звичайна + Незвичайна + Рідкісна + Епічна + Міфічна > Фляга з отрутою x1, Середня отрута x2, EXP +250',
      combo_6: 'Звичайна + Незвичайна + Рідкісна + Епічна + Міфічна + Легендарна > EXP +500, Енергія +100, Мала отрута x6, Середня отрута x4, Фляга з отрутою x2',
      combo_7: 'Звичайна + Незвичайна + Рідкісна + Епічна + Міфічна + Легендарна + Чорнодірна > EXP +1000, Енергія +250, Спіни x20, Фляга з отрутою x10',
    },
  },
  en: {
    title: 'Fish Exchange',
    description: 'Exchange fish right away for a smaller reward or save them for combos with better loot.',
    singleExchangeTitle: 'Single Exchange',
    comboExchangeTitle: 'Combo Exchange',
    trashNote: 'Trash is not used in combos. It can only be exchanged separately.',
    notEnoughFish: 'Not enough fish',
    exchange: 'Exchange',
    exchangeOne: 'Exchange 1',
    reward: 'Reward',
    singleRewards: {
      trash: 'Trash x1 > EXP +10',
      common: 'Common x1 > EXP +25',
      uncommon: 'Uncommon x1 > Energy +20',
      rare: 'Rare x1 > Small Poison x3',
      epic: 'Epic x1 > Medium Poison x2',
      mythic: 'Mythic x1 > Poison flask x1',
      legendary: 'Legendary x1 > Poison flask x3',
      black_hole: 'Black Hole x1 > Small Poison x8, Medium Poison x4, Poison flask x2',
    },
    comboRewards: {
      combo_2: 'Common + Uncommon > EXP +50, Energy +25',
      combo_3: 'Common + Uncommon + Rare > Small Poison x2, EXP +100',
      combo_4: 'Common + Uncommon + Rare + Epic > Medium Poison x2, Energy +25, EXP +150',
      combo_5: 'Common + Uncommon + Rare + Epic + Mythic > Poison flask x1, Medium Poison x2, EXP +250',
      combo_6: 'Common + Uncommon + Rare + Epic + Mythic + Legendary > EXP +500, Energy +100, Small Poison x6, Medium Poison x4, Poison flask x2',
      combo_7: 'Common + Uncommon + Rare + Epic + Mythic + Legendary + Black Hole > EXP +1000, Energy +250, Spins x20, Poison flask x10',
    },
  },
  ru: {
    title: 'Обмен рыбы',
    description: 'Сдавай рыбу сразу за меньшую награду или копи комбо для лучшего лута.',
    singleExchangeTitle: 'Одиночный обмен',
    comboExchangeTitle: 'Комбо-обмен',
    trashNote: 'Мусор не входит в комбо. Его можно сдать только отдельно.',
    notEnoughFish: 'Не хватает рыбы',
    exchange: 'Сдать',
    exchangeOne: 'Сдать 1',
    reward: 'Награда',
    singleRewards: {
      trash: 'Мусор x1 > EXP +10',
      common: 'Обычная x1 > EXP +25',
      uncommon: 'Необычная x1 > Энергия +20',
      rare: 'Редкая x1 > Малый яд x3',
      epic: 'Эпическая x1 > Средний яд x2',
      mythic: 'Мифическая x1 > Фляга с ядом x1',
      legendary: 'Легендарная x1 > Фляга с ядом x3',
      black_hole: 'Чернодырная x1 > Малый яд x8, Средний яд x4, Фляга с ядом x2',
    },
    comboRewards: {
      combo_2: 'Обычная + Необычная > EXP +50, Энергия +25',
      combo_3: 'Обычная + Необычная + Редкая > Малый яд x2, EXP +100',
      combo_4: 'Обычная + Необычная + Редкая + Эпическая > Средний яд x2, Энергия +25, EXP +150',
      combo_5: 'Обычная + Необычная + Редкая + Эпическая + Мифическая > Фляга с ядом x1, Средний яд x2, EXP +250',
      combo_6: 'Обычная + Необычная + Редкая + Эпическая + Мифическая + Легендарная > EXP +500, Энергия +100, Малый яд x6, Средний яд x4, Фляга с ядом x2',
      combo_7: 'Обычная + Необычная + Редкая + Эпическая + Мифическая + Легендарная + Чернодырная > EXP +1000, Энергия +250, Спины x20, Фляга с ядом x10',
    },
  },
};

function localizeCopy(copy, lang = 'en') {
  if (!copy || typeof copy !== 'object') return copy || '';
  const key = lang === 'uk' ? 'ua' : lang;
  return copy[key] || copy.ua || copy.uk || copy.en || copy.ru || '';
}

const PARTNER_REWARD_NAMES = {
  tentacles: { uk: 'Tentacles', en: 'Tentacles', ru: 'Tentacles' },
  xp: { uk: 'EXP', en: 'EXP', ru: 'EXP' },
  energy: { uk: 'Енергія', en: 'Energy', ru: 'Энергия' },
  strength: { uk: 'CA', en: 'CA', ru: 'CA' },
  premium: { uk: 'T-Pape', en: 'T-Pape', ru: 'T-Pape' },
  small_poison: { uk: 'Малий яд', en: 'Small poison', ru: 'Малый яд' },
  medium_poison: { uk: 'Середній яд', en: 'Medium poison', ru: 'Средний яд' },
  large_poison: { uk: 'Фляга з отрутою', en: 'Poison flask', ru: 'Фляга с ядом' },
};

function formatPartnerRewards(items, lang = 'en') {
  const icons = {
    tentacles: tentaclesRewardIcon,
    xp: getResourceIcon('xp'),
    energy: getResourceIcon('energy'),
    strength: getResourceIcon('strength'),
    premium: rewardStarIcon,
    small_poison: poisonIcon,
    medium_poison: mediumPoisonIcon,
    large_poison: largePoisonIcon,
  };
  return <span className="flex flex-wrap items-center gap-1.5">{items.map((item, index) => (
    <span key={`${item.type}-${index}`} title={PARTNER_REWARD_NAMES[item.type]?.[lang] || item.type} aria-label={`${PARTNER_REWARD_NAMES[item.type]?.[lang] || item.type} ${item.amount}`} className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#e5f4c5]">
      <img src={icons[item.type] || getResourceIcon(item.type)} alt="" className="h-5 w-5 object-contain" />
      <span>×{Number(item.amount || 0).toLocaleString(lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
    </span>
  ))}</span>;
}


const TASK_ICONS = {
  checkin: checkInIcon,
  spendEnergy: energyIcon,
  missions: missionIcon,
  artifacts: artifactIcon,
  bossHits: dailyBossIcon,
  bossDamage: dailyBossIcon,
  boxes: openBoxIcon,
  poisonUse: dailyPoisonIcon,
  setFragments: setFragmentIcon,
  raidBoss: raidBossIcon,
  catchFish: fishCommon,
};

const NEWBIE_TASK_ICONS = {
  1: checkInIcon, 2: starterPackIcon, 3: heroIcon, 4: missionIcon, 5: energyIcon,
  6: dailyBossIcon, 7: fingerAttackIcon, 8: pencilAttackIcon, 9: dailyPoisonIcon, 10: dailyBossIcon,
  11: damageChestIcon, 12: damageChestIcon, 13: damageChestIcon, 14: damageChestIcon, 15: damageChestIcon,
  16: rouletteSpinIcon, 17: openBoxIcon, 18: talentPointIcon, 19: talentUpgradeIcon, 20: tutorialCompleteIcon,
};


const OLD_WEEKLY_BONUSES = [
  { fullDays: 3, reward: { premium: 1, tentacles: 100 }, label: '100 tentacles + 1 T-Pape' },
  { fullDays: 5, reward: { premium: 2, tentacles: 300 }, label: '300 tentacles + 2 T-Pape' },
  { fullDays: 7, reward: { premium: 3, tentacles: 500 }, label: '500 tentacles + яд' },
];

void OLD_WEEKLY_BONUSES;


const STARTER_GUIDE_STEPS = [
  {
    id: 'spend-energy',
    title: 'Витрать 100 енергії',
    goal: 100,
    progress: (profile) => profile?.energy_spent_total || 0,
    reward: { tentacles: 40, energy: 25, smallPoison: 2 },
  },
  {
    id: 'slap-player',
    title: 'Дай ляпаса гравцю',
    goal: 1,
    progress: (profile) => profile?.social_slaps_total || 0,
    manualUpdate: (profile) => ({ social_slaps_total: (profile?.social_slaps_total || 0) + 1 }),
    reward: { energy: 35 },
  },
  {
    id: 'open-box',
    title: 'Відкрий будь-який бокс',
    goal: 1,
    progress: (profile) => profile?.opened_boxes_total || 0,
    reward: { strength: 10, energy: 25 },
  },
  {
    id: 'gain-strength',
    title: 'Підніми першу силу',
    goal: 25,
    progress: (profile) => profile?.stat_strength || 1,
    reward: { strength: 100, mediumPoison: 1, energy: 40 },
  },
  {
    id: 'boss-damage',
    title: 'Нанеси 100 урону босу',
    goal: 100,
    progress: (profile) => profile?.boss_damage_lifetime || profile?.total_boss_damage || 0,
    reward: { factoryKey: 1, energy: 50 },
  },
  {
    id: 'join-clan',
    title: 'Вступи у клан',
    goal: 1,
    progress: (profile) => (profile?.clan_name || profile?.clan_id ? 1 : 0),
    reward: { tentacles: 100, energy: 30 },
  },
];

const STARTER_FINAL_REWARD = {
  tentacles: 300,
  energy: 140,
  strength: 50,
  starterSetFragments: 1,
  smallPoison: 8,
  mediumPoison: 2,
  factoryKey: 2,
  beachBox: 1,
};


function StarterGuide({ profile, onClaimStep, onClaimFinal, claimingGuide }) {
  const claimed = profile?.starter_guide_claimed || [];
  const allClaimed = STARTER_GUIDE_STEPS.every((step) => claimed.includes(step.id));
  const finalClaimed = Boolean(profile?.starter_guide_final_claimed);
  const lang = profile?.language || 'en';

  return (
    <div className="mb-3 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#10170d_0%,#071006_100%)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#9dff43]">Starter guide</p>
          <h3 className="font-sans text-[18px] font-black uppercase leading-none text-[#f8ffe8]">{"" + translateUiText("Перший ривок") + ""}</h3>
        </div>
        <span className="rounded-full bg-[#182015] px-2 py-1 font-mono text-[10px] font-black text-[#e9ffd0]">
          {claimed.length}/{STARTER_GUIDE_STEPS.length}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {STARTER_GUIDE_STEPS.map((step) => {
          const value = Math.min(step.goal, step.progress(profile));
          const manualReady = Boolean(step.manualUpdate);
          const complete = value >= step.goal || manualReady;
          const isClaimed = claimed.includes(step.id);
          return (
            <div key={step.id} className="flex items-center gap-2 rounded-[13px] bg-[#0d140b] px-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[11px] font-black text-[#edf8d9]">{translateUiText(step.title)}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1b2a16]">
                  <div className="h-full rounded-full bg-[#8bff58]" style={{ width: `${(value / step.goal) * 100}%` }} />
                </div>
                <p className="mt-1 font-mono text-[8px] text-[#a9d27c]">{value.toLocaleString()}/{step.goal.toLocaleString()}</p>
              </div>
              <button
                type="button"
                disabled={!complete || isClaimed || claimingGuide === step.id}
                onClick={() => onClaimStep(step)}
                className={`h-8 min-w-[64px] rounded-[10px] px-2 font-mono text-[8px] font-black uppercase ${
                  isClaimed ? 'bg-[#2b3a22] text-[#8aa778]' : complete ? 'bg-[#d8ff5a] text-[#172016]' : 'bg-[#172016] text-[#647858]'
                }`}
              >
                {isClaimed ? 'done' : claimingGuide === step.id ? '...' : manualReady && value < step.goal ? 'do' : 'claim'}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!allClaimed || finalClaimed || claimingGuide === 'final'}
        onClick={onClaimFinal}
        className={`mt-3 h-10 w-full rounded-[13px] font-sans text-[12px] font-black uppercase ${
          finalClaimed ? 'bg-[#2b3a22] text-[#8aa778]' : allClaimed ? 'bg-[#d8ff5a] text-[#172016]' : 'bg-[#172016] text-[#647858]'
        }`}
      >
        {finalClaimed ? (lang === 'en' ? 'Starter pack claimed' : lang === 'ru' ? 'Стартовый пак забран' : 'Стартовий пак забрано') : (lang === 'en' ? 'Claim starter pack' : lang === 'ru' ? 'Забрать стартовый пак' : 'Забрати стартовий пак')}
      </button>
    </div>
  );
}

function NewbieQuestTab({ profile, onUpdateProfile, onGo, suspended = false }) {
  const newbie = useMemo(() => getNewbieProgress(profile), [profile]);
  const activePart = newbie.activePart;
  const activeQuest = newbie.activeQuest;
  const lang = profile?.language || 'en';
  const [packDrops, setPackDrops] = useState(null);
  const [questReward, setQuestReward] = useState(null);
  const claimBusy=useRef(false);
  const [claimError,setClaimError]=useState('');

  if (!activePart || !Array.isArray(activePart.quests)) {
    return <div className="rounded-[16px] border border-[#28ee90] bg-[#10170d] p-4 font-mono text-[12px] text-[#d8f67a]">Newbie Quest is preparing…</div>;
  }

  const buildPackDrops = (reward = {}) => {
    const rows = [];
    if (reward.tentacles) rows.push({ label: 'tentacles', qty: reward.tentacles, icon: getResourceIcon('tentacles') });
    if (reward.xp) rows.push({ label: 'EXP', qty: reward.xp, icon: getResourceIcon('xp') });
    if (reward.freeSpins) rows.push({ label: lang === 'en' ? 'Spins' : lang === 'ru' ? 'Спины' : 'Спіни', qty: reward.freeSpins, icon: spinx1Ui });
    if (reward.starterSetFragments || reward.starter_set_fragments) rows.push({ label: lang === 'en' ? 'Starter Fragment' : lang === 'ru' ? 'Фрагмент сета' : 'Фрагмент сету', qty: reward.starterSetFragments || reward.starter_set_fragments, icon: rewardStarIcon });
    if (reward.small) rows.push({ label: lang === 'en' ? 'Small Poison' : lang === 'ru' ? 'Малый яд' : 'Малий яд', qty: reward.small, icon: poisonIcon });
    if (reward.medium) rows.push({ label: lang === 'en' ? 'Medium Poison' : lang === 'ru' ? 'Средний яд' : 'Середній яд', qty: reward.medium, icon: mediumPoisonIcon });
    if (reward.large) rows.push({ label: lang === 'en' ? 'Poison flask' : lang === 'ru' ? 'Фляга с ядом' : 'Фляга з отрутою', qty: reward.large, icon: largePoisonIcon });
    return rows;
  };

  const claimQuest = async (quest) => {
    if (!quest?.done || quest.claimed || quest.id !== activeQuest?.id) return;
    if(claimBusy.current)return;
    claimBusy.current=true;setClaimError('');
    try { await onUpdateProfile({ playerAction: { type: 'newbie-quest', questId: quest.id } }); }
    catch(error){setClaimError(error.message);return;}finally{claimBusy.current=false;}
    setQuestReward(buildPackDrops(quest.reward).map((item) => ({
      id: item.label,
      label: item.label,
      text: `+${item.qty}`,
      icon: item.icon,
    })));
  };

  const claimPartPack = async () => {
    if (!activePart?.allClaimed || activePart.partClaimed) return;
    const previewDrops = [...buildPackDrops(activePart.partReward)];
    if (activePart.id === 4 && !(profile?.newbie_survival_claimed || false)) {
      previewDrops.push(...buildPackDrops(SURVIVAL_PACK));
    }
    if(claimBusy.current)return;
    claimBusy.current=true;setClaimError('');
    try { await onUpdateProfile({ playerAction: { type: 'newbie-part', partId: activePart.id } }); }
    catch(error){setClaimError(error.message);return;}finally{claimBusy.current=false;}
    setPackDrops(previewDrops);
  };

  return (
    <div className="space-y-2" data-tutorial-newbie-ready="true">{claimError&&<p role="alert" className="text-xs text-red-400">{claimError}</p>}
      <div className="rounded-[10px_8px_11px_7px] border border-[#28ee90] bg-[#20271d] p-3 text-[#e2ebd8] shadow-[0_5px_14px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#91ba75]">{lang === 'en' ? 'Newbie Quest' : lang === 'ru' ? 'Квест новичка' : 'Квест новачка'}</p>
            <h3 className="mt-1 font-sans text-[18px] font-black uppercase leading-none text-[#e2ebd8]">{lang === 'en' ? 'Part' : lang === 'ru' ? 'Часть' : 'Частина'} {activePart.id}/4 — {localizeCopy(activePart.nameI18n || activePart.name, lang)}</h3>
          </div>
          <span className="rounded-full bg-[#35402d] px-2 py-1 font-mono text-[10px] font-black text-[#d9ffae]">{activePart.claimedCount}/5</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#35402d]"><div className="h-full rounded-full bg-[#8bff58]" style={{ width: `${(activePart.claimedCount / 5) * 100}%` }} /></div>
      </div>
      <div className="mt-2 space-y-1.5">
        {activePart.quests.map((quest, index) => {
          const unlocked = index === 0 || activePart.quests[index - 1].claimed;
          const isActive = quest.id === activeQuest?.id;
          const questIcon = NEWBIE_TASK_ICONS[quest.id];
          return (
            <div key={quest.id} className={`flex items-center gap-2 rounded-[10px_8px_11px_7px] border border-[#28ee90] p-2 text-[#e2ebd8] shadow-[0_5px_14px_rgba(0,0,0,0.08)] ${unlocked ? isActive ? 'bg-[#26351c]' : 'bg-[#20271d]' : 'bg-[#111610] opacity-55'}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border ${unlocked ? 'border-[#5d884a] bg-[#35402d]' : 'border-[#35402d] bg-[#222a21]'} font-mono text-[11px] font-black text-[#d9ffae]`}>
                {quest.claimed ? <img src={tutorialCompleteIcon} alt="" className="h-8 w-8 object-contain" /> : questIcon ? <img src={questIcon} alt="" className={`h-8 w-8 object-contain ${!unlocked ? 'grayscale opacity-60' : ''}`} /> : unlocked ? index + 1 : <Lock className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[12px] font-black leading-tight text-[#e2ebd8]">{localizeCopy(quest.titleI18n || quest.title, lang)}</p>
                <p className="mt-1 font-mono text-[9px] font-black text-[#91ba75]">{unlocked ? localizeCopy(quest.descI18n || quest.desc, lang) : (lang === 'en' ? 'Complete the previous quest' : lang === 'ru' ? 'Завершите предыдущий квест' : 'Заверши попередній квест')}</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#35402d]"><div className={`h-full rounded-full ${quest.claimed ? 'w-full bg-[#8bff58]' : isActive && quest.done ? 'w-full bg-[#d8ff5a]' : 'w-0 bg-[#557d1d]'}`} /></div>
              </div>
              {unlocked ? <ClaimStateButton tutorialTarget={isActive && quest.done && !quest.claimed ? 'newbie-first-claim' : undefined} tone={quest.claimed ? 'dark-green' : isActive && quest.done ? 'green' : 'yellow'} onClick={() => quest.done ? claimQuest(quest) : onGo?.(quest)} disabled={!isActive || quest.claimed} label={quest.claimed ? 'Done' : isActive && quest.done ? (lang === 'en' ? 'Claim' : lang === 'ru' ? 'Забрать' : 'Забрати') : 'Go'} textClassName={quest.claimed ? 'text-[#edf6df]' : 'text-[#172016]'} /> : <TexturedButton disabled muted><Lock className="h-4 w-4" /></TexturedButton>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 rounded-[10px_8px_11px_7px] border border-[#28ee90] bg-[#20271d] p-2">
        <GameTextureButton
          type="button"
          onClick={claimPartPack}
          disabled={!activePart.allClaimed || activePart.partClaimed}
          tone="yellow"
          className="h-9 min-w-[112px] px-3 disabled:opacity-40"
        >
          <span className="relative z-[1] font-mono text-[10px] font-black text-[#1f1708]">
            {activePart.partClaimed ? (lang === 'en' ? 'PACK DONE' : lang === 'ru' ? 'ПАК ЗАБРАН' : 'ПАК ЗАБРАНО') : (lang === 'en' ? 'CLAIM PACK' : lang === 'ru' ? 'ЗАБРАТЬ ПАК' : 'ЗАБРАТИ ПАК')}
          </span>
        </GameTextureButton>
      </div>
      {packDrops?.length ? (
        <div onClick={event=>{if(event.target===event.currentTarget)setPackDrops(null);}} className="fixed inset-0 z-[20] flex items-center justify-center bg-black/80 px-4">
          <MarkerFrame className="w-full max-w-[340px] bg-[#0b1209]" innerClassName="p-3" variant="transparent">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9dff43]">
              {lang === 'en' ? 'Pack Rewards' : lang === 'ru' ? 'Награды пака' : 'Нагороди пака'}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
              {packDrops.map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="flex min-h-[92px] flex-col items-center justify-center rounded-[8px] bg-[#121a0f] px-1 py-1.5">
                  <img src={item.icon} alt={item.label} className="h-[34px] w-[34px] object-contain" />
                  <span className="mt-1 text-center font-mono text-[9px] leading-none text-[#e7f3d5]">{item.label}</span>
                  <span className="mt-1 font-mono text-[18px] font-black leading-none text-[#d8ff5a]">x{item.qty}</span>
                </div>
              ))}
            </div>
            <GameTextureButton
              type="button"
              onClick={() => setPackDrops(null)}
              tone="yellow"
              className="mt-3 h-[42px] w-full"
            >
              <span className="relative z-[1] font-mono text-[10px] font-black text-[#1f1708]">
                {lang === 'en' ? 'Mmm, tasty' : lang === 'ru' ? 'Ммм, вкусно' : 'Ммм, смачно'}
              </span>
            </GameTextureButton>
          </MarkerFrame>
        </div>
      ) : null}
      <RewardPopup
        language={profile?.language || 'uk'}
        open={!suspended && Boolean(questReward?.length)}
        title="Reward"
        items={questReward || []}
        tutorialClaimTarget
        onClose={() => {
          setQuestReward(null);
          window.dispatchEvent(new Event('tutorial-reward-closed'));
        }}
      />
    </div>
  );
}

function getDayTasks(day, language = 'uk') {
  return getDailyTasks(day, language).map((task) => ({
    ...task,
    icon: task.baseId === 'boxes'
      ? (day === 1 ? standardBossBoxIcon : day === 5 ? damageChestIcon : openBoxIcon)
      : TASK_ICONS[task.baseId] || ShieldCheck,
  }));
}


function getTaskTone(task) {
  const tones = {
    checkin: {
      chip: 'bg-[#e9fff0]',
      icon: 'text-[#1fae71]',
      progress: '#5fd7b0',
      glow: 'shadow-[inset_4px_0_0_#44d69b]',
    },
    missions: {
      chip: 'bg-[#eaf7ff]',
      icon: 'text-[#358dff]',
      progress: '#61b9ff',
      glow: 'shadow-[inset_4px_0_0_#4ba7ff]',
    },
    'boss-hit': {
      chip: 'bg-[#fff0e7]',
      icon: 'text-[#ff7b47]',
      progress: '#ff9a5c',
      glow: 'shadow-[inset_4px_0_0_#ff7a39]',
    },
    'boss-damage': {
      chip: 'bg-[#fff7dd]',
      icon: 'text-[#d69b18]',
      progress: '#ffd45a',
      glow: 'shadow-[inset_4px_0_0_#f5bd28]',
    },
    'spend-energy': {
      chip: 'bg-[#f1edff]',
      icon: 'text-[#7b63ff]',
      progress: '#9b8dff',
      glow: 'shadow-[inset_4px_0_0_#806cff]',
    },
    'earn-tentacles': {
      chip: 'bg-[#edf1f3]',
      icon: 'text-[#7a8c91]',
      progress: '#91aab2',
      glow: 'shadow-[inset_4px_0_0_#8aa0a7]',
    },
    poison: {
      chip: 'bg-[#ecffd8]',
      icon: 'text-[#75be18]',
      progress: '#9dff43',
      glow: 'shadow-[inset_4px_0_0_#8dff32]',
    },
  };

  return tones[task.baseId] || tones.checkin;
}

function renderComboRewardText(text) {
  if (!text) return null;
  const source = String(text);
  const separator = source.lastIndexOf('>');
  const rewardsOnly = separator >= 0 ? source.slice(separator + 1).trim() : source;
  const parts = rewardsOnly.split(/(Black Hole|Legendary|Mythic|Epic|Rare|Uncommon|Common|Trash)/g);
  return parts.map((part, index) => {
    const key = COMBO_REWARD_COLOR_TOKENS[part];
    if (!key) return <span key={`combo-reward-${index}`}>{part}</span>;
    if (key === 'black_hole') {
      return (
        <span
          key={`combo-reward-${index}`}
          style={{ color: COSMO_BLACK_HOLE_STYLE.base, textShadow: `0 0 6px ${COSMO_BLACK_HOLE_STYLE.glow}, 0 0 2px ${COSMO_BLACK_HOLE_STYLE.accent}` }}
        >
          {part}
        </span>
      );
    }
    return (
      <span key={`combo-reward-${index}`} style={{ color: COSMO_FISH_RARITY_COLORS[key] }}>
        {part}
      </span>
    );
  });
}

function getRarityTextStyle(rarity, muted = false) {
  if (rarity === 'black_hole') {
    return {
      color: COSMO_BLACK_HOLE_STYLE.base,
      textShadow: `0 0 3px ${COSMO_BLACK_HOLE_STYLE.glow}, 0 0 8px ${COSMO_BLACK_HOLE_STYLE.glow}, 0 0 14px ${COSMO_BLACK_HOLE_STYLE.accent}`,
      opacity: muted ? 0.65 : 1,
    };
  }
  return {
    color: COSMO_FISH_RARITY_COLORS[rarity] || '#cfe7b2',
    opacity: muted ? 0.65 : 1,
  };
}

function IconWrap({ icon, locked = false, tone }) {
  const isStringIcon = typeof icon === 'string';
  const Icon = icon;

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${locked ? 'bg-[#f2f5f1]' : tone.chip}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${locked ? 'text-[#a9ada7]' : tone.icon}`}>
        {isStringIcon ? (
          <img src={icon} alt="" className={`h-8 w-8 object-contain ${locked ? 'grayscale' : ''}`} />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}

function TexturedButton({ children, onClick, disabled = false, muted = false }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      tone={muted ? 'gray' : 'green'}
      className="h-11 w-[84px] shrink-0 disabled:cursor-not-allowed"
    >
      <span className={`relative z-10 flex h-full items-center justify-center font-sans text-[12px] font-black uppercase ${muted ? 'text-[#8a9188]' : 'text-white [text-shadow:0_2px_0_rgba(0,0,0,0.55)]'}`}>
        {children}
      </span>
    </GameTextureButton>
  );
}

function ClaimStateButton({ label, tone = 'green', onClick, disabled = false, textClassName = 'text-[#161f0d]', className = 'w-[84px]', tutorialTarget = undefined }) {
  return (
    <GameTextureButton
      type="button"
      data-tutorial-target={tutorialTarget}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      tone={tone}
      className={`h-11 shrink-0 ${className} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className={`relative z-10 flex h-full items-center justify-center px-2 text-center font-sans text-[12px] font-black uppercase ${textClassName}`}>
        {label}
      </span>
    </GameTextureButton>
  );
}

function DayButton({ day, active, locked, claimable, onClick, lang }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      disabled={locked}
      tone={active ? 'yellow' : 'gray'}
      className={`flex h-[66px] min-w-0 flex-1 flex-col items-center justify-center ${
        locked ? 'opacity-75 grayscale-[0.18] cursor-not-allowed' : 'hover:brightness-105'
      }`}
    >
      <span className={`relative z-10 font-sans text-[10px] font-black lowercase leading-none ${active ? 'text-[#111111]' : 'text-[#a6ada5]'}`}>day</span>
      <span className={`relative z-10 font-sans text-[18px] font-black leading-none ${active ? 'text-[#111111]' : 'text-[#a6ada5]'}`}>{day}</span>
      {claimable && !locked ? <span aria-label="Є нагорода для отримання" className="absolute right-1.5 top-1.5 z-20 h-2.5 w-2.5 rounded-full border border-white bg-[#ff4d4d] shadow-[0_1px_3px_rgba(0,0,0,0.8)]" /> : null}
    </GameTextureButton>
  );
}

export function ExtraQuestRow({ channel, handle, condition, reward, status, claimed, onGo, onVerify, onClaim, lang }) {
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const verifyRef = useRef(onVerify);
  verifyRef.current = onVerify;
  useEffect(() => {
    if (status !== 'opened') return undefined;
    let started = false;
    const verify = () => { if (!started) { started = true; void verifyRef.current(); } };
    const timer = setTimeout(verify, 8000);
    const onFocus = () => verify();
    const onVisible = () => { if (document.visibilityState === 'visible') verify(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(timer); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisible); };
  }, [status]);
  const waiting = status === 'opened' || status === 'checking' || claiming;
  const ready = status === 'subscribed';
  const error = claimError ? localizeCopy({uk:'Не вдалося забрати нагороду. Спробуй ще раз.',en:'Could not claim reward. Try again.',ru:'Не удалось забрать награду. Попробуй ещё раз.'}, lang)
    : status === 'not_subscribed' ? localizeCopy({uk:'Підписку ще не знайдено. Спробуй знову.',en:'Subscription not found yet. Try again.',ru:'Подписка пока не найдена. Попробуй снова.'}, lang)
    : status === 'no_user' ? localizeCopy({uk:'Відкрий гру в Telegram для перевірки.',en:'Open the game in Telegram to verify.',ru:'Открой игру в Telegram для проверки.'}, lang)
    : status === 'check_unavailable' ? localizeCopy({uk:'Перевірка тимчасово недоступна. Спробуй знову.',en:'Verification is unavailable. Try again.',ru:'Проверка временно недоступна. Попробуй снова.'}, lang) : '';
  const claim = async () => {
    if (claiming) return;
    setClaiming(true); setClaimError(false);
    try { await onClaim(); } catch { setClaimError(true); } finally { setClaiming(false); }
  };
  return <div className="flex items-center gap-2 rounded-[10px_8px_11px_7px] border border-[#28ee90] bg-[#20271d] p-2 text-[#e2ebd8]">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#35402d] text-xl text-[#91ba75]">
      {avatarFailed ? <span aria-hidden="true">✈</span> : <img src={'/api/telegram/channel-avatar?channel=' + encodeURIComponent(channel)} alt={handle} onError={() => setAvatarFailed(true)} className="h-full w-full object-cover" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-sans text-[11px] font-black leading-tight">{condition} {handle}</p>
      <div className="mt-1 flex items-center gap-1 font-mono text-[9px] font-bold text-[#a6b09c]">{reward}</div>
      {error && !claimed ? <p role="status" className="mt-1 text-[9px] text-[#d6ad75]">{error}</p> : null}
    </div>
    <ClaimStateButton label={claimed ? 'Done' : waiting ? 'Wait' : ready ? 'Claim' : 'Go'} tone={claimed ? 'dark-green' : waiting ? 'gray' : ready ? 'green' : 'yellow'} disabled={claimed || waiting} onClick={ready ? claim : onGo} textClassName={claimed || waiting ? 'text-[#edf6df]' : 'text-[#161f0d]'} />
  </div>;
}

function TaskRow({ task, locked, onClaim, onGo, claiming, missedCheckin = false, tutorialTarget = undefined, language = 'uk' }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const tone = getTaskTone(task);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 rounded-[10px_8px_11px_7px] border border-[#28ee90] bg-[#20271d] p-2 text-[#e2ebd8] shadow-[0_5px_14px_rgba(0,0,0,0.08)] ${tone.glow} ${locked ? 'opacity-75' : ''}`}
    >
      <IconWrap icon={task.icon} locked={locked} tone={tone} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)} className="block w-full cursor-pointer text-left font-sans text-[12px] font-black leading-tight text-[#e2ebd8]">{task.title} <span aria-hidden="true" className="text-[#91ba75]">ⓘ</span></button>
            {detailsOpen ? <p className="mt-1 whitespace-normal font-sans text-[10px] leading-snug text-[#c5d4bb]">{task.title}{task.baseId === 'spendEnergy' ? ` · ${language === 'en' ? 'Energy progress accumulates during this 7-day event.' : language === 'ru' ? 'Прогресс потраченной энергии накапливается в течение этого 7-дневного события.' : 'Витрати енергії накопичуються протягом цього 7-денного кола.'}` : ''}</p> : null}
            <p className="mt-1 font-mono text-[9px] font-black text-[#91ba75]">
              {task.current.toLocaleString()}/{task.goal.toLocaleString()}
            </p>
          </div>
          <div className="shrink-0 text-right font-mono text-[8px] font-black leading-tight text-[#a6b09c]">
            <p>+ {task.xp} XP</p>
            {task.energyBonus ? <p>+{task.energyBonus} energy</p> : null}
            <p>{task.tentacles} tentacles</p>
          </div>
        </div>

        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#35402d]">
          <div
            className="h-full rounded-full"
            style={{ width: `${task.progressPct}%`, backgroundColor: tone.progress }}
          />
        </div>
      </div>

      {locked ? (
        <TexturedButton disabled muted>
          <Lock className="h-4 w-4" />
        </TexturedButton>
      ) : task.claimed ? (
        <ClaimStateButton tone="dark-green" disabled label="Done" textClassName="text-[#edf6df] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" />
      ) : task.claimable ? (
        <ClaimStateButton
          tone="green"
          onClick={onClaim}
          disabled={claiming}
          tutorialTarget={tutorialTarget}
          label={claiming ? '...' : 'Claim'}
        />
      ) : missedCheckin ? (
        <ClaimStateButton tone="red" label="Missed" textClassName="text-[#fff0f0]" />
      ) : (
        <ClaimStateButton tone="yellow" label="Go" onClick={() => onGo?.(task)} />
      )}
    </motion.div>
  );
}

function BigTabButton({ active, label, onClick, alert = false, tutorialTarget = undefined }) {
  return (
    <GameTextureButton
      type="button"
      data-tutorial-target={tutorialTarget}
      onClick={onClick}
      tone={active ? 'green' : 'gray'}
      className="h-[44px]"
    >
      {alert ? <span role="status" aria-label="Unclaimed reward" className="absolute right-1.5 top-1.5 z-20 h-2.5 w-2.5 rounded-full border border-[#f7e6cf] bg-[#ef4444] shadow-[0_0_7px_rgba(239,68,68,0.9)]" /> : null}
      <span className={`relative z-10 flex h-full items-center justify-center px-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${active ? 'text-[#18220d]' : 'text-[#f2f6ff] [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]'}`}>
        {label}
      </span>
    </GameTextureButton>
  );
}

function getWeeklyRewardItems(reward = {}) {
  const compactAmount = (value) => Number(value) >= 1000 ? `${Number(value) / 1000}k` : String(value);
  return [
    { key: 'tentacles', amount: reward.tentacles, icon: tentaclesRewardIcon, label: 'Tentacles', format: compactAmount },
    { key: 'energy', amount: reward.energy, icon: getResourceIcon('energy'), label: 'Energy', format: String },
    { key: 'small', amount: reward.small, icon: poisonIcon, label: 'Small poison', format: String },
    { key: 'medium', amount: reward.medium, icon: mediumPoisonIcon, label: 'Medium poison', format: String },
    { key: 'large', amount: reward.large, icon: largePoisonIcon, label: 'Big poison', format: String },
    { key: 'freeSpins', amount: reward.freeSpins, icon: spinx1Ui, label: 'Spin', format: String },
  ].filter((item) => Number(item.amount || 0) > 0);
}

function WeeklyProgress({ fullDays, claimedBonuses, onClaimBonus, onPreviewBonus, claimingBonus }) {
  const progress = Math.min(100, (fullDays / 7) * 100);

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-sans text-[20px] font-black uppercase leading-none text-[#f6fff1] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">
          Weekly Streak
        </h3>
        <span className="rounded-full border border-[#28ee90] bg-[#10170d] px-2 py-1 font-mono text-[9px] text-[#a9d27c]">
          {fullDays}/7 full days
        </span>
      </div>

      <div className="overflow-hidden rounded-[16px] bg-[#092637]/80 px-2 pb-3 pt-3">
        <div className="h-2 overflow-hidden rounded-full bg-[#ecfff0]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#557d1d_0%,#83b83d_52%,#b5dc59_100%)]" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
        {WEEKLY_BONUSES.map((bonus) => {
          const reached = fullDays >= bonus.fullDays;
          const claimed = claimedBonuses.includes(bonus.fullDays);
          const rewardItems = getWeeklyRewardItems(bonus.reward);

          return (
            <div key={bonus.fullDays} className="relative flex h-[152px] min-w-0 flex-col items-center rounded-[13px] bg-[#0c170f] px-1.5 py-2">
              {reached && !claimed ? <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-[#ff5a5a]" /> : null}
              <div className={`flex h-8 items-baseline justify-center gap-1 font-rubik-distressed uppercase ${reached ? 'text-[#effff1]' : 'text-[#8f9a8d]'}`}>
                <span className="text-[25px] leading-none">{bonus.fullDays}</span>
                <span className="text-[9px] leading-none">days</span>
              </div>
              <p className="mt-1 text-center font-mono text-[7px] font-black uppercase leading-tight text-[#9dff43]">{bonus.label}</p>
              <div className="mt-1 flex h-10 w-full items-center justify-center gap-1">
                <img src={dailyToxicPackBox} alt="" aria-hidden="true" className="h-10 w-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,.7)]" />
                <button type="button" onClick={() => onPreviewBonus(bonus)} aria-label={`Show ${bonus.label} contents`} className="flex h-5 w-5 items-center justify-center rounded-full border border-[#dfff82] bg-[#0c170f] font-sans text-[12px] font-black leading-none text-[#dfff82] shadow">?</button>
              </div>
              <ClaimStateButton
                onClick={() => onClaimBonus(bonus)}
                disabled={!reached || claimed || claimingBonus === bonus.fullDays}
                tone={claimed || !reached ? 'gray' : 'green'}
                className={`mt-auto w-full ${
                  !reached || claimed || claimingBonus === bonus.fullDays ? 'cursor-not-allowed' : 'hover:brightness-110'
                }`}
                textClassName={claimed ? 'text-[#8aa778]' : reached ? 'text-[#15210f]' : 'text-[#738765]'}
                label={claimed ? 'claimed' : claimingBonus === bonus.fullDays ? '...' : 'claim'}
              />
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export default function DailyPanel({ profile, onSyncProfile = null, onUpdateProfile, onRefreshProfile = null, onClose, onGoToTask, onOpenRaidBoss = null, onOpenSpaceFishing = null, onBackToEvents = null, panelMode = 'daily', initialTab = 'event', initialEventScene = null, suspended = false }) {
  const todayKey = profile?.currentDateKey || '';
  const weekKey = profile?.currentWeekKey || '';
  const currentDay = Number(profile?.currentDayIndex || 1);
  const [activeTab, setActiveTab] = useState(initialTab);
  const { tasks: partnerTasks, hasNew: hasNewPartners, markSeen: markPartnersSeen } = usePartnerTasks(profile);
  const [openedPartnerIds, setOpenedPartnerIds] = useState({});
  const [partnerBusyId, setPartnerBusyId] = useState(null);
  const [partnerClaimedIds, setPartnerClaimedIds] = useState({});
  const [partnerMessage, setPartnerMessage] = useState('');
  const [eventScene, setEventScene] = useState(initialEventScene);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [claimingTask, setClaimingTask] = useState(null);
  const claimingTaskRef = useRef(false);
  const [claimingDay, setClaimingDay] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(null);
  const [claimingGuide, setClaimingGuide] = useState(null);
  const [fishShopOpen, setFishShopOpen] = useState(false);
  const [fishSeeded, setFishSeeded] = useState(false);
  const [fishVideoEnabled, setFishVideoEnabled] = useState(false);
  const [fishInventoryOpen, setFishInventoryOpen] = useState(false);
  const [fishingResult, setFishingResult] = useState(null);
  const [showFishingPopup, setShowFishingPopup] = useState(false);
  const [hookNow, setHookNow] = useState(serverNow());
  const [pendingFishCycle, setPendingFishCycle] = useState(null);
  const fishingActionBusy = useRef(false);
  const [claimRewardPopup, setClaimRewardPopup] = useState(null);
  const [weeklyRewardPreview, setWeeklyRewardPreview] = useState(null);
  const [claimError, setClaimError] = useState('');

  const dailyState = profile?.daily_event_week === weekKey ? profile?.daily_event || {} : {};
  const claimedRewards = dailyState.claimedRewards || {};
  const fullDays = dailyState.fullDays || [];
  const claimedBonuses = dailyState.claimedBonuses || [];
  const selectedClaimedTasks = claimedRewards[selectedDay] || [];
  const lang = profile?.language || 'en';
  useEffect(() => {
    if (!profile?.id) return;
    try {
      setOpenedPartnerIds(JSON.parse(window.localStorage.getItem(`p4-partner-opened:${profile.id}`) || '{}'));
    } catch {
      setOpenedPartnerIds({});
    }
  }, [profile?.id]);
  const openPartner = async (partner) => {
    if (/^https:\/\/t\.me\//i.test(partner.link) && window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(partner.link);
    } else window.open(partner.link, '_blank', 'noopener,noreferrer');
    {
      setPartnerBusyId(partner.id);
      try {
        const session = getTelegramSession();
        const headers = { Accept: 'application/json' };
        if (session?.initData) headers['X-Telegram-Init-Data'] = session.initData;
        if (session?.telegramId) headers['X-Telegram-User-Id'] = String(session.telegramId);
        const response = await fetch(`/api/partners/${encodeURIComponent(partner.id)}/visit`, { method: 'POST', headers, keepalive: true });
        if (!response.ok) throw new Error('Could not start visit. Try again.');
      } catch (error) {
        if (partner.verificationMode === 'visit') { setPartnerMessage(error.message); return; }
      }
      finally { setPartnerBusyId(null); }
    }
    setOpenedPartnerIds((current) => {
      const next = { ...current, [partner.id]: true };
      try { if (profile?.id) window.localStorage.setItem(`p4-partner-opened:${profile.id}`, JSON.stringify(next)); } catch { /* Storage may be unavailable in Telegram. */ }
      return next;
    });
    setPartnerMessage('');
  };
  const claimPartner = async (partner) => {
    if (partnerBusyId) return;
    setPartnerBusyId(partner.id);
    setPartnerMessage('');
    try {
      const session = getTelegramSession();
      const headers = { Accept: 'application/json' };
      if (session?.initData) headers['X-Telegram-Init-Data'] = session.initData;
      if (session?.telegramId) headers['X-Telegram-User-Id'] = String(session.telegramId);
      const response = await fetch(`/api/partners/${encodeURIComponent(partner.id)}/claim`, { method: 'POST', headers });
      const payload = await response.json();
      if (!response.ok) {
        if (payload?.code === 'PARTNER_VERIFICATION_UNAVAILABLE') throw new Error(lang === 'uk' ? 'Не вдалося перевірити підписку. Спробуйте пізніше.' : lang === 'ru' ? 'Не удалось проверить подписку. Попробуйте позже.' : 'Could not verify subscription. Try again later.');
        throw new Error(payload?.message || 'Verification unavailable');
      }
      if (payload?.data?.status === 'VISIT_WAIT') {
        setPartnerMessage(lang === 'uk' ? 'Перевіряємо…' : lang === 'ru' ? 'Проверяем…' : 'Checking…');
      } else if (['VISIT_REQUIRED', 'VISIT_REPEAT_REQUIRED'].includes(payload?.data?.status)) {
        setOpenedPartnerIds(current => { const next = { ...current }; delete next[partner.id]; try { window.localStorage.setItem(`p4-partner-opened:${profile.id}`, JSON.stringify(next)); } catch {} return next; });
        setPartnerMessage(lang === 'uk' ? 'Перевірте підписку та спробуйте знову.' : lang === 'ru' ? 'Проверьте подписку и попробуйте снова.' : 'Check your subscription and try again.');
      } else if (payload?.data?.status === 'NOT_SUBSCRIBED') {
        setPartnerMessage(lang === 'uk' ? 'Перевірте підписку та спробуйте знову.' : lang === 'ru' ? 'Проверьте подписку и попробуйте снова.' : 'Check your subscription and try again.');
      } else if (payload?.data?.claimed) {
        setPartnerClaimedIds((current) => ({ ...current, [partner.id]: true }));
        try { await onRefreshProfile?.(); } catch { /* Claim already succeeded; refresh on next profile load. */ }
      } else {
        throw new Error(lang === 'uk' ? 'Не вдалося перевірити підписку. Спробуйте пізніше.' : lang === 'ru' ? 'Не удалось проверить подписку. Попробуйте позже.' : 'Could not verify subscription. Try again later.');
      }
    } catch (error) {
      setPartnerMessage(error?.message || 'Verification unavailable');
    } finally {
      setPartnerBusyId(null);
    }
  };
  useEffect(() => { if (activeTab === 'extra') markPartnersSeen(); }, [activeTab, markPartnersSeen]);
  const isEventsMode = panelMode === 'events';
  const fishCopy = FISH_EXCHANGE_TEXT[lang] || FISH_EXCHANGE_TEXT.ua;
  const fishingUi = COSMO_FISHING_UI[lang] || COSMO_FISHING_UI.ua;
  const fishInventory = profile?.cosmofish_inventory || profile?.cosmo_fish_inventory || {};
  const fishRarityName = COSMO_RARITY_NAME[lang] || COSMO_RARITY_NAME.ua;
  const profileFishCycle = profile?.cosmo_fishing_cycle || null;
  const profileFishingResult = profile?.cosmo_fishing_last_result || null;
  const profileFishingResultSeen = Boolean(profile?.cosmo_fishing_last_result_seen);
  const fishCycle = profileFishCycle?.startAt ? profileFishCycle : pendingFishCycle;
  const fishCycleStart = Number(fishCycle?.startAt || 0);
  const fishCycleFinish = Number(fishCycle?.finishAt || 0);
  const fishCycleHookStart = Number(fishCycle?.hookStartAt || 0);
  const fishCycleHookEnd = Number(fishCycle?.hookEndAt || 0);
  const fishCycleClaimed = Boolean(fishCycle?.claimed);
  const fishCycleResolved = Boolean(fishCycle?.resolved);
  const fishCycleExists = Boolean(fishCycleStart && !fishCycleClaimed);
  const fishCycleHookActive = fishCycleExists && !fishCycleResolved && hookNow >= fishCycleHookStart && hookNow < fishCycleHookEnd;
  const fishCycleReadyPullOut = fishCycleExists && !fishCycleResolved && hookNow >= fishCycleFinish;
  const fishCycleWaiting = fishCycleExists && !fishCycleResolved && !fishCycleHookActive && !fishCycleReadyPullOut;
  const fishCycleLeftSec = Math.max(0, Math.ceil((fishCycleFinish - hookNow) / 1000));
  const fishCycleTimerText = `${Math.floor(fishCycleLeftSec / 60)}`.padStart(2, '0') + `:${`${fishCycleLeftSec % 60}`.padStart(2, '0')}`;

  useEffect(() => {
    const timer = setInterval(() => setHookNow(serverNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profileFishCycle?.startAt) {
      setPendingFishCycle((current) => {
        if (current?.startAt === profileFishCycle.startAt) return current;
        return profileFishCycle;
      });
      return;
    }
    if (pendingFishCycle) {
      setPendingFishCycle(null);
    }
  }, [profileFishCycle?.startAt]);

  useEffect(() => {
    if (profileFishingResult && !profileFishingResultSeen) {
      setFishingResult(profileFishingResult);
      setShowFishingPopup(true);
      return;
    }
    if (profileFishingResultSeen) {
      setShowFishingPopup(false);
      setFishingResult(null);
    }
  }, [profileFishingResult, profileFishingResultSeen]);

  useEffect(() => {
    setSelectedDay(currentDay);
  }, [currentDay]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setEventScene(initialEventScene);
  }, [initialEventScene]);

  useEffect(() => {
    if (!isEventsMode || eventScene !== 'space-fishing' || fishSeeded) return;
    setFishSeeded(true);
  }, [eventScene, fishSeeded, isEventsMode, onUpdateProfile, profile]);

  useEffect(() => {
    if (!isEventsMode || eventScene !== 'space-fishing') {
      setFishVideoEnabled(false);
      return undefined;
    }
    const timer = setTimeout(() => setFishVideoEnabled(true), 700);
    return () => clearTimeout(timer);
  }, [eventScene, isEventsMode]);

  const exchangeFish = async (rarity) => {
    const current = Number(fishInventory[rarity] || 0);
    if (current <= 0) return;
    await onUpdateProfile({ playerAction: { type: 'fishing-exchange', rarity } });
  };

  const exchangeCombo = async (combo) => {
    const ready = combo?.fishes?.every((rarity) => Number(fishInventory[rarity] || 0) > 0);
    if (!ready) return;
    await onUpdateProfile({ playerAction: { type: 'fishing-exchange', comboKey: combo.key } });
  };

  const resolveFishing = async (successfulHook, cycle) => {
    if (fishingActionBusy.current || !cycle || cycle.claimed || cycle.resolved) return;
    fishingActionBusy.current = true;
    try {
      const response = await onUpdateProfile({ playerAction: { type: 'fishing-resolve', hook: Boolean(successfulHook) } });
      const savedCycle = response?.player?.cosmo_fishing_cycle || response?.cosmo_fishing_cycle;
      if (savedCycle) setPendingFishCycle(savedCycle);
      setFishingResult(response?.result || null);
      setShowFishingPopup(true);
    } catch (error) {
      setClaimError(error?.message || 'Fishing failed');
      void Promise.resolve(onRefreshProfile?.()).catch(() => {});
    } finally { fishingActionBusy.current = false; }
  };

  const startFishingCycle = async () => {
    if (fishingActionBusy.current || (fishCycleExists && !fishCycleClaimed)) return;
    fishingActionBusy.current = true;
    try {
      const saved = await onUpdateProfile({ playerAction: { type: 'fishing-cast' } });
      const cycle = saved?.player?.cosmo_fishing_cycle || saved?.cosmo_fishing_cycle;
      if (cycle) setPendingFishCycle(cycle);
      setHookNow(serverNow());
      setFishingResult(null);
      setShowFishingPopup(false);
    } catch (error) {
      setClaimError(error?.message || 'Fishing failed');
      void Promise.resolve(onRefreshProfile?.()).catch(() => {});
    } finally { fishingActionBusy.current = false; }
  };

  const dismissFishingPopup = async () => {
    setShowFishingPopup(false);
    if (profile?.cosmo_fishing_last_result && !profile?.cosmo_fishing_last_result_seen) {
      try { await onUpdateProfile?.({ playerAction: { type: 'fishing-seen' } }); }
      catch (error) { setClaimError(error?.message || 'Fishing failed'); }
    }
  };
  const profileLevel = Number(profile?.level ?? profile?.player_level ?? profile?.lvl ?? 1);
  const dailyUnlocked = profileLevel >= DAILY_UNLOCK_LEVEL;

  const taskStates = useMemo(() => {
    const locked = selectedDay > currentDay;
    return getDayTasks(selectedDay, lang)
      .map((task) => getTaskState(profile, task, selectedDay, currentDay, selectedClaimedTasks))
      .map((task) => locked ? {
        ...task,
        current: 0,
        complete: false,
        claimed: false,
        claimable: false,
        progressPct: 0,
        locked: true,
      } : { ...task, locked: false });
  }, [currentDay, lang, profile, selectedClaimedTasks, selectedDay]);

  const completedCount = taskStates.filter((task) => task.complete).length;
  const claimableCount = taskStates.filter((task) => task.claimable && !task.locked).length;
  const dayReadyToClaim = taskStates.length > 0 && taskStates.every((task) => task.complete && selectedClaimedTasks.includes(task.id));
  const dayClaimed = fullDays.includes(selectedDay);

  const claimTask = async (task) => {
    if (task.locked || !task.claimable || claimingTaskRef.current) return;
    claimingTaskRef.current = true;
    setClaimingTask(task.id);
    setClaimError('');

    try {
      const result = await onUpdateProfile({ playerAction: { type: 'daily-task', day: selectedDay, taskId: task.id } });
      if (!result?.alreadyClaimed) {
        setClaimRewardPopup({ title: 'Reward', items: buildClaimRewardItems(result?.reward || { xp: task.xp, energy: task.energyBonus, tentacles: task.tentacles, freeSpins: 1 }) });
        window.dispatchEvent(new Event('tutorial-daily-claim-complete'));
      }
    } catch (error) {
      console.error('[daily] claim failed', error);
      const message = lang === 'en' ? 'Reward was not claimed.' : lang === 'ru' ? 'Награда не получена.' : 'Нагороду не отримано.';
      setClaimError(`${message} ${error?.code || error?.message || 'UNKNOWN_ERROR'}`);
    } finally {
      claimingTaskRef.current = false;
      setClaimingTask(null);
    }
  };

  const claimDay = async () => {
    if (selectedDay > currentDay || !dayReadyToClaim || dayClaimed || claimingDay) return;
    setClaimingDay(true);
    setClaimError('');
    try {
      const result = await onUpdateProfile({ playerAction: { type: 'daily-day', day: selectedDay } });
      setClaimRewardPopup({ title: lang === 'en' ? 'Full day reward' : lang === 'ru' ? 'Приз за полный день' : 'Приз за повний день', items: buildClaimRewardItems(result?.reward || getDailyCompletionReward(selectedDay)) });
      window.dispatchEvent(new Event('tutorial-daily-claim-complete'));
    } catch (error) {
      console.error('[daily] day claim failed', error);
      const message = lang === 'en' ? 'Day was not claimed.' : lang === 'ru' ? 'День не засчитан.' : 'День не зараховано.';
      setClaimError(`${message} ${error?.code || error?.message || 'UNKNOWN_ERROR'}`);
    } finally {
      setClaimingDay(false);
    }
  };

  const claimWeeklyBonus = async (bonus) => {
    if (fullDays.length < bonus.fullDays || claimedBonuses.includes(bonus.fullDays) || claimingBonus) return;
    setClaimingBonus(bonus.fullDays);
    setClaimError('');
    try {
      await onUpdateProfile({ playerAction: { type: 'daily-bonus', fullDays: bonus.fullDays } });
      setClaimRewardPopup({ title: 'Weekly reward', items: buildClaimRewardItems(bonus.reward) });
    } catch (error) {
      console.error('[daily] weekly bonus claim failed', error);
      const message = lang === 'en' ? 'Weekly reward was not claimed.' : lang === 'ru' ? 'Недельная награда не получена.' : 'Тижневу нагороду не отримано.';
      setClaimError(`${message} ${error?.code || error?.message || 'UNKNOWN_ERROR'}`);
    } finally {
      setClaimingBonus(null);
    }
  };

  const claimStarterStep = async (step) => {
    const claimed = profile?.starter_guide_claimed || [];
    if (claimed.includes(step.id) || (!step.manualUpdate && step.progress(profile) < step.goal) || claimingGuide) return;
    setClaimingGuide(step.id);
    try {
      await onUpdateProfile({ playerAction: { type: 'guide-step', stepId: step.id } });
      setClaimRewardPopup({ title: 'Reward', items: buildClaimRewardItems(step.reward) });
    } finally {
      setClaimingGuide(null);
    }
  };

  const claimStarterFinal = async () => {
    const claimed = profile?.starter_guide_claimed || [];
    const allClaimed = STARTER_GUIDE_STEPS.every((step) => claimed.includes(step.id));
    if (!allClaimed || profile?.starter_guide_final_claimed || claimingGuide) return;
    setClaimingGuide('final');
    try {
      await onUpdateProfile({ playerAction: { type: 'guide-final' } });
      setClaimRewardPopup({ title: 'Reward', items: buildClaimRewardItems(STARTER_FINAL_REWARD) });
    } finally {
      setClaimingGuide(null);
    }
  };

  const dayMeta = Array.from({ length: DAY_COUNT }, (_, index) => {
    const day = index + 1;
    const claimed = claimedRewards[day] || [];
    const tasks = getDayTasks(day, lang);
    const states = tasks.map((task) => getTaskState(profile, task, day, currentDay, claimed));
    const completed = fullDays.includes(day) || states.every((task) => task.complete && claimed.includes(task.id));
    const claimable = day <= currentDay && (
      states.some((task) => task.claimable)
      || (!fullDays.includes(day) && states.every((task) => task.complete && claimed.includes(task.id)))
    );
    return { day, completed, claimable };
  }).map((item) => {
    // Future days remain viewable, but their task rows are locked by taskStates.
    const locked = false;
    return { ...item, locked, claimable: !locked && item.claimable };
  });

  const newbieProgress = getNewbieProgress(profile);
  const extraTabLabel = lang === 'en' ? 'partners' : lang === 'ru' ? 'партнёры' : 'партнери';
  const extraTitle = lang === 'en' ? 'Partners' : lang === 'ru' ? 'Партнёры' : 'Партнери';
  const questNotifications = getQuestRewardNotifications(profile);

  const headerEyebrow = isEventsMode
    ? 'live events'
      : activeTab === 'event'
      ? (lang === 'en' ? '7 days event' : lang === 'ru' ? '7 дней событий' : '7 днів подій')
      : activeTab === 'newbie'
        ? (lang === 'en' ? 'newbie quest' : lang === 'ru' ? 'квест новичка' : 'квест новачка')
        : extraTabLabel;
  const headerTitle = isEventsMode
    ? eventScene === 'space-fishing'
      ? (COSMO_FISHING_UI[lang] || COSMO_FISHING_UI.ua).title
      : localizeCopy({ uk: 'Івенти', en: 'Events', ru: 'Ивенты' }, lang)
    : activeTab === 'event'
      ? (lang === 'en' ? '7 days event' : lang === 'ru' ? '7 дней событий' : '7 днів подій')
      : activeTab === 'newbie'
        ? (lang === 'en' ? 'Newbie Quest' : lang === 'ru' ? 'Квест новичка' : 'Квест новачка')
        : extraTitle;
  const yesterdayKey = profile?.previousDateKey || '';
  const missedYesterdayCheckin = profile?.daily_event_last_claim !== todayKey && profile?.daily_event_last_claim !== yesterdayKey;
  const isFishingHeader = isEventsMode && eventScene === 'space-fishing';
  const isRaidBossScene = isEventsMode && eventScene === 'raid-boss';
  const headerMinHeightClass = isFishingHeader ? 'min-h-0 items-start' : 'min-h-[168px] items-center';

  return (
    <div className={`relative flex h-full min-h-0 w-full flex-col text-[#142016] ${isRaidBossScene ? 'px-0 py-0' : 'px-2 py-2'}`}>
      <div className="pointer-events-none absolute inset-x-3 top-2 h-20 rounded-full bg-[#8dff32]/10 blur-2xl" />
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">
        {!isRaidBossScene && (isFishingHeader ? (
          <div className="relative mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 overflow-hidden rounded-none bg-[#07100b] px-2 py-2">
            <div className="min-w-0 text-left">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#9dff43]">{headerEyebrow}</p>
              <h2 className="font-sans text-[23px] font-black uppercase leading-none text-[#f8ffe8] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">{headerTitle}</h2>
            </div>
            <button
              type="button"
              data-tutorial-target={activeTab === 'newbie' ? 'newbie-close' : undefined}
              onClick={onClose}
              className="relative z-[60] flex h-8 w-8 items-center justify-center overflow-hidden bg-transparent transition hover:brightness-110"
            >
              <X className="relative z-[1] h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <div
            className={`relative mb-2 flex ${headerMinHeightClass} justify-between gap-2 overflow-hidden rounded-none px-2 py-2 ${isEventsMode ? 'bg-[#07100b]' : 'bg-[linear-gradient(180deg,rgba(12,20,10,0.96)_0%,rgba(4,7,4,0.96)_100%)]'}`}
          >
            {!isEventsMode && <button type="button" data-tutorial-target={activeTab === 'newbie' ? 'newbie-close' : undefined} onClick={onClose} className="absolute left-2 top-2 z-30 rounded-md border border-[#28ee90] bg-[#081008]/90 px-3 py-2 font-mono text-[12px] font-bold text-[#d8ff84]">← {lang === 'en' ? 'Back' : 'Назад'}</button>}
            {!isEventsMode && activeTab === 'event' ? (
              <>
                <img
                  src={dailyEventBannerImg}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,5,0.08)_0%,rgba(5,7,5,0.24)_45%,rgba(5,7,5,0.78)_100%)]" />
              </>
            ) : null}
            {!isEventsMode && activeTab === 'extra' ? (
              <>
                <img
                  src={extraQuestsBannerImg}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,5,0.08)_0%,rgba(5,7,5,0.24)_45%,rgba(5,7,5,0.78)_100%)]" />
              </>
            ) : null}
            {!isEventsMode && activeTab === 'newbie' ? (
              <>
                <img
                  src={newbieQuestBannerImg}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,5,0.04)_0%,rgba(5,7,5,0.18)_50%,rgba(5,7,5,0.82)_100%)]" />
              </>
            ) : null}
            {isEventsMode && eventScene === null ? (
              <>
                <FirstFrameImage
                  preview={eventsBannerImg} src={eventsBannerFull}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,5,0.10)_0%,rgba(5,7,5,0.28)_45%,rgba(5,7,5,0.76)_100%)]" />
              </>
            ) : null}
            <div className={`relative z-10 ${isEventsMode ? `absolute left-3 ${isFishingHeader ? 'top-2' : 'top-1'} text-left` : ''}`}>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#9dff43]">{headerEyebrow}</p>
              <h2 className="font-sans text-[23px] font-black uppercase leading-none text-[#f8ffe8] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">{headerTitle}</h2>
            </div>
            {isEventsMode && (            <button
              type="button"
              data-tutorial-target={activeTab === 'newbie' ? 'newbie-close' : undefined}
              onClick={onClose}
              className={`relative z-[60] flex h-8 w-8 items-center justify-center overflow-hidden bg-transparent transition hover:brightness-110 ${isEventsMode ? `absolute right-2 ${isFishingHeader ? 'top-1' : 'top-0'}` : ''}`}
            >
              <X className="relative z-[1] h-4 w-4 text-white" />
            </button>)}
          </div>
        ))}

        {!isEventsMode ? (
          <div className="mb-2 grid grid-cols-3 gap-1.5 sm:gap-2">
            <BigTabButton active={activeTab === 'event'} label={lang === 'en' ? '7 days event' : lang === 'ru' ? '7 дней событий' : '7 днів подій'} onClick={() => setActiveTab('event')} alert={questNotifications.daily} />
            <BigTabButton active={activeTab === 'newbie'} label={lang === 'en' ? 'newbie quest' : lang === 'ru' ? 'квест новичка' : 'квест новачка'} onClick={() => setActiveTab('newbie')} alert={questNotifications.newbie} tutorialTarget="newbie-tab" />
            <BigTabButton active={activeTab === 'extra'} label={extraTabLabel} onClick={() => setActiveTab('extra')} alert={questNotifications.extra || hasNewPartners} />
          </div>
        ) : null}

        <div
          className={`h-0 min-h-0 flex-1 overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isFishingHeader ? 'overflow-hidden pr-0' : 'overflow-y-auto overscroll-contain touch-pan-y'} ${isRaidBossScene ? 'pr-0' : 'pr-1'}`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: isRaidBossScene || isFishingHeader ? '0' : 'calc(72px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {isEventsMode ? (
            <div className={isFishingHeader ? 'h-full min-h-0' : 'space-y-2'}>
              {eventScene === null ? (
                EVENT_PLACEHOLDERS.map((event) => (
                  (() => {
                    const levelLocked = profileLevel < event.requiredLevel;
                    const guildLocked = event.guildOnly && !profile?.clan_id && !profile?.clan_name;
                    const eventLocked = levelLocked || guildLocked || eventPhase(event.id, hookNow) !== 'active';
                    const lockHint = !levelLocked && !guildLocked
                      ? Object.fromEntries(['uk','en','ru'].map(language=>[language,eventCountdown(event.id, hookNow, language)]))
                      : levelLocked
                      ? { uk: `Відкриється на ${event.requiredLevel} рівні`, en: `Unlocks at level ${event.requiredLevel}`, ru: `Откроется на ${event.requiredLevel} уровне` }
                      : { uk: 'Доступно учасникам гільдій від 18 рівня', en: 'Available to guild members level 18+', ru: 'Доступно участникам гильдий от 18 уровня' };
                    return <Fragment key={event.id}><button
                    key={event.id}
                    type="button"
                    disabled={eventLocked}
                    onClick={() => { const openEvent = event.id === 'raid-boss' ? onOpenRaidBoss : onOpenSpaceFishing; if (openEvent) openEvent(); else setEventScene(event.id); }}
                    className={`w-full text-left ${eventLocked ? 'cursor-not-allowed' : ''}`}
                  >
                    <MarkerFrame
                      className="relative overflow-hidden rounded-[16px]"
                      innerClassName="grid grid-cols-[84px_minmax(0,1fr)] gap-3 px-2 py-2 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-4 sm:px-3"
                      variant="transparent"
                    >
                      {event.id === 'space-fishing' && !eventLocked ? <FishingBeacon profile={profile} /> : null}
                      <div className="flex h-[100px] w-[84px] overflow-hidden rounded-[8px] border border-[#28ee90] bg-[#0a1108] sm:h-[110px] sm:w-[92px]">
                        <FirstFrameImage preview={event.fullImage ? event.image : undefined} src={event.fullImage || event.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-[18px] font-black uppercase leading-none text-[#9aa493] opacity-75">
                          {event.id === 'raid-boss' ? <span className="friday13-event-heading"><span className="friday13-boss-name">{getFriday13BossName(lang)}</span><span className="friday13-event-name">13<sup>th</sup></span></span> : localizeCopy(event.title, lang)}
                        </p>
                        {event.id !== 'space-fishing' ? <p className="mt-1 font-mono text-[10px] font-black text-[#ff5148]">{eventCountdown(event.id, hookNow, lang)}</p> : null}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {(event.rewardPreview || []).map((reward, idx) => {
                            const label = reward.qtyI18n ? (reward.qtyI18n[lang] || reward.qtyI18n.ua || reward.qty) : reward.qty;
                            const icon = reward.type === 'strength' ? getResourceIcon('strength') : reward.type === 'xp' ? getResourceIcon('xp') : poisonIcon;
                            return (
                              <span key={`${event.id}-reward-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-[#10140f] px-2 py-1 font-mono text-[10px] text-[#d9f6b8]">
                                <img src={icon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-4 w-4 object-contain" />
                                <span>{label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {levelLocked || guildLocked ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050805]/65 px-4 text-center backdrop-blur-[3px]"><ScrambleLockHint text={localizeCopy(lockHint, lang)} /></div> : null}
                    </MarkerFrame>
                  </button>{event.id === 'raid-boss' ? <EventPoisonShop onSyncProfile={onSyncProfile} profile={profile} onRefreshProfile={onRefreshProfile} lang={lang} /> : null}</Fragment>
                  })()
                ))
              ) : eventScene === 'raid-boss' ? (
                <div className="h-full min-h-[520px] overflow-hidden">
                  <Suspense fallback={<div className="flex h-full items-center justify-center text-[#d7ff94]">…</div>}>
                    <BossPanel profile={profile} onAddXp={() => {}} onRefreshProfile={onRefreshProfile} onUpdateProfile={onUpdateProfile} onBackToEvents={() => { setEventScene(null); onBackToEvents?.(); }} raidMode />
                  </Suspense>
                </div>
              ) : eventScene === 'space-fishing' ? (
                <div className="relative h-full min-h-0">
                  <div className="relative h-full min-h-0 overflow-hidden">
                    <video
                      src={fishVideoEnabled ? cosmoFishBg : undefined}
                      poster={eventSpaceFishingImg}
                      preload="metadata"
                      className="absolute inset-0 h-full w-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,10,0.12)_0%,rgba(2,4,10,0.38)_100%)]" />

                    <div className="absolute left-2 right-2 top-1 z-10">
                      <div className="relative mb-1 h-8 w-full rounded-none border border-[#28ee90]">
                        <button
                          type="button"
                          onClick={() => setFishInventoryOpen((v) => !v)}
                          className="relative z-[1] flex h-8 w-full items-center justify-between rounded-none bg-[#050b08]/72 px-2.5 font-mono text-[10px] font-black uppercase text-[#d7ff94]"
                        >
                          <span>{localizeCopy({ uk: 'Інвентар риби', en: 'Fish inventory', ru: 'Инвентарь рыбы' }, lang)}</span>
                          <span>{fishInventoryOpen ? '▲' : '▼'}</span>
                        </button>
                      </div>
                      <div className={`relative overflow-hidden rounded-none transition-all duration-300 ${fishInventoryOpen ? 'max-h-[240px] bg-black/80 p-1.5 opacity-100 backdrop-blur-[6px]' : 'max-h-0 p-0 opacity-0'}`}>
                        {fishInventoryOpen ? <MarkerBorder /> : null}
                        <div className="grid min-w-0 grid-cols-4 gap-1">
                          {COSMO_FISH_ORDER.map((rarity) => (
                            <div key={rarity} className="relative z-[1] h-[88px] w-full min-w-0 overflow-hidden rounded-none">
                              <img
                                src={COSMO_FISH_ASSETS[rarity]}
                                alt={rarity}
                                loading="lazy"
                                decoding="async"
                                className={`h-full w-full object-contain p-0.5 pb-4 ${Number(fishInventory[rarity] || 0) > 0 ? '' : 'brightness-0 opacity-70'}`}
                              />
                              <span className="absolute right-1 top-1 z-10 max-w-[calc(100%-8px)] truncate rounded-none bg-[#0d1d0a] px-1 font-mono text-[9px] font-black text-[#d7ff94]">
                                {Number(fishInventory[rarity] || 0)}
                              </span>
                              <motion.span
                                className="absolute inset-x-0 bottom-0.5 truncate px-0.5 text-center font-mono text-[clamp(7px,2vw,9px)] font-black uppercase"
                                style={getRarityTextStyle(rarity, Number(fishInventory[rarity] || 0) <= 0)}
                                animate={{
                                  textShadow:
                                    rarity === 'black_hole'
                                      ? [
                                          '0 0 3px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.9), 0 0 14px rgba(216,243,255,0.75)',
                                          '1px 0 4px rgba(255,255,255,0.98), 0 0 10px rgba(255,255,255,0.95), 0 0 18px rgba(216,243,255,0.85)',
                                          '-1px 0 4px rgba(255,255,255,0.98), 0 0 10px rgba(255,255,255,0.95), 0 0 18px rgba(216,243,255,0.85)',
                                          '0 0 3px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.9), 0 0 14px rgba(216,243,255,0.75)',
                                        ]
                                      : [
                                          '0 0 4px rgba(157,255,120,0.28)',
                                          '1px 0 7px rgba(157,255,120,0.38)',
                                          '-1px 0 7px rgba(157,255,120,0.38)',
                                          '0 0 4px rgba(157,255,120,0.28)',
                                        ],
                                }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                {fishRarityName[rarity] || rarity}
                              </motion.span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFishShopOpen(false); setEventScene(null); onBackToEvents?.(); }}
                        className="relative mt-2 flex min-h-10 items-center gap-1 bg-black/65 px-3 font-mono text-xs font-bold text-[#e6f7d4]"
                      >
                        ← {lang === 'en' ? 'Back' : 'Назад'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFishShopOpen((v) => !v)}
                      className="absolute right-3 top-1/2 z-20 flex h-[58px] w-[58px] -translate-y-1/2 items-center justify-center"
                    >
                      <img src={fishExchangeIcon} alt="Fish exchange" loading="lazy" decoding="async" className="h-[58px] w-[58px] scale-[2] object-contain" />
                    </button>

                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-3">
                      <ClaimStateButton
                        tone={fishCycleWaiting ? 'gray' : 'yellow'}
                        onClick={() => {
                          if (!fishCycleExists) {
                            void startFishingCycle();
                            return;
                          }
                          if (fishCycleHookActive) {
                            void resolveFishing(true, fishCycle);
                            return;
                          }
                          if (fishCycleReadyPullOut) {
                            void resolveFishing(false, fishCycle);
                          }
                        }}
                        disabled={fishCycleWaiting}
                        label={!fishCycleExists ? fishingUi.cast : fishCycleHookActive ? fishingUi.hook : fishCycleReadyPullOut ? fishingUi.pullOut : `${fishingUi.waiting} ${fishCycleTimerText}`}
                        className="w-[268px] max-w-full"
                      />
                    </div>
                    {showFishingPopup && fishingResult ? (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-3" onClick={event => { if (event.target === event.currentTarget) void dismissFishingPopup(); }}>
                        <div className="relative w-full max-w-[340px] overflow-hidden bg-[linear-gradient(180deg,#0f170d_0%,#070a06_100%)] p-3">
                          <MarkerBorder />
                          <button
                            type="button"
                            onClick={() => void dismissFishingPopup()}
                            className="absolute right-2 top-2 z-[2] rounded-full bg-[#182015] p-1 text-[#e9ffd0]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="relative z-[1] font-sans text-[18px] font-black uppercase text-[#f6ffe8]">{fishingUi.reward}</p>
                          {fishingResult.caught ? (
                            <div className="relative z-[1] mt-2 flex flex-col items-center">
                              <motion.img
                                src={COSMO_FISH_ASSETS[fishingResult.rarity]}
                                alt={fishingResult.rarity}
                                className="h-36 w-36 object-contain"
                                animate={{ y: [0, -5, 0], rotate: [0, -2, 2, 0], scale: [1, 1.03, 1] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                              />
                              <p className="mt-2 font-mono text-[11px] font-black">
                                <span className="text-[#d7ff94]">{fishingUi.caught}: </span>
                                <span style={getRarityTextStyle(fishingResult.rarity)}>{fishRarityName[fishingResult.rarity] || fishingResult.rarity}</span>
                              </p>
                            </div>
                          ) : (
                            <p className="relative z-[1] mt-2 font-mono text-[11px] text-[#d7ff94]">{fishingUi.noFish}</p>
                          )}
                          <p className="relative z-[1] mt-2 font-mono text-[10px] text-[#b9d59d]">{fishingUi.bonus}: {fishingResult.bonusLabel}</p>
                          {fishingResult.pumpkins > 0 && <div className="relative z-[1] mt-3 flex items-center justify-center gap-2 rounded-lg border border-orange-400/60 bg-black/40 p-2"><img src={pumpkinIcon} alt="" className="h-10 w-10 object-contain"/><span className="font-mono text-lg font-black text-orange-300">+{fishingResult.pumpkins}</span></div>}
                        </div>
                      </div>
                    ) : null}
                    {fishShopOpen ? (
                      <div className="absolute bottom-3 left-3 right-3 top-1 z-30 overflow-y-auto rounded-none bg-[linear-gradient(180deg,rgba(15,23,13,0.96)_0%,rgba(7,10,6,0.96)_100%)] px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <button
                          type="button"
                          onClick={() => setFishShopOpen(false)}
                          className="absolute right-2 top-2 rounded-none bg-[#182015] p-1 text-[#e9ffd0]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="font-sans text-[20px] font-black uppercase text-[#f6ffe8]">{fishCopy.title}</p>
                        <p className="mt-1 font-mono text-[10px] text-[#b9d59d]">{fishCopy.description}</p>
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9dff43]">{fishCopy.singleExchangeTitle}</p>
                        <div className="mt-2 space-y-1.5">
                          {COSMO_FISH_ORDER.map((rarity) => {
                            const count = Number(fishInventory[rarity] || 0);
                            const disabled = count <= 0;
                            return (
                              <div key={rarity} className={`relative overflow-hidden rounded-none px-2 py-1.5 ${disabled ? 'bg-[#0a1009]/70' : 'bg-[#0d160c]'}`}>
                                <MarkerBorder />
                                <div className="relative z-[1] flex items-center gap-2">
                                  <img
                                    src={COSMO_FISH_ASSETS[rarity]}
                                    alt={rarity}
                                    className={`h-12 w-12 object-contain ${disabled ? 'brightness-75 opacity-45' : ''}`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`truncate font-mono text-[9px] font-black ${disabled ? 'opacity-65' : ''}`}
                                      style={
                                        rarity === 'black_hole'
                                          ? { color: COSMO_BLACK_HOLE_STYLE.base, textShadow: `0 0 3px ${COSMO_BLACK_HOLE_STYLE.glow}, 0 0 8px ${COSMO_BLACK_HOLE_STYLE.glow}, 0 0 14px ${COSMO_BLACK_HOLE_STYLE.accent}` }
                                          : { color: COSMO_FISH_RARITY_COLORS[rarity] || '#d4e9be' }
                                      }
                                    >
                                      {fishRarityName[rarity]}
                                    </p>
                                    <p className={`font-mono text-[8px] ${disabled ? 'text-[#546351]' : 'text-[#9dff43]'}`}>
                                      {count > 0 ? `x${count} · ready` : 'x0 · missing'}
                                    </p>
                                  </div>
                                  <ClaimStateButton
                                    disabled={disabled}
                                    onClick={() => exchangeFish(rarity)}
                                    tone={disabled ? 'gray' : 'green'}
                                    textClassName={disabled ? 'text-[#8a9188]' : 'text-[#161f0d]'}
                                    className="w-[92px]"
                                    label={fishCopy.exchange}
                                  />
                                </div>
                                <p className={`relative z-[1] mt-1 font-mono text-[8px] leading-tight ${disabled ? 'text-[#5a6b57]' : 'text-[#b9d59d]'}`}>
                                  {renderComboRewardText((fishCopy.singleRewards || {})[rarity])}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9dff43]">{fishCopy.comboExchangeTitle}</p>
                        <div className="mt-1 space-y-2">
                          {COSMO_COMBO_ORDER.map((combo) => {
                            const canExchange = combo.fishes.every((rarity) => Number(fishInventory[rarity] || 0) > 0);
                            return (
                              <div key={combo.key} className={`relative overflow-hidden rounded-none px-2 py-1.5 ${canExchange ? 'bg-[#0d160c]' : 'bg-[#0a1009]/70'}`}>
                                <MarkerBorder />
                                <div className="relative z-[1] grid grid-cols-[minmax(0,1fr)_78px] items-center gap-1.5">
                                  <div className="grid min-w-0 grid-cols-4 gap-1">
                                    {combo.fishes.map((rarity) => {
                                      const count = Number(fishInventory[rarity] || 0);
                                      const available = count > 0;
                                      return (
                                        <div key={`${combo.key}-${rarity}`} className="relative h-12 w-12">
                                          <img
                                            src={COSMO_FISH_ASSETS[rarity]}
                                            alt={rarity}
                                            className={`h-12 w-12 shrink-0 rounded-none object-contain ${available ? '' : 'brightness-75 opacity-45'}`}
                                          />
                                          <span className={`absolute -right-1 -top-1 rounded-none px-1 font-mono text-[8px] font-black ${available ? 'bg-[#0d1d0a] text-[#d7ff94]' : 'bg-[#1f2620] text-[#8ea38c]'}`}>
                                            {count}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <ClaimStateButton
                                    disabled={!canExchange}
                                    onClick={() => exchangeCombo(combo)}
                                    tone={canExchange ? 'green' : 'gray'}
                                    textClassName={canExchange ? 'text-[#161f0d]' : 'text-[#8a9188]'}
                                    className="w-[82px] self-center"
                                    label={fishCopy.exchange}
                                  />
                                </div>
                                <p className={`relative z-[1] mt-1 font-mono text-[8px] leading-tight ${canExchange ? 'text-[#b9d59d] [text-shadow:0_0_6px_rgba(157,255,67,0.18)]' : 'text-[#5a6b57]'}`}>
                                  {renderComboRewardText((fishCopy.comboRewards || {})[combo.key])}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 font-mono text-[10px] text-[#b9d59d]">{fishCopy.trashNote}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-[16px] border border-[#28ee90] bg-[linear-gradient(180deg,#0f170d_0%,#070a06_100%)] px-3 py-3">
                  <button type="button" onClick={() => setEventScene(null)} className="mb-2 font-mono text-[10px] uppercase text-[#9dff43]">← Back</button>
                  <p className="font-sans text-[20px] font-black uppercase text-[#f6ffe8]">{localizeCopy(EVENT_PLACEHOLDERS[0].title, lang)}</p>
                  <p className="mt-2 font-mono text-[10px] text-[#b9d59d]">{localizeCopy({ uk: 'Сцена в розробці.', en: 'Scene in development.', ru: 'Сцена в разработке.' }, lang)}</p>
                </div>
              )}
            </div>
          ) : activeTab === 'newbie' ? (
            <NewbieQuestTab suspended={suspended} profile={profile} onUpdateProfile={onUpdateProfile} onGo={(quest) => onGoToTask?.({ newbieQuestId: quest.id })} />
          ) : activeTab === 'extra' ? (
            <div className="space-y-2">
              {partnerMessage ? <p role="status" className="rounded border border-[#d78158] p-2 font-mono text-[10px] text-[#ffc7a8]">{partnerMessage}</p> : null}
              {partnerTasks.map((partner) => (
                <div key={partner.id} className="flex items-center gap-2 rounded-[10px_8px_11px_7px] border border-[#28ee90] bg-[#20271d] p-2 text-[#e2ebd8]">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#35402d]"><img src={partner.icon} alt="" className="h-full w-full object-cover" /></div>
                  <div className="min-w-0 flex-1"><p className="font-sans text-[12px] font-black leading-tight">{localizeCopy(partner.names, lang)}</p>{<p className="mt-1 text-[9px] text-[#a6b09c]">{lang === 'uk' ? 'Підпишись' : lang === 'ru' ? 'Подпишись' : 'Subscribe'}</p>}<div className="mt-1">{partner.rewardItems?.length ? formatPartnerRewards(partner.rewardItems, lang) : <p className="font-mono text-[10px] font-bold text-[#a6b09c]">{localizeCopy(partner.rewards, lang)}</p>}</div></div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <GameTextureButton type="button" tone={profile?.partner_claims?.[partner.id] || partnerClaimedIds[partner.id] ? 'gray' : 'green'} disabled={Boolean(partnerBusyId || profile?.partner_claims?.[partner.id] || partnerClaimedIds[partner.id])} onClick={() => openedPartnerIds[partner.id] && partner.verificationType && partner.rewardItems?.length ? claimPartner(partner) : openPartner(partner)} className="h-11 w-[84px]"><span className="relative z-10 font-sans text-[10px] font-black uppercase text-[#171307]">{profile?.partner_claims?.[partner.id] || partnerClaimedIds[partner.id] ? (lang === 'uk' ? 'Отримано ✓' : lang === 'ru' ? 'Получено ✓' : 'Claimed ✓') : partnerBusyId === partner.id ? (lang === 'uk' ? 'Перевіряємо…' : lang === 'ru' ? 'Проверяем…' : 'Checking…') : openedPartnerIds[partner.id] && partner.verificationType && partner.rewardItems?.length ? (partner.verificationMode === 'visit' ? (lang === 'uk' ? 'Перевірити' : lang === 'ru' ? 'Проверить' : 'Check') : (lang === 'uk' ? 'Перевірити' : lang === 'ru' ? 'Проверить' : 'Check')) : (lang === 'uk' ? 'Відкрити' : lang === 'ru' ? 'Открыть' : 'Open')}</span></GameTextureButton>
                    {openedPartnerIds[partner.id] && !profile?.partner_claims?.[partner.id] && !partnerClaimedIds[partner.id] ? <button type="button" onClick={() => openPartner(partner)} className="font-mono text-[8px] text-[#a6d879] underline">{lang === 'uk' ? 'Відкрити знову' : lang === 'ru' ? 'Открыть снова' : 'Open again'}</button> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : !dailyUnlocked ? (
            <div className="rounded-[18px] bg-[linear-gradient(180deg,#10170d_0%,#071006_100%)] p-4">
              <p className="font-sans text-[14px] font-black uppercase text-[#f8ffe8]">
                Daily Tasks unlock at level {DAILY_UNLOCK_LEVEL}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex gap-1 rounded-[18px] bg-[#070b06]/75 p-1.5">
                {dayMeta.map((day) => (
                  <DayButton
                    key={day.day}
                    day={day.day}
                    active={selectedDay === day.day}
                    locked={day.locked}
                    claimable={day.claimable}
                    lang={lang}
                    onClick={() => setSelectedDay(day.day)}
                  />
                ))}
              </div>

              <div className="space-y-2">
                {claimError ? <p role="alert" className="border border-[#ff6c65] bg-[#2b1010] p-2 text-center font-mono text-[11px] text-[#ffd5d0]">{claimError}</p> : null}
                {taskStates.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    locked={task.locked}
                    onClaim={() => claimTask(task)}
                    onGo={() => onGoToTask?.(task)}
                    claiming={claimingTask === task.id}
                    missedCheckin={task.baseId === 'checkin' && selectedDay < currentDay && !task.claimed && !task.claimable}
                    tutorialTarget={task.claimable ? 'daily-first-claim' : undefined}
                    language={lang}
                  />
                ))}
              </div>

              <div className="mt-3">
                <p className="mb-2 text-center font-mono text-[10px] text-[#d8ff84]">{lang === 'en' ? 'Full day prize' : lang === 'ru' ? 'Приз за полный день' : 'Приз за повний день'}: +140 {lang === 'en' ? 'energy' : lang === 'ru' ? 'энергии' : 'енергії'} · +{getDailyCompletionReward(selectedDay).tentacles} {lang === 'en' ? 'tentacles' : lang === 'ru' ? 'щупалец' : 'щупалець'}</p>
                <ClaimStateButton
                  tone={dayClaimed ? 'gray' : dayReadyToClaim ? 'green' : 'gray'}
                  onClick={claimDay}
                  disabled={!dayReadyToClaim || dayClaimed || claimingDay}
                  label={claimingDay ? '...' : dayClaimed ? 'Day Claimed' : 'Claim Day'}
                  textClassName={dayReadyToClaim && !dayClaimed ? 'text-[#13200e]' : 'text-[#878f86]'}
                />
              </div>
              {claimableCount ? (
                <div className="mt-3 flex items-center gap-2 rounded-[16px] bg-[#fff8f1] px-3 py-2 text-[#172016]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff5757] text-white">
                    <Gift className="h-4 w-4" />
                  </span>
                  <p className="font-sans text-[12px] font-black">
                    {lang === 'en'
                      ? `${claimableCount} reward${claimableCount === 1 ? '' : 's'} can be claimed today.`
                      : lang === 'ru'
                        ? `${claimableCount} ${claimableCount === 1 ? 'награду' : 'наград'} можно забрать сегодня.`
                        : `${claimableCount} ${claimableCount === 1 ? 'нагороду' : 'нагород'} можна забрати сьогодні.`}
                  </p>
                </div>
              ) : null}

              <WeeklyProgress
                fullDays={fullDays.length}
                claimedBonuses={claimedBonuses}
                onClaimBonus={claimWeeklyBonus}
                onPreviewBonus={(bonus) => setWeeklyRewardPreview({ title: bonus.label, items: buildClaimRewardItems(bonus.reward) })}
                claimingBonus={claimingBonus}
              />
            </>
          )}
        </div>
      </div>
      <RewardPopup
        language={profile?.language || 'uk'}
        open={!suspended && Boolean(claimRewardPopup)}
        title={claimRewardPopup?.title || 'Reward'}
        items={claimRewardPopup?.items || []}
        tutorialClaimTarget
        onClose={() => {
          setClaimRewardPopup(null);
          window.dispatchEvent(new Event('tutorial-reward-closed'));
        }}
      />
      <RewardPopup
        language={profile?.language || 'uk'}
        open={!suspended && Boolean(weeklyRewardPreview)}
        title={weeklyRewardPreview?.title || 'Weekly reward'}
        items={weeklyRewardPreview?.items || []}
        confirmLabel={profile?.language === 'ru' ? 'Закрыть' : profile?.language === 'en' ? 'Close' : 'Закрити'}
        onClose={() => setWeeklyRewardPreview(null)}
      />
    </div>
  );
}




export function warmFirstFrame() {
  return warmFirstFrameImages([eventsBannerFull, '/friday13/raid-boss-event-avatar.webp', eventSpaceFishingImg, dailyEventBannerImg]);
}
