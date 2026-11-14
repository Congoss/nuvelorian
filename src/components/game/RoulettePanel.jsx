import { translateUiText } from '@/lib/uiTextTranslations';
﻿import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import paperIcon from '@/assets/optimized/paper.webp';
import energyRewardIcon from '@/assets/ui/energy+50.png';
import freeSpinRewardIcon from '@/assets/ui/spinx1.png';
import largePoisonRewardIcon from '@/assets/skills/large-poison.png';
import mediumPoisonRewardIcon from '@/assets/skills/medium-poison.png';
import smallPoisonRewardIcon from '@/assets/skills/small-poison.png';
import rouletteArrowIcon from '@/assets/roulette/roulette_arrow.png';
import rewardEnergyArt from '@/assets/roulette/reward_energy_50.png';
import rewardSmallPoisonArt from '@/assets/roulette/reward_poison_small.png';
import rewardMediumPoisonArt from '@/assets/roulette/reward_poison_medium.png';
import rewardLargePoisonArt from '@/assets/roulette/reward_poison_large.png';
import rewardFreeSpinArt from '@/assets/roulette/reward_free_spin.png';
import nothingRewardIcon from '@/assets/ui/shit-happens.png';
import GameTextureButton from './GameTextureButton';
import MarkerFrame from './MarkerFrame';
import RewardPopup from './RewardPopup';
import {
  getRouletteRewardLabel,
  getRouletteRewardPopupText,
  getRouletteRewardCenterAngleByIndex,
  getRouletteRewardIndex,
  ROULETTE_REWARD_BY_ID,
  ROULETTE_REWARD_COUNT,
  ROULETTE_WHEEL_SECTOR_ORDER,
  ROULETTE_WHEEL_POINTER_ANGLE as WHEEL_POINTER_ANGLE,
  inferRouletteRewardFromState,
  normalizeRouletteRewardId,
  resolveRouletteRewardById,
} from '@/lib/rouletteRewards';

const STAR_SPIN_COST = 5;
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
    daily_free_spin_description: 'Раз на день доступний один безкоштовний прокрут. Кожне забране щоденне завдання дає +1 бонусний прокрут. Коли бонусні прокрути закінчились, прокрут можна купити за T-Pape.',
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
    daily_free_spin_description: 'You get one free spin once per day. Each claimed daily task gives +1 bonus spin. When bonus spins run out, you can buy a spin with T-Pape.',
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
    daily_free_spin_description: 'Один раз в день доступен один бесплатный прокрут. Каждое забранное ежедневное задание даёт +1 бонусный прокрут. Когда бонусные прокруты заканчиваются, прокрут можно купить за T-Pape.',
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
  reward_nothing: rewardFreeSpinArt,
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSpinSource(profile) {
  const todayKey = getTodayKey();
  const hasFreeSpin = profile?.roulette_last_free_spin !== todayKey;
  const bonusSpins = profile?.roulette_bonus_spins || 0;
  const premium = profile?.premium || 0;

  if (hasFreeSpin) return { type: 'free', label: translateUiText('Безкоштовно'), disabled: false };
  if (bonusSpins > 0) return { type: 'bonus', label: `Bonus x${bonusSpins}`, disabled: false };
  if (premium >= STAR_SPIN_COST) return { type: 'premium', label: `${profile?.language === "en" ? "For" : profile?.language === "ru" ? "За" : "За"} ${STAR_SPIN_COST} T-Pape`, disabled: false };
  return { type: 'locked', label: translateUiText('Нема спінів'), disabled: true };
}

function normalizeAngle(angle) {
  const value = angle % 360;
  return value < 0 ? value + 360 : value;
}

function DualSpinButtons({ profile, source, spinning, blocked = false, onFreeOrBonusSpin, onPremiumSpin, spinBonusLabel, spinFreeLabel, spin5Label, lang = 'ua', count = 1, tutorialTarget }) {
  const availableSpins = Number(profile?.roulette_bonus_spins || 0) + (source.type === 'free' ? 1 : 0);
  const canFreeOrBonus = !spinning && !blocked && availableSpins >= count && (source.type === 'free' || source.type === 'bonus');
  const canPremium = !spinning && !blocked && (profile?.premium || 0) >= STAR_SPIN_COST * count;

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
          {spinning ? '...' : `${lang === 'ru' ? 'ПОЕХАЛИ' : lang === 'en' ? 'LET’S GO' : 'ПОЇХАЛИ'} : ${Math.max(0, availableSpins)}`}
        </span>
      </GameTextureButton>
      <GameTextureButton
        type="button"
        onClick={canPremium ? onPremiumSpin : undefined}
        disabled={!canPremium}
        tone="yellow"
        className={`h-12 ${canPremium ? '' : 'opacity-70 grayscale-[0.18]'}`}
      >
        <span className="relative z-10 flex h-full items-center justify-center gap-1 px-3 font-sans text-[13px] font-black uppercase text-[#1d220e]">
          Buy
          <img src={paperIcon} alt="T-Pape" className="h-6 w-6 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)]" />
          {STAR_SPIN_COST * count}
        </span>
      </GameTextureButton>
    </div>
  );
}

export default function RoulettePanel({ profile, onUpdateProfile, onClose, suspended = false }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rewardPopup, setRewardPopup] = useState(null);
  const [toastLabel, setToastLabel] = useState('');
  const [spinCount, setSpinCount] = useState(1);
  const [showBatchHint, setShowBatchHint] = useState(false);
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
  const wheelRewards = ROULETTE_WHEEL_SECTOR_ORDER.map((rewardId) => ROULETTE_REWARD_BY_ID[rewardId]).filter(Boolean);
  const wheelTransition = spinning
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
      ...reward,
      ...(resolvedReward || {}),
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
    setRewardPopup(null);
    setToastLabel('');
    try {
      await onUpdateProfile?.({ claimRouletteReward: { pendingId: reward.pendingId || reward.id } });
    } catch (error) {
      suppressPendingRewardPopupRef.current = false;
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
      title: normalizedReward.spinCount > 1 ? tx.roulette + ' ×' + normalizedReward.spinCount : normalizedReward.id === 'reward_nothing' ? (lang === 'ru' ? 'В следующий раз повезёт. Но это не точно.' : lang === 'en' ? 'Better luck next time. No promises.' : 'Наступного разу пощастить. Але це не точно.') : getRouletteRewardPopupText(normalizedReward, lang),
      items: [...groups.values()].map(({ reward: r, count }) => ({
        id: r.id,
        largeIcon: r.id === 'reward_nothing',
        icon: ROULETTE_REWARD_ICONS[r.id] || ROULETTE_WHEEL_ART[r.id],
        label: r.id === 'reward_nothing' ? '' : getRouletteRewardLabel(r, lang),
        text: r.id === 'reward_nothing' ? (count > 1 ? `×${count}` : '') : getRouletteRewardPopupText(r, lang) + (count > 1 ? ' ×' + count : ''),
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
    if (mode === 'paid' && (profile?.premium || 0) < STAR_SPIN_COST * spinCount) return;

    if (mode !== 'paid' && Number(profile?.roulette_bonus_spins || 0) + (mode === 'free' ? 1 : 0) < spinCount) return;
    spinBusyRef.current = true;
    setSpinning(true);
    setToastLabel('');
    setRewardPopup(null);
    spinRevealReadyRef.current = false;
    cleanupPopupTimer();
    cleanupSpinTimer();

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
      const fullSpins = MIN_FULL_SPINS;
      const targetAngle = normalizeAngle(selectedAngle - WHEEL_POINTER_ANGLE);
      const currentAngle = normalizeAngle(rotation);
      const deltaToTarget = normalizeAngle(targetAngle - currentAngle);
      const totalRotation = rotation + (fullSpins * 360) + deltaToTarget;
      const finalAngle = Number(normalizeAngle(totalRotation).toFixed(2));

      console.log(`[roulette] spin target rewardId=${selectedRewardId} index=${selectedIndex} selectedAngle=${Number(selectedAngle.toFixed(2))} finalAngle=${finalAngle}`);

      setRotation(totalRotation);
      popupTimerRef.current = window.setTimeout(() => {
        spinRevealReadyRef.current = true;
        showRewardPopup(reward);
      }, SPIN_DURATION_MS + 120);
    } catch (error) {
      setToastLabel(error.message || 'Spin failed');
      setRotation((current) => current + 360);
    } finally {
      spinTimerRef.current = window.setTimeout(() => { spinBusyRef.current = false; setSpinning(false); }, SPIN_DURATION_MS);
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

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col px-2 py-2 text-[#142016]">
      <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[rgba(7,11,7,0.78)] backdrop-blur-[8px]" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between gap-2 rounded-[16px] bg-[linear-gradient(180deg,rgba(12,20,10,0.96)_0%,rgba(4,7,4,0.96)_100%)] px-2 py-2">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#9dff43]">{tx.lucky_roll}</p>
            <h2 className="font-sans text-[23px] font-black uppercase leading-none text-[#f8ffe8] [text-shadow:0_2px_0_rgba(0,0,0,0.85)]">{tx.roulette}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#182015] text-[#e9ffd0] transition hover:brightness-110"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          <MarkerFrame className="p-3" innerClassName="relative z-10" variant="transparent">
            <div className="relative mx-auto w-full max-w-[380px]">
              <div className="relative mx-auto aspect-square w-[calc(100%-36px)] max-w-[340px]">
              <motion.img
                src={rouletteArrowIcon}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 z-20 h-full w-full select-none object-fill drop-shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
              />
              <div
                aria-label={tx.roulette_wheel}
                className="absolute inset-0 z-10 h-full w-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.42)]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: '50% 50%',
                  transition: wheelTransition,
                  willChange: 'transform',
                }}
              >
                {wheelRewards.map((reward, index) => (
                  <img
                    key={reward.id}
                    src={ROULETTE_WHEEL_ART[reward.id]}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                    className="absolute inset-0 h-full w-full select-none object-fill"
                    style={{ zIndex: index + 1 }}
                  />
                ))}
              </div>
            </div>
              <button type="button" aria-label={lang === 'ru' ? 'Условия прокрутов' : lang === 'en' ? 'Spin options' : 'Умови прокрутів'} aria-expanded={showBatchHint} onClick={() => setShowBatchHint((value) => !value)} className="absolute right-0 top-0 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-[#9dff43] bg-[#10170d] font-black text-[#dbe9c8] shadow-lg">?</button>
              {showBatchHint ? <div className="absolute right-0 top-9 z-40 w-[min(270px,calc(100vw-48px))] rounded-lg border border-[#28ee90] bg-[#10170d] p-2 font-mono text-[10px] text-[#dbe9c8] shadow-xl">{lang === 'ru' ? '×5 доступен с 20 уровня, ×10 — с 30, ×100 — с 100. Каждый прокрут выдаёт отдельную случайную награду; для покупки нужно 5 T-Pape за прокрут. Можно использовать бесплатные и бонусные спины. Сначала забери предыдущую награду.' : lang === 'en' ? '×5 unlocks at level 20, ×10 at level 30, and ×100 at level 100. Each spin gives a separate random reward; paid spins cost 5 T-Pape each. Free and bonus spins can be used. Claim the previous reward first.' : '×5 доступний з 20 рівня, ×10 — з 30, ×100 — зі 100. Кожен прокрут дає окрему випадкову нагороду; ціна платного — 5 T-Pape за прокрут. Можна використати безкоштовні й бонусні прокрути. Спочатку забери попередню нагороду.'}</div> : null}
            </div>

            <div className="mt-3">
              <div className="mb-2 flex justify-center gap-1.5">
                {batchSpinOptions.map((count) => <GameTextureButton key={count} type="button" tone={spinCount === count ? 'green' : 'gray'} disabled={spinning || hasPendingReward} onClick={() => setSpinCount(count)} className="h-9 min-w-0 flex-1 max-w-20"><span className="relative z-10 font-black">×{count}</span></GameTextureButton>)}
              </div>
              {spinCount > 1 ? <p className="mb-2 text-center font-mono text-[9px] text-[#dbe9c8]">{lang === 'ru' ? `${spinCount} отдельных наград · ${spinCount} спинов или ${STAR_SPIN_COST * spinCount} T-Pape` : lang === 'en' ? `${spinCount} separate rewards · ${spinCount} spins or ${STAR_SPIN_COST * spinCount} T-Pape` : `${spinCount} окремих нагород · ${spinCount} прокрутів або ${STAR_SPIN_COST * spinCount} T-Pape`}</p> : null}
              <DualSpinButtons
                lang={lang}
                profile={profile}
                source={source}
                spinning={spinning}
                count={spinCount}
                blocked={hasPendingReward}
                onFreeOrBonusSpin={() => handleSpin(source.type === 'bonus' ? 'bonus' : 'free')}
                onPremiumSpin={() => handleSpin('paid')}
                spinBonusLabel={tx.spin_bonus}
                spinFreeLabel={tx.free}
                spin5Label={tx.spin5}
                tutorialTarget="roulette-spin"
              />
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-[14px] border border-[#28ee90] bg-[#10170d] px-3 py-2">
              <Gift className="h-4 w-4 shrink-0 text-[#9dff43]" />
              <p className="font-mono text-[10px] leading-relaxed text-[#dbe9c8]">{tx.daily_free_spin_description}</p>
            </div>
          </MarkerFrame>
        </div>
      </div>

      <RewardPopup
        open={!suspended && Boolean(rewardPopup)}
        title={rewardPopup?.title || ''}
        items={rewardPopup?.items || []}
        tutorialClaimTarget
        language={lang}
        confirmLabel={rewardPopup?.items?.every(item => item.id === 'reward_nothing') ? getRouletteRewardPopupText(resolveRouletteRewardById('reward_nothing'), lang) : lang === 'ru' ? 'Забрать награду' : lang === 'en' ? 'Claim reward' : 'Забрати нагороду'}
        onConfirm={() => acknowledgePendingReward(pendingReward)}
        onClose={() => { suppressPendingRewardPopupRef.current = true; setRewardPopup(null); }}
      />

      {hasPendingReward && !rewardPopup && !spinning && !suspended ? <button type="button" onClick={() => { suppressPendingRewardPopupRef.current = false; showRewardPopup(pendingReward); }} className="relative z-10 my-2 rounded-lg border border-[#d8ff5a] bg-[#20300f] p-3 font-mono text-sm font-black text-[#d8ff5a]">{lang === 'ru' ? 'Есть награда — забрать' : lang === 'en' ? 'Reward waiting — claim' : 'Є нагорода — забрати'}</button> : null}
      <AnimatePresence>
        {toastLabel ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6"
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


