import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { calculateEnergy } from '@/lib/gameConfig';
import { seedProfileFromAuth, mergeSavedProfile } from '@/lib/profileSnapshots';
import i18n from '@/i18n';
import { useAuth } from '@/lib/AuthContext';
import { platformConfig } from '@/lib/platform/config';
import { getGameBootstrap } from '@/services/authApi';
import { findPlayerProfiles, updatePlayerProfile } from '@/services/gameApi';
import { getXpForLevel } from '@/lib/gameConfig';
import headIcon from '@/assets/hero/eq-icons/head-icon.png';
import armorIcon from '@/assets/hero/eq-icons/armor-icon.png';
import handsIcon from '@/assets/hero/eq-icons/hands-icon.png';
import trousersIcon from '@/assets/hero/eq-icons/legs-icon.png';
import bootsIcon from '@/assets/hero/eq-icons/boots-icon.png';
import weaponIcon from '@/assets/hero/eq-icons/weapon-icon.png';
import pet1Icon from '@/assets/hero/eq-icons/pet-1.png';
import pet2Icon from '@/assets/hero/eq-icons/pet-2.png';
import newbieSoulArt from '@/assets/hero/newbie-soul.png';
import newbieSoulIcon from '@/assets/hero/pet-newbie-soul-ico.png';
import pet4Icon from '@/assets/hero/eq-icons/pet-4.png';
import pet1Full from '@/assets/hero/pet-1-full.png';
import pet2Full from '@/assets/hero/pet-2-full.png';
import pet4Full from '@/assets/hero/pet-4-full.png';
import { clearLocalTesterTutorialState, getLocalTesterResetUpdates, isLocalTesterProfile } from '@/lib/localTesterReset';
import { DEFAULT_EQUIPMENT_ITEMS, SET4_SET_ID } from './equipmentData';

function consumeBootstrapCache() {
  if (typeof window === 'undefined') return null;
  const cached = window.__tgBootstrapPayload || null;
  window.__tgBootstrapPayload = null;
  return cached;
}

function setBootDebug(patch = {}) {
  if (typeof window === 'undefined') return;
  const current = window.__tgBootDebug || {};
  window.__tgBootDebug = { ...current, ...patch };
}

const DEV_PREVIEW_BOOST = {
  tentacles: 50000,
  premium: 5000,
  energy: 100,
  max_energy: 100,
  keycards: {
    beach: 100,
    factory: 100,
    oilrig: 100,
    prison: 100,
  },
  collection_boxes: {
    beach: 100,
    factory: 100,
    oilrig: 100,
    prison: 100,
  },
  inventory_items: [
    {
      id: 'gear-cardblade',
      type: 'equipment',
      slot: 'weapon',
      name: 'Cardblade',
      icon: weaponIcon,
      attack: 38,
      hp: 0,
    },
    {
      id: 'gear-boxhead',
      type: 'equipment',
      slot: 'head',
      name: 'Box Head',
      icon: headIcon,
      attack: 0,
      hp: 120,
    },
    {
      id: 'gear-cardguards',
      type: 'equipment',
      slot: 'hands',
      name: 'Card Guards',
      icon: handsIcon,
      attack: 8,
      hp: 80,
    },
    {
      id: 'gear-cardarmor',
      type: 'equipment',
      slot: 'armor',
      name: 'Card Armor',
      icon: armorIcon,
      attack: 0,
      hp: 210,
    },
    {
      id: 'gear-cardpants',
      type: 'equipment',
      slot: 'legs',
      name: 'Card Trousers',
      icon: trousersIcon,
      attack: 0,
      hp: 160,
    },
    {
      id: 'gear-cardboots',
      type: 'equipment',
      slot: 'boots',
      name: 'Card Boots',
      icon: bootsIcon,
      attack: 5,
      hp: 70,
    },
    {
      id: 'pet-skunk',
      type: 'equipment',
      slot: 'pet',
      name: 'Junk Skunk',
      icon: pet1Icon,
      renderArt: pet1Full,
      attack: 18,
      hp: 110,
    },
    {
      id: 'pet-raccoon',
      type: 'equipment',
      slot: 'pet',
      name: 'Trash Panda',
      icon: pet2Icon,
      renderArt: pet2Full,
      attack: 14,
      hp: 140,
    },
    {
      id: 'pet-cthulhu',
      type: 'equipment',
      slot: 'pet',
      name: 'Mr.Newbie',
      icon: newbieSoulIcon,
      renderArt: newbieSoulArt,
      attack: 24,
      hp: 95,
      bonuses: [
        { type: 'small_poison_flat', value: 20 },
        { type: 'medium_poison_flat', value: 35 },
        { type: 'large_poison_flat', value: 50 },
        { type: 'crit_chance_pct', value: 0.01 },
      ],
    },
    {
      id: 'pet-bot',
      type: 'equipment',
      slot: 'pet',
      name: 'Box Bot',
      icon: pet4Icon,
      renderArt: pet4Full,
      attack: 10,
      hp: 170,
    },
  ],
  equipped_items: {
    weapon: null,
    head: null,
    hands: null,
    armor: null,
    legs: null,
    boots: null,
    pet: null,
  },
  selected_camp_background: 'garage',
  unlocked_backgrounds: ['garage'],
  talent_points: 12,
  talent_progress: 0,
  talent_progress_goal: 2000,
  boss_talent_progress: 0,
  boss_talent_progress_goal: 2000,
  talent_levels: {},
  talent_tree_version: 2,
  available_talent_points: 12,
  total_talent_points_earned: 12,
  total_talent_points_spent: 0,
  talent_damage_progress: 0,
  next_talent_threshold_index: 0,
  unlocked_talent_sectors: [1],
  talent_combat_state: {},
  talent_base_max_energy: 100,
};
let autoInitTriggered = false;
const DEV_TESTER_NICKNAME = 'local_tester';

function applyDevPreviewBoost(profile) {
  const isTester = [profile?.nickname, profile?.username, profile?.created_by].some((value) => String(value || '').trim().toLowerCase() === DEV_TESTER_NICKNAME);
  const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(String(window.location.hostname || '').toLowerCase());
  if (!import.meta.env.DEV || !isLocalDevHost || window.localStorage.getItem('local_tester_reset_v43') === '1') return profile;

  return { ...profile, ...getHeroResetPayload(profile) };
}

function shouldRunOneTimeHeroReset(profile) {
  const isTester = [profile?.nickname, profile?.username, profile?.created_by].some((value) => String(value || '').trim().toLowerCase() === DEV_TESTER_NICKNAME);
  return Boolean(import.meta.env.DEV && window.localStorage.getItem('local_tester_reset_v42') !== '1');
}

function hydrateDerivedPlayerState(profile) {
  if (!profile) return profile;
  const nextEnergy = calculateEnergy(
    profile.last_energy_update,
    profile.energy,
    profile.max_energy,
    profile.energy_regen_rate,
  );

  return {
    ...profile,
    energy: Number.isFinite(nextEnergy) ? nextEnergy : (profile.energy || 0),
  };
}

function getHeroResetPayload(profile) {
  return { ...profile, ...getLocalTesterResetUpdates() };
}

function getLegacyHeroResetPayload(profile) {
  const now = new Date().toISOString();
  return {
    level: 1,
    xp: 0,
    xp_to_next_level: 100,
    tentacles: 0,
    premium: 0,
    energy: 231,
    max_energy: 100,
    last_energy_update: now,
    stat_strength: 1,
    stat_stealth: 1,
    stat_endurance: 1,
    stat_craft: 1,
    hero_tier: 'scavenger',
    talent_points: 0,
    talent_progress: 0,
    talent_progress_goal: 2000,
    boss_talent_progress: 0,
    boss_talent_progress_goal: 500,
    boss_talent_level: 1,
    talent_levels: {},
    talent_tree_version: 2,
    available_talent_points: 0,
    total_talent_points_earned: 0,
    total_talent_points_spent: 0,
    talent_damage_progress: 0,
    next_talent_threshold_index: 0,
    unlocked_talent_sectors: [1],
    talent_combat_state: {},
    talent_base_max_energy: 100,
    toxic_marks: 0,
    toxic_combo_chain: 0,
    last_poison_small: false,
    last_poison_medium: false,
    overdosed_bosses: {},
    boss_damage_today: 0,
    boss_damage_lifetime: 0,
    energy_spent_total: 0,
    energy_spent_today: 0,
    opened_boxes_total: 0,
    social_slaps_total: 0,
    total_boss_damage: 0,
    boss_kills: 0,
    boss_kills_by_id: {},
    second_boss_warning_seen: false,
    best_medal: '',
    keycards: {},
    boss_key_pity: {},
    poison_refund_progress: {},
    boss_reward_carries: {},
    pending_boss_boxes: [],
    collection_items: [],
    collection_item_counts: {},
    collection_rewards_claimed: {},
    collection_boxes: {},
    task_completions: {},
    daily_event: {},
    daily_event_week: '',
    daily_event_day: 0,
    daily_event_last_claim: '',
    daily_event_pending_claims: 0,
    daily_claimable_count: 0,
    inventory_items: [],
    weapon_inventory: {},
    equipped_items: {
      weapon: null,
      head: null,
      hands: null,
      armor: null,
      legs: null,
      boots: null,
      pet: null,
    },
    roulette_bonus_spins: 0,
    newbie_claimed_quests: [],
    newbie_claimed_parts: [],
    unopened_newbie_packs: [],
    newbie_survival_claimed: false,
    starter_guide_claimed: [],
    starter_guide_final_claimed: false,
    newbie_stats: { boss_tab_opens: 0, hero_views: 0, roulette_spins: 0, fist_uses: 0, knuckle_uses: 0, small_poison_uses: 0 },
    selected_camp_background: 'garage',
    unlocked_backgrounds: ['garage'],
  };
}

export function useGameState() {
  const { user: authUser, isLoadingAuth } = useAuth();
  const authBootstrapProfile = useMemo(
    () => authUser?.backendPlayer || authUser?.player || authUser?.data || null,
    [authUser]
  );
  const initialBootstrapProfile = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return window.__tgBootstrapPayload?.backendPlayer || window.__tgBootstrapPayload?.player || window.__tgBootstrapPayload?.data || null;
  }, []);
  const [profile, setProfile] = useState(initialBootstrapProfile ? { ...initialBootstrapProfile } : null);
  const [energyTick, setEnergyTick] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [initError, setInitError] = useState(null);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStage, setBootStage] = useState('bootstrap');
  const initRunRef = useRef(0);
  const profileRevisionRef = useRef(0);
  const pendingMutationsRef = useRef(0);
  const refreshSequenceRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const displayProfile = useMemo(() => hydrateDerivedPlayerState(profile), [profile, energyTick]);

  const retryInit = useCallback(async () => {
    const runId = ++initRunRef.current;
    const isCurrentRun = () => initRunRef.current === runId;
    setBootProgress(0);
    setBootStage('bootstrap');
    setBootDebug({
      bootStatus: 'game_init_start',
      hasTelegramObject: Boolean(window.Telegram?.WebApp),
      hasInitData: Boolean(window.Telegram?.WebApp?.initData),
      initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
      bootstrapStatus: 'pending',
      bootstrapErrorCode: null,
    });
    console.info('[bootStatus]', {
      stage: 'game_init_start',
      hasTelegramObject: Boolean(window.Telegram?.WebApp),
      hasInitData: Boolean(window.Telegram?.WebApp?.initData),
    });
    setLoading(true);
    setInitError(null);
    try {
      if (!isCurrentRun()) return;
      setBootProgress(0.08);
      const cachedBootstrap = consumeBootstrapCache();
      const bootstrap = authUser?.backendPlayer || authUser?.player || authUser?.data ? authUser : (cachedBootstrap || await getGameBootstrap());
      if (!isCurrentRun()) return;
      setBootProgress(0.28);
      setUser(bootstrap);
      const bootstrapState = bootstrap?.bootstrap || null;
      setBootStage('player');
      let currentProfile = bootstrap?.backendPlayer || bootstrapState?.player || bootstrap?.player || bootstrap?.data || null;
      if (currentProfile && bootstrapState) {
        if (!isCurrentRun()) return;
        setBootProgress(0.52);
        currentProfile = {
          ...currentProfile,
          ...(bootstrapState.inventory || {}),
          ...(bootstrapState.fishing_state || {}),
          ...(bootstrapState.progression || {}),
          ...(bootstrapState.daily_tasks_state || {}),
          ...(bootstrapState.leaderboard_meta || {}),
          ...(bootstrapState.meta || {}),
        };
      }
      if (!currentProfile?.id) {
        const bootstrapLookupKey = bootstrap?.email || bootstrap?.telegramId || bootstrap?.id || null;
        if (bootstrapLookupKey) {
          const fallbackProfiles = await findPlayerProfiles({ created_by: bootstrapLookupKey });
          if (!isCurrentRun()) return;
          if (fallbackProfiles.length > 0) {
            currentProfile = { ...fallbackProfiles[0] };
          }
        }
      }
      setBootStage('initialization');
      if (!isCurrentRun()) return;
      setBootProgress(0.74);
      if (!currentProfile?.id) {
        console.warn('[bootStatus]', {
          stage: 'game_init_waiting_profile',
          hasBootstrapPlayer: Boolean(bootstrap?.backendPlayer || bootstrap?.player || bootstrap?.data),
          hasBootstrapLookupKey: Boolean(bootstrap?.email || bootstrap?.telegramId || bootstrap?.id),
        });
        return;
      }
      const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(String(window.location.hostname || '').toLowerCase());
      const guideResetKey = 'guide_test_reset_v56';
      if (import.meta.env.DEV && isLocalDevHost && window.localStorage.getItem(guideResetKey) !== '1') {
        const resetUpdates = getLocalTesterResetUpdates();
        clearLocalTesterTutorialState();
        await updatePlayerProfile(currentProfile.id, resetUpdates);
        if (!isCurrentRun()) return;
        currentProfile = { ...currentProfile, ...resetUpdates };
        window.localStorage.setItem(guideResetKey, '1');
      }
      const isCongosTester = Object.values(currentProfile).some((value) => typeof value === 'string' && value.trim().toLowerCase() === 'congos');
      const currentItems = Array.isArray(currentProfile.inventory_items) ? currentProfile.inventory_items : [];
      const pet5 = currentItems.find((item) => item?.id === 'pet5');
      if (import.meta.env.DEV && isLocalDevHost && isCongosTester && (!pet5 || pet5.type !== 'equipment')) {
        const petUpdates = { inventory_items: pet5
          ? currentItems.map((item) => item?.id === 'pet5' ? { ...item, type: 'equipment', slot: 'pet' } : item)
          : [...currentItems, { id: 'pet5', type: 'equipment', slot: 'pet' }] };
        await updatePlayerProfile(currentProfile.id, petUpdates);
        if (!isCurrentRun()) return;
        currentProfile = { ...currentProfile, ...petUpdates };
      }
      if (import.meta.env.DEV && isLocalDevHost && isLocalTesterProfile(currentProfile)) {
        const inventory = Array.isArray(currentProfile.inventory_items) ? currentProfile.inventory_items : [];
        const ownedIds = new Set(inventory.map((item) => String(item?.id || '')));
        const bossPreviewBackgrounds = ['boss-fight', 'boss-2-fight', 'boss-3-fight', 'boss-4-fight', 'boss-5-fight', 'boss-6-fight'];
        const existingUnlockedBackgrounds = Array.isArray(currentProfile.unlocked_backgrounds) ? currentProfile.unlocked_backgrounds : [];
        const unlockedBackgrounds = Array.from(new Set([
          'garage',
          ...existingUnlockedBackgrounds,
          ...bossPreviewBackgrounds,
        ]));
        const set4Items = DEFAULT_EQUIPMENT_ITEMS
          .filter((item) => item.setId === SET4_SET_ID && !ownedIds.has(item.id))
          .map((item) => ({ id: item.id, type: 'equipment', slot: item.slot, count: 1, source: 'set4_preview' }));
        const equipped = currentProfile.equipped_items || {};
        const set4Equipped = Object.fromEntries(['weapon', 'head', 'hands', 'armor', 'legs', 'boots'].map((slot) => [slot, `set4_${slot}`]));
        const shouldEquipSet4 = !Object.values(equipped).some(Boolean);
        const shouldUnlockBossBackgrounds = bossPreviewBackgrounds.some((backgroundId) => !existingUnlockedBackgrounds.includes(backgroundId))
          || !existingUnlockedBackgrounds.includes('garage');
        if (set4Items.length || shouldEquipSet4 || shouldUnlockBossBackgrounds) {
          const previewUpdates = {
            ...(set4Items.length ? { inventory_items: [...inventory, ...set4Items] } : {}),
            ...(shouldEquipSet4 ? { equipped_items: { ...equipped, ...set4Equipped } } : {}),
            ...(shouldUnlockBossBackgrounds ? { unlocked_backgrounds: unlockedBackgrounds } : {}),
          };
          await updatePlayerProfile(currentProfile.id, previewUpdates);
          if (!isCurrentRun()) return;
          currentProfile = { ...currentProfile, ...previewUpdates };
        }
      }
      const boostedProfile = currentProfile;
      if (import.meta.env.DEV && isLocalDevHost && window.localStorage.getItem('local_tester_reset_v43') !== '1') {
        window.localStorage.setItem('local_tester_reset_v43', '1');
      }

      if (!platformConfig.telegram.useMock && JSON.stringify(boostedProfile) !== JSON.stringify(currentProfile)) {
        await updatePlayerProfile(currentProfile.id, {
          tentacles: boostedProfile.tentacles,
          premium: boostedProfile.premium,
          energy: boostedProfile.energy,
          max_energy: boostedProfile.max_energy,
          last_energy_update: boostedProfile.last_energy_update,
          level: boostedProfile.level,
          xp: boostedProfile.xp,
          xp_to_next_level: boostedProfile.xp_to_next_level,
          hero_tier: boostedProfile.hero_tier,
          keycards: boostedProfile.keycards,
        collection_boxes: boostedProfile.collection_boxes,
        inventory_items: boostedProfile.inventory_items,
        equipped_items: boostedProfile.equipped_items,
        selected_camp_background: boostedProfile.selected_camp_background,
        unlocked_backgrounds: boostedProfile.unlocked_backgrounds,
        talent_points: boostedProfile.talent_points,
        talent_progress: boostedProfile.talent_progress,
        talent_progress_goal: boostedProfile.talent_progress_goal,
        boss_talent_progress: boostedProfile.boss_talent_progress,
        boss_talent_progress_goal: boostedProfile.boss_talent_progress_goal,
        talent_levels: boostedProfile.talent_levels,
        });
        if (!isCurrentRun()) return;
      }

      setProfile({ ...boostedProfile });
      setBootProgress(1);
      setBootStage('ready');
      setBootDebug({
        bootStatus: 'game_init_success',
      });
      console.info('[bootStatus]', { stage: 'game_init_success' });
    } catch (error) {
      console.error('Failed to initialize game state:', error);
      console.warn('[bootStatus]', {
        stage: 'game_init_failed',
        message: error?.message || 'unknown_error',
        status: error?.status || null,
        code: error?.code || null,
        hasTelegramObject: Boolean(window.Telegram?.WebApp),
        hasInitData: Boolean(window.Telegram?.WebApp?.initData),
      });
      // Keep an authenticated bootstrap snapshot visible if optional startup
      // work fails; otherwise a transient save/initialization error blanks the
      // whole game even though the player state was already loaded.
      const availableProfile = authBootstrapProfile?.id
        ? authBootstrapProfile
        : initialBootstrapProfile?.id
          ? initialBootstrapProfile
          : null;
      setProfile((current) => current?.id ? current : availableProfile ? { ...availableProfile } : null);
      setBootProgress(0);
      setBootStage('error');
      setBootDebug({
        bootStatus: 'game_init_failed',
        bootstrapStatus: error?.status || window.__tgBootDebug?.bootstrapStatus || 'failed',
        bootstrapErrorCode: error?.code || window.__tgBootDebug?.bootstrapErrorCode || 'GAME_INIT_FAILED',
      });
      setInitError(error);
    } finally {
      if (isCurrentRun()) {
        setLoading(false);
      }
    }
  }, [authUser, authBootstrapProfile, initialBootstrapProfile]);

  useEffect(() => {
    if (!authBootstrapProfile?.id) return;
    const nextAuthProfile = authBootstrapProfile;
    setProfile((current) => seedProfileFromAuth(current, nextAuthProfile));
    setUser((current) => current || authUser || null);
    if (!initError && !loading) {
      return;
    }
    if (!initError) {
      setLoading(false);
    }
  }, [authBootstrapProfile, authUser, initError, loading]);

  useEffect(() => {
    if (autoInitTriggered) return undefined;
    autoInitTriggered = true;
    retryInit();
  }, [retryInit]);

  useEffect(() => {
    const nextLanguage = displayProfile?.language || 'en';
    if (i18n.language !== nextLanguage) {
      i18n.changeLanguage(nextLanguage);
    }
  }, [displayProfile?.language]);

  useEffect(() => {
    if (!profile) return undefined;
    const intervalId = window.setInterval(() => {
      if (!document.hidden) setEnergyTick(Date.now());
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [profile?.id]);

  useEffect(() => {
    if (initError?.status !== 429) return undefined;
    const timeout = window.setTimeout(() => { void retryInit(); }, 60000);
    return () => window.clearTimeout(timeout);
  }, [initError, retryInit]);

  const refreshProfile = useCallback(async () => {
    if (!user && !profile) return;
    if (pendingMutationsRef.current || refreshInFlightRef.current) return;
    const revision = profileRevisionRef.current;
    const sequence = ++refreshSequenceRef.current;
    const lookupKey = user?.email || profile?.telegram_id || profile?.telegramId || profile?.id || null;
    if (!lookupKey) return;
    refreshInFlightRef.current = true;
    try {
      const profiles = await findPlayerProfiles({ created_by: lookupKey });
      if (pendingMutationsRef.current || revision !== profileRevisionRef.current || sequence !== refreshSequenceRef.current) return null;
      if (profiles.length > 0) {
        const nextProfile = { ...profiles[0] };
        setProfile(nextProfile);
        return nextProfile;
      }
      return null;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [profile, user]);

  const syncProfile = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    profileRevisionRef.current += 1;
    setProfile((current) => current && String(current.id) === String(snapshot.id)
      ? { ...current, ...snapshot }
      : current);
  }, []);
  
  useEffect(() => {
    if (!profile) return undefined;
    const syncOnReturn = () => {
      if (document.visibilityState === 'visible') refreshProfile().catch(() => {});
    };
    window.addEventListener('focus', syncOnReturn);
    document.addEventListener('visibilitychange', syncOnReturn);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshProfile().catch(() => {});
    }, 30000);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncOnReturn);
      document.removeEventListener('visibilitychange', syncOnReturn);
    };
  }, [profile?.id, refreshProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!profile) return;
    pendingMutationsRef.current += 1;
    profileRevisionRef.current += 1;
    try {
    const isRouletteSpin = Boolean(updates?.spinRoulette);
    const isRouletteClaim = Boolean(updates?.claimRouletteReward);
    const isPlayerAction = Boolean(updates?.playerAction);
    if (updates?.energy !== undefined) {
      const currentEnergy = Number(profile.energy || 0);
      const nextEnergy = Number(updates.energy || 0);
      if (nextEnergy > currentEnergy) {
        console.log('[energy] reward gained', {
          source: 'client_update',
          currentEnergy,
          gain: nextEnergy - currentEnergy,
          regenCap: Number(updates.max_energy || profile.max_energy || 100),
        });
      }
    }
    if (updates?.claimReferralReward) {
      console.log('[profile-update] request', {
        profileId: profile.id,
        claimReferralReward: updates.claimReferralReward,
      });
    }
    const requestUpdates = isRouletteSpin
      ? updates
      : {
          ...updates,
          ...(updates?.energy !== undefined && updates?.last_energy_update === undefined
            ? { last_energy_update: new Date().toISOString() }
            : {}),
        };
    const saved = await updatePlayerProfile(profile.id, requestUpdates);
    if (updates?.claimReferralReward) {
      console.log('[profile-update] response', saved);
    }
    if (updates?.claimRouletteReward) {
      console.log('[profile-update] roulette claim response', saved);
    }
    const {
      claimReferralReward: _claimReferralReward,
      claimRouletteReward: _claimRouletteReward,
      claimWelcomeEnergy: _claimWelcomeEnergy,
      claimCARankReward: _claimCARankReward,
      spinRoulette: _spinRoulette,
      battlePassAction: _battlePassAction,
      talentUpgrade: _talentUpgrade,
      playerAction: _playerAction,
      mailAction: _mailAction,
      ...safeUpdates
    } = updates || {};
    const transientKeys = new Set(['success', 'status', 'kind', 'rewardId', 'boxType', 'drops', 'reward', 'result', 'player', 'rewardState', 'pending_reward', 'claimedLevelMilestone', 'claimedCARank', 'claimedReward']);
    const safeSaved = saved && typeof saved === 'object'
      ? Object.fromEntries(Object.entries(saved).filter(([key]) => !transientKeys.has(key)))
      : saved;
    if (updates?.claimReferralReward) {
      console.log('[profile-update] state update', safeSaved);
    }
    const rouletteProfile = (isRouletteSpin || isRouletteClaim || isPlayerAction) && saved && typeof saved === 'object' ? (saved.player || safeSaved || {}) : null;
    setProfile((current) => {
      if (current?.id !== profile.id) return current;
      const nextProfile = {
        ...mergeSavedProfile(current, safeUpdates, rouletteProfile || safeSaved),
        language: updates?.language || current.language || (rouletteProfile || safeSaved)?.language || 'uk',
        ...(!safeSaved && updates?.energy !== undefined && updates?.last_energy_update === undefined
          ? { last_energy_update: new Date().toISOString() }
          : {}),
      };
      if (isRouletteClaim) {
        const rouletteSnapshot = rouletteProfile || safeSaved || {};
        if (!Object.prototype.hasOwnProperty.call(rouletteSnapshot, 'roulette_pending_reward')) {
          nextProfile.roulette_pending_reward = null;
        }
      }
      return nextProfile;
    });
    return saved;
    } finally {
      pendingMutationsRef.current -= 1;
      profileRevisionRef.current += 1;
    }
  }, [profile, refreshProfile]);

  const addXp = useCallback(async (amount) => {
    if (!displayProfile) return;
    let newXp = (displayProfile.xp || 0) + amount;
    let level = displayProfile.level || 1;
    let xpNeeded = getXpForLevel(level);
    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      level++;
      xpNeeded = getXpForLevel(level);
    }
    // Update hero tier based on level
    const tier = level >= 20 ? 'legend' : level >= 10 ? 'raider' : level >= 5 ? 'survivor' : 'scavenger';
    await updateProfile({
      xp: newXp,
      level,
      xp_to_next_level: xpNeeded,
      hero_tier: tier,
    });
  }, [displayProfile, updateProfile]);

  const spendEnergy = useCallback(async (amount) => {
    if (!displayProfile || (displayProfile.energy || 0) < amount) return false;
    await updateProfile({
      energy: displayProfile.energy - amount,
      last_energy_update: new Date().toISOString(),
      energy_spent_total: (displayProfile.energy_spent_total || 0) + amount,
      energy_spent_today: (displayProfile.energy_spent_today || 0) + amount,
    });
    return true;
  }, [displayProfile, updateProfile]);

  const stashTentacles = useCallback(async (amount) => {
    if (!displayProfile) return;
    const max = Math.min(amount, displayProfile.tentacles || 0, (displayProfile.safe_capacity || 500) - (displayProfile.safe_tentacles || 0));
    if (max <= 0) return;
    await updateProfile({ safe_tentacles: (displayProfile.safe_tentacles || 0) + max, tentacles: (displayProfile.tentacles || 0) - max });
  }, [displayProfile, updateProfile]);

  return { profile: displayProfile, user, loading, initError, retryInit, refreshProfile, syncProfile, updateProfile, addXp, spendEnergy, stashTentacles, bootProgress, bootStage };
}
