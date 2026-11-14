import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import nearIcon from '@/assets/ui/near-logo.svg';
import tonIcon from '@/assets/ui/ton-logo.svg';
import starsCurrencyIcon from '@/assets/ui/star1.png';
import starterOfferBox from '@/assets/box/Starter Offer.png';
import firstBossOfferBox from '@/assets/box/First Boss Offer.png';
import weeklyOfferBox from '@/assets/box/Weekly Offer.png';
import bossDamagePackBox from '@/assets/box/Boss Damage Pack.png';
import dailyToxicPackBox from '@/assets/box/Daily Toxic Pack.png';
import progressPackBox from '@/assets/box/Progress Pack.png';
import poisonPackWeeklyBox from '@/assets/box/Poison Pack Weekly.png';
import spinBox from '@/assets/box/Spin.png';
import gemBox50 from '@/assets/shop/box-50.png';
import gemBox120 from '@/assets/shop/box-120.png';
import gemBox300 from '@/assets/shop/box-300.png';
import gemBox700 from '@/assets/shop/box-700.png';
import gemBox1500 from '@/assets/shop/box-1500.png';
import gemBox3500 from '@/assets/shop/box-3500.png';
import pack1 from '@/assets/shop/pack1.png';
import pack2 from '@/assets/shop/pack2.png';
import pack3 from '@/assets/shop/pack3.png';
import pack4 from '@/assets/shop/pack4.png';
import pack5 from '@/assets/shop/pack5.png';
import pack6 from '@/assets/shop/pack6.png';
import energy25Ui from '@/assets/ui/energy+25.png';
import energy50Ui from '@/assets/ui/energy+50.png';
import energy100Ui from '@/assets/ui/energy+100.png';
import poisonSmallUi from '@/assets/skills/small-poison.png';
import poisonMediumUi from '@/assets/skills/medium-poison.png';
import poisonLargeUi from '@/assets/skills/large-poison.png';
import bossKey1 from '@/assets/boss/boss-keys/key-1.png';
import bossKey2 from '@/assets/boss/boss-keys/key-2.png';
import bossKey3 from '@/assets/boss/boss-keys/key-3.png';
import bossKey4 from '@/assets/boss/boss-keys/key-4.png';
import bossKey5 from '@/assets/boss/boss-keys/key-5.png';
import bossKey6 from '@/assets/boss/boss-keys/key-6.png';
import bossKey7 from '@/assets/boss/boss-keys/key-7.png';
import bossKey8 from '@/assets/boss/boss-keys/key-8.png';
import spinx1Ui from '@/assets/ui/spinx1.png';
import spinx5Ui from '@/assets/ui/spinx5.png';
import shopBanner from '@/assets/ui/shop-b.png';
import GameTextureButton from './GameTextureButton';
import MarkerFrame from './MarkerFrame';
import LootBoxModal from './LootBoxModal';
import PaymentMethodPicker from './PaymentMethodPicker';
import { getResourceIcon } from '@/lib/resourceIcons';
import { GEM_SHOP_PACKS, getPaidEnergyPack, getPaidPoisonPack, PAID_CONSUMABLE_PACKS, SHOP_PAYMENT_METHODS } from '@/lib/shopCatalog';
import { openBox } from '@/lib/lootBoxes';
import { SHOP_PACK_INFO, PACK_INFO_LABELS } from '@/lib/shopPackInfo';
import { getPaymentRates, getShopConfig } from '@/services/paymentsApi';
import { GAME_CONFIG } from '@/lib/gameConfig';
import { dailyShopOffers } from '@/lib/dailyShopOffers';
import { DEFAULT_EQUIPMENT_ITEMS, localizeEquipmentItemName } from './equipmentData';
import { isTelegramPlatform, isWebPlatform } from '@/lib/platform/config';

const BOSS_KEY_ICONS = [bossKey1, bossKey2, bossKey3, bossKey4, bossKey5, bossKey6, bossKey7, bossKey8];

function dailyOffers(profile, dateKey) {
  return dailyShopOffers(profile, dateKey).map((offer) => {
    if (offer.kind === 'poison') return { ...offer, icon: { 'small-poison': poisonSmallUi, 'medium-poison': poisonMediumUi, 'large-poison': poisonLargeUi }[offer.poisonId] };
    if (offer.kind === 'energy') return { ...offer, icon: { 25: energy25Ui, 50: energy50Ui, 100: energy100Ui }[offer.qty] };
    if (offer.kind === 'equipment') return { ...offer, item: DEFAULT_EQUIPMENT_ITEMS.find((item) => item.id === offer.item.id) || offer.item };
    return offer;
  });
}
function randInt(min, max) {
  const low = Math.ceil(Number(min || 0));
  const high = Math.floor(Number(max || 0));
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function pickWeighted(rows = []) {
  const total = rows.reduce((sum, row) => sum + Number(row.weight || 0), 0);
  let roll = Math.random() * total;
  for (const row of rows) {
    roll -= Number(row.weight || 0);
    if (roll <= 0) return row;
  }
  return rows[rows.length - 1] || null;
}

const SHOP_PACK_REWARDS = {
  pack_poison: {
    guaranteed: [
      { type: 'weapon', id: 'satchel', qty: 10 },
      { type: 'weapon', id: 'f1', qty: 4 },
      { type: 'weapon', id: 'c4', qty: 1 },
      { type: 'tentacles', qty: 750 },
    ],
    bonus: [
      { weight: 35, type: 'weapon', id: 'c4', qty: 1 },
      { weight: 30, type: 'weapon', id: 'satchel', qty: 5 },
      { weight: 20, type: 'energy', qty: [20, 40] },
      { weight: 15, type: 'spin', qty: 1 },
    ],
  },
  pack_boss_damage: {
    guaranteed: [
      { type: 'energy', qty: 150 },
      { type: 'tentacles', qty: 3500 },
      { type: 'weapon', id: 'satchel', qty: 15 },
      { type: 'weapon', id: 'f1', qty: 6 },
      { type: 'weapon', id: 'c4', qty: 2 },
      { type: 'spin', qty: 1 },
    ],
    bonus: [
      { weight: 30, type: 'weapon', id: 'c4', qty: 1 },
      { weight: 25, type: 'energy', qty: 60 },
      { weight: 20, type: 'weapon', id: 'f1', qty: 3 },
      { weight: 15, type: 'tentacles', qty: 2500 },
      { weight: 10, type: 'spin', qty: 2 },
    ],
  },
  pack_weekly_progress: {
    guaranteed: [
      { type: 'energy', qty: 900 },
      { type: 'tentacles', qty: 30000 },
      { type: 'weapon', id: 'satchel', qty: 70 },
      { type: 'weapon', id: 'f1', qty: 30 },
      { type: 'weapon', id: 'c4', qty: 10 },
      { type: 'spin', qty: 10 },
    ],
    bonus: [
      { weight: 30, type: 'weapon', id: 'c4', qty: 5 },
      { weight: 25, type: 'energy', qty: 250 },
      { weight: 20, type: 'tentacles', qty: 10000 },
      { weight: 15, type: 'spin', qty: 5 },
      { weight: 10, type: 'premium', qty: [100, 200] },
    ],
  },
  daily_toxic_pack: {
    guaranteed: [
      { type: 'weapon', id: 'satchel', qty: 4 },
      { type: 'weapon', id: 'f1', qty: 1 },
      { type: 'energy', qty: 50 },
    ],
    bonus: [
      { weight: 20, type: 'weapon', id: 'c4', qty: 1 },
      { weight: 80, type: 'tentacles', qty: 1 },
    ],
  },
  popular_daily_toxic: {
    guaranteed: [
      { type: 'weapon', id: 'satchel', qty: 4 },
      { type: 'weapon', id: 'f1', qty: 1 },
      { type: 'energy', qty: 50 },
    ],
    bonus: [
      { weight: 20, type: 'weapon', id: 'c4', qty: 1 },
      { weight: 80, type: 'tentacles', qty: 1 },
    ],
  },
  offer_starter: {
    guaranteed: [
      { type: 'energy', qty: 120 },
      { type: 'tentacles', qty: 3000 },
      { type: 'weapon', id: 'satchel', qty: 10 },
      { type: 'weapon', id: 'f1', qty: 3 },
      { type: 'spin', qty: 3 },
    ],
    bonus: [
      { weight: 20, type: 'weapon', id: 'c4', qty: 1 },
      { weight: 15, type: 'energy', qty: 50 },
      { weight: 65, type: 'tentacles', qty: 1 },
    ],
  },
  offer_boss1: {
    guaranteed: [
      { type: 'energy', qty: 220 },
      { type: 'tentacles', qty: 6000 },
      { type: 'weapon', id: 'satchel', qty: 16 },
      { type: 'weapon', id: 'f1', qty: 6 },
      { type: 'weapon', id: 'c4', qty: 1 },
      { type: 'spin', qty: 2 },
    ],
    bonus: [
      { weight: 25, type: 'weapon', id: 'c4', qty: 1 },
      { weight: 20, type: 'energy', qty: 80 },
      { weight: 15, type: 'tentacles', qty: 3000 },
      { weight: 40, type: 'tentacles', qty: 1 },
    ],
  },
  offer_weekly: {
    guaranteed: [
      { type: 'energy', qty: 350 },
      { type: 'tentacles', qty: 9000 },
      { type: 'weapon', id: 'satchel', qty: 24 },
      { type: 'weapon', id: 'f1', qty: 10 },
      { type: 'weapon', id: 'c4', qty: 3 },
      { type: 'spin', qty: 6 },
    ],
    bonus: [
      { weight: 25, type: 'weapon', id: 'c4', qty: 2 },
      { weight: 20, type: 'energy', qty: 120 },
      { weight: 15, type: 'spin', qty: 3 },
      { weight: 40, type: 'tentacles', qty: 1 },
    ],
  },
};

function openShopPackByItemId(itemId) {
  const table = SHOP_PACK_REWARDS[String(itemId || '')];
  if (!table) return null;
  const drops = [];
  for (const row of table.guaranteed || []) {
    drops.push({
      type: row.type,
      id: row.id,
      qty: Array.isArray(row.qty) ? Number(row.qty[1]) : Number(row.qty || 0),
    });
  }
  return drops;
}

const SHOP_SECTIONS = [
  {
    id: 'popular',
    titleKey: 'shop.sections.popular',
    items: [
      { id: 'popular_daily_toxic', nameKey: 'shop.items.dailyToxicPack', icon: dailyToxicPackBox, descKey: 'shop.desc.forTentacles', costTentacles: 15000, limitPerDay: 1 },
      { id: 'popular_spin_5', nameKey: 'shop.items.spin5', icon: spinBox, descKey: 'shop.desc.forPremium', costStars: 50 },
    ],
  },
  {
    id: 'daily_offer',
    titleKey: 'shop.sections.dailyOffer',
    items: [
      { id: 'offer_starter', nameKey: 'shop.items.starterOffer', icon: starterOfferBox, descKey: 'shop.desc.dailyOffer', costStars: 39 },
      { id: 'offer_boss1', nameKey: 'shop.items.firstBossOffer', icon: firstBossOfferBox, descKey: 'shop.desc.dailyOffer', costStars: 69 },
      { id: 'offer_weekly', nameKey: 'shop.items.weeklyOffer', icon: weeklyOfferBox, descKey: 'shop.desc.dailyOffer', costStars: 119 },
    ],
  },
  {
    id: 'roulette',
    titleKey: 'shop.sections.roulette',
    items: [
      { id: 'spin_1', nameKey: 'shop.items.spin1', icon: spinx1Ui, descKey: 'shop.desc.tentacles10000', costTentacles: 10000, limitPerDay: 5 },
      { id: 'spin_5', nameKey: 'shop.items.spin5', icon: spinx5Ui, descKey: 'shop.desc.tentacles50000', costTentacles: 50000, limitPerDay: 5 },
      { id: 'spin_20', nameKey: 'shop.items.spin20', icon: spinBox, descKey: 'shop.desc.tentacles200000', costTentacles: 200000, limitPerDay: 5 },
    ],
  },
  {
    id: 'packs',
    titleKey: 'shop.sections.packs',
    items: [
      { id: 'pack_poison', nameKey: 'shop.items.poisonPack', icon: poisonPackWeeklyBox, descKey: 'shop.desc.premium49', costStars: 49 },
      { id: 'pack_boss_damage', nameKey: 'shop.items.bossDamagePack', icon: bossDamagePackBox, descKey: 'shop.desc.premium79', costStars: 79 },
      { id: 'pack_weekly_progress', nameKey: 'shop.items.weeklyProgressPack', icon: progressPackBox, descKey: 'shop.desc.forPremium', costStars: 299 },
    ],
  },
];

const ITEM_NAME_KEYS = {
  popular_daily_toxic: 'shop.items.dailyToxicPack',
  popular_spin_5: 'shop.items.spin5',
  offer_starter: 'shop.items.starterOffer',
  offer_boss1: 'shop.items.firstBossOffer',
  offer_weekly: 'shop.items.weeklyOffer',
  daily_toxic_pack: 'shop.items.dailyToxicPack',
  spin_1: 'shop.items.spin1',
  spin_5: 'shop.items.spin5',
  spin_20: 'shop.items.spin20',
  pack_poison: 'shop.items.poisonPack',
  pack_boss_damage: 'shop.items.bossDamagePack',
  pack_weekly_progress: 'shop.items.weeklyProgressPack',
};

const SHOP_ITEM_BY_ID = SHOP_SECTIONS
  .flatMap((section) => section.items || [])
  .reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

const GEM_BOX_ASSETS = {
  'box-50': gemBox50,
  'box-120': gemBox120,
  'box-300': gemBox300,
  'box-700': gemBox700,
  'box-1500': gemBox1500,
  'box-3500': gemBox3500,
  'pack-1': pack1,
  'pack-2': pack2,
  'pack-3': pack3,
  'pack-4': pack4,
  'pack-5': pack5,
  'pack-6': pack6,
};

function getGemPackIcon(assetKey) {
  return GEM_BOX_ASSETS[assetKey] || gemBox50;
}

function getCurrentGemPackIcon(pack) {
  const byAmount = { 35: pack1, 120: pack2, 300: pack3, 700: pack4, 1800: pack5, 3500: pack6 };
  return byAmount[Number(pack?.cdm)] || getGemPackIcon(pack?.assetKey);
}

function formatPrice(item) {
  if (item.costTentacles) return { value: item.costTentacles.toLocaleString(), icon: getResourceIcon('tentacles'), label: 'tentacles' };
  return { value: item.costStars.toLocaleString(), icon: getResourceIcon('cdm'), label: 'T-Pape' };
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[2px] w-6 bg-[#7fd53e]" />
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#d8f7a1]">{title}</p>
    </div>
  );
}

function DailyRefreshTimer({ language = 'ua' }) {
  const [remaining, setRemaining] = useState(() => getNextDailyRefresh() - Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, getNextDailyRefresh() - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const label = language === 'en' ? 'refreshes' : language === 'ru' ? 'обновление' : 'оновлення';
  return <span className="ml-auto font-mono text-[9px] font-black uppercase tracking-normal text-[#9fe75d]">{label} {hours}:{minutes}:{seconds}</span>;
}

function PriceButton({ item, disabled, onClick }) {
  const price = formatPrice(item);
  return (
    <GameTextureButton
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`mt-auto flex h-[36px] w-full items-center justify-center gap-1 px-2 ${disabled ? 'opacity-45 grayscale-[0.15]' : ''}`}
      >
      <img src={price.icon} alt="" className="relative z-[1] h-[26px] w-[26px] object-contain" />
      <span className="relative z-[1] font-sans text-[11px] font-black leading-none text-[#173207]">{price.value}</span>
    </GameTextureButton>
  );
}

function ShopCard({ item, titleText, ownedText, disabled, onBuy, onPreview }) {
  const hasBoxContentsHint =
    String(item.id || '').includes('pack') ||
    String(item.id || '').includes('offer') ||
    String(item.id || '').includes('boss_damage');

  return (
    <MarkerFrame className="flex min-h-[clamp(150px,42vw,176px)] flex-col shadow-[0_12px_20px_rgba(0,0,0,0.22)]" innerClassName="flex min-h-[clamp(150px,42vw,176px)] flex-col px-2 py-2 sm:px-3 sm:py-3" variant="transparent">
      {hasBoxContentsHint ? (
        <button
          type="button"
          onClick={onPreview}
          className="absolute right-2 top-2 z-[3] flex h-5 w-5 items-center justify-center rounded-full border border-[#28ee90] bg-[#12210f]"
        >
          <span className="font-mono text-[11px] font-black leading-none text-[#e8ffbf]">?</span>
        </button>
      ) : null}
      <div className="relative z-[1] bg-[rgba(13,24,10,0.74)] px-2 py-1 text-center">
        <p className="truncate font-sans text-[11px] font-black leading-none text-[#f5ffe2]">{titleText}</p>
      </div>

      <div className="relative z-[1] flex flex-1 items-center justify-center px-2 py-3">
        <img src={item.icon} alt={titleText} className="h-[clamp(68px,20vw,84px)] w-[clamp(68px,20vw,84px)] object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.28)]" />
      </div>

      <div className="relative z-[1] mb-1 min-h-[14px] text-center">
        {ownedText ? <p className="font-mono text-[9px] text-[#d8ffb6]">{ownedText}</p> : null}
      </div>

      <PriceButton item={item} disabled={disabled} onClick={onBuy} />
    </MarkerFrame>
  );
}

function GemPackCard({ pack, titleText, onClick, buyLabel }) {
  return (
    <MarkerFrame className="flex min-h-[clamp(156px,42vw,188px)] flex-col shadow-[0_12px_20px_rgba(0,0,0,0.22)]" innerClassName="flex min-h-[clamp(156px,42vw,188px)] flex-col px-2 py-2 sm:px-3 sm:py-3" variant="transparent">
      {pack.savings ? <span className="absolute -left-5 top-3 z-[4] w-[82px] -rotate-45 rounded-sm border border-[#b7df30] bg-[#629d12] px-1 py-1 text-center font-mono text-[8px] font-black text-white shadow-md">{pack.savings}</span> : null}
      <div className="relative z-[1] pointer-events-none bg-[rgba(13,24,10,0.74)] px-2 py-1 text-center">
        <p className="truncate font-sans text-[11px] font-black leading-none text-[#f5ffe2]">{titleText}</p>
      </div>
      <div className="relative z-[1] pointer-events-none flex flex-1 items-center justify-center px-2 py-2">
        <img src={pack.icon || getCurrentGemPackIcon(pack)} alt={titleText} className="h-[clamp(70px,20vw,86px)] w-[clamp(70px,20vw,86px)] object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.28)]" />
      </div>
      {pack.badge && pack.badge !== 'BEST VALUE' ? <div className="mb-1 self-end rounded-sm border border-[#6dd6ff] bg-[#1976a8] px-1.5 py-0.5 font-mono text-[7px] font-black uppercase text-white">{pack.badge}</div> : null}
      <GameTextureButton
        type="button"
        onClick={onClick}
        className="mt-auto flex h-[36px] w-full items-center justify-center gap-1 px-2"
        aria-label={titleText}
      >
        <span className="relative z-[1] flex items-center justify-center gap-1 font-sans text-[11px] font-black leading-none text-[#173207]">{buyLabel}</span>
      </GameTextureButton>
    </MarkerFrame>
  );
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getNextDailyRefresh() {
  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime();
}

function getDailyLimitKey(itemId) {
  if (itemId === 'popular_daily_toxic') return 'daily_toxic_pack';
  if (itemId === 'popular_spin_5') return 'spin_5';
  return itemId;
}

function getShopBoxType(itemId) {
  const map = {
    popular_daily_toxic: 'daily_toxic_pack',
    daily_toxic_pack: 'daily_toxic_pack',
    pack_boss_damage: 'boss_damage_pack',
    offer_starter: 'starter_offer',
    pack_poison: 'poison_pack',
    offer_boss1: 'first_boss_offer',
    offer_weekly: 'weekly_offer',
    pack_weekly_progress: 'weekly_progress_pack',
  };
  return map[String(itemId || '')] || null;
}

function getShopBoxPreview(boxType, lang = 'en') {
  const lines = {
    standard_boss: { ua: ['Базові нагороди боса', 'tentacles/EXP + шанс бонусів'], ru: ['Базовые награды босса', 'tentacles/EXP + шанс бонусов'], en: ['Base boss rewards', 'tentacles/EXP + bonus chance'] },
    damage_box_1: { ua: ['Малий damage box', 'tentacles/EXP/енергія'], ru: ['Малый damage box', 'tentacles/EXP/энергия'], en: ['Small damage box', 'tentacles/EXP/energy'] },
    damage_box_2: { ua: ['Покращений damage box', 'tentacles/EXP/сила + шанс зірок'], ru: ['Улучшенный damage box', 'tentacles/EXP/сила + шанс звезд'], en: ['Improved damage box', 'tentacles/EXP/strength + stars chance'] },
    damage_box_3: { ua: ['Середній damage box', 'Більше tentacles/EXP + бонуси'], ru: ['Средний damage box', 'Больше tentacles/EXP + бонусы'], en: ['Mid damage box', 'More tentacles/EXP + bonuses'] },
    damage_box_4: { ua: ['Високий damage box', 'Зірки/яд/шмот боса'], ru: ['Высокий damage box', 'Звезды/яд/шмот босса'], en: ['High damage box', 'Stars/poison/boss gear'] },
    damage_box_5: { ua: ['Топовий damage box', 'Макс. нагороди + рідкі дропи'], ru: ['Топовый damage box', 'Макс. награды + редкие дропы'], en: ['Top damage box', 'Max rewards + rare drops'] },
    top_small: { ua: ['Top Small', 'Базові ресурси + шанс бонусу'], ru: ['Top Small', 'Базовые ресурсы + шанс бонуса'], en: ['Top Small', 'Base resources + bonus chance'] },
    top_bronze: { ua: ['Top Bronze', 'tentacles/EXP/сила + бонуси'], ru: ['Top Bronze', 'tentacles/EXP/сила + бонусы'], en: ['Top Bronze', 'tentacles/EXP/strength + bonuses'] },
    top_silver: { ua: ['Top Silver', 'Підвищені нагороди'], ru: ['Top Silver', 'Повышенные награды'], en: ['Top Silver', 'Boosted rewards'] },
    top_gold: { ua: ['Top Gold', 'Найкращі нагороди'], ru: ['Top Gold', 'Лучшие награды'], en: ['Top Gold', 'Best rewards'] },
    boss_top1: { ua: ['Нагорода за топ-1', '2 ролли з топ-таблиці'], ru: ['Награда за топ-1', '2 ролла из топ-таблицы'], en: ['Top-1 reward', '2 rolls from top table'] },
    boss_top10: { ua: ['Нагорода за топ-10', 'Сильні нагороди'], ru: ['Награда за топ-10', 'Сильные награды'], en: ['Top-10 reward', 'Strong rewards'] },
    boss_top100: { ua: ['Нагорода за топ-100', 'Стабільні нагороди'], ru: ['Награда за топ-100', 'Стабильные награды'], en: ['Top-100 reward', 'Stable rewards'] },
    boss_part: { ua: ['Ящик учасника', 'Базові tentacles/EXP'], ru: ['Ящик участника', 'Базовые tentacles/EXP'], en: ['Participant box', 'Base tentacles/EXP'] },
    boss_damage_pack: { ua: ['Boss Damage Pack', 'Прямі нагороди з пака'], ru: ['Boss Damage Pack', 'Прямые награды из пака'], en: ['Boss Damage Pack', 'Direct pack rewards'] },
    poison_pack: { ua: ['Poison Pack', 'Прямі нагороди з пака'], ru: ['Poison Pack', 'Прямые награды из пака'], en: ['Poison Pack', 'Direct pack rewards'] },
    weekly_progress_pack: { ua: ['Weekly Progress Pack', 'Прямі нагороди з пака'], ru: ['Weekly Progress Pack', 'Прямые награды из пака'], en: ['Weekly Progress Pack', 'Direct pack rewards'] },
    starter_offer: { ua: ['Starter Offer', 'Прямі нагороди з оффера'], ru: ['Starter Offer', 'Прямые награды из оффера'], en: ['Starter Offer', 'Direct offer rewards'] },
    first_boss_offer: { ua: ['First Boss Offer', 'Прямі нагороди з оффера'], ru: ['First Boss Offer', 'Прямые награды из оффера'], en: ['First Boss Offer', 'Direct offer rewards'] },
    weekly_offer: { ua: ['Weekly Offer', 'Прямі нагороди з оффера'], ru: ['Weekly Offer', 'Прямые награды из оффера'], en: ['Weekly Offer', 'Direct offer rewards'] },
    daily_toxic_pack: { ua: ['Daily Toxic Pack', 'Прямі нагороди з пака'], ru: ['Daily Toxic Pack', 'Прямые награды из пака'], en: ['Daily Toxic Pack', 'Direct pack rewards'] },
    collection: { ua: ['Колекційний ящик', 'Ресурси/зброя/колект-предмет'], ru: ['Коллекционный ящик', 'Ресурсы/оружие/коллект-предмет'], en: ['Collection box', 'Resources/weapon/collection item'] },
    weapon: { ua: ['Збройовий ящик', 'Малий/середній/фляга з отрутою'], ru: ['Оружейный ящик', 'Малый/средний/фляга с ядом'], en: ['Weapon box', 'Small/medium/large poison'] },
    resource: { ua: ['Ресурсний ящик', 'Фіксований tentacles + EXP'], ru: ['Ресурсный ящик', 'Фиксированный tentacles + EXP'], en: ['Resource box', 'Fixed tentacles + EXP'] },
    activity: { ua: ['Активність', 'tentacles/EXP + малий шанс бонусу'], ru: ['Активность', 'tentacles/EXP + малый шанс бонуса'], en: ['Activity', 'tentacles/EXP + small bonus chance'] },
  };

  const localized = lines[boxType] || lines.activity;
  return localized[lang] || localized.ua;
}

function DailyOfferCard({ offer, language, disabled, onBuy }) {
  const names = {
    'small-poison': { ua: 'Малий яд', ru: 'Малый яд', en: 'Small poison' },
    'medium-poison': { ua: 'Середній яд', ru: 'Средний яд', en: 'Medium poison' },
    'large-poison': { ua: 'Фляга з отрутою', ru: 'Фляга с ядом', en: 'Poison flask' },
  };
  const title = offer.kind === 'equipment'
    ? localizeEquipmentItemName(offer.item, language)
    : offer.kind === 'keycard'
      ? `Ключ: ${offer.boss?.names?.[language] || offer.boss?.name || 'Boss'}`
      : names[offer.id]?.[language] || names[offer.title === 'Малий яд' ? 'small-poison' : offer.title === 'Середній яд' ? 'medium-poison' : offer.title === 'Фляга з отрутою' ? 'large-poison' : '']?.[language] || offer.title || (offer.kind === 'energy' ? (language === 'en' ? `Energy +${offer.qty}` : language === 'ru' ? `Энергия +${offer.qty}` : `Енергія +${offer.qty}`) : offer.kind);
  const keyIndex = offer.kind === 'keycard' ? Math.max(0, GAME_CONFIG.BOSSES.findIndex((boss) => boss.id === offer.boss?.id) - 1) : -1;
  const icon = offer.kind === 'equipment' ? offer.item?.icon : offer.kind === 'keycard' ? BOSS_KEY_ICONS[Math.min(keyIndex, BOSS_KEY_ICONS.length - 1)] : offer.icon;
  return (
    <div className="relative overflow-hidden border border-[#28ee90] bg-[#10180e] p-1.5">
      <p className="truncate bg-[#0a1209] px-1 py-1 text-center font-mono text-[9px] font-black uppercase text-[#e7f3d9]">{title}</p>
      <div className="flex h-[78px] items-center justify-center">
        {String(icon).startsWith('/') ? <img src={icon} alt="" className="h-[68px] w-[68px] object-contain" style={offer.kind === 'keycard' ? { filter: `drop-shadow(0 0 5px ${offer.boss?.color || '#ffffff'})` } : undefined} /> : <span className="text-[38px]">{icon}</span>}
      </div>
      <p className="text-center font-mono text-[10px] font-black text-[#d8ffb6]">x{offer.qty || 1}</p>
      <GameTextureButton type="button" disabled={disabled} onClick={onBuy} className="mt-auto flex h-[36px] w-full items-center justify-center gap-1 px-2 disabled:opacity-40">
        <img src={getResourceIcon(offer.paymentCurrency === 'tentacles' ? 'tentacles' : 'cdm')} alt="" className="relative z-[1] h-[26px] w-[26px] object-contain" />
        <span className="relative z-[1] font-sans text-[11px] font-black leading-none text-[#173207]">
          {offer.kind === 'equipment' ? offer.premium : offer.kind === 'keycard' ? offer.cost?.tentacles : offer.paymentCurrency === 'tentacles' ? offer.cost?.tentacles : offer.cost?.premium}
        </span>
      </GameTextureButton>
    </div>
  );
}

export default function ShopPanel({ profile, onUpdateProfile, onRefreshProfile = null, energyPurchaseRequested = false, onEnergyPurchaseRequestHandled = null }) {
  const { t } = useTranslation();
  const [buyingId, setBuyingId] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [openingShopBox, setOpeningShopBox] = useState(null);
  const [previewBox, setPreviewBox] = useState(null);
  const [shopConfig, setShopConfig] = useState({ paymentMethods: SHOP_PAYMENT_METHODS, gemPacks: GEM_SHOP_PACKS, paidConsumablePacks: PAID_CONSUMABLE_PACKS });
  const [nearUsd, setNearUsd] = useState(0);
  const [selectedGemPack, setSelectedGemPack] = useState(null);
  const [selectedGemMethod, setSelectedGemMethod] = useState(isTelegramPlatform ? 'telegram_stars' : 'near');
  const [energyPopupOpen, setEnergyPopupOpen] = useState(false);
  const [energyAmount, setEnergyAmount] = useState(100);
  const [poisonPopupPack, setPoisonPopupPack] = useState(null);
  const [poisonAmount, setPoisonAmount] = useState(1);
  const unopenedPacks = (profile?.inventory_items || []).filter((item) =>
    (item?.type === 'box' || (!item?.type && (String(item?.id || '').includes('pack') || String(item?.id || '').includes('box'))))
    && Number(item?.count || 0) > 0
  );
  const totalUnopened = unopenedPacks.reduce((sum, item) => sum + Math.max(0, item?.count || 0), 0);
  const todayKey = getTodayKey();
  const dailyOffersList = useMemo(() => dailyOffers(profile, todayKey), [profile, todayKey]);
  const dailyPurchased = profile?.daily_shop_date === todayKey ? (profile?.daily_shop_purchases || []) : [];
  const dailyLimits = profile?.shop_daily_limits || {};
  const isSameDay = dailyLimits?.day === todayKey;
  const dailyCounts = isSameDay ? (dailyLimits?.counts || {}) : {};
  const lang = (profile?.language === 'en' || profile?.language === 'ru') ? profile.language : 'ua';
  const labels = PACK_INFO_LABELS[lang] || PACK_INFO_LABELS.ua;
  const gemPacks = useMemo(() => Array.isArray(shopConfig?.gemPacks) && shopConfig.gemPacks.length ? shopConfig.gemPacks : GEM_SHOP_PACKS, [shopConfig]);
  const paidConsumablePacks = useMemo(() => Array.isArray(shopConfig?.paidConsumablePacks) && shopConfig.paidConsumablePacks.length ? shopConfig.paidConsumablePacks : PAID_CONSUMABLE_PACKS, [shopConfig]);
  const energySliderMax = 1000;
  const energyPackBase = getPaidEnergyPack(energyAmount);
  const selectedEnergyPack = energyPackBase ? { ...energyPackBase, title: `${lang === 'ru' ? 'Энергия' : lang === 'en' ? 'Energy' : 'Енергія'} +${energyAmount}`, icon: energy100Ui } : null;
  const selectedPoisonPackBase = poisonPopupPack ? getPaidPoisonPack(poisonPopupPack.poisonId, poisonAmount) : null;
  const selectedPoisonPack = selectedPoisonPackBase ? {
    ...selectedPoisonPackBase,
    title: `${lang === 'ru' ? ({ 'small-poison': 'Малый яд', 'medium-poison': 'Средний яд', 'large-poison': 'Большой яд' }[poisonPopupPack.poisonId]) : lang === 'en' ? ({ 'small-poison': 'Small poison', 'medium-poison': 'Medium poison', 'large-poison': 'Large poison' }[poisonPopupPack.poisonId]) : ({ 'small-poison': 'Малий яд', 'medium-poison': 'Середній яд', 'large-poison': 'Великий яд' }[poisonPopupPack.poisonId])} ×${poisonAmount}`,
    icon: poisonPopupPack.icon,
  } : null;
  const paymentMethods = useMemo(() => {
    const configured = Array.isArray(shopConfig?.paymentMethods) && shopConfig.paymentMethods.length ? shopConfig.paymentMethods : SHOP_PAYMENT_METHODS;
    if (isTelegramPlatform) return configured.filter((method) => method.id === 'telegram_stars');
    if (isWebPlatform) return configured.filter((method) => method.id === 'near');
    return configured;
  }, [shopConfig]);
  const shopSections = useMemo(() => [
    { id: 'gems', titleKey: 'shop.sections.gems', items: gemPacks.filter(pack=>pack.id!=='payment_test').map((pack) => ({ ...pack, icon: getCurrentGemPackIcon(pack) })) },
    { id: 'paidConsumables', titleKey: 'shop.sections.paidConsumables', items: paidConsumablePacks.map((pack) => ({ ...pack, title: lang === 'ru' ? ({ paid_poison_small: 'Малый яд ×1', paid_poison_medium: 'Средний яд ×1', paid_poison_large: 'Большой яд ×1' }[pack.id]) : lang === 'en' ? pack.title : ({ paid_poison_small: 'Малий яд ×1', paid_poison_medium: 'Середній яд ×1', paid_poison_large: 'Великий яд ×1' }[pack.id]), icon: { 'small-poison': poisonSmallUi, 'medium-poison': poisonMediumUi, 'large-poison': poisonLargeUi }[pack.poisonId] })) },
    ...SHOP_SECTIONS,
  ], [gemPacks, paidConsumablePacks, lang]);

  useEffect(() => {
    if (!energyPurchaseRequested) return;
    setEnergyAmount(100);
    setEnergyPopupOpen(true);
    onEnergyPurchaseRequestHandled?.();
  }, [energyPurchaseRequested, onEnergyPurchaseRequestHandled]);

  useEffect(() => {
    let alive = true;
    getShopConfig()
      .then((config) => {
        if (!alive || !config) return;
        setShopConfig({
          paymentMethods: Array.isArray(config.paymentMethods) && config.paymentMethods.length ? config.paymentMethods : SHOP_PAYMENT_METHODS,
          gemPacks: Array.isArray(config.gemPacks) && config.gemPacks.length ? config.gemPacks : GEM_SHOP_PACKS,
          paidConsumablePacks: Array.isArray(config.paidConsumablePacks) && config.paidConsumablePacks.length ? config.paidConsumablePacks : PAID_CONSUMABLE_PACKS,
        });
      })
      .catch(() => {
        if (!alive) return;
        setShopConfig({ paymentMethods: SHOP_PAYMENT_METHODS, gemPacks: GEM_SHOP_PACKS, paidConsumablePacks: PAID_CONSUMABLE_PACKS });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getPaymentRates()
      .then((rates) => {
        const value = Number(rates?.nearUsd);
        if (alive && Number.isFinite(value) && value > 0) setNearUsd(value);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const openGemPackChooser = (pack) => {
    if (!pack) return;
    setSelectedGemPack(pack);
    setSelectedGemMethod((current) => {
      const available = Array.isArray(pack.paymentMethods) && pack.paymentMethods.length ? pack.paymentMethods : paymentMethods.map((method) => method.id);
      return available.includes(current) ? current : available.find((id) => paymentMethods.some((method) => method.id === id)) || paymentMethods[0]?.id;
    });
  };

  const closeGemPackChooser = () => {
    setSelectedGemPack(null);
  };

  const openPoisonQuantity = (pack) => {
    setPoisonPopupPack(pack);
    setPoisonAmount(1);
  };

  const resolvePaymentMethod = (methodId) => paymentMethods.find((method) => method.id === methodId) || paymentMethods[0] || SHOP_PAYMENT_METHODS[0];

  const handleBuyPlaceholder = async (item, itemName) => {
    if (buyingId) return;
    if (item.costTentacles && (profile?.tentacles || 0) < item.costTentacles) return;
    if (item.costStars && (profile?.premium || 0) < item.costStars) return;
    const currentCount = Number(dailyCounts[getDailyLimitKey(item.id)] || 0);
    if (item.limitPerDay && currentCount >= item.limitPerDay) return;
    const updates = { playerAction: { type: 'shop-fixed', itemId: item.id } };
    setBuyingId(item.id);
    setPurchaseError('');
    try {
      await onUpdateProfile(updates);
      const boxType = getShopBoxType(item.id);
      if (boxType) setOpeningShopBox({ itemId: item.id, boxType });
    } catch (error) {
      console.error('[shop] purchase failed', error);
      setPurchaseError(lang === 'en' ? 'Purchase failed. Try again.' : lang === 'ru' ? 'Покупка не прошла. Попробуй ещё раз.' : 'Покупка не пройшла. Спробуй ще раз.');
    } finally {
      setBuyingId(null);
    }
  };

  const handleBuyDaily = async (offer) => {
    if (!offer || buyingId || dailyPurchased.includes(offer.id)) return;
    const useTentacles = offer.paymentCurrency === 'tentacles';
    const tentaclesCost = useTentacles ? (offer.kind === 'equipment' ? 0 : offer.cost.tentacles) : 0;
    const premiumCost = useTentacles ? 0 : (offer.kind === 'equipment' ? offer.premium : offer.cost.premium);
    if (useTentacles ? Number(profile?.tentacles || 0) < tentaclesCost : Number(profile?.premium || 0) < premiumCost) return;
    const updates = { playerAction: { type: 'shop-daily', itemId: offer.id } };
    setBuyingId(offer.id);
    setPurchaseError('');
    try {
      await onUpdateProfile(updates);
    } catch (error) {
      console.error('[shop] daily purchase failed', error);
      setPurchaseError(lang === 'en' ? 'Purchase failed. Try again.' : lang === 'ru' ? 'Покупка не прошла. Попробуй ещё раз.' : 'Покупка не пройшла. Спробуй ще раз.');
    } finally {
      setBuyingId(null);
    }
  };

  const handleOpenShopBox = async ({ boxType }) => {
    if (openShopPackByItemId(openingShopBox?.itemId)) {
      const result = await onUpdateProfile({ playerAction: { type: 'shop-open', itemId: openingShopBox.itemId } });
      return result?.reward?.drops || [];
    }
    return openBox(boxType, null);
  };

  // Opening is applied atomically by the server before the modal displays drops.
  const handleApplyShopDrops = async () => {};

  const handleOpenInventoryPack = (item) => {
    const boxType = getShopBoxType(item?.id);
    if (!boxType) return;
    setOpeningShopBox({ itemId: item.id, boxType });
  };

  return (
    <div className="space-y-5 pb-3">
      {purchaseError ? <p role="alert" className="border border-[#ff6c65] bg-[#2b1010] p-2 text-center font-mono text-[11px] text-[#ffd5d0]">{purchaseError}</p> : null}
      {selectedGemPack ? (
        <PaymentMethodPicker
          pack={selectedGemPack}
          paymentMethods={paymentMethods}
          initialMethodId={selectedGemMethod}
          onClose={closeGemPackChooser}
          onSuccess={async () => {
            closeGemPackChooser();
            await onRefreshProfile?.();
          }}
        />
      ) : null}
      {energyPopupOpen ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="paid-energy-title">
        <div className="w-full max-w-[360px] border-2 border-[#28ee90] bg-[#10170d] p-4 shadow-[0_0_24px_rgba(40,238,144,.2)]">
          <div className="flex items-center justify-between gap-2"><h2 id="paid-energy-title" className="font-mono text-sm font-black uppercase text-[#eaffd1]">{lang === 'ru' ? 'Купить энергию' : lang === 'en' ? 'Buy Energy' : 'Купити енергію'}</h2><button type="button" onClick={() => setEnergyPopupOpen(false)} aria-label={t('common.close')} className="text-xl text-[#d8ff86]">×</button></div>
          <p className="mt-3 text-center font-mono text-xs font-black text-[#d8ff86]">{lang === 'ru' ? 'Количество энергии' : lang === 'en' ? 'Energy amount' : 'Кількість енергії'}</p>
          <p className="mt-1 text-center font-mono text-2xl font-black text-white">+{energyAmount}</p>
          {energySliderMax >= 2 ? <input aria-label={lang === 'ru' ? 'Количество энергии' : lang === 'en' ? 'Energy amount' : 'Кількість енергії'} type="range" min="2" max={energySliderMax} step="2" value={Math.min(energyAmount, energySliderMax)} onChange={(event) => setEnergyAmount(Number(event.target.value))} className="mt-3 w-full accent-[#a6db32]" /> : <p className="mt-3 text-center font-mono text-[11px] text-[#ffb7a9]">{lang === 'ru' ? 'Энергия уже на максимуме.' : lang === 'en' ? 'Energy is already full.' : 'Енергія вже на максимумі.'}</p>}
          <div className="mt-2 flex justify-between font-mono text-[9px] text-[#a8bd8e]"><span>2</span><span>{lang === 'ru' ? 'Максимум за покупку' : lang === 'en' ? 'Maximum per purchase' : 'Максимум за покупку'}: {energySliderMax}</span></div>
          <div className="mt-4 border border-[#33452a] bg-[#0b1009] p-2 text-center font-mono text-xs font-black text-[#fff1bd]">{isWebPlatform ? <><img src={nearIcon} alt="" className="mr-1 inline h-4 w-4" />{nearUsd > 0 ? (Number(selectedEnergyPack?.usd || 0) / nearUsd).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'} NEAR</> : <><img src={starsCurrencyIcon} alt="" className="mr-1 inline h-4 w-4" />{selectedEnergyPack?.stars || 0} Stars</>}</div>
          <div className="mt-3 grid grid-cols-2 gap-2"><GameTextureButton type="button" tone="yellow" onClick={() => setEnergyPopupOpen(false)} className="h-10"><span className="relative z-10 font-mono text-[10px] font-black text-[#17220e]">{lang === 'ru' ? 'Назад' : lang === 'en' ? 'Back' : 'Назад'}</span></GameTextureButton><GameTextureButton type="button" disabled={!selectedEnergyPack || energySliderMax < 2} onClick={() => { if (selectedEnergyPack) { setEnergyPopupOpen(false); openGemPackChooser(selectedEnergyPack); } }} className="h-10"><span className="relative z-10 font-mono text-[10px] font-black text-[#17220e]">{lang === 'ru' ? 'Продолжить' : lang === 'en' ? 'Continue' : 'Продовжити'}</span></GameTextureButton></div>
        </div>
      </div> : null}
      {poisonPopupPack ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="paid-poison-title">
        <div className="w-full max-w-[360px] border-2 border-[#28ee90] bg-[#10170d] p-4 shadow-[0_0_24px_rgba(40,238,144,.2)]">
          <div className="flex items-center justify-between gap-2"><h2 id="paid-poison-title" className="font-mono text-sm font-black uppercase text-[#eaffd1]">{lang === 'ru' ? 'Купить яд' : lang === 'en' ? 'Buy poison' : 'Купити отруту'}</h2><button type="button" onClick={() => setPoisonPopupPack(null)} aria-label={t('common.close')} className="text-xl text-[#d8ff86]">×</button></div>
          <div className="mt-3 flex items-center justify-center gap-3"><img src={poisonPopupPack.icon} alt="" aria-hidden="true" className="h-16 w-16 object-contain" /><div className="text-center"><p className="font-mono text-xs font-black text-[#d8ff86]">{lang === 'ru' ? 'Количество, шт.' : lang === 'en' ? 'Quantity, pcs' : 'Кількість, шт.'}</p><p className="mt-1 font-mono text-2xl font-black text-white">×{poisonAmount}</p></div></div>
          <input aria-label={lang === 'ru' ? 'Количество яда' : lang === 'en' ? 'Poison quantity' : 'Кількість отрути'} type="range" min="1" max="100" step="1" value={poisonAmount} onChange={(event) => setPoisonAmount(Number(event.target.value))} className="mt-3 w-full accent-[#a6db32]" />
          <div className="mt-2 flex justify-between font-mono text-[9px] text-[#a8bd8e]"><span>1</span><span>{lang === 'ru' ? 'Максимум за покупку' : lang === 'en' ? 'Maximum per purchase' : 'Максимум за покупку'}: 100</span></div>
          <div className="mt-4 border border-[#33452a] bg-[#0b1009] p-2 text-center font-mono text-xs font-black text-[#fff1bd]">{isWebPlatform ? <><img src={nearIcon} alt="" className="mr-1 inline h-4 w-4" />{nearUsd > 0 ? (Number(selectedPoisonPack?.usd || 0) / nearUsd).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'} NEAR</> : <><img src={starsCurrencyIcon} alt="" className="mr-1 inline h-4 w-4" />{selectedPoisonPack?.stars || 0} Stars</>}</div>
          <div className="mt-3 grid grid-cols-2 gap-2"><GameTextureButton type="button" tone="yellow" onClick={() => setPoisonPopupPack(null)} className="h-10"><span className="relative z-10 font-mono text-[10px] font-black text-[#17220e]">{lang === 'en' ? 'Back' : lang === 'ru' ? 'Назад' : 'Назад'}</span></GameTextureButton><GameTextureButton type="button" disabled={!selectedPoisonPack} onClick={() => { if (selectedPoisonPack) { setPoisonPopupPack(null); openGemPackChooser(selectedPoisonPack); } }} className="h-10"><span className="relative z-10 font-mono text-[10px] font-black text-[#17220e]">{lang === 'ru' ? 'Продолжить' : lang === 'en' ? 'Continue' : 'Продовжити'}</span></GameTextureButton></div>
        </div>
      </div> : null}
      {openingShopBox ? (
        <LootBoxModal
          boxType={openingShopBox.boxType}
          lang={profile?.language || 'en'}
          onClose={() => setOpeningShopBox(null)}
          onOpenBox={handleOpenShopBox}
          onApplyDrops={handleApplyShopDrops}
        />
      ) : null}
      {previewBox ? (
        <div className="fixed inset-0 z-[20] flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-[320px] border border-[#28ee90] bg-[#0f160d] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] font-black uppercase text-[#d8ffb6]">{previewBox.title}</p>
              <button type="button" onClick={() => setPreviewBox(null)} className="font-mono text-[12px] text-[#d8ffb6]">X</button>
            </div>
            {(() => {
              const aliasMap = {
                popular_daily_toxic: 'daily_toxic_pack',
                popular_spin_5: 'spin_5',
              };
              const infoKey = aliasMap[previewBox.itemId] || previewBox.itemId;
              const info = (SHOP_PACK_INFO[infoKey] && (SHOP_PACK_INFO[infoKey][lang] || SHOP_PACK_INFO[infoKey].ua)) || null;
              if (!info) {
                return (
                  <div className="space-y-1">
                    {getShopBoxPreview(previewBox.boxType, lang).map((line) => (
                      <p key={line} className="font-mono text-[10px] text-[#e7f3d9]">- {line}</p>
                    ))}
                  </div>
                );
              }
              return (
                <div className="space-y-1.5">
                  {Array.isArray(info.guaranteed) && info.guaranteed.length ? (
                    <>
                      <p className="font-mono text-[10px] font-black uppercase text-[#d8ffb6]">{labels.guaranteed}</p>
                      {info.guaranteed.map((line) => (
                        <p key={`g-${line}`} className="font-mono text-[10px] text-[#e7f3d9]">- {String(line).replace(/(\d+)\s*[–-]\s*(\d+)/g, '$2')}</p>
                      ))}
                    </>
                  ) : null}
                  {info.limit ? <p className="pt-1 font-mono text-[10px] text-[#d8ffb6]">{info.limit}</p> : null}
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
      <div className="relative overflow-hidden border border-[#28ee90] bg-[linear-gradient(180deg,#161b12_0%,#0e110b_100%)] shadow-[0_14px_24px_rgba(0,0,0,0.24)]">
        <img src={shopBanner} alt="Shop banner" className="h-auto w-full object-cover" />
        <div className="absolute inset-x-0 bottom-2 z-10 grid grid-cols-2 gap-2 px-3">
          <GameTextureButton type="button" className="h-[38px]">
            <span className="relative z-[1] flex h-full items-center justify-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#142c0b]">
              <img src={nearIcon} alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
              NEAR
            </span>
          </GameTextureButton>
          <GameTextureButton type="button" tone="blue" className="h-[38px]">
            <span className="relative z-[1] flex h-full items-center justify-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#0c1b34]">
              <img src={tonIcon} alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
              TON
            </span>
          </GameTextureButton>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2"><div className="h-[2px] w-6 bg-[#7fd53e]" /><p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#d8f7a1]">{lang === 'en' ? 'DAILY SHOP' : lang === 'ru' ? 'ЕЖЕДНЕВНЫЕ ТОВАРЫ' : 'ЩОДЕННІ ТОВАРИ'}</p><DailyRefreshTimer language={lang} /></div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {dailyOffersList.map((offer) => (
              <DailyOfferCard key={offer.id} offer={offer} language={lang} disabled={Boolean(buyingId) || dailyPurchased.includes(offer.id)} onBuy={() => handleBuyDaily(offer)} />
            ))}
          </div>
        </div>
        {shopSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <SectionHeader title={t(section.titleKey)} />
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {section.id === 'gems'
                ? section.items.map((pack) => {
                    const titleText = pack.title;
                    return (
                      <GemPackCard
                        key={pack.id}
                        pack={pack}
                        titleText={titleText}
                        buyLabel={isWebPlatform
                          ? <><img src={nearIcon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />{nearUsd > 0 ? (Math.ceil((Number(pack.usd || 0) / nearUsd) * 1e6) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'} NEAR</>
                          : <><img src={starsCurrencyIcon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />{Number(pack.stars || Math.ceil(Number(pack.usd || 0) * 100)).toLocaleString()}</>}
                        onClick={() => openGemPackChooser(pack)}
                      />
                    );
                  })
                : section.id === 'paidConsumables'
                  ? section.items.map((pack) => <GemPackCard key={pack.id} pack={pack} titleText={pack.title} buyLabel={isWebPlatform ? <><img src={nearIcon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />{nearUsd > 0 ? (Number(pack.usd || 0) / nearUsd).toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'} NEAR</> : <><img src={starsCurrencyIcon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />{pack.stars} Stars</>} onClick={() => openPoisonQuantity(pack)} />)
                : section.items.map((item) => {
                    const limitKey = getDailyLimitKey(item.id);
                    const currentCount = Number(dailyCounts[limitKey] || 0);
                    const limitReached = Boolean(item.limitPerDay && currentCount >= item.limitPerDay);
                    const insufficientFunds = item.costTentacles ? (profile?.tentacles || 0) < item.costTentacles : (profile?.premium || 0) < (item.costStars || 0);
                    const titleText = item.nameKey ? t(item.nameKey) : item.name;
                    const ownedText = item.limitPerDay ? t('shop.remaining', { left: Math.max(0, item.limitPerDay - currentCount), total: item.limitPerDay }) : '';
                    return (
                      <ShopCard
                        key={item.id}
                        item={item}
                        titleText={titleText}
                        ownedText={ownedText}
                        disabled={Boolean(buyingId) || insufficientFunds || limitReached}
                        onBuy={() => handleBuyPlaceholder(item, titleText)}
                        onPreview={() => {
                          const boxType = getShopBoxType(item.id);
                          if (!boxType) return;
                          setPreviewBox({ title: titleText, boxType, itemId: item.id });
                        }}
                      />
                    );
                  })}
            </div>
            {section.infoLinesKeys ? (
              <div className="border border-[#28ee90] bg-[#0e140d] px-3 py-2">
                {section.infoLinesKeys.map((lineKey) => (
                  <p key={lineKey} className="font-mono text-[10px] text-[#d7e8c3]">{t(lineKey)}</p>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <div className="space-y-2">
          <SectionHeader title={t('shop.sections.unopenedPacks')} />
          <div className="border border-[#28ee90] bg-[#0f150d] p-3">
            {unopenedPacks.length === 0 ? (
              <p className="font-mono text-[10px] text-[#b7c7a3]">{t('shop.noPacks')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {unopenedPacks.map((item) => {
                  const shopItem = SHOP_ITEM_BY_ID[item.id] || {};
                  const title = ITEM_NAME_KEYS[item.id] ? t(ITEM_NAME_KEYS[item.id]) : (item.name || item.id);
                  const icon = item.icon || shopItem.icon || dailyToxicPackBox;
                  const count = Math.max(0, Number(item.count || 0));
                  const canOpen = Boolean(getShopBoxType(item.id)) && count > 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!canOpen}
                      onClick={() => handleOpenInventoryPack(item)}
                      className="relative overflow-hidden border border-[#28ee90] bg-[#121b0e] p-1.5 text-left disabled:opacity-40"
                    >
                      <img src={icon} alt={title} className="mx-auto h-14 w-14 object-contain" />
                      <p className="mt-1 truncate text-center font-mono text-[9px] text-[#e7f3d9]">{title}</p>
                      <p className="text-center font-mono text-[10px] font-black text-[#d8ffb6]">x{count}</p>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={totalUnopened === 0} className="h-9 border border-[#28ee90] bg-[#18250f] font-mono text-[10px] font-black text-[#e7f3d9] disabled:opacity-45">
                {t('shop.openOne')}
              </button>
              <button type="button" disabled={totalUnopened === 0} className="h-9 border border-[#28ee90] bg-[#223510] font-mono text-[10px] font-black text-[#efffda] disabled:opacity-45">
                {t('shop.openAll')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



