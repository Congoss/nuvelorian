import CombatLoader from '@/components/game/CombatLoader';
import RaidRewardReceipt from '@/components/game/RaidRewardReceipt';
import {clanOverviewQueries} from '@/lib/clanOverviewQueries';
import {queryClientInstance} from '@/lib/query-client';
import {gameApi} from '@/services/gameApi';
import {warmSceneImage} from '@/lib/sceneAssets';
import CardGameDailyTrigger from '@/components/game/CardGameDailyTrigger';
import TutorialJourneyGoal from '@/components/game/TutorialJourneyGoal';
import JudgeTour from '@/components/game/JudgeTour';
import RetentionTelemetry from '@/components/game/RetentionTelemetry';
import { claimAchievement } from '@/services/achievementClaim';
import { ViewerLanguageContext, AchievementClaimContext } from '@/lib/useAchievementLanguage';
import AchievementNotifications from '@/components/game/AchievementNotifications';
import {chatIndicators as getChatIndicators,CHAT_READ_EVENT} from '@/lib/chatReadState';
import DesktopSpaceBackdrop from '@/components/game/DesktopSpaceBackdrop';
import LoadingOverlay from '@/components/game/LoadingOverlay';
import { MotionConfig } from 'framer-motion';
import { useGlobalAnimations } from '@/lib/animationPreference';
import { resolveTutorialStep, getQuestTutorialRecoveryStep, isNewbieTutorialActive } from '@/lib/tutorialProgress.js';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/game/TopBar';
import PublicPlayerProfile from '@/components/game/PublicPlayerProfile';
import BottomNav from '@/components/game/BottomNav';
import CampView from '@/components/game/CampView';
import AvatarWithFrame from '@/components/game/AvatarWithFrame';
import MarkerFrame from '@/components/game/MarkerFrame';
import GameTextureButton from '@/components/game/GameTextureButton';
import { useGameState } from '@/components/game/useGameState';
import { useClanQuestNotifications } from '@/components/game/useClanQuestNotifications';
import { useStartupLoadingManager } from '@/components/game/useStartupLoadingManager';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from '@/lib/gameConfig';
import { findPlayerProfiles, listChatMessages } from '@/services/gameApi';
import inboxIcon from '@/assets/ui/inbox.svg';









import heroNavIcon from '@/assets/optimized/nav-hero.webp';
import tentaclesIcon from '@/assets/optimized/cosmohand.webp';
import starIcon from '@/assets/optimized/paper.webp';
import levelIcon from '@/assets/optimized/level.webp';
import bossesNavIcon from '@/assets/optimized/all/nav/boss-nav.webp';
import questsNavIcon from '@/assets/optimized/all/nav/quests-nav.webp';
import inventoryNavIcon from '@/assets/optimized/all/nav/talents-nav.webp';
import clansNavIcon from '@/assets/optimized/all/nav/clans-nav.webp';
import { getCampBackgroundById } from '@/components/game/backgrounds';
import heroBase from '@/assets/hero/set1-body.png';
import puddleSponge from '@/assets/ui/puddle-sponge.png';
import energyIcon from '@/assets/optimized/all/ui/energy.webp';
import guideBase from '@/assets/guide/enot-guide-base.png';
import guideCelebrate from '@/assets/guide/enot-guide-celebrate.png';
import guideExplain from '@/assets/guide/enot-guide-explain.png';
import guideGreeting from '@/assets/guide/enot-guide-greeting.png';
import guidePointDown from '@/assets/guide/enot-guide-point-down.png';
import guidePointRight from '@/assets/guide/enot-guide-point-right.png';
import guideSlyReward from '@/assets/guide/enot-guide-sly-reward.png';
import guideFightStance from '@/assets/guide/enot-guide-fight-stance.png';
import guidePoison from '@/assets/guide/enot-guide-poison.png';
import guidePunch from '@/assets/guide/enot-guide-punch.png';
import guideShout from '@/assets/guide/enot-guide-shout.png';
import guideSkeptical from '@/assets/guide/enot-guide-skeptical.png';
import flagUa from '@/assets/flags/ua.svg';
import flagRu from '@/assets/flags/ru.svg';
import flagEn from '@/assets/flags/en.svg';
import smallPoisonIcon from '@/assets/optimized/all/skills/small-poison.webp';
import mediumPoisonIcon from '@/assets/optimized/all/skills/medium-poison.webp';
import largePoisonIcon from '@/assets/optimized/all/skills/large-poison.webp';
import { getResourceIcon } from '@/lib/resourceIcons';
import { CA_RANKS, getCARankProgress, getCARankIcon, getPlayerCA } from '@/lib/caRanks';
import { getPendingCARankRewards, getCARankReward } from '@/lib/caRankRewards';

// Keep the camp interactive while the heavyweight game screens load in the background.
// A dynamic import is cached by the browser, so the later React.lazy render is instant.
const loadBossPanel = () => import('@/components/game/BossPanel');
const loadSkillsPanel = () => import('@/components/game/SkillsPanel');
const loadShopPanel = () => import('@/components/game/WalletShopPanel');
const loadTasksPanel = () => import('@/components/game/TasksPanel');
const loadDailyPanel = () => import('@/components/game/DailyPanel');
const loadLeaderboardPanel = () => import('@/components/game/LeaderboardPanel');
const loadEquipmentPanel = () => import('@/components/game/EquipmentPanel');
const loadClanPanel = () => import('@/components/game/ClanPanel');
const loadMarketPanel = () => import('@/components/game/MarketPanel');
const MarketPanel = lazy(loadMarketPanel);
const loadRaidPanel = () => import('@/components/game/RaidPanel');
const loadChatPanel = () => import('@/components/game/ChatPanel');
const loadBackgroundPanel = () => import('@/components/game/BackgroundPanel');
const loadProfilePanel = () => import('@/components/game/WalletProfilePanel');
const loadRoulettePanel = () => import('@/components/game/RoulettePanel');
const loadMailPanel = () => import('@/components/game/MailPanel');
const loadPvpPanel = () => import('@/components/game/PvpPanel');
const ShipUpdateWelcome = lazy(() => import('@/components/game/ShipUpdateWelcome'));
const HalloweenWelcome = lazy(() => import('@/components/game/HalloweenWelcome'));

const BossPanel = lazy(loadBossPanel);
const TasksPanel = lazy(loadTasksPanel);
const SkillsPanel = lazy(loadSkillsPanel);
const ShopPanel = lazy(loadShopPanel);
const DailyPanel = lazy(loadDailyPanel);
const LeaderboardPanel = lazy(loadLeaderboardPanel);
const EquipmentPanel = lazy(loadEquipmentPanel);
const ClanPanel = lazy(loadClanPanel);
const RaidPanel = lazy(loadRaidPanel);
const ChatPanel = lazy(loadChatPanel);
const BackgroundPanel = lazy(loadBackgroundPanel);
const ProfilePanel = lazy(loadProfilePanel);
const RoulettePanel = lazy(loadRoulettePanel);
const MailPanel = lazy(loadMailPanel);
const PvpPanel = lazy(loadPvpPanel);

const TAB_LOADERS = {
  boss: loadBossPanel, tasks: loadTasksPanel, skills: loadSkillsPanel, clan: loadClanPanel, market: loadMarketPanel,
  shop: loadShopPanel, raid: loadRaidPanel, raidBoss: loadBossPanel, events: loadDailyPanel,
  fishing: loadDailyPanel,
};
const MODAL_LOADERS = {
  daily: loadDailyPanel, events: loadDailyPanel, leaderboard: loadLeaderboardPanel,
  equipment: loadEquipmentPanel, clan: loadClanPanel, chat: loadChatPanel,
  roulette: loadRoulettePanel, mail: loadMailPanel, backgrounds: loadBackgroundPanel,
  profile: loadProfilePanel, pvp: loadPvpPanel,
};
function warmTab(tab) {
  return TAB_LOADERS[tab]?.().then(panel => panel.warmFirstFrame?.()).catch(() => {});
}

function LocalTesterTutorial(props) {
  const { profile } = props;
  if (!isNewbieTutorialActive(profile)) return null;
  return <ActiveTutorial {...props} />;
}


function resumeTutorialStep(step) {
  return resolveTutorialStep(step) || 'welcome';
}

function ActiveTutorial({ profile, activeTab, activeModal, onUpdateProfile, onNavigateTab, onOpenModal }) {
  const isTester = true;
  const storageKey = `local-tutorial:v55:${profile?.id || profile?.telegram_id || 'tester'}`;
  const freshTesterProfile = Number(profile?.level || 1) <= 1
    && Number(profile?.xp || 0) === 0
    && Number(profile?.boss_kills || 0) === 0
    && Number(profile?.energy_spent_total || 0) === 0;
  const [step, setStep] = useState(() => {
    const profileStep = resolveTutorialStep(profile?.tutorial_step, profile);
    if (profileStep) return profileStep;
    if (typeof window === 'undefined') return 'welcome';
    try {
      const storedStep = resolveTutorialStep(window.localStorage.getItem(storageKey), profile);
      const welcomeSeen = window.localStorage.getItem(`${storageKey}:welcome-seen`) === '1';
      if (freshTesterProfile && !welcomeSeen) return 'welcome';
      if (!storedStep) return welcomeSeen ? 'quests' : 'welcome';
      if (storedStep === 'welcome' && welcomeSeen) return 'quests';
      return resumeTutorialStep(storedStep);
    } catch { return freshTesterProfile ? 'welcome' : 'quests'; }
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => profile?.language || 'uk');
  useEffect(() => {
    if (profile?.language) setSelectedLanguage(profile.language === 'ua' ? 'uk' : profile.language);
  }, [profile?.id, profile?.language]);
  useEffect(() => {
    if (freshTesterProfile && !profile?.tutorial_step) {
      try {
        if (window.localStorage.getItem(`${storageKey}:welcome-seen`) === '1') return;
      } catch {}
      welcomeBonusPendingRef.current = false;
      setStep('welcome');
      setDismissedStep(null);
    }
  }, [freshTesterProfile, storageKey]);
  const previousTutorialStep = useRef(step);
  const welcomeBonusPendingRef = useRef(false);
  const [welcomeBonusError, setWelcomeBonusError] = useState(false);
  useEffect(() => {
    if (profile?.welcome_energy_granted || welcomeBonusPendingRef.current) return;
    let welcomeSeen = false;
    try { welcomeSeen = window.localStorage.getItem(`${storageKey}:welcome-seen`) === '1'; } catch {}
    if (!welcomeSeen) return;
    welcomeBonusPendingRef.current = true;
    void onUpdateProfile?.({ claimWelcomeEnergy: true })
      .catch(() => { welcomeBonusPendingRef.current = false; setWelcomeBonusError(true); });
  }, [profile?.welcome_energy_granted, storageKey, onUpdateProfile]);
  const [goCount, setGoCount] = useState(0);
  const autoQuestRunning = useRef(false);
  const [autoQuestIndex, setAutoQuestIndex] = useState(null);
  const [sectorIndex, setSectorIndex] = useState(0);
  const [sectorStartLoop, setSectorStartLoop] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [goRect, setGoRect] = useState(null);
  const [dismissedStep, setDismissedStep] = useState(null);
  const hintRef = useRef(null);
  const [hintHeight, setHintHeight] = useState(0);
  const rouletteUnlocked = Number(profile?.level || 1) >= (GAME_CONFIG.CONTENT_UNLOCK_LEVELS?.roulette || 1);
  const language = profile?.language === 'ua' ? 'uk' : profile?.language || selectedLanguage || 'uk';
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleDailyClaimComplete = () => {
    };
    const handleRewardClosed = () => {
      if (step === 'daily-claim') setStep('daily-tab');
    };
    window.addEventListener('tutorial-daily-claim-complete', handleDailyClaimComplete);
    window.addEventListener('tutorial-reward-closed', handleRewardClosed);
    return () => {
      window.removeEventListener('tutorial-daily-claim-complete', handleDailyClaimComplete);
      window.removeEventListener('tutorial-reward-closed', handleRewardClosed);
    };
  }, [step]);
  useEffect(() => {
    if (!hintRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => setHintHeight(hintRef.current?.getBoundingClientRect().height || 0);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(hintRef.current);
    return () => observer.disconnect();
  }, [step, language]);
  const welcomeText = {
    uk: { label: 'ПЕРШИЙ ВХІД', title: 'ПРИВІТ, КОСМІЧНА ШМАРКЛЯ!', text: 'Вітаємо в косморядах! Тут ми лупимо босів, стаємо сильнішими й удаємо, що весь цей космічний цирк перебуває під контролем. Не стій стовпом. Натискай кнопку — галактика сама себе не зіпсує.', energy: 'ЕНЕРГІЇ', go: 'ПОЇХАЛИ!' },
    ru: { label: 'ПЕРВЫЙ ВХОД', title: 'ПРИВЕТ, КОСМИЧЕСКАЯ СОПЛЯ!', text: 'Добро пожаловать в космоотряд! Здесь мы избиваем боссов, становимся сильнее и делаем вид, что весь этот космический цирк находится под контролем. Не стой столбом. Нажимай кнопку — галактика сама себя не испортит.', energy: 'ЭНЕРГИИ', go: 'ПОЕХАЛИ!' },
    en: { label: 'FIRST LOGIN', title: 'HELLO, YOU COSMIC BOOGER!', text: 'Welcome to the space squad! We beat up bosses, grow stronger, and pretend this entire intergalactic circus is under control. Don’t just stand there. Press the button—the galaxy won’t ruin itself.', energy: 'ENERGY', go: 'LET’S GO!' },
  }[language] || null;
  const guideImage = {
    welcome: guideGreeting,
    quests: guidePointDown,
    'quest-sector': guideExplain,
    'task-location': guideExplain,
    artifacts: guideExplain,
    'claim-reward': guidePointDown,
    home: guidePointDown,
    daily: guideSlyReward,
    'daily-claim': guidePointDown,
    'daily-tab': guideExplain,
    roulette: guideSlyReward,
    'roulette-spin': guidePointRight,
    done: guideFightStance,
    bosses: guidePointRight,
    'boss-select': guidePointRight,
    'boss-finger': guidePunch,
    'boss-pencil': guideExplain,
    'boss-poison': guidePoison,
    'boss-finish': guideShout,
    'boss-wait': guideCelebrate,
    'boss-rewards': guidePointDown,
    friends: guideGreeting,
    'newbie-claim': guideBase,
    journey: guideExplain,
    'skills-nav': guidePointDown,
    'skills-intro': guideExplain,
    'level-eight': guideCelebrate,
    'level-fifteen': guideSkeptical,
  }[step];
  const guidePosition = ['quests', 'task-location', 'quest-sector', 'artifacts', 'daily-tab', 'done', 'bosses', 'boss-finger', 'boss-pencil', 'boss-finish', 'skills-intro', 'newbie-claim'].includes(step)
    ? 'absolute left-1 top-1/2 -translate-y-1/2'
    : ['claim-reward', 'home', 'daily', 'daily-claim', 'roulette', 'roulette-spin', 'boss-select', 'boss-poison', 'friends', 'skills-nav'].includes(step)
      ? 'absolute right-1 top-1/2 -translate-y-1/2'
      : 'relative mx-auto mb-1 block';
  useEffect(() => {
    if (!isTester) return;
    try { window.localStorage.setItem(storageKey, step); } catch {}
  }, [isTester, step, storageKey]);
  const tutorialSaveAttempt = useRef(null);
  useEffect(() => {
    if (!profile?.id || profile.tutorial_step === step || tutorialSaveAttempt.current === step) return;
    const timeout = window.setTimeout(() => {
      tutorialSaveAttempt.current = step;
      onUpdateProfile?.({ playerAction: { type: 'tutorial-progress', step } }).catch(() => {});
    }, 750);
    return () => window.clearTimeout(timeout);
  }, [profile?.id, profile?.tutorial_step, step, onUpdateProfile]);

  useEffect(() => {
    if (step === 'quests' && activeTab === 'tasks') setStep('task-location');
  }, [activeTab, profile?.energy, step]);

  useEffect(() => {
    if (step !== 'task-location' || activeTab !== 'tasks' || typeof window === 'undefined') return undefined;
    const syncSelectedLocation = () => {
      const rows = document.querySelectorAll('[data-tutorial-block]');
      const recoveryStep = getQuestTutorialRecoveryStep({
        questRowCount: rows.length,
        hasLocationPicker: Boolean(document.querySelector('[data-tutorial-target="first-quest-location"]')),
      });
      if (recoveryStep === 'quest-sector') setStep(recoveryStep);
    };
    syncSelectedLocation();
    const intervalId = window.setInterval(() => { if (!document.hidden) syncSelectedLocation(); }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeTab, step]);


  useEffect(() => {
    if (!['task-location','quest-sector','artifacts','claim-reward'].includes(step)) return;
    if (Number(profile?.collection_rewards_claimed?.['p4-u00'] || 0) > 0) setStep('home');
  }, [profile?.collection_rewards_claimed, step]);

  useEffect(() => {
    if (step !== 'claim-reward' || activeTab !== 'tasks' || typeof document === 'undefined') return undefined;
    const syncClaimTarget = () => {
      const rewardTarget = document.querySelector('[data-tutorial-target="quest-claim-reward"]');
      const artifactTarget = document.querySelector('[data-tutorial-target="quest-artifacts"]');
      const locationTarget = document.querySelector('[data-tutorial-target="first-quest-location"]');
      if (!rewardTarget && !artifactTarget && locationTarget) setStep('task-location');
    };
    syncClaimTarget();
    const intervalId = window.setInterval(() => { if (!document.hidden) syncClaimTarget(); }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeTab, step]);

  useEffect(() => {
    if (step === 'newbie-list' && activeModal === null) setStep(rouletteUnlocked ? 'roulette' : 'roulette-wait');
    if (step === 'newbie-close' && activeModal === null) setStep(rouletteUnlocked ? 'roulette' : 'roulette-wait');
    if (step === 'roulette-wait' && rouletteUnlocked) setStep('roulette');
    if (step === 'boss-finger' && Number(profile?.boss_hits_today || 0) > 0) setStep('boss-pencil');
    if (step === 'boss-pencil' && profile?.weapon_cooldowns?.knuckle) setStep('boss-poison');
    if (step === 'boss-poison' && Number(profile?.boss_kills || 0) > 0) {
      setStep('friends-wait-home');
      onNavigateTab?.('camp');
    }
    if (step === 'done' && activeTab === 'camp' && Number(profile?.level || 1) >= 5) setStep('bosses');
    if (step === 'journey' && Number(profile?.level || 1) >= 8) setStep('skills-nav');
    if (step === 'completed' && Number(profile?.level || 1) >= 8 && Number(profile?.total_talent_points_spent || 0) === 0) setStep('skills-nav');
    if (step === 'completed' && Number(profile?.level || 1) >= 15) setStep('level-fifteen');
  }, [activeModal, activeTab, onNavigateTab, profile?.boss_hits_today, profile?.boss_kills, profile?.level, profile?.weapon_cooldowns?.knuckle, rouletteUnlocked, step]);

  const tutorialPoisonInFlight = useRef(false);
  useEffect(() => {
    if (step !== 'boss-poison' || profile?.tutorial_poison_grant_version || tutorialPoisonInFlight.current) return;
    tutorialPoisonInFlight.current = true;
    Promise.resolve(onUpdateProfile?.({ playerAction: { type: 'tutorial-progress', step: 'boss-poison' } }))
      .catch(() => {})
      .finally(() => { tutorialPoisonInFlight.current = false; });
  }, [onUpdateProfile, profile?.tutorial_poison_grant_version, step]);

  useEffect(() => {
    if (step !== 'boss-select' || activeTab !== 'boss' || typeof document === 'undefined') return undefined;
    const syncBossFight = () => {
      if (document.querySelector('[data-tutorial-target="tutorial-boss-finger"]')) setStep('boss-finger');
    };
    syncBossFight();
    const intervalId = window.setInterval(() => { if (!document.hidden) syncBossFight(); }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeTab, step]);

  useEffect(() => {
    if (!['boss-poison', 'boss-finish', 'boss-wait', 'boss-rewards'].includes(step) || typeof window === 'undefined') return undefined;
    const handleRewardsComplete = () => {
      setStep('friends-wait-home');
      onNavigateTab?.('camp');
    };
    window.addEventListener('boss-tutorial-rewards-complete', handleRewardsComplete);
    return () => window.removeEventListener('boss-tutorial-rewards-complete', handleRewardsComplete);
  }, [onNavigateTab, step]);

  useEffect(() => {
    if (step === 'friends-wait-home' && activeTab === 'camp') setStep('friends');
  }, [activeTab, step]);

  useEffect(() => {
    if (step !== 'quest-sector' || typeof window === 'undefined') return undefined;
    const syncQuestProgress = () => {
      const rows = Array.from(document.querySelectorAll('[data-tutorial-block]'))
        .filter((row) => row.getAttribute('data-tutorial-block') !== null)
        .sort((left, right) => Number(left.getAttribute('data-tutorial-block')) - Number(right.getAttribute('data-tutorial-block')));
      const recoveryStep = getQuestTutorialRecoveryStep({
        questRowCount: rows.length,
        hasLocationPicker: Boolean(document.querySelector('[data-tutorial-target="first-quest-location"]')),
      });
      if (recoveryStep && recoveryStep !== step) {
        setSectorIndex(0);
        setSectorStartLoop(null);
        setGoCount(0);
        setStep(recoveryStep);
        return;
      }
      if (Number(profile?.collection_rewards_claimed?.['p4-u00'] || 0) > 0) { setStep('home'); return; }
      if (rows.length && Number(rows[0].getAttribute('data-tutorial-loop') || 0) >= 1) {
        if(autoQuestRunning.current)return;
        autoQuestRunning.current=true;
        Promise.resolve(onUpdateProfile?.({playerAction:{type:'tutorial-auto-quests'}})).then(()=>{
          setAutoQuestIndex(0);
          const autoRows = rows.slice(1,7);
          const segmentsFor = row => Array.from(row.querySelectorAll('[data-tutorial-quest-sector]'));
          autoRows.forEach(row => segmentsFor(row).forEach(segment => { segment.style.opacity='.25';segment.style.filter='grayscale(1)'; }));
          let delay = 900;
          autoRows.forEach((row,index) => {
            const segments = segmentsFor(row);
            setTimeout(() => {
              rows.forEach(item=>item.classList.remove('tutorial-quest-auto-complete'));
              setAutoQuestIndex(index+1);
              row.classList.add('tutorial-quest-auto-complete');
              row.scrollIntoView({behavior:'smooth',block:'center'});
            }, delay);
            segments.forEach((segment,segmentIndex) => setTimeout(() => {
              segment.style.transition='opacity 160ms ease, filter 160ms ease';
              segment.style.opacity='1';segment.style.filter='none';
            }, delay + 300 + segmentIndex * 170));
            delay += 300 + segments.length * 170 + 400;
          });
          setTimeout(() => {
            rows.forEach(row=>row.classList.remove('tutorial-quest-auto-complete'));
            autoRows.forEach(row => segmentsFor(row).forEach(segment => {segment.style.removeProperty('opacity');segment.style.removeProperty('filter');segment.style.removeProperty('transition');}));
            setAutoQuestIndex(null);setStep('artifacts');autoQuestRunning.current=false;
          }, delay+400);
        }).catch(()=>{autoQuestRunning.current=false;});
        return;
      }
      if (sectorIndex !== 0) {setSectorIndex(0);setSectorStartLoop(null);setGoCount(0);return;}
      const row = document.querySelector(`[data-tutorial-block="${sectorIndex}"]`);
      const progress = Number(row?.getAttribute('data-tutorial-progress') || 0);
      const total = Math.max(1, Number(row?.getAttribute('data-tutorial-total') || 1));
      const loopCount = Number(row?.getAttribute('data-tutorial-loop') || 0);
      if (sectorStartLoop === null) {
        setSectorStartLoop(loopCount);
        return;
      }
      setGoCount(Math.min(progress, total));
      if (progress >= total || loopCount > sectorStartLoop) {
        if (sectorIndex >= 0) { setSectorStartLoop(null); }
        else {
          setSectorIndex((index) => index + 1);
          setSectorStartLoop(null);
          setGoCount(0);
        }
      }
    };
    syncQuestProgress();
    const intervalId = window.setInterval(() => { if (!document.hidden) syncQuestProgress(); }, 1000);
    return () => window.clearInterval(intervalId);
  }, [sectorIndex, sectorStartLoop, step, profile?.collection_rewards_claimed]);

  const rewardPopupOpen = typeof document !== 'undefined' && Boolean(document.querySelector('[data-tutorial-reward-popup="true"], [data-tutorial-loot-box="true"]'));
  const targetName = rewardPopupOpen
    ? 'tutorial-claim-reward'
    : step === 'quests'
    ? 'quests-nav'
    : step === 'task-location'
      ? 'first-quest-location'
      : step === 'quest-sector'
        ? `quest-block-${sectorIndex}`
        : step === 'claim-reward'
          ? 'quest-claim-reward'
          : step === 'artifacts'
          ? 'quest-artifacts'
          : step === 'home'
            ? 'home-nav'
          : step === 'daily'
              ? 'daily-nav'
              : step === 'daily-claim'
                ? 'daily-first-claim'
        : step === 'daily-tab'
          ? 'newbie-tab'
          : step === 'newbie-list'
            ? 'newbie-close'
          : step === 'roulette'
            ? 'roulette-nav'
            : step === 'roulette-spin'
              ? 'roulette-spin'
              : step === 'bosses'
                ? 'bosses-nav'
                : step === 'boss-select'
                  ? 'tutorial-first-boss'
                  : step === 'boss-finger'
                    ? 'tutorial-boss-finger'
                    : step === 'boss-pencil'
                      ? 'tutorial-boss-pencil'
                      : step === 'boss-poison'
                        ? 'tutorial-boss-poison'
                        : step === 'boss-wait'
                          ? 'tutorial-boss-victory'
                          : step === 'boss-rewards'
                            ? 'tutorial-boss-victory'
                          : step === 'friends'
                            ? 'tutorial-friends'
                            : step === 'journey'
                              ? 'tutorial-friends-panel'
                            : step === 'skills-nav'
                              ? 'skills-nav'
                              : step === 'skills-intro'
                                ? 'tutorial-first-talent'
                                : step === 'newbie-claim'
                                  ? 'newbie-first-claim'
                                  : step === 'newbie-close'
                                    ? 'newbie-close'
          : null;
  const needsTasks = ['task-location', 'quest-sector', 'artifacts', 'claim-reward'].includes(step);
  const needsDailyModal = ['daily-claim', 'daily-tab', 'newbie-list', 'newbie-claim', 'newbie-close'].includes(step);
  const needsRouletteModal = ['roulette-spin'].includes(step);
  const needsCamp = ['daily', 'roulette', 'bosses', 'friends', 'journey'].includes(step);
  const needsBossScreen = ['boss-select', 'boss-finger', 'boss-pencil', 'boss-poison', 'boss-finish', 'boss-wait', 'boss-rewards'].includes(step);
  const needsSkillsScreen = ['skills-nav', 'skills-intro'].includes(step);
  useEffect(() => {
    const previous = previousTutorialStep.current;
    previousTutorialStep.current = step;
    if (previous === step || needsDailyModal || activeModal !== 'daily' || !['quests', 'home', 'roulette', 'bosses', 'friends', 'journey', 'done', 'skills-nav', 'skills-intro'].includes(step)) return;
    onOpenModal?.(null);
  }, [activeModal, needsDailyModal, onOpenModal, step]);
  useEffect(() => {
    if (step !== 'daily-claim' || activeModal !== 'daily' || typeof document === 'undefined') return undefined;
    const syncDailyClaimTarget = () => {
      if (document.querySelector('[data-tutorial-target="newbie-tab"]') && !document.querySelector('[data-tutorial-reward-popup="true"]') && !document.querySelector('[data-tutorial-target="daily-first-claim"]')) setStep('daily-tab');
    };
    const intervalId = window.setInterval(() => { if (!document.hidden) syncDailyClaimTarget(); }, 1000);
    syncDailyClaimTarget();
    return () => window.clearInterval(intervalId);
  }, [activeModal, step]);
  useEffect(() => {
    if (step !== 'newbie-claim' || activeModal !== 'daily') return undefined;
    const check = () => {
      if (document.querySelector('[data-tutorial-newbie-ready="true"]') && !document.querySelector('[data-tutorial-reward-popup="true"]') && !document.querySelector('[data-tutorial-target="newbie-first-claim"]')) setStep('newbie-close');
    };
    const timer = window.setInterval(() => { if (!document.hidden) check(); }, 1000);
    return () => window.clearInterval(timer);
  }, [activeModal, step]);
  const needsClosedModal = ['bosses', 'boss-select', 'friends', 'journey', 'done', 'skills-nav', 'skills-intro'].includes(step);
  const rouletteHintAfterClose = step === 'roulette-spin' && activeModal === null;
  const screenReady = (!needsTasks || activeTab === 'tasks')
    && (!needsCamp || activeTab === 'camp')
    && (!needsDailyModal || activeModal === 'daily')
    && (!needsRouletteModal || activeModal === 'roulette' || rouletteHintAfterClose)
    && (!needsBossScreen || activeTab === 'boss')
    && (!needsClosedModal || activeModal === null);
  const guideScreenReady = activeModal !== 'profile' && screenReady && (!needsSkillsScreen || activeTab === 'skills');
  const returnTargetName = !guideScreenReady
    ? needsTasks ? 'quests-nav'
      : needsCamp ? 'home-nav'
      : needsDailyModal ? 'daily-nav'
        : needsRouletteModal ? 'roulette-nav'
          : needsBossScreen ? 'bosses-nav'
            : null
    : targetName;
  const blocksUntilAck = false;

  useEffect(() => {
    setTargetRect(null);
    setGoRect(null);
    if (!returnTargetName || typeof document === 'undefined') {
      return undefined;
    }
    const updateTarget = () => {
      const target = step === 'daily-tab'
        ? document.querySelector('[data-tutorial-target="newbie-tab"]')
        : document.querySelector(`[data-tutorial-target="${returnTargetName}"]`) || (guideScreenReady && step === 'claim-reward' ? document.querySelector('[data-tutorial-target="quest-artifacts"]') : null);
      const goButton = step === 'quest-sector' ? document.querySelector(`[data-tutorial-quest-go="${sectorIndex}"]`) : null;
      const host = document.querySelector('[data-tutorial-overlay]');
      if (!target || !host) {
        setTargetRect(null);
        return;
      }
      if (step === 'daily-tab') {
        target.style.outline = '2px solid #ffd21f';
        target.style.outlineOffset = '3px';
        target.style.boxShadow = '0 0 16px rgba(255,210,31,.85)';
      }
      if (step === 'boss-finger') {
        const hpTarget = document.querySelector('[data-tutorial-boss-hp="true"]');
        if (hpTarget) {
          hpTarget.style.outline = '2px solid #ffd21f';
          hpTarget.style.outlineOffset = '3px';
          hpTarget.style.boxShadow = '0 0 16px rgba(255,210,31,.85)';
        }
      }
      const targetBox = target.getBoundingClientRect();
      const hostBox = host.getBoundingClientRect();
      const keepStableRect = (current, next) => current
        && Math.abs(current.left - next.left) < 1
        && Math.abs(current.top - next.top) < 1
        && Math.abs(current.width - next.width) < 1
        && Math.abs(current.height - next.height) < 1 ? current : next;
      setTargetRect((current) => keepStableRect(current, { left: targetBox.left - hostBox.left, top: targetBox.top - hostBox.top, width: targetBox.width, height: targetBox.height }));
      if (goButton) {
        const goBox = goButton.getBoundingClientRect();
        setGoRect((current) => keepStableRect(current, { left: goBox.left - hostBox.left, top: goBox.top - hostBox.top, width: goBox.width, height: goBox.height }));
      } else setGoRect(null);
    };
    updateTarget();
    let scrollTimer = null;
    if (['artifacts', 'quest-sector', 'daily-claim', 'newbie-claim'].includes(step) && screenReady) {
      scrollTimer = window.setTimeout(() => {
        const scrollTarget = document.querySelector(`[data-tutorial-target="${returnTargetName}"]`);
        if (scrollTarget) {
          const scrollParent = scrollTarget.closest('.overflow-y-auto, .overflow-auto');
          if (scrollParent) scrollParent.style.scrollBehavior = 'smooth';
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
        updateTarget();
      }, 80);
    }
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    const intervalId = window.setInterval(() => { if (!document.hidden) updateTarget(); }, 1000);
    let targetFrame = null;
    const targetObserver = new MutationObserver(() => {
      if (targetFrame !== null) return;
      targetFrame = window.requestAnimationFrame(() => { targetFrame = null; updateTarget(); });
    });
    targetObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      targetObserver.disconnect();
      if (targetFrame !== null) window.cancelAnimationFrame(targetFrame);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
      if (scrollTimer !== null) window.clearTimeout(scrollTimer);
      window.clearInterval(intervalId);
      const directTarget = document.querySelector('[data-tutorial-target="newbie-tab"]');
      if (directTarget) {
        directTarget.style.outline = '';
        directTarget.style.outlineOffset = '';
        directTarget.style.boxShadow = '';
      }
      document.querySelector('[data-tutorial-direct-hint="newbie-tab"]')?.remove();
      const hpTarget = document.querySelector('[data-tutorial-boss-hp="true"]');
      if (hpTarget) {
        hpTarget.style.outline = '';
        hpTarget.style.outlineOffset = '';
        hpTarget.style.boxShadow = '';
      }
    };
  }, [returnTargetName, guideScreenReady, screenReady, activeTab, activeModal, sectorIndex, step]);

  useEffect(() => {
    if (!isTester || (!returnTargetName && !blocksUntilAck) || typeof document === 'undefined') return undefined;
    const handleTargetClick = (event) => {
      if (activeModal === 'profile' || event.target.closest?.('[data-tutorial-settings]')) return;
      if (blocksUntilAck) {
        if (event.target.closest?.('[data-tutorial-ack], [data-tutorial-claim-reward], [data-tutorial-reward-popup]')) return;
        // Keep the guide from trapping the tester after a refresh: a tap
        // outside the acknowledgement dismisses this hint and still reaches
        // the game control underneath it.
        setDismissedStep(step);
        return;
      }
      const target = event.target.closest?.(`[data-tutorial-target="${returnTargetName}"]`);
      if (event.target.closest?.('[data-tutorial-overlay] button')) return;
      const questGo = step === 'quest-sector' && event.target.closest?.(`[data-tutorial-quest-go="${sectorIndex}"]`);
      const insideRewardPopup = event.target.closest?.('[data-tutorial-reward-popup="true"]');
      if (insideRewardPopup) return;
      if (!guideScreenReady && target && returnTargetName === 'quests-nav') {
        event.preventDefault();
        event.stopPropagation();
        onNavigateTab?.('tasks');
        if (step === 'quests') setStep('task-location');
        return;
      }
      if (step === 'quest-sector') {
        if (!questGo) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      if (step === 'quests' && !target) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (step === 'task-location' && !target) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (!target) return;
      // The first guide step targets the bottom navigation while the player is
      // still on the camp screen. Route directly so an overlay/layout change
      // cannot swallow the original navigation click.
      if (step === 'quests') {
        event.preventDefault();
        event.stopPropagation();
        onNavigateTab?.('tasks');
        setStep('task-location');
        return;
      }
      if (!guideScreenReady) return;
      if (step === 'task-location') {
        setStep('quest-sector');
        tutorialSaveAttempt.current = 'quest-sector';
        void onUpdateProfile?.({ playerAction: { type: 'tutorial-progress', step: 'quest-sector' } }).catch(() => {});
      }
      if (step === 'claim-reward') setStep('home');
      if (step === 'home') setStep('daily');
      if (step === 'daily') setStep('daily-claim');
      if (step === 'daily-tab') setStep('newbie-claim');
      if (step === 'newbie-claim') setStep('newbie-close');
      if (step === 'roulette') setStep('roulette-spin');
      if (step === 'roulette-spin') setStep('done');
      if (step === 'bosses') setStep('boss-select');
      // Advance only after the fight controls actually mount.
      if (step === 'boss-finger') setStep('boss-pencil');
      if (step === 'boss-pencil') setStep('boss-poison');
      if (step === 'boss-poison') setStep('boss-finish');
      if (step === 'boss-wait') setStep('boss-rewards');
      if (step === 'friends') setStep('journey');
      if (step === 'skills-nav') setStep('skills-intro');
      if (step === 'skills-intro') setStep('level-eight');
    };
    document.addEventListener('click', handleTargetClick, true);
    return () => document.removeEventListener('click', handleTargetClick, true);
  }, [isTester, onUpdateProfile, onNavigateTab, guideScreenReady, step, returnTargetName, rouletteUnlocked, rouletteHintAfterClose, blocksUntilAck, dismissedStep]);

  if (autoQuestIndex !== null) {
    const autoCopy = language === 'ru' ? ['Первое задание ты прошёл сам!', 'Остальные завершим за тебя — это стартовый бонус.', 'Опыт, ресурсы и артефакты добавлены', 'Дальше откроем твой первый ящик'] : language === 'en' ? ['You completed the first quest!', 'We will finish the rest for you as a starter bonus.', 'XP, resources and artifacts added', 'Next, open your first chest'] : ['Перше завдання ти пройшов сам!', 'Решту завершимо за тебе — це стартовий бонус.', 'Досвід, ресурси й артефакти додано', 'Далі відкриємо твій перший ящик'];
    return <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[210] flex justify-center"><div role="status" aria-live="polite" className="w-full max-w-[420px] rounded-xl border border-[#b9d876] bg-[#111c10]/95 p-4 text-center shadow-xl"><p className="text-sm font-black text-[#e4f49d]">{autoQuestIndex === 0 ? autoCopy[0] : `${language === 'en' ? 'Quest' : 'Квест'} ${autoQuestIndex+1}/7 ✓`}</p><p className="mt-2 text-xs leading-relaxed text-[#d1dfbc]">{autoQuestIndex === 0 ? autoCopy[1] : autoCopy[2]}</p><p className="mt-2 text-[10px] text-[#a4ba91]">{autoCopy[3]}</p><div className="mt-3 h-1.5 overflow-hidden rounded bg-black/50"><div className="h-full bg-[#b9da68] transition-[width] duration-500" style={{width:`${(autoQuestIndex+1)/7*100}%`}} /></div></div></div>;
  }
  if (!isTester || dismissedStep === step || step === 'completed' || step === 'context-done' || step === 'roulette-wait' || (step === 'roulette' && !rouletteUnlocked)) return null;
  if (step === 'bosses' && activeTab !== 'camp') return null;
  // Never ask for a victory claim before the actual button is mounted.
  if (guideScreenReady && ['boss-wait', 'boss-rewards'].includes(step) && !targetRect) return null;
  if (!guideScreenReady && !returnTargetName) return null;
  const isWelcome = step === 'welcome';
  const tutorialCompleted = Boolean(
    profile?.tutorial_level_eight_reward_claimed
  );
  if (tutorialCompleted || activeModal === 'profile') return null;
  if (step === 'newbie-close') {
    return (
      <div data-tutorial-overlay="true" className="pointer-events-none absolute inset-0 z-[200]">
        {targetRect ? <div className="absolute rounded-[12px] border-2 border-[#ffd21f] shadow-[0_0_16px_rgba(255,210,31,.8)]" style={{ left: targetRect.left - 5, top: targetRect.top - 5, width: targetRect.width + 10, height: targetRect.height + 10 }} /> : null}
        <div className="pointer-events-auto absolute left-2 right-2 rounded-xl border border-[#ffd21f] bg-[#171b10]/95 p-3 text-center shadow-lg" style={{ top: targetRect ? targetRect.top + targetRect.height + 16 : 150 }}>
          <p className="font-mono text-[11px] font-bold text-[#f4ffd9]">{language === 'ru' ? 'Закрой окно задания и переходи дальше.' : language === 'en' ? 'Close the quest window to continue.' : 'Закрий вікно завдання, щоб продовжити.'}</p>
        </div>
      </div>
    );
  }
  if (step === 'journey') {
    if (activeTab !== 'camp' || activeModal) return null;
    return <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[90] flex justify-center"><div className="pointer-events-auto w-full max-w-[380px]"><TutorialJourneyGoal profile={profile} language={language} onContinue={() => onNavigateTab?.('tasks')} /></div></div>;
  }
  if (step === 'level-eight' || step === 'level-fifteen') {
    const levelEight = step === 'level-eight';
    const starterPackCopy = language === 'ru'
      ? { title: 'СТАРТОВЫЙ НАБОР КОСМИЧЕСКОЙ СОПЛИ', claim: 'ЗАБРАТЬ НАГРАДУ', claimed: 'НАБОР УЖЕ ЗАБРАН', rewards: [['10 000', 'TENTACLES', 'tentacles'], ['10', 'T-PAPE', 'premium'], ['100', 'CA', 'strength'], ['10', 'МАЛЫЙ ЯД', 'small'], ['5', 'СРЕДНИЙ ЯД', 'medium'], ['3', 'ФЛЯГА С ЯДОМ', 'large'], ['200', 'EXP', 'xp'], ['100', 'ЭНЕРГИЯ', 'energy'], ['2', 'СПИН', 'spin']] }
      : language === 'en'
        ? { title: 'COSMIC BOOGER STARTER PACK', claim: 'CLAIM REWARD', claimed: 'PACK ALREADY CLAIMED', rewards: [['10,000', 'TENTACLES', 'tentacles'], ['10', 'T-PAPE', 'premium'], ['100', 'CA', 'strength'], ['10', 'SMALL POISON', 'small'], ['5', 'MEDIUM POISON', 'medium'], ['3', 'POISON FLASK', 'large'], ['200', 'EXP', 'xp'], ['100', 'ENERGY', 'energy'], ['2', 'SPIN', 'spin']] }
        : { title: 'СТАРТОВИЙ НАБІР КОСМІЧНОЇ ШМАРКЛІ', claim: 'ЗАБРАТИ НАГОРОДУ', claimed: 'НАБІР УЖЕ ЗАБРАНО', rewards: [['10 000', 'TENTACLES', 'tentacles'], ['10', 'T-PAPE', 'premium'], ['100', 'CA', 'strength'], ['10', 'МАЛИЙ ЯД', 'small'], ['5', 'СЕРЕДНІЙ ЯД', 'medium'], ['3', 'ФЛЯГА З ОТРУТОЮ', 'large'], ['200', 'EXP', 'xp'], ['100', 'ЕНЕРГІЯ', 'energy'], ['2', 'СПІН', 'spin']] };
    const rewardIcons = {
      tentacles: getResourceIcon('tentacles'), premium: getResourceIcon('premium'), strength: getResourceIcon('strength'),
      small: smallPoisonIcon, medium: mediumPoisonIcon, large: largePoisonIcon,
      xp: getResourceIcon('xp'), energy: getResourceIcon('energy'), spin: getResourceIcon('spin'),
    };
    const claimLevelEightReward = async () => {
      if (!profile?.tutorial_level_eight_reward_claimed) {
        try { await onUpdateProfile?.({ playerAction: { type: 'tutorial-final' } }); }
        catch { return; }
      }
      setStep('completed');
    };
    return (
      <div className="pointer-events-auto absolute inset-0 z-[500] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]">
        <div className="relative w-full max-w-[390px] rounded-[20px] border-2 border-[#8bff58] bg-[#11190f] p-4 text-center shadow-[0_0_28px_rgba(139,255,88,.35)]">
          <h2 className="font-sans text-[21px] font-black uppercase text-[#f4ffd9]">{levelEight ? (language === 'ru' ? 'ПОЗДРАВЛЯЮ, ТЕПЕРЬ ТЫ ПОЧТИ ФУНКЦИОНАЛЕН!' : language === 'en' ? 'CONGRATS, YOU’RE ALMOST FUNCTIONAL!' : 'ВІТАЮ, ТЕПЕР ТИ МАЙЖЕ ФУНКЦІОНАЛЬНИЙ!') : (language === 'ru' ? 'ЭТО УЖЕ НЕ ТРЕНИРОВОЧНАЯ ГРУША' : language === 'en' ? 'THIS IS NOT A TRAINING DUMMY ANYMORE' : 'ЦЕ ВЖЕ НЕ ТРЕНУВАЛЬНА ГРУША')}</h2>
          {levelEight ? <div className="mt-3 flex items-center gap-1 text-left"><img src={guideCelebrate} alt="" aria-hidden="true" className="-ml-3 h-20 w-20 shrink-0 object-contain" /><p className="font-mono text-[11px] font-bold leading-relaxed text-[#d3e7bf]">{language === 'ru' ? 'Восьмой уровень получен, первый талант прокачан, базовые признаки мышления зафиксированы. Начальное обучение завершено. Дальше тебя ждут более сильные боссы, лучшие награды и решения, за которые уже не получится обвинить енота.' : language === 'en' ? 'Level eight reached, your first talent upgraded, and basic signs of thought detected. Initial training is complete. Stronger bosses, better rewards, and decisions you can no longer blame on the raccoon await.' : 'Восьмий рівень отримано, перший талант прокачано, базові ознаки мислення зафіксовано. Початкове навчання завершено. Далі тебе чекають сильніші боси, кращі нагороди та рішення, за які вже не вийде звинуватити єнота.'}</p></div> : <div className="mt-3 flex flex-col items-center gap-1 text-left"><img src={guideCelebrate} alt="" aria-hidden="true" className="h-56 w-56 shrink-0 object-contain" /><p className="w-full font-mono text-[12px] font-bold leading-relaxed text-[#d3e7bf]">{language === 'ru' ? 'Этот босс значительно сильнее. Проверь снаряжение, набей карманы ядами и подумай, кого можно использовать как живой щит. Самоуверенность — отличная вещь. Особенно для босса: она регулярно поставляет ему свежих идиотов.' : language === 'en' ? 'This boss is much stronger. Check your gear, fill your pockets with poison, and think about who you can use as a living shield. Confidence is a wonderful thing—especially for a boss, as it regularly supplies him with fresh idiots.' : 'Цей бос значно сильніший. Перевір спорядження, набий кишені ядами й подумай, кого можна використати як живий щит. Самовпевненість — чудова річ. Особливо для боса: вона регулярно постачає йому свіжих ідіотів.'}</p></div>}
          {levelEight ? <>
            <div className="mt-4">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#d8ff5a]">{starterPackCopy.title}</p>
              <div className="mt-2 flex w-full flex-wrap justify-center gap-1.5">
                {starterPackCopy.rewards.map(([amount, label, icon]) => <div key={icon} style={{ backgroundColor: 'transparent', backgroundImage: 'none', border: 'none' }} className="starter-pack-reward flex h-[clamp(92px,25vw,108px)] w-[clamp(72px,22vw,84px)] flex-col items-center gap-1 !bg-transparent px-1 py-1.5">
                  <div style={{ backgroundColor: 'transparent', backgroundImage: 'none', border: 'none' }} className="flex h-[clamp(52px,16vw,64px)] w-[clamp(52px,16vw,64px)] items-center justify-center !bg-transparent"><img src={rewardIcons[icon]} alt="" aria-hidden="true" className="h-[clamp(48px,15vw,60px)] w-[clamp(48px,15vw,60px)] object-contain" /></div>
                  <span className="w-full truncate text-center font-mono text-[9px] uppercase tracking-[0.06em] text-[#eef7d9]">{label}</span>
                  <span className="font-mono text-[15px] font-black leading-none text-[#dfff82]">x{amount}</span>
                </div>)}
              </div>
            </div>
            <GameTextureButton type="button" onClick={claimLevelEightReward} className="mt-3 h-11 w-full">
              <span className="relative z-10 font-mono text-[12px] font-black uppercase text-[#15220b]">{profile?.tutorial_level_eight_reward_claimed ? starterPackCopy.claimed : starterPackCopy.claim}</span>
          </GameTextureButton>
          </> : <GameTextureButton type="button" onClick={() => setStep('context-done')} className="mt-5 h-11 w-full"><span className="relative z-10 font-mono text-[12px] font-black uppercase text-[#15220b]">{language === 'ru' ? 'ПОНЯТНО' : language === 'en' ? 'GOT IT' : 'ЗРОЗУМІЛО'}</span></GameTextureButton>}
        </div>
      </div>
    );
  }
  if (!isWelcome) {
    if (step === 'energy-free') return null;
    if (step === 'boss-finish' && !guideScreenReady) return null;
    const copy = {
      quests: ['ПОЧНЕМО З КВЕСТІВ', 'Ось тут енергія перетворюється на досвід, нагороди й хибне відчуття особистого розвитку. Тицяй. Подивимося, скільки проблем можна створити одним пальцем.'],
      'task-location': ['ОБИРАЙ ПЕРШУ ПЛАНЕТУ', 'Квести дають досвід і ресурси. Заверши лише перше завдання — 4 натискання GO.'],
      'quest-sector': ['ДОСВІД І ПЕРШИЙ АРТЕФАКТ', 'Кожне GO дає досвід і ресурси. Заповни першу смугу, щоб отримати артефакт.'],
      artifacts: ['НЕ СМІТТЯ, А АРТЕФАКТИ', 'Під час квестів випадають дивні предмети, яких нормальна цивілізація давно б позбулася. На кожній планеті свій набір. Збери його повністю й отримай бонус. Запам’ятай: одна підозріла штуковина — мотлох. Повний комплект — уже археологія.'],
      'claim-reward': ['ДИВИСЬ, ТОБІ ЩОСЬ ДАЛИ', 'Сім етапів позаду, планета не вибухнула, а в слоті навіть з’явилася нагорода. Неймовірний збіг обставин. Натисни CLAIM, поки система не передумала.'],
      home: ['ЗАБИРАЙМОСЯ ЗВІДСИ', 'Планета пережила твоє втручання. Не випробовуй її терпіння. Повертаймося на головну — там ще багато кнопок, про призначення яких ти поки навіть не здогадуєшся.'],
      daily: ['ЩОДЕННА ПОРЦІЯ КОСМІЧНОЇ ХАЛЯВИ', 'Виконуй завдання, отримуй досвід і забирай бонуси. Вони оновлюються щодня, бо навіть міжгалактичний хаос працює за розкладом. На відміну від декого.'],
      'daily-claim': ['ЗАВДАННЯ ЗРОБЛЕНО. ТЕПЕР НЕ ЗІПСУЙ УСЕ', 'Поруч лежить готова нагорода. Натисни CLAIM. Це буквально одна кнопка. Ми максимально знизили вимоги до успіху.'],
      'daily-tab': ['ВІДКРИЙ КВЕСТ НОВАЧКА', "Відкрий вкладку квесту новачка. Тут на тебе чекає окремий ланцюжок стартових завдань — почнемо з першого."],
      'newbie-claim': ['КВЕСТИ ДЛЯ СВІЖОЇ ШМАРКЛІ', 'Тут ми перевіримо, чи здатен ти виконувати прості завдання без вибухів, паніки та нагляду дорослих.\n\nРоби все по черзі, забирай нагороди й повільно перетворюйся з випадкової форми життя на проблему галактичного масштабу.'],
      roulette: ['А ЩО ЦЕ В НАС ТУТ?', "А що це в нас тут? Ходімо прокатаємо твою дупу на космічному колесі. Відкривай рулетку — перевіримо твою удачу."],
      'roulette-spin': ['КРУТИ КОЛЕСО КОСМІЧНОЇ БЕЗВІДПОВІДАЛЬНОСТІ', 'Витрачай спробу й отримуй випадкову нагороду. Може випасти щось корисне. А може — життєвий урок. Система нічого не гарантує, крім красивого обертання.'],
      done: ['НЕ РОЗСЛАБЛЯЙСЯ — СКОРО БОС', 'Забери доступні нагороди й прокачайся до 5 рівня. Скоро відкриються боси. Постарайся зустріти їх не в образі безкоштовної закуски з ногами.'],
      bosses: ['ОСЬ ТВОЯ ПЕРША ВЕЛИКА ПОМИЛКА', 'Боси вже відкриті. Натисни кнопку «БОСИ» й обери першого суперника. Він теж не готовий до цієї зустрічі.'],
      'boss-select': ['ОСЬ ТВОЯ ПЕРША ВЕЛИКА ПОМИЛКА', "Натисни зелену кнопку FREE під першим босом — це безкоштовний вхід у бій. Уже там покажемо, куди бити."],
      'boss-finger': ['БИЙ. ДУМАТИМЕМО ПОТІМ', 'Це звичайна атака. Ніякої науки: натискаєш кнопку — босу стає гірше. Спробуй. Якщо не вийде, ми скажемо всім, що це був стратегічний огляд.'],
      'boss-pencil': ['ВИСОКІ ТЕХНОЛОГІЇ: ПАЛЕЦЬ І ОЛІВЕЦЬ', 'Ці удари завдають додаткової шкоди й не витрачають енергію. Так, найнебезпечніша зброя галактики — канцелярія та частина руки. Після використання запускається перезарядження. Таймер обнулився — принижуй боса повторно.'],
      'boss-poison': ['ЯДИ: КОЛИ ЧЕСНИЙ БІЙ НАБРИД', 'Яди — одноразові витратники, які завдають додаткової шкоди. Їх можна отримувати за квести, завдання, події, рулетку та інші підозрілі активності. Для навчання тобі видано 5 фляг з отрутою. Не пий їх. Я серйозно.'],
      'boss-finish': ['ДОСИТЬ ЙОГО ВИХОВУВАТИ — ДОБИВАЙ', 'Ти вже вмієш бити, тикати Пальцем, застосовувати Олівець і заливати ворога токсичною рідиною. Звучить як дуже дивний вечір, але навчання пройдено. Тепер прибери цю потвору з екрана.'],
      'boss-wait': ['БОС ЗДОХ. А ТИ — НІ!', 'Неочікувано пристойний результат. Забирай нагороду, поки вона не охолола, — попереду ще купа кнопок і сумнівних рішень.'],
      'boss-rewards': ['ОБШУКАЙ ТІЛО. ТОБТО НАТИСНИ CLAIM', 'Бос уже нікуди не втече, але нагорода все ще чекає на підтвердження. Натисни CLAIM і забери все, що система дозволяє винести без свідків.'],
      friends: ['ЗАТЯГНИ СЮДИ ДРУЗІВ', 'Запрошуй друзів, бийте босів разом і отримуй подарунки за кожного, хто повірить твоєму посиланню. З друзями легше перемагати. А якщо програєте — завжди буде на кого перекласти відповідальність.'],
      'skills-nav': ['ЧАС ВСТАНОВИТИ МОЗОК. ХОЧА Б ПРОГРАМНО', 'Тобі відкрилися таланти. Тут можна посилити героя й частково виправити те, що природа залишила розробникам. Тицяй сюди. Зробимо з тебе щось небезпечніше за мокрий пакет.'],
      'skills-intro': ['МОДИФІКУЄМО ШМАРКЛЮ', 'Таланти посилюють атаки, енергію, відновлення та інші характеристики, які відрізняють героя від декоративної рослини. Прокачай перший талант на один рівень. Далі читай описи та обирай самостійно.'],
    }[step] || ['ПІДКАЗКА', 'Натисни підсвічений елемент.'];
    const localizedCopy = language === 'ru'
      ? {
        quests: ['НАЧНЁМ С КВЕСТОВ', 'Здесь энергия превращается в опыт, награды и ложное ощущение личностного роста. Тыкай сюда. Посмотрим, сколько проблем можно создать одним пальцем.'],
      'task-location': ['ВЫБИРАЙ ПЕРВУЮ ПЛАНЕТУ', 'Квесты дают опыт и ресурсы. Заверши только первое задание — 4 нажатия GO.'],
      'quest-sector': ['ОПЫТ И ПЕРВЫЙ АРТЕФАКТ', 'Каждое GO даёт опыт и ресурсы. Заполни первую полосу, чтобы получить артефакт.'],
        artifacts: ['НЕ МУСОР, А АРТЕФАКТЫ', 'Во время квестов выпадают странные предметы, от которых нормальная цивилизация давно бы избавилась. На каждой планете свой набор. Собери его полностью и получи бонус. Запомни: одна подозрительная штуковина — хлам. Полный комплект — уже археология.'],
        'claim-reward': ['СМОТРИ, ТЕБЕ ЧТО-ТО ДАЛИ', 'Все семь этапов позади, планета не взорвалась, а в слоте даже появилась награда. Невероятное совпадение обстоятельств. Нажми CLAIM, пока система не передумала.'],
        home: ['ВАЛИМ ОТСЮДА', 'Планета пережила твоё вмешательство. Не испытывай её терпение. Возвращаемся на главную — там ещё много кнопок, о назначении которых ты пока даже не догадываешься.'],
        daily: ['ЕЖЕДНЕВНАЯ ПОРЦИЯ КОСМИЧЕСКОЙ ХАЛЯВЫ', 'Выполняй задания, получай опыт и забирай бонусы. Они обновляются каждый день, потому что даже межгалактический хаос работает по расписанию. В отличие от некоторых.'],
        'daily-claim': ['ЗАДАНИЕ ВЫПОЛНЕНО. ТЕПЕРЬ НЕ ИСПОРТЬ ВСЁ', 'Рядом лежит готовая награда. Нажми CLAIM. Это буквально одна кнопка. Мы максимально снизили требования к успеху.'],
        'daily-tab': ['ОТКРОЙ КВЕСТ НОВИЧКА', "Открой вкладку квеста новичка. Здесь тебя ждёт отдельная цепочка стартовых заданий — начнём с первого."],
        'newbie-claim': ['КВЕСТЫ ДЛЯ СВЕЖЕЙ СОПЛИ', 'Здесь мы проверим, способен ли ты выполнять простые задания без взрывов, паники и присмотра взрослых.\n\nДелай всё по порядку, забирай награды и постепенно превращайся из случайной формы жизни в проблему галактического масштаба.'],
        roulette: ['А ЧТО ЭТО У НАС ТУТ?', "А что это у нас тут? Пошли прокатим твою задницу на космическом колесе. Открывай рулетку — проверим твою удачу."],
        'roulette-spin': ['КРУТИ КОЛЕСО КОСМИЧЕСКОЙ БЕЗОТВЕТСТВЕННОСТИ', 'Трать попытку и получай случайную награду. Может выпасть что-нибудь полезное. А может — жизненный урок. Система ничего не гарантирует, кроме красивого вращения.'],
        done: ['НЕ РАССЛАБЛЯЙСЯ — СКОРО БОСС', 'Забери доступные награды и прокачайся до 5 уровня. Скоро откроются боссы. Постарайся встретить их не в образе бесплатной закуски с ногами.'],
        bosses: ['ВОТ ТВОЯ ПЕРВАЯ БОЛЬШАЯ ОШИБКА', 'Боссы уже открыты. Нажми кнопку «БОССЫ» и выбери первого соперника. Он тоже не готов к этой встрече.'],
        'boss-select': ['ВОТ ТВОЯ ПЕРВАЯ БОЛЬШАЯ ОШИБКА', "Нажми зелёную кнопку FREE под первым боссом — это бесплатный вход в бой. Уже там покажем, куда бить."],
        'boss-finger': ['БЕЙ. ДУМАТЬ БУДЕМ ПОТОМ', 'Это обычная атака. Никакой науки: нажимаешь кнопку — боссу становится хуже. Попробуй. Если не получится, мы скажем всем, что это был стратегический осмотр.'],
        'boss-pencil': ['ВЫСОКИЕ ТЕХНОЛОГИИ: ПАЛЕЦ И КАРАНДАШ', 'Эти удары наносят дополнительный урон и не расходуют энергию. Да, самое опасное оружие галактики — канцелярия и часть руки. После использования запускается перезарядка. Таймер обнулился — унижай босса повторно.'],
        'boss-poison': ['ЯДЫ: КОГДА ЧЕСТНЫЙ БОЙ НАДОЕЛ', 'Яды — одноразовые расходники, которые наносят дополнительный урон. Их можно получать за квесты, задания, события, рулетку и другие подозрительные активности. Для обучения тебе выдано 5 фляг с ядом. Не пей их. Я серьёзно.'],
        'boss-finish': ['ХВАТИТ ЕГО ВОСПИТЫВАТЬ — ДОБИВАЙ', 'Ты уже умеешь бить, тыкать Пальцем, применять Карандаш и заливать врага токсичной жидкостью. Обучение пройдено. Теперь убери этого урода с экрана.'],
        'boss-wait': ['БОСС СДОХ. А ТЫ — НЕТ!', 'Неожиданно приличный результат. Забирай награду, пока она не остыла, — впереди ещё куча кнопок и сомнительных решений.'],
        'boss-rewards': ['ОБЫЩИ ТЕЛО. ТО ЕСТЬ НАЖМИ CLAIM', 'Босс уже никуда не убежит, но награда всё ещё ждёт подтверждения. Нажми CLAIM и забери всё, что система позволяет унести без свидетелей.'],
        friends: ['ЗАТАЩИ СЮДА ДРУЗЕЙ', 'Приглашай друзей, бейте боссов вместе и получай подарки за каждого, кто поверит твоей ссылке. С друзьями легче побеждать. А если проиграете — всегда будет на кого свалить ответственность.'],
        'skills-nav': ['ПОРА УСТАНОВИТЬ МОЗГ. ХОТЯ БЫ ПРОГРАММНО', 'Тебе открылись таланты. Здесь можно усилить героя и частично исправить то, что природа оставила разработчикам. Тыкай сюда. Сделаем из тебя что-нибудь опаснее мокрого пакета.'],
        'skills-intro': ['МОДИФИЦИРУЕМ СОПЛЮ', 'Таланты усиливают атаки, энергию, восстановление и другие характеристики, которые отличают героя от декоративного растения. Прокачай первый талант на один уровень. Дальше читай описания и выбирай самостоятельно.'],
      }[step] || copy
      : language === 'en'
        ? ({
          quests: ['LET’S START WITH QUESTS', 'This is where energy turns into XP, rewards, and the comforting illusion of personal growth. Tap here. Let’s see how much trouble one finger can cause.'],
      'task-location': ['PICK THE FIRST PLANET', 'Quests earn XP and resources. Complete just the first quest — 4 GO taps.'],
      'quest-sector': ['XP AND YOUR FIRST ARTIFACT', 'Every GO earns XP and resources. Fill the first bar to earn an artifact.'],
          artifacts: ['NOT TRASH—ARTIFACTS', 'Quests can drop strange objects that any sensible civilization would have thrown away centuries ago. Every planet has its own set. Complete it to earn a bonus. Remember: one suspicious object is junk. A complete set is archaeology.'],
          'claim-reward': ['LOOK, SOMEONE GAVE YOU SOMETHING', 'All seven stages are complete, the planet hasn’t exploded, and a reward has appeared in the slot. An astonishing chain of coincidences. Tap CLAIM before the system changes its mind.'],
          home: ['LET’S GET OUT OF HERE', 'The planet survived your intervention. Don’t test its patience. Return to the main screen—there are plenty more buttons whose purpose you don’t understand yet.'],
          daily: ['YOUR DAILY DOSE OF COSMIC FREE STUFF', 'Complete daily tasks, earn XP, and collect bonuses. They refresh every day because even intergalactic chaos follows a schedule. Unlike certain people.'],
          'daily-claim': ['TASK COMPLETE. NOW DON’T RUIN IT', 'There’s a reward waiting right next to you. Tap CLAIM. It’s literally one button. We’ve lowered the bar for success as far as it will go.'],
          'daily-tab': ['OPEN THE NEWBIE QUEST', "Open the Newbie Quest tab. A separate chain of starter tasks awaits — let’s begin with the first one."],
          'newbie-claim': ['QUESTS FOR A FRESH COSMIC BOOGER', 'Here we’ll see whether you can complete simple tasks without explosions, panic, or adult supervision.\n\nDo everything in order, claim your rewards, and slowly turn from a random life-form into a galaxy-scale problem.'],
          roulette: ['WHAT HAVE WE GOT HERE?', "What have we got here? Let’s take your butt for a ride on the cosmic wheel. Open roulette and let’s test your luck."],
          'roulette-spin': ['SPIN THE WHEEL OF COSMIC IRRESPONSIBILITY', 'Spend a spin and receive a random reward. You might get something useful. You might get a valuable life lesson. The system guarantees nothing except a pretty animation.'],
          done: ['DON’T RELAX—A BOSS IS COMING', 'Collect the available rewards and reach level 5. Bosses will unlock soon. Try not to greet them dressed as a free snack with legs.'],
          bosses: ['HERE’S YOUR FIRST MAJOR MISTAKE', 'Bosses are unlocked. Tap the BOSSES button and choose your first opponent. It is not ready for this meeting either.'],
          'boss-select': ['HERE’S YOUR FIRST MAJOR MISTAKE', "Press the green FREE button under the first boss to enter the fight at no cost. Then we’ll show you where to hit."],
          'boss-finger': ['HIT IT. WE’LL THINK LATER', 'This is a basic attack. No advanced science here: press the button, and the boss feels worse. Give it a try. If it fails, we’ll tell everyone it was a strategic inspection.'],
          'boss-pencil': ['ADVANCED TECHNOLOGY: A FINGER AND A PENCIL', 'These attacks deal extra damage without consuming energy. Yes, the galaxy’s deadliest weapons are office supplies and part of your hand. When the timer reaches zero, you may humiliate the boss again.'],
          'boss-poison': ['POISON: FOR WHEN FAIR FIGHTS GET BORING', 'Poisons are single-use items that deal extra damage. Earn them from quests, tasks, events, roulette, and other suspicious activities. We gave you 5 poison flasks for training. Don’t drink them. I’m serious.'],
          'boss-finish': ['ENOUGH TRAINING — FINISH HIM', 'You can punch, use the Finger and Pencil, and soak the enemy in toxic liquid. Training complete. Now get that creature off the screen.'],
          'boss-wait': ['THE BOSS IS DEAD. YOU AREN’T!', 'A surprisingly decent result. Grab the reward while it’s still warm—there are plenty more buttons and terrible decisions ahead.'],
          'boss-rewards': ['SEARCH THE BODY. I MEAN, TAP CLAIM', 'The boss isn’t going anywhere, but the reward is still waiting for confirmation. Tap CLAIM and take everything the system lets you carry away without witnesses.'],
          friends: ['DRAG YOUR FRIENDS INTO THIS', 'Invite friends, fight bosses together, and earn gifts for everyone who trusts your link. Winning is easier with friends. And if you lose, there’s always someone else to blame.'],
          'skills-nav': ['TIME TO INSTALL A BRAIN—SOFTWARE COUNTS', 'You’ve unlocked Talents. This is where you strengthen your hero and fix some of the problems nature left for the developers. Tap here. We’ll turn you into something more dangerous than a wet paper bag.'],
          'skills-intro': ['MODIFYING THE BOOGER', 'Talents improve attacks, energy, recovery, and other stats that separate a hero from a decorative houseplant. Upgrade the first talent by one level. After that, read the descriptions and choose for yourself.'],
        }[step] || copy)
      : copy;
    const returnCopy = !guideScreenReady
      ? language === 'ru'
        ? ['ЭЙ, МЫ ВООБЩЕ-ТО НЕ ЗАКОНЧИЛИ', 'После перезагрузки тебя занесло не туда. Бывает. Пространство, время, кривые пальцы — причин много. Нажми подсвеченную кнопку. Я проведу тебя обратно к месту, где мы остановились, и постараюсь не осуждать слишком громко.']
        : language === 'en'
          ? ['HEY, WE WEREN’T FINISHED', 'The reload dropped you in the wrong place. It happens. Space, time, clumsy fingers—there are many possible explanations. Tap the highlighted button. I’ll guide you back to where we stopped and try not to judge too loudly.']
          : ['ГЕЙ, МИ ВЗАГАЛІ-ТО НЕ ЗАКІНЧИЛИ', 'Після перезавантаження тебе занесло не туди. Буває. Простір, час, криві пальці — причин багато. Натисни підсвічену кнопку. Я проведу тебе назад до місця, де ми зупинилися, і спробую не засуджувати надто голосно.']
      : localizedCopy;
    if (rewardPopupOpen) {
      return (
        <div data-tutorial-overlay="true" className="pointer-events-none absolute inset-0 z-[200]" aria-hidden="true" />
      );
    }
    if (!guideScreenReady) {
      return (
        <div data-tutorial-overlay="true" className="pointer-events-none absolute inset-0 z-[9999]">
          {targetRect ? <div className="absolute rounded-[12px] border-2 border-[#ffd21f] shadow-[0_0_16px_rgba(255,210,31,.8)]" style={{ left: targetRect.left - 5, top: targetRect.top - 5, width: targetRect.width + 10, height: targetRect.height + 10 }} /> : null}
          <div className="pointer-events-auto absolute bottom-[calc(var(--bottom-nav-space,96px)+8px)] left-2 right-2 mx-auto max-w-[504px] rounded-[16px] border border-[#ffd21f] bg-[#171b10]/95 p-3 text-center shadow-lg">
            <p className="font-mono text-[10px] font-black uppercase text-[#ffd21f]">{returnCopy[0]}</p>
            <p className="mt-2 font-mono text-[12px] font-bold leading-relaxed text-[#f4ffd9]">{returnCopy[1]}</p>
          </div>
        </div>
      );
    }
    const understoodLabel = language === 'ru' ? 'ПОНЯЛ' : language === 'en' ? 'GOT IT' : 'ЗРОЗУМІВ';
    const closeHintLabel = language === 'ru' ? 'ЗАКРЫТЬ ПОДСКАЗКУ' : language === 'en' ? 'CLOSE HINT' : 'ЗАКРИТИ ПІДКАЗКУ';
    const clearBossLabel = language === 'ru' ? 'ДОБИТЬ БОССА' : language === 'en' ? 'FINISH THE BOSS' : 'ДОБИТИ БОСА';
    if (step === 'quests') {
      return (
        <div data-tutorial-overlay="true" className="pointer-events-none absolute inset-0 z-[9999]">
          {targetRect ? <div className="pointer-events-none absolute rounded-[12px] border-2 border-[#ffd21f] shadow-[0_0_16px_rgba(255,210,31,.8)]" style={{ left: targetRect.left - 5, top: targetRect.top - 5, width: targetRect.width + 10, height: targetRect.height + 10 }} /> : null}
          <div ref={hintRef} className="pointer-events-auto absolute left-2 right-2 mx-auto max-w-[504px] overflow-y-auto rounded-[16px] border border-[#ffd21f] bg-[#171b10]/95 p-3 pl-28 text-center shadow-[0_5px_20px_rgba(0,0,0,.6)]" style={{ bottom: 'calc(var(--bottom-nav-space, 96px) + 8px)', maxHeight: 'calc(100% - var(--bottom-nav-space, 96px) - 16px)' }}>
            {guideImage && !['boss-wait', 'boss-rewards'].includes(step) ? <img src={guideImage} alt="" aria-hidden="true" className="pointer-events-none absolute left-1 top-1/2 h-24 w-24 -translate-y-1/2 -scale-x-100 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,.75)]" /> : null}
            <p className="relative z-10 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#ffd21f]">{returnCopy[0]}</p>
            <p className="relative z-10 mt-2 whitespace-pre-line font-mono text-[12px] font-bold leading-relaxed text-[#f4ffd9]">{returnCopy[1]}</p>
          </div>
        </div>
      );
    }
    const sideHint = targetRect && ['claim-reward', 'daily', 'daily-claim', 'roulette', 'boss-wait', 'boss-rewards', 'friends'].includes(step);
    const aboveHint = targetRect && step === 'daily-tab';
    const bossCombatHint = targetRect && ['boss-finger', 'boss-pencil', 'boss-poison'].includes(step);
    const overlayWidth = typeof document !== 'undefined'
      ? document.querySelector('[data-tutorial-overlay]')?.getBoundingClientRect().width || window.innerWidth
      : 360;
    const overlayHeight = typeof document !== 'undefined'
      ? document.querySelector('[data-tutorial-overlay]')?.getBoundingClientRect().height || window.innerHeight
      : 700;
    const popupWidth = hintRef.current?.getBoundingClientRect().width || Math.min(overlayWidth * 0.9, 420);
    const leftFits = Boolean(targetRect && targetRect.left - popupWidth - 16 >= 8);
    const rightFits = Boolean(targetRect && targetRect.left + targetRect.width + popupWidth + 16 <= overlayWidth - 8);
    const verticalPlacement = sideHint && !leftFits && !rightFits;
    const sideWidth = targetRect
      ? leftFits
        ? targetRect.left - 16
        : rightFits
          ? overlayWidth - targetRect.left - targetRect.width - 16
          : overlayWidth - 16
      : overlayWidth - 16;
    const sideLeft = targetRect
      ? targetRect.left - popupWidth - 12 >= 8
        ? targetRect.left - popupWidth - 12
        : targetRect.left + targetRect.width + 12 + popupWidth <= overlayWidth - 8
          ? targetRect.left + targetRect.width + 12
          : Math.max(8, Math.min(overlayWidth - popupWidth - 8, targetRect.left - popupWidth - 12))
      : 8;
    const sideTop = targetRect
      ? verticalPlacement
        ? targetRect.top - (hintHeight || 180) - 16 >= 8
          ? targetRect.top - (hintHeight || 180) - 16
          : targetRect.top + targetRect.height + 16
        : Math.max(8, Math.min((typeof window !== 'undefined' ? window.innerHeight : 700) - (hintHeight || 180) - 8, targetRect.top + targetRect.height / 2 - (hintHeight || 180) / 2))
      : 8;
    const maxMagnetTop = Math.max(8, overlayHeight - (hintHeight || 220) - 8);
    const magnetTop = targetRect
      ? step === 'quests'
        ? Math.min(Math.max(8, targetRect.top - (hintHeight || 180) - 12), maxMagnetTop)
        : step === 'newbie-claim'
          ? Math.max(8, targetRect.top - (hintHeight || 220) - 20)
          : step === 'daily-tab'
            ? Math.max(8, targetRect.top - (hintHeight || 180) - 12)
          : ['task-location', 'quest-sector', 'boss-select', 'roulette-spin', 'skills-intro'].includes(step)
            ? targetRect.top + targetRect.height + 12
            : ['artifacts', 'claim-reward'].includes(step)
              ? Math.max(8, targetRect.top - (hintHeight || 180) - 12)
              : Math.max(60, targetRect.top - (hintHeight || 180) - 12)
      : undefined;
    return (
      <div data-tutorial-overlay="true" className="pointer-events-none absolute inset-0 z-[200]">
        {targetRect ? <div className="pointer-events-none absolute rounded-[12px] border-2 border-[#ffd21f] shadow-[0_0_16px_rgba(255,210,31,.8)]" style={{ left: targetRect.left - 5, top: targetRect.top - 5, width: targetRect.width + 10, height: targetRect.height + 10 }} /> : null}
        {step === 'quest-sector' && goRect ? <div className="pointer-events-none absolute z-[205] rounded-[10px] border-[3px] border-[#ffd21f] shadow-[0_0_20px_6px_rgba(255,210,31,.72)]" style={{ left: goRect.left - 5, top: goRect.top - 5, width: goRect.width + 10, height: goRect.height + 10 }} /> : null}
        <div
          className={`pointer-events-auto absolute z-[210] ${sideHint ? 'w-[min(90vw,420px)]' : 'w-[calc(100%-16px)]'} left-1/2 -translate-x-1/2 rounded-[16px] border border-[#ffd21f] bg-[#171b10]/95 p-3 text-center shadow-[0_5px_20px_rgba(0,0,0,.6)] ${['quests', 'task-location', 'quest-sector', 'artifacts', 'daily-tab', 'done', 'bosses', 'boss-finger', 'boss-pencil', 'boss-finish', 'skills-intro', 'newbie-claim'].includes(step) ? '!pl-28' : ''} ${['claim-reward', 'home', 'daily', 'daily-claim', 'roulette', 'roulette-spin', 'boss-select', 'boss-poison', 'friends', 'skills-nav'].includes(step) ? '!pr-28' : ''}`}
          ref={hintRef}
          style={{
            position: 'absolute',
            top: sideHint ? sideTop : magnetTop,
            left: sideHint ? sideLeft : undefined,
            width: sideHint ? `min(${Math.max(120, sideWidth)}px, calc(100% - 16px))` : undefined,
            transform: sideHint ? 'none' : undefined,
            bottom: sideHint || aboveHint || bossCombatHint || targetRect ? 'auto' : step === 'boss-finish' ? 172 : 122,
          }}
        >
          <button
            type="button"
            onClick={() => setDismissedStep(step)}
            aria-label={closeHintLabel}
            title={closeHintLabel}
            className="absolute right-1 top-1 z-[12] flex h-7 w-7 items-center justify-center rounded-full border border-[#8a9c69] bg-[#10170d]/95 font-sans text-[18px] font-black leading-none text-[#eaffc1] shadow-[0_2px_5px_rgba(0,0,0,.7)]"
          >
            ×
          </button>
          {guideImage ? <img src={guideImage} alt="" aria-hidden="true" className={`pointer-events-none z-0 h-24 w-24 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,.75)] ${guidePosition} ${['quests', 'boss-select', 'newbie-claim'].includes(step) ? '-scale-x-100' : ''}`} /> : null}
          <p className="relative z-10 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#ffd21f]">{returnCopy[0]}</p>
          <p className="relative z-10 mt-2 whitespace-pre-line font-mono text-[12px] font-bold leading-relaxed text-[#f4ffd9]">{returnCopy[1]}</p>
          {step === 'artifacts' ? <button type="button" onClick={() => setStep('claim-reward')} className="mt-3 h-9 rounded-[10px] bg-[#d8ff5a] px-4 font-sans text-[11px] font-black uppercase text-[#172016]">{understoodLabel}</button> : null}
          {step === 'done' ? <button type="button" data-tutorial-ack="true" onClick={() => { setDismissedStep(step); if (activeModal === 'roulette') onOpenModal?.(null); }} className="mt-3 h-9 rounded-[10px] bg-[#d8ff5a] px-4 font-sans text-[11px] font-black uppercase text-[#172016]">{understoodLabel}</button> : null}
          {step === 'boss-finish' ? <button type="button" onClick={() => setStep('boss-wait')} className="mt-3 h-9 rounded-[10px] bg-[#d8ff5a] px-4 font-sans text-[11px] font-black uppercase text-[#172016]">{clearBossLabel}</button> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="pointer-events-auto absolute inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[390px] rounded-[14px] border-2 border-[#8bff58] bg-[linear-gradient(180deg,#172414_0%,#080d08_100%)] p-4 shadow-[0_0_28px_rgba(139,255,88,.35)]">
        {isWelcome ? (
          <div className="mb-3 flex items-center justify-between gap-1.5" aria-label="Вибір мови">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#9dff43]">{welcomeText.label}</p>
            </div>
            <div className="flex items-center gap-1.5">
            {[['uk', flagUa], ['ru', flagRu], ['en', flagEn]].map(([language, flag]) => (
              <button
                key={language}
                type="button"
                onClick={() => { setSelectedLanguage(language); onUpdateProfile?.({ language }); }}
                className={`flex h-8 w-9 items-center justify-center rounded-[8px] text-[18px] transition ${selectedLanguage === language ? 'bg-[#354d1e]' : 'bg-[#101a0f] opacity-70'}`}
                aria-label={language}
              >
                <img src={flag} alt={language} className="h-4 w-6 rounded-[2px] object-cover" />
              </button>
            ))}
            </div>
          </div>
        ) : null}
        {!isWelcome ? <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#9dff43]">КРОК 1 · КВЕСТИ</p> : null}
        {isWelcome ? <img src={guideGreeting} alt="Космічний єнот" className="mx-auto mb-1 h-32 w-32 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,.7)]" /> : null}
        <h2 className="mt-2 font-sans text-[22px] font-black uppercase leading-none text-[#f4ffd9]">
          {isWelcome ? welcomeText.title : 'ПОЧНЕМО З КВЕСТІВ'}
        </h2>
        <p className="mt-3 font-mono text-[12px] font-bold leading-relaxed text-[#d3e7bf]">
          {isWelcome
            ? welcomeText.text
            : 'Тут ти отримуватимеш досвід, а заразом зможеш вибивати нагороди та різні корисні штуки. Тицяй сюди.'}
        </p>
        {isWelcome ? <div className="mt-4 flex items-center justify-center gap-2 bg-transparent px-3 py-2 font-mono text-[14px] font-black text-[#ffd21f]"><img src={energyIcon} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />×131 {welcomeText.energy}</div> : null}
        {welcomeBonusError ? <p className="mt-2 text-[11px] text-[#ff9c86]">Не вдалося нарахувати енергію. Спробуй ще раз.</p> : null}
        <GameTextureButton
          type="button"
          onClick={async () => {
            if (isWelcome) {
              if (!profile?.welcome_energy_granted) {
                if (welcomeBonusPendingRef.current) return;
                welcomeBonusPendingRef.current = true;
                try {
                  await onUpdateProfile?.({ claimWelcomeEnergy: true });
                } catch {
                  welcomeBonusPendingRef.current = false;
                  setWelcomeBonusError(true);
                  return;
                }
              }
              try { window.localStorage.setItem(`${storageKey}:welcome-seen`, '1'); } catch {}
              setStep('quests');
            } else {
              setStep('done');
            }
          }}
          tone="green"
          className="mt-5 h-11 w-full rounded-[12px] font-sans text-[13px] font-black uppercase text-[#172016]"
        >
          <span className="relative z-10">{isWelcome ? welcomeText.go : 'ЗРОЗУМІЛО'}</span>
        </GameTextureButton>
        {isWelcome ? <button
          type="button"
          className="mt-3 w-full font-mono text-[11px] uppercase text-[#9cb087] underline"
          onClick={() => { void onUpdateProfile?.({ playerAction: { type: 'tutorial-skip' } }).catch(() => setWelcomeBonusError(true)); }}
        >{{ uk: 'Пропустити навчання', ru: 'Пропустить обучение', en: 'Skip the tutorial' }[language] || 'Skip the tutorial'}</button> : null}
      </div>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex h-full min-h-[180px] w-full min-w-0 flex-1 items-center justify-center bg-[#090d08]">
      <CombatLoader/>
    </div>
  );
}

const CRITICAL_ASSET_PATHS = [
  heroNavIcon,
  tentaclesIcon,
  starIcon,
  levelIcon,
  bossesNavIcon,
  questsNavIcon,
  inventoryNavIcon,
  clansNavIcon,
  heroBase,
];

const I18N = {
  uk: {
    modalTitles: {
      daily: '\u0429\u043E\u0434\u0435\u043D\u043D\u0456',
      events: '\u0406\u0432\u0435\u043D\u0442\u0438',
      settings: '\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F',
      leaderboard: '\u0422\u043E\u043F',
      equipment: '\u0415\u043A\u0456\u043F',
      clan: '\u041A\u043B\u0430\u043D\u0438',
      chat: '\u0427\u0430\u0442',
      backgrounds: '\u0424\u043E\u043D\u0438',
      profile: '\u041F\u0440\u043E\u0444\u0456\u043B\u044C',
      roulette: '\u041B\u0443\u0434\u043A\u0430',
      mail: '\u041F\u043E\u0448\u0442\u0430',
    },
    screen: '\u0415\u043A\u0440\u0430\u043D',
    close: '\u0417\u0430\u043A\u0440\u0438\u0442\u0438',
    loading: '\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u044E \u0442\u0430\u0431\u0456\u0440...',
    profileFailTitle: '\u041F\u0440\u043E\u0444\u0456\u043B\u044C \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0432\u0441\u044F',
    profileFailText: "Не вдалося завантажити профіль. Спробуй ще раз.",
    retry: "Спробувати ще раз",
  },
  ru: {
    modalTitles: {
      daily: '\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0435',
      events: '\u0418\u0432\u0435\u043D\u0442\u044B',
      settings: '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438',
      leaderboard: '\u0422\u043E\u043F',
      equipment: '\u042D\u043A\u0438\u043F',
      clan: '\u041A\u043B\u0430\u043D\u044B',
      chat: '\u0427\u0430\u0442',
      backgrounds: '\u0424\u043E\u043D\u044B',
      profile: '\u041F\u0440\u043E\u0444\u0438\u043B\u044C',
      roulette: '\u0420\u0443\u043B\u0435\u0442\u043A\u0430',
      mail: '\u041F\u043E\u0447\u0442\u0430',
    },
    screen: '\u042D\u043A\u0440\u0430\u043D',
    close: '\u0417\u0430\u043A\u0440\u044B\u0442\u044C',
    loading: '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044E \u043B\u0430\u0433\u0435\u0440\u044C...',
    profileFailTitle: '\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F',
    profileFailText: "Не удалось загрузить профиль. Попробуй ещё раз.",
    retry: "Попробовать ещё раз",
  },
  en: {
    modalTitles: {
      daily: 'Daily',
      events: 'Events',
      settings: 'Settings',
      leaderboard: 'Top',
      equipment: 'Gear',
      clan: 'Clans',
      chat: 'Chat',
      backgrounds: 'Backgrounds',
      profile: 'Profile',
      roulette: 'Roulette',
      mail: 'Mail',
    },
    screen: 'Screen',
    close: 'Close',
    loading: 'Loading camp...',
    profileFailTitle: 'Profile failed to load',
    profileFailText: "We couldn’t load your profile. Please try again.",
    retry: "Try again",
  },
};

function ModalShell({
  title,
  labels,
  onClose,
  children,
  headerIcon = null,
  hideHeader = false,
  lockContentScroll = false,
  frameless = false,
  centered = false,
  reserveBottomNav = false,
  overlayBottomNav = false,
  fullscreen = false,
  coverNavigation = false,
  dismissOnBackdrop = false,
  contentClassName = '',
}) {
  return (
    <div
      data-modal-backdrop={dismissOnBackdrop ? 'dismissible' : undefined}
      onClick={dismissOnBackdrop ? (event) => { if (event.target === event.currentTarget) onClose?.(); } : undefined}
      className={`absolute inset-0 ${fullscreen ? 'z-[60]' : reserveBottomNav || coverNavigation ? 'z-40' : 'z-20'} flex justify-center ${fullscreen ? 'px-0' : 'px-2 sm:px-3'} ${frameless ? 'bg-transparent backdrop-blur-0' : 'bg-black/65 backdrop-blur-[2px]'} ${lockContentScroll ? 'items-stretch pt-0' : centered ? 'items-center pt-0' : 'items-end pt-6 sm:pt-8'}`}
      style={{
        bottom: reserveBottomNav ? 'var(--bottom-nav-space, 0px)' : 0,
        paddingBottom: overlayBottomNav ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
      }}
    >
      <div
        className={`game-modal-enter w-full max-w-[520px] ${lockContentScroll ? 'flex h-full min-h-0 max-h-full' : 'max-h-full'}`}
      >
        {frameless ? (
          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>
        ) : (
          <MarkerFrame
            className={`flex h-full w-full min-h-0 flex-col overflow-hidden ${lockContentScroll ? 'max-h-full' : 'max-h-full'}`}
            innerClassName={`${lockContentScroll ? 'flex h-full min-h-0 flex-1 flex-col' : ''} p-0`}
            variant="dark"
          >
            {!hideHeader ? (
              <div className="relative flex items-center justify-between border-b border-[#28ee90] px-4 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#87a55f]">{labels.screen}</p>
                  <h2 className="font-mono text-[18px] font-bold text-[#edf8d9]">{title}</h2>
                </div>
                {headerIcon ? (
                  <img
                    src={headerIcon}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 object-contain opacity-95"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="h-10 rounded-xl border border-[#28ee90] bg-[#121812] px-3 font-mono text-[11px] text-[#d7e8c7] hover:bg-[#192019]"
                >
                  {labels.close}
                </Button>
              </div>
            ) : null}
            <div
              className={`${lockContentScroll ? 'flex h-full min-h-0 flex-1 overflow-hidden' : 'touch-pan-y overflow-y-auto overscroll-y-contain'} [-webkit-overflow-scrolling:touch] ${hideHeader ? 'px-1.5 py-1.5 sm:px-2 sm:py-2' : 'px-3 py-3 sm:px-4 sm:py-4'} ${contentClassName}`}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </MarkerFrame>
        )}
      </div>
    </div>
  );
}

function CampHome({ profile, onOpenTab, onOpenModal, onUpdateProfile, onSyncProfile = null, onAddXp = null, onRefreshProfile = null, readonlyProfile = false, onBackToRanking, cleanupRequested = false, onOpenPlayerProfile = null, activeModal = null, onVoidFlushModeChange = null, chatUnread = false, patchUnread = false }) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <CampView
        profile={profile}
        onOpenTab={onOpenTab}
        onOpenModal={onOpenModal}
        onUpdateProfile={onUpdateProfile}
        onSyncProfile={onSyncProfile}
        onAddXp={onAddXp}
        onRefreshProfile={onRefreshProfile}
        readonlyProfile={readonlyProfile}
        onBackToRanking={onBackToRanking}
        cleanupRequested={cleanupRequested}
        onOpenPlayerProfile={onOpenPlayerProfile}
        activeModal={activeModal}
        onVoidFlushModeChange={onVoidFlushModeChange}
        chatUnread={chatUnread}
        patchUnread={patchUnread}
      />
    </div>
  );
}

export default function Game() {
  const animationsEnabled = useGlobalAnimations();
  return <MotionConfig reducedMotion={animationsEnabled ? 'user' : 'always'} transition={animationsEnabled ? undefined : { duration: 0 }}><GameContent /></MotionConfig>;
}

function GameContent() {
  useEffect(() => {
    const syncVisibility = () => { document.documentElement.dataset.gameHidden = String(document.hidden); };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => { document.removeEventListener('visibilitychange', syncVisibility); delete document.documentElement.dataset.gameHidden; };
  }, []);
  const { profile, user, loading, initError, retryInit, refreshProfile, syncProfile, updateProfile, addXp, spendEnergy, bootProgress, bootStage } = useGameState();
  useClanQuestNotifications(profile,refreshProfile);
  const [activeTab, setActiveTab] = useState(() => import.meta.env.DEV && (new URLSearchParams(window.location.search).get('localBoss') === 'boss7' || new URLSearchParams(window.location.search).get('localShipBoss') === 'hangar') ? 'boss' : 'camp');
  const [mountedCombatTabs, setMountedCombatTabs] = useState(() => ({
    personal: activeTab === 'boss',
    raid: activeTab === 'raidBoss',
  }));
  useEffect(() => {
    if (activeTab !== 'boss' && activeTab !== 'raidBoss') return;
    setMountedCombatTabs(current => activeTab === 'boss'
      ? current.personal ? current : { ...current, personal: true }
      : current.raid ? current : { ...current, raid: true });
  }, [activeTab]);
  const [bottomNavHeight, setBottomNavHeight] = useState(null);
  const [energyPurchaseRequested, setEnergyPurchaseRequested] = useState(false);
  const handleEnergyPurchaseRequestHandled = useCallback(() => setEnergyPurchaseRequested(false), []);
  const [voidFlushActive, setVoidFlushActive] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [casinoInitialTab,setCasinoInitialTab]=useState('roulette');
  const [chatIndicators,setChatIndicators]=useState({clan:{},world:{}});
  const chatUnread=Object.values(chatIndicators).some(value=>value.unread||value.patch);
  const [dailyPanelTab, setDailyPanelTab] = useState('event');
  const [dailyPanelScene, setDailyPanelScene] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);
  const playerProfileReturn = useRef(null);
  const leaderboardViewState = useRef({ activeTab: 'players', scroll: {} });
  const [campSceneKey, setCampSceneKey] = useState(0);
  const [puddleBossWarning, setPuddleBossWarning] = useState(false);
  const [puddleCleanupRequested, setPuddleCleanupRequested] = useState(false);
  const [caRankRewardQueue, setCARankRewardQueue] = useState([]);
  const [claimingCARankReward, setClaimingCARankReward] = useState(false);
  const [caRankRewardClaimError, setCARankRewardClaimError] = useState(false);
  const [joinedBossFight, setJoinedBossFight] = useState(null);

  useEffect(() => {
    if (!profile?.id || loading || viewPlayer) {
      setChatIndicators({clan:{},world:{}});
      return undefined;
    }
    let disposed=false,busy=false;
    const snapshots={};
    const updateReadIndicators=()=>{if(!disposed)setChatIndicators(current=>({...current,...Object.fromEntries(Object.entries(snapshots).map(([channel,messages])=>[channel,getChatIndicators(messages,profile.id,channel)]))}));};
    const pollUnread=async()=>{
      if(busy||document.hidden)return;busy=true;
      try{
        const channels=profile?.clan_id||String(profile?.clan_name||'').trim()?['clan','world']:['world'];
        const results=await Promise.allSettled(channels.map(async channel=>({channel,messages:await listChatMessages(channel,100,{playerId:profile.id,clanId:profile.clan_id||profile.clan_name})})));
        if(disposed)return;
        setChatIndicators(current=>{
          const next={...current};
          for(const result of results)if(result.status==='fulfilled'){const {channel,messages}=result.value;snapshots[channel]=messages;next[channel]=getChatIndicators(messages,profile.id,channel);}
          if(!channels.includes('clan'))next.clan={};
          return next;
        });
      }finally{busy=false;}
    };
    void pollUnread();
    const timer=window.setInterval(pollUnread,10000);
    window.addEventListener(CHAT_READ_EVENT,updateReadIndicators);
    document.addEventListener('visibilitychange',pollUnread);
    return()=>{disposed=true;window.clearInterval(timer);window.removeEventListener(CHAT_READ_EVENT,updateReadIndicators);document.removeEventListener('visibilitychange',pollUnread);};
  },[profile?.id,profile?.clan_id,profile?.clan_name,loading,viewPlayer,activeModal]);

  const handleJoinedBossInvite = (fight) => {
    setJoinedBossFight(fight);
    setActiveModal(null);
    setDailyPanelScene(null);
    setActiveTab('boss');
  };

  useEffect(() => {
    if (!profile?.id || loading) return;
    setCARankRewardQueue(getPendingCARankRewards(profile));
  }, [profile?.id, profile?.stat_strength, profile?.power, profile?.attack_power, profile?.clan_power, profile?.total_boss_damage, profile?.ca_rank_rewards_claimed, loading]);

  const claimCARankMilestoneReward = async () => {
    const rank = caRankRewardQueue[0];
    if (!rank || claimingCARankReward) return;
    setClaimingCARankReward(true);
    setCARankRewardClaimError(false);
    try {
      const result = await updateProfile({ claimCARankReward: { rank } });
      const confirmedRank = Number(result?.claimedCARank ?? result?.ca_rank_rewards_claimed?.find((value) => Number(value) === rank));
      if (confirmedRank !== rank) throw new Error('The server did not confirm this CA rank reward.');
      setCARankRewardQueue((queue) => queue.slice(1));
    } catch (error) {
      console.error('[ca-rank-reward] claim failed', error);
      setCARankRewardClaimError(true);
    } finally {
      setClaimingCARankReward(false);
    }
  };

  useEffect(() => {
    const blockZoomGesture = (event) => event.preventDefault();
    document.addEventListener('gesturestart', blockZoomGesture, { passive: false });
    document.addEventListener('gesturechange', blockZoomGesture, { passive: false });
    document.addEventListener('gestureend', blockZoomGesture, { passive: false });
    document.addEventListener('dblclick', blockZoomGesture, { passive: false });
    return () => {
      document.removeEventListener('gesturestart', blockZoomGesture);
      document.removeEventListener('gesturechange', blockZoomGesture);
      document.removeEventListener('gestureend', blockZoomGesture);
      document.removeEventListener('dblclick', blockZoomGesture);
    };
  }, []);

  // Load panels only on pointer intent or navigation. Parsing every large panel
  // after boot caused long main-thread stalls while the player was interacting.

  const settingsReturnModal = useRef(null);
  const openSettings = () => { loadProfilePanel().catch(() => {}); if (activeModal !== 'profile') settingsReturnModal.current = activeModal; setActiveModal('profile'); };
  const openProfile = () => {
    loadProfilePanel().catch(() => {});
    if (viewPlayer && String(viewPlayer.id) !== String(profile?.id)) {
      setActiveModal('public-profile');
      return;
    }
    void updateProfile({ playerAction: { type: 'newbie-visit', target: 'hero' } }).catch(() => {});
    setActiveModal('profile');
  };
  const openShop = () => { loadShopPanel().catch(() => {}); setActiveTab('shop'); };
  const openEnergyPurchase = () => { loadShopPanel().catch(() => {}); setEnergyPurchaseRequested(true); setActiveTab('shop'); };
  const openMail = () => {
    loadMailPanel().catch(() => {});
    setActiveModal('mail');
    void refreshProfile().catch(() => {});
  };
  const backToEvents = () => {
    setDailyPanelScene(null);
    setDailyPanelTab('event');
    setActiveModal(null);
    setActiveTab('events');
  };
  const openRaidBoss = () => {
    loadBossPanel().catch(() => {});
    setActiveModal(null);
    setDailyPanelScene(null);
    setActiveTab('raidBoss');
  };
  const openSpaceFishing = () => {
    loadDailyPanel().catch(() => {});
    setActiveModal(null);
    setDailyPanelScene(null);
    setActiveTab('fishing');
  };
  const closeModal = () => {
    if(activeModal==='roulette')setCasinoInitialTab('roulette');
    if (activeModal === 'profile' && settingsReturnModal.current) { setActiveModal(settingsReturnModal.current); settingsReturnModal.current = null; return; }
    setActiveModal(null);
    setDailyPanelScene(null);
  };

  const returnToCampHome = () => {
    setActiveModal(null);
    setDailyPanelScene(null);
    setViewPlayer(null);
    setCampSceneKey((key) => key + 1);
    setActiveTab('camp');
  };

  const openPlayerProfile = async (player) => {
    if (!viewPlayer) playerProfileReturn.current = { tab: activeTab, modal: activeModal };
    setActiveModal(null);
    setViewPlayer(player);
    const lookup = player?.username || player?.nickname;
    if (!player?.id && !lookup) return;
    try {
      const matches = await findPlayerProfiles(player?.id ? { id: player.id } : { username: lookup });
      const fullProfile = (matches || []).find((item) => String(item?.id) === String(player?.id));
      if (fullProfile) setViewPlayer((current) => current?.id === player?.id ? { ...current, ...fullProfile } : current);
    } catch {
      // Keep the leaderboard snapshot if the public profile lookup is unavailable.
    }
  };

  const closePlayerProfile = () => {
    const origin = playerProfileReturn.current;
    setViewPlayer(null);
    if (origin) setActiveTab(origin.tab);
    setActiveModal(origin?.modal || null);
    playerProfileReturn.current = null;
  };
  const viewingOwnProfile = Boolean(viewPlayer && profile && String(viewPlayer.id) === String(profile.id));
  const sceneProfile = viewingOwnProfile ? profile : viewPlayer || profile;
  const language = (profile?.language || window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || navigator.language || 'uk').split(/[-_]/)[0];
  const labels = I18N[language] || I18N.uk;
  const puddleWarning = language === 'ru'
    ? {
      title: 'КУДА СОБРАЛСЯ?',
      text: 'Ты весь обоссанный стоишь в луже и уже собрался бить босса?',
      action: '🧽 Мочалку в руки. Сначала вытрись — потом геройствуй.',
      button: 'УБРАТЬСЯ',
    }
    : language === 'en'
      ? {
        title: "WHERE DO YOU THINK YOU'RE GOING?",
        text: "You're standing there covered in piss, in a puddle, and you're already trying to fight the boss?",
        action: '🧽 Grab the sponge. Clean yourself up first — then go play hero.',
        button: 'CLEAN UP',
      }
      : {
        title: 'ТИ КУДИ ЗІБРАВСЯ?',
        text: 'Стоїш весь обісцяний у калюжі й уже зібрався бити боса?',
        action: '🧽 Мочалку в руки. Спочатку витрись — потім геройствуй.',
        button: 'ПРИБРАТИСЯ',
      };
  const puddleSenders = Array.isArray(profile?.puddle_senders) ? profile.puddle_senders : [];
  const puddleSendersLabel = language === 'ru' ? 'КТО ОБОССАЛ' : language === 'en' ? 'WHO PISSED ON YOU' : 'ХТО ОБІСЦЯВ';
  const playerLevel = Math.max(1, Number(profile?.level || 1));
  const unlocks = GAME_CONFIG.CONTENT_UNLOCK_LEVELS || {};
  const criticalAssetUrls = useMemo(
    () => [...new Set([...CRITICAL_ASSET_PATHS, getCampBackgroundById(profile?.selected_camp_background).source])],
    [profile?.selected_camp_background]
  );
  const {
    loadingProgress,
    loadingVisible: loaderVisible,
  } = useStartupLoadingManager({
    loading,
    initError,
    bootstrapReady: bootStage === 'ready' && Boolean(profile?.id),
    bootProgress,
    criticalAssetUrls,
  });
  useEffect(() => {
    if (loaderVisible || loading || !profile?.id || activeTab !== 'camp' || activeModal) return;
    const connection = navigator.connection;
    if (connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) return;
    if (!window.requestIdleCallback) return;
    const tabs = [
      playerLevel >= (unlocks.bossTab || 1) ? 'boss' : 'tasks',
      'tasks', 'skills', 'clan',
    ].filter((tab, index, all) => all.indexOf(tab) === index && !isTabLocked(tab));
    let cancelled = false;
    let idleId;
    const schedule = () => {
      if (cancelled || !tabs.length || document.hidden) return;
      idleId = window.requestIdleCallback(async () => {
        if (cancelled || document.hidden) return;
        await warmTab(tabs.shift());
        schedule();
      });
    };
    schedule();
    return () => {
      cancelled = true;
      window.cancelIdleCallback(idleId);
    };
  }, [loaderVisible, loading, profile?.id, activeTab, activeModal, playerLevel, unlocks.bossTab]);
  useEffect(()=>{
    if(loaderVisible || loading || !profile?.id || !(profile?.clan_id || profile?.clan_name))return;
    const connection=navigator.connection;
    if(connection?.saveData || ['slow-2g','2g'].includes(connection?.effectiveType))return;
    let cancelled=false;
    const timer=setTimeout(async()=>{
      const options=clanOverviewQueries(profile,gameApi,warmSceneImage);
      await Promise.all([queryClientInstance.prefetchQuery(options.members),queryClientInstance.prefetchQuery(options.clan)]);
      if(!cancelled)void queryClientInstance.prefetchQuery(options.raid);
    },500);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[loaderVisible,loading,profile?.id,profile?.clan_id,profile?.clan_name]);

  // A guest preview session sees every tab from the first click — a quick way to look at the
  // whole game (bosses, talents, clans) without grinding through the normal level gates. Writes
  // that would leave a trace in someone else's clan (join/create/chat) stay blocked server-side
  // regardless of this flag — see server/app.js GUEST_CLAN_RESTRICTED. The real unlock levels in
  // GAME_CONFIG.CONTENT_UNLOCK_LEVELS are untouched, so normal progression pacing never changes.
  const previewAllUnlocked = Boolean(profile?.guest_account);
  const isTabLocked = (tabId) => {
    if (previewAllUnlocked) return false;
    if (tabId === 'boss') return playerLevel < (unlocks.bossTab || 1);
    if (tabId === 'skills') return playerLevel < (unlocks.skillsTab || 1);
    if (tabId === 'clan') return playerLevel < (unlocks.clanTab || 1);
    return false;
  };

  const isModalLocked = (modalId) => {
    if (previewAllUnlocked) return false;
    if (modalId === 'daily') return playerLevel < (unlocks.daily || 1);
    if (modalId === 'roulette') return playerLevel < (unlocks.roulette || 1);
    if (modalId === 'equipment') return playerLevel < (unlocks.equipment || 1);
    if (modalId === 'clan') return playerLevel < (unlocks.clanTab || 1);
    if (modalId === 'chat') return false;
    return false;
  };

  const guardedSetActiveTab = (nextTab) => {
    if (viewPlayer) {
      setViewPlayer(null);
      setActiveTab(nextTab);
      return;
    }
    if (isTabLocked(nextTab)) return;
    warmTab(nextTab);
    if (nextTab === 'boss' && profile?.puddle_active) {
      setPuddleBossWarning(true);
      return;
    }
    if (nextTab === 'boss') {
      void updateProfile({ playerAction: { type: 'newbie-visit', target: 'boss' } }).catch(() => {});
    }
    setActiveTab(nextTab);
  };
  const guardedSetActiveModal = (nextModal) => {
    if (isModalLocked(nextModal)) return;
    MODAL_LOADERS[nextModal]?.().then(panel => panel.warmFirstFrame?.()).catch(() => {});
    if (nextModal === 'events') {
      backToEvents();
      return;
    }
    setActiveModal(nextModal);
  };
  const handleDailyGoToTask = (task) => {
    const newbieQuestId = Number(task?.newbieQuestId || 0);
    if (newbieQuestId === 3) {
      void updateProfile({ playerAction: { type: 'newbie-visit', target: 'hero' } }).catch(() => {});
      setActiveModal(null);
      setViewPlayer(null);
      guardedSetActiveTab('camp');
      return;
    }
    if ([4, 5].includes(newbieQuestId)) {
      setActiveModal(null);
      setViewPlayer(null);
      guardedSetActiveTab('tasks');
      return;
    }
    if (newbieQuestId >= 6 && newbieQuestId <= 15) {
      setActiveModal(null);
      setViewPlayer(null);
      guardedSetActiveTab('boss');
      return;
    }
    if (newbieQuestId === 16) {
      setActiveModal('roulette');
      return;
    }
    if ([18, 19].includes(newbieQuestId)) {
      setActiveModal(null);
      setViewPlayer(null);
      guardedSetActiveTab('skills');
      return;
    }
    if (task?.baseId === 'catchFish') {
      setActiveModal(null);
      setViewPlayer(null);
      openSpaceFishing();
      return;
    }
    const raidRelated = new Set(['raidBoss']);
    const bossRelated = new Set(['bossHits', 'bossDamage', 'poisonUse', 'boxes']);
    if (raidRelated.has(task?.baseId)) {
      setViewPlayer(null);
      openRaidBoss();
      return;
    }
    const targetTab = bossRelated.has(task?.baseId) ? 'boss' : 'tasks';
    setDailyPanelTab('event');
    setDailyPanelScene(null);
    setActiveModal(null);
    setViewPlayer(null);
    guardedSetActiveTab(targetTab);
  };

  if (initError) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1b2516_0%,#0a0f0b_58%,#050605_100%)] px-6" style={{ height: 'var(--tg-viewport-height, 100dvh)' }}>
        <div className="max-w-sm rounded-[14px] border border-[#28ee90] bg-[#10140f] p-5 text-center">
          <p className="font-mono text-[18px] font-bold text-[#edf8d9]">{labels.profileFailTitle}</p>
          <p className="mt-2 font-mono text-[11px] text-[#9cb087]">
            {labels.profileFailText}
          </p>
          <GameTextureButton
            type="button"
            onClick={() => retryInit()}
            disabled={loading}
            className="mt-4 h-11 w-full font-mono text-[12px] font-black uppercase text-[#172016] disabled:opacity-60"
          >
            <span className="relative z-10 text-[#172016]">{loading ? labels.loading : labels.retry}</span>
          </GameTextureButton>
        </div>
      </div>
    );
  }

  const renderPlayerScene = () => {
    if (viewPlayer) {
      return (
          <CampHome
            profile={sceneProfile}
            onSyncProfile={syncProfile}
            onOpenTab={guardedSetActiveTab}
            onOpenModal={guardedSetActiveModal}
            onUpdateProfile={updateProfile}
            onAddXp={addXp}
            onRefreshProfile={refreshProfile}
            readonlyProfile={!viewingOwnProfile}
            onBackToRanking={closePlayerProfile}
            onOpenPlayerProfile={openPlayerProfile}
            activeModal={activeModal}
          />
      );
    }

    return null;
  };
  const renderMainTab = () => {
    switch (activeTab) {
      case 'market':
        return <MarketPanel profile={profile} onSyncProfile={syncProfile} />;
      case 'boss':
        if (isTabLocked('boss')) return <CampHome profile={profile} onOpenTab={guardedSetActiveTab} onOpenModal={guardedSetActiveModal} onUpdateProfile={updateProfile} onSyncProfile={syncProfile} onAddXp={addXp} onRefreshProfile={refreshProfile} activeModal={activeModal} patchUnread={chatIndicators.world.patch} chatUnread={chatUnread} />;
        return null;
      case 'raidBoss':
        return null;
      case 'events':
        return <DailyPanel onSyncProfile={syncProfile} key="events-list" suspended={activeModal === 'profile'} profile={profile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={returnToCampHome} onGoToTask={handleDailyGoToTask} onOpenRaidBoss={openRaidBoss} onOpenSpaceFishing={openSpaceFishing} panelMode="events" initialEventScene={null} />;
      case 'fishing':
        return <DailyPanel onSyncProfile={syncProfile} suspended={activeModal === 'profile'} profile={profile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={() => guardedSetActiveTab('camp')} onGoToTask={handleDailyGoToTask} onOpenRaidBoss={openRaidBoss} onOpenSpaceFishing={openSpaceFishing} onBackToEvents={backToEvents} panelMode="events" initialEventScene="space-fishing" />;
      case 'tasks':
        return <TasksPanel profile={profile} onSpendEnergy={spendEnergy} onUpdateProfile={updateProfile} onAddXp={addXp} onSyncProfile={syncProfile} onRefreshProfile={refreshProfile} />;
      case 'skills':
        if (isTabLocked('skills')) return <CampHome profile={profile} onOpenTab={guardedSetActiveTab} onOpenModal={guardedSetActiveModal} onUpdateProfile={updateProfile} onAddXp={addXp} onRefreshProfile={refreshProfile} activeModal={activeModal} patchUnread={chatIndicators.world.patch} chatUnread={chatUnread} />;
        return <SkillsPanel profile={profile} onUpdateProfile={updateProfile} onGoQuests={() => guardedSetActiveTab('tasks')} onOpenShop={() => guardedSetActiveTab('shop')} />;
      case 'raid':
        return <RaidPanel profile={profile} user={user} onAddXp={addXp} onRefreshProfile={refreshProfile} />;
      case 'shop':
        return <ShopPanel profile={profile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} energyPurchaseRequested={energyPurchaseRequested} onEnergyPurchaseRequestHandled={handleEnergyPurchaseRequestHandled} />;
      case 'clan':
        if (isTabLocked('clan')) return <CampHome profile={profile} onOpenTab={guardedSetActiveTab} onOpenModal={guardedSetActiveModal} onUpdateProfile={updateProfile} onAddXp={addXp} onRefreshProfile={refreshProfile} activeModal={activeModal} patchUnread={chatIndicators.world.patch} chatUnread={chatUnread} />;
        return <ClanPanel onSyncProfile={syncProfile} onNavigate={tab=>{closeModal();guardedSetActiveTab(tab);}} profile={profile} onOpenChat={() => guardedSetActiveModal('chat')} onOpenPlayerProfile={openPlayerProfile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={() => guardedSetActiveTab('camp')} />;
      case 'camp':
      default:
        return <CampHome key={campSceneKey} profile={profile} onOpenTab={guardedSetActiveTab} onOpenModal={guardedSetActiveModal} onUpdateProfile={updateProfile} onSyncProfile={syncProfile} onAddXp={addXp} onRefreshProfile={refreshProfile} cleanupRequested={puddleCleanupRequested} onOpenPlayerProfile={openPlayerProfile} activeModal={activeModal} onVoidFlushModeChange={setVoidFlushActive} patchUnread={chatIndicators.world.patch} chatUnread={chatUnread} />;
    }
  };

  const renderModalContent = (modal = activeModal) => {
    switch (modal) {
      case 'daily':
        if (isModalLocked('daily')) return null;
        return <DailyPanel onSyncProfile={syncProfile} suspended={activeModal === 'profile'} profile={profile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={closeModal} onGoToTask={handleDailyGoToTask} initialTab={dailyPanelTab} initialEventScene={dailyPanelScene} />;
      case 'events':
        return <DailyPanel onSyncProfile={syncProfile} suspended={activeModal === 'profile'} profile={profile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={closeModal} onGoToTask={handleDailyGoToTask} onOpenRaidBoss={openRaidBoss} onOpenSpaceFishing={openSpaceFishing} onBackToEvents={backToEvents} panelMode="events" initialTab={dailyPanelTab} initialEventScene={dailyPanelScene} />;
      case 'public-profile':
        return viewPlayer ? <PublicPlayerProfile profile={sceneProfile} language={language} onClose={closeModal} onGoHome={returnToCampHome} /> : null;
      case 'profile':
        return <ProfilePanel profile={profile} user={user} onClose={closeModal} onUpdateProfile={updateProfile} onSyncProfile={syncProfile} />;
      case 'leaderboard':
        return <LeaderboardPanel profile={profile} viewStateRef={leaderboardViewState} onOpenPlayerProfile={openPlayerProfile} onClose={closeModal} />;
      case 'equipment':
        if (isModalLocked('equipment')) return null;
        return <EquipmentPanel profile={profile} onClose={closeModal} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} />;
      case 'clan':
        if (isModalLocked('clan')) return null;
        return <ClanPanel onSyncProfile={syncProfile} onNavigate={tab=>{closeModal();guardedSetActiveTab(tab);}} profile={profile} onOpenChat={() => guardedSetActiveModal('chat')} onOpenPlayerProfile={openPlayerProfile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={closeModal} />;
      case 'chat':
        if (isModalLocked('chat')) return null;
        return <ChatPanel indicators={chatIndicators} profile={profile} onNavigate={tab=>{closeModal();guardedSetActiveTab(tab);}} onClose={closeModal} onRefreshProfile={refreshProfile} onJoinBossInvite={handleJoinedBossInvite} />;
      case 'roulette':
        if (isModalLocked('roulette')) return null;
        return <RoulettePanel onSyncProfile={syncProfile} initialTab={casinoInitialTab} suspended={activeModal === 'profile'} profile={profile} onUpdateProfile={updateProfile} onClose={closeModal} />;
      case 'mail':
        return <MailPanel profile={profile} onSyncProfile={syncProfile} onUpdateProfile={updateProfile} onRefreshProfile={refreshProfile} onClose={closeModal} />;
      case 'pvp':
        return <PvpPanel profile={profile} onClose={closeModal} onSyncProfile={syncProfile} />;
      case 'backgrounds':
        return <BackgroundPanel profile={profile} onUpdateProfile={updateProfile} />;
      default:
        return null;
    }
  };

  const isCampTab = activeTab === 'camp';
  const isWebWorld = false;
  const isBossTab = activeTab === 'boss' || activeTab === 'raidBoss' || activeTab === 'fishing';
  const isFishingScene = activeTab === 'fishing';
  const isSkillsTab = activeTab === 'skills';
  const isTasksTab = activeTab === 'tasks';
  const isPlayerScene = Boolean(viewPlayer);
  // Never render the shell of a modal the player cannot open yet: its empty body would block every click.
  const profileModal = activeModal && isModalLocked(activeModal) ? null : activeModal;
  const topBarMode = isPlayerScene ? 'full' : voidFlushActive ? 'compact' : (isCampTab && (!activeModal || activeModal === 'mail')) ? 'full' : 'compact';
  const bottomNavSpace = bottomNavHeight === null ? 'calc(clamp(66px, 18vw, 92px) + 12px)' : `${bottomNavHeight}px`;
  const loadingPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('loadingPreview') === '1';
  const showLoadingOverlay = loadingPreview || (!initError && (loaderVisible || loading || !profile?.id || bootStage !== 'ready'));
  const displayedLoadingProgress = loadingPreview ? 72 : loadingProgress;
  const portraitCopy = profile?.language === 'ru'
    ? { title: 'НЕПРАВИЛЬНАЯ ОРИЕНТАЦИЯ', subtitle: 'NUVELOR РАБОТАЕТ ТОЛЬКО В ВЕРТИКАЛЬНОМ РЕЖИМЕ', action: '↕ ПОВЕРНИТЕ ТЕЛЕФОН ВЕРТИКАЛЬНО' }
    : profile?.language === 'en'
      ? { title: 'WRONG ORIENTATION', subtitle: 'NUVELOR PLAYS ONLY IN PORTRAIT', action: '↕ ROTATE YOUR PHONE UPRIGHT' }
      : { title: 'НЕПРАВИЛЬНА ОРІЄНТАЦІЯ', subtitle: 'NUVELOR ПРАЦЮЄ ЛИШЕ У ВЕРТИКАЛЬНОМУ РЕЖИМІ', action: '↕ ПОВЕРНІТЬ ТЕЛЕФОН ВЕРТИКАЛЬНО' };

  return (
    <ViewerLanguageContext.Provider value={profile?.language || 'en'}>
    <RaidRewardReceipt profile={profile} automatic />
    <AchievementClaimContext.Provider value={{ profile, equipHeader: theme => updateProfile({ equipProfileHeaderTheme: theme }), claim: async id => { const result = await claimAchievement(id); syncProfile(result.player); return result; } }}>
    <div
      data-screen={activeModal || activeTab}
      data-modal-open={Boolean(activeModal)}
      className="game-app min-h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top,#23341a_0%,#0e120d_42%,#050605_100%)] text-white"
      onContextMenu={(event) => {
        if (!event.target.closest('input, textarea, select, [contenteditable="true"]')) event.preventDefault();
      }}
      onDragStart={(event) => {
        if (!event.target.closest('input, textarea, select, [contenteditable="true"]')) event.preventDefault();
      }}
      style={{
        height: 'var(--app-viewport-height, 100dvh)',
        paddingTop: isWebWorld ? '0px' : 'var(--app-top-offset, var(--app-safe-top, 0px))',
        paddingBottom: showLoadingOverlay || isWebWorld ? '0px' : 'var(--app-safe-bottom, 0px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <DesktopSpaceBackdrop/>
      {!loading && profile?.id && <RetentionTelemetry playerId={profile.id} screen={activeModal || activeTab} />}
      <CardGameDailyTrigger playerId={profile?.id} ready={!isModalLocked('roulette')&&!loading&&!showLoadingOverlay&&bootStage==='ready'&&activeTab==='camp'&&!activeModal&&!viewPlayer&&!voidFlushActive&&!puddleBossWarning&&!caRankRewardQueue.length&&!isNewbieTutorialActive(profile)&&Boolean(profile?.update_notices?.['ship-forge-v1'])} onOpen={()=>{if(isModalLocked('roulette'))return;setCasinoInitialTab('cards');setActiveModal('roulette');}} />
      <AchievementNotifications profile={profile} ready={!loading && !showLoadingOverlay && !activeModal && !caRankRewardQueue.length} />
      {!loading && !showLoadingOverlay && profile?.id ? <JudgeTour profile={profile} onOpenMarket={() => guardedSetActiveTab('market')} onOpenProfile={openSettings} /> : null}
      <Suspense fallback={null}><ShipUpdateWelcome key={profile?.id} profile={profile} ready={!loading&&!showLoadingOverlay&&bootStage==='ready'&&activeTab==='camp'&&!activeModal&&!viewPlayer&&!voidFlushActive&&!puddleBossWarning&&!caRankRewardQueue.length&&!isNewbieTutorialActive(profile)} onRead={()=>updateProfile({playerAction:{type:'update-notice-read',noticeId:'ship-forge-v1'}})}/></Suspense>
      <Suspense fallback={null}><HalloweenWelcome key={profile?.id} profile={profile} ready={Boolean(profile?.update_notices?.['ship-forge-v1']) && !loading && !showLoadingOverlay && bootStage === 'ready' && activeTab === 'camp' && !activeModal && !viewPlayer && !voidFlushActive && !puddleBossWarning && !caRankRewardQueue.length && !isNewbieTutorialActive(profile)} onEnter={() => window.dispatchEvent(new Event('open-halloween-event'))} /></Suspense>
      <div className={`game-shell ${isWebWorld ? 'web-world-shell' : ''} ui-uppercase relative mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col overflow-hidden border-x border-[#1e2418] bg-[linear-gradient(180deg,rgba(9,12,9,0.96)_0%,rgba(5,6,5,0.985)_100%)] shadow-[0_0_70px_rgba(0,0,0,0.55)]`} style={{ '--bottom-nav-space': isWebWorld ? '0px' : bottomNavSpace, ...(isWebWorld ? {maxWidth:'none',border:0} : {}) }}>
        {!isFishingScene && !isWebWorld ? <TopBar mode={topBarMode} profile={sceneProfile} resourceProfile={profile} onOpenShop={openShop} onOpenEnergyPurchase={openEnergyPurchase} onOpenSettings={openSettings} onOpenProfile={openProfile} onOpenMail={openMail} hideActions={Boolean(viewPlayer)} showSettings /> : null}

        <div className="relative min-h-0 flex-1 overflow-hidden overflow-x-hidden" style={{ '--bottom-nav-space': bottomNavSpace }}>
          <div
            style={{
              ...(!isWebWorld && !isCampTab && !isTasksTab && (!isBossTab || activeTab === 'fishing') && !isPlayerScene ? { paddingBottom: bottomNavSpace } : {}),
              WebkitOverflowScrolling: 'touch',
              display: viewPlayer ? 'none' : undefined,
            }}
            className={
              isPlayerScene
                ? 'h-full min-h-0 overflow-hidden'
                : isCampTab
                  ? 'h-full min-h-0'
                  : isBossTab || isTasksTab
                    ? 'h-full overflow-hidden px-0 pb-0 pt-0'
                    : isSkillsTab
                      ? 'h-full min-h-0 touch-pan-y overflow-hidden px-2 pt-2 sm:px-3 sm:pt-3'
                      : 'h-full min-h-0 touch-pan-y overflow-y-auto overscroll-y-contain px-2 pt-2 sm:px-3 sm:pt-3 [-webkit-overflow-scrolling:touch]'
            }
          >
            <Suspense fallback={activeTab==='boss'?null:<PanelLoading />}>
              {!viewPlayer && (mountedCombatTabs.personal || activeTab==='boss') ? <div className="h-full min-h-0" style={{display:activeTab==='boss'?'block':'none'}}>
                <BossPanel key="personal-boss" suspended={activeTab!=='boss'} onNavigate={guardedSetActiveTab} profile={profile} onAddXp={addXp} onRefreshProfile={refreshProfile} onUpdateProfile={updateProfile} onSyncProfile={syncProfile} onOpenPlayerProfile={openPlayerProfile} onOpenClan={() => guardedSetActiveTab('clan')} suppressLootModal={activeModal === 'mail'} joinedBossFight={joinedBossFight} onJoinedBossFightConsumed={id=>setJoinedBossFight(current=>current?.id===id?null:current)} />
              </div> : null}
              {!viewPlayer && (mountedCombatTabs.raid || activeTab==='raidBoss') ? <div className="h-full min-h-0" style={{display:activeTab==='raidBoss'?'block':'none'}}>
                <BossPanel key="raid-boss" suspended={activeTab!=='raidBoss'} profile={profile} onAddXp={addXp} onRefreshProfile={refreshProfile} onUpdateProfile={updateProfile} onSyncProfile={syncProfile} onOpenPlayerProfile={openPlayerProfile} onBackToEvents={backToEvents} raidMode />
              </div> : null}
              {!viewPlayer && activeTab!=='boss' && activeTab!=='raidBoss' ? renderMainTab() : null}
            </Suspense>
          </div>

          {viewPlayer ? <div className="absolute inset-0 z-30 h-full min-h-0 overflow-hidden"><Suspense fallback={<PanelLoading />}>{renderPlayerScene()}</Suspense></div> : null}

          {profileModal && (<div style={{ display: viewPlayer && !activeModal ? 'none' : undefined }}>
              <ModalShell
                title={labels.modalTitles[profileModal] || I18N.uk.modalTitles[profileModal]}
                labels={labels}
                onClose={closeModal}
                headerIcon={profileModal === 'mail' ? inboxIcon : null}
                hideHeader={profileModal === 'public-profile' || profileModal === 'equipment' || profileModal === 'chat' || profileModal === 'leaderboard' || profileModal === 'profile' || profileModal === 'daily' || profileModal === 'events' || profileModal === 'roulette' || profileModal === 'mail' || profileModal === 'pvp'}
                fullscreen={profileModal === 'chat' || profileModal === 'daily' || profileModal === 'roulette' || profileModal === 'pvp'}
                coverNavigation={profileModal === 'leaderboard' || profileModal === 'profile' || profileModal === 'roulette' || profileModal === 'pvp'}
                lockContentScroll={profileModal === 'public-profile' || profileModal === 'chat' || profileModal === 'leaderboard' || profileModal === 'profile' || profileModal === 'daily' || profileModal === 'events' || profileModal === 'roulette' || profileModal === 'pvp'}
                frameless={profileModal === 'public-profile' || profileModal === 'chat' || profileModal === 'profile' || profileModal === 'roulette' || profileModal === 'mail' || profileModal === 'pvp'}
                centered={profileModal === 'mail'}
                dismissOnBackdrop={profileModal === 'mail'}
                overlayBottomNav={profileModal === 'pvp'}
                reserveBottomNav={profileModal !== 'chat' && profileModal !== 'leaderboard' && profileModal !== 'daily' && profileModal !== 'profile' && profileModal !== 'roulette' && profileModal !== 'pvp'}
                contentClassName={profileModal === 'chat' ? 'px-0 py-0 sm:px-0 sm:py-0' : profileModal === 'daily' || profileModal === 'roulette' || profileModal === 'pvp' ? 'px-0 py-0 sm:px-0 sm:py-0' : ''}
              >
                <Suspense fallback={<PanelLoading />}>
                  {<><div className="h-full min-h-0 w-full min-w-0 flex-1" style={{ display: profileModal === 'profile' ? 'none' : undefined }} key={profileModal === 'profile' ? settingsReturnModal.current : profileModal}>{renderModalContent(profileModal === 'profile' ? settingsReturnModal.current : profileModal)}</div>{profileModal === 'profile' ? renderModalContent('profile') : null}</>}
                </Suspense>
              </ModalShell></div>
            )}

          {puddleBossWarning ? (
            <ModalShell title="" labels={labels} onClose={() => setPuddleBossWarning(false)} centered hideHeader>
              <div className="reaction-modal-background reaction-modal-background--dislikes relative flex flex-col gap-4 px-3 py-5">
                <button type="button" aria-label={labels.close} onClick={() => setPuddleBossWarning(false)} className="absolute right-2 top-2 h-8 w-8 font-mono text-[25px] leading-none text-[#d8f67a] transition hover:text-white">×</button>
                <div className="pr-9">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[.14em] text-[#88a560]">ЕКРАН</p>
                  <h2 className="mt-1 font-mono text-[18px] font-black text-[#edf8d9]">{puddleWarning.title}</h2>
                </div>
                <div className="grid grid-cols-[minmax(0,3fr)_minmax(72px,1fr)] items-center gap-2">
                  <div className="font-mono text-[13px] font-black leading-relaxed text-[#fff2bd]">
                    <p>{puddleWarning.text}</p>
                    <p className="mt-3 text-[#d8f67a]">{puddleWarning.action}</p>
                  </div>
                  <img src={puddleSponge} alt="" className="w-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,.45)]" />
                </div>
                {puddleSenders.length ? <div className="max-h-[118px] overflow-y-auto bg-black/10 px-1"><p className="px-1 py-1 font-mono text-[9px] font-black uppercase text-[#91b969]">{puddleSendersLabel} · {puddleSenders.length}</p>{puddleSenders.map((entry, index) => <button type="button" onClick={() => { setPuddleBossWarning(false); openPlayerProfile({ id: entry.sender_id, username: entry.sender_name, avatar: entry.avatar, avatar_frame_id: entry.avatar_frame_id }); }} key={`${entry.sender_id}-${index}`} className="flex w-full items-center gap-2 border-t border-[#28ee90]/15 px-2 py-1.5 text-left transition hover:bg-[#183016]/45"><span className="font-mono text-[10px] font-black text-[#8eb26c]">#{index + 1}</span><AvatarWithFrame src={entry.avatar} frameId={entry.avatar_frame_id} className="h-7 w-7 shrink-0" paddingClassName="p-[2px]" /><span className="min-w-0 truncate font-mono text-[11px] font-black text-[#e8f4d5]">{entry.sender_name || 'Player'}</span></button>)}</div> : null}
                <Button type="button" onClick={() => { setPuddleBossWarning(false); setPuddleCleanupRequested(true); returnToCampHome(); }} className="min-w-[190px] border border-[#5c800b] bg-[linear-gradient(180deg,#b9ed45_0%,#6c9d13_100%)] font-mono text-[12px] font-black text-[#132008] shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_3px_0_#3f5c0c] hover:brightness-110">{puddleWarning.button}</Button>
              </div>
            </ModalShell>
          ) : null}

          {!loading && !showLoadingOverlay && bootStage === 'ready' && !viewPlayer && !isNewbieTutorialActive(profile) && (caRankRewardQueue.length || (!profile?.update_notices?.['ca-rank-backfill-v1'] && profile?.ca_rank_backfill_notice?.length)) ? (
            <ModalShell title="" labels={labels} centered hideHeader frameless>
              {(() => {
                const credited = !caRankRewardQueue.length;
                const creditedRanks = profile.ca_rank_backfill_notice || [];
                const rankNumber = credited ? creditedRanks.at(-1) : caRankRewardQueue[0];
                const rank = getCARankProgress(getPlayerCA(profile)).current;
                const milestoneRank = CA_RANKS.find((entry) => entry.rank === rankNumber) || rank;
                const reward = credited ? creditedRanks.reduce((total, number) => {
                  for (const [key, amount] of Object.entries(getCARankReward(number) || {})) total[key] = (total[key] || 0) + amount;
                  return total;
                }, {}) : getCARankReward(rankNumber);
                const rankIcon = getCARankIcon(milestoneRank);
                const rankNames = milestoneRank?.names || {};
                const rankName = rankNames[language === 'uk' ? 'ua' : language] || rankNames.ua || rankNames.en || milestoneRank?.id || '';
                const rankProgress = getCARankProgress(getPlayerCA(profile));
                const progressPercent = rankProgress.next ? rankProgress.progress * 100 : 100;
                const copy = language === 'en'
                  ? { title: 'CA RANK UNLOCKED!', claim: 'CLAIM', items: ['Tentacles', 'Energy', 'Small poison', 'Medium poison', 'Large poison', 'Spins'], progress: 'PROGRESS TO NEXT RANK', max: 'MAX RANK' }
                  : language === 'ru'
                    ? { title: 'НОВЫЙ РАНГ CA!', claim: 'ЗАБРАТЬ', items: ['Щупальца', 'Энергия', 'Малый яд', 'Средний яд', 'Большой яд', 'Спины'], progress: 'ДО СЛЕДУЮЩЕГО РАНГА', max: 'МАКС. РАНГ' }
                    : { title: 'НОВИЙ РАНГ CA!', claim: 'ЗАБРАТИ', items: ['Щупальця', 'Енергія', 'Малий яд', 'Середній яд', 'Великий яд', 'Спіни'], progress: 'ДО НАСТУПНОГО РАНГУ', max: 'МАКС. РАНГ' };
                const items = [
                  ['tentacles', reward.tentacles], ['energy', reward.energy], ['small-poison', reward.smallPoison],
                  ['medium-poison', reward.mediumPoison], ['large-poison', reward.largePoison], ['spins', reward.spins],
                ].filter(([, amount]) => Number(amount) > 0);
                return <div className="mx-auto w-full max-w-[390px] border border-[#28ee90] bg-[#060b07f5] p-3 text-center shadow-[0_0_0_3px_#08180f,0_24px_90px_#000b]">
                  <h2 className="font-mono text-[13px] font-black tracking-[.12em] text-[#dfff82]">{credited ? ({ru:"НАГРАДЫ ЗА РАНГИ CA УЖЕ НАЧИСЛЕНЫ",en:"CA RANK REWARDS ALREADY CREDITED"}[language] || "НАГОРОДИ ЗА РАНГИ CA ВЖЕ НАРАХОВАНО") : copy.title}</h2>
                  <div className="mx-auto flex h-[168px] max-w-[310px] items-center justify-center">
                    {rankIcon ? <div className="relative grid h-[164px] w-[164px] place-items-center">
                      <span aria-hidden="true" className="battle-pass-icon-glow" />
                      <span aria-hidden="true" className="battle-pass-icon-rays" />
                      <img src={rankIcon} alt={rankName} className="relative z-[1] h-full w-full object-contain drop-shadow-[0_0_18px_rgba(255,210,50,.38)]" />
                    </div> : null}
                  </div>
                  <p className="-mt-1 font-mono text-[12px] font-black uppercase text-[#fff4d4]">{credited ? "CA " + creditedRanks.join(", ") : rankName}</p>
                  <div className="mx-auto mt-2 max-w-[300px] text-left">
                    <div className="mb-1 flex justify-between gap-2 font-mono text-[8px] font-black uppercase text-[#a9c584]"><span>{copy.progress}</span><span>{rankProgress.next ? `${getPlayerCA(profile).toLocaleString('en-US')} / ${rankProgress.next.minCA.toLocaleString('en-US')} CA` : copy.max}</span></div>
                    <div className="h-2 overflow-hidden rounded-full border border-[#86a93b] bg-[#10170d]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#7fbd21,#dfff61)] transition-[width]" style={{ width: `${progressPercent}%` }} /></div>
                    {rankProgress.next ? <p className="mt-1 text-right font-mono text-[8px] font-black uppercase text-[#7f9b5e]">{rankProgress.next.names?.[language === 'uk' ? 'ua' : language] || rankProgress.next.names?.ua}</p> : null}
                  </div>
                  <div className="mx-auto mt-3 grid w-fit max-w-full gap-x-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
                    {items.map(([type, amount]) => <div key={type} className="flex min-w-0 flex-col items-center">
                      <img src={getResourceIcon(type)} alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
                      <small className="min-h-[20px] break-words font-mono text-[7px] font-black uppercase leading-[1.05] text-[#98ba70]">{copy.items[['tentacles', 'energy', 'small-poison', 'medium-poison', 'large-poison', 'spins'].indexOf(type)]}</small>
                      <strong className="whitespace-nowrap font-mono text-[clamp(9px,3.1vw,14px)] font-black text-[#dfff82]">×{Number(amount).toLocaleString('en-US')}</strong>
                    </div>)}
                  </div>
                  <GameTextureButton type="button" disabled={claimingCARankReward} onClick={credited ? async () => {
                    setClaimingCARankReward(true);
                    setCARankRewardClaimError(false);
                    try { await updateProfile({ playerAction: {type:'update-notice-read',noticeId:'ca-rank-backfill-v1'} }); }
                    catch { setCARankRewardClaimError(true); }
                    finally { setClaimingCARankReward(false); }
                  } : claimCARankMilestoneReward} className="mx-auto mt-3 h-12 w-[min(100%,240px)]">
                    <span className="relative z-10 font-mono text-[12px] font-black uppercase text-[#17220e]">{claimingCARankReward ? '…' : credited ? 'OK' : copy.claim}</span>
                  </GameTextureButton>
                  {caRankRewardClaimError ? <p role="alert" className="mt-2 font-mono text-[10px] font-bold text-[#ff8b78]">{language === 'en' ? 'Reward not confirmed. Check connection or update the server.' : language === 'ru' ? 'Награда не подтверждена. Проверьте соединение или обновите сервер.' : 'Нагороду не підтверджено. Перевірте з’єднання або оновіть сервер.'}</p> : null}
                </div>;
              })()}
            </ModalShell>
          ) : null}

          {!loading && !showLoadingOverlay && bootStage === 'ready' && profile?.id && !viewPlayer && !puddleBossWarning ? <LocalTesterTutorial key={`local-tutorial-${profile.id}`} profile={profile} activeTab={activeTab} activeModal={activeModal} onUpdateProfile={updateProfile} onNavigateTab={guardedSetActiveTab} onOpenModal={guardedSetActiveModal} /> : null}

          <div id="game-window-root" className="pointer-events-none absolute inset-x-0 top-0 z-40" style={{ bottom: bottomNavSpace }} />

          {!isPlayerScene ? <style>{'html[data-void-flush-scene="true"] .void-flush-bottom-nav, .game-shell:has([data-halloween-scene="true"]) .void-flush-bottom-nav { display: none !important; }'}</style> : null}
          <div className="void-flush-bottom-nav">{!isWebWorld && (!voidFlushActive || isPlayerScene) ? <BottomNav
            onHeightChange={setBottomNavHeight}
            onTabIntent={warmTab}
            activeTab={activeTab}
            lightBlur={isCampTab && !viewPlayer && !activeModal}
            language={profile?.language || 'uk'}
            lockedTabs={{
              boss: isTabLocked('boss'),
              skills: isTabLocked('skills'),
              clan: isTabLocked('clan'),
            }}
            lockedTabLevels={{
              boss: unlocks.bossTab || 1,
              skills: unlocks.skillsTab || 1,
              clan: unlocks.clanTab || 1,
            }}
            onTabChange={(nextTab) => {
              if (nextTab === 'camp') {
                returnToCampHome();
                return;
              }
              setActiveModal(null);
              setViewPlayer(null);
              guardedSetActiveTab(nextTab);
            }}
          /> : null}</div>
        </div>
        <LoadingOverlay progress={displayedLoadingProgress} visible={showLoadingOverlay} />
      </div>
      <div className="portrait-only-overlay" role="alert" aria-live="assertive" style={isWebWorld ? {display:'none'} : undefined}>
        <span className="text-[28px]">⚠</span>
        <strong>{portraitCopy.title}</strong>
        <span>{portraitCopy.subtitle}</span>
        <span className="mt-3 text-[#d5f58c]">{portraitCopy.action}</span>
      </div>
    </div>
    </AchievementClaimContext.Provider>
    </ViewerLanguageContext.Provider>
  );
}

