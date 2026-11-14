import { createPortal } from 'react-dom';
import { kyivDayKey } from "../../lib/kyivDay.js";
import {gameApi} from '@/services/gameApi';
import { useAnimationsEnabled } from '@/lib/animationPreference';
import { translateUiText } from '@/lib/uiTextTranslations';
import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import energyRewardIcon from '@/assets/optimized/all/ui/energy.webp';
import freeSpinRewardIcon from '@/assets/optimized/all/ui/spinx1.webp';
import telegramStarsIcon from '@/assets/optimized/all/ui/star1.webp';
import paperIcon from '@/assets/optimized/paper.webp';
import nearIcon from '@/assets/ui/near-logo.svg';
import { isWebPlatform } from '@/lib/platform/config';
import largePoisonRewardIcon from '@/assets/optimized/all/skills/large-poison.webp';
import mediumPoisonRewardIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import smallPoisonRewardIcon from '@/assets/optimized/all/skills/small-poison.webp';
import rouletteArrowIcon from '@/assets/optimized/all/roulette/roulette_arrow.webp';
import rewardEnergyArt from '@/assets/optimized/all/roulette/reward_energy_50.webp';
import rewardSmallPoisonArt from '@/assets/optimized/all/roulette/reward_poison_small.webp';
import rewardMediumPoisonArt from '@/assets/optimized/all/roulette/reward_poison_medium.webp';
import rewardLargePoisonArt from '@/assets/optimized/all/roulette/reward_poison_large.webp';
import rewardFreeSpinArt from '@/assets/optimized/all/roulette/reward_free_spin.webp';
import rewardPumpkinArt from '@/assets/optimized/all/roulette/reward_free_spin-pump.webp';
import wheelArt from '@/assets/optimized/all/roulette/wheel.webp';
import rouletteBackdrop from '@/assets/optimized/all/roulette/roulette-casino-backdrop.webp';
import halloweenWheelArt from '@/assets/optimized/all/roulette/wheel-halloween.webp';
import pumpkinRewardIcon from '@/assets/ui/halloween-pumpkin.webp';
import nothingRewardIcon from '@/assets/optimized/all/ui/shit-happens.webp';
import GameTextureButton from './GameTextureButton';
import CasinoRulesDialog from './CasinoRulesDialog';
import MarkerFrame from './MarkerFrame';
import RewardPopup from './RewardPopup';
import PaymentMethodPicker from './PaymentMethodPicker';
import { getRouletteSpinPack } from '@/lib/shopCatalog';
import {
  ROULETTE_PAPER_SPIN_COST,
  getRouletteRewardLabel,
  getRouletteRewardPopupText,
  getRouletteRewardCenterAngleByIndex,
  getRouletteRewardIndex,
  ROULETTE_REWARD_COUNT,
  ROULETTE_WHEEL_POINTER_ANGLE as WHEEL_POINTER_ANGLE,
  inferRouletteRewardFromState,
  normalizeRouletteRewardId,
  resolveRouletteRewardById,
} from '@/lib/rouletteRewards';
import { halloweenActive } from '@/lib/halloweenEvent';

const STAR_SPIN_COST = 10;
const PAPER_SPIN_COST = ROULETTE_PAPER_SPIN_COST;
const ROULETTE_PAYMENT_METHODS = isWebPlatform
  ? [{ id: 'near', title: 'NEAR' }]
  : [{ id: 'telegram_stars', title: 'STARS' }];
const paidSpinLabel = (count) => isWebPlatform ? `$${(0.1 * count).toFixed(2)} · NEAR` : `${STAR_SPIN_COST * count} Stars`;
const SPIN_DURATION_MS = 4200;
const MIN_FULL_SPINS = 5;
const ROULETTE_TEXT = {
  ua: {
    lucky_roll: 'Щасливий прокрут',
    roulette: 'Рулетка',
    roulette_wheel: 'Колесо рулетки',
    free: 'Безкоштовно',
    used_today: 'Використано сьогодні',
    bonus: 'Бонус',
    buy: 'Купити',
    spin_bonus: 'Бонусний прокрут',
    spin5: '5',
    daily_free_spin_description: `Раз на день доступний один безкоштовний прокрут. Кожне забране щоденне завдання дає +1 бонусний прокрут. Додатковий прокрут: ${PAPER_SPIN_COST} T-Pape або ${paidSpinLabel(1)}.`,
  },
  en: {
    lucky_roll: 'Lucky Roll',
    roulette: 'Roulette',
    roulette_wheel: 'Roulette Wheel',
    free: 'Free',
    used_today: 'Used today',
    bonus: 'Bonus',
    buy: 'Buy',
    spin_bonus: 'Spin Bonus',
    spin5: '5',
    daily_free_spin_description: `You get one free spin once per day. Each claimed daily task gives +1 bonus spin. Extra spin: ${PAPER_SPIN_COST} T-Pape or ${paidSpinLabel(1)}.`,
  },
  ru: {
    lucky_roll: 'Счастливый прокрут',
    roulette: 'Рулетка',
    roulette_wheel: 'Колесо рулетки',
    free: 'Бесплатно',
    used_today: 'Использовано сегодня',
    bonus: 'Бонус',
    buy: 'Купить',
    spin_bonus: 'Бонусный прокрут',
    spin5: '5',
    daily_free_spin_description: `Один раз в день доступен один бесплатный прокрут. Каждое забранное ежедневное задание даёт +1 бонусный прокрут. Дополнительный прокрут: ${PAPER_SPIN_COST} T-Pape или ${paidSpinLabel(1)}.`,
  },
};

const ROULETTE_REWARD_ICONS = {
  reward_energy_50: energyRewardIcon,
  reward_poison_small: smallPoisonRewardIcon,
  reward_poison_medium: mediumPoisonRewardIcon,
  reward_poison_large: largePoisonRewardIcon,
  reward_free_spin: freeSpinRewardIcon,
  reward_nothing: nothingRewardIcon,
};

const ROULETTE_WHEEL_ART = {
  reward_energy_50: rewardEnergyArt,
  reward_poison_small: rewardSmallPoisonArt,
  reward_poison_medium: rewardMediumPoisonArt,
  reward_poison_large: rewardLargePoisonArt,
  reward_free_spin: rewardFreeSpinArt,
  reward_nothing: halloweenActive() ? rewardPumpkinArt : nothingRewardIcon,
};

function getTodayKey() {
  return kyivDayKey();
}

function getSpinSource(profile) {
  const todayKey = getTodayKey();
  const hasFreeSpin = profile?.roulette_last_free_spin !== todayKey;
  const bonusSpins = profile?.roulette_bonus_spins || 0;
  if (hasFreeSpin) return { type: 'free', label: translateUiText('Безкоштовно'), disabled: false };
  if (bonusSpins > 0) return { type: 'bonus', label: `Bonus x${bonusSpins}`, disabled: false };
  return { type: 'locked', label: translateUiText('Нема спінів'), disabled: true };
}

function normalizeAngle(angle) {
  const value = angle % 360;
  return value < 0 ? value + 360 : value;
}

function DualSpinButtons({ profile, source, spinning, blocked = false, onFreeOrBonusSpin, onPaperSpin, onBuySpins, lang = 'ua', count = 1, tutorialTarget }) {
  const availableSpins = Number(profile?.roulette_bonus_spins || 0) + (source.type === 'free' ? 1 : 0);
  const canFreeOrBonus = !spinning && !blocked && availableSpins >= count && (source.type === 'free' || source.type === 'bonus');
  const canBuy = !spinning && !blocked;

  return (
    <div className="grid grid-cols-2 gap-2">
      <GameTextureButton
        type="button"
        data-tutorial-target={tutorialTarget}
        onClick={canFreeOrBonus ? onFreeOrBonusSpin : undefined}
        disabled={!canFreeOrBonus}
        tone={canFreeOrBonus ? 'green' : 'gray'}
        className={`h-12 ${canFreeOrBonus ? '' : 'opacity-70'}`}
      >
        <span className="relative z-10 flex h-full items-center justify-center px-3 font-sans text-[13px] font-black uppercase text-[#13200e]">
          {spinning ? '...' : `${lang === 'ru' ? 'ПОЕХАЛИ' : lang === 'en' ? 'LET’S GO' : 'ПОЇХАЛИ'} : ${Math.max(0, availableSpins)}${availableSpins < count ? `/${count}` : ''}`}
        </span>
      </GameTextureButton>
      <GameTextureButton
        type="button"
        onClick={canBuy ? onBuySpins : undefined}
        disabled={!canBuy}
        tone="yellow"
        className={`h-12 ${canBuy ? '' : 'opacity-70 grayscale-[0.18]'}`}
      >
        <span className="relative z-10 flex h-full items-center justify-center gap-1 px-3 font-sans text-[13px] font-black uppercase text-[#1d220e]">
          <img src={isWebPlatform ? nearIcon : telegramStarsIcon} alt="" className="h-5 w-5 object-contain" />
          {paidSpinLabel(count)}
        </span>
      </GameTextureButton>
      <GameTextureButton type="button" onClick={onPaperSpin} disabled={!canBuy || Number(profile?.premium || 0) < PAPER_SPIN_COST * count} tone="blue" className="col-span-2 h-12">
        <span className="relative z-10 flex h-full items-center justify-center gap-1 font-sans text-[13px] font-black">
          <img src={paperIcon} alt="T-Pape" className="h-6 w-6 object-contain" />
          {PAPER_SPIN_COST * count} T-Pape
        </span>
      </GameTextureButton>
    </div>
  );
}

const CardGameDemo = lazy(() => import('./CardGamePanel'));
export default function RoulettePanel({ profile, onUpdateProfile, onClose, suspended = false, initialTab = 'roulette', onSyncProfile }) {
  const animationsEnabled = useAnimationsEnabled();
  const animationsEnabledRef = useRef(animationsEnabled);
  animationsEnabledRef.current = animationsEnabled;
  const [casinoTab,setCasinoTab]=useState(initialTab);
  const [cardsVisited,setCardsVisited]=useState(initialTab==='cards');
  const [cardBusy,setCardBusy]=useState(false);
  const [freeCards,setFreeCards]=useState(0);
  useEffect(()=>{let active=true;gameApi.cardGame('state').then(result=>{if(active)setFreeCards(result.free);}).catch(()=>{});return()=>{active=false;};},[]);
  const [rotation, setRotation] = useState(0);
  const wheelAreaRef = useRef(null);
  const [wheelSize, setWheelSize] = useState(0);
  useLayoutEffect(() => {
    const area = wheelAreaRef.current;
    if (!area) return undefined;
    const measure = () => setWheelSize(Math.min(area.clientWidth, area.clientHeight));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  const [spinning, setSpinning] = useState(false);
  const [rewardPopup, setRewardPopup] = useState(null);
  const [toastLabel, setToastLabel] = useState('');
  const [spinCount, setSpinCount] = useState(1);
  const [showBatchHint, setShowBatchHint] = useState(false);
  const [purchasePack, setPurchasePack] = useState(null);
  const maxBatchSpin = Number(profile?.level || 1) >= 100 ? 100 : Number(profile?.level || 1) >= 30 ? 10 : Number(profile?.level || 1) >= 20 ? 5 : 1;
  const batchSpinOptions = [1, 5, 10, 100].filter((count) => count <= maxBatchSpin);
  const spinBusyRef = useRef(false);
  const popupTimerRef = useRef(null);
  const spinTimerRef = useRef(null);
  const pendingRewardRef = useRef(null);
  const suppressPendingRewardPopupRef = useRef(false);
  const onUpdateProfileRef = useRef(onUpdateProfile);
  const lastSpinRewardRef = useRef(null);
  const spinRevealReadyRef = useRef(true);

  const source = useMemo(() => getSpinSource(profile), [profile]);
  const pendingReward = profile?.roulette_pending_reward || null;
  const hasPendingReward = Boolean(pendingReward);
  const lang = (profile?.language === 'en' || profile?.language === 'ru') ? profile.language : 'ua';
  const tx = ROULETTE_TEXT[lang];
  const wheelImage = halloweenActive() ? halloweenWheelArt : wheelArt;
  const wheelTransition = spinning && animationsEnabled
    ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.82, 0.18, 1)`
    : 'none';

  const cleanupPopupTimer = () => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
  };

  const cleanupSpinTimer = () => {
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
  };

  const normalizePopupReward = (reward, fallback = null) => {
    if (!reward) return null;
    const normalizedId = normalizeRouletteRewardId(reward.id || fallback?.id || '');
    const resolvedReward = resolveRouletteRewardById(normalizedId);
    return {
      ...(resolvedReward || {}),
      ...reward,
      id: normalizedId || reward.id || fallback?.id || '',
      pendingId: reward.pendingId || fallback?.pendingId || null,
    };
  };

  useEffect(() => {
    onUpdateProfileRef.current = onUpdateProfile;
  }, [onUpdateProfile]);

  useEffect(() => {
    pendingRewardRef.current = pendingReward;
    if (!pendingReward) {
      suppressPendingRewardPopupRef.current = false;
    }
  }, [pendingReward]);

  const acknowledgePendingReward = async (reward = pendingReward) => {
    if (!reward?.pendingId && !reward?.id) {
      setRewardPopup(null);
      return;
    }
    suppressPendingRewardPopupRef.current = true;
    setToastLabel('');
    try {
      await onUpdateProfile?.({ claimRouletteReward: { pendingId: reward.pendingId || reward.id } });
      setRewardPopup(null);
    } catch (error) {
      suppressPendingRewardPopupRef.current = false;
      if (error?.code === 'ROULETTE_REWARD_MISMATCH') {
        try {
          const current = await onUpdateProfile?.({});
          if (current) onSyncProfile?.({ id: profile.id, roulette_pending_reward: current.roulette_pending_reward ?? null });
          setRewardPopup(null);
          if (current?.roulette_pending_reward) showRewardPopup(current.roulette_pending_reward);
          return;
        } catch (refreshError) {
          setToastLabel(refreshError.message || error.message);
          return;
        }
      }
      showRewardPopup(reward);
      setToastLabel(error.message || 'Claim failed');
    } finally {
      lastSpinRewardRef.current = null;
    }
  };

  const showRewardPopup = (reward) => {
    const normalizedReward = normalizePopupReward(reward);
    if (!normalizedReward?.id) return;
    const groups = new Map();
    for (const entry of normalizedReward.rewards || [normalizedReward]) {
      const r = normalizePopupReward(entry);
      const group = groups.get(r.id) || { reward: r, count: 0 };
      group.count += 1;
      groups.set(r.id, group);
    }
    setRewardPopup({
      reward: normalizedReward,
      title: normalizedReward.spinCount > 1 ? tx.roulette + ' ×' + normalizedReward.spinCount : normalizedReward.type === 'nothing' ? (lang === 'ru' ? 'В следующий раз повезёт. Но это не точно.' : lang === 'en' ? 'Better luck next time. No promises.' : 'Наступного разу пощастить. Але це не точно.') : getRouletteRewardPopupText(normalizedReward, lang),
      items: [...groups.values()].map(({ reward: r, count }) => ({
        id: r.id,
        largeIcon: r.type === 'nothing',
        icon: r.type === 'halloween_pumpkin' ? pumpkinRewardIcon : ROULETTE_REWARD_ICONS[r.id] || ROULETTE_WHEEL_ART[r.id],
        label: r.type === 'nothing' ? '' : getRouletteRewardLabel(r, lang),
        text: r.type === 'nothing' ? (count > 1 ? `×${count}` : '') : getRouletteRewardPopupText(r, lang) + (count > 1 ? ' ×' + count : ''),
        accent: r.accent,
        pendingId: normalizedReward.pendingId,
      })),
    });
    cleanupPopupTimer();
  };

  const handleSpin = async (mode = source.type) => {
    if (spinBusyRef.current || spinning || hasPendingReward || !batchSpinOptions.includes(spinCount)) return;
    if (mode === 'free' && source.type !== 'free') return;
    if (mode === 'bonus' && source.type !== 'bonus') return;
    if (mode === 'paid') {
      if (Number(profile?.premium || 0) < PAPER_SPIN_COST * spinCount) return;
    } else if (Number(profile?.roulette_bonus_spins || 0) + (mode === 'free' ? 1 : 0) < spinCount) return;
    spinBusyRef.current = true;
    setSpinning(true);
    setToastLabel('');
    setRewardPopup(null);
    spinRevealReadyRef.current = false;
    cleanupPopupTimer();
    cleanupSpinTimer();

    let spinStarted = false;
    try {
      const result = await onUpdateProfile?.({ spinRoulette: { spinType: mode, count: spinCount } });
      const nextProfile = result?.player || result?.data || result || {};
      const explicitRewardId = normalizeRouletteRewardId(
        result?.selectedRewardId || result?.reward?.id || result?.rewardId || nextProfile?.roulette_last_reward_id,
      );
      const selectedIndex = Number.isFinite(Number(result?.selectedIndex))
        ? Number(result.selectedIndex)
        : getRouletteRewardIndex(explicitRewardId);
      const selectedAngle = Number.isFinite(Number(result?.selectedAngle))
        ? Number(result.selectedAngle)
        : getRouletteRewardCenterAngleByIndex(selectedIndex, ROULETTE_REWARD_COUNT);
      if (selectedIndex < 0) throw new Error('Roulette selected index missing');
      const reward = normalizePopupReward(
        result?.reward?.id
          ? result.reward
          : resolveRouletteRewardById(explicitRewardId) || inferRouletteRewardFromState(profile || {}, nextProfile),
        result?.pending_reward || nextProfile?.roulette_pending_reward || pendingReward || null,
      );
      if (!reward?.id) throw new Error('Roulette reward missing');
      const selectedRewardId = reward.id;
      lastSpinRewardRef.current = {
        rewardId: selectedRewardId,
        pendingId: reward.pendingId || result?.pending_reward?.pendingId || null,
      };
      if (!animationsEnabledRef.current) {
        spinRevealReadyRef.current = true;
        showRewardPopup(reward);
        return;
      }
      const fullSpins = MIN_FULL_SPINS;
      const targetAngle = normalizeAngle(selectedAngle - WHEEL_POINTER_ANGLE);
      const currentAngle = normalizeAngle(rotation);
      const deltaToTarget = normalizeAngle(targetAngle - currentAngle);
      const totalRotation = rotation + (fullSpins * 360) + deltaToTarget;
      const finalAngle = Number(normalizeAngle(totalRotation).toFixed(2));

      console.log(`[roulette] spin target rewardId=${selectedRewardId} index=${selectedIndex} selectedAngle=${Number(selectedAngle.toFixed(2))} finalAngle=${finalAngle}`);

      spinStarted = true;
      setRotation(totalRotation);
      popupTimerRef.current = window.setTimeout(() => {
        spinRevealReadyRef.current = true;
        showRewardPopup(reward);
      }, SPIN_DURATION_MS + 120);
    } catch (error) {
      if (error?.code === 'ROULETTE_REWARD_PENDING') {
        try {
          const current = await onUpdateProfile?.({});
          lastSpinRewardRef.current = null;
          spinRevealReadyRef.current = true;
          suppressPendingRewardPopupRef.current = false;
          if (current?.roulette_pending_reward) showRewardPopup(current.roulette_pending_reward);
          setToastLabel('');
        } catch (refreshError) {
          setToastLabel(refreshError.message || error.message);
        }
      } else if (error?.code === 'NO_BONUS_SPINS' || error?.code === 'FREE_SPIN_USED') {
        setToastLabel(lang==='ru'?'Недостаточно прокруток. Обновляем остаток…':lang==='en'?'Not enough spins. Updating balance…':'Недостатньо прокрутів. Оновлюємо залишок…');
        void Promise.resolve(onUpdateProfile?.({})).catch(()=>{});
      } else setToastLabel(error.message || 'Spin failed');
    } finally {
      if (spinStarted) spinTimerRef.current = window.setTimeout(() => { spinBusyRef.current = false; setSpinning(false); }, SPIN_DURATION_MS);
      else { spinBusyRef.current = false; setSpinning(false); }
    }
  };

  useEffect(() => () => {
    cleanupPopupTimer();
    cleanupSpinTimer();
  }, []);
  useEffect(() => {
    const pendingId = pendingReward?.pendingId || pendingReward?.id || null;
    const lastSpin = lastSpinRewardRef.current;
    const matchesLastSpin = !lastSpin || pendingId === lastSpin.pendingId || pendingReward?.id === lastSpin.rewardId;
    if (pendingReward && !rewardPopup && !spinning && matchesLastSpin && spinRevealReadyRef.current && !suppressPendingRewardPopupRef.current) {
      showRewardPopup(pendingReward);
    }
  }, [pendingReward, rewardPopup, spinning]);

  const casinoTabs = CardGameDemo ? <div className="casino-tabs" role="tablist" aria-label={lang==='en'?'Games':lang==='ru'?'Игры':'Ігри'}>{[['roulette',tx.roulette],['cards',lang==='en'?'Contraband':lang==='ru'?'Контрабанда':'Контрабанда']].map(([id,label])=><button key={id} className="casino-tab" type="button" role="tab" aria-selected={casinoTab===id} disabled={spinning||cardBusy||hasPendingReward} onClick={()=>{setCasinoTab(id);if(id==='cards')setCardsVisited(true);}}><span>{label}{id==='cards'&&freeCards>0&&<b className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#bdd36d] px-1 text-[9px] text-[#172515]">{freeCards}</b>}</span></button>)}</div> : null;
  return (
    <div className="relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[22px] bg-[#171223] text-[#142016] shadow-[0_18px_70px_rgba(0,0,0,0.65)]">
      <div
        className="pointer-events-none absolute inset-0 rounded-[20px] bg-[#080f0c] bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(15,9,25,0.32), rgba(12,9,20,0.58)), url(${rouletteBackdrop})` }}
        aria-hidden="true"
      />
      <div className="z-10 flex min-h-0 flex-1 flex-col" style={{display:casinoTab==='roulette'?undefined:'none'}}>
              <button type="button" aria-label={lang === 'ru' ? 'Условия прокрутов' : lang === 'en' ? 'Spin options' : 'Умови прокрутів'} aria-expanded={showBatchHint} onClick={() => setShowBatchHint((value) => !value)} className="absolute right-4 top-[68px] z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#151020]/65 font-black text-[#dbe9c8] shadow-lg">?</button>
              {showBatchHint&&<CasinoRulesDialog title={lang==='en'?'Roulette rules':lang==='ru'?'Правила рулетки':'Правила рулетки'} confirmLabel={lang==='en'?'Got it':lang==='ru'?'Понятно':'Зрозуміло'} onClose={()=>setShowBatchHint(false)} items={[
                tx.daily_free_spin_description,
                lang==='ru'?'Каждый прокрут выдаёт отдельную случайную награду.':lang==='en'?'Each spin gives a separate random reward.':'Кожен прокрут видає окрему випадкову нагороду.',
                lang==='ru'?'×5 доступен с 20 уровня, ×10 — с 30, ×100 — со 100.':lang==='en'?'×5 unlocks at level 20, ×10 at level 30, and ×100 at level 100.':'×5 доступний з 20 рівня, ×10 — з 30, ×100 — зі 100.',
                lang==='ru'?`Стоимость одного дополнительного прокрута: ${paidSpinLabel(1)} или ${PAPER_SPIN_COST} T-Pape.`:lang==='en'?`One extra spin costs ${paidSpinLabel(1)} or ${PAPER_SPIN_COST} T-Pape.`:`Один додатковий прокрут коштує ${paidSpinLabel(1)} або ${PAPER_SPIN_COST} T-Pape.`,
                lang==='ru'?'Перед следующим прокрутом забери предыдущую награду.':lang==='en'?'Claim your previous reward before spinning again.':'Перед наступним прокрутом забери попередню нагороду.'
              ]}/>}

        <div className="flex shrink-0 items-center justify-between gap-2 bg-gradient-to-b from-[#100d1d]/80 to-transparent px-4 pb-2 pt-3">
          {casinoTabs || <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#9dff43]">{tx.lucky_roll}</p>
            <h2 className="font-sans text-[23px] font-black uppercase leading-none text-[#f8ffe8] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">{tx.roulette}</h2>
          </div>}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'ru' ? 'Закрыть' : lang === 'en' ? 'Close' : 'Закрити'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#151020]/65 text-[#f4ebce] transition hover:brightness-110"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 overflow-hidden px-3 pb-2"
        >
          <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col">
            <div ref={wheelAreaRef} className="pointer-events-none relative mx-auto min-h-0 w-full flex-1 overflow-hidden">
              <div className="relative mx-auto" style={{ width: wheelSize, height: wheelSize }}>
              <img
                src={rouletteArrowIcon}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-fill"
              />
              <div
                aria-label={tx.roulette_wheel}
                className="absolute inset-0 z-10 h-full w-full"
                style={{
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                  transformOrigin: '50% 50%',
                  transition: wheelTransition,
                }}
              >
                <img src={wheelImage} alt="" aria-hidden="true" draggable="false" decoding="async" width={680} height={680} className="h-full w-full select-none object-fill" />
              </div>
            </div>

            </div>

            <div className="pointer-events-auto relative z-30 mt-1 shrink-0">
              <div className="mb-1 flex justify-center gap-1.5">
                {batchSpinOptions.map((count) => <GameTextureButton key={count} type="button" tone={spinCount === count ? 'green' : 'gray'} aria-pressed={spinCount === count} onPointerDown={event=>{if(event.isPrimary&&event.button===0){event.preventDefault();setSpinCount(count);}}} onClick={() => setSpinCount(count)} className="h-11 min-w-0 flex-1 max-w-20 touch-manipulation enabled:active:translate-y-0"><span className="relative z-10 font-black">×{count}</span></GameTextureButton>)}
              </div>
              <p className="mb-2 text-center font-mono text-[9px] text-[#dbe9c8]">{lang === 'ru' ? `${spinCount} отдельных наград · ${paidSpinLabel(spinCount)} / ${PAPER_SPIN_COST * spinCount} T-Pape` : lang === 'en' ? `${spinCount} separate rewards · ${paidSpinLabel(spinCount)} / ${PAPER_SPIN_COST * spinCount} T-Pape` : `${spinCount} окремих нагород · ${paidSpinLabel(spinCount)} / ${PAPER_SPIN_COST * spinCount} T-Pape`}</p>
              <DualSpinButtons
                lang={lang}
                profile={profile}
                source={source}
                spinning={spinning}
                count={spinCount}
                blocked={hasPendingReward}
                onFreeOrBonusSpin={() => handleSpin(source.type === 'bonus' ? 'bonus' : 'free')}
                onBuySpins={() => setPurchasePack(getRouletteSpinPack(spinCount))}
                onPaperSpin={() => handleSpin('paid')}
                spinBonusLabel={tx.spin_bonus}
                spinFreeLabel={tx.free}
                spin5Label={tx.spin5}
                tutorialTarget="roulette-spin"
              />
            </div>

            <div className="mt-1 flex shrink-0 items-center gap-2 px-2 py-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
              <Gift className="h-4 w-4 shrink-0 text-[#9dff43]" />
              <p className="font-mono text-[9px] leading-snug text-[#dbe9c8]">{tx.daily_free_spin_description}</p>
            </div>
          </div>
        </div>
      </div>

      {CardGameDemo&&cardsVisited&&<div className="absolute inset-0 z-20" style={{display:casinoTab==='cards'?undefined:'none'}}><Suspense fallback={<div className="p-5 text-[#e4eac0]">…</div>}><CardGameDemo embedded live onAvailability={setFreeCards} onBusy={setCardBusy} onRewards={snapshot=>onSyncProfile?.({id:profile.id,...snapshot})} language={lang} onClose={onClose} headerContent={casinoTabs}/></Suspense></div>}
      <RewardPopup
        open={!suspended && Boolean(rewardPopup)}
        title={rewardPopup?.title || ''}
        items={rewardPopup?.items || []}
        tutorialClaimTarget
        language={lang}
        confirmLabel={rewardPopup?.items?.every(item => item.id === 'reward_nothing') ? getRouletteRewardPopupText(resolveRouletteRewardById('reward_nothing'), lang) : lang === 'ru' ? 'Забрать награду' : lang === 'en' ? 'Claim reward' : 'Забрати нагороду'}
        onConfirm={() => acknowledgePendingReward(rewardPopup?.reward)}
        onClose={() => { suppressPendingRewardPopupRef.current = true; setRewardPopup(null); }}
      />

      {purchasePack && !suspended ? createPortal(<PaymentMethodPicker portalLayer pack={purchasePack} paymentMethods={ROULETTE_PAYMENT_METHODS} initialMethodId={ROULETTE_PAYMENT_METHODS[0].id} onClose={() => setPurchasePack(null)} onSuccess={async () => { setPurchasePack(null); await onUpdateProfile?.({}); }} />, document.body) : null}

      {hasPendingReward && !rewardPopup && !spinning && !suspended ? <button type="button" onClick={() => { suppressPendingRewardPopupRef.current = false; showRewardPopup(pendingReward); }} className="relative z-10 my-2 rounded-lg border border-[#d8ff5a] bg-[#20300f] p-3 font-mono text-sm font-black text-[#d8ff5a]">{lang === 'ru' ? 'Сначала забери награду →' : lang === 'en' ? 'Claim your reward first →' : 'Спочатку забери нагороду →'}</button> : null}
      <AnimatePresence>
        {toastLabel ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center"
          >
            <MarkerFrame className="w-full max-w-[280px] shadow-[0_18px_36px_rgba(0,0,0,0.45)]" innerClassName="bg-[linear-gradient(180deg,rgba(12,18,10,0.96)_0%,rgba(6,10,6,0.96)_100%)] px-4 py-4" variant="transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                  <img src={rewardPopup?.items?.[0]?.icon || ROULETTE_WHEEL_ART.reward_energy_50} alt="" aria-hidden="true" className="h-14 w-14 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9dff43]">reward</p>
                  <p className="mt-1 font-sans text-[18px] font-black leading-tight text-[#fff5d9]">{toastLabel}</p>
                </div>
                <Sparkles className="h-5 w-5 shrink-0 text-[#d9ff5f]" />
              </div>
            </MarkerFrame>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}


