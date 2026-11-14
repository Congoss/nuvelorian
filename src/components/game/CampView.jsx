import Friday13Pet from './Friday13Pet';
import { useFriday13Reminder } from '@/lib/useFriday13Reminder';
import ToasterPet from './ToasterPet';
import { readLocalDossierView, saveLocalDossierView } from '@/lib/localDossierView';
import EnhancementBat from './EnhancementBat';
import { useAchievementLanguage } from '@/lib/useAchievementLanguage';
import { usePartnerTasks } from '@/lib/usePartnerTasks';
import PlayerCollectionLauncher from './PlayerCollectionLauncher';
import PlayerCollection from './PlayerCollection';
import ChatBeacon from './ChatBeacon';
import ReferralAffiliateSettings from './ReferralAffiliateSettings';
import { buildReferralLink } from '@/lib/referralLinks';
import FishingBeacon from './FishingBeacon';
import {getEquipmentEnhancementLevels,getFullEquipmentEnhancement} from '@/lib/equipmentEnhancementPresentation';
import PvpEquipmentStats from './PvpEquipmentStats';
import {CHEESE_BOSS_MEDALS, SOLDIER_BOSS_MEDALS, KANGAROO_BOSS_MEDALS, GUM_QUEEN_BOSS_MEDALS} from '@/lib/shipBossMedals';
import {nextResourcePack,RESOURCE_PACKS} from '@/lib/resourcePacks';
import './resourcePacks.css';
import JunkSkunkPet from './JunkSkunkPet';
import BossMedalList from './BossMedalList';
import PurrgulpPet from './PurrgulpPet';
import bronzeCleopatraMedal from '@/assets/boss-ui/bronze-cleopatrash.png';
import silverCleopatraMedal from '@/assets/boss-ui/silver-cleopatrash.png';
import goldCleopatraMedal from '@/assets/boss-ui/gold-cleopatrash.png';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import EquipmentCatalogCard from './EquipmentCatalogCard';
import EquipmentSourceInfo from './EquipmentSourceInfo';
import RaidScarecrowPet from './RaidScarecrowPet';
import HereEarlyPet from './HereEarlyPet';
import HalloweenPumpkinPet from './HalloweenPumpkinPet';
import VoidlingPet from './VoidlingPet';
import LegionPet from './LegionPet';
import halloweenInviteBanner from '@/assets/IVENTS/halloween-invite-banner.png';
import { halloweenActive, halloweenShopOpen } from '@/lib/halloweenEvent';
import NftPetClaimButton from './NftPetClaimButton';
import { getCampBackgroundName } from './backgrounds';
import i18n from '@/i18n';
import { translateUiText } from '@/lib/uiTextTranslations';
import { getEnergyRewardIcon, getResourceIcon } from '@/lib/resourceIcons';
import PlayerName from './PlayerName';
import airdropsIcon from '@/assets/optimized/camp/airdrops.webp';
import { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense } from 'react';
import { Crown, Footprints, FlaskConical, Hand, HardHat, PawPrint, Pencil, Shield, Shirt, Skull, Sparkles, Sword, Zap } from 'lucide-react';
import { PLAYER_ACHIEVEMENTS } from '@/lib/playerAchievements';
import { dossierRewardReady } from '@/lib/bossDossier';
import dailyIcon from '@/assets/optimized/all/nav/daily-nav.webp';
import cardGameIcon from '@/assets/optimized/all/nav/roulette-nav.webp';
import worldBossIcon from '@/assets/optimized/all/nav/events-nav.webp';
import { isFriday13SaleActive } from '@/lib/friday13Event.js';
import heroNavIcon from '@/assets/optimized/all/nav/equipment-nav.webp';
import chatIcon from '@/assets/optimized/all/nav/chat-nav.webp';
import chatPlusIcon from '@/assets/optimized/camp/nav-chat-plus.webp';
import friendsIcon from '@/assets/optimized/all/nav/friend-nav.webp';
import bronzeMedalBos1 from '@/assets/optimized/camp/medal-bronze-bos1.webp';
import silverMedalBos1 from '@/assets/optimized/camp/medal-silver-bos1.webp';
import goldMedalBos1 from '@/assets/optimized/camp/medal-gold-bos1.webp';
import bronzeMedal from '@/assets/optimized/camp/medal-bronze-medal.webp';
import silverMedal from '@/assets/optimized/camp/medal-silver-medal.webp';
import goldMedal from '@/assets/optimized/camp/medal-gold-medal.webp';
import bronzeMothMedal from '@/assets/optimized/camp/medal-bronze-Moth.webp';
import silverMothMedal from '@/assets/optimized/camp/medal-silver-moth.webp';
import goldMothMedal from '@/assets/optimized/camp/medal-gold-moth.webp';
import bronzeShorkMedal from '@/assets/optimized/camp/medal-bronze-Shork.webp';
import silverShorkMedal from '@/assets/optimized/camp/medal-silver-Shork.webp';
import goldShorkMedal from '@/assets/optimized/camp/medal-gold-Shork.webp';
import bronzeWormMedal from '@/assets/optimized/camp/medal-bronze-Worm.webp';
import silverWormMedal from '@/assets/optimized/camp/medal-silver-worm.webp';
import goldWormMedal from '@/assets/optimized/camp/medal-gold-Worm.webp';
import bronzeSuckholeMedal from '@/assets/optimized/camp/medal-bronze-Suckhole.webp';
import silverSuckholeMedal from '@/assets/optimized/camp/medal-silver-Suckhole.webp';
import goldSuckholeMedal from '@/assets/optimized/camp/medal-gold-Suckhole.webp';
import bronzeShkrabanMedal from '@/assets/optimized/camp/medal-bronze-Shkraban.webp';
import silverShkrabanMedal from '@/assets/optimized/camp/medal-silver-Shkraban.webp';
import goldShkrabanMedal from '@/assets/optimized/camp/medal-gold-Shkraban.webp';
import bronzeSporgolMedal from '@/assets/optimized/camp/medal-bronze-Sporgol.webp';
import silverSporgolMedal from '@/assets/optimized/camp/medal-silver-Sporgol.webp';
import goldSporgolMedal from '@/assets/optimized/camp/medal-gold-Sporgol.webp';
import heroBaseAnimated from '@/assets/hero/hero-base1.gif';
import heroFirstFrame from '@/assets/optimized/first-frame/camp-hero.webp?inline';
import { isSceneImageReady, warmSceneImage } from '@/lib/sceneAssets';
import LayeredHero, { LegendaryCapeLayer } from './LayeredHero';
import NewbieSoulPet from './NewbieSoulPet';
import AvatarWithFrame from './AvatarWithFrame';
import MarkerFrame from './MarkerFrame';
import GameTextureButton from './GameTextureButton';
const AnimatedCampBackground = lazy(() => import('./AnimatedCampBackground'));
const BattlePassGiftPreview = lazy(() => import('./BattlePassGiftPreview'));
const BattlePassScene = lazy(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get('localBattlePass') === '1' ? import('./BattlePassSeasonPreview') : import('./BattlePassScene'));
const loadHalloweenEventScene = () => import('./HalloweenEventScene');
const VoidFlushScene = lazy(loadHalloweenEventScene);
const ResourcePackModal = lazy(() => import('./ResourcePackModal'));
const NewbiePackModal = lazy(() => import('./NewbiePackModal'));
import battlePassIcon from '@/assets/ui/battlepass-ico.png';
import profileLikeIcon from '@/assets/ui/profile-like.png';
import profileDislikeIcon from '@/assets/ui/profile-dislike.png';
import profilePuddle from '../../assets/ui/profile-puddle.png';
import puddleSponge from '../../assets/ui/puddle-sponge.png';
import likeRewardBox from '../../assets/ui/like-reward-box.png';
import goodKarmaIcon from '@/assets/ui/karma-angel.png';
import badKarmaIcon from '@/assets/ui/karma-demon.png';
import newbiePackIcon from '@/assets/optimized/newbie-pack.webp';
import newbiePack2Icon from '@/assets/optimized/newbie-pack-2.webp';
import fingerAttackIcon from '@/assets/optimized/all/skills/slap.webp';
import pencilAttackIcon from '@/assets/optimized/all/skills/fork-strike.webp';
import smallPoisonAttackIcon from '@/assets/optimized/all/skills/small-poison.webp';
import mediumPoisonAttackIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import largePoisonAttackIcon from '@/assets/optimized/all/skills/large-poison.webp';
import { CAMP_BACKGROUNDS, getBossBackgroundDropDescription, getCampBackgroundById, getUnlockedCampBackgrounds } from './backgrounds';
import { GAME_CONFIG, getCollectionDamageBonus } from '@/lib/gameConfig';
import { resolveTalentAttack } from '@/lib/talentCombat';
import { buildEffectiveWeapon } from '@/lib/talents';
import { claimLikeBox, getHalloweenEvent, getPlayerReaction, likePlayer, markPlayerPuddle } from '@/services/gameApi';
import {
  EQUIPMENT_SLOTS,
  DEFAULT_EQUIPMENT_ITEMS,
  buildVisibleHeroSlots,
  calculateEquipmentEffects,
  describeEquipmentBonuses,
  findEquipmentItem,
  getEquipmentSourceLabel,
  getNoBonusLabel,
  NIGHT_DISINFECTOR_SET_ID,
  NUVELOR_SET_ID,
  NEWBIE_PACK_II_SET_ID,
  SET5_SET_ID,
  SET4_SET_ID,
  localizeEquipmentItemName,
  normalizeEquippedLoadout,
  normalizeEquipmentInventory,
} from './equipmentData';
import LootBoxModal from './LootBoxModal';
import { getBossKillCount, getBossMedalTier } from '@/lib/bossMedals';
import { getQuestRewardNotifications } from '@/lib/questNotifications';
import pet5Body from '@/assets/hero/pet5/pet5-body.png';
import pet5Tail from '@/assets/hero/pet5/pet5-tail.png';
import pet5Gum1 from '@/assets/hero/pet5/pet5-gum1.png';
import pet5Gum2 from '@/assets/hero/pet5/pet5-gum2.png';
import pet5Gum3 from '@/assets/hero/pet5/pet5-gum3.png';
import pet5Gum4 from '@/assets/hero/pet5/pet5-gum4.png';
import pet5Gum5 from '@/assets/hero/pet5/pet5-gum5.png';
import pet5Gum6 from '@/assets/hero/pet5/pet5-gum6.png';
import pet1Body from '@/assets/hero/pet1-body.png';
import pet1Antena from '@/assets/hero/pet1-antena.png';
import pet1Finger1 from '@/assets/hero/pet-1-finger1.png';
import pet1Finger2 from '@/assets/hero/pet-1-finger2.png';
import { BP_REWARDS, BP_TRACKS, bpTrackUnlocked } from '@/lib/battlePass';

const BACKGROUNDS = Object.values(CAMP_BACKGROUNDS);

function formatNumber(value) {
  return new Intl.NumberFormat('uk-UA').format(Math.max(0, Math.round(Number(value) || 0)));
}

function AnimatedPet5() {
  const gums = [pet5Gum1, pet5Gum2, pet5Gum3, pet5Gum4, pet5Gum5, pet5Gum6];
  return <div className="pet5-animation absolute inset-0 scale-[0.84] sm:scale-[0.94]" aria-hidden="true">
    <img src={pet5Tail} alt="" className="pet5-layer pet5-tail" />
    <img src={pet5Body} alt="" className="pet5-layer pet5-body" />
    <div className="pet5-gums">{gums.map((src, index) => <img key={src} src={src} alt="" className={`pet5-layer pet5-gum pet5-gum-${index + 1}`} />)}</div>
  </div>;
}

function AnimatedPet1() {
  const [signal, setSignal] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let stopped = false;
    let signalTimer;
    let clickTimer;
    const scheduleSignal = () => {
      signalTimer = window.setTimeout(() => {
        if (stopped) return;
        setSignal(true);
        window.setTimeout(() => !stopped && setSignal(false), 720);
        scheduleSignal();
      }, 4000 + Math.random() * 7000);
    };
    const scheduleClick = () => {
      clickTimer = window.setTimeout(() => {
        if (stopped) return;
        setClicking(true);
        window.setTimeout(() => !stopped && setClicking(false), 220);
        if (Math.random() < 0.25) window.setTimeout(() => {
          if (!stopped) {
            setClicking(true);
            window.setTimeout(() => !stopped && setClicking(false), 220);
          }
        }, 150);
        scheduleClick();
      }, 3000 + Math.random() * 4000);
    };
    scheduleSignal();
    scheduleClick();
    return () => { stopped = true; window.clearTimeout(signalTimer); window.clearTimeout(clickTimer); };
  }, []);

  return <div className="pet1-animation absolute inset-0 scale-[0.84] sm:scale-[0.94]" aria-hidden="true">
    <img src={pet1Body} alt="" className="pet1-layer pet1-body" />
    <img src={pet1Antena} alt="" className={`pet1-layer pet1-antena ${signal ? 'pet1-antena-signal' : ''}`} />
    <img src={pet1Finger1} alt="" className={`pet1-layer pet1-finger1 ${clicking ? 'pet1-finger1-click' : ''}`} />
    <img src={pet1Finger2} alt="" className={`pet1-layer pet1-finger2 ${clicking ? 'pet1-finger2-click' : ''}`} />
  </div>;
}

const HELI_MEDAL_IMGS = {
  bronze: bronzeMedalBos1,
  silver: silverMedalBos1,
  gold: goldMedalBos1,
};

const DEFAULT_MEDAL_IMGS = {
  bronze: bronzeMedal,
  silver: silverMedal,
  gold: goldMedal,
};

const BOSS_MEDAL_IMGS = {
  heli: HELI_MEDAL_IMGS,
  tank: { bronze: bronzeMothMedal, silver: silverMothMedal, gold: goldMothMedal },
  chinook: { bronze: bronzeShorkMedal, silver: silverShorkMedal, gold: goldShorkMedal },
  boss4: { bronze: bronzeWormMedal, silver: silverWormMedal, gold: goldWormMedal },
  boss5: { bronze: bronzeSporgolMedal, silver: silverSporgolMedal, gold: goldSporgolMedal },
  boss6: { bronze: bronzeSuckholeMedal, silver: silverSuckholeMedal, gold: goldSuckholeMedal },
  boss7: { bronze: bronzeCleopatraMedal, silver: silverCleopatraMedal, gold: goldCleopatraMedal },
  boss8: { bronze: bronzeShkrabanMedal, silver: silverShkrabanMedal, gold: goldShkrabanMedal },
};

function IconButton({ icon, label, onClick, badge, beacon = null, alert = false, locked = false, lockLabel = '', large = false, contain = false, emblemGlow = false, tutorialTarget = undefined, scaleIcon = true, uniformHeight = false }) {
  return (
    <button
      type="button"
      data-tutorial-target={tutorialTarget}
      onClick={!locked ? onClick : undefined}
      disabled={locked}
      className={`relative flex flex-col items-center gap-1 transition ${locked ? 'cursor-not-allowed' : 'hover:brightness-110'}`}
    >
      {beacon}
      {badge ? (
        <span className="absolute -right-1 -top-1 z-10 rounded-full border border-[#28ee90] bg-[#ff9d3a] px-1.5 py-[1px] font-mono text-[8px] font-bold text-[#3d220c]">
          {badge}
        </span>
      ) : null}
      <div className={`${uniformHeight ? 'h-[clamp(47px,13.5vw,65px)] w-[clamp(47px,13.5vw,65px)]' : large ? 'w-[clamp(52px,15vw,72px)]' : 'w-[clamp(42px,12vw,58px)]'} ${uniformHeight || contain ? '' : large ? 'h-[clamp(52px,15vw,72px)]' : 'h-[clamp(42px,12vw,58px)]'} ${emblemGlow || uniformHeight ? 'overflow-visible' : 'overflow-hidden'}`}>
        <div className={`relative w-full ${contain && !uniformHeight ? '' : 'h-full'}`}>
          {emblemGlow ? <><span aria-hidden="true" className="battle-pass-icon-glow" /><span aria-hidden="true" className="battle-pass-icon-rays" /></> : null}
          <img src={icon} alt="" aria-hidden="true" className={`relative z-[1] block w-full ${scaleIcon ? 'scale-[1.28]' : ''} ${contain ? (uniformHeight ? 'h-full object-contain' : 'h-auto object-contain') : 'h-full object-cover'} ${locked ? 'grayscale' : ''}`} />
          {alert && !locked ? <span role="status" aria-label="Unclaimed reward" className="absolute right-0.5 top-0.5 z-20 h-3 w-3 rounded-full border-2 border-[#f7e6cf] bg-[#ef4444] shadow-[0_0_7px_rgba(239,68,68,0.9)]" /> : null}
          {locked && lockLabel ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="rounded-full border border-[#28ee90] bg-[rgba(20,20,20,0.92)] px-2 py-[2px] font-mono text-[10px] font-black uppercase text-[#e9ece7] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                {lockLabel}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <span className="max-w-[66px] text-center font-mono text-[clamp(8px,2.25vw,9px)] font-black leading-tight text-[#f6e9d6] [text-shadow:0_1px_0_rgba(0,0,0,0.95),0_0_6px_rgba(0,0,0,0.75)]">
        {label}
      </span>
    </button>
  );
}

function ProfileDislikeEffect({ active }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 592 912" preserveAspectRatio="none" className="profile-pee-stream absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="profile-liquid-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff6a6" stopOpacity=".9" />
            <stop offset=".34" stopColor="#ffe344" stopOpacity=".82" />
            <stop offset=".72" stopColor="#f5c20c" stopOpacity=".72" />
            <stop offset="1" stopColor="#fff07c" stopOpacity=".78" />
          </linearGradient>
          <filter id="profile-liquid-wobble" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency=".025 .12" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path className="profile-pee-stream-outline" d="M 570 920 C 548 842, 508 766, 463 704 C 417 646, 370 634, 316 665 C 287 682, 263 708, 244 732" />
        <path className="profile-pee-stream-fill" d="M 570 920 C 548 842, 508 766, 463 704 C 417 646, 370 634, 316 665 C 287 682, 263 708, 244 732" />
        <g className="profile-pee-droplets">
          <circle cx="496" cy="762" r="5" />
          <circle cx="449" cy="706" r="3.5" />
          <circle cx="339" cy="675" r="4.5" />
        </g>
      </svg>
    </div>
  );
}

function CleanablePuddle({ dragging = false, onStop, onSpongeMove, onComplete }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const cleanedRef = useRef(0);

  useEffect(() => {
    const image = new Image();
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      const context = canvas.getContext('2d');
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = bounds.width / bounds.height;
      const width = targetRatio > sourceRatio ? bounds.height * sourceRatio : bounds.width;
      const height = targetRatio > sourceRatio ? bounds.height : bounds.width / sourceRatio;
      context.drawImage(image, (bounds.width - width) / 2, (bounds.height - height) / 2, width, height);
    };
    image.onload = draw;
    image.src = profilePuddle;
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  const erase = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const bounds = canvas.getBoundingClientRect();
    const point = { x: clientX - bounds.left, y: clientY - bounds.top };
    onSpongeMove?.(clientX, clientY);
    const previous = lastPointRef.current || point;
    const context = canvas.getContext('2d');
    const radius = Math.max(18, bounds.width * 0.075);
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineWidth = radius * 2;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
    cleanedRef.current += Math.max(radius * radius * 0.22, Math.hypot(point.x - previous.x, point.y - previous.y) * radius * 1.8);
    lastPointRef.current = point;
    if (cleanedRef.current >= bounds.width * bounds.height * 0.085) {
      drawingRef.current = false;
      onStop?.();
      onComplete();
    }
  };

  useEffect(() => {
    if (!dragging) return undefined;
    drawingRef.current = true;
    const move = (event) => erase(event.clientX, event.clientY);
    const stop = () => { drawingRef.current = false; lastPointRef.current = null; onStop?.(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
    window.addEventListener('pointercancel', stop, { once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [dragging]);

  return <>
    <canvas ref={canvasRef} aria-label="Clean the puddle" className="profile-pee-puddle pointer-events-none absolute inset-0 z-[2] h-full w-full scale-[0.84] touch-none sm:scale-[0.94]" />
  </>;
}

function getInviteBadgeLabel(friend) {
  const raw = String(friend?.username || friend?.playerId || 'FR').trim();
  const compact = raw.replace(/[^a-z0-9а-яіїєґ_-]/gi, '');
  return (compact.slice(0, 2) || 'FR').toUpperCase();
}

function FriendInviteRow({ friend, t, onClaim, claiming = false, claimed = false }) {
  const status = claimed || friend?.rewardClaimed
    ? 'claimed'
    : (Number(friend?.level || 0) >= 20 ? 'reward_ready' : (Number(friend?.level || 0) > 1 ? 'active' : (friend?.status || 'joined')));
  const isReady = status === 'reward_ready';
  const isClaimed = status === 'claimed';

  return (
    <div
      className={`flex items-center gap-2 border px-2 py-2 transition ${
        isReady
          ? 'border-[#28ee90] bg-[#112b46]'
          : isClaimed
            ? 'border-[#28ee90] bg-[#0d130b] opacity-75'
            : 'border-[#28ee90] bg-[#0f160c] hover:border-[#28ee90] hover:bg-[#121b0f]'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-[10px] font-black ${isReady ? 'border-[#28ee90] bg-[#12253a] text-[#d9ecff]' : 'border-[#28ee90] bg-[#111710] text-[#dff5c5]'}`}>
        {getInviteBadgeLabel(friend)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[10px] font-black text-[#e7f6d7]"><PlayerName player={friend} name={friend?.username || `#${friend?.playerId || 'friend'}`} /></p>
        <p className={`font-mono text-[9px] uppercase tracking-[0.1em] ${isReady ? 'text-[#b9d5ff]' : 'text-[#9fbc82]'}`}>
          {t(`camp_view.friend_status_${status}`)}
        </p>
      </div>
      <ClaimStateButton
        tone={isClaimed ? 'done' : isReady ? 'ready' : 'muted'}
        label={isClaimed ? 'DONE' : 'CLAIM'}
        onClick={() => onClaim?.(friend)}
        disabled={!isReady || isClaimed || claiming}
        className="w-[76px]"
        textClassName={isClaimed ? 'text-[#13200e]' : isReady ? 'text-[#15210f]' : 'text-[#738765]'}
      />
    </div>
  );
}

function ReferralRewardRow({ tier, t, onClaim, canClaim = false, claimed = false, claiming = false }) {
  const status = claimed ? 'claimed' : canClaim ? 'reward_ready' : 'joined';
  const isReady = status === 'reward_ready';
  const isClaimed = status === 'claimed';

  return (
    <div
      className={`flex items-center gap-2 border px-2 py-2 transition ${
        isReady
          ? 'border-[#28ee90] bg-[#112b46]'
          : isClaimed
            ? 'border-[#28ee90] bg-[#0d130b] opacity-75'
            : 'border-[#28ee90] bg-[#0f160c] hover:border-[#28ee90] hover:bg-[#121b0f]'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-[10px] font-black ${isReady ? 'border-[#28ee90] bg-[#12253a] text-[#d9ecff]' : 'border-[#28ee90] bg-[#111710] text-[#dff5c5]'}`}>
        {String(tier?.needed || tier?.key || 'R').replace('tier_', '')}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[10px] font-black text-[#e7f6d7]">{tier?.title || tier?.label || tier?.key || 'Reward'}</p>
        <p className={`font-mono text-[9px] uppercase tracking-[0.1em] ${isReady ? 'text-[#b9d5ff]' : 'text-[#9fbc82]'}`}>
          {t(`camp_view.friend_status_${status}`)}
        </p>
      </div>
      <ClaimStateButton
        tone={isClaimed ? 'done' : isReady ? 'ready' : 'muted'}
        label={isClaimed ? 'DONE' : 'CLAIM'}
        onClick={() => onClaim?.(tier)}
        disabled={!canClaim || isClaimed || claiming}
        className="w-[76px]"
        textClassName={isClaimed ? 'text-[#13200e]' : isReady ? 'text-[#15210f]' : 'text-[#738765]'}
      />
    </div>
  );
}

function CampButtonTexture({ tone = 'ready' }) {
  const style = tone === 'daily'
    ? { backgroundImage: 'radial-gradient(ellipse at 9% 23%,rgba(255,236,141,.5) 0 5%,transparent 6%),radial-gradient(ellipse at 91% 75%,rgba(255,220,99,.38) 0 5%,transparent 6%),linear-gradient(180deg,#ffd85b 0%,#f5b832 55%,#d98816 88%,#98510d 100%)' }
    : tone === 'muted'
    ? { backgroundImage: 'linear-gradient(180deg,#5a6551 0%,#30392b 64%,#1d2419 100%)' }
    : tone === 'done'
      ? { backgroundImage: 'linear-gradient(180deg,#b7d76e 0%,#89af3e 60%,#59751f 100%)' }
      : {
        backgroundImage: 'radial-gradient(ellipse at 9% 23%,rgba(235,250,114,.48) 0 5%,transparent 6%),radial-gradient(ellipse at 14% 38%,rgba(222,244,91,.36) 0 4%,transparent 5%),radial-gradient(ellipse at 91% 75%,rgba(229,247,99,.42) 0 5%,transparent 6%),radial-gradient(ellipse at 85% 88%,rgba(210,237,73,.28) 0 4%,transparent 5%),linear-gradient(180deg,#a9d239 0%,#9ac72e 55%,#82aa20 86%,#58730f 100%)',
      };
  return <span aria-hidden="true" className="pointer-events-none absolute inset-px rounded-[8px_6px_9px_5px] border border-[#5d7718] shadow-[inset_0_1px_0_rgba(244,255,155,0.42),inset_0_-2px_0_rgba(43,62,6,0.3)]" style={style} />;
}

function ClaimStateButton({ label, tone = 'ready', onClick, disabled = false, textClassName = 'text-[#161f0d]', className = 'w-[84px]', tutorialTarget = undefined }) {
  return (
    <button
      type="button"
      data-tutorial-target={tutorialTarget}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative h-11 shrink-0 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition ${className} ${disabled ? 'cursor-not-allowed' : 'hover:brightness-110 active:translate-y-px'}`}
    >
      <CampButtonTexture tone={tone} />
      <span className={`relative z-10 flex h-full items-center justify-center px-2 text-center font-sans text-[12px] font-black uppercase ${textClassName}`}>
        {label}
      </span>
    </button>
  );
}

function EquipSlotButton({ slot, item, active, onClick, showItem = true, hasNew = false }) {
  const { i18n: slotI18n } = useTranslation();
  const slotLabel = translateUiText(slot.label, slotI18n.language);
  const SlotHintIcon = {
    accessory: Crown,
    animation: Sparkles,
    weapon: Sword,
    head: HardHat,
    hands: Hand,
    armor: Shirt,
    boots: Footprints,
    pet: PawPrint,
  }[slot.id] || Shield;

  return (
    <button
      type="button"
      onClick={onClick}
      title={slotLabel}
      aria-label={slotLabel}
      className={`relative flex h-[82px] w-[82px] items-center justify-center transition ${active ? 'brightness-110' : 'opacity-95'}`}
    >
      {item && showItem ? (
        <span className={`relative z-10 flex h-[76px] w-[76px] items-center justify-center border-2 border-[#28ee90] bg-black/80 ${active ? 'shadow-[0_0_10px_rgba(40,238,144,0.35)]' : ''}`}>
          <img src={item.icon} alt={item.name} className="h-[70px] w-[70px] object-contain" />
        </span>
      ) : (
        <span aria-label={slotLabel} className={`relative z-10 flex h-[76px] w-[76px] items-center justify-center border-2 bg-black/80 ${active ? 'border-[#28ee90] shadow-[0_0_10px_rgba(40,238,144,0.35)]' : 'border-[#28ee90]'}`}>
          {SlotHintIcon ? <SlotHintIcon aria-hidden="true" className="h-8 w-8 text-[#79915c] opacity-80" strokeWidth={1.6} /> : <img src={slot.icon} alt="" aria-hidden="true" className="h-9 w-9 object-contain opacity-70" />}
        </span>
      )}
      {['accessory', 'animation'].includes(slot.id) ? <span className="absolute bottom-1 inset-x-1 z-20 bg-black/80 text-center text-[9px] font-black text-[#d8f67a]">{slotLabel}</span> : null}
      {hasNew ? <span aria-label="Новий предмет" className="absolute right-0.5 top-0.5 z-20 h-3.5 w-3.5 rounded-full border-2 border-[#fff4d4] bg-[#ef4444] shadow-[0_0_7px_rgba(239,68,68,0.95)]" /> : null}
    </button>
  );
}

function BackgroundSlotButton({ background, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-[82px] w-[82px] items-center justify-center transition ${active ? 'brightness-110' : 'opacity-95'}`}
    >
      <span className={`relative z-10 block h-[76px] w-[76px] overflow-hidden border-2 bg-black/80 ${active ? 'border-[#45a4ff] shadow-[0_0_10px_rgba(69,164,255,0.42)]' : 'border-[#28ee90]'}`}>
        <img src={background.source} alt={getCampBackgroundName(background,i18n.language)} className="h-full w-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center font-mono text-[7px] font-black uppercase tracking-[0.08em] text-[#d9efff]">BG</span>
      </span>
    </button>
  );
}

function BackgroundChoiceCard({ background, selected, unlocked, sourceHint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      className={`flex h-fit w-[142px] shrink-0 flex-col gap-1.5 rounded-[12px] border px-2 py-2 text-left transition ${
        selected
          ? 'border-[#45a4ff] bg-[#101827] shadow-[0_0_0_1px_rgba(69,164,255,0.25)]'
          : 'border-[#28ee90] bg-[#0d120b]'
      } ${unlocked ? 'hover:brightness-110' : 'cursor-not-allowed opacity-55 grayscale-[0.38]'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-[10px] font-black text-[#eff7da]">{getCampBackgroundName(background,i18n.language)}</p>
        <span className={`shrink-0 rounded-full px-2 py-1 font-mono text-[7px] font-black ${unlocked ? 'bg-[#151b10] text-[#d6f36d]' : 'bg-[#21110f] text-[#ffb7a8]'}`}>
          {unlocked ? (selected ? 'ON' : 'SET') : 'LOCK'}
        </span>
      </div>
      <div className="h-[78px] overflow-hidden rounded-[10px] bg-[#081008]">
        <img src={background.source} alt={getCampBackgroundName(background,i18n.language)} className="h-full w-full object-cover" />
      </div>
      <p className="line-clamp-2 min-h-[28px] font-mono text-[7px] leading-tight text-[#94a877]">{sourceHint || background.unlockLabel}</p>
    </button>
  );
}

const seenNewbieOffers = new Set();
const REACTION_STORAGE_PREFIX = 'profile-reaction:v1:';
const PUDDLE_STORAGE_PREFIX = 'profile-puddle:v1:';

function getStoredProfileReaction(profileId) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(`${REACTION_STORAGE_PREFIX}${profileId}`) || 'null');
    return stored?.cooldownUntil > Date.now() && (stored.reaction === 'like' || stored.reaction === 'dislike') ? stored : null;
  } catch {
    return null;
  }
}

function storeProfileReaction(profileId, reaction, cooldownUntil) {
  try {
    window.localStorage.setItem(`${REACTION_STORAGE_PREFIX}${profileId}`, JSON.stringify({ reaction, cooldownUntil }));
  } catch {}
}

function clearStoredProfileReaction(profileId) {
  try { window.localStorage.removeItem(`${REACTION_STORAGE_PREFIX}${profileId}`); } catch {}
}

function hasStoredProfilePuddle(profileId) {
  try { return window.localStorage.getItem(`${PUDDLE_STORAGE_PREFIX}${profileId}`) === '1'; } catch { return false; }
}

function storeProfilePuddle(profileId) {
  try { window.localStorage.setItem(`${PUDDLE_STORAGE_PREFIX}${profileId}`, '1'); } catch {}
}

function clearStoredProfilePuddle(profileId) {
  try { window.localStorage.removeItem(`${PUDDLE_STORAGE_PREFIX}${profileId}`); } catch {}
}

function isLocalTesterProfile(profile) {
  if (!import.meta.env.DEV || !profile) return false;
  return [profile.nickname, profile.username, profile.created_by].some((value) => String(value || '').trim().toLowerCase() === 'local_tester')
    || String(profile.telegram_id || profile.telegramId || '') === '777000';
}

function NewbiePackCountdown({ expiresAt }) {
  const [now, setNow] = useState(Date.now);
  const deadline = new Date(expiresAt || 0).getTime();
  useEffect(() => {
    if (!Number.isFinite(deadline) || deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  if (!expiresAt || !Number.isFinite(deadline)) return null;
  const seconds = Math.max(0, Math.floor((deadline - now) / 1000));
  const label = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((value) => String(value).padStart(2, '0')).join(':');
  return <span role="timer" className="rounded border border-[#b2d64e]/70 bg-[#101b12]/95 px-1.5 py-0.5 font-mono text-[10px] font-black leading-none tabular-nums text-[#ecff9e] shadow-[0_2px_5px_rgba(0,0,0,.6)]">{label}</span>;
}

const EQUIPMENT_ATTACK_ROWS = [
  { id: 'fist', icon: fingerAttackIcon, label: { uk: 'Палець', ru: 'Палец', en: 'Finger' } },
  { id: 'knuckle', icon: pencilAttackIcon, label: { uk: 'Олівець', ru: 'Карандаш', en: 'Pencil' } },
  { id: 'satchel', icon: smallPoisonAttackIcon, label: { uk: 'Мала', ru: 'Малый', en: 'Small' } },
  { id: 'f4', icon: mediumPoisonAttackIcon, label: { uk: 'Середня', ru: 'Средний', en: 'Medium' } },
  { id: 'c4', icon: largePoisonAttackIcon, label: { uk: 'Велика', ru: 'Большой', en: 'Large' } },
];

function EquipmentCombatStats({ stats, language, onClose }) {
  const copy = language === 'en'
    ? { title: 'ATTACK STATS', intro: 'Current damage includes your gear, pet, collection and talent bonuses.', detail: 'Values show damage per hit and cooldown. Poison shows your current stock.', how: 'HOW TO READ', steps: ['Damage is calculated from your current equipment.', 'Talent effects and collection bonuses are included.', 'Poison stock shows how many attacks you can use.'], list: 'ATTACKS AND STATS', count: '5 attacks', damage: 'DAMAGE', cooldown: 'COOLDOWN', stock: 'IN BAG', active: 'ACTIVE', unavailable: 'NO STOCK' }
    : language === 'ru'
      ? { title: 'ХАРАКТЕРИСТИКИ АТАК', intro: 'Урон уже учитывает экипировку, питомца, коллекцию и таланты.', detail: 'Показан урон за удар и перезарядка. Для яда — текущий запас.', how: 'КАК ЧИТАТЬ', steps: ['Урон считается с вашей текущей экипировкой.', 'Бонусы талантов и коллекции уже учтены.', 'Запас яда показывает число доступных атак.'], list: 'АТАКИ И ХАРАКТЕРИСТИКИ', count: '5 атак', damage: 'УРОН', cooldown: 'ПЕРЕЗАРЯДКА', stock: 'В ЗАПАСЕ', active: 'АКТИВНО', unavailable: 'НЕТ ЗАПАСА' }
      : { title: 'ХАРАКТЕРИСТИКИ АТАК', intro: 'Шкода вже враховує екіпірування, улюбленця, колекцію та таланти.', detail: 'Показано шкоду за удар і перезарядку. Для отрути — поточний запас.', how: 'ЯК ЧИТАТИ', steps: ['Шкода рахується з вашим поточним екіпіруванням.', 'Бонуси талантів і колекції вже враховані.', 'Запас отрути показує кількість доступних атак.'], list: 'АТАКИ ТА ХАРАКТЕРИСТИКИ', count: '5 атак', damage: 'ШКОДА', cooldown: 'ПЕРЕЗАРЯДКА', stock: 'У ЗАПАСІ', active: 'АКТИВНО', unavailable: 'НЕМАЄ ЗАПАСУ' };
  const cooldownLabel = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    return `${copy.cooldown} ${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
  };
  return (
    <section aria-label={copy.title} className="flex max-h-[min(80vh,680px)] w-full flex-col gap-2 overflow-hidden rounded-[18px] border-2 border-[#28ee90] bg-[#0b130d] p-3 shadow-[0_12px_36px_rgba(0,0,0,0.75)]">
      <div className="flex shrink-0 items-center justify-between gap-2 px-1">
        <h2 className="font-mono text-[14px] font-black uppercase tracking-[0.04em] text-[#e8f4d5]">⚡ {copy.title}</h2>
        {onClose ? <button type="button" aria-label={language === 'en' ? 'Close' : language === 'ru' ? 'Закрыть' : 'Закрити'} onClick={onClose} className="shrink-0 px-1 text-xl font-black leading-none text-[#28ee90]">×</button> : null}
      </div>
      <div className="min-h-0 space-y-2 overflow-y-auto pr-0.5">
      <div className="rounded-lg bg-[#080e0a] p-3">
        <p className="font-sans text-[11px] font-bold leading-snug text-[#dce8cf]">{copy.intro}</p>
        <p className="mt-1 font-sans text-[10px] leading-snug text-[#aab99f]">{copy.detail}</p>
        <div className="mt-2 border-t border-white/10 pt-2">
          <h3 className="mb-1 font-mono text-[9px] font-black uppercase text-[#9cf342]">{copy.how}</h3>
          <ol className="space-y-0.5 font-sans text-[9px] leading-snug text-[#bac8ad]">
            {copy.steps.map((step, index) => <li key={step}><span className="mr-1 font-black text-[#9cf342]">{index + 1}.</span>{step}</li>)}
          </ol>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <h3 className="font-mono text-[11px] font-black uppercase text-[#9cf342]">{copy.list}</h3>
        <span className="shrink-0 font-mono text-[8px] font-bold text-[#aab99f]">{copy.count}</span>
      </div>
      <div className="space-y-1.5">
        {EQUIPMENT_ATTACK_ROWS.map((row) => {
          const stat = stats.find((item) => item.id === row.id);
          if (!stat) return null;
          const hasStock = stat.cooldownSeconds > 0 || stat.stock > 0;
          return (
            <div key={row.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-[#0d140f] px-2 py-1.5">
              <img src={row.icon} alt="" aria-hidden="true" className="h-8 w-8 shrink-0 object-contain" />
              <div className="min-w-0 flex-1">
                <h4 className="font-mono text-[10px] font-black uppercase leading-tight text-[#e0ebd3]">{row.label[language] || row.label.uk}</h4>
                <p className="mt-0.5 font-sans text-[9px] font-semibold leading-tight text-[#acbba1]">{stat.cooldownSeconds > 0 ? <>{copy.cooldown}: <span className="font-mono font-black text-[#f1ffd5]">{cooldownLabel(stat.cooldownSeconds).replace(`${copy.cooldown} `, '')}</span></> : <>{copy.stock}: <span className="font-mono font-black text-[#f1ffd5]">×{stat.stock}</span></>}</p>
              </div>
              <div className={`shrink-0 text-right ${hasStock ? 'text-[#d8f67a]' : 'text-[#93a08d]'}`}>
                <span className="block font-mono text-[7px] font-black uppercase leading-none">{copy.damage}</span>
                <span className="mt-0.5 block font-mono text-[16px] font-black leading-none tabular-nums">{stat.damage}</span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} className="relative h-[38px] shrink-0 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition hover:brightness-110 active:translate-y-px">
          <CampButtonTexture />
          <span className="relative z-10 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[#17350d]">{language === 'en' ? 'CLOSE' : language === 'ru' ? 'ЗАКРЫТЬ' : 'ЗАКРИТИ'}</span>
        </button>
      ) : null}
    </section>
  );
}

export default function CampView({ profile, onOpenTab, onOpenModal, onUpdateProfile, onSyncProfile = null, onAddXp = null, onRefreshProfile = null, readonlyProfile = false, onBackToRanking, cleanupRequested = false, onOpenPlayerProfile = null, activeModal = null, onVoidFlushModeChange = null, chatUnread = false, patchUnread = false }) {
  const friday13ReminderVisible = useFriday13Reminder(profile?.id);
  const [friday13Now, setFriday13Now] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setFriday13Now(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [heroAnimationReady, setHeroAnimationReady] = useState(() => isSceneImageReady(heroBaseAnimated));
  useEffect(() => {
    let active = true;
    warmSceneImage(heroBaseAnimated).then(() => {
      if (active) setHeroAnimationReady(true);
    }, () => {});
    return () => { active = false; };
  }, []);
  const collectionViewKey = `p4-collection-open:${profile?.id}`;
  const [collectionOpen, setCollectionOpenState] = useState(() => readLocalDossierView(collectionViewKey, false) === true);
  function setCollectionOpen(value) { saveLocalDossierView(collectionViewKey, value); setCollectionOpenState(value); }
  const awardsReady = !readonlyProfile && PLAYER_ACHIEVEMENTS.some(item => profile?.player_achievements?.[item.id]?.reward_status === 'pending');
  const [battlePassMode, setBattlePassMode] = useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get('localBattlePass') === '1');
  const [voidFlushMode, setVoidFlushModeState] = useState(false);
  const halloweenVisitKey = `halloween:last-visit:${profile?.id || 'guest'}`;
  const [showHalloweenReminder, setShowHalloweenReminder] = useState(false);
  useEffect(() => {
    if (!halloweenActive() || readonlyProfile) return undefined;
    const update = () => {
      const lastVisit = Number(window.localStorage.getItem(halloweenVisitKey) || 0);
      setShowHalloweenReminder(!lastVisit || Date.now() - lastVisit >= 2 * 60 * 60 * 1000);
    };
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, [halloweenVisitKey, readonlyProfile]);
  const [halloweenVisible, setHalloweenVisible] = useState(halloweenShopOpen);
  useEffect(() => {
    const timer = setInterval(() => setHalloweenVisible(halloweenShopOpen()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [halloweenPrefetch, setHalloweenPrefetch] = useState(null);
  useEffect(() => {
    if (readonlyProfile || !halloweenShopOpen()) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void getHalloweenEvent().then(data => { if (!cancelled) setHalloweenPrefetch(data); }).catch(() => {});
    }, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [profile?.id, readonlyProfile]);
  const openHalloweenEvent = () => {
    if (readonlyProfile || !halloweenShopOpen()) return;
    setVoidFlushMode(true);
    void getHalloweenEvent().then(setHalloweenPrefetch).catch(() => {});
  };
  const setVoidFlushMode = (active) => {

    if (active && !FEATURE_FLAGS.halloween) return;
    if (active) {
      window.localStorage.setItem(halloweenVisitKey, String(Date.now()));
      setShowHalloweenReminder(false);
    }
    setVoidFlushModeState(active);
    onVoidFlushModeChange?.(active);
    if (typeof document !== 'undefined') document.documentElement.dataset.voidFlushScene = active ? 'true' : 'false';
  };
  useEffect(() => {
    const openHalloween = () => { if (!readonlyProfile && FEATURE_FLAGS.halloween) openHalloweenEvent(); };
    window.addEventListener('open-halloween-event', openHalloween);
    return () => window.removeEventListener('open-halloween-event', openHalloween);
  }, [readonlyProfile, onVoidFlushModeChange]);
  useEffect(() => () => {
    onVoidFlushModeChange?.(false);
    if (typeof document !== 'undefined') document.documentElement.dataset.voidFlushScene = 'false';
  }, [onVoidFlushModeChange]);
  useEffect(() => {
    onVoidFlushModeChange?.(voidFlushMode);
    document.documentElement.dataset.voidFlushScene = voidFlushMode ? 'true' : 'false';
  }, [voidFlushMode, onVoidFlushModeChange]);
  const [profileReaction, setProfileReaction] = useState(null);
  const [selectedProfileReaction, setSelectedProfileReaction] = useState(null);
  const [reactionCooldownUntil, setReactionCooldownUntil] = useState(0);
  const [reactionCooldownLeft, setReactionCooldownLeft] = useState(0);
  const likeBoxClaimLock = useRef(false);
  const [likeBoxClaimError,setLikeBoxClaimError]=useState('');
  const [likeBoxDrop, setLikeBoxDrop] = useState(false);
  const [likeBoxReward, setLikeBoxReward] = useState(null);
  const [likeBoxOpen, setLikeBoxOpen] = useState(false);
  const [likeBoxContributors, setLikeBoxContributors] = useState([]);
  const [likeBoxCount, setLikeBoxCount] = useState(0);
  const [likeBoxVisible, setLikeBoxVisible] = useState(false);
  const [dislikeReplay, setDislikeReplay] = useState(0);
  const [dislikeRewardFlight, setDislikeRewardFlight] = useState(false);
  const [reactionLikesAdded, setReactionLikesAdded] = useState(0);
  const [karmaOpen, setKarmaOpen] = useState(false);
  const [reactionDislikesAdded, setReactionDislikesAdded] = useState(0);
  const [localPuddle, setLocalPuddle] = useState(false);
  const [cleaningPuddle, setCleaningPuddle] = useState(false);
  const [spongeDrag, setSpongeDrag] = useState(false);
  const [spongePosition, setSpongePosition] = useState(null);
  const campRef = useRef(null);
  const likeBoxDropPlayedForProfile = useRef(null);
  const previousLikeBox = useRef(null);
  const puddleVisible = Boolean(profile?.puddle_active) || localPuddle || profileReaction === 'dislike';
  const localTester = isLocalTesterProfile(profile);
  const profileLikeBoxCount = Array.isArray(profile?.like_box?.contributions) ? profile.like_box.contributions.length : 0;
  const receivedLikesCount = Math.max(
    Number(profile?.likes_received_count || 0), reactionLikesAdded,
    new Set((Array.isArray(profile?.like_box?.contributions) ? profile.like_box.contributions : []).map((entry) => String(entry?.sender_id || entry?.senderId || '')).filter(Boolean)).size,
    profileLikeBoxCount,
  );
  const receivedDislikesCount = Math.max(
    Number(profile?.dislikes_received_count || 0), reactionDislikesAdded,
    new Set((Array.isArray(profile?.puddle_senders) ? profile.puddle_senders : []).map((entry) => String(entry?.sender_id || entry?.senderId || '')).filter(Boolean)).size,
    Array.isArray(profile?.puddle_senders) ? profile.puddle_senders.length : 0,
  );

  useEffect(() => {
    let cancelled = false;
    setProfileReaction(null);
    setKarmaOpen(false);
    setSelectedProfileReaction(null);
    setReactionCooldownUntil(0);
    setReactionCooldownLeft(0);
    setReactionLikesAdded(0);
    setReactionDislikesAdded(0);
    setLocalPuddle(false);
    if (!readonlyProfile || !profile?.id) return undefined;
    if (hasStoredProfilePuddle(profile.id)) setLocalPuddle(true);
    const stored = getStoredProfileReaction(profile.id);
    if (stored) {
      setSelectedProfileReaction(stored.reaction);
      setReactionCooldownUntil(stored.cooldownUntil);
      setReactionCooldownLeft(Math.max(0, stored.cooldownUntil - Date.now()));
    }
    getPlayerReaction(profile.id).then((result) => {
      if (cancelled) return;
      const reaction = result?.reaction === 'like' || result?.reaction === 'dislike' ? result.reaction : null;
      const cooldownUntil = Number(result?.cooldownUntil || 0);
      if (reaction && cooldownUntil > Date.now()) {
        storeProfileReaction(profile.id, reaction, cooldownUntil);
        setSelectedProfileReaction(reaction);
        setReactionCooldownUntil(cooldownUntil);
        setReactionCooldownLeft(Math.max(0, cooldownUntil - Date.now()));
      } else if (!stored) {
        setSelectedProfileReaction(null);
      }
      if (result?.puddleActive) {
        setLocalPuddle(true);
        storeProfilePuddle(profile.id);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profile?.id, readonlyProfile]);

  useEffect(() => {
    if (!reactionCooldownUntil) return undefined;
    const update = () => {
      const remaining = Math.max(0, reactionCooldownUntil - Date.now());
      setReactionCooldownLeft(remaining);
      if (!remaining) {
        setSelectedProfileReaction(null);
        setReactionCooldownUntil(0);
        clearStoredProfileReaction(profile?.id);
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [reactionCooldownUntil]);

  useEffect(() => {
    setLikeBoxCount(profileLikeBoxCount);
    setLikeBoxVisible(profileLikeBoxCount > 0);
    const previous = previousLikeBox.current;
    const receivedNewLike = !readonlyProfile
      && previous?.profileId === profile?.id
      && profileLikeBoxCount > (previous?.count ?? 0);
    if (receivedNewLike && likeBoxDropPlayedForProfile.current !== profile?.id) {
      likeBoxDropPlayedForProfile.current = profile.id;
      setLikeBoxDrop(false);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setLikeBoxDrop(true));
      });
    }
    previousLikeBox.current = { profileId: profile?.id, count: profileLikeBoxCount };
  }, [profile?.id, profileLikeBoxCount, readonlyProfile]);

  useEffect(() => {
    if (cleanupRequested && profile?.puddle_active && !readonlyProfile) setCleaningPuddle(true);
  }, [cleanupRequested, profile?.puddle_active, readonlyProfile]);

  useEffect(() => {
    if (!profileReaction) return undefined;
    const timeout = window.setTimeout(() => setProfileReaction(null), profileReaction === 'dislike' ? 5200 : 700);
    return () => window.clearTimeout(timeout);
  }, [profileReaction]);
  useEffect(() => {
    if (!likeBoxDrop) return undefined;
    const timeout = window.setTimeout(() => setLikeBoxDrop(false), 850);
    return () => window.clearTimeout(timeout);
  }, [likeBoxDrop]);
  useEffect(() => {
    if (!dislikeRewardFlight) return undefined;
    const timeout = window.setTimeout(() => setDislikeRewardFlight(false), 1300);
    return () => window.clearTimeout(timeout);
  }, [dislikeRewardFlight]);
  const moveSponge = (clientX, clientY) => {
    const bounds = campRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setSpongePosition({
      x: `${Math.max(0, Math.min(100, ((clientX - bounds.left) / bounds.width) * 100))}%`,
      y: `${Math.max(0, Math.min(100, ((clientY - bounds.top) / bounds.height) * 100))}%`,
    });
  };
  const [resourcePack,setResourcePack]=useState(null);
  const [newbiePackMode, setNewbiePackMode] = useState(false);
  const newbiePackExpiresAt = profile?.newbie_pack_1_purchased_at
    ? profile?.newbie_pack_2_expires_at
    : profile?.newbie_pack_1_expires_at;
  const [newbiePackClock, setNewbiePackClock] = useState(() => Date.now());
  const newbiePackDeadline = new Date(newbiePackExpiresAt || 0).getTime();
  const newbiePackOfferExpired = Number.isFinite(newbiePackDeadline) && newbiePackDeadline > 0 && newbiePackDeadline <= newbiePackClock;
  useEffect(() => {
    const deadline = new Date(newbiePackExpiresAt || 0).getTime();
    const remaining = deadline - Date.now();
    if (!Number.isFinite(deadline) || deadline <= 0 || remaining <= 0) return undefined;
    const timer = window.setTimeout(() => setNewbiePackClock(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [newbiePackExpiresAt]);
  const { t } = useTranslation();
  const statsLanguage = useAchievementLanguage();
  const currentLanguage = statsLanguage === 'uk' ? 'ua' : statsLanguage;
  const ui = {
    top: t('camp_view.top', { defaultValue: currentLanguage === 'en' ? 'Top' : currentLanguage === 'ru' ? 'Топ' : 'Топ' }),
    gear: t('camp_view.gear', { defaultValue: currentLanguage === 'en' ? 'Gear' : currentLanguage === 'ru' ? 'Экип' : 'Екіп' }),
    daily: t('camp_view.daily', { defaultValue: currentLanguage === 'en' ? 'Daily' : currentLanguage === 'ru' ? 'Ежедневные' : 'Щоденні' }),
    roulette: t('camp_view.roulette', { defaultValue: currentLanguage === 'en' ? 'Roulette' : currentLanguage === 'ru' ? 'Рулетка' : 'Рулетка' }),
    events: t('camp_view.events', { defaultValue: currentLanguage === 'en' ? 'Events' : currentLanguage === 'ru' ? 'Ивенты' : 'Івенти' }),
    friends: t('camp_view.friends_tab', { defaultValue: currentLanguage === 'en' ? 'Friends' : currentLanguage === 'ru' ? 'Друзья' : 'Друзі' }),
    save: t('camp_view.save', { defaultValue: currentLanguage === 'en' ? 'Save' : currentLanguage === 'ru' ? 'Сохранить' : 'Зберегти' }),
    equip: t('camp_view.equip', { defaultValue: currentLanguage === 'en' ? 'Equip' : currentLanguage === 'ru' ? 'Надеть' : 'Одягнути' }),
    unequip: t('camp_view.unequip', { defaultValue: currentLanguage === 'en' ? 'Unequip' : currentLanguage === 'ru' ? 'Снять' : 'Зняти' }),
    confirm: t('camp_view.confirm', { defaultValue: currentLanguage === 'en' ? 'Confirm' : currentLanguage === 'ru' ? 'Подтвердить' : 'Підтвердити' }),
    cancel: t('camp_view.cancel', { defaultValue: currentLanguage === 'en' ? 'Cancel' : currentLanguage === 'ru' ? 'Отмена' : 'Скасувати' }),
  };
  const [equipmentMode, setEquipmentMode] = useState(false);
  const [starterHintDismissedFor, setStarterHintDismissedFor] = useState(null);
  const showStarterEquipmentHint = !readonlyProfile
    && starterHintDismissedFor !== profile?.id
    && !profile?.preferences?.starterEquipmentHintSeen
    && (profile?.inventory_items || []).some(item => item.starterEquipment === true);
  const [combatStatsOpen, setCombatStatsOpen] = useState(false);
  const [equipmentSaving, setEquipmentSaving] = useState(false);
  const [equipmentError, setEquipmentError] = useState('');
  const [friendsMode, setFriendsMode] = useState(false);
  const [draftBackgroundId, setDraftBackgroundId] = useState(profile?.selected_camp_background || 'garage');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [draftEquippedItems, setDraftEquippedItems] = useState(null);
  const [previewItemName, setPreviewItemName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const enhancementPreviewLevels = useMemo(()=>getEquipmentEnhancementLevels(profile),[profile]);
  const enhancementPreviewLevel = Number(enhancementPreviewLevels[selectedItemId]||0);
  const [openingReferralBox, setOpeningReferralBox] = useState(null);
  const [pendingReferralClaimId, setPendingReferralClaimId] = useState(null);
  const claimedTierKeys = useMemo(() => {
    const legacy = Array.isArray(profile?.referral_rewards_claimed) ? profile.referral_rewards_claimed : [];
    const modern = Array.isArray(profile?.claimedReferralRewards) ? profile.claimedReferralRewards : [];
    return new Set([...legacy, ...modern].map((value) => String(value || '').trim()).filter(Boolean));
  }, [profile?.referral_rewards_claimed, profile?.claimedReferralRewards]);
  const playerLevel = Math.max(1, Number(profile?.level || 1));
  useEffect(() => {
    if (readonlyProfile || playerLevel < 10 || !profile?.newbie_pack_1_unlocked_at) return;
    const offerKey = `newbie-pack-intro:${profile?.id || profile?.telegram_id || ''}:${profile.newbie_pack_1_unlocked_at}`;
    if (seenNewbieOffers.has(offerKey)) return;
    seenNewbieOffers.add(offerKey);
    try {
      if (window.localStorage.getItem(offerKey)) return;
      window.localStorage.setItem(offerKey, '1');
    } catch { /* In-memory tracking still prevents repeat navigation popups. */ }
    if (playerLevel === 10 && !profile?.newbie_pack_1_purchased_at && new Date(profile?.newbie_pack_1_expires_at).getTime() > Date.now()) {
      setNewbiePackMode(true);
    }
  }, [playerLevel, readonlyProfile, profile?.id, profile?.telegram_id, profile?.newbie_pack_1_unlocked_at, profile?.newbie_pack_1_expires_at, profile?.newbie_pack_1_purchased_at]);
  const unlocks = GAME_CONFIG.CONTENT_UNLOCK_LEVELS || {};
  const dailyUnlockLevel = unlocks.daily || 1;
  const rouletteUnlockLevel = unlocks.roulette || 1;
  const dailyLocked = playerLevel < dailyUnlockLevel;
  const rouletteLocked = playerLevel < rouletteUnlockLevel;
  const { hasNew: hasNewPartners } = usePartnerTasks(profile);
  const questNotifications = getQuestRewardNotifications(profile);
  const rouletteBadge = Number(profile?.roulette_bonus_spins || 0);
  const chatBadge = Number(
    profile?.chat_unread_count
      || profile?.unread_messages_count
      || profile?.notification_logs?.filter?.((entry) => !entry?.seen)?.length
      || 0
  );
  const battlePassClaims = Array.isArray(profile?.battle_pass_view?.claims) ? profile.battle_pass_view.claims : [];
  const battlePassView = profile?.battle_pass_view;
  const battlePassHasUnclaimed = Boolean(battlePassView?.active) && BP_REWARDS.some((row) => (
    row.level <= Number(battlePassView?.level || 0)
    && BP_TRACKS.some((track) => bpTrackUnlocked(battlePassView?.tier, track) && !battlePassClaims.includes(`${track}:${row.level}`))
  ));

  const unlockedBackgrounds = useMemo(() => getUnlockedCampBackgrounds(profile), [profile]);
  const previewingBackground = equipmentMode;
  const activeBackgroundId = previewingBackground ? draftBackgroundId : profile?.selected_camp_background;
  const activeBackgroundMeta = getCampBackgroundById(activeBackgroundId);
  const activeBackground = activeBackgroundMeta.source;
  const savedEquippedItems = useMemo(() => normalizeEquippedLoadout({ equipped_items: profile?.equipped_items }), [profile?.equipped_items]);
  const equippedItems = draftEquippedItems || savedEquippedItems;
  const equippedEnhancementLevel = getFullEquipmentEnhancement({...profile,equipped_items:equippedItems});
  const enhancementButterflyStage = [4,6,8,10,12,15].reduce((stage, threshold, index) => equippedEnhancementLevel >= threshold ? index + 1 : stage, 0);
  const visibleHeroSlots = useMemo(() => buildVisibleHeroSlots(equippedItems), [equippedItems]);
  const ownedEquipment = useMemo(() => normalizeEquipmentInventory({
    inventory_items: profile?.inventory_items,
    unlocked_backgrounds: profile?.unlocked_backgrounds,
    bp_background_rewards_separated: profile?.bp_background_rewards_separated,
  }), [profile?.inventory_items, profile?.unlocked_backgrounds, profile?.bp_background_rewards_separated]);

  const equipmentInventory = useMemo(() => {
    const catalog = new Map(DEFAULT_EQUIPMENT_ITEMS.map((item) => [item.id, item]));
    const merged = new Map(DEFAULT_EQUIPMENT_ITEMS.filter(item => !item.hiddenFromCatalog).map(item => [item.id, { ...item, locked: true }]));

    ownedEquipment.forEach((item) => {
      const catalogItem = catalog.get(item.id);
      if (catalogItem) {
        merged.set(item.id, {
          ...catalogItem,
          ...item,
          names: catalogItem.names || item.names || null,
          icon: catalogItem.icon,
          layerSrc: catalogItem.layerSrc || item.layerSrc || null,
          setId: catalogItem.setId || item.setId || null,
          setNameI18n: catalogItem.setNameI18n || item.setNameI18n || null,
          setBonusNameI18n: catalogItem.setBonusNameI18n || item.setBonusNameI18n || null,
          sourceType: catalogItem.sourceType || item.sourceType || null,
          dropSource: catalogItem.dropSource ?? item.dropSource ?? null,
          dropBossId: catalogItem.dropBossId ?? item.dropBossId ?? null,
          purchasable: Boolean(catalogItem.purchasable),
          bossDrop: Boolean(catalogItem.bossDrop),
          bonuses: Array.isArray(catalogItem.bonuses) ? catalogItem.bonuses : [],
          renderArt: item.renderArt || catalogItem.renderArt || null,
          locked: false,
        });
      } else {
        merged.set(item.id, { ...item });
      }
    });

    // Equipped legacy items are owned even without a migrated inventory row.
    Object.values(equippedItems).forEach((itemId) => {
      if (!itemId || merged.get(itemId)?.locked === false) return;
      const catalogItem = catalog.get(itemId);
      if (catalogItem) merged.set(itemId, { ...catalogItem, locked: false });
    });

    return Array.from(merged.values());
  }, [ownedEquipment, equippedItems]);

  const enhancedEquipmentInventory = useMemo(() => equipmentInventory.map((item) => ({
    ...item,
    enhancementLevel: Number(enhancementPreviewLevels[item.id] ?? item.enhancementLevel ?? 0),
  })), [equipmentInventory, enhancementPreviewLevels]);
  const itemMap = useMemo(() => new Map(enhancedEquipmentInventory.map((item) => [item.id, item])), [enhancedEquipmentInventory]);
  const seenEquipmentIds = useMemo(() => new Set(Array.isArray(profile?.seen_equipment_item_ids) ? profile.seen_equipment_item_ids.map(String) : []), [profile?.seen_equipment_item_ids]);
  const hasNewEquipment = equipmentInventory.some((item) => !item.locked && item?.id && !seenEquipmentIds.has(String(item.id)));
  const slotHasNewEquipment = (slotId) => equipmentInventory.some((item) => !item.locked && item?.slot === slotId && item?.id && !seenEquipmentIds.has(String(item.id)));
  const equipmentEffects = useMemo(
    () => calculateEquipmentEffects({ ...profile, equipped_items: equippedItems }, enhancedEquipmentInventory),
    [profile, enhancedEquipmentInventory, equippedItems],
  );
  const equipmentCombatStats = useMemo(() => {
    const statsProfile = { ...profile, equipped_items: equippedItems, inventory_items: enhancedEquipmentInventory.filter(item => !item.locked) };
    const collectionMultiplier = getCollectionDamageBonus(statsProfile);
    return GAME_CONFIG.WEAPONS.map((baseWeapon) => {
      const weapon = buildEffectiveWeapon(baseWeapon, statsProfile);
      const talentDamage = Number(profile?.talent_tree_version || 0) >= 2
        ? resolveTalentAttack({
            weapon,
            levels: profile?.talent_levels || {},
            state: {},
            fight: { current_hp: 50, max_hp: 100 },
            now: 0,
            random: () => 1,
          }).damage
        : weapon.damage;
      const damage = Math.max(1, Math.floor(talentDamage * collectionMultiplier * (1 + Number(weapon.equipmentBossDamagePct || 0))));
      const stockId = { satchel: 'small-poison', f4: 'medium-poison', c4: 'large-poison' }[weapon.id];
      return {
        id: weapon.id,
        damage,
        cooldownSeconds: Math.max(0, Math.round(Number(weapon.cooldownMin || 0) * 60)),
        stock: stockId ? Math.max(0, Number(profile?.weapon_inventory?.[stockId] || 0)) : 0,
      };
    });
  }, [profile, equippedItems, enhancedEquipmentInventory]);
  const equippedLayerMap = useMemo(() => {
    const map = {};
    map.weaponEnhancementVariant='charged';
    map.separateLegendaryCape = true;
    map.equippedWeaponId = equippedItems.weapon || null;
    map.weaponEnhancementLevel=Number(enhancementPreviewLevels[equippedItems.weapon]||0);
    map.equippedHandsId = equippedItems.hands || null;
    ['weapon', 'head', 'hands', 'armor', 'legs', 'boots', 'accessory', 'animation'].forEach((slot) => {
      const item = itemMap.get(equippedItems[slot]);
      if (item?.layerSrc) map[slot] = item.layerSrc;
    });
    applyAnubisLayerOverrides(map, equippedItems, itemMap);
    map.nightDisinfector = {
      weapon: itemMap.get(equippedItems.weapon)?.setId === NIGHT_DISINFECTOR_SET_ID,
      hands: itemMap.get(equippedItems.hands)?.setId === NIGHT_DISINFECTOR_SET_ID,
      armor: itemMap.get(equippedItems.armor)?.setId === NIGHT_DISINFECTOR_SET_ID,
      legs: itemMap.get(equippedItems.legs)?.setId === NIGHT_DISINFECTOR_SET_ID,
      boots: itemMap.get(equippedItems.boots)?.setId === NIGHT_DISINFECTOR_SET_ID,
      head: itemMap.get(equippedItems.head)?.setId === NIGHT_DISINFECTOR_SET_ID,
    };
    map.nuvelor = {
      weapon: itemMap.get(equippedItems.weapon)?.setId === NUVELOR_SET_ID,
      hands: itemMap.get(equippedItems.hands)?.setId === NUVELOR_SET_ID,
      armor: itemMap.get(equippedItems.armor)?.setId === NUVELOR_SET_ID,
      legs: itemMap.get(equippedItems.legs)?.setId === NUVELOR_SET_ID,
      boots: itemMap.get(equippedItems.boots)?.setId === NUVELOR_SET_ID,
      head: itemMap.get(equippedItems.head)?.setId === NUVELOR_SET_ID,
    };
    map.set5 = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === SET5_SET_ID]));
    map.set4 = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === SET4_SET_ID]));
    map.halloween = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === 'halloween_2026']));
    map.bpEpicPet = equippedItems.pet === 'bp_epic_pet';
    map.bpEpicAura = equippedItems.animation === 'bp_epic_animation';
    map.bpLegendaryAura = equippedItems.animation === 'bp_legendary_animation';
    map.bpLegendary = Object.fromEntries(['weapon','head','hands','armor','legs','boots'].map(slot=>[slot,itemMap.get(equippedItems[slot])?.setId==='bp_legendary']));
    map.bpEpic = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === 'bp_epic']));
    map.newbiePackII = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, itemMap.get(equippedItems[slot])?.setId === NEWBIE_PACK_II_SET_ID]));
    return map;
  }, [itemMap, equippedItems, enhancementPreviewLevels]);
  const itemsForSlot = useMemo(() => {
    if (!selectedSlot) return [];
    const dedup = new Map();
    equipmentInventory
      .filter((item) => item.slot === selectedSlot)
      .forEach((item) => {
        if (!item?.id) return;
        const normalizedName = String(localizeEquipmentItemName(item, 'en') || item?.name || '').toLowerCase();
        const isLegacyCardboard =
          !item?.setId &&
          item?.slot !== 'pet' &&
          (
            String(item.id || '').toLowerCase().includes('card') ||
            normalizedName.includes('card')
          );
        const key = item?.setId
          ? `${item.setId}:${item.slot}`
          : isLegacyCardboard
            ? `cardboard_survivor:${item.slot}`
            : item.id;
        const existing = dedup.get(key);
        if (!existing) {
          dedup.set(key, item);
          return;
        }
        const existingOwned = !existing.locked;
        const nextOwned = !item.locked;
        if (nextOwned && !existingOwned) {
          dedup.set(key, item);
          return;
        }
        if (nextOwned === existingOwned) {
          const existingBonusCount = Array.isArray(existing.bonuses) ? existing.bonuses.length : 0;
          const nextBonusCount = Array.isArray(item.bonuses) ? item.bonuses.length : 0;
          if (nextBonusCount > existingBonusCount) dedup.set(key, item);
        }
      });
    return Array.from(dedup.values());
  }, [equipmentInventory, selectedSlot]);
  const equippedPet = findEquipmentItem(equippedItems.pet, equipmentInventory);
  const [affiliateUrl, setAffiliateUrl] = useState(profile?.telegram_affiliate_url || '');
  useEffect(() => { setAffiliateUrl(profile?.telegram_affiliate_url || ''); }, [profile?.id, profile?.telegram_affiliate_url]);
  const referralCode = String(profile?.referral_code || profile?.telegram_id || profile?.id || '');
  const botUsername = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEGRAM_BOT_USERNAME)
    ? String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME)
    : 'planet_4bot';
  const referralLink = buildReferralLink({...profile, telegram_affiliate_url:affiliateUrl}, botUsername);
  const referredFriends = Array.isArray(profile?.referred_friends) ? profile.referred_friends : [];
  const rewardTiers = [
    { key: 'tier_1', needed: 1, boxType: 'invite_box', label: 'Invite Box x1' },
    { key: 'tier_3', needed: 3, boxType: 'big_invite_box', label: 'Big Invite Box x1' },
    { key: 'tier_5', needed: 5, boxType: 'rare_invite_box', label: 'Rare Invite Box x1' },
    { key: 'tier_10', needed: 10, boxType: 'epic_invite_box', label: 'Epic Invite Box x1' },
  ];
  const activeFriendsCount = referredFriends.filter((friend) => Number(friend?.level || 0) >= 20).length;

  const openEquipmentMode = () => {
    if (showStarterEquipmentHint) {
      setStarterHintDismissedFor(profile.id);
      void Promise.resolve(onUpdateProfile?.({preferences:{...profile.preferences,starterEquipmentHintSeen:true}})).catch(() => {});
    }
    setCombatStatsOpen(false);
    setEquipmentError('');
    setFriendsMode(false);
    setDraftEquippedItems(normalizeEquippedLoadout(profile));
    setDraftBackgroundId(profile?.selected_camp_background || 'garage');
    setSelectedSlot(null);
    setPreviewItemName('');
    setSelectedItemId(null);
    setEquipmentMode(true);
  };

  const closeEquipmentMode = () => {
    setCombatStatsOpen(false);
    setEquipmentMode(false);
    setDraftEquippedItems(null);
    setDraftBackgroundId(profile?.selected_camp_background || 'garage');
    setSelectedSlot(null);
    setPreviewItemName('');
    setSelectedItemId(null);
  };

  const openFriendsMode = () => {
    setEquipmentMode(false);
    setFriendsMode(true);
  };

  const closeFriendsMode = () => {
    setFriendsMode(false);
  };

  const bossMedals = [
    { bossId: 'heli', fallback: 'bronze' },
    { bossId: 'tank', fallback: 'silver' },
    { bossId: 'chinook', fallback: 'gold' },
    { bossId: 'boss4', fallback: 'bronze' },
    { bossId: 'boss5', fallback: 'bronze' },
    { bossId: 'boss6', fallback: 'bronze' },
    { bossId: 'boss7', fallback: 'bronze' },
    { bossId: 'boss8', fallback: 'bronze' },
  ].map(({ bossId, fallback }) => {
    const kills = getBossKillCount(profile, bossId);
    const tier = getBossMedalTier(kills);
    const assets = BOSS_MEDAL_IMGS[bossId] || DEFAULT_MEDAL_IMGS;

    return {
      bossId,
      src: assets[tier || fallback],
      tier: tier || fallback,
      unlocked: Boolean(tier),
      rewardReady: !readonlyProfile && dossierRewardReady(profile, bossId),
    };
  }).filter((medal) => medal.unlocked);

  for(const [id,kills] of Object.entries(profile?.ship_boss_kills||{})){
    const tier=getBossMedalTier(Number(kills)||0);
    if(!tier)continue;
    const assets=id==='hull'?CHEESE_BOSS_MEDALS:id==='engine'?SOLDIER_BOSS_MEDALS:id==='hangar'?KANGAROO_BOSS_MEDALS:id==='portal'?GUM_QUEEN_BOSS_MEDALS:DEFAULT_MEDAL_IMGS;
    bossMedals.push({bossId:'ship-'+id,src:assets[tier],tier,unlocked:true,rewardReady:!readonlyProfile && dossierRewardReady(profile,'ship-'+id)});
  }

  const handleSlotSelect = (slotId) => {
    const newlySeenIds = equipmentInventory.filter((item) => !item.locked && item?.slot === slotId && item?.id && !seenEquipmentIds.has(String(item.id))).map((item) => String(item.id));
    if (newlySeenIds.length) void onUpdateProfile?.({ seen_equipment_item_ids: [...seenEquipmentIds, ...newlySeenIds] });
    setSelectedSlot(slotId);
    setPreviewItemName('');
    setSelectedItemId(null);
    if (slotId === 'background') {
      setDraftBackgroundId(profile?.selected_camp_background || 'garage');
    }
  };

  const handleChooseItem = (item) => {
    setSelectedItemId(item.id);
    setPreviewItemName(localizeEquipmentItemName(item, currentLanguage) || item.name);
  };

  const handleEquipSelected = () => {
    if (!selectedSlot || !selectedItemId) return;
    const selectedItem = itemMap.get(selectedItemId);
    if (selectedItem?.locked) return;
    setDraftEquippedItems((current) => {
      const next = current || normalizeEquippedLoadout(profile);
      return {
        ...next,
        [selectedSlot]: selectedItemId,
      };
    });
    setSelectedSlot(null);
    setSelectedItemId(null);
    setPreviewItemName('');
  };


  const handleUnequipSelected = () => {
    if (!selectedSlot) return;
    setDraftEquippedItems((current) => ({
      ...(current || normalizeEquippedLoadout(profile)),
      [selectedSlot]: null,
    }));
    setSelectedSlot(null);
    setSelectedItemId(null);
    setPreviewItemName('');
  };

  const confirmEquipmentMode = async () => {
    if (equipmentSaving) return;
    setEquipmentSaving(true);
    setEquipmentError('');
    try {
      if (!onUpdateProfile) throw new Error('PROFILE_UPDATE_UNAVAILABLE');
      await onUpdateProfile({
        equipped_items: draftEquippedItems || normalizeEquippedLoadout(profile),
        selected_camp_background: unlockedBackgrounds.includes(draftBackgroundId)
          ? draftBackgroundId
          : profile?.selected_camp_background || 'garage',
      });
      closeEquipmentMode();
    } catch (error) {
      setEquipmentError(error?.code || error?.message || 'SAVE_FAILED');
    } finally {
      setEquipmentSaving(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      // ignore clipboard failures
    }
  };

  const [inviteError,setInviteError]=useState('');
  const inviteBusy=useRef(false);
  const inviteFriends = async () => {
    if (typeof window === 'undefined') return;
    const telegram=window.Telegram?.WebApp;
    if(telegram?.initData && typeof telegram.shareMessage==='function' && telegram.isVersionAtLeast?.('8.0')) {
      if(inviteBusy.current)return;
      inviteBusy.current=true;setInviteError('');
      try {
        const response=await fetch('/api/referrals/share',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':telegram.initData},body:'{}'});
        const payload=await response.json();
        if(!response.ok)throw new Error(payload.error||payload.message||'Could not prepare invitation');
        telegram.shareMessage(payload.data.id);
      }catch(error){setInviteError(error.message);}finally{inviteBusy.current=false;}
      return;
    }
    const invitation = new URL('/invite/'+encodeURIComponent(referralCode), window.location.origin);
    invitation.searchParams.set('lang', currentLanguage);
    const text = encodeURIComponent(currentLanguage==='ru'?'🎮 PLANET4 · NUVELORIAN\nБоссы, прокачка и приключения — играй со мной!':currentLanguage==='en'?'🎮 PLANET4 · NUVELORIAN\nBoss battles, upgrades and adventures — join me!':'🎮 PLANET4 · NUVELORIAN\nБоси, прокачка та пригоди — грай зі мною!');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(invitation.href)}&text=${text}`, '_blank');
  };

  const claimedReferralKeys = useMemo(() => {
    const legacy = Array.isArray(profile?.referral_rewards_claimed) ? profile.referral_rewards_claimed : [];
    const modern = Array.isArray(profile?.claimedReferralRewards) ? profile.claimedReferralRewards : [];
    return new Set([...legacy, ...modern].map((value) => String(value || '').trim()).filter(Boolean));
  }, [profile?.referral_rewards_claimed, profile?.claimedReferralRewards]);

  const claimReferralReward = async ({ kind, rewardId, boxType, pendingId, openingBox }) => {
    if (!onUpdateProfile || !kind || !rewardId || openingReferralBox || pendingReferralClaimId) return;
    console.log('[referral-claim] click', { kind, rewardId, boxType, pendingId });
    setPendingReferralClaimId(pendingId || rewardId);
    try {
      console.log('[referral-claim] request', { kind, rewardId });
      const result = await onUpdateProfile({
        claimReferralReward: {
          kind,
          rewardId,
        },
      });
      console.log('[referral-claim] response', result);
      await onRefreshProfile?.();
      if (result?.status === 'already_claimed') return;
      setOpeningReferralBox({
        kind,
        rewardId,
        boxType,
        ...openingBox,
        drops: Array.isArray(result?.drops) ? result.drops : Array.isArray(result?.reward?.drops) ? result.reward.drops : [],
      });
      console.log('[referral-claim] state update', { kind, rewardId, boxType });
    } catch (error) {
      console.error('[referral-claim] failed', error);
    } finally {
      setPendingReferralClaimId(null);
    }
  };

  const claimFriendReward = async (friend) => {
    if (!friend?.playerId) return;
    return claimReferralReward({
      kind: 'friend',
      rewardId: friend.playerId,
      boxType: 'invite_box',
      pendingId: friend.playerId,
      openingBox: { friendId: friend.playerId },
    });
  };

  const claimTierReward = async (tier) => {
    if (activeFriendsCount < tier.needed || claimedTierKeys.has(tier.key) || claimedReferralKeys.has(`tier:${tier.key}`)) return;
    return claimReferralReward({
      kind: 'tier',
      rewardId: tier.key,
      boxType: tier.boxType,
      pendingId: `tier:${tier.key}`,
      openingBox: { tierKey: tier.key },
    });
  };

  const handleOpenReferralBox = async () => {
    return openingReferralBox?.drops || [];
  };

  const closeReferralBox = () => {
    setOpeningReferralBox(null);
    setPendingReferralClaimId(null);
  };

  const canEditScene = !readonlyProfile;
  const sceneMode = canEditScene && (equipmentMode || friendsMode);
  const canConfirmBackground = unlockedBackgrounds.includes(draftBackgroundId);
  const isSelectedItemEquipped = Boolean(
    selectedSlot &&
    selectedItemId &&
    equippedItems[selectedSlot] &&
    equippedItems[selectedSlot] === selectedItemId
  );
  const selectedEquipment = selectedItemId ? itemMap.get(selectedItemId) : null;
  const selectedEquipmentActuallyEquipped = Boolean(selectedEquipment && selectedSlot && equippedItems[selectedSlot] === selectedEquipment.id);
  const selectedEquipmentBonuses = describeEquipmentBonuses(selectedEquipment, currentLanguage);
  const selectedEquipmentRarity = selectedEquipment?.rarity
    ? ({ common: currentLanguage === 'ru' ? 'ОБЫЧНЫЙ' : currentLanguage === 'en' ? 'COMMON' : 'ЗВИЧАЙНИЙ', rare: currentLanguage === 'ru' ? 'РЕДКИЙ' : currentLanguage === 'en' ? 'RARE' : 'РІДКІСНИЙ', epic: currentLanguage === 'ru' ? 'ЭПИЧЕСКИЙ' : currentLanguage === 'en' ? 'EPIC' : 'ЕПІЧНИЙ', legendary: currentLanguage === 'ru' ? 'ЛЕГЕНДАРНЫЙ' : currentLanguage === 'en' ? 'LEGENDARY' : 'ЛЕГЕНДАРНИЙ' }[selectedEquipment.rarity] || '')
    : '';
  const selectedSetBonuses = selectedEquipment?.setId
    ? (equipmentEffects.setBonusesBySet?.[selectedEquipment.setId] || [])
    : [];
  const selectedSetPieceCount = selectedEquipment?.setId
    ? Number(equipmentEffects.setCounts?.[selectedEquipment.setId] || 0)
    : 0;
  const selectedStandaloneBonus = ['accessory', 'animation'].includes(selectedSlot);
  const selectedBonusStatus = selectedEquipmentActuallyEquipped
    ? (profile?.equipped_items?.[selectedSlot] === selectedEquipment?.id
      ? (currentLanguage === 'en' ? 'Bonus active' : currentLanguage === 'ru' ? 'Бонус активен' : 'Бонус активний')
      : (currentLanguage === 'en' ? 'Save equipment to activate' : currentLanguage === 'ru' ? 'Сохраните экипировку для активации' : 'Збережіть екіпірування для активації'))
    : (currentLanguage === 'en' ? 'Equip to activate' : currentLanguage === 'ru' ? 'Наденьте для активации' : 'Одягніть для активації');
  const selectedBuffSlots = selectedSlot === 'pet' || selectedStandaloneBonus
    ? Array.from({ length: selectedStandaloneBonus ? Math.max(1, selectedEquipmentBonuses.length) : 4 }, (_, index) => ({
        pieces: null,
        active: selectedEquipmentActuallyEquipped && Boolean(selectedEquipmentBonuses[index]),
        text: selectedEquipmentBonuses[index] || '—',
      }))
    : [
        { pieces: 1, count: selectedEquipmentActuallyEquipped ? 1 : 0, active: selectedEquipmentActuallyEquipped, text: selectedEquipmentBonuses.join(' · ') || getNoBonusLabel(currentLanguage) },
        ...[2, 4, 6].map((pieces) => {
          const bonus = selectedSetBonuses.find((entry) => entry.pieces === pieces);
          return {
            pieces,
            count: Math.min(selectedSetPieceCount, pieces),
            active: Boolean(bonus && selectedSetPieceCount >= pieces),
            text: bonus?.text || '—',
          };
        }),
      ];
  const localizedSetBonus = (text) => {
    if (currentLanguage === 'ru') return text.replace('Finger damage', 'Урон пальца').replace('Pencil damage', 'Урон карандаша').replace('Boss damage', 'Все атаки: урон');
    if (currentLanguage !== 'en') return text.replace('Finger damage', 'Шкода пальця').replace('Pencil damage', 'Шкода олівця').replace('Boss damage', 'Усі атаки: шкода');
    return text.replace('Boss damage', 'All attacks: damage');
  };

  if (battlePassMode && !readonlyProfile) {
    return (
      <Suspense fallback={<div className="h-full w-full bg-[#0b0d0a]" />}>
        <BattlePassScene profile={profile} onUpdateProfile={onUpdateProfile} onClose={() => setBattlePassMode(false)} onNavigate={(task) => {
          setBattlePassMode(false);
          if (task.metric === 'daily' || task.metric === 'weekly') onOpenModal?.('daily');
          else if (task.metric === 'boss' || task.metric === 'bossKills') onOpenTab?.('boss');
          else if (task.metric === 'energy' || task.metric === 'missions') onOpenTab?.('tasks');
        }} />
      </Suspense>
    );
  }

  if (voidFlushMode && halloweenVisible && !readonlyProfile) {
    return (
      <div data-halloween-scene="true" className="relative z-40 flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#030504]">
        <Suspense fallback={<div className="h-full w-full bg-[#0b0d0a]" />}>
          <VoidFlushScene initialData={halloweenPrefetch} profile={profile} onOpenPlayerProfile={onOpenPlayerProfile} onUpdateProfile={onUpdateProfile} onClose={() => setVoidFlushMode(false)} onNavigate={(target) => { setVoidFlushMode(false); if (target === 'friends') { setFriendsMode(true); return; } if (target === 'daily') { onOpenModal?.('daily'); return; } onOpenTab?.(target); }} />
        </Suspense>
      </div>
    );
  }

  return (
    <div ref={campRef} className="relative flex h-full min-h-full flex-1 flex-col overflow-hidden bg-[#0b0d0a]">
      {activeBackgroundMeta.animatedScene ? (
        <Suspense fallback={<img src={activeBackground} alt="" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover" />}>
          <AnimatedCampBackground sceneId={activeBackgroundMeta.animatedScene} />
        </Suspense>
      ) : (
        <img src={activeBackground} alt="camp" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.04)_42%,rgba(0,0,0,0.22)_100%)]" />
      {collectionOpen && <PlayerCollection profile={profile} language={currentLanguage} onClose={() => setCollectionOpen(false)} />}
      <ProfileDislikeEffect key={dislikeReplay} active={profileReaction === 'dislike'} />
      {readonlyProfile && !sceneMode && profile?.battle_pass_gift_season && <Suspense fallback={null}><BattlePassGiftPreview key={profile.id} player={profile} language={currentLanguage} /></Suspense>}

      {readonlyProfile ? (
          <button
            type="button"
            onClick={onBackToRanking}
            className="absolute left-2 top-2 z-30 rounded-full border border-[#28ee90] bg-[#10160f]/90 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[#e7ffd0] backdrop-blur-[2px] transition hover:brightness-110"
          >
            {currentLanguage === 'en' ? 'Back' : currentLanguage === 'ru' ? 'Назад' : 'Назад'}
          </button>
      ) : null}

      {(
        <div className={`absolute left-1/2 top-0 z-30 flex -translate-x-1/2 flex-col items-center ${readonlyProfile ? 'w-[min(200px,calc(100%_-_24px))]' : 'w-[min(240px,calc(100%_-_24px))]'}`}>
          <div id="camp-karma-drawer" aria-hidden={!readonlyProfile && !karmaOpen} className={`grid w-full transition-[grid-template-rows,opacity] duration-200 ${readonlyProfile || karmaOpen ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}>
          <div className="min-h-0 overflow-hidden">
          <div className={`flex w-full items-center justify-center ${readonlyProfile ? 'gap-1 px-3 py-2' : 'gap-2 px-5 py-3 rounded-b-lg border-x border-b border-[#a6c58c]/20 bg-[#091109]/55 backdrop-blur-[12px]'}`}>
          <div
            className="relative flex h-8 min-w-[68px] items-center justify-end rounded-r-lg border border-[#a6c58c]/40 bg-[#091109]/55 pl-9 pr-2 backdrop-blur-[8px]"
            title={currentLanguage === 'en' ? 'Likes received' : currentLanguage === 'ru' ? 'Получено лайков' : 'Отримано лайків'}
          >
            <img src={goodKarmaIcon} alt={currentLanguage === 'en' ? 'Likes received' : currentLanguage === 'ru' ? 'Получено лайков' : 'Отримано лайків'} className="absolute -left-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 object-contain" />
            <span className="font-mono text-[12px] font-black text-[#cfff72]">{formatNumber(receivedLikesCount)}</span>
          </div>
          <div
            className="relative ml-2 flex h-8 min-w-[68px] items-center justify-end rounded-r-lg border border-[#d97979]/40 bg-[#091109]/55 pl-9 pr-2 backdrop-blur-[8px]"
            title={currentLanguage === 'en' ? 'Dislikes received' : currentLanguage === 'ru' ? 'Получено дизлайков' : 'Отримано дизлайків'}
          >
            <img src={badKarmaIcon} alt={currentLanguage === 'en' ? 'Dislikes received' : currentLanguage === 'ru' ? 'Получено дизлайков' : 'Отримано дизлайків'} className="absolute -left-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 object-contain" />
            <span className="font-mono text-[12px] font-black text-[#ff9a88]">{formatNumber(receivedDislikesCount)}</span>
          </div>
          </div>
          </div>
          </div>
          {!readonlyProfile && <button type="button" onClick={() => setKarmaOpen(open => !open)} aria-expanded={karmaOpen} aria-controls="camp-karma-drawer" aria-label={currentLanguage === 'en' ? 'Toggle karma' : currentLanguage === 'ru' ? 'Показать / скрыть карму' : 'Показати / сховати карму'} className="relative z-10 flex h-6 w-12 items-center justify-center rounded-b-xl border-x border-b border-[#a6c58c]/40 bg-[#091109]/55 text-[#e7ffd0] backdrop-blur-[12px]">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true" className={karmaOpen ? 'rotate-180' : ''}><path d="M3 3L9 9L15 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[24%]">
        <div className="absolute left-[21%] top-[3.1%] h-[14px] w-[96px] rounded-full bg-[rgba(245,255,234,0.28)] blur-[6px] sm:h-[18px] sm:w-[148px] sm:blur-[8px]" />
        <div className="absolute left-[22.5%] top-[4.8%] h-[24px] w-[118px] rounded-full bg-[rgba(245,255,234,0.1)] blur-[14px] sm:h-[34px] sm:w-[164px] sm:blur-[18px]" />
        <div className="absolute right-[18%] top-[3.1%] h-[14px] w-[96px] rounded-full bg-[rgba(245,255,234,0.28)] blur-[6px] sm:h-[18px] sm:w-[148px] sm:blur-[8px]" />
        <div className="absolute right-[19.5%] top-[4.8%] h-[24px] w-[118px] rounded-full bg-[rgba(245,255,234,0.1)] blur-[14px] sm:h-[34px] sm:w-[164px] sm:blur-[18px]" />
      </div>

      {!sceneMode && readonlyProfile ? (
        <div className="absolute left-1.5 top-[20%] z-20 flex flex-col items-center gap-1 sm:left-2">
          <BossMedalList medals={bossMedals.length ? bossMedals : [{bossId:'collection',src:bronzeMedal,tier:'bronze'}]} key={`public-medals-${profile?.id}`} sceneRef={campRef} readonly onOpenAwards={() => setCollectionOpen(true)} awardsLabel={currentLanguage==='ru'?'Награды':currentLanguage==='en'?'Awards':'Нагороди'} />
        </div>
      ) : !sceneMode ? (
        <div className="absolute left-0 z-20 flex flex-col items-start gap-1" style={{ top: 'clamp(94px, 17vh, 122px)' }}>
          <PlayerCollectionLauncher leaderboard language={currentLanguage} onClick={() => onOpenModal?.('leaderboard')} />
          <PlayerCollectionLauncher pvp language={currentLanguage} onClick={() => onOpenModal?.('pvp')} />
          <div className="ml-1.5 p-1.5 sm:ml-2">
          <BossMedalList key={`own-medals-${profile?.id}`} medals={bossMedals.length ? bossMedals : [{bossId:'collection',src:bronzeMedal,tier:'bronze'}]} sceneRef={campRef} onOpenAwards={() => setCollectionOpen(true)} rewardReady={awardsReady} awardsLabel={currentLanguage==='ru'?'Награды':currentLanguage==='en'?'Awards':'Нагороди'} />
          </div>
        </div>
      ) : equipmentMode ? (
        <div className="absolute left-1 z-40 flex flex-col gap-2 sm:left-2 sm:gap-2.5" style={{ top: 'clamp(98px, 18vh, 128px)' }}>
          <div className="absolute bottom-[calc(100%+8px)] left-0">
            <EquipSlotButton slot={EQUIPMENT_SLOTS.find(slot => slot.id === 'accessory')} item={itemMap.get(equippedItems.accessory) || null} hasNew={slotHasNewEquipment('accessory')} active={selectedSlot === 'accessory'} onClick={() => handleSlotSelect('accessory')} />
          </div>
          {EQUIPMENT_SLOTS.filter((slot) => ['weapon', 'hands', 'pet'].includes(slot.id)).map((slot) => (
            <EquipSlotButton
              key={slot.id}
              slot={slot}
              item={itemMap.get(equippedItems[slot.id]) || null}
              hasNew={slotHasNewEquipment(slot.id)}
              active={selectedSlot === slot.id}
              onClick={() => handleSlotSelect(slot.id)}
            />
          ))}
          <BackgroundSlotButton
            background={getCampBackgroundById(profile?.selected_camp_background || 'garage')}
            active={selectedSlot === 'background'}
            onClick={() => handleSlotSelect('background')}
          />
        </div>
      ) : null}

      {!sceneMode && !readonlyProfile ? (
        <div className="absolute right-1.5 z-20 flex flex-col gap-2.5 sm:right-2 sm:gap-3" style={{ top: 'clamp(94px, 17vh, 122px)' }}>
          <div className="relative flex justify-center">
            <IconButton icon={heroNavIcon} label={ui.gear} onClick={openEquipmentMode} alert={hasNewEquipment} contain scaleIcon={false} />
            {showStarterEquipmentHint && !activeModal && <button type="button" onClick={openEquipmentMode} className="absolute right-full top-1/2 mr-3 w-40 -translate-y-1/2 -rotate-2 rounded-[16px_12px_15px_5px] border-2 border-[#152010] bg-[#f1e4aa] px-3 py-2 text-left font-mono text-[11px] font-black leading-tight text-[#172016] shadow-[3px_4px_0_#0008] after:absolute after:-right-2 after:top-1/2 after:h-3 after:w-3 after:-translate-y-1/2 after:rotate-45 after:border-r-2 after:border-t-2 after:border-[#152010] after:bg-[#f1e4aa]">
              {currentLanguage === 'ru' ? 'Новая шмотка! Надень здесь →' : currentLanguage === 'en' ? 'New gear! Equip it here →' : 'Нова шмотка! Вдягни тут →'}
            </button>}
          </div>
          <IconButton
            icon={dailyIcon}
            label={ui.daily}
            onClick={() => onOpenModal?.('daily')}
            tutorialTarget="daily-nav"
            alert={questNotifications.daily || questNotifications.newbie || hasNewPartners}
            locked={dailyLocked}
            lockLabel={`lvl ${dailyUnlockLevel}`}
          />
          <IconButton
            icon={cardGameIcon}
            label={ui.roulette}
            onClick={() => onOpenModal?.('roulette')}
            badge={profile?.roulette_pending_reward ? '!' : rouletteBadge > 0 ? rouletteBadge : undefined}
            tutorialTarget="roulette-nav"
            locked={rouletteLocked}
            lockLabel={`lvl ${rouletteUnlockLevel}`}
          />
          <div className="relative flex justify-center">
            <IconButton icon={worldBossIcon} label={ui.events} beacon={<FishingBeacon profile={profile} />} onClick={() => onOpenModal?.('events')} />
            {friday13ReminderVisible && isFriday13SaleActive(friday13Now) && <div className="friday13-bubble friday13-event-bubble" aria-label="Friday the 13th raid boss"><svg className="friday13-balloon-outline" viewBox="0 0 140 100" preserveAspectRatio="none" aria-hidden="true"><path d="M4 4H120V34L150 23L135 46L152 46L120 70V96H4Z"/></svg><b>{currentLanguage==='en'?'FRIDAY':currentLanguage==='ru'?'ПЯТНИЦА':'П’ЯТНИЦЯ'}</b><strong>13TH</strong><span>{currentLanguage==='en'?'RAID BOSS':currentLanguage==='ru'?'РЕЙДБОСС':'РЕЙДБОС'}</span></div>}
          </div>
          <IconButton icon={friendsIcon} label={ui.friends} onClick={openFriendsMode} badge={chatBadge > 0 ? chatBadge : undefined} tutorialTarget="tutorial-friends" />
        </div>
      ) : !sceneMode && readonlyProfile ? (
        <div className="absolute right-1.5 z-20 flex flex-col gap-2.5 sm:right-2 sm:gap-3" style={{ top: 'clamp(94px, 17vh, 122px)' }}>
          <button type="button" disabled={Boolean(selectedProfileReaction) && !localTester} aria-label="Like player" onClick={async () => {
            setProfileReaction('like');
            setSelectedProfileReaction('like');
            const cooldownUntil = localTester ? 0 : Date.now() + 12 * 60 * 60 * 1000;
            setReactionCooldownUntil(cooldownUntil);
            setReactionCooldownLeft(cooldownUntil - Date.now());
            if (!localTester) storeProfileReaction(profile.id, 'like', cooldownUntil);
            try {
              const result = await likePlayer(profile.id);
              const nextBoxCount = Number(result?.boxCount);
              if (result?.target) setReactionLikesAdded(Number(result.target.likes_received_count || 0));
              else if (result?.added) setReactionLikesAdded(receivedLikesCount + 1);
              if (Number.isFinite(nextBoxCount)) setLikeBoxCount(nextBoxCount);
              if (result?.added || nextBoxCount > 0) {
                setLikeBoxVisible(true);
                if (likeBoxDropPlayedForProfile.current !== profile.id) {
                  likeBoxDropPlayedForProfile.current = profile.id;
                  setLikeBoxDrop(false);
                  window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => setLikeBoxDrop(true));
                  });
                }
              }
              if (result?.player) {
                if(onSyncProfile)onSyncProfile(result.player);
                else void Promise.resolve(onRefreshProfile?.()).catch(()=>{});
              }
            } catch {}
          }} className={`profile-like-button relative h-[70px] w-[70px] transition disabled:cursor-default ${profileReaction === 'like' ? 'profile-like-pop' : ''} ${selectedProfileReaction && selectedProfileReaction !== 'like' ? 'opacity-35 grayscale' : ''} ${selectedProfileReaction === 'like' ? 'profile-reaction-selected opacity-55 grayscale-[0.2]' : ''}`}>
            <img src={profileLikeIcon} alt="Like" className="h-full w-full object-contain" />
          </button>
          <button type="button" disabled={Boolean(selectedProfileReaction) && !localTester} aria-label="Dislike player" onClick={async () => {
            setDislikeReplay((current) => current + 1);
            setProfileReaction('dislike');
            setSelectedProfileReaction('dislike');
            const cooldownUntil = localTester ? 0 : Date.now() + 12 * 60 * 60 * 1000;
            setReactionCooldownUntil(cooldownUntil);
            setReactionCooldownLeft(cooldownUntil - Date.now());
            if (!localTester) {
              storeProfileReaction(profile.id, 'dislike', cooldownUntil);
              storeProfilePuddle(profile.id);
            }
            setLocalPuddle(true);
            try {
              const result = await markPlayerPuddle(profile.id);
              if (result?.target?.dislikes_received_count !== undefined) {
                setReactionDislikesAdded(Number(result.target.dislikes_received_count));
              } else if (result?.target?.puddle_senders) {
                setReactionDislikesAdded(result.target.puddle_senders.length);
              }
              if (result?.reward?.granted) {
                window.setTimeout(() => setDislikeRewardFlight(true), 1800);
                if (result?.player) {
                  if(onSyncProfile)onSyncProfile(result.player);
                  else void Promise.resolve(onRefreshProfile?.()).catch(()=>{});
                }
              }
            } catch {
              // The visual reaction is intentionally local even if a reward is unavailable.
            }
          }} className={`relative h-[70px] w-[70px] transition active:scale-95 disabled:cursor-default ${selectedProfileReaction && selectedProfileReaction !== 'dislike' ? 'opacity-35 grayscale' : ''} ${selectedProfileReaction === 'dislike' ? 'profile-reaction-selected opacity-55 grayscale-[0.2]' : ''}`}>
            <img src={profileDislikeIcon} alt="Dislike" className="h-full w-full object-contain" />
          </button>
          {selectedProfileReaction && reactionCooldownLeft > 0 ? <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 font-mono text-[8px] font-black text-[#d8f67a]" role="timer">{String(Math.floor(reactionCooldownLeft / 3600000)).padStart(2, '0')}:{String(Math.floor(reactionCooldownLeft / 60000) % 60).padStart(2, '0')}:{String(Math.floor(reactionCooldownLeft / 1000) % 60).padStart(2, '0')}</span> : null}
        </div>
      ) : equipmentMode ? (
        <div className="absolute right-1 z-40 flex flex-col gap-2 sm:right-2 sm:gap-2.5" style={{ top: 'clamp(98px, 18vh, 128px)' }}>
          <div className="absolute bottom-[calc(100%+8px)] right-0">
            <EquipSlotButton slot={EQUIPMENT_SLOTS.find(slot => slot.id === 'animation')} item={itemMap.get(equippedItems.animation) || null} hasNew={slotHasNewEquipment('animation')} active={selectedSlot === 'animation'} onClick={() => handleSlotSelect('animation')} />
          </div>
          {EQUIPMENT_SLOTS.filter((slot) => ['head', 'armor', 'legs', 'boots'].includes(slot.id)).map((slot) => (
            <EquipSlotButton
              key={slot.id}
              slot={slot}
              item={itemMap.get(equippedItems[slot.id]) || null}
              hasNew={slotHasNewEquipment(slot.id)}
              active={selectedSlot === slot.id}
              onClick={() => handleSlotSelect(slot.id)}
            />
          ))}
        </div>
      ) : null}
      {!sceneMode && !readonlyProfile && puddleVisible ? (
        <button
          type="button"
          aria-label="Прибратися"
          onPointerDown={(event) => {
            event.preventDefault();
            // Some embedded browsers expose capture but reject it. Native
            // implicit touch capture/window listeners can still finish the drag.
            try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Keep dragging. */ }
            moveSponge(event.clientX, event.clientY);
            setCleaningPuddle(true);
            setSpongeDrag(true);
          }}
          className="absolute z-30 touch-none select-none"
          style={{ touchAction: 'none', ...(spongePosition ? { left: spongePosition.x, top: spongePosition.y, transform: 'translate(-50%, -50%)' } : { right: '6px', bottom: 'calc(var(--bottom-nav-space, 0px) + 8px)' }) }}
        >
          <img src={puddleSponge} alt="Прибратися" draggable={false} className={`h-[clamp(48px,13vw,64px)] w-[clamp(48px,13vw,64px)] object-contain ${cleaningPuddle ? 'profile-sponge-highlight' : ''}`} />
        </button>
      ) : null}
      {!sceneMode && !readonlyProfile && !activeModal ? <div className="pointer-events-none absolute left-1.5 top-2 z-30 flex items-start gap-3 sm:left-2 sm:gap-4">
        {profile?.battle_pass_view ? <div className="pointer-events-auto"><IconButton icon={battlePassIcon} label="BATTLE PASS" contain uniformHeight emblemGlow scaleIcon={false} alert={battlePassHasUnclaimed} onClick={() => setBattlePassMode(true)} /></div> : null}
        {halloweenVisible && <div className="pointer-events-auto relative"><div className="halloween-entry-glow"><IconButton icon={airdropsIcon} label="HALLOWEEN" contain uniformHeight scaleIcon={false} onClick={openHalloweenEvent} /></div>{showHalloweenReminder ? <button type="button" className="halloween-comic-reminder" onClick={openHalloweenEvent}>{profile?.language === 'en' ? 'PUMPKINS ARE WAITING!' : profile?.language === 'ru' ? 'ТЫКВЫ ЖДУТ!' : 'ГАРБУЗИ ЧЕКАЮТ!'}</button> : null}</div>}
      </div> : null}
      {friendsMode && !readonlyProfile ? (
        <div data-tutorial-target="tutorial-friends-panel" className="absolute inset-0 z-40 min-w-0 overflow-hidden bg-[rgba(5,8,5,0.72)] backdrop-blur-[2px]">
          <div className="flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-3">
            <MarkerFrame className="flex h-full min-h-0 min-w-0 flex-1 self-stretch overflow-hidden" innerClassName="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden p-2.5 sm:p-3" variant="dark">
              <div className="mb-2 flex shrink-0"><button type="button" onClick={closeFriendsMode} className="flex min-h-9 items-center gap-1 rounded-md border border-[#28ee90] bg-[#081008]/90 px-2 font-sans text-[10px] font-black text-[#d8ff84]">← {currentLanguage === 'en' ? 'Back' : 'Назад'}</button></div>
              <div className="relative mb-2 aspect-[16/9] max-h-[28dvh] w-full shrink-0 overflow-hidden bg-transparent">
                <img
                  src={halloweenActive() ? halloweenInviteBanner : '/invite-banner-new.webp'}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain object-center opacity-100"
                />
              </div>

              <div className="min-w-0 w-full shrink-0 overflow-hidden border border-[#28ee90] bg-[#10170d] px-2 py-2">
                <p className="truncate font-mono text-[9px] text-[#dbeccb]">{referralLink}</p>{inviteError&&<p className="mt-2 text-xs text-red-400">{inviteError}</p>}
                <div className="mt-2 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="relative h-11 min-w-0 flex-1 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition hover:brightness-110 active:translate-y-px"
                  >
                    <CampButtonTexture />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] font-black text-[#eef7e0] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]">
                      {t('camp_view.copy')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={inviteFriends}
                    className="relative h-11 min-w-0 flex-1 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition hover:brightness-110 active:translate-y-px"
                  >
                    <CampButtonTexture />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] font-black text-[#eef7e0] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]">
                      {t('camp_view.invite')}
                    </span>
                  </button>
                </div>
              </div>

              <ReferralAffiliateSettings profile={profile} affiliateUrl={affiliateUrl} onSaved={value => {
                setAffiliateUrl(value);
                void Promise.resolve(onRefreshProfile?.()).catch(() => {});
              }} />
              <div className="mt-2 h-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-3">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8baa6c]">{t('camp_view.friends_list')}</p>
                <div className="space-y-1">
                  {referredFriends.length ? referredFriends.map((friend) => {
                    return (
                      <div key={friend?.playerId || friend?.username}><FriendInviteRow
                        friend={friend}
                        t={t}
                        onClaim={claimFriendReward}
                        claiming={pendingReferralClaimId === friend?.playerId}
                        claimed={claimedReferralKeys.has(`friend:${friend?.playerId}`) || claimedReferralKeys.has(String(friend?.playerId || ''))}
                      /></div>
                    );
                  }) : <p className="font-mono text-[10px] text-[#7f946e]">{t('camp_view.no_friends')}</p>}
                </div>

                <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8baa6c]">{t('camp_view.rewards_title')}</p>
                <div className="space-y-1">
                  {rewardTiers.map((tier) => {
                    const canClaim = activeFriendsCount >= tier.needed;
                    const isClaimed = claimedReferralKeys.has(`tier:${tier.key}`) || claimedReferralKeys.has(tier.key);
                    return (
                      <ReferralRewardRow
                        key={tier.key}
                        tier={{
                          ...tier,
                          title: t('camp_view.reward_line', { count: tier.needed, reward: tier.label }),
                        }}
                        t={t}
                        onClaim={claimTierReward}
                        canClaim={canClaim}
                        claimed={isClaimed}
                        claiming={pendingReferralClaimId === `tier:${tier.key}`}
                      />
                    );
                  })}
                </div>
              </div>
            </MarkerFrame>
          </div>
        </div>
      ) : null}

      {!sceneMode && !readonlyProfile ? (
        <button
          type="button"
          onClick={() => onOpenModal?.('chat')}
          aria-label={chatUnread || chatBadge > 0 ? (currentLanguage === 'en' ? 'Chat, new messages' : currentLanguage === 'ru' ? 'Чат, новые сообщения' : 'Чат, нові повідомлення') : 'Chat'}
          className="absolute bottom-[calc(var(--bottom-nav-space,0px)+8px)] left-0 z-20 h-[clamp(44px,13vw,62px)] w-[clamp(60px,17vw,84px)] overflow-hidden transition hover:brightness-110"
          data-camp-chat-launcher="true"
        >
          <img src={patchUnread ? chatIcon : chatBadge > 0 ? chatPlusIcon : chatIcon} alt="Chat" className="h-full w-full scale-[1.28] object-contain" style={patchUnread?{clipPath:'polygon(0 0, 59% 0, 59% 36%, 100% 36%, 100% 100%, 0 100%)'}:undefined} />
          {patchUnread ? <span className="absolute right-0 top-0 z-20"><ChatBeacon patch/></span> : chatBadge > 0 ? (
            <span className="absolute right-1 top-1 z-10 rounded-full border border-[#28ee90] bg-[#ff5a5a] px-1.5 py-[1px] font-mono text-[9px] font-black text-white">
              {chatBadge}
            </span>
          ) : chatUnread ? (
            <span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center">
              <span className="relative h-3 w-3 rounded-full border-2 border-white bg-[#ff3434] shadow-[0_0_10px_4px_rgba(255,52,52,.8)]" />
            </span>
          ) : null}
        </button>
      ) : null}

      {!sceneMode && !readonlyProfile && playerLevel >= 10 && !profile?.newbie_pack_2_purchased_at && !newbiePackOfferExpired ? (
        <button
          type="button"
          onClick={() => setNewbiePackMode(true)}
          aria-label="Newbie packs"
          className="absolute right-0 top-2 z-20 flex w-[clamp(60px,17vw,84px)] flex-col items-center gap-0.5 isolate transition hover:brightness-110"
        >
          <span aria-hidden="true" className="battle-pass-icon-glow" />
          <span aria-hidden="true" className="battle-pass-icon-rays" />
          <img src={profile?.newbie_pack_1_purchased_at ? newbiePack2Icon : newbiePackIcon} alt="" className="relative z-[1] h-[clamp(52px,15vw,72px)] w-full object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.7)]" />
          <span className="relative z-[1]"><NewbiePackCountdown expiresAt={newbiePackExpiresAt} /></span>
        </button>
      ) : null}

      {!sceneMode&&!readonlyProfile&&nextResourcePack(profile)>=0&&<div className={'resource-pack-launchers '+(playerLevel>=10&&!profile?.newbie_pack_2_purchased_at&&!newbiePackOfferExpired?'with-newbie':'')}>{[nextResourcePack(profile)].map(i=><button type="button" key={i} onClick={()=>setResourcePack(i)} aria-label={RESOURCE_PACKS[i].title}><img src={RESOURCE_PACKS[i].art} alt=""/><span>{RESOURCE_PACKS[i].title}</span></button>)}</div>}
      {resourcePack!==null&&<Suspense fallback={null}><ResourcePackModal initialPack={resourcePack} language={profile?.language||'uk'} onClose={()=>setResourcePack(null)} onRefreshProfile={onRefreshProfile} onOpenPet={petId=>{setResourcePack(null);openEquipmentMode();setSelectedSlot('pet');setSelectedItemId(petId);}}/></Suspense>}
      {openingReferralBox ? (
        <LootBoxModal
          boxType={openingReferralBox.boxType}
          lang={profile?.language || 'en'}
          onClose={closeReferralBox}
          onOpenBox={handleOpenReferralBox}
        />
      ) : null}

      {newbiePackMode ? <Suspense fallback={null}><NewbiePackModal profile={profile} onClose={() => setNewbiePackMode(false)} onRefreshProfile={onRefreshProfile} /></Suspense> : null}
      {dislikeRewardFlight ? <div className="profile-dislike-energy-fly pointer-events-none absolute z-40 font-mono text-[15px] font-black text-[#fff39b]">+25 ⚡</div> : null}
      {likeBoxOpen && likeBoxReward ? <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px]">
        <MarkerFrame className="w-full max-w-[410px]" innerClassName="reaction-modal-background reaction-modal-background--likes p-3" variant="dark">
          <div className="flex items-center justify-between border-b border-[#28ee90]/70 pb-2"><h2 className="font-mono text-[16px] font-black text-[#fff2bd]">{profile?.language === 'ru' ? 'Бокс лайков' : profile?.language === 'en' ? 'Like Box' : 'Бокс вподобайок'}</h2><button type="button" onClick={() => { setLikeBoxOpen(false); setLikeBoxReward(null); }} className="font-mono text-[25px] leading-none text-[#d8f67a]">×</button></div>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {['energy', 'tentacles', 'poison', 'spin'].filter(type => Number(likeBoxReward[type]) > 0).map(type => {
              const labels = {
                energy: {ru:'ЭНЕРГИЯ',en:'ENERGY',ua:'ЕНЕРГІЯ'},
                tentacles: {ru:'ЩУПАЛЬЦА',en:'TENTACLES',ua:'ЩУПАЛЬЦЯ'},
                poison: {ru:'МАЛЫЙ ЯД',en:'SMALL POISON',ua:'МАЛА ОТРУТА'},
                spin: {ru:'ПРОКРУТЫ',en:'SPINS',ua:'ПРОКРУТИ'},
              };
              return <div key={type} className="flex w-[82px] flex-col items-center justify-center gap-1 py-1">
                <img src={type === 'energy' ? getEnergyRewardIcon(likeBoxReward[type]) : getResourceIcon(type === 'poison' ? 'small-poison' : type)} alt="" aria-hidden="true" className="h-[54px] w-[54px] object-contain"/>
                <span className="text-center font-mono text-[8px] font-black uppercase leading-tight text-[#9dff43]">{labels[type][currentLanguage] || labels[type].ua}</span>
                <span className="font-sans text-[15px] font-black text-[#fff5d9]">×{likeBoxReward[type]}</span>
              </div>;
            })}
          </div>
          <p className="mt-4 font-mono text-[10px] font-black uppercase text-[#91b969]">{profile?.language === 'ru' ? 'От кого лайки' : profile?.language === 'en' ? 'Likes from' : 'Від кого вподобайки'} · {likeBoxContributors.length}</p>
          <div className="mt-1 max-h-[180px] overflow-y-auto border border-[#28ee90]/50 bg-black/20 p-1">{likeBoxContributors.map((entry, index) => <div key={`${entry.sender_id}-${index}`} className="flex items-center gap-2 border-b border-[#28ee90]/15 px-2 py-1.5"><span className="font-mono text-[10px] font-black text-[#8eb26c]">#{index + 1}</span><AvatarWithFrame src={entry.avatar} frameId={entry.avatar_frame_id} className="h-7 w-7 shrink-0" paddingClassName="p-[2px]" /><span className="min-w-0 flex-1 truncate font-mono text-[11px] font-black text-[#e8f4d5]">{entry.sender_name}</span><span className="font-mono text-[10px] font-black text-[#d8f67a]">{entry.reward?.type === 'energy' ? '+10 ⚡' : entry.reward?.type === 'tentacles' ? '+500 〰' : entry.reward?.type === 'poison' ? '+1 ☠' : '+1 ◉'}</span></div>)}</div>
        </MarkerFrame>
      </div> : null}

      <div className="relative z-10 flex min-h-0 flex-1 items-end justify-center overflow-hidden px-0.5 pb-0 pt-0 sm:px-1">
        <div className="pointer-events-none relative flex h-full min-h-[300px] w-full items-end justify-center sm:min-h-[360px]">
          <div className="relative h-full w-[84%] max-w-[390px] min-h-[340px] -translate-y-[4%] sm:min-h-[400px] sm:-translate-y-[3%]">
            {equippedLayerMap.bpLegendary?.armor && <LegendaryCapeLayer className="absolute inset-0 z-0 h-full w-full scale-[0.84] sm:scale-[0.94]"/>}
            {puddleVisible ? (
              !readonlyProfile ? (
                <CleanablePuddle dragging={cleaningPuddle && spongeDrag} onStop={() => setSpongeDrag(false)} onSpongeMove={moveSponge} onComplete={async () => {
                  setCleaningPuddle(false);
                  setSpongeDrag(false);
                  setLocalPuddle(false);
                  clearStoredProfilePuddle(profile?.id);
                  await onUpdateProfile?.({ playerAction: { type: 'clean-puddle' } });
                }} />
              ) : (
                <img src={profilePuddle} alt="" aria-hidden="true" className={`profile-pee-puddle absolute inset-0 z-[2] h-full w-full scale-[0.84] object-contain sm:scale-[0.94] ${profileReaction === 'dislike' ? 'profile-pee-puddle-arriving' : ''}`} />
              )
            ) : null}
            {likeBoxClaimError&&<p role="alert" className="absolute bottom-0 z-20 bg-black/80 p-2 text-xs text-amber-200">{likeBoxClaimError}</p>}
            {likeBoxVisible || likeBoxCount > 0 ? (
              <>
                <img src={likeRewardBox} alt="Like rewards" className={`profile-like-box pointer-events-none absolute inset-0 z-[4] h-full w-full scale-[0.84] object-contain sm:scale-[0.94] ${likeBoxDrop ? 'profile-like-box-drop' : ''}`} />
                {!readonlyProfile ? <button type="button" aria-label="Open like rewards" onClick={async () => {
                  if(likeBoxClaimLock.current)return;likeBoxClaimLock.current=true;setLikeBoxClaimError('');
                  try{const result = await claimLikeBox();
                  setLikeBoxReward(result?.rewards || null);
                  setLikeBoxContributors(result?.contributions || []);
                  setLikeBoxCount(0);
                  setLikeBoxVisible(false);
                  likeBoxDropPlayedForProfile.current = null;
                  setLikeBoxOpen(true);
                  await onUpdateProfile?.(result?.player || {});
                  }catch(error){if(error?.code==='LIKE_BOX_EMPTY'){setLikeBoxCount(0);setLikeBoxVisible(false);}else setLikeBoxClaimError(({uk:'Не вдалося отримати нагороду. Спробуйте ще раз.',ru:'Не удалось получить награду. Повторите попытку.',en:'Could not claim the reward. Try again.'})[profile?.language==='ua'?'uk':profile?.language]||'Could not claim reward.');}finally{likeBoxClaimLock.current=false;}
                }} className="pointer-events-auto absolute bottom-[7%] left-[60%] right-[9%] z-[10] h-[22%] cursor-pointer" /> : null}
              </>
            ) : null}
            {equippedPet?.id === 'pet-toaster' ? <ToasterPet className="absolute bottom-[5%] right-[8%] z-[4] h-[36%] w-[40%]" /> : equippedPet?.id === 'pet-skunk' ? <JunkSkunkPet className="absolute inset-0 z-[2] h-full w-full scale-[0.84] sm:scale-[0.94]" /> : equippedPet?.id === 'bp_legendary_pet' ? <VoidlingPet className="bottom-[2%] right-[3%] z-[4] h-[38%] w-[38%]" /> : equippedPet?.id === 'pet-purrgulp' ? <PurrgulpPet className="absolute bottom-[5%] right-[4%] z-[4] w-[43%] aspect-square" /> : equippedPet?.id === 'legion_pet' ? <LegionPet className="absolute inset-0 z-[12] h-full w-full scale-[0.84] sm:scale-[0.94]" /> : equippedPet?.id === 'halloween_2026_pet' ? <HalloweenPumpkinPet className="absolute inset-0 z-[12] h-full w-full scale-[0.84] sm:scale-[0.94]" /> : equippedPet?.id === 'hereearlypet' ? <HereEarlyPet className="absolute inset-0 z-[4] h-full w-full scale-[0.84] sm:scale-[0.94]" /> : equippedPet?.id === 'raidboss2_pet' ? <RaidScarecrowPet className="absolute inset-0 z-[4] h-full w-full scale-[0.84] sm:scale-[0.94]" /> : equippedPet?.id === 'pet5' ? <AnimatedPet5 /> : equippedPet?.id === 'pet-bot' ? <AnimatedPet1 /> : equippedPet?.id === 'pet-cthulhu' ? <NewbieSoulPet fullCanvas className="absolute inset-0 z-[1] h-full w-full scale-[0.84] object-contain sm:scale-[0.94]" label={equippedPet.name} /> : equippedPet?.id === 'friday13_doll_pet' ? <Friday13Pet className="friday13-pet-camp" label={equippedPet.name}/> : equippedPet?.renderArt ? (
              <img
                src={equippedPet.renderArt}
                alt={equippedPet.name}
                className="absolute inset-0 z-[2] h-full w-full scale-[0.84] object-contain drop-shadow-[0_20px_28px_rgba(0,0,0,0.28)] sm:scale-[0.94]"
              />
            ) : null}
            <div className="camp-hero-frame absolute left-[8%] top-[8%] z-[3] h-[84%] w-[84%] sm:left-[3%] sm:top-[3%] sm:h-[94%] sm:w-[94%]">
              <LayeredHero
                className={`h-full w-full object-contain ${Object.values(equippedLayerMap.bpLegendary || {}).some(Boolean) || Object.values(equippedLayerMap.bpEpic || {}).some(Boolean) ? 'bp-hero-stable' : 'drop-shadow-[0_28px_40px_rgba(0,0,0,0.32)]'}`}
                baseOverride={equipmentMode ? null : heroAnimationReady ? heroBaseAnimated : heroFirstFrame}
                visibleSlots={visibleHeroSlots}
                layerOverrides={equippedLayerMap}
              />
              {enhancementButterflyStage>0&&<EnhancementBat level={equippedEnhancementLevel}/>}
            </div>
          </div>
        </div>
      </div>

      {equipmentMode ? (
        <div className={`absolute inset-0 ${selectedSlot ? 'z-50 bg-black/60 backdrop-blur-[3px] pointer-events-auto' : 'z-30 pointer-events-none'}`}>
          <div className="pointer-events-auto flex h-full items-end justify-center px-2 pt-4" style={{paddingBottom:'calc(max(var(--bottom-nav-space, 0px), clamp(82px, 22vw, 112px)) + 14px)'}} data-equipment-controls="true">
            {selectedSlot ? (
              <MarkerFrame
                showBorder={false}
                className={`relative ${selectedSlot === 'background' ? 'h-fit max-h-full' : 'h-full max-h-full'} w-full max-w-[408px] equipment-detail-surface backdrop-blur-[8px] shadow-[0_18px_32px_rgba(0,0,0,0.65)]`}
                innerClassName={`flex ${selectedSlot === 'background' ? 'h-fit' : 'h-full'} min-h-0 flex-col gap-2 overflow-hidden px-3.5 pb-3.5 pt-2`}
                variant="transparent"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlot(null);
                    setSelectedItemId(null);
                    setPreviewItemName('');
                  }}
                  className="absolute right-2 top-2 z-10 h-6 w-6 border-0 bg-transparent font-sans text-[22px] font-normal leading-none text-[#42f2b6] transition hover:text-white"
                >X</button>

                {selectedEquipment && selectedSlot !== 'background' ? (
                  <div className="equipment-detail-content flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain touch-pan-y px-1 pb-1 pt-8">
                    <div className="min-w-0 pr-8">
                      <h2 className="font-sans text-[19px] font-black uppercase leading-tight text-[#f1f5eb]">{localizeEquipmentItemName(selectedEquipment, currentLanguage) || selectedEquipment.name}{enhancementPreviewLevel>0?` +${enhancementPreviewLevel}`:''}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {selectedEquipmentRarity ? <span className="font-sans text-[11px] font-black uppercase leading-none text-[#42f2b6]">{selectedEquipmentRarity}</span> : null}
                        <p className="font-mono text-[9px] leading-tight text-[#8ca68e]">{getEquipmentSourceLabel(selectedEquipment, currentLanguage)}</p>
                        {enhancementPreviewLevel > 0 && <p className="w-full font-mono text-[11px] font-bold text-[#d4f08a]">{currentLanguage === 'ru' ? 'Заточка: урон ядов' : currentLanguage === 'en' ? 'Enhancement: poison damage' : 'Заточка: урон отрут'} +{enhancementPreviewLevel}%</p>}
                      </div>
                    </div>
                    <div className="equipment-detail-overview grid shrink-0 grid-cols-[36%_1fr] items-start gap-3">
                      <div className={`relative flex h-[150px] w-full min-w-0 items-center justify-center rounded-[15px] border border-[#263431] equipment-item-backdrop p-2 ${enhancementPreviewLevel>=6?'enhance-glowing':''}`}>
                        <img src={selectedEquipment.icon} alt={localizeEquipmentItemName(selectedEquipment, currentLanguage) || selectedEquipment.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="grid auto-rows-[minmax(34px,auto)] gap-1.5">
                          {selectedBuffSlots.map((buff, index) => {
                            const text = localizedSetBonus(buff.text);
                            const BuffIcon = /finger|пале/i.test(text) ? Hand
                              : /pencil|олів|карандаш/i.test(text) ? Pencil
                                : /boss|бос/i.test(text) ? Skull
                                  : /poison|яд/i.test(text) ? FlaskConical
                                    : /energy|енерг/i.test(text) ? Zap : Sparkles;
                            return (
                              <div key={`${selectedEquipment.id}-buff-${index}`} className={`flex min-h-0 items-center gap-2 rounded-[9px] border px-2 py-1 ${buff.active ? 'border-[#287158] bg-[#101714]/70' : 'border-[#343a38] bg-[#111312]/70'}`}>
                                <BuffIcon aria-hidden="true" className={`h-[15px] w-[15px] shrink-0 ${buff.active ? 'text-[#42f2d0]' : 'text-[#858b88]'}`} strokeWidth={2.5} />
                                {buff.pieces ? <span className={`shrink-0 font-sans text-[10px] font-black tabular-nums ${buff.active ? 'text-[#5af0bc]' : 'text-[#a0a5a2]'}`}>{buff.pieces === 1 ? `${buff.count}/1` : `${buff.count}/${buff.pieces}`}</span> : null}
                                <span className={`min-w-0 font-sans text-[10px] font-bold leading-tight ${buff.active ? 'text-[#d2f4e5]' : 'text-[#a0a5a2]'}`}>{text}</span>
                              </div>
                            );
                          })}
                          <PvpEquipmentStats profile={profile} item={selectedEquipment} language={currentLanguage} />
                        </div>
                        {selectedStandaloneBonus && <p className={`mt-2 text-[10px] font-bold ${selectedEquipmentActuallyEquipped ? 'text-[#5af0bc]' : 'text-[#a0a5a2]'}`}>{selectedBonusStatus}</p>}
                      </div>
                    </div>

                    <details className="group shrink-0 rounded-lg border border-[#2f3d33] bg-[#0d1510]/80">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-sans text-[10px] font-black uppercase text-[#9fb2a3] marker:content-none">
                        <span>{currentLanguage === 'en' ? 'How bonuses work' : currentLanguage === 'ru' ? 'Как работают бонусы' : 'Як працюють бонуси'}</span>
                        <span className="text-[#42f2b6] transition-transform group-open:rotate-180">⌄</span>
                      </summary>
                      <p className="border-t border-[#2b382e] px-3 py-2 font-sans text-[11px] leading-relaxed text-[#a6baae]">{currentLanguage === 'en'
                        ? '1/1 is the item bonus. 2/4/6 pieces unlock set bonuses. Active bonuses add up. All attacks means finger, pencil and poisons.'
                        : currentLanguage === 'ru'
                          ? '1/1 — бонус предмета. 2/4/6 вещей открывают бонусы комплекта. Активные бонусы суммируются. Все атаки — палец, карандаш и яды.'
                          : '1/1 — бонус предмета. 2/4/6 речей відкривають бонуси комплекту. Активні бонуси додаються. Усі атаки — палець, олівець та отрути.'}</p>
                    </details>
                    <EquipmentSourceInfo item={selectedEquipment} language={currentLanguage} />
                    {selectedEquipment.locked && selectedEquipment.sourceType === 'holder' && <NftPetClaimButton key={selectedEquipment.id} item={selectedEquipment} language={currentLanguage} onClaimed={onRefreshProfile} />}
                    <div className="mt-auto flex w-full gap-2">
                      <GameTextureButton type="button" tone="gray" onClick={() => { setSelectedItemId(null); setPreviewItemName(''); }} className="h-11 flex-1">
                        <span className="relative z-10 font-mono text-[12px] font-black uppercase tracking-[0.08em] text-[#f0f6eb]">{currentLanguage === 'en' ? 'BACK' : currentLanguage === 'ru' ? 'НАЗАД' : 'НАЗАД'}</span>
                      </GameTextureButton>
                      <GameTextureButton type="button" tone="green" disabled={Boolean(selectedEquipment.locked)} onClick={isSelectedItemEquipped ? handleUnequipSelected : handleEquipSelected} className="h-11 flex-[1.5] disabled:opacity-50">
                        <span className="relative z-10 font-mono text-[12px] font-black uppercase tracking-[0.08em] text-[#172016]">{isSelectedItemEquipped ? ui.unequip : ui.equip}</span>
                      </GameTextureButton>
                    </div>
                  </div>
                ) : <>
                {selectedSlot !== 'background' ? <div aria-hidden="true" className="h-6 shrink-0" /> : null}
                <div className={`${selectedSlot === 'background' ? 'h-fit flex-none' : 'min-h-0 flex-1'} overscroll-contain pr-0.5 ${selectedSlot === 'background' ? 'flex touch-pan-x items-start gap-1.5 overflow-x-auto overflow-y-hidden' : 'grid touch-pan-y grid-cols-2 content-start gap-2 overflow-y-auto overflow-x-hidden'}`} style={selectedSlot === 'background' ? { WebkitOverflowScrolling: 'touch' } : undefined}>
                  {selectedSlot === 'background' ? (
                    BACKGROUNDS.map((background) => {
                      const unlocked = unlockedBackgrounds.includes(background.id);
                      const sourceBoss = GAME_CONFIG.BOSSES.find((boss) => boss.id === background.bossId);
                      return (
                        <BackgroundChoiceCard
                          key={background.id}
                          background={background}
                          selected={draftBackgroundId === background.id}
                          unlocked={unlocked}
                          sourceHint={sourceBoss ? getBossBackgroundDropDescription(sourceBoss, profile?.language, unlocked) : translateUiText(background.unlockLabel)}
                          onClick={() => unlocked && setDraftBackgroundId(background.id)}
                        />
                      );
                    })
                  ) : itemsForSlot.length ? (
                    itemsForSlot.map((item) => (
                      <EquipmentCatalogCard
                        key={item.id}
                        item={item}
                        itemName={localizeEquipmentItemName(item, currentLanguage)}
                        locked={Boolean(item.locked)}
                        equipped={selectedSlot ? equippedItems[selectedSlot] === item.id : false}
                        selected={previewItemName === (localizeEquipmentItemName(item, currentLanguage) || item.name)}
                        onClick={() => handleChooseItem(item)}
                        language={currentLanguage}
                      />
                    ))
                  ) : (
                    <div className="flex min-w-full items-center justify-center rounded-[12px] border border-dashed border-[#28ee90] px-4 py-8 text-center">
                      <p className="font-mono text-[10px] text-[#91aa76]">
                        {t('camp_view.future_locked_hint')}
                      </p>
                    </div>
                  )}
                </div>

                {selectedSlot === 'background' ? (
                  <div className="flex w-full">
                    <button
                      type="button"
                      disabled={!canConfirmBackground}
                      onClick={() => setSelectedSlot(null)}
                      className={`relative h-[34px] w-full overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition ${canConfirmBackground ? 'hover:brightness-110 active:translate-y-px' : 'opacity-60 grayscale-[0.25]'}`}
                    >
                      <CampButtonTexture />
                      <span className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#17350d]">{ui.equip}</span>
                    </button>
                  </div>
                ) : null}
                </>}
              </MarkerFrame>
            ) : (
              <div className="flex w-[58%] max-w-[280px] flex-col gap-1">
                {equipmentError ? <p role="alert" className="text-center font-mono text-[10px] text-[#ff8978]">{equipmentError}</p> : null}
                <button
                  type="button"
                  onClick={() => setCombatStatsOpen(true)}
                  className="relative mx-auto h-7 w-fit max-w-full self-center overflow-hidden rounded-[9px_7px_10px_6px] border border-[#090b04] bg-[#141b06] px-1.5 py-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition hover:brightness-110 active:translate-y-px"
                >
                  <CampButtonTexture tone="daily" />
                  <span className="relative z-10 flex h-full items-center justify-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#382308]">
                    {statsLanguage === 'en' ? 'ATTACK STATS' : 'ХАРАКТЕРИСТИКИ АТАК'}
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none"><path d="m3 10 5-5 5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </button>
                <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={confirmEquipmentMode}
                  disabled={equipmentSaving}
                  className="relative h-[36px] flex-1 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition hover:brightness-110 active:translate-y-px"
                >
                  <CampButtonTexture />
                  <span className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#17350d]">
                    {equipmentSaving ? '…' : ui.save}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={closeEquipmentMode}
                  className="relative h-[36px] flex-1 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#090b04] bg-[#141b06] p-px shadow-[0_2px_3px_rgba(0,0,0,0.62)] transition hover:brightness-110 active:translate-y-px"
                >
                  <CampButtonTexture />
                  <span className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#17350d]">
                    {t('camp_view.cancel')}
                  </span>
                </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {equipmentMode && combatStatsOpen && !selectedSlot ? (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px]" onClick={() => setCombatStatsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={statsLanguage === 'en' ? 'Attack stats' : statsLanguage === 'ru' ? 'Характеристики атак' : 'Характеристики атак'} className="w-full max-w-[408px]" onClick={(event) => event.stopPropagation()}>
            <EquipmentCombatStats stats={equipmentCombatStats} language={statsLanguage} onClose={() => setCombatStatsOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { applyAnubisLayerOverrides } from '@/lib/anubisEquipment';
