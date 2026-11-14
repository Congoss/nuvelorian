import { poisonShopState, purchaseEventPoison } from '../src/lib/eventPoisonShop.js';
import { grantAllEquipmentSets } from './utils/grantEquipmentSets.js';
import { resetPlayerTalents } from './utils/talentReset.js';
import { compensateTalentPoints } from './utils/talentCompensation.js';
import { recoverKarma } from './utils/karmaRecovery.js';
import { normalizePlayerPatch } from './utils/playerPatchCompatibility.js';
import { redeemPromoCode } from './utils/promoRedemption.js';
import { getGlobalWeekMeta } from './utils/globalWeeklyCycle.js';
import { captureDailyTaskProgress } from '../src/lib/questNotifications.js';
import { refundCombatEnergy } from './utils/energyRefund.js';
import { adminRole, operatorAllowed } from './utils/adminRoles.js';
import { APP_VERSION, APP_VERSION_LABEL } from '../src/lib/appVersion.js';
import { prepareReferralMessage } from './utils/referralMessage.js';
import { referralPage } from './utils/referralPage.js';
import { buildNearAudience } from './utils/nearAudience.js';
import { campaignIcon, defaultNftHolderCampaign, loadNearCampaignMetadata, normalizeNftHolderCampaign, processNftHolderCampaign } from './services/nft-holder-campaign.js';
import { claimNftHolderPet, checkNftPetStatus, deleteHolderDrop, getHolderDrop, getHolderDrops, holderDropIcon, newHolderDrop, processHolderDrop, saveHolderDrop } from './services/holder-drops.js';
import { calculateRaidRewardAmounts, getRaidRewardMailCopy } from './services/raid-boss-rewards.js';
import { awardRaidRankRewards } from './services/raid-rank-rewards.js';
import { rankRaidParticipants } from '../src/lib/raidRankRewards.js';
import { claimGiftMail, normalizeGiftMailContent, normalizeGiftRewards } from './utils/giftMail.js';
import { EVENT_SCHEDULE, eventPhase } from '../src/lib/eventSchedule.js';
import { tryServeStatic } from './staticDelivery.js';
import { webAuth } from './utils/webAuth.js';
import { verifyNearAccountKey } from './utils/nearWalletProof.js';
import { createPartnerVisits } from './utils/partnerVisits.js';
import { checkExtraSubscription, checkPartnerTelegramSubscription, getExtraChannelAvatar, getPublicTelegramAvatar, normalizePublicTelegramUsername, getPlayerTelegramAvatar } from './utils/extraQuests.js';
import { normalizePartnerLink, parseVerifiablePartnerLink, verifyXFollow } from './utils/partnerVerification.js';
import http from 'node:http';
import { getQuestMission } from '../src/lib/questMissionCatalog.js';
import { grantQuestArtifact, reconcileGuaranteedQuestArtifacts } from './utils/questArtifactRewards.js';
import { applyPlayerAction } from './utils/playerActions.js';
import { TUTORIAL_STEPS, canSpendTutorialEnergyOnMission } from '../src/lib/tutorialProgress.js';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import {
  GAME_CONFIG,
  calculateRaidSuccess,
  calculateStealAmount,
  getCollectionDamageBonus,
} from '../src/lib/gameConfig.js';
import { getShopCatalog, getShopPaymentProduct } from '../src/lib/shopCatalog.js';
import { validateDailyShopPatch } from './utils/daily-shop-limits.js';
import { validateEquipmentLoadout } from './utils/equipmentOwnership.js';
import { isPromoCodeActive } from '../src/lib/promoCodes.js';
import { isQuestLocationUnlocked } from '../src/lib/questUnlocks.js';
import {
  applyRouletteReward,
  normalizeRouletteRewardId,
  resolveRouletteRewardById,
  selectRouletteReward,
} from '../src/lib/rouletteRewards.js';
import { serverConfig } from './config.js';
import { paymentDb } from './data/payment-db.js';
import { applyTalentUpgrade as calculateTalentUpgrade, buildEffectiveWeapon, TALENT_DEFS } from '../src/lib/talents.js';
import { awardTalentDamage, migrateTalentTreeState } from '../src/lib/talentTreeState.js';
import { getBleedTicks, registerHpThresholds, resolveTalentAttack } from '../src/lib/talentCombat.js';
import { BOSS_BACKGROUND_REWARDS, getBossBoxTables, rollBossDamageReward, openBox, sanitizeBossBoxTables } from '../src/lib/lootBoxes.js';
import { calculateActualPoisonRefundUnits, calculateBossReward, DEFAULT_BOSS_REWARD_CONFIG, getBossKeyDropChance, sanitizeBossRewardConfig, stripRetiredBossFragments } from '../src/lib/bossRewardSystem.js';
import {
  SIM_BOT_FLAG,
  SIM_BOT_TYPE,
  SIM_DAILY_TASKS,
  SIM_MAX_BOTS_DEFAULT,
  SIM_MODES,
  SIM_NEWBIE_QUESTS,
  isSimulatedPlayer,
} from '../src/lib/simulatedPlayers.js';
import { store } from './data/store.js';
import { listDiagnosticEvents, recordDiagnosticEvent } from './data/diagnostics.js';
import { playerDb } from './data/player-db.js';
import { grantXpToPlayer, migrateLegacyResourceFields, normalizePlayerProgression } from './utils/progression.js';
import { buildPlayerStateSnapshot, hydratePlayerState } from './utils/playerState.js';
import { expireStaleBossFights, getClanDamageFightTargets, isActiveBossFight, shouldReceiveBossFightDamageReward } from './utils/clanBossDamage.js';
import { CLAN_ACHIEVEMENT_CONFIG, CLAN_QUEST_DEFINITIONS, createClanAchievements, getClanAchievementState } from '../src/lib/clanAchievements.js';
import { CLAN_DONATION_WINDOW_MS } from '../src/lib/clanDonationState.js';
import { applyBossEscapeCooldown, getBossEscapeCooldownRemaining } from '../src/lib/bossEscapeCooldown.js';
import { battlePassEnabled, recordBattlePassEvent, recordBattlePassBossVictory, claimBattlePassReward, claimAllBattlePassRewards, unlockBattlePassTier, fullyUnlockBattlePass } from './utils/battlePass.js';
import { getSessionFromHeaders, verifyTelegramInitData } from './utils/telegramAuth.js';
import { getRequestRatePolicy } from './utils/requestRatePolicy.js';
import { getQuery, readJsonBody, sendData, sendError, sendJson } from './utils/http.js';
import { createNearPaymentService } from './services/near-payment.js';
import { createPaymentRateService } from './services/payment-rate-service.js';
import { createPaymentService } from './services/payment-service.js';
import { createStarsPaymentService } from './services/stars-payment.js';
import { createTonPaymentService } from './services/ton-payment.js';
const nearWalletChallenges = new Map();
import { assertNewbiePackPurchasable, getNewbiePackOffers, grantNewbiePack, syncNewbiePackOffers } from './utils/newbiePacks.js';
import { getCARank, getPlayerCA } from '../src/lib/caRankDefinitions.js';
import { getCARankReward } from '../src/lib/caRankRewards.js';

const simActionLogs = [];
const simRateMap = new Map();
const requestRateMap = new Map();
const clientDiagnosticRateMap = new Map();
const pendingXOAuth = new Map();
const partnerVisits = createPartnerVisits();
const partnerClickTimes = new Map();

function encryptXToken(value) {
  const key = createHash('sha256').update(serverConfig.xTokenEncryptionKey).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptXToken(value) {
  const [iv, tag, encrypted] = String(value || '').split('.');
  if (!iv || !tag || !encrypted) throw new Error('Stored X token is invalid');
  const key = createHash('sha256').update(serverConfig.xTokenEncryptionKey).digest();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}
const SIM_RATE_LIMIT_PER_MIN = 120;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_TELEGRAM_IDS = new Set(String(process.env.ADMIN_TELEGRAM_IDS || '').split(',').map((id) => id.trim()).filter(Boolean));
const ADMIN_EMAILS = new Set(String(process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));
// Keep the local admin route usable in development. Production always requires
// an explicit ADMIN_TOKEN environment variable.
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || (IS_PRODUCTION ? '' : 'dev-admin')).trim();
const paymentRates = createPaymentRateService({ refreshMs: serverConfig.paymentRatesRefreshMs });
paymentRates.start();
const starsPayment = createStarsPaymentService();
const tonPayment = createTonPaymentService();
const nearPayment = createNearPaymentService();
const TON_RECEIVER = serverConfig.tonReceiver;
const NEAR_RECEIVER = serverConfig.nearReceiver;
const STARTING_ENERGY = 100;

function isLocalTester(player) {
  return false;
}

function findShopPackById(itemId) {
  const catalog = getShopCatalog();
  return getShopPaymentProduct(itemId, catalog);
}

function grantShopPurchaseReward({ userId, itemId }) {
  const player = store.players.find((candidate) => String(candidate.id || '') === String(userId || '')) || null;
  if (!player) {
    const error = new Error('Player not found for payment reward');
    error.code = 'PAYMENT_PLAYER_NOT_FOUND';
    throw error;
  }
  const item = findShopPackById(itemId);
  if (!item) {
    const error = new Error('Payment item not found');
    error.code = 'PAYMENT_ITEM_NOT_FOUND';
    throw error;
  }
  if (item.tier) {
    unlockBattlePassTier(player, item.tier);
    player.last_paid_purchase_at = new Date().toISOString();
    player.last_paid_purchase_item_id = item.id;
    return player;
  }
  if (String(item.id || '').startsWith('newbie_pack_')) {
    grantNewbiePack(player, item.id);
    player.last_paid_purchase_at = new Date().toISOString();
    player.last_paid_purchase_item_id = item.id;
    store.persistSoon();
    return player;
  }
  if (item.energy) {
    player.energy = Number(player.energy || 0) + Number(item.energy);
    player.last_energy_update = new Date().toISOString();
    player.last_paid_purchase_at = new Date().toISOString();
    player.last_paid_purchase_item_id = item.id;
    player.last_paid_purchase_amount = Number(item.energy);
    store.persistSoon();
    return player;
  }
  if (item.poisonId) {
    player.weapon_inventory = { ...(player.weapon_inventory || {}) };
    player.weapon_inventory[item.poisonId] = Number(player.weapon_inventory[item.poisonId] || 0) + Number(item.amount || 1);
    player.last_paid_purchase_at = new Date().toISOString();
    player.last_paid_purchase_item_id = item.id;
    player.last_paid_purchase_amount = Number(item.amount || 1);
    store.persistSoon();
    return player;
  }
  const amount = Number(item.cdm || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error('Invalid reward amount');
    error.code = 'PAYMENT_INVALID_REWARD';
    throw error;
  }
  player.premium = Number(player.premium || 0) + amount;
  player.last_paid_purchase_at = new Date().toISOString();
  player.last_paid_purchase_item_id = item.id;
  player.last_paid_purchase_amount = amount;
  return player;
}

const paymentService = createPaymentService({
  fetchRates: () => paymentRates.getRates(),
  catalog: getShopCatalog(),
  db: {
    createTransaction: (transaction) => paymentDb.createTransaction(transaction),
    updateTransaction: (id, patch) => paymentDb.updateTransaction(id, patch),
    claimPendingTransaction: (id, patch) => paymentDb.claimPendingTransaction(id, patch),
    findTransactionById: (id) => paymentDb.findTransactionById(id),
    findTransactionByHash: (hash) => paymentDb.findTransactionByHash(hash),
    appendEvent: (event) => paymentDb.appendEvent(event),
  },
  grantReward: grantShopPurchaseReward,
  tonReceiver: TON_RECEIVER,
  nearReceiver: NEAR_RECEIVER,
});

let reconcilingNearPayments = false;

export async function processPendingNearPayments() {
  if (reconcilingNearPayments) return 0;
  reconcilingNearPayments = true;
  try {
    await Promise.all([store.init(), playerDb.init(store), paymentDb.init()]);
    const pending = (await paymentDb.listPendingTransactions(100))
      .filter((order) => order.payment_method === 'near' && String(order.nearAmountYocto || order.near_amount_yocto || '').match(/^\d+$/));
    if (!pending.length) return 0;

    const createdTimes = pending.map((order) => Date.parse(order.created_at)).filter(Number.isFinite);
    const oldestTimestampNs = createdTimes.length
      ? (BigInt(Math.min(...createdTimes)) * 1000000n).toString()
      : '';
    const transfers = await nearPayment.listRecentIncomingTransfers({
      receiverAccountId: NEAR_RECEIVER,
      network: serverConfig.nearNetwork,
      apiKey: process.env.NEARBLOCKS_API_KEY || '',
      oldestTimestampNs,
      limit: 25,
      maxPages: 20,
    });
    const assignedHashes = new Set();
    let confirmedCount = 0;

    for (const transfer of transfers) {
      if (!transfer.senderAccountId || assignedHashes.has(transfer.txHash)) continue;
      const timestampMs = /^\d+$/.test(transfer.timestampNs) ? Number(BigInt(transfer.timestampNs) / 1000000n) : 0;
      const order = pending.find((candidate) =>
        String(candidate.nearAmountYocto || candidate.near_amount_yocto || '') === transfer.amountYocto
        && Number.isFinite(Date.parse(candidate.created_at))
        && Date.parse(candidate.created_at) <= timestampMs,
      );
      if (!order || !playerDb.getPlayerById(order.user_id)) continue;

      try {
        const verification = await nearPayment.verifyNearTransaction({
          txHash: transfer.txHash,
          senderAccountId: transfer.senderAccountId,
          receiverAccountId: NEAR_RECEIVER,
          expectedYoctoAmount: order.nearAmountYocto || order.near_amount_yocto,
          network: serverConfig.nearNetwork,
        });
        if (!verification.confirmed) continue;

        await paymentService.confirmNearPayment({
          orderId: order.id,
          txHash: verification.txHash,
          amount: order.near_amount_locked,
          recipient: verification.recipient,
          senderAccountId: verification.senderAccountId,
          confirmed: true,
        });
        await playerDb.flushDirtyPlayers([order.user_id]);
        assignedHashes.add(transfer.txHash);
        confirmedCount += 1;
        console.info('[payments] NEAR pending order reconciled', { orderId: order.id, itemId: order.item_id });
      } catch (error) {
        console.warn('[payments] NEAR reconciliation attempt failed', {
          orderId: order.id,
          code: error?.code || 'NEAR_RECONCILIATION_FAILED',
        });
      }
    }
    return confirmedCount;
  } finally {
    reconcilingNearPayments = false;
  }
}

function sortPlayers(players, sort = '-created_date') {
  const descending = sort.startsWith('-');
  const field = sort.replace(/^-/, '');

  return [...players].sort((a, b) => {
    const aValue = field === 'referrals' ? getPlayerReferralCount(a) : a[field] ?? 0;
    const bValue = field === 'referrals' ? getPlayerReferralCount(b) : b[field] ?? 0;

    if (aValue < bValue) return descending ? 1 : -1;
    if (aValue > bValue) return descending ? -1 : 1;
    return 0;
  });
}

function getCurrentPlayer(request) {
  const session = getSessionFromHeaders(request.headers);
  if (!session) return null;

  const player =
    playerDb.getPlayerBySession(session) ||
    store.players.find(
      (candidate) =>
        String(candidate.telegram_id || '') === session.telegramId ||
        candidate.created_by === session.email
    ) ||
    null;

  if (!player) return null;
  captureDailyTaskProgress(player, getGlobalWeekMeta());
  if (player.is_banned) return null;

  const pendingBoxes = Array.isArray(player.pending_boss_boxes) ? player.pending_boss_boxes : [];
  if (pendingBoxes.length) {
    const seen = new Set();
    const cleaned = pendingBoxes.filter((entry) => {
      const boxType = String(entry?.boxType || '').trim();
      const instanceId = String(entry?.instanceId || entry?.id || '').trim();
      if (!boxType || !instanceId) return false;

      const fightId = entry?.fightId || entry?.fight_id || null;
      const bossId = entry?.bossId || entry?.boss_id || null;
      const claimKey = `${player.id}:${fightId || 'no-fight'}:${boxType}:${bossId || 'none'}:${instanceId}`;
      if (store.claimedLoot.includes(claimKey)) return false;

      const dedupeKey = `${boxType}:${fightId || 'no-fight'}:${bossId || 'none'}:${instanceId}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });

  if (cleaned.length !== pendingBoxes.length) {
      player.pending_boss_boxes = cleaned;
    }
  }

  return materializePlayerState(player);
}

function isAdminSession(session) {
  if (!session) return false;
  if (ADMIN_TELEGRAM_IDS.has(String(session.telegramId || ''))) return true;
  if (ADMIN_EMAILS.has(String(session.email || '').toLowerCase())) return true;
  return false;
}

function getAdminTokenFromRequest(request) {
  const authHeader = String(request.headers.authorization || '').trim();
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const headerToken = String(request.headers['x-admin-token'] || '').trim();
  return bearerToken || headerToken || '';
}

function isValidAdminToken(token) {
  const provided = String(token || '').trim();
  return Boolean(ADMIN_TOKEN) && Boolean(provided) && provided === ADMIN_TOKEN;
}

function requireAdminToken(request, response) {
  if (!ADMIN_TOKEN) {
    sendError(response, 503, 'Admin token not configured', 'ADMIN_TOKEN_NOT_CONFIGURED');
    return false;
  }
  const token = getAdminTokenFromRequest(request);
  const role=adminRole(token,ADMIN_TOKEN);
  if (!role) {
    sendError(response, 401, 'Unauthorized admin access', 'ADMIN_AUTH_REQUIRED');
    return false;
  }
  if(role==='operator'&&!operatorAllowed(new URL(request.url,'http://localhost').pathname,request.method)){sendError(response,403,'Owner only action','ADMIN_FORBIDDEN');return false;}
  return true;
}

function canAccessPlayer(request, player) {
  const session = getSessionFromHeaders(request.headers);
  if (!session || !player || player.is_banned) return false;
  if (isAdminSession(session)) return true;
  return String(player.telegram_id || '') === String(session.telegramId || '') || String(player.created_by || '') === String(session.email || '');
}

function publicPlayerProfile(player, referralCountOverride = null) {
  const normalized = normalizePlayerProgression({ ...player });
  const fields = ['id', 'username', 'nickname', 'avatar', 'photo_url', 'level', 'hero_tier',
    'stat_strength', 'clan_id', 'clan_name', 'clan_logo_id', 'boss_kills', 'boss_kills_by_id', 'equipped_items', 'selected_avatar_frame',
    'selected_banner', 'avatar_frame_id', 'profile_banner_id', 'selected_camp_background', 'created_date', 'likes_received_count', 'dislikes_received_count'];
  return { ...Object.fromEntries(fields.filter((key) => Object.hasOwn(normalized, key)).map((key) => [key, normalized[key]])), battle_pass_tier: normalized.battle_pass_view?.tier || 'free', referralsCount: referralCountOverride === null ? getPlayerReferralCount(player) : referralCountOverride };
}

function pickSafePlayerPatch(body = {}) {
  const allowedKeys = new Set([
    'nickname',
    'selectedAvatarFrame',
    'selectedBanner',
    'selected_avatar_frame',
    'selected_banner',
    'avatar_frame_id',
    'profile_banner_id',
    'settings',
    'preferences',
    'language',
    'tentacles',
    'premium',
    'stat_strength',
    'energy',
    'max_energy',
    'last_energy_update',
    'xp',
    'level',
    'xp_to_next_level',
    'hero_tier',
    'safe_tentacles',
    'safe_capacity',
    'energy_spent_total',
    'energy_spent_today',
    'total_tasks_today',
    'opened_boxes_total',
    'social_slaps_total',
    'total_boss_damage',
    'boss_hits_today',
    'raid_boss_hits_today',
    'boss_kills',
    'boss_kills_by_id',
    'second_boss_warning_seen',
    'best_medal',
    'boss_damage_today',
    'boss_damage_lifetime',
    'task_completions',
    'daily_event',
    'daily_event_week',
    'daily_event_day',
    'daily_event_last_claim',
    'daily_event_pending_claims',
    'daily_claimable_count',
    'daily_shop_date',
    'daily_shop_purchases',
    'shop_daily_limits',
    'active_location',
    'telegram_sub_reward_claimed',
    'telegram_sub_reward2_claimed',
    'login_streak',
    'last_login_date',
    'clan_mail_read_ids',
    'gift_mail_read_ids',
    'used_promo_codes',
    'keycards',
    'boss_key_pity',
    'poison_refund_progress',
    'boss_reward_carries',
    'pending_boss_boxes',
    'puddle_active',
    'collection_items',
    'collection_item_counts',
    'starter_set_fragments',
    'starter_set_fragment',
    'starter_fragments',
    'collection_rewards_claimed',
    'collection_boxes',
    'inventory_items',
    'weapon_inventory',
    'weapon_cooldowns',
    'equipped_items',
    'seen_equipment_item_ids',
    'cosmofish_inventory',
    'cosmo_fish_inventory',
    'cosmo_fishing_cycle',
    'cosmo_fishing_last_result',
    'cosmo_fishing_last_result_seen',
    'selected_camp_background',
    'unlocked_backgrounds',
    'talent_points',
    'talent_progress',
    'talent_progress_goal',
    'boss_talent_progress',
    'boss_talent_progress_goal',
    'boss_talent_level',
    'talent_levels',
    'talent_tree_version',
    'legacy_talent_levels',
    'available_talent_points',
    'total_talent_points_earned',
    'total_talent_points_spent',
    'talent_reset_count',
    'talent_damage_progress',
    'next_talent_threshold_index',
    'unlocked_talent_sectors',
    'talent_combat_state',
    'talent_base_max_energy',
    'toxic_marks',
    'toxic_combo_chain',
    'last_poison_small',
    'last_poison_medium',
    'overdosed_bosses',
    'roulette_bonus_spins',
    'newbie_claimed_quests',
    'newbie_claimed_parts',
    'unopened_newbie_packs',
    'newbie_pack_1_unlocked_at',
    'newbie_pack_1_expires_at',
    'newbie_pack_1_purchased_at',
    'newbie_pack_2_unlocked_at',
    'newbie_pack_2_expires_at',
    'newbie_pack_2_purchased_at',
    'newbie_pack_reward_transactions',
    'newbie_survival_claimed',
    'starter_guide_claimed',
    'starter_guide_final_claimed',
    'newbie_stats',
    'unlocked_profile_banners',
    'unlocked_avatar_frames',
    'profile_banner_id',
    'avatar_frame_id',
  ]);
  const next = {};
  Object.entries(body || {}).forEach(([key, value]) => {
    if (key === 'gift_mail_read_ids' || key === 'clan_mail_read_ids') {
      if (Array.isArray(value)) next[key] = [...new Set(value.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 160))].slice(-200);
      return;
    }
    if (key === 'first_boss_tutorial_seen') {
      if (value === true) next[key] = true;
      return;
    }
    if (!new Set(['nickname', 'selectedAvatarFrame', 'selectedBanner', 'selected_avatar_frame', 'selected_banner', 'avatar_frame_id', 'profile_banner_id', 'settings', 'preferences', 'language', 'active_location', 'selected_camp_background', 'equipped_items', 'seen_equipment_item_ids']).has(key)) return;
    if (key === 'near_wallet_id' && (typeof value !== 'string' || (value !== '' && !/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(value)) || value.length > 64 || (value !== '' && value.length < 2))) return;
    next[key] = value;
  });
  return next;
}

function pickSafePlayerCreate(body = {}) {
  const safe = {};
  if (typeof body.nickname === 'string') safe.nickname = body.nickname.slice(0, 40);
  if (typeof body.language === 'string') safe.language = body.language.slice(0, 8);
  if (typeof body.avatar === 'string') safe.avatar = body.avatar.slice(0, 200);
  if (typeof body.photoUrl === 'string') safe.photoUrl = body.photoUrl.slice(0, 500);
  return safe;
}

function grantEnergyGain(player, amount, source = 'reward') {
  const gain = Math.max(0, Number(amount) || 0);
  if (!player || !gain) return 0;
  player.energy = Number(player.energy || 0) + gain;
  player.last_energy_update = new Date().toISOString();
  console.log('[energy] reward gained', {
    source,
    gain,
    currentEnergy: player.energy,
    regenCap: Number(player.max_energy || GAME_CONFIG.MAX_ENERGY_BASE),
  });
  return gain;
}

function claimCARankReward(player, requestedRank) {
  const rank = Number(requestedRank);
  const currentRank = getCARank(getPlayerCA(player)).rank;
  const reward = getCARankReward(rank);
  if (!reward || rank <= 1 || rank > currentRank) {
    throw Object.assign(new Error('CA rank reward is not available'), { statusCode: 400, code: 'CA_RANK_REWARD_UNAVAILABLE' });
  }
  const claimed = new Set((player.ca_rank_rewards_claimed || []).map(Number));
  if (claimed.has(rank)) throw Object.assign(new Error('CA rank reward already claimed'), { statusCode: 409, code: 'CA_RANK_REWARD_ALREADY_CLAIMED' });
  player.tentacles = Number(player.tentacles || 0) + Number(reward.tentacles || 0);
  grantEnergyGain(player, reward.energy, 'ca_rank_reward');
  player.weapon_inventory = { ...(player.weapon_inventory || {}) };
  for (const [key, amount] of [['small-poison', reward.smallPoison], ['medium-poison', reward.mediumPoison], ['large-poison', reward.largePoison]]) {
    player.weapon_inventory[key] = Number(player.weapon_inventory[key] || 0) + Number(amount || 0);
  }
  player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + Number(reward.spins || 0);
  player.ca_rank_rewards_claimed = [...claimed, rank].sort((a, b) => a - b);
  return reward;
}

function hasUnsafePlayerCreateFields(body = {}) {
  const unsafeKeys = new Set([
    'tentacles', 'premium', 'stars', 'cdm', 'dm', 'level', 'xp', 'exp', 'strength', 'ca', 'power',
    'energy', 'inventory', 'weapon_inventory', 'lootBoxes', 'boxes', 'rewards', 'claimedRewards',
    'daily', 'roulette', 'boss', 'bosses', 'talents', 'talentPoints', 'referral', 'friends',
    'isAdmin', 'role', 'isBot', 'isSimulated', 'createdAt', 'updatedAt',
  ]);
  return Object.keys(body || {}).some((key) => unsafeKeys.has(key));
}

function resolveReferralCode(player) {
  return String(player?.referral_code || player?.telegram_id || player?.id || '').trim();
}

function getPlayerReferralCount(player) {
  const explicit = Number(
    player?.referralsCount ||
    player?.referral_count ||
    player?.referrals_count ||
    player?.referred_friends_count ||
    player?.referrals ||
    0,
  ) || 0;
  const aliases = new Set([resolveReferralCode(player), player?.telegram_id, player?.id].filter(Boolean).map(String));
  const friends = Array.isArray(player?.referred_friends) ? player.referred_friends : [];
  const ids = new Set(friends.map((friend, index) => String(friend?.playerId || friend?.id || `legacy-${index}`)));
  for (const candidate of store.players) {
    if (String(candidate.id) !== String(player?.id) && aliases.has(String(candidate.referred_by || ''))) ids.add(String(candidate.id));
  }
  return Math.max(explicit, ids.size);
}

function getPlayerReferralCounts(players = store.players) {
  const aliasesToPlayerIds = new Map();
  const referredIdsByPlayer = new Map();
  const explicitCounts = new Map();
  for (const player of players) {
    const playerId = String(player?.id || '');
    const explicit = Number(player?.referralsCount || player?.referral_count || player?.referrals_count || player?.referred_friends_count || player?.referrals || 0) || 0;
    const referredIds = new Set((Array.isArray(player?.referred_friends) ? player.referred_friends : []).map((friend, index) => String(friend?.playerId || friend?.id || `legacy-${index}`)));
    referredIdsByPlayer.set(playerId, referredIds);
    explicitCounts.set(playerId, explicit);
    const aliases = new Set([resolveReferralCode(player), player?.telegram_id, player?.id].filter(Boolean).map(String));
    for (const alias of aliases) {
      const owners = aliasesToPlayerIds.get(alias) || new Set();
      owners.add(playerId);
      aliasesToPlayerIds.set(alias, owners);
    }
  }
  for (const candidate of players) {
    const referredBy = String(candidate?.referred_by || '');
    for (const ownerId of aliasesToPlayerIds.get(referredBy) || []) {
      if (ownerId !== String(candidate?.id || '')) referredIdsByPlayer.get(ownerId)?.add(String(candidate.id));
    }
  }
  return new Map(players.map((player) => {
    const id = String(player?.id || '');
    return [id, Math.max(explicitCounts.get(id) || 0, referredIdsByPlayer.get(id)?.size || 0)];
  }));
}

function getPowerForLeaderboard(player) {
  return Number(
    player?.stat_strength ||
    player?.power ||
    player?.attack_power ||
    player?.clan_power ||
    (Number(player?.total_boss_damage || 0) / 10) ||
    0,
  ) || 0;
}

function normalizeClanKey(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureClanRecord(clanKey) {
  const key = normalizeClanKey(clanKey);
  if (!key) return null;
  let clan = store.clans.find((entry) => normalizeClanKey(entry.id) === key || normalizeClanKey(entry.name) === key);
  if (clan) return clan;

  const member = store.players.find((player) => normalizeClanKey(player.clan_id) === key || normalizeClanKey(player.clan_name) === key);
  if (!member) return null;
  clan = {
    id: String(member.clan_id || key),
    name: String(member.clan_name || key),
    owner_id: member.id,
    description: String(member.clan_description || ''),
    logo_id: String(member.clan_logo_id || ''),
    achievements: createClanAchievements(),
    created_at: new Date().toISOString(),
  };
  store.clans.push(clan);
  store.persistSoon();
  return clan;
}

function serializeClan(clan) {
  const achievements = Object.fromEntries(Object.keys(CLAN_ACHIEVEMENT_CONFIG).map((type) => [type, getClanAchievementState(type, clan?.achievements?.[type])]));
  return {
    ...clan,
    achievements,
    max_members: achievements.donations.benefit.maxMembers,
  };
}

function getClanForPlayer(player) {
  return player?.clan_id || player?.clan_name ? ensureClanRecord(player.clan_id || player.clan_name) : null;
}

function addClanAchievementProgress(clan, type, amount) {
  if (!clan || !CLAN_ACHIEVEMENT_CONFIG[type]) return null;
  const delta = Math.max(0, Number(amount || 0));
  clan.achievements = { ...createClanAchievements(), ...(clan.achievements || {}) };
  const previous = clan.achievements[type] || { level: 0, progress: 0 };
  const progress = Math.max(0, Number(previous.progress || 0) + delta);
  const state = getClanAchievementState(type, { progress });
  clan.achievements[type] = { level: state.level, progress };
  return state;
}

function getClanPoisonMultiplier(player) {
  const clan = getClanForPlayer(player);
  if (!clan) return 1;
  const damage = getClanAchievementState('damage', clan.achievements?.damage);
  return 1 + Number(damage.benefit.poisonPct || 0) / 100;
}

function addClanBossDamage(player, damage) {
  const clan = getClanForPlayer(player);
  if (!clan) return null;
  const state = addClanAchievementProgress(clan, 'damage', damage);
  progressClanQuestMetric(clan, player, 'damage', damage);
  store.persistSoon();
  return state;
}

function isClanMember(player, clan) {
  return Boolean(player && clan && (normalizeClanKey(player.clan_id) === normalizeClanKey(clan.id) || normalizeClanKey(player.clan_name) === normalizeClanKey(clan.name)));
}

const CLAN_ROLE_META = {
  leader: { label: 'Космобатя', color: '#f2c84b' },
  deputy: { label: 'Супутник', color: '#be72ff' },
  elder: { label: 'Космодід', color: '#42d8ce' },
  member: { label: 'Стажер', color: '#9aa09a' },
};
const CLAN_ROLE_ORDER = { leader: 4, deputy: 3, elder: 2, member: 1 };

function getClanRole(player, clan) {
  if (!player || !clan) return 'member';
  if (String(clan.owner_id) === String(player.id)) return 'leader';
  const role = String(player.clan_role || '').toLowerCase();
  if (role.includes('leader') || role.includes('космобат')) return 'leader';
  if (role.includes('deputy') || role.includes('супут')) return 'deputy';
  if (role.includes('elder') || role.includes('космод')) return 'elder';
  return 'member';
}

function canManageClan(player, clan) {
  return ['leader', 'deputy'].includes(getClanRole(player, clan));
}

function clanActorName(player) {
  return player?.nickname || player?.username || 'player';
}

function addClanActivity(clan, actor, text, tone = 'blue', restricted = false) {
  const entry = { id: store.generateId('clan-log'), actor_id: actor?.id || '', actor_name: clanActorName(actor), text, tone, restricted, created_at: new Date().toISOString() };
  clan.activity_log = [...(clan.activity_log || []), entry].slice(-200);
  store.chatMessages.push({ id: store.generateId('clan-system'), channel: 'clan', clan: clan.name, system: true, restricted, role: 'SYSTEM', author: '', text, tone, created_at: entry.created_at });
  return entry;
}

function clanMemberPayload(player, clan) {
  const role = getClanRole(player, clan);
  return { ...normalizePlayerProgression(player), clan_role: role, role_label: CLAN_ROLE_META[role].label, role_color: CLAN_ROLE_META[role].color, power: getPowerForLeaderboard(player) };
}

function setClanQuestCooldown(player, clan, quest, now = Date.now()) {
  if (!player || !clan || !quest?.definition_id) return null;
  const durationMs = Math.max(1, Number(quest.duration_hours || 0)) * 3600000;
  const availableAt = new Date(now + durationMs).toISOString();
  const byClan = { ...(player.clan_quest_cooldowns || {}) };
  byClan[clan.id] = { ...(byClan[clan.id] || {}), [`tier-${quest.tier}`]: availableAt };
  player.clan_quest_cooldowns = byClan;
  quest.cooldown_until = availableAt;
  return availableAt;
}

function getClanQuestOffers(player, clan, maxTier, now = Date.now()) {
  const byClan = { ...(player.clan_quest_offers || {}) };
  const activeByOffer = new Set((clan.quests || []).filter((quest) => quest.status === 'ACTIVE' && String(quest.owner_id) === String(player.id)).map((quest) => String(quest.offer_id || '')));
  const finishedByOffer = new Map((clan.quests || []).filter((quest) => ['COMPLETED', 'EXPIRED'].includes(quest.status) && String(quest.owner_id) === String(player.id)).map((quest) => [String(quest.offer_id || ''), quest]));
  const candidates = CLAN_QUEST_DEFINITIONS.filter((definition) => definition.tier <= maxTier);
  const pick = (excluded = new Set()) => {
    const choices = candidates.filter((definition) => !excluded.has(definition.id));
    return (choices.length ? choices : candidates)[Math.floor(Math.random() * Math.max(1, (choices.length ? choices : candidates).length))] || null;
  };
  let offers = Array.isArray(byClan[clan.id]) ? byClan[clan.id] : [];
  const used = new Set();
  offers = offers.slice(0, 5).map((offer) => {
    const definition = CLAN_QUEST_DEFINITIONS.find((entry) => entry.id === offer.definition_id);
    const finished = finishedByOffer.get(String(offer.id));
    if (activeByOffer.has(String(offer.id)) || (!finished && definition?.tier <= maxTier)) {
      if (definition) used.add(definition.id);
      return offer;
    }
    const next = pick(used);
    if (!next) return offer;
    used.add(next.id);
    return { id: store.generateId('clan-quest-offer'), definition_id: next.id, tier: next.tier, available_at: finished?.cooldown_until || new Date(now).toISOString(), created_at: new Date(now).toISOString() };
  });
  while (offers.length < 5) {
    const definition = pick(used);
    if (!definition) break;
    used.add(definition.id);
    offers.push({ id: store.generateId('clan-quest-offer'), definition_id: definition.id, tier: definition.tier, available_at: new Date(now).toISOString(), created_at: new Date(now).toISOString() });
  }
  byClan[clan.id] = offers;
  player.clan_quest_offers = byClan;
  return offers;
}

function expireClanQuests(clan, now = Date.now()) {
  let changed = false;
  for (const quest of clan?.quests || []) {
    if (quest.status === 'ACTIVE' && Date.parse(quest.expires_at || '') <= now) {
      quest.status = 'EXPIRED';
      quest.expired_at = new Date(now).toISOString();
      const owner = store.players.find((player) => String(player.id) === String(quest.owner_id));
      setClanQuestCooldown(owner, clan, quest, now);
      changed = true;
    }
  }
  return changed;
}

function reconcileLegacyClanDonationQuests(clan) {
  let changed = false;
  for (const quest of clan?.quests || []) {
    if (quest.status !== 'ACTIVE' || quest.type !== 'tentacles' || quest.donation_tracking_version) continue;
    const participants = [...new Set([quest.owner_id, ...(quest.participants || [])].map(String))];
    const savedDonations = participants.reduce((sum, playerId) => {
      const player = store.players.find((entry) => String(entry.id) === playerId);
      const byLevel = player?.clan_donation_contributions?.[clan.id] || {};
      return sum + Object.values(byLevel).reduce((total, amount) => total + Math.max(0, Number(amount) || 0), 0);
    }, 0);
    quest.progress = Math.min(Number(quest.target || 0), Math.max(Number(quest.progress || 0), savedDonations));
    quest.donation_tracking_version = 1;
    if (quest.progress >= Number(quest.target || 0)) {
      quest.status = 'COMPLETED';
      quest.completed_at = new Date().toISOString();
      rewardClanQuest(clan, quest);
    }
    changed = true;
  }
  return changed;
}

export function processClanTimers(now = Date.now()) {
  let changed = false;
  for (const clan of store.clans) {
    changed = expireClanQuests(clan, now) || changed;
    for (const request of clan.energy_requests || []) {
      if (request.status === 'ACTIVE' && Date.parse(request.expires_at || '') <= now) {
        request.status = 'EXPIRED';
        changed = true;
      }
    }
  }
  if (changed) store.persistSoon();
}

function rewardClanQuest(clan, quest) {
  if (quest.rewards_granted_at) return;
  const recipients = [...new Set([quest.owner_id, ...(quest.participants || [])])];
  for (const playerId of recipients) {
    const player = store.players.find((entry) => String(entry.id) === String(playerId));
    if (!player || !isClanMember(player, clan)) continue;
    player.tentacles = Number(player.tentacles || 0) + Number(quest.reward?.tentacles || 0);
    grantXpToPlayer(player, Number(quest.reward?.xp || 0));
    const poisonRewards = quest.reward?.poisons || {};
    const poisonIds = { small: 'small-poison', medium: 'medium-poison', large: 'large-poison' };
    if (Object.keys(poisonRewards).length) {
      player.weapon_inventory = { ...(player.weapon_inventory || {}) };
      for (const [type, quantity] of Object.entries(poisonRewards)) {
        const poisonId = poisonIds[type];
        if (poisonId) player.weapon_inventory[poisonId] = Number(player.weapon_inventory[poisonId] || 0) + Math.max(0, Number(quantity || 0));
      }
    }
  }
  addClanAchievementProgress(clan, 'quests', 1);
  quest.rewards_granted_at = new Date().toISOString();
  const owner = store.players.find((player) => String(player.id) === String(quest.owner_id));
  setClanQuestCooldown(owner, clan, quest);
}

function progressClanQuestMetric(clan, player, type, amount) {
  if (!clan) return;
  expireClanQuests(clan);
  for (const quest of clan.quests || []) {
    if (quest.status !== 'ACTIVE' || quest.type !== type) continue;
    const participants = new Set([quest.owner_id, ...(quest.participants || [])].map(String));
    if (!participants.has(String(player.id))) continue;
    quest.contributions = { ...(quest.contributions || {}) };
    quest.contributions[player.id] = Number(quest.contributions[player.id] || 0) + Number(amount || 0);
    quest.progress = Math.min(Number(quest.target || 0), Number(quest.progress || 0) + Number(amount || 0));
    if (Number(quest.progress || 0) >= Number(quest.target || 0)) {
      quest.status = 'COMPLETED';
      quest.completed_at = new Date().toISOString();
      rewardClanQuest(clan, quest);
    }
  }
}

function parseAcquisitionCampaign(startParam = '') {
  const value = String(startParam || '').trim();
  return /^ad_[a-z0-9_-]{1,60}$/i.test(value) ? value : '';
}

function parseReferredBy(startParam = '') {
  const value = String(startParam || '').trim();
  if (!value.startsWith('ref_')) return '';
  return value.slice(4).trim();
}

function normalizeReferredFriend(friend = {}) {
  const referredPlayer = store.players.find(player => String(player.id) === String(friend.playerId));
  friend = { ...friend, battle_pass_tier: referredPlayer ? normalizePlayerProgression(referredPlayer).battle_pass_view?.tier || 'free' : friend.battle_pass_tier || 'free' };
  if (friend.rewardClaimed) return { ...friend, status: 'claimed' };
  if (friend.newbiePart1Done || Number(friend.boss1Damage || 0) >= 150) {
    return { ...friend, status: 'reward_ready' };
  }
  if (Number(friend.boss1Damage || 0) > 0) return { ...friend, status: 'active' };
  return { ...friend, status: friend.status || 'joined' };
}

function syncInviterReferrals(player) {
  if (!player?.referred_by) return;
  const inviter = store.players.find((candidate) => {
    const candidateCode = resolveReferralCode(candidate);
    return candidate.id !== player.id && (candidateCode === player.referred_by || String(candidate.telegram_id || '') === player.referred_by || String(candidate.id || '') === player.referred_by);
  });
  if (!inviter) return;
  const list = Array.isArray(inviter.referred_friends) ? inviter.referred_friends : [];
  const friend = normalizeReferredFriend({
    playerId: player.id,
    username: player.username || 'player',
    joinedAt: player.created_date || new Date().toISOString(),
    boss1Damage: Number(player.boss_damage_lifetime || 0),
    newbiePart1Done: Array.isArray(player.newbie_claimed_parts) && player.newbie_claimed_parts.some(value => value === 1 || value === '1' || value === 'part1'),
    rewardClaimed: Boolean(list.find((entry) => entry?.playerId === player.id)?.rewardClaimed),
  });
  const idx = list.findIndex((entry) => entry?.playerId === player.id);
  const next = [...list];
  if (idx >= 0) next[idx] = { ...next[idx], ...friend };
  else next.push(friend);
  inviter.referred_friends = next;
}

function syncReferredFriendStatuses(inviter) {
  if (!inviter) return;
  const referralCode = resolveReferralCode(inviter);
  if (!referralCode) return;

  store.players
    .filter((candidate) => String(candidate?.referred_by || '') === referralCode)
    .forEach(syncInviterReferrals);
}

function mergePlayerDefaults(payload, session) {
  const referredBy = parseReferredBy(session?.startParam);
  const acquisitionCampaign = parseAcquisitionCampaign(session?.startParam);
  return {
    ...normalizePlayerProgression({
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      hero_tier: 'scavenger',
    }),
    id: store.generateId('player'),
    telegram_id: session?.telegramId || payload.telegram_id || '',
    created_by: session?.email || payload.created_by || '',
    username: payload.username || session?.username || 'player',
    tentacles: 0,
    safe_tentacles: 0,
    safe_capacity: 500,
    premium: 0,
    near_wallet_id: '',
    // This payload is used only while creating a player. Existing profiles are
    // loaded as-is, so energy is not restored on later launches.
    energy: STARTING_ENERGY,
    max_energy: STARTING_ENERGY,
    starter_energy_granted: true,
    welcome_energy_granted: false,
    energy_regen_rate: 1,
    last_energy_update: new Date().toISOString(),
    tentacles_per_hour: 10,
    last_income_collect: new Date().toISOString(),
    attack_power: 10,
    defense_power: 5,
    attack_level: 1,
    defense_level: 1,
    income_level: 1,
    stash_level: 1,
    total_raids: 0,
    successful_raids: 0,
    total_stolen: 0,
    total_lost: 0,
    total_boss_damage: 0,
    boss_kills: 0,
    boss_kills_by_id: {},
    second_boss_warning_seen: false,
    best_medal: '',
    active_location: 'beach',
    collection_items: [],
    collection_item_counts: {},
    collection_rewards_claimed: {},
    collection_boxes: {},
    task_completions: {},
    location_passive_claimed_at: {},
    keycards: {},
    poison_refund_progress: {},
    boss_reward_carries: {},
    weapon_cooldowns: {},
    weapon_inventory: { 'small-poison': 10 },
    stat_strength: 1,
    stat_stealth: 1,
    stat_endurance: 1,
    stat_craft: 1,
    claimed_collection_rows: [],
    claimed_collection_full: [],
    gambling_level: 0,
    gambling_xp: 0,
    blackjack_free_used: '',
    login_streak: 0,
    last_login_date: '',
    clan_name: '',
    boss_hits_today: 0,
    boss_damage_today: 0,
    boss_damage_lifetime: 0,
    raid_boss_hits_today: 0,
    energy_spent_total: 0,
    energy_spent_today: 0,
    opened_boxes_total: 0,
    pending_boss_boxes: [],
    gift_mail_read_ids: [],
    social_slaps_total: 0,
    starter_guide_claimed: [],
    starter_guide_final_claimed: false,
    starter_set_fragments: 0,
    total_tasks_today: 0,
    used_promo_codes: [],
    talent_points: 0,
    talent_progress: 0,
    talent_progress_goal: 2000,
    boss_talent_progress: 0,
    boss_talent_progress_goal: 500,
    boss_talent_level: 1,
    talent_tree_version: 2,
    talent_levels: {},
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
    referral_code: session?.telegramId || '',
    referred_by: referredBy,
    ...(acquisitionCampaign ? { acquisition_campaign: acquisitionCampaign, acquisition_at: new Date().toISOString(), acquisition_source: 'telegram_ads' } : {}),
    referred_friends: [],
    referral_rewards_claimed: [],
    referral_invite_boxes: [],
    referral_starter_claimed: false,
    ...payload,
  };
}

function getBossById(bossId) {
  return GAME_CONFIG.BOSSES.find((boss) => boss.id === bossId) || null;
}

function getWeaponById(weaponId) {
  return GAME_CONFIG.WEAPONS.find((weapon) => weapon.id === weaponId) || null;
}

function createTonProofPayloadValue() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function normalizeWalletLink(walletLink) {
  if (!walletLink) return null;

  return {
    id: walletLink.id,
    player_id: walletLink.player_id,
    chain: walletLink.chain,
    network: walletLink.network,
    address: walletLink.address,
    provider: walletLink.provider,
    label: walletLink.label || '',
    short_address: walletLink.short_address || `${walletLink.address.slice(0, 6)}...${walletLink.address.slice(-4)}`,
    connected_at: walletLink.connected_at,
    last_verified_at: walletLink.last_verified_at,
    proof_status: walletLink.proof_status || 'not_requested',
  };
}

function listPlayerWallets(playerId) {
  return store.walletLinks
    .filter((walletLink) => walletLink.player_id === playerId)
    .map(normalizeWalletLink);
}

function normalizeChatMessage(message, currentPlayer = null, playerById = null) {
  const author = playerById?.get(String(message.player_id)) || store.players.find((player) => String(player.id) === String(message.player_id));
  return {
    ...message,
    author: author?.nickname || message.author,
    avatar: message.avatar || author?.avatar || author?.photoUrl || author?.photo_url || '',
    avatar_frame_id: message.avatar_frame_id || author?.avatar_frame_id || author?.selected_avatar_frame || '',
    battle_pass_tier: author?.battle_pass?.tier || 'free',
    own: currentPlayer ? message.player_id === currentPlayer.id : false,
  };
}

function isValidTonAddress(address) {
  return /^[A-Za-z0-9_-]{32,128}$/.test(String(address || '').trim());
}

function upsertTonWalletLink(player, { address, network, provider, label, proofStatus = 'not_requested', proof = null }) {
  const now = new Date().toISOString();
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const existingWallet = store.walletLinks.find(
    (walletLink) => walletLink.player_id === player.id && walletLink.chain === 'ton'
  );

  if (existingWallet) {
    Object.assign(existingWallet, {
      address,
      network,
      provider,
      label,
      short_address: shortAddress,
      last_verified_at: now,
      proof_status: proofStatus,
      ton_proof: proof,
    });

    return {
      wallet: existingWallet,
      created: false,
    };
  }

  const wallet = {
    id: store.generateId('wallet'),
    player_id: player.id,
    chain: 'ton',
    network,
    address,
    provider,
    label,
    short_address: shortAddress,
    connected_at: now,
    last_verified_at: now,
    proof_status: proofStatus,
    ton_proof: proof,
  };

  store.walletLinks.push(wallet);

  return {
    wallet,
    created: true,
  };
}

function ensureCurrentPlayer(request) {
  const session = getSessionFromHeaders(request.headers);
  if (!session) return null;

  const existingPlayer = store.players.find((candidate) =>
    String(candidate.telegram_id || '') === String(session.telegramId || '') ||
    Boolean(session.email) && String(candidate.created_by || '').toLowerCase() === String(session.email).toLowerCase()
  );
  if (existingPlayer?.is_banned) return null;

  let player = getCurrentPlayer(request);
  if (!player) {
    player = mergePlayerDefaults({}, session);
    if (player.referred_by) {
      grantEnergyGain(player, 100, 'referral_starter');
      player.tentacles = Number(player.tentacles || 0) + 300;
      player.weapon_inventory = {
        ...(player.weapon_inventory || {}),
        'small-poison': Number((player.weapon_inventory || {})['small-poison'] || 0) + 1,
      };
      player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + 1;
      player.referral_starter_claimed = true;
    }
    player = playerDb.addPlayer(player);
  }
  if (!player.referral_code) {
    player.referral_code = resolveReferralCode(player);
  }
  consolidatePendingBossBoxes(player);
  const telegramPhotoUrl = String(session.photoUrl || session.avatar || '').trim();
  if (telegramPhotoUrl && (player.avatar !== telegramPhotoUrl || player.photoUrl !== telegramPhotoUrl)) {
    player.avatar = telegramPhotoUrl;
    player.photoUrl = telegramPhotoUrl;
  }
  if (player.referred_by && !player.referral_starter_claimed) {
    grantEnergyGain(player, 100, 'referral_starter');
    player.tentacles = Number(player.tentacles || 0) + 300;
    player.weapon_inventory = {
      ...(player.weapon_inventory || {}),
      'small-poison': Number((player.weapon_inventory || {})['small-poison'] || 0) + 1,
    };
    player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + 1;
    player.referral_starter_claimed = true;
  }
  player.referred_friends = Array.isArray(player.referred_friends) ? player.referred_friends.map(normalizeReferredFriend) : [];
  syncInviterReferrals(player);
  syncReferredFriendStatuses(player);
  const now = Date.now();
  const previousSeenAt = Date.parse(player.last_seen_at || '');
  if (!Number.isFinite(previousSeenAt) || now - previousSeenAt >= 5 * 60 * 1000) {
    player.last_seen_at = new Date(now).toISOString();
    const reminders = { ...(player.telegram_reminder_attempts || {}) };
    if (reminders.inactive) {
      delete reminders.inactive;
      player.telegram_reminder_attempts = reminders;
    }
  }
  player.last_login_date = getTodayKey();
  recordBattlePassEvent(player, { type: 'login' });
  syncNewbiePackOffers(player);

  return player;
}

function materializePlayerState(player) {
  if (!player) return null;
  reconcileGuaranteedQuestArtifacts(player);
  const snapshot = buildPlayerStateSnapshot(player);
  const now = new Date().toISOString();
  if (Number(snapshot.energy || 0) !== Number(player.energy || 0)) {
    player.energy = snapshot.energy;
    player.last_energy_update = now;
  }
  if (Number(snapshot.tentacles || 0) !== Number(player.tentacles || 0)) {
    player.tentacles = snapshot.tentacles;
    player.last_income_collect = now;
  }
  return player;
}

function isSimEnabled() {
  const raw = String(process.env.ENABLE_SIMULATED_PLAYERS || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === '"true"' || raw.includes('true');
}

function getSimApiToken() {
  return String(process.env.SIM_API_TOKEN || '').trim();
}

function hasValidSimApiToken(request) {
  const token = getSimApiToken();
  if (!token) return !IS_PRODUCTION;
  const authHeader = String(request.headers.authorization || '').trim();
  const headerToken = String(request.headers['x-sim-api-token'] || '').trim();
  const providedToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : headerToken;
  return providedToken === token;
}

function getSimMaxBots() {
  const raw = Number(process.env.SIM_MAX_BOTS || SIM_MAX_BOTS_DEFAULT);
  return Number.isFinite(raw) && raw > 0 ? raw : SIM_MAX_BOTS_DEFAULT;
}

function enforceSimRateLimit(simPlayerId) {
  const now = Date.now();
  const bucket = simRateMap.get(simPlayerId) || [];
  const filtered = bucket.filter((ts) => now - ts < 60000);
  if (filtered.length >= SIM_RATE_LIMIT_PER_MIN) return false;
  filtered.push(now);
  simRateMap.set(simPlayerId, filtered);
  return true;
}

function findSimPlayer(playerId) {
  const player = store.players.find((p) => p.id === playerId);
  if (!player || !isSimulatedPlayer(player)) return null;
  return hydratePlayerState(player);
}

function logSimAction(playerId, action, payload = {}, result = {}) {
  simActionLogs.push({
    id: store.generateId('sim-log'),
    playerId,
    action,
    payload,
    result,
    createdAt: new Date().toISOString(),
  });
}

function getSimMissionList(player) {
  const level = Math.max(1, Number(player?.level || 1));
  return GAME_CONFIG.TASKS.filter((task) => level >= Number(task.minLevel || 1));
}

function getAvailableBosses(player) {
  const level = Math.max(1, Number(player?.level || 1));
  const availableBosses = GAME_CONFIG.BOSSES.slice(0, Math.max(0, GAME_CONFIG.BOSSES.length - 3));
  return availableBosses.filter((boss) => level >= Number(boss.minLevel || 1));
}

function isComingSoonBoss(bossId) {
  const bossIndex = GAME_CONFIG.BOSSES.findIndex((boss) => boss.id === bossId);
  return bossIndex >= 0 && bossIndex >= GAME_CONFIG.BOSSES.length - 3;
}

function getAvailableSkillIds() {
  return GAME_CONFIG.WEAPONS.map((weapon) => weapon.id);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSimPlayerState(player) {
  const taskCompletions = player?.task_completions || {};
  const newbieClaims = Array.isArray(player?.newbie_claimed_quests) ? player.newbie_claimed_quests : [];
  const dayClaims = player?.sim_daily_claims || {};
  return {
    playerId: player.id,
    isBot: true,
    botType: player.botType,
    username: player.username,
    level: player.level || 1,
    xp: player.xp || 0,
    energy: player.energy || 0,
    tentacles: player.tentacles || 0,
    premium: player.premium || 0,
    strength: player.stat_strength || 1,
    currentLocation: player.active_location || 'beach',
    newbieQuestProgress: SIM_NEWBIE_QUESTS.map((quest) => ({
      id: quest.id,
      claimed: newbieClaims.includes(quest.id),
      progress: quest.type === 'missions'
        ? Number(Object.values(taskCompletions).reduce((sum, v) => sum + (Number(v) || 0), 0))
        : Number(player.boss_damage_lifetime || 0),
      goal: quest.goal,
    })),
    availableMissions: getSimMissionList(player).map((task) => ({ id: task.id, energyCost: task.energyCost, tentacles: task.tentacles, xp: task.xp })),
    availableBosses: getAvailableBosses(player).map((boss) => ({ id: boss.id, hp: boss.maxHp })),
    bossCooldowns: {},
    skillCooldowns: player.weapon_cooldowns || {},
    inventory: {
      weapon_inventory: player.weapon_inventory || {},
      inventory_items: player.inventory_items || [],
      keycards: player.keycards || {},
    },
    unopenedBoxes: player.pending_boss_boxes || [],
    dailyStatus: {
      today: getTodayKey(),
      claimedTaskIds: Object.keys(dayClaims).filter((taskId) => dayClaims[taskId] === getTodayKey()),
      tasks: SIM_DAILY_TASKS,
    },
    roulette: {
      lastFreeSpin: player.roulette_last_free_spin || null,
      bonusSpins: player.roulette_bonus_spins || 0,
    },
  };
}

function applyMission(player, missionId) {
  const mission = GAME_CONFIG.TASKS.find((task) => task.id === missionId);
  if (!mission) {
    const error = new Error('Mission not found');
    error.code = 'MISSION_NOT_FOUND';
    throw error;
  }
  if (!canSpendTutorialEnergyOnMission(player, null)) {
    const error = new Error('During the newbie tutorial, energy can only be spent on the highlighted first-planet quest');
    error.code = 'TUTORIAL_ENERGY_RESTRICTED';
    throw error;
  }
  const localTester = isLocalTester(player);
  if (!localTester && (player.energy || 0) < mission.energyCost) {
    const error = new Error('Not enough energy');
    error.code = 'NOT_ENOUGH_ENERGY';
    throw error;
  }
  const success = Math.random() <= Number(mission.successRate || 1);
  if (!localTester) {
    player.energy = Math.max(0, (player.energy || 0) - mission.energyCost);
    player.last_energy_update = new Date().toISOString();
  }
  console.log('[energy] updated', {
    source: 'mission_spend',
    playerId: player.id,
    currentEnergy: player.energy,
    regenCap: Number(player.max_energy || GAME_CONFIG.MAX_ENERGY_BASE),
  });
  if (!localTester) {
    player.energy_spent_total = (player.energy_spent_total || 0) + mission.energyCost;
    player.energy_spent_today = (player.energy_spent_today || 0) + mission.energyCost;
  }
  player.total_tasks_today = (player.total_tasks_today || 0) + 1;
  const clan = getClanForPlayer(player);
  progressClanQuestMetric(clan, player, 'energy', mission.energyCost);
  progressClanQuestMetric(clan, player, 'missions', 1);
  player.task_completions = { ...(player.task_completions || {}), [missionId]: ((player.task_completions || {})[missionId] || 0) + 1 };
  if (success) {
    player.tentacles = (player.tentacles || 0) + Number(mission.tentacles || 0);
    progressClanQuestMetric(clan, player, 'tentacles', Number(mission.tentacles || 0));
    grantXpToPlayer(player, Number(mission.xp || 0));
    recordBattlePassEvent(player, { type: 'mission', success: true, energy: mission.energyCost, dm: mission.tentacles });
  }
  if (mission.keycardChance > 0 && Math.random() < mission.keycardChance) {
    player.keycards = { ...(player.keycards || {}), [mission.location]: ((player.keycards || {})[mission.location] || 0) + 1 };
  }
  return {
    missionId,
    success,
    spentEnergy: mission.energyCost,
    gainedTentacles: success ? Number(mission.tentacles || 0) : 0,
    gainedXp: success ? Number(mission.xp || 0) : 0,
    questProgress: player.task_completions[missionId],
  };
}

function pickSkillId(skillId) {
  if (!skillId) return 'fist';
  const aliasMap = { finger: 'fist', pencil: 'knuckle', 'small-poison': 'satchel', 'medium-poison': 'f4', 'large-poison': 'c4' };
  return aliasMap[skillId] || skillId;
}

function getOrCreateBossFight(bossId) {
  const existing = store.bossFights.find((fight) => fight.boss_id === bossId && fight.status === 'active');
  if (existing) return existing;
  const boss = getBossById(bossId);
  if (!boss) return null;
  const fight = {
    id: store.generateId('fight'),
    boss_id: boss.id,
    boss_name: boss.name,
    location: boss.location,
    max_hp: boss.maxHp,
    current_hp: boss.maxHp,
    status: 'active',
    opened_by_email: 'simulator@local',
    started_at: new Date().toISOString(),
  };
  store.bossFights.push(fight);
  return fight;
}

function applyBossAttack(player, bossId, rawSkillId) {
  if (isComingSoonBoss(bossId)) {
    const error = new Error('Boss is not unlocked yet');
    error.code = 'BOSS_NOT_UNLOCKED';
    throw error;
  }
  const fight = getOrCreateBossFight(bossId);
  if (!fight) {
    const error = new Error('Boss not found');
    error.code = 'BOSS_NOT_FOUND';
    throw error;
  }
  const skillId = pickSkillId(rawSkillId);
  const weapon = getWeaponById(skillId);
  if (!weapon) {
    const error = new Error('Skill not found');
    error.code = 'SKILL_NOT_FOUND';
    throw error;
  }
  const effective = buildEffectiveWeapon(weapon, player);
  const localTester = isLocalTester(player);
  const lastUsed = (player.weapon_cooldowns || {})[weapon.id];
  if (!localTester && effective.cooldownMin > 0 && lastUsed && (new Date() - new Date(lastUsed)) / 60000 < effective.cooldownMin) {
    const error = new Error('Skill cooldown active');
    error.code = 'SKILL_COOLDOWN_ACTIVE';
    throw error;
  }
  const poisonInventoryId = { satchel: 'small-poison', f4: 'medium-poison', c4: 'large-poison' }[effective.id];
  if (poisonInventoryId && Number((player.weapon_inventory || {})[poisonInventoryId] || 0) <= 0) {
    const error = new Error('No poison in inventory');
    error.code = 'NO_POISON_INVENTORY';
    throw error;
  }
  if (poisonInventoryId) {
    player.weapon_inventory = {
      ...(player.weapon_inventory || {}),
      [poisonInventoryId]: Math.max(0, Number((player.weapon_inventory || {})[poisonInventoryId] || 0) - 1),
    };
  }
  if (!localTester) player.weapon_cooldowns = { ...(player.weapon_cooldowns || {}), [weapon.id]: new Date().toISOString() };
  const variance = 0.85 + Math.random() * 0.3;
  const damage = Math.max(1, Math.floor((effective.damage || 1) * variance * getCollectionDamageBonus(player)));
  const damageBefore = Math.max(0, Number(fight.current_hp || 0));
  const actualDamage = Math.min(damageBefore, damage);
  fight.current_hp = Math.max(0, damageBefore - actualDamage);
  fight.status = fight.current_hp <= 0 ? 'dead' : 'active';
  if (fight.current_hp <= 0) fight.ended_at = new Date().toISOString();
  let damageLog = store.bossDamageLogs.find((log) => log.fight_id === fight.id && log.player_email === player.created_by);
  if (!damageLog) {
    damageLog = {
      id: store.generateId('damage'),
      fight_id: fight.id,
      player_email: player.created_by,
      player_name: player.nickname || player.username,
      avatar: player.avatar || player.photoUrl || '',
      avatar_frame_id: player.avatar_frame_id || 'frame1',
      damage: 0,
      hits: 0,
    };
    store.bossDamageLogs.push(damageLog);
  }
  damageLog.damage = Number(damageLog.damage || 0) + actualDamage;
  if (poisonInventoryId) {
    const poisonType = poisonInventoryId.replace('-poison', '');
    damageLog.poison_damage = Number(damageLog.poison_damage || 0) + actualDamage;
    damageLog.poison_refund_units = {
      ...(damageLog.poison_refund_units || {}),
      [poisonType]: Number(damageLog.poison_refund_units?.[poisonType] || 0) + actualDamage / Math.max(1, damage),
    };
  }
  damageLog.hits = Number(damageLog.hits || 0) + 1;
  player.boss_hits_today = Number(player.boss_hits_today || 0) + 1;
  progressClanQuestMetric(getClanForPlayer(player), player, 'hits', 1);
  player.boss_damage_today = Number(player.boss_damage_today || 0) + actualDamage;
  player.boss_damage_lifetime = Number(player.boss_damage_lifetime || 0) + actualDamage;
  player.total_boss_damage = Number(player.total_boss_damage || 0) + actualDamage;
  awardTalentProgressV2(player, actualDamage);
  if (fight.status === 'dead') {
    fight.last_hit_player_id = player.id;
    fight.last_hit_player_name = player.nickname || player.username || 'Player';
    player.boss_kills = Number(player.boss_kills || 0) + 1;
    player.boss_kills_by_id = { ...(player.boss_kills_by_id || {}), [fight.boss_id]: Number((player.boss_kills_by_id || {})[fight.boss_id] || 0) + 1 };
    distributeBossBoxesForFinishedFight(fight);
  }
  return {
    bossId,
    skillId: weapon.id,
    damageDealt: actualDamage,
    bossHp: fight.current_hp,
    bossStatus: fight.status,
    cooldownApplied: effective.cooldownMin || 0,
  };
}

function distributeBossBoxesForFinishedFight(fight, extrasByEmail = {}) {
  if (!fight || fight.status !== 'dead') return { distributed: false, reason: 'not_dead', players: 0, boxes: 0 };
  if (fight.rewards_distributed_at) return { distributed: false, reason: 'already_distributed', players: 0, boxes: 0 };

  const logs = store.bossDamageLogs
    .filter((item) => item.fight_id === fight.id)
    .filter((item) => Number(item?.damage || 0) > 0)
    .sort((a, b) => (b.damage || 0) - (a.damage || 0));

  const boss = getBossById(fight.boss_id);
  const maxHp = Math.max(1, Number(fight.max_hp || boss?.maxHp) || 1);
  let playersUpdated = 0;
  const boxes = [];

  for (let idx = 0; idx < logs.length; idx += 1) {
    const log = logs[idx];
    if (!log?.player_email) continue;
    // Ordinary personal fights keep rewards with the owner. Once clan members
    // join an invitation fight, distribute damage-based boxes to contributors.
    if (!shouldReceiveBossFightDamageReward(fight, log)) continue;
    const participant = store.players.find((p) => p.created_by === log.player_email);
    if (!participant) continue;

    const box = queueBossDamageRewardBox(participant, {
      bossId: fight.boss_id, fightId: fight.id, maxHp, damage: log.damage,
      poisonRefundUnits: log.poison_refund_units || {}, rank: idx + 1,
      lastHitPlayerName: fight.last_hit_player_name || '',
      ...(extrasByEmail[String(log.player_email).toLowerCase()] || {}),
    });
    if (box) {
      boxes.push(box);
      playersUpdated += 1;
    }
  }

  fight.rewards_distributed_at = new Date().toISOString();
  return { distributed: true, reason: 'ok', players: playersUpdated, boxes: boxes.length, rewardBoxes: boxes };
}

const BOSS_BOX_LEVELS = {
  standard_boss: 0, damage_box_1: 1, damage_box_2: 2, damage_box_3: 3, damage_box_4: 4, damage_box_5: 5,
  top_small: 2, top_bronze: 3, top_silver: 4, top_gold: 5,
};

function getHighestBossBoxType(boxTypes = []) {
  return boxTypes.reduce((highest, boxType) => (
    (BOSS_BOX_LEVELS[boxType] || 0) > (BOSS_BOX_LEVELS[highest] || 0) ? boxType : highest
  ), boxTypes[0] || 'standard_boss');
}

function applyQuestMission(player, rawTask = {}) {
  const missionId = String(rawTask.id || '').trim();
  const mission = getQuestMission(missionId);
  if (!mission || !isQuestLocationUnlocked(player, mission.locationId)) {
    const error = new Error('Mission not found');
    error.code = 'MISSION_NOT_FOUND';
    throw error;
  }
  if (!canSpendTutorialEnergyOnMission(player, missionId)) {
    const error = new Error('During the newbie tutorial, complete the highlighted first-planet quests in order');
    error.code = 'TUTORIAL_ENERGY_RESTRICTED';
    throw error;
  }
  rawTask = mission;
  let finalLocationIndex = -1;
  if (missionId.endsWith('-final')) {
    finalLocationIndex = Number(mission.locationId.slice(-2));
    const finalLoops = Math.floor(Number(player.task_completions?.[missionId] || 0) / mission.target);
    const unlocked = ['scout', 'loot', 'repair', 'trade', 'fight', 'cache'].every((slug) => {
      const previous = getQuestMission(`${mission.locationId}-${slug}`);
      return previous && Math.floor(Number(player.task_completions?.[previous.id] || 0) / previous.target) > finalLoops;
    });
    if (!unlocked) {
      const error = new Error('Final mission is locked');
      error.code = 'MISSION_LOCKED';
      throw error;
    }
  }
  const energyCost = Math.max(1, Math.min(100, Math.floor(Number(rawTask.energy ?? rawTask.energyCost) || 0)));
  const tentaclesReward = Math.max(0, Math.min(100000, Math.floor(Number(rawTask.tentacles) || 0)));
  const xpReward = Math.max(0, Math.min(10000, Math.floor(Number(rawTask.xp) || 0)));
  const strengthReward = Math.max(0, Math.min(1000, Math.floor(Number(rawTask.strength) || 0)));
  const successRate = Math.max(0, Math.min(1, Number(rawTask.successRate ?? 1)));
  if (Number(player.energy || 0) < energyCost) {
    const error = new Error('Not enough energy');
    error.code = 'NOT_ENOUGH_ENERGY';
    throw error;
  }
  player.energy = Math.max(0, Number(player.energy || 0) - energyCost);
  player.last_energy_update = new Date().toISOString();
  player.energy_spent_total = Number(player.energy_spent_total || 0) + energyCost;
  player.energy_spent_today = Number(player.energy_spent_today || 0) + energyCost;
  player.total_tasks_today = Number(player.total_tasks_today || 0) + 1;
  player.task_completions = { ...(player.task_completions || {}), [missionId]: Number((player.task_completions || {})[missionId] || 0) + 1 };
  const success = Math.random() <= successRate;
  if (success) {
    player.tentacles = Number(player.tentacles || 0) + tentaclesReward;
    player.stat_strength = Number(player.stat_strength || 1) + strengthReward;
    grantXpToPlayer(player, xpReward);
  }
  const collectionDrop = grantQuestArtifact(player, mission, success);
  let keyDrop = null;
  let poisonDrop = null;
  if (success && finalLocationIndex >= 0) {
    const nextBoss = GAME_CONFIG.BOSSES[finalLocationIndex + 1];
    if (nextBoss?.keycardLocation && Math.random() < 0.1) {
      const location = nextBoss.keycardLocation;
      player.keycards = { ...(player.keycards || {}), [location]: Number(player.keycards?.[location] || 0) + 1 };
      keyDrop = { keycardLocation: location, bossId: nextBoss.id };
    }
    const poisonId = ['small-poison', 'small-poison', 'medium-poison', 'medium-poison', 'medium-poison', 'large-poison', 'large-poison', 'large-poison'][finalLocationIndex];
    if (poisonId && Math.random() < 0.01) {
      player.weapon_inventory = { ...(player.weapon_inventory || {}), [poisonId]: Number(player.weapon_inventory?.[poisonId] || 0) + 1 };
      poisonDrop = { id: poisonId };
    }
  }
  const clan = getClanForPlayer(player);
  progressClanQuestMetric(clan, player, 'energy', energyCost);
  progressClanQuestMetric(clan, player, 'missions', 1);
  if (success) progressClanQuestMetric(clan, player, 'tentacles', tentaclesReward);
  recordBattlePassEvent(player, { type: 'mission', success, energy: energyCost, dm: success ? tentaclesReward : 0 });
  return {
    missionId,
    success,
    spentEnergy: energyCost,
    gainedTentacles: success ? tentaclesReward : 0,
    gainedXp: success ? xpReward : 0,
    questProgress: player.task_completions[missionId],
    collectionDrop,
    keyDrop,
    poisonDrop,
  };
}

function queueCombinedBossBox(player, boxes, bossId, fightId, bonusDrops = []) {
  const rewardBoxTypes = boxes.flatMap((box) => (
    Array.isArray(box?.rewardBoxTypes) && box.rewardBoxTypes.length ? box.rewardBoxTypes : [box?.boxType]
  )).filter(Boolean);
  if (!rewardBoxTypes.length) return null;
  const combinedBox = {
    boxType: getHighestBossBoxType(rewardBoxTypes), label: 'Boss Reward Box', rewardBoxTypes, bossId, fightId,
    instanceId: store.generateId(`boss-box-${fightId}-combined`),
    bonusDrops: Array.isArray(bonusDrops) ? bonusDrops.filter(Boolean) : [],
  };
  player.pending_boss_boxes = [...(player.pending_boss_boxes || []), combinedBox];
  return combinedBox;
}

function getBossRewardRuntimeConfig() {
  return sanitizeBossRewardConfig(store.bossRewardConfig || DEFAULT_BOSS_REWARD_CONFIG);
}

function getBossSpecialKinds(player, bossId) {
  const kinds = [];
  if (getBossEquipmentSetItemIds(bossId).length) kinds.push('gear');
  if (getBossPetPool(bossId).length) kinds.push('pet');
  if (BOSS_BACKGROUND_REWARDS[bossId]) kinds.push('background');
  return kinds;
}

function queueBossDamageRewardBox(player, {
  bossId, fightId, maxHp, damage, poisonRefundUnits = {}, rank = 101, firstKillDrops = [], pityDrops = [], lastHitPlayerName = '',
}) {
  const pending = Array.isArray(player.pending_boss_boxes) ? player.pending_boss_boxes : [];
  if (pending.some((box) => box?.fightId === fightId && box?.bossId === bossId && box?.rewardFormula === 'boss_v2')) return null;

  const bossIndex = GAME_CONFIG.BOSSES.findIndex((boss) => boss.id === bossId);
  const nextBoss = GAME_CONFIG.BOSSES[bossIndex + 1] || null;
  const config = getBossRewardRuntimeConfig();
  const reward = calculateBossReward({
    bossId, maxHp, actualDamageTotal: damage, poisonRefundUnits, rank,
    availableSpecials: getBossSpecialKinds(player, bossId), firstKillDrops, pityDrops,
    carries: { resources: player.boss_reward_carries, poison: player.poison_refund_progress },
    config,
  });
  if (!reward.eligible) return null;

  player.boss_reward_carries = reward.carries.resources;
  player.poison_refund_progress = reward.carries.poison;
  const rewardSnapshot = reward.drops.map((drop) => {
    if (drop.type === 'boss_gear_piece') return resolveBossEquipmentDrop(player, bossId);
    if (drop.type === 'boss_pet') return resolveBossPetDrop(player, bossId);
    if (drop.type === 'boss_background') return resolveBossBackgroundDrop(player, bossId);
    return drop;
  }).filter(Boolean);
  const box = {
    boxType: reward.boxType,
    label: 'Boss Reward Box',
    bossId,
    fightId,
    rewardFormula: 'boss_v2',
    bossDefeated: true,
    lastHitPlayerName,
    rewardSnapshot: limitBossBoxEquipment(rewardSnapshot),
    rank: reward.rank,
    rankFrame: reward.rankFrame,
    damage: reward.actualDamageTotal,
    maxHp: Math.max(1, Number(maxHp) || 1),
    damageShare: reward.damageShare,
    rewardMeta: {
      participationThreshold: reward.participationThreshold,
      bossMultiplier: reward.bossMultiplier,
      randomMultiplier: reward.randomMultiplier,
      rankMultiplier: reward.rankMultiplier,
      specialChance: reward.specialChance,
    },
    instanceId: store.generateId(`boss-box-${fightId}-reward`),
  };
  player.pending_boss_boxes = [...pending, box];
  return box;
}

function consolidatePendingBossBoxes(player) {
  const pending = Array.isArray(player?.pending_boss_boxes) ? player.pending_boss_boxes : [];
  const grouped = new Map();
  const passthrough = [];
  pending.forEach((box) => {
    if (box?.rewardFormula === 'damage_v1' || box?.rewardFormula === 'boss_v2') return passthrough.push(box);
    if (!box?.fightId || !box?.bossId || !BOSS_BOX_LEVELS[box.boxType]) return passthrough.push(box);
    const key = `${box.fightId}:${box.bossId}`;
    grouped.set(key, [...(grouped.get(key) || []), box]);
  });
  const merged = Array.from(grouped.values()).map((boxes) => {
    if (boxes.length === 1 && Array.isArray(boxes[0].rewardBoxTypes)) return boxes[0];
    const first = boxes[0];
    const rewardBoxTypes = boxes.flatMap((box) => (
      Array.isArray(box.rewardBoxTypes) && box.rewardBoxTypes.length ? box.rewardBoxTypes : [box.boxType]
    ));
    return {
      boxType: getHighestBossBoxType(rewardBoxTypes), label: 'Boss Reward Box', rewardBoxTypes,
      bossId: first.bossId, fightId: first.fightId,
      instanceId: store.generateId(`boss-box-${first.fightId}-combined`),
      bonusDrops: boxes.flatMap((box) => Array.isArray(box?.bonusDrops) ? box.bonusDrops : []),
    };
  });
  player.pending_boss_boxes = [...passthrough, ...merged];
}

function resolveBossRewards(fight) {
  return distributeBossBoxesForFinishedFight(fight);
}

function awardTalentProgressV2(player, damage) {
  Object.assign(player, awardTalentDamage(player, damage));
}

function getBossFightOwner(fight) {
  const ownerEmail = String(fight?.opened_by_email || '').trim().toLowerCase();
  if (!ownerEmail) return null;
  return store.players.find((player) => String(player?.created_by || '').trim().toLowerCase() === ownerEmail) || null;
}

function addBossFightDamageLog(fight, player, damage, hits, combatMeta = {}) {
  let damageLog = store.bossDamageLogs.find(
    (item) => item.fight_id === fight.id && item.player_email === player.created_by
  );

  if (damageLog) {
    damageLog.damage = Number(damageLog.damage || 0) + damage;
    damageLog.hits = Number(damageLog.hits || 0) + hits;
    damageLog.poison_damage = Number(damageLog.poison_damage || 0) + Number(combatMeta.poisonDamage || 0);
    const refundUnits = { ...(damageLog.poison_refund_units || {}) };
    Object.entries(combatMeta.poisonRefundUnits || {}).forEach(([type, amount]) => {
      refundUnits[type] = Number(refundUnits[type] || 0) + Number(amount || 0);
    });
    damageLog.poison_refund_units = refundUnits;
    return damageLog;
  }

  damageLog = {
    id: store.generateId('damage'),
    fight_id: fight.id,
    player_email: player.created_by,
    player_name: player.nickname || player.username,
    avatar: player.avatar || player.photoUrl || '',
    avatar_frame_id: player.avatar_frame_id || 'frame1',
    damage,
    hits,
    poison_damage: Number(combatMeta.poisonDamage || 0),
    poison_refund_units: { ...(combatMeta.poisonRefundUnits || {}) },
  };
  store.bossDamageLogs.push(damageLog);
  return damageLog;
}

function applyDamageToPersonalBossFight(fight, player, damage, hits, endedAt, combatMeta = {}) {
  const hpBefore = Math.max(0, Number(fight.current_hp || 0));
  const appliedDamage = Math.min(hpBefore, damage);
  const currentHp = Math.max(0, hpBefore - appliedDamage);
  const defeated = currentHp <= 0;

  const poison = calculateActualPoisonRefundUnits({
    actualDamage: appliedDamage,
    poisonDamage: combatMeta.poisonDamage,
    plannedPoisonDamage: combatMeta.plannedPoisonDamage,
    consumedUses: combatMeta.consumedPoisonUses,
    attackCount: combatMeta.attackCount,
  });
  const poisonRefundUnits = {};
  if (poison.refundUnits > 0 && combatMeta.poisonType) {
    poisonRefundUnits[combatMeta.poisonType] = poison.refundUnits;
  }

  fight.current_hp = currentHp;
  fight.status = defeated ? 'dead' : 'active';
  if (defeated) {
    fight.ended_at = endedAt;
    fight.last_hit_player_id = player.id;
    fight.last_hit_player_name = player.nickname || player.username || 'Player';
  }

  return {
    fight,
    damageLog: addBossFightDamageLog(fight, player, appliedDamage, hits, { poisonDamage: poison.actualPoisonDamage, poisonRefundUnits }),
    appliedDamage,
    hpBefore,
    defeated,
  };
}

// Passive bleed is processed independently of the next player action. Runtime state
// is scoped to a concrete fight id, so a new boss never inherits old marks or bleed.
export function processTalentBleedTicks(now = Date.now()) {
  let processed = 0;
  let fightsById;
  const changedPlayerIds = new Set();
  for (const player of store.players || []) {
    const states = player?.talent_combat_state;
    if (!states || typeof states !== 'object') continue;
    let nextStates = states;
    for (const [fightId, rawState] of Object.entries(states)) {
      const tick = getBleedTicks(rawState, now);
      if (tick.state !== rawState) {
        if (nextStates === states) nextStates = { ...states };
        nextStates[fightId] = tick.state;
      }
      if (!tick.damage) continue;
      if (!fightsById) {
        fightsById = new Map();
        for (const fight of store.bossFights) {
          if (!fightsById.has(fight.id)) fightsById.set(fight.id, fight);
        }
      }
      const fight = fightsById.get(fightId);
      if (!fight || !isActiveBossFight(fight)) continue;
      const hpBefore = Number(fight.current_hp || 0);
      const impact = applyDamageToPersonalBossFight(fight, player, tick.damage, 0, new Date(now).toISOString());
      if (impact.appliedDamage > 0) fight.last_bleed_tick = { at: now, damage: impact.appliedDamage, playerId: player.id };
      if (nextStates === states) nextStates = { ...states };
      nextStates[fightId] = registerHpThresholds(tick.state, hpBefore, Number(fight.current_hp || 0), Number(fight.max_hp || 1));
      player.boss_damage_today = Number(player.boss_damage_today || 0) + impact.appliedDamage;
      player.boss_damage_lifetime = Number(player.boss_damage_lifetime || 0) + impact.appliedDamage;
      awardTalentProgressV2(player, impact.appliedDamage);
      processed += 1;
      if (impact.defeated) settlePersonalBossFightDefeat({ fight, owner: player, ownerDamageLog: impact.damageLog, includeOwnerDamage: true });
    }
    if (nextStates !== states) {
      player.talent_combat_state = nextStates;
      changedPlayerIds.add(player.id);
    }
  }
  if (processed) {
    store.persistSoon(50);
    void playerDb.flushDirtyPlayers([...changedPlayerIds]).catch(() => {});
  }
  return processed;
}

function settlePersonalBossFightDefeat({ fight }) {
  const owner = getBossFightOwner(fight);
  if (!fight || fight.status !== 'dead' || !owner || fight.personal_progression_distributed_at) return null;

  const logs = store.bossDamageLogs
    .filter((item) => item.fight_id === fight.id)
    .sort((a, b) => (b.damage || 0) - (a.damage || 0));
  const ownerLog = logs.find((log) => String(log.player_email || '').toLowerCase() === String(owner.created_by || '').toLowerCase()) || null;
  const ownerRank = logs.findIndex((log) => log.player_email === owner.created_by) + 1 || logs.length + 1;
  const bossIndex = GAME_CONFIG.BOSSES.findIndex((item) => item.id === fight.boss_id);
  if (!fight.battle_pass_victory_processed_at) {
    recordBattlePassBossVictory(owner, fight.id, bossIndex);
    fight.battle_pass_victory_processed_at = new Date().toISOString();
  }
  const previousBossKills = Number((owner.boss_kills_by_id || {})[fight.boss_id] || 0);
  const isFirstBossKill = previousBossKills === 0;
  if (ownerLog) {
    owner.total_boss_damage = Number(owner.total_boss_damage || 0) + Number(ownerLog.damage || 0);
  }

  // Invited clan contributors receive the same kill progression as the fight
  // owner, matching their damage-based reward eligibility. The settlement
  // marker below makes these per-player increments one-time per fight.
  const creditedPlayers = new Map([[String(owner.id), owner]]);
  if (Array.isArray(fight.invited_player_ids) && fight.invited_player_ids.length) {
    for (const log of logs) {
      if (!shouldReceiveBossFightDamageReward(fight, log)) continue;
      const contributor = store.players.find((player) => String(player.id) !== String(owner.id)
        && String(player.created_by || '').trim().toLowerCase() === String(log.player_email || '').trim().toLowerCase());
      if (contributor) creditedPlayers.set(String(contributor.id), contributor);
    }
  }
  for (const credited of creditedPlayers.values()) {
    const totalKills = Number(credited.boss_kills || 0) + 1;
    credited.boss_kills = totalKills;
    credited.boss_kills_by_id = {
      ...(credited.boss_kills_by_id || {}),
      [fight.boss_id]: Number((credited.boss_kills_by_id || {})[fight.boss_id] || 0) + 1,
    };
    const medal = totalKills >= 100 ? 'gold' : totalKills >= 50 ? 'silver' : totalKills >= 10 ? 'bronze' : null;
    if (medal) credited.best_medal = medal;
  }
  const newKills = Number(owner.boss_kills || 0);
  const medal = newKills >= 100 ? 'gold' : newKills >= 50 ? 'silver' : newKills >= 10 ? 'bronze' : null;

  let firstKillReward = null;
  let nextKeyDrop = null;
  const nextBoss = GAME_CONFIG.BOSSES[bossIndex + 1] || null;
  const nextKeyLocation = nextBoss?.keycardLocation || null;
  const nextBossKeyPity = { ...(owner.boss_key_pity || {}) };

  if (nextKeyLocation) {
    const pityStacks = Number(nextBossKeyPity[fight.boss_id] || 0);
    const chance = getBossKeyDropChance(pityStacks, getBossRewardRuntimeConfig());
    const granted = Math.random() < chance;
    nextKeyDrop = { location: nextKeyLocation, chance, pityStacks, granted };

    if (granted) {
      nextBossKeyPity[fight.boss_id] = 0;
    } else {
      nextBossKeyPity[fight.boss_id] = pityStacks + 1;
    }
    owner.boss_key_pity = nextBossKeyPity;
  }

  // First-kill bonuses and key pity are personal to the fight owner. Damage
  // boxes are shared with contributors only for clan-invited fights.
  const firstKillDrops = [];
  if (isFirstBossKill) {
    const strengthReward = [25, 30, 50, 100, 200, 500, 750, 1500][bossIndex] || 25;
    const tentaclesReward = battlePassEnabled() && bossIndex === 0 ? 500 : ([0, 100, 300, 500, 5000, 10000, 0, 0][bossIndex] || 0);
    if (strengthReward > 0) firstKillDrops.push({ type: 'strength', name: 'CA', qty: strengthReward });
    if (tentaclesReward > 0) firstKillDrops.push({ type: 'tentacles', name: 'Tentacles', qty: tentaclesReward });
    firstKillReward = {
      strength: strengthReward,
      tentacles: tentaclesReward,
    };
  }

  const pityDrops = nextKeyDrop?.granted
    ? [{ type: 'keycard', name: 'Boss Key', qty: 1, location: nextKeyDrop.location }]
    : [];
  const extrasByEmail = {
    [String(owner.created_by || '').toLowerCase()]: { firstKillDrops, pityDrops },
  };
  let boxes = [];
  if (!fight.rewards_distributed_at) {
    const distribution = distributeBossBoxesForFinishedFight(fight, extrasByEmail);
    boxes = distribution.rewardBoxes || [];
  }

  fight.personal_progression_distributed_at = new Date().toISOString();

  console.log('[boss] reward granted', {
    playerId: owner.id,
    fightId: fight.id,
    bossId: fight.boss_id,
    rank: ownerRank,
    medal,
    boxes: boxes.map((box) => ({ boxType: box.boxType, instanceId: box.instanceId })),
    firstKillReward,
    nextKeyDrop,
    totalBossDamage: Number(owner.total_boss_damage || 0),
    bossKills: Number(owner.boss_kills || 0),
  });

  return {
    rank: ownerRank,
    reward: 0,
    medal,
    boxes,
    boxType: boxes[0]?.boxType || null,
    firstKillReward,
    nextKeyDrop,
  };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBossEquipmentSetItemIds(bossId) {
  const firstBossId = GAME_CONFIG.BOSSES?.[0]?.id || 'heli';
    const secondBossId = GAME_CONFIG.BOSSES?.[1]?.id || 'tank';
    const thirdBossId = GAME_CONFIG.BOSSES?.[2]?.id || 'chinook';
    const suckholeBossId = GAME_CONFIG.BOSSES?.find((boss) => boss?.names?.en === 'Suckhole')?.id || 'boss6';
    const sets = {
    [firstBossId]: ['cardboard_weapon', 'cardboard_head', 'cardboard_armor', 'cardboard_hands', 'cardboard_legs', 'cardboard_boots'],
      [secondBossId]: ['night_disinfector_weapon', 'night_disinfector_head', 'night_disinfector_armor', 'night_disinfector_hands', 'night_disinfector_legs', 'night_disinfector_boots'],
      [thirdBossId]: ['nuvelor_weapon', 'nuvelor_head', 'nuvelor_armor', 'nuvelor_hands', 'nuvelor_legs', 'nuvelor_boots'],
      [suckholeBossId]: ['set5_weapon', 'set5_head', 'set5_armor', 'set5_hands', 'set5_legs', 'set5_boots'],
    };
  return sets[bossId] || [];
}

function getOwnedEquipmentItemIds(player) {
  const inventoryIds = (player?.inventory_items || []).map((item) => item?.id).filter(Boolean);
  const equippedIds = Object.values(player?.equipped_items || {}).filter(Boolean);
  return new Set([...inventoryIds, ...equippedIds]);
}

function resolveBossEquipmentDrop(player, bossId) {
  const setItems = getBossEquipmentSetItemIds(bossId);
  const owned = getOwnedEquipmentItemIds(player);
  const unowned = setItems.filter((itemId) => !owned.has(itemId));
  if (unowned.length > 0) {
    const itemId = unowned[Math.floor(Math.random() * unowned.length)];
    return { type: 'equipment', itemId, qty: 1, bossId, quality: 'boss_gear_piece', isNew: true };
  }
  return {
    type: 'tentacles',
    name: 'tentacles fallback',
    qty: randInt(250, 500),
    bossId,
    source: 'full_set_duplicate_fallback',
  };
}

function getBossPetPool(bossId) {
  const firstBossId = GAME_CONFIG.BOSSES?.[0]?.id || 'heli';
  return bossId === firstBossId ? ['pet-bot'] : [];
}

function getOwnedPetIds(player) {
  const inventoryPetIds = (player?.inventory_items || [])
    .filter((item) => item?.slot === 'pet')
    .map((item) => item?.id)
    .filter(Boolean);
  const equippedPet = player?.equipped_items?.pet ? [player.equipped_items.pet] : [];
  return new Set([...inventoryPetIds, ...equippedPet]);
}

function resolveBossPetDrop(player, bossId) {
  const pool = getBossPetPool(bossId);
  const owned = getOwnedPetIds(player);
  const unowned = pool.filter((petId) => !owned.has(petId));
  if (unowned.length > 0) {
    const petId = unowned[Math.floor(Math.random() * unowned.length)];
    return { type: 'pet', petId, qty: 1, bossId, isNew: true };
  }
  return {
    type: 'tentacles',
    name: 'tentacles fallback',
    qty: randInt(250, 500),
    bossId,
    source: 'all_boss_pets_owned_fallback',
  };
}

function claimDailyTask(player, taskId) {
  const task = SIM_DAILY_TASKS.find((entry) => entry.id === taskId);
  if (!task) throw Object.assign(new Error('Daily task not found'), { code: 'DAILY_TASK_NOT_FOUND' });
  const today = getTodayKey();
  const claims = { ...(player.sim_daily_claims || {}) };
  if (claims[taskId] === today) throw Object.assign(new Error('Already claimed today'), { code: 'DAILY_ALREADY_CLAIMED' });
  const metricMap = {
    energy_spent: Number(player.energy_spent_today || 0),
    missions: Number(player.total_tasks_today || 0),
    boss_hits: Number(player.boss_hits_today || 0),
  };
  if (Number(metricMap[task.type] || 0) < Number(task.goal || 1)) {
    throw Object.assign(new Error('Daily task not completed'), { code: 'DAILY_NOT_READY' });
  }
  claims[taskId] = today;
  player.sim_daily_claims = claims;
  recordBattlePassEvent(player, { type: 'earnedDm', source: 'quest', amount: task.reward.tentacles });
  if (task.reward.tentacles) player.tentacles = Number(player.tentacles || 0) + Number(task.reward.tentacles);
  if (task.reward.xp) grantXpToPlayer(player, Number(task.reward.xp));
  if (task.reward.roulette_bonus_spins) player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + Number(task.reward.roulette_bonus_spins);
  return { taskId, claimed: true };
}

function claimNewbieQuest(player, questId) {
  const quest = SIM_NEWBIE_QUESTS.find((entry) => entry.id === questId);
  if (!quest) throw Object.assign(new Error('Newbie quest not found'), { code: 'NEWBIE_QUEST_NOT_FOUND' });
  const claimed = new Set(player.newbie_claimed_quests || []);
  if (claimed.has(questId)) throw Object.assign(new Error('Already claimed'), { code: 'NEWBIE_ALREADY_CLAIMED' });
  const missionProgress = Number(Object.values(player.task_completions || {}).reduce((sum, v) => sum + (Number(v) || 0), 0));
  const bossDamageProgress = Number(player.boss_damage_lifetime || 0);
  const progress = quest.type === 'missions' ? missionProgress : bossDamageProgress;
  if (progress < quest.goal) throw Object.assign(new Error('Quest is not ready'), { code: 'NEWBIE_NOT_READY' });
  claimed.add(questId);
  player.newbie_claimed_quests = Array.from(claimed);
  recordBattlePassEvent(player, { type: 'earnedDm', source: 'quest', amount: quest.reward.tentacles });
  if (quest.reward.tentacles) player.tentacles = Number(player.tentacles || 0) + Number(quest.reward.tentacles);
  if (quest.reward.energy) grantEnergyGain(player, Number(quest.reward.energy), 'newbie_quest');
  if (quest.reward.xp) grantXpToPlayer(player, Number(quest.reward.xp));
  return { questId, claimed: true };
}

function resolveBossBackgroundDrop(player, bossId) {
  const reward = BOSS_BACKGROUND_REWARDS[bossId];
  if (!reward) return null;

  if ((player?.unlocked_backgrounds || []).includes(reward.backgroundId)) {
    return {
      type: 'tentacles',
      name: 'tentacles fallback',
      qty: randInt(250, 500),
      bossId,
      source: 'boss_background_duplicate_fallback',
    };
  }

  return {
    type: 'background',
    backgroundId: reward.backgroundId,
    name: reward.name,
    qty: 1,
    bossId,
    isNew: true,
  };
}

function spinRoulette(player, spinType, count = 1) {
  const today = getTodayKey();
  const type = spinType || 'free';
  if (![1, 5, 10, 100].includes(count) || !['free', 'bonus', 'paid'].includes(type)) throw Object.assign(new Error('Invalid spin option'), { code: 'INVALID_SPIN_OPTION', statusCode: 400 });
  const level = Number(player.level || 1);
  if ((count === 5 && level < 20) || (count === 10 && level < 30) || (count === 100 && level < 100)) throw Object.assign(new Error('Batch spin option requires a higher level'), { code: 'ROULETTE_LEVEL_REQUIRED', statusCode: 403 });
  if (player.roulette_pending_reward) throw Object.assign(new Error('Claim pending reward first'), { code: 'ROULETTE_REWARD_PENDING', statusCode: 409 });
  if (type === 'free' && player.roulette_last_free_spin === today) throw Object.assign(new Error('Free spin already used'), { code: 'FREE_SPIN_USED', statusCode: 400 });
  const bonusCost = type === 'free' ? count - 1 : type === 'bonus' ? count : 0;
  if (Number(player.roulette_bonus_spins || 0) < bonusCost) throw Object.assign(new Error('Not enough bonus spins'), { code: 'NO_BONUS_SPINS', statusCode: 400 });
  if (type === 'paid' && Number(player.premium || 0) < 5 * count) throw Object.assign(new Error('Not enough T-Pape'), { code: 'NO_PREMIUM', statusCode: 400 });
  const selections = Array.from({ length: count }, () => selectRouletteReward());
  const rewards = selections.map(selection => {
    const r = resolveRouletteRewardById(normalizeRouletteRewardId(selection.reward?.id)) || selection.reward;
    return { id: r.id, type: r.type, amount: r.amount, label: r.label, popupText: r.popupText, iconKey: r.iconKey, accent: r.accent };
  });
  if (type === 'free') player.roulette_last_free_spin = today;
  player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) - bonusCost;
  if (type === 'paid') player.premium = Number(player.premium || 0) - 5 * count;
  const selection = selections[0];
  const reward = rewards[0];
  const pendingReward = { ...reward, rewards, spinCount: count, pendingId: store.generateId('roulette-reward') };
  player.roulette_pending_reward = pendingReward;
  player.roulette_last_reward_id = reward.id;
  player.newbie_stats = {
    ...(player.newbie_stats || {}),
    roulette_spins: (Number(player.newbie_stats?.roulette_spins) || 0) + count,
  };
  console.log('[roulette] reward granted', {
    rewardId: reward.id,
    selectedIndex: pendingReward.wheelIndex ?? selection.rewardIndex ?? reward.wheelIndex ?? -1,
    selectedAngle: Number.isFinite(Number(selection.selectedAngle))
      ? Number(selection.selectedAngle)
      : 0,
    pendingId: pendingReward.pendingId,
    spinType: type,
  });
  return {
    spinType: type,
    rewardId: reward.id,
    selectedIndex: Number.isFinite(Number(selection.rewardIndex))
      ? Number(selection.rewardIndex)
      : Number.isFinite(Number(reward.wheelIndex))
        ? Number(reward.wheelIndex)
        : -1,
    selectedAngle: Number.isFinite(Number(selection.selectedAngle))
      ? Number(selection.selectedAngle)
      : 0,
    reward: pendingReward,
    pending_reward: pendingReward,
    player: normalizePlayerProgression(player),
  };
}

function openLootBox(player, boxId) {
  const list = Array.isArray(player.pending_boss_boxes) ? player.pending_boss_boxes : [];
  const box = list.find((entry) => entry.instanceId === boxId || entry.id === boxId);
  if (!box) throw Object.assign(new Error('Box not found'), { code: 'BOX_NOT_FOUND' });
  const customBoxTables = Object.fromEntries((store.customLootBoxes || []).map((entry) => [entry.id, entry.table]));
  const activeBoxTables = { ...(store.lootBoxTables || {}), ...customBoxTables };
  const drops = stripRetiredBossFragments(limitBossBoxEquipment([
    ...((box.rewardFormula === 'boss_v2' || box.rewardFormula === 'raid_rank_v1')
      ? (Array.isArray(box.rewardSnapshot) ? box.rewardSnapshot : [])
      : box.rewardFormula === 'damage_v1'
      ? rollBossDamageReward({ damage: box.damage, bossId: box.bossId, maxHp: box.maxHp })
      : (Array.isArray(box.rewardBoxTypes) && box.rewardBoxTypes.length ? box.rewardBoxTypes : [box.boxType]).flatMap((boxType) => openBox(boxType, box.bossId, activeBoxTables))),
    ...(Array.isArray(box.bonusDrops) ? box.bonusDrops : []),
  ]));
  player.pending_boss_boxes = list.filter((entry) => entry !== box);
  player.opened_boxes_total = Number(player.opened_boxes_total || 0) + 1;
  drops.forEach((drop) => {
    if (drop.type === 'tentacles') player.tentacles = Number(player.tentacles || 0) + Number(drop.qty || 0);
    if (drop.type === 'xp') grantXpToPlayer(player, Number(drop.qty || 0));
    if (drop.type === 'energy') grantEnergyGain(player, Number(drop.qty || 0), 'open_loot_box');
    if (drop.type === 'spin') player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + Number(drop.qty || 0);
    if (drop.type === 'premium') player.premium = Number(player.premium || 0) + Number(drop.qty || 0);
    if (drop.type === 'strength') player.stat_strength = Number(player.stat_strength || 1) + Number(drop.qty || 0);
    if (drop.type === 'keycard' && drop.location) {
      player.keycards = {
        ...(player.keycards || {}),
        [drop.location]: Number((player.keycards || {})[drop.location] || 0) + Number(drop.qty || 1),
      };
    }
    if (drop.type === 'poison') player.weapon_inventory = { ...(player.weapon_inventory || {}), 'small-poison': Number((player.weapon_inventory || {})['small-poison'] || 0) + Number(drop.qty || 0) };
    if (drop.type === 'weapon' && drop.id) {
      const weaponKey = drop.id === 'satchel' ? 'small-poison' : drop.id === 'c4' ? 'large-poison' : 'medium-poison';
      player.weapon_inventory = { ...(player.weapon_inventory || {}), [weaponKey]: Number((player.weapon_inventory || {})[weaponKey] || 0) + Number(drop.qty || 0) };
    }
    if (drop.type === 'equipment' && drop.itemId) {
      player.inventory_items = [...(player.inventory_items || []), { id: drop.itemId, type: 'equipment', slot: String(drop.itemId).split('_').pop() || 'weapon', bossId: drop.bossId || box.bossId, quality: drop.quality || 'boss_gear_piece', count: 1 }];
    }
    if (drop.type === 'pet' && drop.petId) {
      player.inventory_items = [...(player.inventory_items || []), { id: drop.petId, type: 'equipment', slot: 'pet', bossId: drop.bossId || box.bossId, count: 1 }];
    }
    if (drop.type === 'background' && drop.backgroundId) player.unlocked_backgrounds = Array.from(new Set(['garage', ...(player.unlocked_backgrounds || []), drop.backgroundId]));
  });
  recordBattlePassEvent(player, { type: 'box' });
  recordBattlePassEvent(player, { type: 'earnedDm', source: 'reward', amount: drops.filter((drop) => drop.type === 'tentacles').reduce((sum, drop) => sum + Number(drop.qty || 0), 0) });
  return { boxId: box.instanceId || boxId, drops };
}

function upgradeTalent(player, talentId) {
  if (!TALENT_DEFS.some((talent) => talent.id === talentId)) throw Object.assign(new Error('Unknown talent'), { code: 'UNKNOWN_TALENT' });
  Object.assign(player, migrateTalentTreeState(player));
  const updates = calculateTalentUpgrade(player, talentId);
  if (!updates) throw Object.assign(new Error('Talent is locked, maxed, or has no points'), { code: 'TALENT_UPGRADE_DENIED' });
  Object.assign(player, updates);
  const levels = player.talent_levels;
  console.log('[talent] updated', {
    playerId: player.id,
    talentId,
    level: levels[talentId],
    pointsLeft: player.talent_points,
  });
  return { talentId, level: levels[talentId], pointsLeft: player.available_talent_points };
}

function limitBossBoxEquipment(drops = []) {
  const gearTypes = new Set(['equipment', 'boss_gear_piece', 'rare_gear', 'epic_gear', 'legendary_gear']);
  let gearCount = 0;
  return drops.filter((drop) => {
    if (!gearTypes.has(drop?.type)) return true;
    gearCount += 1;
    return gearCount === 1;
  });
}

function getReferralRewardConfig(kind, rewardId) {
  const key = String(rewardId || '').trim();
  if (!key) return null;
  if (kind === 'friend') {
    return {
      kind,
      claimKey: `friend:${key}`,
      boxType: 'invite_box',
      requiredFriends: 0,
      friendId: key,
    };
  }
  if (kind === 'tier') {
    const tierMap = {
      tier_1: 'invite_box',
      tier_3: 'big_invite_box',
      tier_5: 'rare_invite_box',
      tier_10: 'epic_invite_box',
    };
    const boxType = tierMap[key] || null;
    return boxType
      ? {
          kind,
          claimKey: `tier:${key}`,
          boxType,
          requiredFriends: Number(key.split('_')[1] || 0),
          tierKey: key,
        }
      : null;
  }
  return null;
}

function claimReferralRewardForPlayer(player, { kind, rewardId }) {
  const config = getReferralRewardConfig(kind, rewardId);
  if (!config) {
    const error = new Error('Invalid referral reward');
    error.code = 'REFERRAL_REWARD_INVALID';
    throw error;
  }

  const claimed = new Set([
    ...(Array.isArray(player.referral_rewards_claimed) ? player.referral_rewards_claimed : []),
    ...(Array.isArray(player.claimedReferralRewards) ? player.claimedReferralRewards : []),
  ].map((value) => String(value || '').trim()).filter(Boolean));

  if (claimed.has(config.claimKey)) {
    return {
      status: 'already_claimed',
      rewardId: config.claimKey,
      player: normalizePlayerProgression(player),
    };
  }

  const friends = Array.isArray(player.referred_friends)
    ? player.referred_friends.map(normalizeReferredFriend)
    : [];
  const activeFriends = friends.filter((friend) => {
    const doneNewbie = Boolean(friend?.newbiePart1Done);
    const bossDamage = Number(friend?.boss1Damage || 0);
    return doneNewbie || bossDamage >= 150;
  });

  if (config.kind === 'friend') {
    const friendIndex = friends.findIndex((friend) => String(friend?.playerId || '') === config.friendId);
    if (friendIndex === -1) {
      const error = new Error('Referred friend not found');
      error.code = 'REFERRAL_FRIEND_NOT_FOUND';
      throw error;
    }
    const friend = friends[friendIndex];
    if (!friend || friend.rewardClaimed) {
      return {
        status: 'already_claimed',
        rewardId: config.claimKey,
        player: normalizePlayerProgression(player),
      };
    }
    const isFriendActive = Boolean(friend.newbiePart1Done) || Number(friend.boss1Damage || 0) >= 150;
    if (!isFriendActive) {
      const error = new Error('Referred friend has not completed the activation requirement');
      error.code = 'REFERRAL_FRIEND_NOT_READY';
      throw error;
    }
    friend.rewardClaimed = true;
    friend.status = 'claimed';
    friends[friendIndex] = friend;
  }

  if (config.kind === 'tier' && activeFriends.length < config.requiredFriends) {
    const error = new Error('Not enough invited friends');
    error.code = 'REFERRAL_TIER_LOCKED';
    throw error;
  }

  const drops = openBox(config.boxType, undefined, store.lootBoxTables);
  for (const drop of drops) {
    if (drop.type === 'tentacles') {
      player.tentacles = (player.tentacles || 0) + drop.qty;
    }
    if (drop.type === 'xp') {
      grantXpToPlayer(player, drop.qty);
    }
    if (drop.type === 'weapon' && drop.id) {
      const weaponKey = drop.id === 'satchel' ? 'small-poison' : drop.id === 'c4' ? 'large-poison' : 'medium-poison';
      player.weapon_inventory = {
        ...(player.weapon_inventory || {}),
        [weaponKey]: ((player.weapon_inventory || {})[weaponKey] || 0) + (drop.qty || 1),
      };
    }
    if (drop.type === 'energy') {
      grantEnergyGain(player, drop.qty, 'referral_reward');
    }
    if (drop.type === 'premium') {
      player.premium = (player.premium || 0) + drop.qty;
    }
    if (drop.type === 'strength') {
      player.stat_strength = (player.stat_strength || 1) + drop.qty;
    }
    if (drop.type === 'poison') {
      player.weapon_inventory = {
        ...(player.weapon_inventory || {}),
        'small-poison': ((player.weapon_inventory || {})['small-poison'] || 0) + drop.qty,
      };
    }
  }

  player.referred_friends = friends;
  player.referral_rewards_claimed = Array.from(new Set([...claimed, config.claimKey]));
  player.claimedReferralRewards = Array.from(new Set([...(Array.isArray(player.claimedReferralRewards) ? player.claimedReferralRewards : []), config.claimKey]));
  player.referral_invite_boxes = [
    ...(Array.isArray(player.referral_invite_boxes) ? player.referral_invite_boxes : []),
    {
      kind: config.kind,
      rewardId: String(rewardId || '').trim(),
      claimKey: config.claimKey,
      boxType: config.boxType,
      drops,
      claimedAt: new Date().toISOString(),
    },
  ];

  return {
    status: 'ok',
    rewardId: config.claimKey,
    reward: {
      boxType: config.boxType,
      drops,
    },
    drops,
    player: normalizePlayerProgression(player),
  };
}

function enforceRequestRate(request, response, url) {
  if (process.env.NODE_ENV !== 'production') return true;
  const session = getSessionFromHeaders(request.headers);
  const policy = getRequestRatePolicy(request.method, url.pathname, Boolean(session?.telegramId));
  if (!policy) return true;
  const { bucket, limit } = policy;
  const address = String(request.socket?.remoteAddress || 'unknown');
  const key = `${session?.telegramId ? `telegram:${session.telegramId}` : `ip:${address}`}:${bucket}`;
  const now = Date.now();
  const current = requestRateMap.get(key) || { start: now, count: 0 };
  if (now - current.start >= 60000) { current.start = now; current.count = 0; }
  current.count += 1;
  requestRateMap.set(key, current);
  if (current.count > limit) {
    console.warn('[rate-limit]', { bucket, method: request.method, path: url.pathname.replace(/\/(players|boss-fights|clans)\/[^/]+/g, '/$1/:id'), authenticated: Boolean(session?.telegramId) });
    response.setHeader('Retry-After', String(Math.max(1, Math.ceil((current.start + 60000 - now) / 1000))));
    sendError(response, 429, 'Too many requests', 'RATE_LIMITED');
    return false;
  }
  if (requestRateMap.size > 10000) {
    for (const [entryKey, entry] of requestRateMap) if (now - entry.start > 120000) requestRateMap.delete(entryKey);
  }
  return true;
}

let raidRankSettlement = null;
export async function processRaidRankRewards(now = Date.now()) {
  if (raidRankSettlement) return raidRankSettlement;
  raidRankSettlement = (async () => {
    await Promise.all([store.init(), playerDb.init(store)]);
    const raid = store.raidBoss;
    if (!raid || raid.rank_rewards_completed_at || (!['dead', 'defeated'].includes(raid.status) && now < Date.parse(raid.ends_at || EVENT_SCHEDULE['raid-boss'].endAt))) return;
    await store.refreshRaidBoss();
    const changed = awardRaidRankRewards(store.raidBoss, store.players, { now, endAt: EVENT_SCHEDULE['raid-boss'].endAt });
    if (changed.length) await playerDb.flushDirtyPlayers(changed);
    await store.persistNow();
  })();
  try { await raidRankSettlement; } finally { raidRankSettlement = null; }
}

export async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (['GET','HEAD'].includes(request.method) && url.pathname.startsWith('/invite/')) {
    const html = referralPage(url.pathname.slice(8), url.searchParams.get('lang'));
    response.writeHead(html ? 200 : 404, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300'});
    response.end(request.method === 'HEAD' ? undefined : html || 'Invitation not found');
    return;
  }
  if (request.method === 'GET' && ['/version','/api/version'].includes(url.pathname)) {
    response.setHeader('Cache-Control','no-store');
    sendData(response,200,{version:APP_VERSION,label:APP_VERSION_LABEL});return;
  }
  if (['/nft-holder-campaign/icon', '/api/nft-holder-campaign/icon'].includes(url.pathname) && request.method === 'GET') {
    const icon = campaignIcon(url.searchParams.get('asset'));
    if (!icon) { response.writeHead(404); response.end(); return; }
    const bytes = Buffer.from(icon.data, 'base64');
    response.writeHead(200, { 'Content-Type': icon.mime, 'Content-Length': bytes.length, 'Cache-Control': 'public, max-age=3600' });
    response.end(bytes);
    return;
  }

  if (['/holder-drop-icon', '/api/holder-drop-icon'].includes(url.pathname) && request.method === 'GET') {
    const icon = holderDropIcon(url.searchParams.get('id'));
    if (!icon) { sendError(response, 404, 'Drop icon not found', 'DROP_ICON_NOT_FOUND'); return; }
    response.writeHead(200, { 'Content-Type': icon.mime, 'Cache-Control': 'public, max-age=3600' });
    response.end(Buffer.from(icon.data, 'base64'));
    return;
  }
  const originalPath = url.pathname;
  const startedAt = Date.now();
  const diagnosticRoute = originalPath === '/api/diagnostics/client' || originalPath === '/api/admin/diagnostics';
  if (!diagnosticRoute) {
    response.once('finish', () => {
      const status = response.statusCode;
      const duration = Date.now() - startedAt;
      if (status < 400 && (duration < 1500 || !originalPath.startsWith('/api/'))) return;
      console.warn('[request-diagnostic]', {
        method: request.method,
        path: originalPath.replace(/\/(players|boss-fights|clans)\/[^/]+/g, '/$1/:id'),
        status,
        code: status >= 400 ? response.diagnosticCode || `HTTP_${status}` : 'SLOW_REQUEST',
        duration_ms: duration,
        message: response.diagnosticMessage || '',
      });
      void recordDiagnosticEvent({
        source: 'api',
        method: request.method,
        path: originalPath,
        message: response.diagnosticMessage || '',
        status,
        code: status >= 400 ? response.diagnosticCode || `HTTP_${status}` : 'SLOW_REQUEST',
        duration_ms: duration,
      }).catch(() => console.error('[diagnostics] failed to store API event'));
    });
  }
  // Frontend builds use /api as their base URL, while most server routes are
  // registered without that prefix. Keep explicit /api/admin routes intact.
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/admin/')) {
    url.pathname = url.pathname.slice(4);
  }
  const browserSession = webAuth.session(request.headers);
  if (browserSession || url.pathname.startsWith('/auth/web/')) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !request.headers['x-telegram-init-data']) {
      let sameOrigin = false;
      try {
        const origin = new URL(request.headers.origin);
        sameOrigin = origin.host === request.headers.host || origin.origin === (process.env.WEB_GAME_ORIGIN || 'https://p4.nuvelor.gg');
      } catch { /* Missing or invalid origins are rejected for cookie mutations. */ }
      if (!sameOrigin) { sendError(response, 403, 'Same-origin web request required', 'WEB_ORIGIN_INVALID'); return; }
    }
  }
  let storeReady = false;
  let shouldPersistImmediately = false;
  let shouldPersistGlobalState = true;
  let dirtyPlayerFlushQueued = false;
  const queueDirtyPlayerFlush = (playerId) => {
    dirtyPlayerFlushQueued = true;
    void playerDb.flushDirtyPlayers(playerId ? [playerId] : undefined).catch((error) => {
      console.error('[sql] background player flush failed', { playerId: playerId || null, message: error?.message || 'unknown_error' });
    });
  };
  try {
  if (url.pathname === '/diagnostics/client' && request.method === 'POST') {
    const session = getSessionFromHeaders(request.headers);
    if (!session || session.isMock) {
      sendError(response, 401, 'Telegram session required', 'DIAGNOSTIC_AUTH_REQUIRED');
      return;
    }
    const now = Date.now();
    const key = String(session.telegramId);
    const rate = clientDiagnosticRateMap.get(key) || { start: now, count: 0 };
    if (now - rate.start >= 60000) { rate.start = now; rate.count = 0; }
    rate.count += 1;
    clientDiagnosticRateMap.set(key, rate);
    if (rate.count > 10) {
      sendError(response, 429, 'Too many diagnostic events', 'DIAGNOSTIC_RATE_LIMITED');
      return;
    }
    if (clientDiagnosticRateMap.size > 10000) {
      for (const [entryKey, entry] of clientDiagnosticRateMap) {
        if (now - entry.start > 120000) clientDiagnosticRateMap.delete(entryKey);
      }
    }
    const body = await readJsonBody(request);
    await recordDiagnosticEvent({
      source: 'client',
      path: body.path,
      code: body.kind,
      message: `[client ${/^\d+\.\d+$/.test(body.version || '') ? body.version : 'unknown'} / server ${APP_VERSION}] ${body.message || ''}`,
    });
    sendJson(response, 204, {});
    return;
  }

  if ((url.pathname === '/api/admin/diagnostics' || url.pathname === '/admin/diagnostics') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    sendData(response, 200, await listDiagnosticEvents(url.searchParams.get('limit')));
    return;
  }

  // Client telemetry is best-effort and must never serialize the game state.
  if (request.method === 'POST' && /^\/apps\/[^/]+\/analytics\/track\/batch$/.test(url.pathname)) {
    if (!enforceRequestRate(request, response, url)) return;
    sendJson(response, 204, {});
    return;
  }

  // The web shell and scene files must not wait for database initialization.
  const frontendPath = ['/', '/web', '/index.html'].includes(url.pathname)
    || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/skills/');
  if (['GET', 'HEAD'].includes(request.method) && frontendPath && tryServeStatic(url.pathname, response, request)) return;

  await Promise.all([store.init(), playerDb.init(store), paymentDb.init()]);
  await processRaidRankRewards();
  if (recoverKarma(store.players || [])) {
    store.persistSoon(0);
    await playerDb.flushDirtyPlayers();
  }
  let economyMigrationChanged = false;
  for (const player of store.players || []) economyMigrationChanged = migrateLegacyResourceFields(player) || economyMigrationChanged;
  for (const collection of [store.bossFights, store.attackLogs, store.lootBoxTables, store.bossRewardConfig, store.promoCodes, store.customLootBoxes, store.partners]) {
    economyMigrationChanged = migrateLegacyResourceFields(collection) || economyMigrationChanged;
  }
  if (economyMigrationChanged) {
    store.persistSoon(0);
    await playerDb.flushDirtyPlayers();
  }
  storeReady = true;
  if (url.pathname === '/holder-pets/claim' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED'); return; }
    const body = await readJsonBody(request);
    sendData(response, 200, await claimNftHolderPet(player, String(body?.petId || '')));
    return;
  }
  if (url.pathname === '/holder-pet-status' && request.method === 'GET') {
    response.setHeader('Cache-Control', 'no-store');
    sendData(response, 200, await checkNftPetStatus(url.searchParams.get('contract'), url.searchParams.get('tokenId')));
    return;
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (!['GET', 'OPTIONS', 'HEAD'].includes(request.method)) {
    const session = getSessionFromHeaders(request.headers);
    console.info('[mutation]', {
      method: request.method,
      endpoint: url.pathname,
      telegramId: session?.telegramId || null,
      hasSession: Boolean(session),
    });
    shouldPersistImmediately = true;
  }

  if (['/telegram/check-subscription', '/api/telegram/check-subscription'].includes(url.pathname) && request.method === 'POST') {
    try { sendData(response, 200, await checkExtraSubscription(await readJsonBody(request), request.headers['x-telegram-init-data'] || '')); }
    catch { sendError(response, 503, 'Subscription verification unavailable', 'TELEGRAM_CHECK_UNAVAILABLE'); }
    return;
  }

  if (!enforceRequestRate(request, response, url)) {
    shouldPersistGlobalState = false;
    return;
  }
  if (url.pathname === '/telegram/player-avatar' && request.method === 'GET') {
    const player = getCurrentPlayer(request);
    if (!player || player.is_banned) { sendError(response, 401, 'Authentication required', 'AUTH_REQUIRED'); return; }
    try {
      const avatar = await getPlayerTelegramAvatar(player.telegram_id);
      response.writeHead(200, { 'Content-Type': avatar.contentType, 'Cache-Control': 'private, max-age=300' });
      response.end(avatar.bytes);
    } catch { sendError(response, 404, 'Telegram photo unavailable', 'TELEGRAM_AVATAR_UNAVAILABLE'); }
    return;
  }
  if (['/telegram/channel-avatar', '/api/telegram/channel-avatar'].includes(url.pathname) && request.method === 'GET') {
    try {
      const bytes = await getExtraChannelAvatar(url.searchParams.get('channel'));
      response.writeHead(200, {'Content-Type':'image/jpeg','Cache-Control':'public, max-age=3600'});
      response.end(bytes);
    } catch { sendError(response, 404, 'Channel avatar unavailable', 'TELEGRAM_AVATAR_UNAVAILABLE'); }
    return;
  }
  if (['/telegram/partner-avatar', '/api/telegram/partner-avatar'].includes(url.pathname) && request.method === 'GET') {
    try {
      const username = normalizePublicTelegramUsername(url.searchParams.get('username'));
      const avatar = await getPublicTelegramAvatar(username);
      response.writeHead(200, { 'Content-Type': avatar.contentType, 'Cache-Control': 'public, max-age=3600' });
      response.end(avatar.bytes);
    } catch {
      sendError(response, 404, 'Telegram avatar unavailable', 'PARTNER_AVATAR_UNAVAILABLE');
    }
    return;
  }
  if (['/api/admin/partners/avatar', '/admin/partners/avatar'].includes(url.pathname) && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const source = String(body?.source || '').toLowerCase();
    const value = String(body?.value || '').trim();
    if (source === 'telegram') {
      try {
        const username = normalizePublicTelegramUsername(value);
        await getPublicTelegramAvatar(username);
        sendData(response, 200, { icon: `/api/telegram/partner-avatar?username=${encodeURIComponent(username)}`, username, source });
      } catch {
        sendError(response, serverConfig.telegramBotToken ? 422 : 503, serverConfig.telegramBotToken ? 'Не вдалося отримати аватар Telegram. Перевірте публічність профілю та доступ бота.' : 'Telegram Bot API не налаштований на сервері.', 'PARTNER_TELEGRAM_AVATAR_FAILED');
      }
      return;
    }
    if (source === 'x') {
      if (!serverConfig.xApiBearerToken) {
        sendError(response, 503, 'X API не налаштований: додайте X_API_BEARER_TOKEN на сервері.', 'PARTNER_X_API_NOT_CONFIGURED');
        return;
      }
      const match = value.match(/^(?:https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/)?@?([A-Za-z0-9_]{1,15})\/?$/i);
      if (!match) { sendError(response, 400, 'Вкажіть username або посилання на профіль X.', 'PARTNER_X_USERNAME_INVALID'); return; }
      try {
        const responseFromX = await fetch(`https://api.x.com/2/users/by/username/${encodeURIComponent(match[1])}?user.fields=profile_image_url`, {
          headers: { Authorization: `Bearer ${serverConfig.xApiBearerToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!responseFromX.ok) {
          sendError(response, responseFromX.status === 404 ? 404 : 502, responseFromX.status === 404 ? 'Профіль X не знайдено.' : 'X API не повернув аватар. Перевірте доступ API.', 'PARTNER_X_LOOKUP_FAILED');
          return;
        }
        const result = await responseFromX.json();
        const icon = String(result?.data?.profile_image_url || '').replace(/_normal(?=\.[a-z0-9]+(?:\?|$))/i, '');
        const iconUrl = new URL(icon);
        if (iconUrl.protocol !== 'https:' || !iconUrl.hostname.toLowerCase().endsWith('.twimg.com')) throw new Error('Invalid X image URL');
        sendData(response, 200, { icon: iconUrl.toString(), username: result.data.username, source });
      } catch {
        sendError(response, 502, 'Не вдалося отримати аватар із X.', 'PARTNER_X_LOOKUP_FAILED');
      }
      return;
    }
    sendError(response, 400, 'Невідоме джерело аватара.', 'PARTNER_AVATAR_SOURCE_INVALID');
    return;
  }

  if (url.pathname === '/health') {
    sendData(response, 200, { ok: true });
    return;
  }

  if ((url.pathname === '/api/admin/auth' || url.pathname === '/admin/auth') && request.method === 'POST') {
    const body = await readJsonBody(request);
    const token = String(body?.token || '').trim();
    const role=adminRole(token,ADMIN_TOKEN);
    if (!role) {
      sendError(response, 401, 'Invalid admin token', 'ADMIN_AUTH_INVALID');
      return;
    }
    sendData(response, 200, { ok: true, role });
    return;
  }

  if (url.pathname === '/api/admin/boss-reward-config' && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    sendData(response, 200, getBossRewardRuntimeConfig());
    return;
  }

  if (url.pathname === '/api/admin/boss-reward-config' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    try {
      const body = await readJsonBody(request);
      store.bossRewardConfig = sanitizeBossRewardConfig(body?.config);
      store.persistSoon(0);
      sendData(response, 200, store.bossRewardConfig);
    } catch (error) {
      sendError(response, 400, error.message || 'Invalid boss reward config', 'BOSS_REWARD_CONFIG_INVALID');
    }
    return;
  }

  if (url.pathname === '/api/admin/boss-reward-preview' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    try {
      const body = await readJsonBody(request);
      const boss = getBossById(body?.bossId) || GAME_CONFIG.BOSSES[0];
      const player = store.players.find((entry) => entry.id === body?.playerId) || {};
      const bossIndex = GAME_CONFIG.BOSSES.findIndex((entry) => entry.id === boss.id);
      const config = sanitizeBossRewardConfig(body?.config || getBossRewardRuntimeConfig());
      const keyDropChance = bossIndex < GAME_CONFIG.BOSSES.length - 1
        ? getBossKeyDropChance(body?.pityStacks, config)
        : 0;
      const firstKillDrops = [];
      if (body?.firstKill) {
        const strength = [25, 30, 50, 100, 200, 500, 750, 1500][bossIndex] || 25;
        const tentacles = battlePassEnabled() && bossIndex === 0 ? 500 : ([0, 100, 300, 500, 5000, 10000, 0, 0][bossIndex] || 0);
        firstKillDrops.push({ type: 'strength', name: 'CA', qty: strength });
        if (tentacles > 0) firstKillDrops.push({ type: 'tentacles', name: 'Tentacles', qty: tentacles });
      }
      const pityDrops = body?.pityHit ? [{ type: 'keycard', name: 'Boss Key', qty: 1, location: body?.keyLocation || '' }] : [];
      const result = calculateBossReward({
        bossId: boss.id,
        maxHp: Math.max(1, Number(body?.maxHp) || Number(boss.maxHp) || 1),
        actualDamageTotal: Math.max(0, Number(body?.damage) || 0),
        poisonRefundUnits: body?.poisonRefundUnits || {},
        rank: Math.max(1, Math.floor(Number(body?.rank) || 101)),
        availableSpecials: getBossSpecialKinds(player, boss.id),
        firstKillDrops, pityDrops,
        carries: { resources: {}, poison: body?.poisonCarry || {} },
        config,
        rng: () => 0.5,
      });
      sendData(response, 200, { ...result, keyDropChance });
    } catch (error) {
      sendError(response, 400, error.message || 'Could not calculate preview', 'BOSS_REWARD_PREVIEW_FAILED');
    }
    return;
  }

  if ((url.pathname === '/api/promo-codes' || url.pathname === '/promo-codes') && request.method === 'GET') {
    sendData(response, 200, (store.promoCodes || []).filter((promo) => isPromoCodeActive(promo)).map(({ code, label, field, amount, rewards, startsOn, expiresOn }) => ({ code, label, field, amount, rewards, startsOn, expiresOn })));
    return;
  }

  if ((url.pathname === '/api/partners' || url.pathname === '/partners') && request.method === 'GET') {
    sendData(response, 200, (store.partners || []).filter((partner) => partner.enabled !== false).map((partner) => ({ ...partner, verificationMode: partner.verificationMode || 'verified', verificationType: partner.verificationMode === 'visit' ? 'visit' : parseVerifiablePartnerLink(partner.link)?.type || null })));
    return;
  }

  const partnerVisitMatch = url.pathname.match(/^\/(?:api\/)?partners\/([^/]+)\/visit$/);
  if (partnerVisitMatch && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session required', 'AUTH_REQUIRED'); return; }
    const partner = (store.partners || []).find((entry) => entry.id === partnerVisitMatch[1] && entry.enabled !== false);
    if (!partner) { sendError(response, 404, 'Partner not found', 'PARTNER_NOT_FOUND'); return; }
    try {
      const visit = partner.verificationMode === 'visit' ? partnerVisits.start(player.id, partner) : {};
      const clickTime = Date.now();
      for (const [key, time] of partnerClickTimes) if (clickTime - time >= 5000) partnerClickTimes.delete(key);
      const clickKey = JSON.stringify([player.id, partner.id]);
      if (!partnerClickTimes.has(clickKey)) {
        if (partnerClickTimes.size >= 10000) { sendError(response, 429, 'Try again later', 'PARTNER_VISIT_BUSY'); return; }
        partnerClickTimes.set(clickKey, clickTime);
        partner.clickCount = Math.max(0, Number(partner.clickCount) || 0) + 1;
        store.persistSoon(250);
      }
      sendData(response, 200, visit);
    }
    catch { sendError(response, 429, 'Try again later', 'PARTNER_VISIT_BUSY'); }
    return;
  }

  const partnerClaimMatch = url.pathname.match(/^\/(?:api\/)?partners\/([^/]+)\/claim$/);
  if (partnerClaimMatch && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session required', 'AUTH_REQUIRED'); return; }
    const partner = (store.partners || []).find((entry) => entry.id === partnerClaimMatch[1] && entry.enabled !== false);
    if (!partner) { sendError(response, 404, 'Partner not found', 'PARTNER_NOT_FOUND'); return; }
    if (player.partner_claims?.[partner.id]) { sendData(response, 200, { claimed: true, alreadyClaimed: true }); return; }
    const target = parseVerifiablePartnerLink(partner.link);
    if ((partner.verificationMode !== 'visit' && !target) || !Array.isArray(partner.rewardItems) || !partner.rewardItems.length) {
      sendError(response, 400, 'Partner cannot be verified or has no rewards', 'PARTNER_UNVERIFIABLE'); return;
    }
    let subscribed;
    try {
      if (partner.verificationMode === 'visit') {
        const visit = partnerVisits.status(player.id, partner);
        if (visit.status !== 'READY') { sendData(response, 200, { claimed: false, ...visit }); return; }
        subscribed = true;
      } else if (target.type === 'telegram') {
        if (!player.telegram_id) { sendError(response, 400, 'Telegram account required', 'TELEGRAM_REQUIRED'); return; }
        subscribed = await checkPartnerTelegramSubscription(target.handle, player.telegram_id);
      } else {
        if (!player.x_oauth?.user_id || !player.x_oauth?.access_token) { sendError(response, 400, 'Connect X in profile first', 'X_NOT_CONNECTED'); return; }
        if (Number(player.x_oauth.expires_at || 0) <= Date.now() + 30000) { sendError(response, 400, 'Reconnect X in profile', 'X_RECONNECT_REQUIRED'); return; }
        subscribed = await verifyXFollow(decryptXToken(player.x_oauth.access_token), player.x_oauth.user_id, target.handle);
      }
    } catch (error) {
      console.warn('[partner] verification failed', partner.id, error?.message || error);
      sendError(response, 503, 'Subscription could not be verified now', 'PARTNER_VERIFICATION_UNAVAILABLE'); return;
    }
    if (!subscribed) { sendData(response, 200, { claimed: false, subscribed: false, status: 'NOT_SUBSCRIBED' }); return; }
    if (player.partner_claims?.[partner.id]) { sendData(response, 200, { claimed: true, alreadyClaimed: true }); return; }
    const allowed = new Set(['tentacles', 'xp', 'energy', 'strength', 'premium', 'small_poison', 'medium_poison', 'large_poison']);
    const rewards = partner.rewardItems;
    if (rewards.length > 8 || rewards.some(({ type, amount }) => !allowed.has(type) || !Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000)) {
      sendError(response, 400, 'Invalid partner rewards', 'PARTNER_REWARDS_INVALID'); return;
    }
    for (const { type, amount } of rewards) {
      if (type === 'xp') grantXpToPlayer(player, amount);
      else if (type === 'energy') grantEnergyGain(player, amount, 'partner_claim');
      else if (type === 'strength') player.stat_strength = Number(player.stat_strength || 0) + amount;
      else if (type.endsWith('_poison')) {
        const key = type.replace('_', '-');
        player.weapon_inventory = { ...(player.weapon_inventory || {}), [key]: Number(player.weapon_inventory?.[key] || 0) + amount };
      } else player[type] = Number(player[type] || 0) + amount;
    }
    player.partner_claims = { ...(player.partner_claims || {}), [partner.id]: new Date().toISOString() };
    partnerVisits.consume(player.id, partner);
    queueDirtyPlayerFlush(player.id);
    sendData(response, 200, { claimed: true, rewards });
    return;
  }

  if ((url.pathname === '/api/admin/partners' || url.pathname === '/admin/partners') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    sendData(response, 200, store.partners || []);
    return;
  }

  if ((url.pathname === '/api/admin/partners' || url.pathname === '/admin/partners') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const link = normalizePartnerLink(body?.link);
    let parsedLink;
    try { parsedLink = new URL(link); } catch { parsedLink = null; }
    const icon = String(body?.icon || '').trim();
    let parsedIcon;
    try { parsedIcon = new URL(icon); } catch { parsedIcon = null; }
    const names = Object.fromEntries(['uk', 'en', 'ru'].map((lang) => [lang, String(body?.names?.[lang] || '').trim().slice(0, 80)]));
    const legacyRewards = Object.fromEntries(['uk', 'en', 'ru'].map((lang) => [lang, String(body?.rewards?.[lang] || '').trim().slice(0, 120)]));
    const allowedPartnerRewards = new Set(['tentacles', 'xp', 'energy', 'strength', 'premium', 'small_poison', 'medium_poison', 'large_poison']);
    const rewardItems = Array.isArray(body?.rewardItems) ? body.rewardItems.map((item) => ({
      type: String(item?.type || ''),
      amount: Number(item?.amount),
    })) : [];
    const validRewardItems = rewardItems.length > 0 && rewardItems.length <= 8 && rewardItems.every((item) => (
      allowedPartnerRewards.has(item.type) && Number.isSafeInteger(item.amount) && item.amount > 0 && item.amount <= 1000000000
    ));
    const hasLegacyRewards = Object.values(legacyRewards).every(Boolean);
    const validIcon = (parsedIcon && ['http:', 'https:'].includes(parsedIcon.protocol)) || /^\/api\/telegram\/partner-avatar\?username=[a-zA-Z0-9_]{5,32}$/.test(icon);
    if (!parsedLink || !['http:', 'https:'].includes(parsedLink.protocol) || !validIcon || Object.values(names).some((name) => !name) || (!validRewardItems && !hasLegacyRewards)) {
      sendError(response, 400, 'Заповніть назви, додайте хоча б одну коректну нагороду або локалізований текст, посилання та URL іконки.', 'PARTNER_INVALID');
      return;
    }
    const partner = { id: store.generateId('partner'), verificationMode: body?.verificationMode === 'visit' ? 'visit' : 'verified', names, link: parsedLink.toString(), rewards: hasLegacyRewards ? legacyRewards : { uk: '', en: '', ru: '' }, ...(validRewardItems ? { rewardItems } : {}), icon: parsedIcon ? parsedIcon.toString() : icon, enabled: true, created_at: new Date().toISOString() };
    store.partners = [...(store.partners || []), partner];
    store.persistSoon(0);
    sendData(response, 201, partner);
    return;
  }

  if ((url.pathname === '/api/admin/partners/update' || url.pathname === '/admin/partners/update') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const partnerId = String(body?.id || '');
    const partnerIndex = (store.partners || []).findIndex((partner) => partner.id === partnerId);
    if (partnerIndex < 0) { sendError(response, 404, 'Partner not found', 'PARTNER_NOT_FOUND'); return; }

    const link = normalizePartnerLink(body?.link);
    const icon = String(body?.icon || '').trim();
    let parsedLink;
    let parsedIcon;
    try { parsedLink = new URL(link); } catch { parsedLink = null; }
    try { parsedIcon = new URL(icon); } catch { parsedIcon = null; }
    const names = Object.fromEntries(['uk', 'en', 'ru'].map((lang) => [lang, String(body?.names?.[lang] || '').trim().slice(0, 80)]));
    const allowedPartnerRewards = new Set(['tentacles', 'xp', 'energy', 'strength', 'premium', 'small_poison', 'medium_poison', 'large_poison']);
    const rewardItems = Array.isArray(body?.rewardItems) ? body.rewardItems.map((item) => ({ type: String(item?.type || ''), amount: Number(item?.amount) })) : [];
    const validRewardItems = rewardItems.length > 0 && rewardItems.length <= 8 && rewardItems.every((item) => (
      allowedPartnerRewards.has(item.type) && Number.isSafeInteger(item.amount) && item.amount > 0 && item.amount <= 1000000000
    ));
    const validIcon = (parsedIcon && ['http:', 'https:'].includes(parsedIcon.protocol)) || /^\/api\/telegram\/partner-avatar\?username=[a-zA-Z0-9_]{5,32}$/.test(icon);
    if (!parsedLink || !['http:', 'https:'].includes(parsedLink.protocol) || !validIcon || Object.values(names).some((name) => !name) || !validRewardItems) {
      sendError(response, 400, 'Заповніть назви, додайте коректні нагороди, посилання та URL іконки.', 'PARTNER_INVALID');
      return;
    }

    const current = store.partners[partnerIndex];
    const updated = {
      ...current,
      verificationMode: body?.verificationMode === 'visit' ? 'visit' : 'verified',
      names,
      link: parsedLink.toString(),
      icon: parsedIcon ? parsedIcon.toString() : icon,
      rewardItems,
      rewards: { uk: '', en: '', ru: '' },
      updated_at: new Date().toISOString(),
    };
    store.partners = store.partners.map((partner, index) => index === partnerIndex ? updated : partner);
    store.persistSoon(0);
    sendData(response, 200, updated);
    return;
  }

  if ((url.pathname === '/api/admin/partners/delete' || url.pathname === '/admin/partners/delete') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const partnerId = String(body?.id || '');
    const existing = (store.partners || []).some((partner) => partner.id === partnerId);
    if (!existing) { sendError(response, 404, 'Partner not found', 'PARTNER_NOT_FOUND'); return; }
    store.partners = store.partners.filter((partner) => partner.id !== partnerId);
    store.persistSoon(0);
    sendData(response, 200, { id: partnerId, deleted: true });
    return;
  }

  if (url.pathname === '/api/admin/transactions/revenue' && request.method === 'GET') {
    if (!requireAdminToken(request,response)) return;
    const days=Number(url.searchParams.get('days')??7);
    if(![0,1,7,30].includes(days)){sendError(response,400,'Invalid period','PERIOD_INVALID');return;}
    try {sendData(response,200,await paymentDb.revenueSummary(days));}
    catch {sendError(response,503,'Payment storage unavailable','PAYMENT_DB_UNAVAILABLE');}
    return;
  }

  if ((url.pathname === '/api/admin/transactions' || url.pathname === '/admin/transactions') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    try {
      const { limit = '100' } = getQuery(url);
      const transactions = await paymentDb.listTransactions(Number(limit));
      const playersById = new Map(store.players.map((player) => [String(player.id), player]));
      sendData(response, 200, transactions.map((transaction) => {
        const player = playersById.get(String(transaction.user_id));
        return {
          id: transaction.id,
          player_id: transaction.user_id,
          username: player?.username || player?.nickname || '',
          item_id: transaction.item_id,
          payment_method: transaction.payment_method,
          usd_price: transaction.usd_price,
          amount_paid: transaction.amount_paid,
          status: transaction.status,
          tx_hash: transaction.tx_hash,
          created_at: transaction.created_at,
          completed_at: transaction.completed_at,
        };
      }));
    } catch {
      sendError(response, 503, 'Payment transaction storage is unavailable', 'PAYMENT_DB_UNAVAILABLE');
    }
    return;
  }

  if ((url.pathname === '/api/admin/analytics' || url.pathname === '/admin/analytics') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const params = getQuery(url);
    const days = [1, 7, 30].includes(Number(params.days)) ? Number(params.days) : 7;
    const bossId = String(params.boss || 'all');
    const now = Date.now();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const periodStart = today.getTime() - (days - 1) * 86400000;
    const previousStart = periodStart - days * 86400000;
    const parseTime = (value) => {
      const result = Date.parse(value || '');
      return Number.isFinite(result) ? result : null;
    };
    const players = store.players || [];
    const fights = (store.bossFights || []).filter((fight) => bossId === 'all' || String(fight.boss_id) === bossId);
    const fightStartTime = (fight) => parseTime(fight?.started_at || fight?.created_at);
    const fightEndTime = (fight) => parseTime(fight?.ended_at);
    const isCurrent = (time) => time !== null && time >= periodStart && time <= now;
    const isPrevious = (time) => time !== null && time >= previousStart && time < periodStart;
    const periodFights = fights.filter((fight) => isCurrent(fightStartTime(fight)));
    const previousFights = fights.filter((fight) => isPrevious(fightStartTime(fight)));
    const completedInPeriod = fights.filter((fight) => ['dead', 'completed'].includes(String(fight.status || '').toLowerCase()) && isCurrent(fightEndTime(fight)));
    const completedInPreviousPeriod = fights.filter((fight) => ['dead', 'completed'].includes(String(fight.status || '').toLowerCase()) && isPrevious(fightEndTime(fight)));
    const periodFightIds = new Set(periodFights.map((fight) => String(fight.id)));
    const previousFightIds = new Set(previousFights.map((fight) => String(fight.id)));
    const currentDamageLogs = (store.bossDamageLogs || []).filter((log) => periodFightIds.has(String(log.fight_id)) && Number(log.damage || 0) > 0);
    const previousDamageLogs = (store.bossDamageLogs || []).filter((log) => previousFightIds.has(String(log.fight_id)) && Number(log.damage || 0) > 0);
    const uniqueAttackers = (logs) => new Set(logs.map((log) => String(log.player_email || log.player_id || log.player_name || '')).filter(Boolean)).size;
    const countCompleted = (items) => items.filter((fight) => ['dead', 'completed'].includes(String(fight.status || '').toLowerCase())).length;
    const newPlayersIn = (start, end) => players.filter((player) => {
      const time = parseTime(player.created_at || player.created_date);
      return time !== null && time >= start && time < end;
    }).length;

    let transactions = null;
    let transactionsSampled = false;
    try {
      transactions = await paymentDb.listTransactions(500);
      transactionsSampled = transactions.length >= 500;
    } catch {
      transactions = null;
    }
    const paymentTime = (transaction) => parseTime(transaction.completed_at || transaction.created_at);
    const successful = (transaction) => ['success', 'completed', 'succeeded', 'paid'].includes(String(transaction.status || '').toLowerCase());
    const periodTransactions = transactions?.filter((transaction) => isCurrent(paymentTime(transaction))) || [];
    const previousTransactions = transactions?.filter((transaction) => isPrevious(paymentTime(transaction))) || [];
    const currentSuccessful = periodTransactions.filter(successful);
    const previousSuccessful = previousTransactions.filter(successful);

    const series = Array.from({ length: days }, (_, index) => {
      const dayStart = periodStart + index * 86400000;
      const dayEnd = dayStart + 86400000;
      const key = new Date(dayStart).toISOString().slice(0, 10);
      const dayFightIds = new Set(fights.filter((fight) => {
        const time = fightStartTime(fight);
        return time !== null && time >= dayStart && time < dayEnd;
      }).map((fight) => String(fight.id)));
      const dayCompletedFights = completedInPeriod.filter((fight) => {
        const time = fightEndTime(fight);
        return time !== null && time >= dayStart && time < dayEnd;
      });
      const dayLogs = (store.bossDamageLogs || []).filter((log) => dayFightIds.has(String(log.fight_id)) && Number(log.damage || 0) > 0);
      const dayTransactions = transactions?.filter((transaction) => {
        const time = paymentTime(transaction);
        return time !== null && time >= dayStart && time < dayEnd && successful(transaction);
      }) || [];
      return {
        date: key,
        label: new Date(dayStart).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
        registrations: newPlayersIn(dayStart, dayEnd),
        bossPlayers: uniqueAttackers(dayLogs),
        completedFights: countCompleted(dayCompletedFights),
        successfulPayments: dayTransactions.length,
      };
    });

    const damageByFight = new Map();
    for (const log of currentDamageLogs) {
      const id = String(log.fight_id);
      const totals = damageByFight.get(id) || { damage: 0, poisonDamage: 0 };
      totals.damage += Number(log.damage || 0);
      totals.poisonDamage += Number(log.poison_damage || 0);
      damageByFight.set(id, totals);
    }
    const bossBuckets = new Map();
    for (const fight of periodFights) {
      const id = String(fight.boss_id || 'unknown');
      const bucket = bossBuckets.get(id) || { bossId: id, name: fight.boss_name || id, fights: 0, completed: 0, damage: 0, poisonDamage: 0 };
      bucket.fights += 1;
      if (['dead', 'completed'].includes(String(fight.status || '').toLowerCase())) bucket.completed += 1;
      const totals = damageByFight.get(String(fight.id));
      bucket.damage += totals?.damage || 0;
      bucket.poisonDamage += totals?.poisonDamage || 0;
      bossBuckets.set(id, bucket);
    }
    const balances = players.reduce((total, player) => {
      const inventory = player.weapon_inventory || {};
      total.tentacles += Number(player.tentacles || 0);
      total.tPape += Number(player.premium || 0);
      total.energy += Number(player.energy || 0);
      total.ca += Number(player.stat_strength || 0);
      total.smallPoison += Number(inventory['small-poison'] || 0);
      total.mediumPoison += Number(inventory['medium-poison'] || 0);
      total.largePoison += Number(inventory['large-poison'] || 0);
      return total;
    }, { tentacles: 0, tPape: 0, energy: 0, ca: 0, smallPoison: 0, mediumPoison: 0, largePoison: 0 });

    const levelRanges = [
      { name: 'Рівень 1–5', min: 1, max: 5 },
      { name: 'Рівень 6–10', min: 6, max: 10 },
      { name: 'Рівень 11–20', min: 11, max: 20 },
      { name: 'Рівень 21–50', min: 21, max: 50 },
      { name: 'Рівень 51+', min: 51, max: Infinity },
    ];
    const playerProgress = {
      total: players.length,
      missions: players.filter((player) => Object.values(player.task_completions || {}).some((count) => Number(count) > 0)).length,
      bossKills: players.filter((player) => Number(player.boss_kills || 0) > 0 || Object.values(player.boss_kills_by_id || {}).some((count) => Number(count) > 0)).length,
      boxesOpened: players.filter((player) => Number(player.opened_boxes_total || 0) > 0).length,
      clanMembers: players.filter((player) => Boolean(player.clan_id || player.clan_name)).length,
    };
    const levelDistribution = levelRanges.map(({ name, min, max }) => ({
      name,
      players: players.filter((player) => {
        const level = Math.max(1, Number(player.level || 1));
        return level >= min && level <= max;
      }).length,
    }));
    const paymentMethodNames = { stars: 'Telegram Stars', ton: 'TON', near: 'NEAR' };
    const paymentMethods = ['stars', 'ton', 'near'].map((method) => {
      const methodTransactions = periodTransactions.filter((transaction) => String(transaction.payment_method || '').toLowerCase() === method);
      const methodSuccessful = methodTransactions.filter(successful);
      return {
        method,
        name: paymentMethodNames[method],
        successful: methodSuccessful.length,
        failed: methodTransactions.filter((transaction) => ['failed', 'error'].includes(String(transaction.status || '').toLowerCase())).length,
        pending: methodTransactions.filter((transaction) => String(transaction.status || '').toLowerCase() === 'pending').length,
        usdRevenue: methodSuccessful.reduce((sum, transaction) => sum + Number(transaction.usd_price || 0), 0),
      };
    });

    sendData(response, 200, {
      days,
      boss: bossId,
      generatedAt: new Date(now).toISOString(),
      summary: {
        players: players.length,
        newPlayers: { current: newPlayersIn(periodStart, now + 1), previous: newPlayersIn(previousStart, periodStart) },
        bossParticipants: { current: uniqueAttackers(currentDamageLogs), previous: uniqueAttackers(previousDamageLogs) },
        completedBossFights: { current: countCompleted(completedInPeriod), previous: countCompleted(completedInPreviousPeriod) },
        activeBossFights: fights.filter((fight) => String(fight.status || '').toLowerCase() === 'active').length,
        successfulPayments: transactions === null ? null : { current: currentSuccessful.length, previous: previousSuccessful.length },
        failedPayments: transactions === null ? null : periodTransactions.filter((transaction) => ['failed', 'error'].includes(String(transaction.status || '').toLowerCase())).length,
        uniquePayers: transactions === null ? null : new Set(currentSuccessful.map((transaction) => String(transaction.user_id || '')).filter(Boolean)).size,
      },
      series,
      bosses: [...bossBuckets.values()].sort((a, b) => b.fights - a.fights),
      combat: {
        actualDamage: currentDamageLogs.reduce((sum, log) => sum + Number(log.damage || 0), 0),
        actualPoisonDamage: currentDamageLogs.reduce((sum, log) => sum + Number(log.poison_damage || 0), 0),
      },
      balances,
      playerProgress,
      levelDistribution,
      paymentMethods,
      paymentsAvailable: transactions !== null,
      paymentsSampled: transactionsSampled,
    });
    return;
  }

  if ((url.pathname === '/api/admin/promo-codes' || url.pathname === '/admin/promo-codes') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    sendData(response, 200, (store.promoCodes || []).map(promo => ({...promo, activationCount: Math.max(Number(promo.activationCount || 0), store.players.filter(player => (player.used_promo_codes || []).some(code => String(code).trim().toUpperCase() === promo.code)).length)})));
    return;
  }

  if ((url.pathname === '/api/admin/promo-codes' || url.pathname === '/admin/promo-codes') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const code = String(body?.code || '').trim().toUpperCase();
    const validFields = new Set(['tentacles', 'xp', 'energy', 'premium', 'small_poison', 'medium_poison', 'large_poison']);
    const rewards = Array.isArray(body?.rewards) ? body.rewards.map((reward) => ({
      type: String(reward?.type || ''),
      amount: Number(reward?.amount),
    })) : [];
    const maxActivations = Number(body?.maxActivations || 0);
    const startsOn = String(body?.startsOn || '').trim();
    const expiresOn = String(body?.expiresOn || '').trim();
    const validDate = (value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
    const validRewards = rewards.length > 0 && rewards.length <= 8 && rewards.every((reward) => (
      validFields.has(reward.type) && Number.isSafeInteger(reward.amount) && reward.amount > 0 && reward.amount <= 1000000000
    ));
    if (!Number.isSafeInteger(maxActivations) || maxActivations < 0 || !/^[A-Z0-9_-]{3,24}$/.test(code) || !validRewards || !validDate(startsOn) || !validDate(expiresOn) || (startsOn && expiresOn && startsOn > expiresOn)) {
      sendError(response, 400, 'Invalid promo code or reward', 'PROMO_INVALID');
      return;
    }
    if ((store.promoCodes || []).some((promo) => promo.code === code)) {
      sendError(response, 409, 'Promo code already exists', 'PROMO_EXISTS');
      return;
    }
    const label = String(body?.label || rewards.map((reward) => `${reward.amount} ${reward.type}`).join(' + ')).slice(0, 80);
    const promo = { code, label, rewards, maxActivations, activationCount: 0, ...(startsOn ? { startsOn } : {}), ...(expiresOn ? { expiresOn } : {}), enabled: true, created_at: new Date().toISOString() };
    store.promoCodes = [...(store.promoCodes || []), promo];
    store.persistSoon(0);
    sendData(response, 201, promo);
    return;
  }

  if ((url.pathname === '/api/admin/promo-codes/toggle' || url.pathname === '/admin/promo-codes/toggle') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const promo = (store.promoCodes || []).find((entry) => entry.code === String(body?.code || '').toUpperCase());
    if (!promo) { sendError(response, 404, 'Promo code not found', 'PROMO_NOT_FOUND'); return; }
    promo.enabled = !promo.enabled;
    store.persistSoon(0);
    sendData(response, 200, promo);
    return;
  }

  if ((url.pathname === '/api/admin/promo-codes/delete' || url.pathname === '/admin/promo-codes/delete') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const code = String(body?.code || '').trim().toUpperCase();
    const exists = (store.promoCodes || []).some((promo) => promo.code === code);
    if (!exists) { sendError(response, 404, 'Promo code not found', 'PROMO_NOT_FOUND'); return; }
    store.promoCodes = store.promoCodes.filter((promo) => promo.code !== code);
    store.persistSoon(0);
    sendData(response, 200, { code, deleted: true });
    return;
  }

  if (url.pathname === '/api/admin/players/ban' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const player = store.players.find((entry) => String(entry.id) === String(body?.playerId));
    if (!player) { sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND'); return; }
    player.is_banned = Boolean(body?.banned);
    player.ban_reason = player.is_banned ? String(body?.reason || 'Адміністративне блокування').slice(0, 240) : '';
    player.banned_at = player.is_banned ? new Date().toISOString() : null;
    store.persistSoon(0);
    sendData(response, 200, { id: player.id, is_banned: player.is_banned, ban_reason: player.ban_reason });
    return;
  }

  if (url.pathname === '/api/admin/custom-boxes' && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    sendData(response, 200, store.customLootBoxes || []);
    return;
  }

  if (url.pathname === '/api/admin/custom-boxes' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const name = String(body?.name || '').trim().slice(0, 48);
    const rows = Array.isArray(body?.guaranteed) ? body.guaranteed : [];
    const bonus = Array.isArray(body?.bonus) ? body.bonus : [];
    const validTypes = new Set(['tentacles', 'xp', 'energy', 'strength', 'poison', 'premium', 'boss_gear_piece', 'boss_pet', 'boss_background', 'nothing', 'keycard']);
    const normalizeRows = (list) => list.slice(0, 24).map((row) => {
      const type = String(row?.type || '');
      const qty = Math.max(0, Math.floor(Number(row?.qty) || 0));
      if (!validTypes.has(type) || !qty) return null;
      return { type, name: String(row?.name || type).slice(0, 60), qty, ...(list === bonus ? { weight: Math.max(0, Number(row?.weight) || 0) } : {}) };
    }).filter(Boolean);
    const guaranteed = normalizeRows(rows);
    const bonusRows = normalizeRows(bonus);
    if (!name || (!guaranteed.length && !bonusRows.length)) { sendError(response, 400, 'Box name and at least one valid reward are required', 'BOX_INVALID'); return; }
    const box = { id: `custom_${store.generateId('box').replace(/[^a-zA-Z0-9_]/g, '_')}`, name, table: { guaranteed, bonus: bonusRows, rolls: Math.max(0, Math.min(20, Number(body?.rolls) || 0)) }, created_at: new Date().toISOString() };
    store.customLootBoxes = [...(store.customLootBoxes || []), box];
    store.persistSoon(0);
    sendData(response, 201, box);
    return;
  }

  if (['/api/admin/holder-drops', '/admin/holder-drops'].includes(url.pathname) && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    try {
      const drops = getHolderDrops();
      sendData(response, 200, drops.map(({ icon, iconMime, ...drop }) => ({ ...drop, iconUrl: icon ? `/api/holder-drop-icon?id=${encodeURIComponent(drop.id)}` : '', iconMime })));
    } catch (error) { sendError(response, 400, error.message, 'HOLDER_DROPS_FAILED'); }
    return;
  }

  if (['/api/admin/holder-drops', '/admin/holder-drops'].includes(url.pathname) && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    try {
      if (body?.action === 'metadata') {
        const kind = body.kind === 'token' ? 'token' : 'nft';
        const contract = String(body.contract || '').trim().toLowerCase();
        sendData(response, 200, await loadNearCampaignMetadata(contract, kind));
        return;
      }
      if (body?.action === 'create') {
        const drop = newHolderDrop(body.kind);
        const saved = saveHolderDrop({ ...drop, ...(body.contract ? { contract: body.contract } : {}) });
        await store.persistNow();
        sendData(response, 201, { ...saved, iconUrl: '' });
        return;
      }
      if (body?.action === 'delete') {
        if (!getHolderDrop(body.id)) { sendError(response, 404, 'Drop not found', 'HOLDER_DROP_NOT_FOUND'); return; }
        deleteHolderDrop(body.id); await store.persistNow(); sendData(response, 200, { ok: true }); return;
      }
      if (body?.action === 'preview' || body?.action === 'run' || body?.action === 'resend' || body?.action === 'send-selected' || body?.action === 'send-pet-selected') {
        if (body.action === 'resend' && !String(body.playerId || '').trim()) { sendError(response, 400, 'Player is required for resend', 'HOLDER_PLAYER_REQUIRED'); return; }
        const result = await processHolderDrop({ id: body.id, previewOnly: body.action === 'preview', forcePlayerId: body.action === 'resend' ? String(body.playerId) : '', petOnly: body.action === 'send-pet-selected', ...(['send-selected', 'send-pet-selected'].includes(body.action) ? { playerIds: body.playerIds ?? [] } : {}) });
        sendData(response, 200, result); return;
      }
      const { action: _action, iconData, iconUrl: _iconUrl, ...safeBody } = body || {};
      const old = getHolderDrop(safeBody.id);
      if (!old && !safeBody.id) { sendError(response, 400, 'Drop id is required', 'HOLDER_DROP_ID_REQUIRED'); return; }
      const saved = saveHolderDrop({ ...old, ...safeBody, icon: iconData === undefined ? (old?.icon || safeBody.icon) : iconData, iconMime: body.iconMime === undefined ? old?.iconMime : body.iconMime });
      await store.persistNow();
      const { icon, iconMime, ...output } = saved;
      sendData(response, 200, { ...output, iconUrl: icon ? `/api/holder-drop-icon?id=${encodeURIComponent(saved.id)}` : '', iconData: icon, iconMime });
    } catch (error) { sendError(response, error.statusCode || 400, error.message || 'Holder drop failed', error.code || 'HOLDER_DROP_FAILED'); }
    return;
  }

  if (['/api/admin/nft-holder-campaign', '/admin/nft-holder-campaign'].includes(url.pathname) && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const config = normalizeNftHolderCampaign(store.nftHolderCampaign || defaultNftHolderCampaign());
    let metadataChanged = false;
    if (!config.nftName || !config.nftIcon) {
      try { const meta = await loadNearCampaignMetadata(config.nftContract, 'nft'); Object.assign(config, { nftName: meta.name, nftSymbol: meta.symbol, nftIcon: meta.icon, nftIconMime: meta.iconMime }); metadataChanged = true; } catch { /* Keep the contract editable if RPC metadata is temporarily unavailable. */ }
    }
    if (!config.tokenName || !config.tokenIcon) {
      try { const meta = await loadNearCampaignMetadata(config.tokenContract, 'token'); Object.assign(config, { tokenName: meta.name, tokenSymbol: meta.symbol, tokenDecimals: meta.decimals, tokenIcon: meta.icon, tokenIconMime: meta.iconMime }); metadataChanged = true; } catch { /* Keep the known PL4 defaults if RPC is unavailable. */ }
    }
    if (metadataChanged) { store.nftHolderCampaign = config; store.persistSoon(0); }
    sendData(response, 200, { ...config, nftIcon: config.nftIcon ? '/api/nft-holder-campaign/icon?asset=nft' : '', tokenIcon: config.tokenIcon ? '/api/nft-holder-campaign/icon?asset=token' : '' });
    return;
  }

  if (['/api/admin/nft-holder-campaign', '/admin/nft-holder-campaign'].includes(url.pathname) && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    try {
      if (body?.action === 'metadata') {
        const kind = body.asset === 'token' ? 'token' : 'nft';
        const contract = String(body.contract || (kind === 'token' ? 'pl4.nearlytrade.near' : 'nft.herewallet.near')).trim().toLowerCase();
        const metadata = await loadNearCampaignMetadata(contract, kind);
        sendData(response, 200, metadata);
        return;
      }
    if (body?.action === 'run' || body?.action === 'resend') {
        if (body.action === 'resend' && !String(body.playerId || '').trim()) { sendError(response, 400, 'Player is required for resend', 'HOLDER_PLAYER_REQUIRED'); return; }
        const result = await processNftHolderCampaign({ forcePlayerId: body.action === 'resend' ? String(body.playerId || '') : '' });
        sendData(response, 200, result);
        return;
      }
      const existing = store.nftHolderCampaign || defaultNftHolderCampaign();
      const { action: _action, nftIconData, tokenIconData, nftIcon: _nftIcon, tokenIcon: _tokenIcon, ...safeBody } = body || {};
      const next = normalizeNftHolderCampaign({
        ...existing,
        ...safeBody,
        sentByDay: existing.sentByDay || {}, lastResult: existing.lastResult || null, lastRunAt: existing.lastRunAt || '',
        nftIcon: nftIconData === undefined ? existing.nftIcon : nftIconData,
        nftIconMime: body.nftIconMime === undefined ? existing.nftIconMime : body.nftIconMime,
        tokenIcon: tokenIconData === undefined ? existing.tokenIcon : tokenIconData,
        tokenIconMime: body.tokenIconMime === undefined ? existing.tokenIconMime : body.tokenIconMime,
      });
      if ((!existing.nftEnabled && next.nftEnabled) || (!existing.tokenEnabled && next.tokenEnabled)) next.lastRunAt = '';
      store.nftHolderCampaign = next;
      await store.persistNow();
      sendData(response, 200, { ...next, nftIcon: next.nftIcon ? '/api/nft-holder-campaign/icon?asset=nft' : '', tokenIcon: next.tokenIcon ? '/api/nft-holder-campaign/icon?asset=token' : '' });
    } catch (error) { sendError(response, error.statusCode || 400, error.message || 'Holder campaign failed', error.code || 'HOLDER_CAMPAIGN_FAILED'); }
    return;
  }

  if (url.pathname === '/referrals/share' && request.method === 'POST') {
    const verified = verifyTelegramInitData(request.headers['x-telegram-init-data']);
    const player = getCurrentPlayer(request);
    if (!verified.ok || !player) { sendError(response, 401, 'Open the game in Telegram to share an invitation', 'TELEGRAM_AUTH_REQUIRED'); return; }
    try { sendData(response, 200, await prepareReferralMessage({player, token: serverConfig.telegramBotToken, language: player.language})); }
    catch (error) { sendError(response, 502, error.message, 'REFERRAL_SHARE_FAILED'); }
    return;
  }

  if (url.pathname === '/api/admin/grants/preview' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const target = body?.target || {};
    try {
      const scan = await buildNearAudience(store.players, target);
      const recipients = scan.recipients;
      const wallets = [...new Set(recipients.map(p => p.near_wallet_id).filter(Boolean))];
      sendData(response, 200, { recipientCount: recipients.length, walletCount: wallets.length, wallets, unknown: scan.unknown, source: scan.source, network: scan.network, snapshotAt: scan.snapshotAt, recipients: recipients.map(p => ({ id: p.id, nickname: p.nickname || p.username || '', level: p.level || 1, wallet: p.near_wallet_id || '', battlePass: p.battle_pass?.tier || 'free' })) });
    } catch (error) { sendError(response, 400, error.message, 'AUDIENCE_INVALID'); }
    return;
  }

  if (url.pathname === '/api/admin/mail-log' && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    sendData(response, 200, (store.adminMailLog || []).slice(0, 200));
    return;
  }

  if (url.pathname === '/api/admin/raid-boss/participants' && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    await store.refreshRaidBoss();
    const raidBoss = store.raidBoss;
    const playersById = new Map((store.players || []).map((player) => [String(player.id), player]));
    const participants = Object.entries(raidBoss?.participants || {}).map(([playerId, contribution]) => {
      const player = playersById.get(String(playerId));
      const sent = raidBoss?.admin_rewards_sent?.[playerId] || null;
      return {
        playerId,
        nickname: player?.nickname || contribution?.name || player?.username || playerId,
        username: player?.username || '',
        level: Number(player?.level || 1),
        damage: Number(contribution?.damage || 0),
        hits: Number(contribution?.hits || 0),
        poisonUsed: Number(contribution?.poison_used || 0),
        poisonUsedKnown: contribution?.poison_tracking_complete === true,
        rewardSent: Boolean(sent),
        rewardSentAt: sent?.at || '',
        rewards: sent?.rewards || [],
      };
    }).sort((a, b) => b.damage - a.damage || b.hits - a.hits);
    sendData(response, 200, {
      raid: raidBoss ? { id: raidBoss.id || 'raid', name: raidBoss.name || 'Raid Boss', status: raidBoss.status || 'unknown', startedAt: raidBoss.started_at || '', defeatedAt: raidBoss.defeated_at || '' } : null,
      rewardRates: Array.isArray(raidBoss?.admin_reward_rates) ? raidBoss.admin_reward_rates : [],
      participants,
    });
    return;
  }

  if (url.pathname === '/api/admin/raid-boss/reward-rates' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    await store.refreshRaidBoss();
    const body = await readJsonBody(request);
    const fields = new Set(['tentacles', 'xp', 'premium', 'energy', 'stat_strength', 'small_poison', 'medium_poison', 'large_poison']);
    const rates = Array.isArray(body?.rates) ? body.rates.slice(0, 8).map((row) => ({ field: String(row?.field || ''), rate: Number(row?.rate) })) : [];
    if (rates.some((row) => !fields.has(row.field) || !Number.isFinite(row.rate) || row.rate <= 0 || row.rate > 1000000000) || new Set(rates.map((row) => row.field)).size !== rates.length) {
      sendError(response, 400, 'Use unique reward resources and positive rates per 1,000 damage', 'RAID_REWARD_RATES_INVALID'); return;
    }
    if (!store.raidBoss) { sendError(response, 404, 'Raid boss not found', 'RAID_BOSS_NOT_FOUND'); return; }
    store.raidBoss.admin_reward_rates = rates;
    await store.persistNow();
    sendData(response, 200, { rates });
    return;
  }

  if (url.pathname === '/api/admin/raid-boss/rewards' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    await store.refreshRaidBoss();
    const body = await readJsonBody(request);
    const raidBoss = store.raidBoss;
    const playerId = String(body?.playerId || '').trim();
    const contribution = raidBoss?.participants?.[playerId];
    const player = (store.players || []).find((entry) => String(entry.id) === playerId);
    if (!raidBoss || !contribution || !player) { sendError(response, 404, 'Raid participant not found', 'RAID_PARTICIPANT_NOT_FOUND'); return; }
    if (raidBoss.admin_rewards_sent?.[playerId]) { sendError(response, 409, 'Rewards already sent to this player for this raid', 'RAID_REWARD_ALREADY_SENT'); return; }
    let rewards;
    try {
      if (body?.autoByDamage) {
        const rates = Array.isArray(raidBoss.admin_reward_rates) ? raidBoss.admin_reward_rates : [];
        if (!rates.length) throw Object.assign(new Error('Configure at least one reward rate per 1,000 damage first'), { statusCode: 400, code: 'RAID_REWARD_RATES_REQUIRED' });
        if (contribution.poison_tracking_complete !== true) throw Object.assign(new Error('Poison usage was not tracked for this participant in the current raid; automatic ×1.5 calculation is unavailable'), { statusCode: 409, code: 'RAID_POISON_USAGE_UNKNOWN' });
        const computed = calculateRaidRewardAmounts(contribution.damage, contribution.poison_used, rates);
        rewards = normalizeGiftRewards(computed);
      } else rewards = normalizeGiftRewards(body?.rewards);
    }
    catch (error) { sendError(response, error.statusCode || 400, error.message, error.code || 'GIFT_INVALID'); return; }

    const at = new Date().toISOString();
    const batchId = store.generateId('raid-reward');
    const localizedCopy = getRaidRewardMailCopy(player.language);
    const title = localizedCopy.title;
    const text = localizedCopy.text;
    player.gift_mail = [...(player.gift_mail || []), {
      id: store.generateId('gift-mail'), title, text, rewards, created_at: at,
    }].slice(-100);
    raidBoss.admin_rewards_sent = { ...(raidBoss.admin_rewards_sent || {}), [playerId]: { at, rewards, batchId } };
    const senderRole = adminRole(getAdminTokenFromRequest(request), ADMIN_TOKEN) || 'admin';
    store.adminMailLog = [{
      id: batchId, senderRole, senderName: senderRole === 'operator' ? 'Moderator' : 'Admin',
      title, text, rewards, createdAt: at,
      recipients: [{ id: player.id, nickname: player.nickname || player.username || player.id }],
    }, ...(store.adminMailLog || [])].slice(0, 200);
    await playerDb.flushDirtyPlayers([player.id]);
    await store.persistNow();
    sendData(response, 200, { playerId, batchId, rewards, sentAt: at });
    return;
  }

  if (url.pathname === '/api/admin/grants' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const target = body?.target || {};
    const gift = body?.gift || {};
    let recipients;
    let giftRewards = [];
    try { recipients = (await buildNearAudience(store.players, target)).recipients; }
    catch (error) { sendError(response, 400, error.message, 'AUDIENCE_INVALID'); return; }
    if (!recipients.length) { sendError(response, 400, 'No players match the selected audience', 'GRANT_EMPTY_AUDIENCE'); return; }
    if (recipients.length > 10000) { sendError(response, 413, 'Audience exceeds the safe limit', 'GRANT_AUDIENCE_LIMIT'); return; }
    if (gift.kind === 'box') {
      const boxType = String(gift.boxType || '');
      const builtIn = Object.hasOwn(getBossBoxTables(), boxType);
      const custom = (store.customLootBoxes || []).find((box) => box.id === boxType);
      if (!builtIn && !custom) { sendError(response, 400, 'Unknown box type', 'BOX_UNKNOWN'); return; }
      const quantity = Math.max(1, Math.min(100, Math.floor(Number(gift.quantity) || 1)));
      const now = Date.now();
      for (const player of recipients) {
        player.pending_boss_boxes = [...(player.pending_boss_boxes || []), ...Array.from({ length: quantity }, (_, index) => ({ instanceId: `gift-${now}-${index}-${store.generateId('box')}`, boxType, bossId: null, source: 'admin_gift', displayName: custom?.name || '' }))];
      }
    } else if (gift.kind === 'resource') {
      const rewardRows = Array.isArray(gift.rewards) ? gift.rewards : [{ field: gift.field, amount: gift.amount }];
      try { giftRewards = normalizeGiftRewards(rewardRows); }
      catch (error) { sendError(response, error.statusCode || 400, error.message, error.code || 'GIFT_INVALID'); return; }
    } else { sendError(response, 400, 'Unsupported gift type', 'GIFT_INVALID'); return; }
    const giftTitle = normalizeGiftMailContent(gift.title, 'Gift', 120);
    const giftText = normalizeGiftMailContent(gift.text, '', 4000);
    if (giftTitle || giftText || giftRewards.length) {
      const batchId = store.generateId('admin-mail');
      const senderRole = adminRole(getAdminTokenFromRequest(request), ADMIN_TOKEN) || 'admin';
      store.adminMailLog = [{
        id: batchId, senderRole, senderName: senderRole === 'operator' ? 'Moderator' : 'Admin',
        title: giftTitle || 'Gift', text: giftText, rewards: giftRewards, createdAt: new Date().toISOString(),
        recipients: recipients.map((player) => ({ id: player.id, nickname: player.nickname || player.username || player.id })),
      }, ...(store.adminMailLog || [])].slice(0, 200);
      for (const player of recipients) {
        player.gift_mail = [...(player.gift_mail || []), {
          id: store.generateId('gift-mail'), title: giftTitle || 'Gift', text: giftText,
          ...(giftRewards.length ? { rewards: giftRewards } : {}),
          created_at: new Date().toISOString(),
        }].slice(-100);
      }
    }
    await playerDb.flushDirtyPlayers();
    store.persistSoon(0);
    sendData(response, 200, { recipientCount: recipients.length, mailCount: giftTitle || giftText || giftRewards.length ? recipients.length : 0 });
    return;
  }

  if ((url.pathname === '/api/admin/acquisition' || url.pathname === '/admin/acquisition') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const players = (store.players || []).filter((player) => /^ad_[a-z0-9_-]{1,60}$/i.test(String(player.acquisition_campaign || '')));
    const byCampaign = new Map();
    for (const player of players) {
      const campaign = String(player.acquisition_campaign);
      const entry = byCampaign.get(campaign) || { campaign, count: 0, firstSeen: '', lastSeen: '' };
      const at = String(player.acquisition_at || player.created_date || player.created_at || '');
      entry.count += 1;
      if (at && (!entry.firstSeen || at < entry.firstSeen)) entry.firstSeen = at;
      if (at && (!entry.lastSeen || at > entry.lastSeen)) entry.lastSeen = at;
      byCampaign.set(campaign, entry);
    }
    sendData(response, 200, {
      total: players.length,
      campaigns: [...byCampaign.values()].sort((a, b) => b.count - a.count || a.campaign.localeCompare(b.campaign)),
      players: players.sort((a, b) => String(b.acquisition_at || b.created_date || '').localeCompare(String(a.acquisition_at || a.created_date || ''))).slice(0, 2000).map((player) => ({
        id: player.id, username: player.username || '', nickname: player.nickname || '', level: Number(player.level) || 1,
        campaign: player.acquisition_campaign, acquiredAt: player.acquisition_at || player.created_date || player.created_at || '',
      })),
    });
    return;
  }

  if ((url.pathname === '/api/admin/players/summary' || url.pathname === '/admin/players/summary') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const players = store.players || [];
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const createdTime = (player) => Date.parse(player.created_at || player.created_date || '') || 0;
    sendData(response, 200, {
      total: players.length,
      newLast7Days: players.filter((player) => createdTime(player) >= sevenDaysAgo).length,
      banned: players.filter((player) => Boolean(player.is_banned)).length,
      clanMembers: players.filter((player) => Boolean(player.clan_id || player.clan_name)).length,
    });
    return;
  }

  if ((url.pathname === '/api/admin/players' || url.pathname === '/admin/players') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const { sort = '-created_date', limit = '50', username, playerId, view } = getQuery(url);
    let players = playerId ? store.players.filter(player => String(player.id) === String(playerId)) : store.players;
    if (username) {
      players = players.filter((player) =>
        `${player.nickname || ''} ${player.username || ''}`.toLowerCase().includes(String(username).toLowerCase())
      );
    }
    players = sortPlayers(players, sort).slice(0, Math.max(1, Math.min(500, Number(limit) || 50)));
    const listFields = ['id', 'created_by', 'email', 'telegram_id', 'nickname', 'username', 'level', 'xp', 'energy', 'max_energy', 'stat_strength', 'tentacles', 'premium', 'is_banned', 'ban_reason', 'created_at', 'created_date', 'last_login_date', 'clan_id', 'clan_name'];
    sendData(response, 200, view === 'summary'
      ? players.map(player => ({ ...Object.fromEntries(listFields.map(key => [key, player[key]])), _admin_summary: true }))
      : players.map(normalizePlayerProgression));
    return;
  }

  if ((url.pathname === '/api/admin/leaderboard' || url.pathname === '/admin/leaderboard') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const { sort = '-level', limit = '100' } = getQuery(url);
    sendData(response, 200, sortPlayers(store.players, sort).slice(0, Number(limit)).map(normalizePlayerProgression));
    return;
  }

  if (url.pathname.startsWith('/api/admin/players/') && url.pathname.endsWith('/talent-compensation') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const playerId = decodeURIComponent(url.pathname.split('/').at(-2));
    const body = await readJsonBody(request);
    const player = store.players.find(p => String(p.id) === playerId);
    if (!player) { sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND'); return; }
    const result = compensateTalentPoints(player, body.amount, body.requestId);
    await playerDb.flushDirtyPlayers([player.id]);
    sendData(response, 200, { ...result, player: normalizePlayerProgression(player) });
    return;
  }

  if (url.pathname.startsWith('/api/admin/players/') && url.pathname.endsWith('/equipment-sets') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const playerId = decodeURIComponent(url.pathname.split('/').at(-2));
    const player = store.players.find(p => String(p.id) === playerId);
    if (!player) { sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND'); return; }
    const result = grantAllEquipmentSets(player);
    store.persistSoon(0);
    sendData(response, 200, { ...result, player: normalizePlayerProgression(player) });
    return;
  }

  if (url.pathname.startsWith('/api/admin/players/') && url.pathname.endsWith('/battle-pass') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const playerId = decodeURIComponent(url.pathname.split('/').at(-2));
    const body = await readJsonBody(request);
    const player = store.players.find(p => String(p.id) === playerId);
    if (!player) { sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND'); return; }
    if (!['epic','legendary'].includes(body?.tier)) { sendError(response, 400, 'Invalid Battle Pass tier', 'BATTLE_PASS_TIER_INVALID'); return; }
    try { if (body.fullUnlock === true) fullyUnlockBattlePass(player, body.tier); else unlockBattlePassTier(player, body.tier); }
    catch (error) { sendError(response, 400, error.message, 'BATTLE_PASS_UNAVAILABLE'); return; }
    store.persistSoon(0);
    sendData(response, 200, { player: normalizePlayerProgression(player) });
    return;
  }

  if ((url.pathname.startsWith('/api/admin/players/') || url.pathname.startsWith('/admin/players/')) && url.pathname.endsWith('/starter-guide') && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const parts = url.pathname.split('/').filter(Boolean);
    const playerId = parts[parts.length - 2];
    const body = await readJsonBody(request);
    const player = store.players.find((item) => String(item.id) === String(playerId));
    if (!player) {
      sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND');
      return;
    }
    if (body?.action === 'disable' || body?.action === 'enable') {
      player.tutorial_disabled = body.action === 'disable';
      player.tutorial_disabled_at = player.tutorial_disabled ? new Date().toISOString() : null;
      store.persistSoon(0);
      sendData(response, 200, { player: normalizePlayerProgression(player) });
      return;
    }
    if (body?.action === 'grant_reward') {
      const alreadyClaimed = Boolean(player.tutorial_level_eight_reward_claimed);
      if (!alreadyClaimed) {
        const inventory = player.weapon_inventory || {};
        player.tentacles = Number(player.tentacles || 0) + 10000;
        player.premium = Number(player.premium || 0) + 10;
        player.stat_strength = Number(player.stat_strength || 0) + 100;
        player.xp = Number(player.xp || 0) + 200;
        player.energy = Number(player.energy || 0) + 100;
        player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + 2;
        player.weapon_inventory = {
          ...inventory,
          'small-poison': Number(inventory['small-poison'] || 0) + 10,
          'medium-poison': Number(inventory['medium-poison'] || 0) + 5,
          'large-poison': Number(inventory['large-poison'] || 0) + 3,
        };
        player.tutorial_level_eight_reward_claimed = true;
      }
      store.persistSoon(0);
      sendData(response, 200, { player: normalizePlayerProgression(player), alreadyClaimed });
      return;
    }
    sendError(response, 400, 'Unsupported starter guide action', 'STARTER_GUIDE_ACTION_INVALID');
    return;
  }

  if ((url.pathname.startsWith('/api/admin/players/') || url.pathname.startsWith('/admin/players/')) && request.method === 'PATCH') {
    if (!requireAdminToken(request, response)) return;
    const parts = url.pathname.split('/').filter(Boolean);
    const playerId = parts[parts.length - 1];
    const body = await readJsonBody(request);
    const player = store.players.find((item) => item.id === playerId);
    if (!player) {
      sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND');
      return;
    }
    if (!IS_PRODUCTION && ['epic', 'legendary'].includes(String(body?.battle_pass_tier || ''))) {
      unlockBattlePassTier(player, body.battle_pass_tier);
    }
    const safePatch = pickSafePlayerPatch(body);
    if (Object.hasOwn(safePatch, 'equipped_items') && !validateEquipmentLoadout(player, safePatch.equipped_items)) {
      sendError(response, 403, 'Equipment item is not owned', 'EQUIPMENT_NOT_OWNED');
      return;
    }
    for (const [key, value] of Object.entries(safePatch)) {
      player[key] = value;
    }
    if (Object.hasOwn(safePatch, 'energy') && !Object.hasOwn(safePatch, 'last_energy_update')) {
      player.last_energy_update = new Date().toISOString();
    }
    sendData(response, 200, normalizePlayerProgression(player));
    return;
  }

  if ((url.pathname === '/api/admin/boss-fights/active' || url.pathname === '/admin/boss-fights/active') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const { playerEmail } = getQuery(url);
    const fight = store.bossFights.find((item) => item.status === 'active' && (!playerEmail || item.opened_by_email === playerEmail)) || null;
    sendData(response, 200, fight);
    return;
  }

  if ((url.pathname.startsWith('/api/admin/boss-fights/') || url.pathname.startsWith('/admin/boss-fights/')) && request.method === 'PATCH') {
    if (!requireAdminToken(request, response)) return;
    const parts = url.pathname.split('/').filter(Boolean);
    const fightId = parts[parts.length - 1];
    const body = await readJsonBody(request);
    const fight = store.bossFights.find((item) => item.id === fightId);
    if (!fight) {
      sendError(response, 404, 'Boss fight not found', 'BOSS_FIGHT_NOT_FOUND');
      return;
    }
    Object.assign(fight, body);
    if (Number(fight.current_hp || 0) <= 0 || fight.status === 'defeated') {
      fight.current_hp = 0;
      fight.status = 'dead';
      if (!fight.ended_at) fight.ended_at = new Date().toISOString();
    }
    const distribution = resolveBossRewards(fight);
    sendData(response, 200, { ...fight, _distribution: distribution });
    return;
  }

  if (url.pathname.startsWith('/api/sim') || url.pathname.startsWith('/sim')) {
    if (!isSimEnabled()) {
      sendError(response, 403, 'Simulated players are disabled. Set ENABLE_SIMULATED_PLAYERS=true', 'SIM_DISABLED');
      return;
    }
    if (IS_PRODUCTION && !getSimApiToken()) {
      sendError(response, 503, 'SIM_API_TOKEN is required when ENABLE_SIMULATED_PLAYERS=true in production', 'SIM_CONFIG_REQUIRED');
      return;
    }
    if (!hasValidSimApiToken(request)) {
      sendError(response, 401, 'Invalid or missing SIM API token', 'SIM_AUTH_REQUIRED');
      return;
    }

    if ((url.pathname === '/api/sim/create-player' || url.pathname === '/sim/create-player') && request.method === 'POST') {
      const body = await readJsonBody(request);
      const botCount = store.players.filter((player) => isSimulatedPlayer(player)).length;
      if (botCount >= getSimMaxBots()) {
        sendError(response, 429, 'Max simulated players reached', 'SIM_MAX_BOTS_REACHED');
        return;
      }
      const startLevel = Math.max(1, Number(body.startLevel || 1));
      const now = new Date().toISOString();
      const simId = store.generateId('sim');
      const player = mergePlayerDefaults({
        id: simId,
        username: String(body.username || `Sim-${simId.slice(-4)}`),
        level: startLevel,
        xp: 0,
        xp_to_next_level: 100,
        energy: 100,
        max_energy: 100,
        premium: 100,
        tentacles: 0,
        created_by: `${simId}@sim.local`,
        telegram_id: '',
        isBot: SIM_BOT_FLAG,
        botType: SIM_BOT_TYPE,
        avatarSeed: body.avatarSeed || '',
        sim_mode: Object.values(SIM_MODES).includes(body.mode) ? body.mode : SIM_MODES.casual,
        sim_daily_claims: {},
        newbie_claimed_quests: [],
        pending_boss_boxes: [],
        created_date: now,
      }, null);
      playerDb.addPlayer(player);
      logSimAction(player.id, 'createSimulatedPlayer', body, { ok: true });
      sendData(response, 201, { playerId: player.id, profile: getSimPlayerState(player) });
      return;
    }

    if ((url.pathname === '/api/sim/leaderboard' || url.pathname === '/sim/leaderboard') && request.method === 'GET') {
      const type = String(url.searchParams.get('type') || 'players');
      if (type === 'clans') {
        const clanMap = new Map();
        store.players.forEach((player) => {
          if (!player.clan_name) return;
          const entry = clanMap.get(player.clan_name) || { clan: player.clan_name, members: 0, totalLevel: 0 };
          entry.members += 1;
          entry.totalLevel += Number(player.level || 1);
          clanMap.set(player.clan_name, entry);
        });
        sendData(response, 200, { type, rows: Array.from(clanMap.values()).sort((a, b) => b.totalLevel - a.totalLevel) });
        return;
      }
      if (type === 'boss') {
        const rows = store.players.map((player) => ({
          playerId: player.id,
          username: player.username,
          bossDamage: Number(player.total_boss_damage || 0),
          isBot: isSimulatedPlayer(player),
        })).sort((a, b) => b.bossDamage - a.bossDamage);
        sendData(response, 200, { type, rows });
        return;
      }
      const rows = sortPlayers(store.players, '-level').map((player) => ({
        playerId: player.id,
        username: player.username,
        level: Number(player.level || 1),
        xp: Number(player.xp || 0),
        isBot: isSimulatedPlayer(player),
      }));
      sendData(response, 200, { type: 'players', rows });
      return;
    }

    const simPathMatch = url.pathname.match(/^\/(?:api\/)?sim\/player\/([^/]+)(?:\/(.+))?\/?$/);
    if (simPathMatch) {
      const playerId = decodeURIComponent(simPathMatch[1]);
      const action = simPathMatch[2] || '';
      const player = findSimPlayer(playerId);
      if (!player) {
        sendError(response, 404, 'Simulated player not found', 'SIM_PLAYER_NOT_FOUND');
        return;
      }
      if (!enforceSimRateLimit(player.id)) {
        sendError(response, 429, 'Simulated player rate limit exceeded', 'SIM_RATE_LIMIT');
        return;
      }

      if (!action && request.method === 'GET') {
        sendData(response, 200, getSimPlayerState(player));
        return;
      }

      if (action === 'mission' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const result = applyMission(player, String(body.missionId || ''));
        logSimAction(player.id, 'runMission', body, result);
        sendData(response, 200, result);
        return;
      }

      if (action === 'boss-attack' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const result = applyBossAttack(player, String(body.bossId || ''), String(body.skillId || ''));
        logSimAction(player.id, 'attackBoss', body, result);
        sendData(response, 200, result);
        return;
      }

      if (action === 'claim' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const kind = String(body.kind || 'daily');
        let result;
        if (kind === 'daily') result = claimDailyTask(player, String(body.taskId || ''));
        else result = claimNewbieQuest(player, String(body.questId || body.taskId || ''));
        logSimAction(player.id, kind === 'daily' ? 'claimDailyTask' : 'claimNewbieQuest', body, result);
        sendData(response, 200, result);
        return;
      }

      if (action === 'roulette' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const result = spinRoulette(player, String(body.spinType || 'free'));
        logSimAction(player.id, 'spinRoulette', body, result);
        sendData(response, 200, result);
        return;
      }

      if (action === 'open-box' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const result = openLootBox(player, String(body.boxId || ''));
        logSimAction(player.id, 'openLootBox', body, result);
        sendData(response, 200, result);
        return;
      }

      if (action === 'talent' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const result = upgradeTalent(player, String(body.talentId || 't01'));
        logSimAction(player.id, 'upgradeTalent', body, result);
        sendData(response, 200, result);
        return;
      }

      if (action === 'tick' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const mode = Object.values(SIM_MODES).includes(body.mode) ? body.mode : (player.sim_mode || SIM_MODES.casual);
        const maxActions = Math.min(3, Math.max(1, Number(body.maxActions || 3)));
        const actionLog = [];
        const runAction = (name, fn) => {
          if (actionLog.length >= maxActions) return false;
          try {
            const result = fn();
            actionLog.push({ action: name, ok: true, result });
            return true;
          } catch (error) {
            actionLog.push({ action: name, ok: false, error: error.code || error.message });
            return false;
          }
        };

        const newbiePending = SIM_NEWBIE_QUESTS.find((quest) => !(player.newbie_claimed_quests || []).includes(quest.id));
        if (mode === SIM_MODES.newbie && newbiePending) {
          runAction('runMission', () => applyMission(player, getSimMissionList(player)[0]?.id));
          if (newbiePending.type === 'boss_damage') {
            runAction('attackBoss', () => applyBossAttack(player, getAvailableBosses(player)[0]?.id || 'heli', 'fist'));
          }
          runAction('claimNewbieQuest', () => claimNewbieQuest(player, newbiePending.id));
        } else {
          runAction('claimDailyTask', () => {
            const nextDaily = SIM_DAILY_TASKS.find((task) => {
              const claims = player.sim_daily_claims || {};
              return claims[task.id] !== getTodayKey();
            });
            if (!nextDaily) throw Object.assign(new Error('No daily'), { code: 'NO_DAILY' });
            return claimDailyTask(player, nextDaily.id);
          });
          if (mode === SIM_MODES.boss_focused || mode === SIM_MODES.active) {
            runAction('attackBoss', () => applyBossAttack(player, getAvailableBosses(player)[0]?.id || 'heli', 'fist'));
          }
          runAction('runMission', () => applyMission(player, getSimMissionList(player)[0]?.id));
          runAction('spinRoulette', () => spinRoulette(player, player.roulette_last_free_spin === getTodayKey() ? 'bonus' : 'free'));
          if ((player.pending_boss_boxes || []).length) {
            runAction('openLootBox', () => openLootBox(player, player.pending_boss_boxes[0].instanceId));
          }
          if (mode === SIM_MODES.whale && Number(player.premium || 0) >= 5) {
            runAction('spinRoulettePaid', () => spinRoulette(player, 'paid'));
          }
          if (Number(player.talent_points || 0) > 0) {
            runAction('upgradeTalent', () => upgradeTalent(player, 't01'));
          }
        }
        logSimAction(player.id, 'simulatePlayerTick', body, { actions: actionLog });
        sendData(response, 200, { playerId: player.id, mode, actions: actionLog, state: getSimPlayerState(player) });
        return;
      }

      sendError(response, 404, `Sim route ${request.method} ${url.pathname} not found`, 'SIM_ROUTE_NOT_FOUND');
      return;
    }
  }

  if (url.pathname === '/auth/x/start' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    if (!serverConfig.xClientId || !serverConfig.xOAuthRedirectUri || !serverConfig.xTokenEncryptionKey) {
      sendError(response, 503, 'X OAuth is not configured on the server', 'X_OAUTH_NOT_CONFIGURED');
      return;
    }

    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const expiresAt = Date.now() + 10 * 60 * 1000;
    pendingXOAuth.set(state, { playerId: player.id, verifier, expiresAt });
    for (const [key, pending] of pendingXOAuth) {
      if (pending.expiresAt <= Date.now()) pendingXOAuth.delete(key);
    }

    const authorizeUrl = new URL('https://x.com/i/oauth2/authorize');
    authorizeUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: serverConfig.xClientId,
      redirect_uri: serverConfig.xOAuthRedirectUri,
      scope: 'tweet.read users.read follows.read offline.access',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();
    sendData(response, 200, { authorizationUrl: authorizeUrl.toString() });
    return;
  }

  if (url.pathname === '/auth/x/callback' && request.method === 'GET') {
    const state = String(url.searchParams.get('state') || '');
    const pending = pendingXOAuth.get(state);
    pendingXOAuth.delete(state);
    const redirectWith = (result) => {
      response.writeHead(302, { Location: `/?x_oauth=${encodeURIComponent(result)}`, 'Cache-Control': 'no-store' });
      response.end();
    };
    if (!pending || pending.expiresAt <= Date.now() || url.searchParams.has('error')) {
      redirectWith('error');
      return;
    }

    try {
      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(url.searchParams.get('code') || ''),
        redirect_uri: serverConfig.xOAuthRedirectUri,
        code_verifier: pending.verifier,
      });
      const tokenHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' };
      if (serverConfig.xClientSecret) {
        tokenHeaders.Authorization = `Basic ${Buffer.from(`${serverConfig.xClientId}:${serverConfig.xClientSecret}`).toString('base64')}`;
      } else {
        tokenBody.set('client_id', serverConfig.xClientId);
      }
      const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', { method: 'POST', headers: tokenHeaders, body: tokenBody });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok || !tokens?.access_token) throw new Error(tokens?.error_description || 'X token exchange failed');

      const accountResponse = await fetch('https://api.x.com/2/users/me?user.fields=id,name,username', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const accountPayload = await accountResponse.json();
      const account = accountPayload?.data;
      if (!accountResponse.ok || !account?.id || !account?.username) {
        console.error('[x-oauth] users/me rejected', {
          status: accountResponse.status,
          errorCode: /^[a-zA-Z0-9_-]{1,80}$/.test(String(accountPayload?.error || accountPayload?.errors?.[0]?.code || '')) ? String(accountPayload?.error || accountPayload?.errors?.[0]?.code) : '',
          errorType: /^https?:\/\/(?:api\.)?(?:x\.com|twitter\.com)\/[a-zA-Z0-9/_-]{1,160}$/.test(String(accountPayload?.type || accountPayload?.errors?.[0]?.type || '')) ? String(accountPayload?.type || accountPayload?.errors?.[0]?.type) : '',
          reason: String(accountPayload?.detail || accountPayload?.title || accountPayload?.errors?.[0]?.detail || '')
            .slice(0, 180).replace(/[^a-zA-Z0-9 .,;:()_/-]/g, ''),
          hasAccount: Boolean(account?.id && account?.username),
        });
        throw new Error('Could not read X account');
      }

      const player = store.players.find((entry) => String(entry.id) === String(pending.playerId));
      if (!player) throw new Error('Player no longer exists');
      player.x_oauth = {
        user_id: String(account.id),
        username: String(account.username).slice(0, 50),
        name: String(account.name || account.username).slice(0, 100),
        access_token: encryptXToken(tokens.access_token),
        refresh_token: tokens.refresh_token ? encryptXToken(tokens.refresh_token) : '',
        expires_at: Date.now() + Math.max(0, Number(tokens.expires_in) || 0) * 1000,
        scopes: Array.isArray(tokens.scope) ? tokens.scope : String(tokens.scope || '').split(' ').filter(Boolean),
        connected_at: new Date().toISOString(),
      };
      await playerDb.flushDirtyPlayers();
      redirectWith('connected');
    } catch (error) {
      console.error('[x-oauth] callback failed', error?.message || error);
      redirectWith('error');
    }
    return;
  }

  if (url.pathname === '/auth/x/me' && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    sendData(response, 200, {
      connected: Boolean(player.x_oauth?.user_id),
      account: player.x_oauth?.user_id ? { id: player.x_oauth.user_id, username: player.x_oauth.username, name: player.x_oauth.name } : null,
    });
    return;
  }

  if (url.pathname === '/auth/x/disconnect' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    if (player.x_oauth) {
      if (player.x_oauth.access_token && serverConfig.xClientId && serverConfig.xTokenEncryptionKey) {
        try {
          const revokeBody = new URLSearchParams({
            token: decryptXToken(player.x_oauth.access_token),
            token_type_hint: 'access_token',
          });
          const revokeHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' };
          if (serverConfig.xClientSecret) {
            revokeHeaders.Authorization = `Basic ${Buffer.from(`${serverConfig.xClientId}:${serverConfig.xClientSecret}`).toString('base64')}`;
          } else {
            revokeBody.set('client_id', serverConfig.xClientId);
          }
          await fetch('https://api.x.com/2/oauth2/revoke', { method: 'POST', headers: revokeHeaders, body: revokeBody });
        } catch (error) {
          console.warn('[x-oauth] token revoke failed', error?.message || error);
        }
      }
      delete player.x_oauth;
      await playerDb.flushDirtyPlayers();
    }
    sendData(response, 200, { connected: false });
    return;
  }

  if (url.pathname === '/auth/telegram/verify' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const verification = verifyTelegramInitData(body.initData);
    const session = getSessionFromHeaders(request.headers);

    sendData(response, verification.ok ? 200 : 400, {
      verified: verification.ok,
      reason: verification.reason,
      session,
    });
    return;
  }

  if (url.pathname === '/auth/web/launch' && request.method === 'POST') {
    const verified = verifyTelegramInitData(request.headers['x-telegram-init-data']);
    const player = verified.ok ? ensureCurrentPlayer(request) : null;
    if (!player) { sendError(response, 401, 'Open the web game from Telegram', 'AUTH_REQUIRED'); return; }
    const body = await readJsonBody(request);
    if ((!player.tutorial_step || player.tutorial_step === 'context-done') && TUTORIAL_STEPS.has(body?.tutorialStep)) {
      player.tutorial_step = body.tutorialStep;
      await playerDb.flushDirtyPlayers([player.id]);
    }
    try {
      const token = webAuth.createLaunch(getSessionFromHeaders(request.headers));
      sendData(response, 200, { path: `/web#web_launch=${token}` });
    } catch (error) { sendError(response, 429, error.message, 'WEB_LAUNCH_UNAVAILABLE'); }
    return;
  }
  if (url.pathname === '/auth/web/exchange' && request.method === 'POST') {
    const body = await readJsonBody(request);
    try {
      response.setHeader('Set-Cookie', webAuth.exchange(body?.token));
      sendData(response, 200, { authenticated: true });
    } catch (error) { sendError(response, 401, error.message, 'WEB_LAUNCH_EXPIRED'); }
    return;
  }
  if (url.pathname === '/auth/web/logout' && request.method === 'POST') {
    response.setHeader('Set-Cookie', webAuth.clearCookie());
    sendData(response, 200, { loggedOut: true });
    return;
  }

  if (url.pathname === '/auth/me' && request.method === 'GET') {
    const session = getSessionFromHeaders(request.headers);
    if (!session) {
      const initData = String(request.headers['x-telegram-init-data'] || '');
      const verification = verifyTelegramInitData(initData);
      console.warn('[auth]', {
        endpoint: '/auth/me',
        reason: 'missing_or_invalid_telegram_session',
        hasInitDataHeader: Boolean(initData),
        verificationOk: Boolean(verification?.ok),
        verificationReason: verification?.reason || null,
        hasTelegramUserHeader: Boolean(request.headers['x-telegram-user-id']),
      });
      sendError(response, 401, 'Missing Telegram session headers', 'AUTH_REQUIRED');
      return;
    }

    const player = ensureCurrentPlayer(request);
    sendData(response, 200, {
      session,
      player: player ? normalizePlayerProgression(player) : null,
    });
    return;
  }

  if (url.pathname === '/players/bootstrap' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    sendData(response, 200, normalizePlayerProgression(player));
    return;
  }

  if (url.pathname === '/mail/gifts/claim' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED'); return; }
    const body = await readJsonBody(request);
    if (!String(body?.mailId || '').trim()) { sendError(response, 400, 'Gift mail id is required', 'GIFT_MAIL_ID_REQUIRED'); return; }
    try {
      const result = claimGiftMail(player, body.mailId, grantXpToPlayer);
      queueDirtyPlayerFlush(player.id);
      store.persistSoon(0);
      sendData(response, 200, { ...result, player: normalizePlayerProgression(player) });
    } catch (error) {
      sendError(response, error.statusCode || 400, error.message || 'Unable to claim gift mail', error.code || 'GIFT_MAIL_CLAIM_FAILED');
    }
    return;
  }

  if (url.pathname === '/wallets/near/disconnect' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED'); return; }
    for (const [key, value] of nearWalletChallenges) if (value.playerId === String(player.id)) nearWalletChallenges.delete(key);
    player.near_wallet_id = '';
    player.near_wallet_verified = false;
    player.near_wallet_verified_at = '';
    await playerDb.flushDirtyPlayers([player.id]);
    sendData(response, 200, { near_wallet_id: '', near_wallet_verified: false });
    return;
  }

  if (url.pathname === '/wallets/near/proof-challenge' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED'); return; }
    const id = randomBytes(18).toString('base64url');
    const nonce = randomBytes(32);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    for (const [key, value] of nearWalletChallenges) if (value.expiresAt < Date.now()) nearWalletChallenges.delete(key);
    const message = `Link NEAR wallet to Planet4 player ${player.id}. Expires ${new Date(expiresAt).toISOString()}.`;
    nearWalletChallenges.set(id, { playerId: String(player.id), nonce, message, expiresAt });
    sendData(response, 200, { challengeId: id, nonce: nonce.toString('base64'), message, recipient: 'planet4.near', expiresAt });
    return;
  }

  if (url.pathname === '/wallets/near/proof-verify' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) { sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED'); return; }
    const body = await readJsonBody(request);
    const challenge = nearWalletChallenges.get(String(body?.challengeId || ''));
    const signed = body?.signedMessage || {};
    const accountId = String(signed.accountId || '').trim().toLowerCase();
    if (!challenge || challenge.playerId !== String(player.id) || challenge.expiresAt < Date.now() || !accountId || !/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(accountId)) {
      sendError(response, 400, 'Wallet proof expired or invalid', 'NEAR_PROOF_INVALID'); return;
    }
    if (challenge.verifying) { sendError(response, 409, 'Wallet verification is already in progress', 'NEAR_PROOF_PENDING'); return; }
    challenge.verifying = true;
    try {
      const { verifySignature } = await import('@near-wallet-selector/core');
      let validSignature = false;
      try { validSignature = verifySignature({ publicKey: signed.publicKey, signature: signed.signature, message: challenge.message, nonce: challenge.nonce, recipient: 'planet4.near' }); } catch { /* Malformed signatures are invalid proofs. */ }
      if (!validSignature) { sendError(response, 400, 'Wallet signature could not be verified', 'NEAR_PROOF_INVALID'); return; }
      if (challenge.completedAccount === accountId && challenge.completedKey === signed.publicKey && player.near_wallet_id === accountId && player.near_wallet_verified) {
        sendData(response, 200, { near_wallet_id: accountId, near_wallet_verified: true }); return;
      }
      const validAccountKey = await verifyNearAccountKey({ publicKey: signed.publicKey, accountId, network: serverConfig.nearNetwork || 'mainnet' });
      if (!validAccountKey) { sendError(response, 400, 'Wallet signature could not be verified', 'NEAR_PROOF_INVALID'); return; }
      if (challenge.expiresAt < Date.now() || nearWalletChallenges.get(String(body.challengeId)) !== challenge) { sendError(response, 400, 'Wallet proof expired or invalid', 'NEAR_PROOF_INVALID'); return; }
      const linked = (store.players || []).find((candidate) => String(candidate.near_wallet_id || '').toLowerCase() === accountId && String(candidate.id) !== String(player.id));
      if (linked) { sendError(response, 409, 'This wallet is linked to another game account', 'NEAR_WALLET_ALREADY_LINKED'); return; }
      player.near_wallet_id = accountId;
      player.near_wallet_verified = true;
      player.near_wallet_verified_at = new Date().toISOString();
      await playerDb.flushDirtyPlayers([player.id]);
      challenge.completedAccount = accountId;
      challenge.completedKey = signed.publicKey;
      sendData(response, 200, { near_wallet_id: accountId, near_wallet_verified: true });
    } catch (error) { sendError(response, 502, error.message || 'NEAR proof verification failed', 'NEAR_PROOF_VERIFY_FAILED'); }
    finally { challenge.verifying = false; }
    return;
  }

  if (url.pathname === '/players/me' && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND');
      return;
    }

    sendData(response, 200, normalizePlayerProgression(player));
    return;
  }

  if (url.pathname === '/wallets/me' && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const wallets = listPlayerWallets(player.id);
    sendData(response, 200, {
      wallets,
      tonWallet: wallets.find((wallet) => wallet.chain === 'ton') || null,
    });
    return;
  }

  if (url.pathname === '/wallets/ton/proof-payload' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const now = Date.now();
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
    const proofSession = {
      id: store.generateId('ton-proof'),
      player_id: player.id,
      payload: createTonProofPayloadValue(),
      status: 'pending',
      created_at: new Date(now).toISOString(),
      expires_at: expiresAt,
    };

    store.tonProofSessions.push(proofSession);
    sendData(response, 201, {
      sessionId: proofSession.id,
      payload: proofSession.payload,
      expiresAt: proofSession.expires_at,
    });
    return;
  }

  if (url.pathname === '/wallets/ton/proof-verify' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const sessionId = String(body.sessionId || '').trim();
    const address = String(body.address || '').trim();
    const network = String(body.network || 'mainnet').trim();
    const provider = String(body.provider || 'tonconnect').trim();
    const label = String(body.label || '').trim();
    const proof = body.proof || null;
    const walletMeta = body.wallet || null;

    if (process.env.NODE_ENV === 'production') {
      sendError(response, 503, 'TON proof verification is not enabled', 'TON_PROOF_VERIFIER_REQUIRED');
      return;
    }

    if (!sessionId) {
      sendError(response, 400, 'Missing proof session id', 'TON_PROOF_SESSION_REQUIRED');
      return;
    }

    if (!isValidTonAddress(address)) {
      sendError(response, 400, 'Invalid TON wallet address', 'INVALID_TON_ADDRESS');
      return;
    }

    const proofSession = store.tonProofSessions.find(
      (session) => session.id === sessionId && session.player_id === player.id
    );

    if (!proofSession) {
      sendError(response, 404, 'TON proof session not found', 'TON_PROOF_SESSION_NOT_FOUND');
      return;
    }

    if (new Date(proofSession.expires_at).getTime() < Date.now()) {
      proofSession.status = 'expired';
      sendError(response, 410, 'TON proof session expired', 'TON_PROOF_SESSION_EXPIRED');
      return;
    }

    const proofPayload = String(proof?.payload || '').trim();
    if (!proofPayload || proofPayload !== proofSession.payload) {
      proofSession.status = 'payload_mismatch';
      sendError(response, 400, 'TON proof payload mismatch', 'TON_PROOF_PAYLOAD_MISMATCH');
      return;
    }

    const existingWalletOwner = store.walletLinks.find(
      (walletLink) =>
        walletLink.chain === 'ton' &&
        walletLink.address === address &&
        walletLink.player_id !== player.id
    );

    if (existingWalletOwner) {
      sendError(response, 409, 'TON wallet is already linked to another player', 'TON_WALLET_ALREADY_LINKED');
      return;
    }

    const result = upsertTonWalletLink(player, {
      address,
      network,
      provider,
      label,
      proofStatus: 'payload_matched_unverified',
      proof: {
        ...proof,
        wallet: walletMeta,
      },
    });

    proofSession.status = 'linked';
    proofSession.address = address;
    proofSession.verified_at = new Date().toISOString();

    sendData(response, result.created ? 201 : 200, {
      wallet: normalizeWalletLink(result.wallet),
      proofVerification: {
        verified: false,
        status: 'payload_matched_unverified',
      },
    });
    return;
  }

  if (url.pathname === '/wallets/ton/connect' && request.method === 'POST') {
    if (process.env.NODE_ENV === 'production') {
      sendError(response, 403, 'Manual wallet linking is disabled in production', 'TON_MANUAL_LINK_DISABLED');
      return;
    }
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const address = String(body.address || '').trim();
    const network = String(body.network || 'mainnet').trim();
    const provider = String(body.provider || 'manual').trim();
    const label = String(body.label || '').trim();

    if (!isValidTonAddress(address)) {
      sendError(response, 400, 'Invalid TON wallet address', 'INVALID_TON_ADDRESS');
      return;
    }

    const existingWalletOwner = store.walletLinks.find(
      (walletLink) =>
        walletLink.chain === 'ton' &&
        walletLink.address === address &&
        walletLink.player_id !== player.id
    );

    if (existingWalletOwner) {
      sendError(response, 409, 'TON wallet is already linked to another player', 'TON_WALLET_ALREADY_LINKED');
      return;
    }

    const result = upsertTonWalletLink(player, {
      address,
      network,
      provider,
      label,
      proofStatus: 'manual_dev',
    });

    sendData(response, result.created ? 201 : 200, {
      wallet: normalizeWalletLink(result.wallet),
      proofVerification: {
        verified: false,
        status: 'manual_dev',
      },
    });
    return;
  }

  if (url.pathname === '/wallets/ton' && request.method === 'DELETE') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const walletIndex = store.walletLinks.findIndex(
      (walletLink) => walletLink.player_id === player.id && walletLink.chain === 'ton'
    );

    if (walletIndex === -1) {
      sendData(response, 200, { disconnected: true, wallet: null });
      return;
    }

    const [wallet] = store.walletLinks.splice(walletIndex, 1);
    sendData(response, 200, {
      disconnected: true,
      wallet: normalizeWalletLink(wallet),
    });
    return;
  }

  if (url.pathname === '/players' && request.method === 'GET') {
    const { sort = '-created_date', limit = '50', username } = getQuery(url);
    const referralCounts = getPlayerReferralCounts();
    let players = sortPlayers(store.players, sort);

    if (username) {
      players = players.filter((player) =>
        String(player.username || '').toLowerCase().includes(String(username).toLowerCase())
      );
    }

    const safeLimit = Math.max(0, Math.min(100, Number(limit) || 50));
    sendData(response, 200, players.slice(0, safeLimit).map((player) => publicPlayerProfile(player, referralCounts.get(String(player.id)) ?? 0)));
    return;
  }

  if (url.pathname === '/clans' && request.method === 'GET') {
    const knownKeys = new Set(store.players.map((player) => player.clan_id || player.clan_name).filter(Boolean));
    knownKeys.forEach((key) => ensureClanRecord(key));
    const clanByKey = new Map();
    for (const clan of store.clans) {
      for (const key of [clan.id, clan.name]) {
        const normalized = normalizeClanKey(key);
        if (!normalized) continue;
        const matches = clanByKey.get(normalized) || [];
        matches.push(clan);
        clanByKey.set(normalized, matches);
      }
    }
    const aggregates = new Map(store.clans.map((clan) => [clan, { members: 0, power: 0 }]));
    for (const player of store.players) {
      const candidates = new Set([
        ...(clanByKey.get(normalizeClanKey(player.clan_id)) || []),
        ...(clanByKey.get(normalizeClanKey(player.clan_name)) || []),
      ]);
      for (const clan of candidates) {
        if (!isClanMember(player, clan)) continue;
        const aggregate = aggregates.get(clan);
        aggregate.members += 1;
        aggregate.power += getPowerForLeaderboard(player);
      }
    }
    const clans = store.clans.map((clan) => {
      const aggregate = aggregates.get(clan) || { members: 0, power: 0 };
      return { ...serializeClan(clan), ...aggregate };
    });
    const uniqueClans = new Map();
    for (const clan of clans) {
      const key = normalizeClanKey(clan.name || clan.id);
      const existing = uniqueClans.get(key);
      if (!existing || clan.members > existing.members) uniqueClans.set(key, clan);
    }
    sendData(response, 200, [...uniqueClans.values()]);
    return;
  }

  if (url.pathname === '/dev/seed-clans' && request.method === 'POST' && process.env.NODE_ENV !== 'production') {
    const progressForLevel = (type, level) => {
      const thresholds = CLAN_ACHIEVEMENT_CONFIG[type]?.thresholds || [];
      return Number(thresholds[Math.max(0, Math.min(thresholds.length - 1, level - 1))] || 0);
    };
    const setClanLevel = (clan, level) => {
      clan.achievements = Object.fromEntries(Object.keys(CLAN_ACHIEVEMENT_CONFIG).map((type) => [type, {
        level,
        progress: progressForLevel(type, level),
      }]));
    };
    const ownPlayer = store.players.find((player) => String(player.id) !== 'void-legion-leader');
    let ownClan = store.clans.find((clan) => normalizeClanKey(clan.id) === 'planet44');
    if (!ownClan && ownPlayer) {
      ownClan = {
        id: 'planet44', name: 'planet44', owner_id: ownPlayer.id,
        description: 'Concept and idea by the clan leader. We open bosses together and plan damage windows.',
        logo_id: 'nuvelor26', join_type: 'open', min_level: 1, applications: [], activity_log: [],
        clan_mail: [], quests: [], energy_requests: [], created_at: new Date().toISOString(),
      };
      store.clans.push(ownClan);
    }
    if (ownClan) setClanLevel(ownClan, 7);
    if (ownPlayer && ownClan) {
      ownPlayer.clan_id = ownClan.id;
      ownPlayer.clan_name = ownClan.name;
      ownPlayer.clan_role = 'leader';
    }

    const opponentId = 'void-legion';
    let opponent = store.clans.find((clan) => normalizeClanKey(clan.id) === opponentId);
    if (!opponent) {
      opponent = {
        id: opponentId,
        name: 'VOID LEGION',
        owner_id: 'void-legion-leader',
        description: 'Елітний клан-опонент для тестування рейтингу та профілю.',
        logo_id: 'nuvelor26',
        join_type: 'closed',
        min_level: 100,
        applications: [],
        activity_log: [],
        clan_mail: [],
        quests: [],
        energy_requests: [],
        created_at: new Date().toISOString(),
      };
      store.clans.push(opponent);
    }
    setClanLevel(opponent, 10);
    store.clans = store.clans.filter((clan) => normalizeClanKey(clan.id) !== opponentId || clan === opponent);
    let opponentLeader = store.players.find((player) => String(player.id) === 'void-legion-leader');
    if (!opponentLeader) {
      opponentLeader = {
        id: 'void-legion-leader', username: 'void_commander', nickname: 'VOID COMMANDER',
        level: 100, stat_strength: 999999, clan_id: opponentId, clan_name: opponent.name,
        clan_role: 'leader', avatar: '', last_login_date: new Date().toISOString(),
      };
      store.players.push(opponentLeader);
    }
    store.persistSoon(0);
    sendData(response, 200, { own: ownClan ? serializeClan(ownClan) : null, opponent: serializeClan(opponent) });
    return;
  }

  if (url.pathname === '/clans' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    const body = await readJsonBody(request);
    const name = String(body.clan_name || '').trim().slice(0, 40);
    const id = String(body.clan_id || name.toLowerCase().replace(/\s+/g, '-')).trim().slice(0, 64);
    if (!player || !name || !id) {
      sendError(response, 400, 'Clan name is required', 'CLAN_NAME_REQUIRED');
      return;
    }
    if (player.clan_id || player.clan_name) {
      sendError(response, 409, 'Leave your current clan first', 'CLAN_ALREADY_JOINED');
      return;
    }
    if (Number(player.level || 0) < 10 || Number(player.tentacles || 0) < 10000) {
      sendError(response, 403, 'Level 10 and 10000 tentacles required', 'CLAN_CREATE_REQUIREMENT');
      return;
    }
    if (store.clans.some((entry) => normalizeClanKey(entry.id) === normalizeClanKey(id))) {
      sendError(response, 409, 'Clan already exists', 'CLAN_EXISTS');
      return;
    }
    const clan = { id, name, owner_id: player.id, description: String(body.clan_description || '').slice(0, 300), logo_id: String(body.clan_logo_id || ''), join_type: 'open', min_level: 1, applications: [], activity_log: [], clan_mail: [], achievements: createClanAchievements(), quests: [], energy_requests: [], created_at: new Date().toISOString() };
    store.clans.push(clan);
    player.tentacles -= 10000;
    Object.assign(player, { clan_id: id, clan_name: name, clan_role: 'leader', clan_description: clan.description, clan_logo_id: clan.logo_id, clan_joined_at: new Date().toISOString() });
    store.persistSoon();
    sendData(response, 201, { clan: serializeClan(clan), player: normalizePlayerProgression(player) });
    return;
  }

  const clanMembershipMatch = url.pathname.match(/^\/clans\/([^/]+)\/(join|leave)$/);
  if (clanMembershipMatch && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    const clan = ensureClanRecord(decodeURIComponent(clanMembershipMatch[1]));
    const action = clanMembershipMatch[2];
    if (!player || !clan) {
      sendError(response, 404, 'Clan not found', 'CLAN_NOT_FOUND');
      return;
    }
    if (action === 'join') {
      if (player.clan_id || player.clan_name) {
        sendError(response, 409, 'Leave your current clan first', 'CLAN_ALREADY_JOINED');
        return;
      }
      const currentMembers = store.players.filter((entry) => isClanMember(entry, clan)).length;
      if (Number(player.level || 0) < Number(clan.min_level || 1)) {
        sendError(response, 403, 'Level is too low', 'CLAN_LEVEL_REQUIRED');
        return;
      }
      if (Date.parse(player.clan_rejoin_available_at || '') > Date.now()) {
        sendError(response, 429, 'Rejoin is on cooldown', 'CLAN_REJOIN_COOLDOWN');
        return;
      }
      if (currentMembers >= getClanAchievementState('donations', clan.achievements?.donations).benefit.maxMembers) {
        sendError(response, 409, 'Clan is full', 'CLAN_FULL');
        return;
      }
      if (String(clan.join_type || 'open') === 'invite') {
        sendError(response, 403, 'Invite only', 'CLAN_INVITE_ONLY');
        return;
      }
      if (String(clan.join_type || 'open') === 'request') {
        clan.applications = Array.isArray(clan.applications) ? clan.applications : [];
        if (!clan.applications.some((entry) => String(entry.player_id) === String(player.id))) clan.applications.push({ id: store.generateId('clan-application'), player_id: player.id, created_at: new Date().toISOString() });
        store.persistSoon();
        sendData(response, 202, { requested: true });
        return;
      }
      Object.assign(player, { clan_id: clan.id, clan_name: clan.name, clan_role: 'member', clan_description: clan.description, clan_logo_id: clan.logo_id, clan_joined_at: new Date().toISOString(), clan_donation_contributions: {} });
      addClanActivity(clan, player, `✓ ${clanActorName(player)} приєднався до клану.`, 'green');
    } else {
      if (!isClanMember(player, clan)) {
        sendError(response, 403, 'Clan membership required', 'CLAN_MEMBERSHIP_REQUIRED');
        return;
      }
      if (getClanRole(player, clan) === 'leader') {
        const members = store.players.filter((entry) => isClanMember(entry, clan));
        if (members.length > 1) {
          sendError(response, 403, 'Transfer leadership before leaving', 'CLAN_LEADER_MUST_TRANSFER');
          return;
        }
        // A clan with no remaining members is disbanded, allowing its sole
        // leader to use the same Leave clan control as every other member.
        store.clans = store.clans.filter((entry) => String(entry.id) !== String(clan.id));
      } else {
        addClanActivity(clan, player, `↩ ${clanActorName(player)} покинув клан.`, 'blue');
      }
      Object.assign(player, { clan_id: '', clan_name: '', clan_role: '', clan_description: '', clan_trophies: 0, clan_logo_id: '', clan_joined_at: null, clan_donation_contributions: {} });
    }
    store.persistSoon();
    sendData(response, 200, { clan: serializeClan(clan), player: normalizePlayerProgression(player) });
    return;
  }

  const clanQuestHelpMatch = url.pathname.match(/^\/clans\/([^/]+)\/quests\/([^/]+)\/help$/);
  if (clanQuestHelpMatch && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    const clan = ensureClanRecord(decodeURIComponent(clanQuestHelpMatch[1]));
    const quest = clan?.quests?.find((entry) => entry.id === clanQuestHelpMatch[2]);
    if (!player || !clan || !quest || !isClanMember(player, clan)) {
      sendError(response, 404, 'Clan quest not found', 'CLAN_QUEST_NOT_FOUND');
      return;
    }
    expireClanQuests(clan);
    if (quest.status !== 'ACTIVE' || !quest.help_enabled) {
      sendError(response, 400, 'Quest cannot receive help', 'CLAN_QUEST_HELP_UNAVAILABLE');
      return;
    }
    if (String(quest.owner_id) === String(player.id) || (quest.participants || []).map(String).includes(String(player.id))) {
      sendError(response, 409, 'Already participating in this quest', 'CLAN_QUEST_ALREADY_JOINED');
      return;
    }
    quest.participants = [...(quest.participants || []), player.id];
    store.persistSoon();
    sendData(response, 200, quest);
    return;
  }

  const clanEnergyHelpMatch = url.pathname.match(/^\/clans\/([^/]+)\/energy-requests\/([^/]+)\/help$/);
  if (clanEnergyHelpMatch && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    const clan = ensureClanRecord(decodeURIComponent(clanEnergyHelpMatch[1]));
    const energyRequest = clan?.energy_requests?.find((entry) => entry.id === clanEnergyHelpMatch[2]);
    if (!player || !clan || !energyRequest || !isClanMember(player, clan)) {
      sendError(response, 404, 'Energy request not found', 'CLAN_ENERGY_REQUEST_NOT_FOUND');
      return;
    }
    if (energyRequest.status !== 'ACTIVE' || Date.parse(energyRequest.expires_at || '') <= Date.now()) {
      energyRequest.status = 'EXPIRED';
      sendError(response, 400, 'Energy request is unavailable', 'CLAN_ENERGY_REQUEST_EXPIRED');
      return;
    }
    if (String(energyRequest.owner_id) === String(player.id) || (energyRequest.helpers || []).map(String).includes(String(player.id))) {
      sendError(response, 409, 'You already helped this request', 'CLAN_ENERGY_ALREADY_HELPED');
      return;
    }
    const remaining = Math.max(0, Number(energyRequest.amount_requested || 0) - Number(energyRequest.amount_helped || 0));
    const granted = Math.min(10, remaining);
    const owner = store.players.find((entry) => String(entry.id) === String(energyRequest.owner_id));
    if (owner && granted) grantEnergyGain(owner, granted, 'clan_help');
    energyRequest.amount_helped = Number(energyRequest.amount_helped || 0) + granted;
    energyRequest.helpers = [...(energyRequest.helpers || []), player.id];
    if (energyRequest.amount_helped >= energyRequest.amount_requested) {
      energyRequest.status = 'COMPLETED';
      energyRequest.completed_at = new Date().toISOString();
    }
    addClanAchievementProgress(clan, 'helper', 1);
    store.persistSoon();
    sendData(response, 200, energyRequest);
    return;
  }

  const clanResourceMatch = url.pathname.match(/^\/clans\/([^/]+)\/(quests|energy-requests|donations)$/);
  if (clanResourceMatch) {
    const clan = ensureClanRecord(decodeURIComponent(clanResourceMatch[1]));
    if (!clan) {
      sendError(response, 404, 'Clan not found', 'CLAN_NOT_FOUND');
      return;
    }
    expireClanQuests(clan);
    const resource = clanResourceMatch[2];
    if (request.method === 'GET') {
      if (resource === 'quests') {
        const viewer = getCurrentPlayer(request);
        const reconciledDonations = reconcileLegacyClanDonationQuests(clan);
        const questState = getClanAchievementState('quests', clan.achievements?.quests);
        const offers = isClanMember(viewer, clan) ? getClanQuestOffers(viewer, clan, questState.benefit.maxTier) : [];
        if (reconciledDonations) store.persistSoon(0);
        else store.persistSoon();
        sendData(response, 200, { quests: clan.quests || [], offers });
      }
      else if (resource === 'energy-requests') {
        const viewer = getCurrentPlayer(request);
        const now = Date.now();
        let expiredAny = false;
        const activeRequests = (clan.energy_requests || []).filter((entry) => {
          if (entry.status === 'ACTIVE' && Date.parse(entry.expires_at || '') <= now) {
            entry.status = 'EXPIRED';
            expiredAny = true;
          }
          return entry.status === 'ACTIVE';
        });
        if (expiredAny) store.persistSoon();
        sendData(response, 200, activeRequests.map((entry) => {
          const owner = store.players.find((player) => String(player.id) === String(entry.owner_id));
          return {
            ...entry,
            owner_name: owner?.nickname || owner?.username || 'player',
            owner_avatar: owner?.avatar || owner?.photoUrl || owner?.photo_url || '',
            viewer_has_helped: (entry.helpers || []).map(String).includes(String(viewer?.id)),
          };
        }));
      }
      else sendData(response, 200, { progress: getClanAchievementState('donations', clan.achievements?.donations) });
      return;
    }
    if (request.method !== 'POST') return;
    const player = ensureCurrentPlayer(request);
    if (!player || !isClanMember(player, clan)) {
      sendError(response, 403, 'Clan membership required', 'CLAN_MEMBERSHIP_REQUIRED');
      return;
    }
    const body = await readJsonBody(request);
    if (resource === 'quests') {
      const requestedId = String(body.definitionId || '');
      const questState = getClanAchievementState('quests', clan.achievements?.quests);
      const offers = getClanQuestOffers(player, clan, questState.benefit.maxTier);
      const offer = offers.find((entry) => String(entry.id) === requestedId);
      const definition = CLAN_QUEST_DEFINITIONS.find((entry) => entry.id === offer?.definition_id);
      if (!definition || definition.tier > questState.benefit.maxTier) {
        sendError(response, 403, 'Quest tier is locked', 'CLAN_QUEST_TIER_LOCKED');
        return;
      }
      clan.quests = Array.isArray(clan.quests) ? clan.quests : [];
      if (clan.quests.some((quest) => quest.status === 'ACTIVE' && String(quest.owner_id) === String(player.id) && String(quest.offer_id) === String(offer.id))) {
        sendError(response, 409, 'This quest is already active', 'CLAN_QUEST_ALREADY_ACTIVE');
        return;
      }
      const now = Date.now();
      const availableAt = Date.parse(offer.available_at || '');
      if (Number.isFinite(availableAt) && availableAt > now) {
        sendError(response, 429, 'Quest is on cooldown', 'CLAN_QUEST_COOLDOWN');
        return;
      }
      const quest = {
        id: store.generateId('clan-quest'), definition_id: definition.id, clan_id: clan.id, owner_id: player.id, tier: definition.tier, type: definition.type,
        offer_id: offer.id, target: definition.target, progress: 0, duration_hours: definition.durationHours, started_at: new Date(now).toISOString(),
        expires_at: new Date(now + definition.durationHours * 3600000).toISOString(), status: 'ACTIVE', participants: [], contributions: {}, reward: definition.reward, help_enabled: Boolean(definition.helpEnabled),
        ...(definition.type === 'tentacles' ? { donation_tracking_version: 1 } : {}),
      };
      clan.quests.push(quest);
      store.persistSoon();
      sendData(response, 201, quest);
      return;
    }
    if (resource === 'energy-requests') {
      const now = Date.now();
      const cooldown = Date.parse(player.clan_energy_request_available_at || '');
      if (Number.isFinite(cooldown) && cooldown > now) {
        sendError(response, 429, 'Energy request is on cooldown', 'CLAN_ENERGY_COOLDOWN', { cooldownUntil: player.clan_energy_request_available_at });
        return;
      }
      const maxRequest = getClanAchievementState('helper', clan.achievements?.helper).benefit.maxEnergyRequest;
      const amount = Math.max(10, Math.min(maxRequest, Number(body.amount || maxRequest)));
      const requestEntry = { id: store.generateId('clan-energy'), clan_id: clan.id, owner_id: player.id, amount_requested: amount, amount_helped: 0, helpers: [], status: 'ACTIVE', created_at: new Date(now).toISOString(), expires_at: new Date(now + 4 * 3600000).toISOString() };
      clan.energy_requests = [...(clan.energy_requests || []), requestEntry];
      player.clan_energy_request_available_at = new Date(now + 4 * 3600000).toISOString();
      store.persistSoon();
      sendData(response, 201, requestEntry);
      return;
    }
    const now = Date.now();
    const actionId = String(body.actionId || '').trim();
    clan.donation_action_ids = Array.isArray(clan.donation_action_ids) ? clan.donation_action_ids : [];
    if (actionId && clan.donation_action_ids.includes(actionId)) {
      sendData(response, 200, { duplicate: true, clan: serializeClan(clan), player: normalizePlayerProgression(player) });
      return;
    }
    const donationState = getClanAchievementState('donations', clan.achievements?.donations);
    if (donationState.maxed) {
      sendError(response, 400, 'Clan expansion is maxed', 'CLAN_DONATION_MAXED');
      return;
    }
    const amount = Math.max(0, Math.floor(Number(body.amount || 0)));
    if (!amount || amount > Number(player.tentacles || 0)) {
      sendError(response, 400, 'Not enough tentacles', 'CLAN_DONATION_FUNDS');
      return;
    }
    const levelKey = String(donationState.level + 1);
    const cap = CLAN_ACHIEVEMENT_CONFIG.donations.contributionCaps[donationState.level];
    const nowMs = Date.now();
    player.clan_donation_limits ||= {};
    const clanLimits = player.clan_donation_limits[clan.id] || {};
    const savedLimit = clanLimits[levelKey] || {};
    const windowActive = Date.parse(savedLimit.available_at || '') > nowMs;
    const used = windowActive ? Math.max(0, Number(savedLimit.used || 0)) : 0;
    const counted = Math.min(amount, Math.max(0, cap - used));
    if (!counted) {
      sendError(response, 409, 'Personal contribution cap reached', 'CLAN_DONATION_CAP_REACHED');
      return;
    }
    player.tentacles -= counted;
    player.clan_donation_contributions ||= {};
    const clanContributions = player.clan_donation_contributions[clan.id] || {};
    clanContributions[levelKey] = Number(clanContributions[levelKey] || 0) + counted;
    player.clan_donation_contributions = { ...player.clan_donation_contributions, [clan.id]: { ...clanContributions } };
    const availableAt = windowActive ? savedLimit.available_at : new Date(nowMs + CLAN_DONATION_WINDOW_MS).toISOString();
    const nextLimit = { used: used + counted, available_at: availableAt };
    player.clan_donation_limits = { ...player.clan_donation_limits, [clan.id]: { ...clanLimits, [levelKey]: nextLimit } };
    addClanAchievementProgress(clan, 'donations', counted);
    progressClanQuestMetric(clan, player, 'tentacles', counted);
    if (actionId) clan.donation_action_ids = [...clan.donation_action_ids.slice(-499), actionId];
    store.persistSoon();
    queueDirtyPlayerFlush(player.id);
    sendData(response, 200, { counted, contribution: nextLimit.used, contribution_cap: cap, available_at: availableAt, clan: serializeClan(clan), player: normalizePlayerProgression(player) });
    return;
  }

  const clanProfileMatch = url.pathname.match(/^\/clans\/([^/]+)$/);
  const clanManageMatch = url.pathname.match(/^\/clans\/([^/]+)\/manage$/);
  if (clanManageMatch) {
    const player = ensureCurrentPlayer(request);
    const clan = ensureClanRecord(decodeURIComponent(clanManageMatch[1]));
    if (!player || !clan || !isClanMember(player, clan) || !canManageClan(player, clan)) {
      sendError(response, 403, 'No permission', 'NO_PERMISSION');
      return;
    }
    const actorRole = getClanRole(player, clan);
    const members = () => store.players.filter((entry) => isClanMember(entry, clan));
    const capacity = () => getClanAchievementState('donations', clan.achievements?.donations).benefit.maxMembers;
    if (request.method === 'GET') {
      const applications = (clan.applications || []).map((application) => {
        const applicant = store.players.find((entry) => String(entry.id) === String(application.player_id));
        return applicant ? { ...application, player: clanMemberPayload(applicant, clan) } : null;
      }).filter(Boolean);
      sendData(response, 200, { clan: serializeClan(clan), role: actorRole, members: members().map((entry) => clanMemberPayload(entry, clan)).sort((a, b) => CLAN_ROLE_ORDER[b.clan_role] - CLAN_ROLE_ORDER[a.clan_role] || b.power - a.power), applications, activity: (clan.activity_log || []).slice().reverse(), member_limit: capacity() });
      return;
    }
    if (request.method !== 'POST') return;
    const body = await readJsonBody(request);
    const action = String(body.action || '');
    const target = store.players.find((entry) => String(entry.id) === String(body.playerId));
    const targetRole = target ? getClanRole(target, clan) : null;
    const deny = (message = 'No permission') => sendError(response, 403, message, 'NO_PERMISSION');
    if (action === 'application') {
      const application = (clan.applications || []).find((entry) => String(entry.id) === String(body.applicationId));
      const applicant = application && store.players.find((entry) => String(entry.id) === String(application.player_id));
      if (!application || !applicant) { sendError(response, 404, 'Application not found', 'CLAN_APPLICATION_NOT_FOUND'); return; }
      if (body.decision === 'accept' && (applicant.clan_id || applicant.clan_name)) {
        sendError(response, 409, 'Player must leave their current clan first', 'CLAN_ALREADY_JOINED');
        return;
      }
      clan.applications = clan.applications.filter((entry) => entry !== application);
      if (body.decision === 'accept') {
        if (members().length >= capacity()) { sendError(response, 409, 'Clan is full', 'CLAN_FULL'); return; }
        Object.assign(applicant, { clan_id: clan.id, clan_name: clan.name, clan_role: 'member', clan_description: clan.description, clan_logo_id: clan.logo_id, clan_joined_at: new Date().toISOString(), clan_donation_contributions: {} });
        addClanActivity(clan, player, `✓ ${clanActorName(player)} прийняв ${clanActorName(applicant)} до клану.`, 'green');
      } else addClanActivity(clan, player, `× ${clanActorName(player)} відхилив заявку ${clanActorName(applicant)}.`, 'red', true);
    } else if (action === 'kick') {
      if (!target || !isClanMember(target, clan) || String(target.id) === String(player.id) || (actorRole === 'deputy' && CLAN_ROLE_ORDER[targetRole] >= CLAN_ROLE_ORDER.deputy)) { deny(); return; }
      Object.assign(target, { clan_id: '', clan_name: '', clan_role: '', clan_description: '', clan_logo_id: '', clan_joined_at: null, clan_rejoin_available_at: new Date(Date.now() + 24 * 3600000).toISOString() });
      addClanActivity(clan, player, `⚠ ${clanActorName(player)} вигнав ${clanActorName(target)} з клану.`, 'red');
    } else if (action === 'role') {
      const nextRole = String(body.role || '');
      if (actorRole !== 'leader' || !target || !['deputy', 'elder', 'member'].includes(nextRole) || targetRole === 'leader') { deny(); return; }
      if (nextRole === 'deputy' && targetRole !== 'deputy' && members().filter((entry) => getClanRole(entry, clan) === 'deputy').length >= 3) { sendError(response, 409, 'Maximum 3 deputies', 'CLAN_DEPUTY_LIMIT'); return; }
      target.clan_role = nextRole;
      const verb = CLAN_ROLE_ORDER[nextRole] > CLAN_ROLE_ORDER[targetRole] ? 'підвищив' : 'понизив';
      addClanActivity(clan, player, `${verb === 'підвищив' ? '↑' : '↓'} ${clanActorName(player)} ${verb} ${clanActorName(target)}: ${CLAN_ROLE_META[targetRole].label} → ${CLAN_ROLE_META[nextRole].label}.`, verb === 'підвищив' ? 'green' : 'red');
    } else if (action === 'transfer') {
      if (actorRole !== 'leader' || !target || !isClanMember(target, clan) || String(target.id) === String(player.id) || !body.confirmed) { deny(); return; }
      player.clan_role = 'member'; target.clan_role = 'leader'; clan.owner_id = target.id;
      addClanActivity(clan, player, `★ ${clanActorName(player)} передав звання Космобаті ${clanActorName(target)}.`, 'yellow');
    } else if (action === 'settings') {
      const updates = body.updates || {};
      if (typeof updates.description === 'string') { clan.description = updates.description.slice(0, 300); members().forEach((entry) => { entry.clan_description = clan.description; }); addClanActivity(clan, player, `✎ ${clanActorName(player)} змінив опис клану.`, 'blue'); }
      const leaderFields = ['join_type', 'min_level', 'name', 'logo_id'];
      if (leaderFields.some((field) => updates[field] !== undefined) && actorRole !== 'leader') { deny(); return; }
      if (updates.join_type && ['open', 'request', 'invite'].includes(updates.join_type)) { const old = clan.join_type || 'open'; clan.join_type = updates.join_type; addClanActivity(clan, player, `⚙ ${clanActorName(player)} змінив тип вступу: ${old} → ${clan.join_type}.`, 'blue'); }
      if (updates.min_level !== undefined) { const old = clan.min_level || 1; clan.min_level = Math.max(1, Math.min(999, Number(updates.min_level) || 1)); addClanActivity(clan, player, `⚙ ${clanActorName(player)} змінив мінімальний рівень: ${old} → ${clan.min_level}.`, 'blue'); }
      if (typeof updates.name === 'string' && updates.name.trim()) { clan.name = updates.name.trim().slice(0, 40); members().forEach((entry) => { entry.clan_name = clan.name; }); }
      if (typeof updates.logo_id === 'string') { clan.logo_id = updates.logo_id; members().forEach((entry) => { entry.clan_logo_id = clan.logo_id; }); }
    } else if (action === 'clear_announcement') {
      clan.pinned_announcement = null;
      addClanActivity(clan, player, `✎ ${clanActorName(player)} прибрав закріплене оголошення.`, 'blue');
    } else if (action === 'mail' || action === 'announcement') {
      const title = String(body.title || '').trim().slice(0, 80); const text = String(body.text || '').trim().slice(0, 500);
      if (!title || !text) { sendError(response, 400, 'Title and text required', 'CLAN_MAIL_REQUIRED'); return; }
      if (action === 'mail' && (clan.clan_mail || []).filter((entry) => Date.now() - Date.parse(entry.created_at || '') < 86400000).length >= 3) { sendError(response, 429, 'Daily clan mail limit reached', 'CLAN_MAIL_LIMIT'); return; }
      const mail = { id: store.generateId('clan-mail'), title, text, tag: String(body.tag || 'ВАЖЛИВО').slice(0, 20), author: clanActorName(player), author_id: player.id, author_role: CLAN_ROLE_META[actorRole].label, created_at: new Date().toISOString() };
      if (action === 'announcement') clan.pinned_announcement = mail;
      else { clan.clan_mail = [...(clan.clan_mail || []), mail]; members().forEach((entry) => { entry.clan_mail = [...(entry.clan_mail || []), { ...mail, clan: clan.name }].slice(-30); }); }
      addClanActivity(clan, player, `✉ ${clanActorName(player)} надіслав оголошення: «${title}».`, 'blue');
    } else if (action === 'dissolve') {
      if (actorRole !== 'leader' || !body.confirmed) { deny(); return; }
      members().forEach((entry) => Object.assign(entry, { clan_id: '', clan_name: '', clan_role: '', clan_description: '', clan_logo_id: '', clan_joined_at: null }));
      store.clans = store.clans.filter((entry) => entry !== clan);
    } else { sendError(response, 400, 'Unknown management action', 'CLAN_ACTION_UNKNOWN'); return; }
    store.persistSoon();
    sendData(response, 200, { ok: true, clan: serializeClan(clan) });
    return;
  }

  if (clanProfileMatch && request.method === 'GET') {
    const clan = ensureClanRecord(decodeURIComponent(clanProfileMatch[1]));
    if (!clan) {
      sendError(response, 404, 'Clan not found', 'CLAN_NOT_FOUND');
      return;
    }
    const payload = serializeClan(clan);
    const viewer = getCurrentPlayer(request);
    if (isClanMember(viewer, clan)) {
      const donationState = payload.achievements.donations;
      const levelKey = String(donationState.level + 1);
      payload.donation = {
        contribution: (() => { const limit = viewer.clan_donation_limits?.[clan.id]?.[levelKey]; return Date.parse(limit?.available_at || '') > Date.now() ? Math.max(0, Number(limit.used || 0)) : 0; })(),
        available_at: (() => { const limit = viewer.clan_donation_limits?.[clan.id]?.[levelKey]; return Date.parse(limit?.available_at || '') > Date.now() ? limit.available_at : null; })(),
        contribution_cap: CLAN_ACHIEVEMENT_CONFIG.donations.contributionCaps[donationState.level] || 0,
        available_at: null,
      };
      payload.quest_cooldowns = viewer.clan_quest_cooldowns?.[clan.id] || {};
    }
    sendData(response, 200, payload);
    return;
  }

  const clanMembersMatch = url.pathname.match(/^\/clans\/([^/]+)\/members$/);
  if (clanMembersMatch && request.method === 'GET') {
    const clanKey = decodeURIComponent(clanMembersMatch[1]).trim();
    const members = store.players
      .filter((player) => String(player.clan_id || '') === clanKey || String(player.clan_name || '') === clanKey)
      .sort((a, b) => getPowerForLeaderboard(b) - getPowerForLeaderboard(a))
      .map(normalizePlayerProgression);
    sendData(response, 200, members);
    return;
  }

  if (url.pathname === '/players' && request.method === 'POST') {
    const session = getSessionFromHeaders(request.headers);
    if (!session) {
      sendError(response, 401, 'Player creation requires verified Telegram auth', 'AUTH_REQUIRED');
      return;
    }
    const body = await readJsonBody(request);
    if (hasUnsafePlayerCreateFields(body)) {
      sendError(response, 400, 'Unsafe player create fields are not allowed', 'UNSAFE_PLAYER_CREATE_FIELDS');
      return;
    }
    const existing = getCurrentPlayer(request);
    if (existing) {
      sendData(response, 200, normalizePlayerProgression(existing));
      return;
    }
    const player = mergePlayerDefaults(pickSafePlayerCreate(body), session);
    playerDb.addPlayer(player);
    console.log('[player] created', {
      playerId: player.id,
      telegramId: player.telegram_id || null,
      createdBy: player.created_by || null,
      source: 'players_create',
    });
    sendData(response, 201, normalizePlayerProgression(player));
    return;
  }

  if ((url.pathname === '/api/admin/loot-boxes' || url.pathname === '/admin/loot-boxes') && request.method === 'GET') {
    if (!requireAdminToken(request, response)) return;
    const defaults = getBossBoxTables();
    sendData(response, 200, { ...defaults, ...(store.lootBoxTables || {}) });
    return;
  }

  if ((url.pathname === '/api/admin/loot-boxes' || url.pathname === '/admin/loot-boxes') && request.method === 'PUT') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const tables = sanitizeBossBoxTables(body?.tables);
    store.lootBoxTables = tables;
    store.persistSoon(0);
    sendData(response, 200, { ...getBossBoxTables(), ...tables });
    return;
  }

  const reactionMatch = url.pathname.match(/^\/players\/([^/]+)\/reaction$/);
  if (reactionMatch && request.method === 'GET') {
    const actor = ensureCurrentPlayer(request);
    const targetId = String(reactionMatch[1]);
    if (!actor || String(actor.id) === targetId) {
      sendData(response, 200, { reaction: null, cooldownUntil: 0 });
      return;
    }
    const now = Date.now();
    const localTester = isLocalTester(actor);
    const reaction = (Array.isArray(actor.social_reaction_log) ? actor.social_reaction_log : [])
      .filter((entry) => String(entry?.target_id) === targetId)
      .map((entry) => ({ ...entry, createdMs: new Date(entry?.created_at || 0).getTime() }))
      .filter((entry) => Number.isFinite(entry.createdMs) && now - entry.createdMs < 12 * 60 * 60 * 1000)
      .sort((a, b) => b.createdMs - a.createdMs)[0];
    sendData(response, 200, {
      reaction: reaction?.type || null,
      cooldownUntil: !localTester && reaction ? reaction.createdMs + 12 * 60 * 60 * 1000 : 0,
      puddleActive: Boolean(store.players.find((item) => String(item.id) === targetId)?.puddle_active),
    });
    return;
  }

  const puddleMatch = url.pathname.match(/^\/players\/([^/]+)\/puddle$/);
  if (puddleMatch && request.method === 'POST') {
    const actor = ensureCurrentPlayer(request);
    const target = store.players.find((item) => String(item.id) === String(puddleMatch[1]));
    if (!actor || !target || String(actor.id) === String(target.id)) {
      sendError(response, 400, 'Puddle target is unavailable', 'PUDDLE_TARGET_UNAVAILABLE');
      return;
    }
    const now = Date.now();
    const localTester = isLocalTester(actor);
    const reactionLog = Array.isArray(actor.social_reaction_log)
      ? actor.social_reaction_log.filter((entry) => now - new Date(entry?.created_at || 0).getTime() < 12 * 60 * 60 * 1000)
      : [];
    if (!localTester && reactionLog.some((entry) => String(entry?.target_id) === String(target.id))) {
      sendError(response, 429, 'Social reaction is on cooldown', 'SOCIAL_REACTION_COOLDOWN');
      return;
    }
    const rewardLog = Array.isArray(actor.dislike_reward_log)
      ? actor.dislike_reward_log.filter((entry) => {
        const createdAt = new Date(entry?.created_at || 0).getTime();
        return Number.isFinite(createdAt) && now - createdAt < 24 * 60 * 60 * 1000;
      })
      : [];
    const hasTargetCooldown = rewardLog.some((entry) => (
      String(entry?.target_id) === String(target.id)
      && now - new Date(entry.created_at).getTime() < 12 * 60 * 60 * 1000
    ));
    const rewardGranted = rewardLog.length < 4 && !hasTargetCooldown;
    if (rewardGranted) {
      rewardLog.push({ target_id: target.id, created_at: new Date(now).toISOString() });
      grantEnergyGain(actor, 25, 'dislike_reward');
    }
    actor.dislike_reward_log = rewardLog;
    actor.social_reaction_log = [...reactionLog, { target_id: target.id, type: 'dislike', created_at: new Date(now).toISOString() }];
    const puddleSenders = Array.isArray(target.puddle_senders) ? target.puddle_senders : [];
    if (!puddleSenders.some((entry) => String(entry.sender_id) === String(actor.id))) {
      puddleSenders.push({ sender_id: actor.id, sender_name: actor.nickname || actor.username || 'Player', avatar: actor.avatar || actor.photoUrl || '', avatar_frame_id: actor.avatar_frame_id || 'frame1', created_at: new Date(now).toISOString() });
      target.puddle_senders = puddleSenders;
    }
    target.dislikes_received_count = Number(target.dislikes_received_count || 0) + 1;
    if (!target.puddle_active) {
      target.puddle_active = true;
      target.puddle_created_at = new Date(now).toISOString();
    }
    store.persistSoon();
    sendData(response, 200, {
      target: normalizePlayerProgression(target),
      reward: { granted: rewardGranted, energy: rewardGranted ? 25 : 0 },
      player: normalizePlayerProgression(actor),
    });
    return;
  }

  const likeMatch = url.pathname.match(/^\/players\/([^/]+)\/like$/);
  if (likeMatch && request.method === 'POST') {
    const actor = ensureCurrentPlayer(request);
    const target = store.players.find((item) => String(item.id) === String(likeMatch[1]));
    if (!actor || !target || String(actor.id) === String(target.id)) {
      sendError(response, 400, 'Like target is unavailable', 'LIKE_TARGET_UNAVAILABLE');
      return;
    }
    const box = target.like_box && typeof target.like_box === 'object' ? target.like_box : { contributions: [] };
    const contributions = Array.isArray(box.contributions) ? box.contributions : [];
    const now = Date.now();
    const localTester = isLocalTester(actor);
    const reactionLog = Array.isArray(actor.social_reaction_log)
      ? actor.social_reaction_log.filter((entry) => now - new Date(entry?.created_at || 0).getTime() < 12 * 60 * 60 * 1000)
      : [];
    if (!localTester && reactionLog.some((entry) => String(entry?.target_id) === String(target.id))) {
      sendError(response, 429, 'Social reaction is on cooldown', 'SOCIAL_REACTION_COOLDOWN');
      return;
    }
    const alreadySent = contributions.some((entry) => String(entry.sender_id) === String(actor.id));
    let added = false;
    if (!alreadySent && contributions.length < 20) {
      const roll = Math.random() * 100;
      const reward = roll < 50 ? { type: 'energy', amount: 10 } : roll < 75 ? { type: 'tentacles', amount: 500 } : roll < 85 ? { type: 'poison', amount: 1 } : { type: 'spin', amount: 1 };
      const previousUniqueSenders = new Set(contributions.map((entry) => String(entry?.sender_id || '')).filter(Boolean));
      contributions.push({ sender_id: actor.id, created_at: new Date().toISOString(), reward });
      target.like_box = { contributions, updated_at: new Date().toISOString() };
      target.likes_received_count = Math.max(Number(target.likes_received_count || 0), previousUniqueSenders.size) + 1;
      grantEnergyGain(actor, 10, 'like_sender_reward');
      actor.social_reaction_log = [...reactionLog, { target_id: target.id, type: 'like', created_at: new Date(now).toISOString() }];
      added = true;
    }
    store.persistSoon();
    sendData(response, 200, { added, player: normalizePlayerProgression(actor), target: publicPlayerProfile(target), boxCount: contributions.length });
    return;
  }

  if (url.pathname === '/players/me/like-box/claim' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    const contributions = Array.isArray(player?.like_box?.contributions) ? player.like_box.contributions : [];
    if (!player || !contributions.length) {
      sendError(response, 400, 'Like box is empty', 'LIKE_BOX_EMPTY');
      return;
    }
    const rewards = { energy: 0, tentacles: 0, poison: 0, spin: 0 };
    contributions.forEach((entry) => { const reward = entry?.reward || {}; rewards[reward.type] = Number(rewards[reward.type] || 0) + Number(reward.amount || 0); });
    if (rewards.energy) grantEnergyGain(player, rewards.energy, 'like_box');
    if (rewards.tentacles) player.tentacles = Number(player.tentacles || 0) + rewards.tentacles;
    if (rewards.poison) player.weapon_inventory = { ...(player.weapon_inventory || {}), 'small-poison': Number((player.weapon_inventory || {})['small-poison'] || 0) + rewards.poison };
    if (rewards.spin) player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + rewards.spin;
    const contributionDetails = contributions.map((entry) => ({
      ...entry,
      sender_name: store.players.find((candidate) => String(candidate.id) === String(entry.sender_id))?.nickname
        || store.players.find((candidate) => String(candidate.id) === String(entry.sender_id))?.username
        || 'Player',
      avatar: store.players.find((candidate) => String(candidate.id) === String(entry.sender_id))?.avatar || '',
      avatar_frame_id: store.players.find((candidate) => String(candidate.id) === String(entry.sender_id))?.avatar_frame_id || 'frame1',
    }));
    player.like_box = { contributions: [], claimed_at: new Date().toISOString() };
    store.persistSoon();
    sendData(response, 200, { rewards, contributions: contributionDetails, player: normalizePlayerProgression(player) });
    return;
  }

  if (url.pathname.startsWith('/players/') && request.method === 'PATCH') {
    const playerId = url.pathname.split('/')[2];
    const body = normalizePlayerPatch(await readJsonBody(request));
    const player = store.players.find((item) => item.id === playerId);

    if (!player) {
      sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND');
      return;
    }

    if (!canAccessPlayer(request, player)) {
      sendError(response, 403, 'You can only update your own profile', 'PLAYER_FORBIDDEN');
      return;
    }

    materializePlayerState(player);

    if (body?.mailAction) {
      const action = String(body.mailAction.type || '').trim();
      const mailType = String(body.mailAction.mailType || '').trim();
      const mailId = String(body.mailAction.mailId || '').trim().slice(0, 160);
      if (mailType !== 'clan' || !['read', 'delete'].includes(action) || !mailId) {
        sendError(response, 400, 'Invalid mail action', 'INVALID_MAIL_ACTION');
        return;
      }
      const mails = Array.isArray(player.clan_mail) ? player.clan_mail : [];
      const targetIndex = mails.findIndex((mail, index) => String(mail?.id || `clan-mail-${index}`) === mailId);
      if (targetIndex < 0) {
        sendError(response, 404, 'Message not found', 'MAIL_NOT_FOUND');
        return;
      }
      const readIds = new Set((Array.isArray(player.clan_mail_read_ids) ? player.clan_mail_read_ids : []).map(String));
      if (action === 'read') {
        readIds.add(mailId);
        player.clan_mail_read_ids = [...readIds].slice(-200);
      } else {
        player.clan_mail = mails.filter((mail, index) => String(mail?.id || `clan-mail-${index}`) !== mailId);
        player.clan_mail_read_ids = [...readIds].filter((id) => id !== mailId).slice(-200);
      }
      queueDirtyPlayerFlush(player.id);
      shouldPersistGlobalState = Boolean(getClanForPlayer(player));
      sendData(response, 200, normalizePlayerProgression(player));
      return;
    }

    if (body?.claimCARankReward) {
      try {
        const requestedRank = Number(body.claimCARankReward.rank);
        const reward = claimCARankReward(player, requestedRank);
        queueDirtyPlayerFlush(player.id);
        sendData(response, 200, { ...normalizePlayerProgression(player), claimedCARank: requestedRank, claimedReward: reward });
      } catch (error) {
        sendError(response, error.statusCode || 400, error.message || 'Could not claim CA rank reward', error.code || 'CA_RANK_REWARD_CLAIM_FAILED');
      }
      return;
    }

    if (body?.playerAction) {
      try {
        const result = body.playerAction.type === 'reset-talents' ? resetPlayerTalents(player) : body.playerAction.type === 'redeem-promo' ? redeemPromoCode(player, body.playerAction.code, store.promoCodes || []) : applyPlayerAction(player, body.playerAction);
        queueDirtyPlayerFlush(player.id);
        if (body.playerAction.type === 'redeem-promo') store.persistSoon(0);
        shouldPersistGlobalState = false;
        sendData(response, 200, { ...result, player: normalizePlayerProgression(player) });
      } catch (error) {
        sendError(response, error.statusCode || 400, error.message || 'Action failed', error.code || 'PLAYER_ACTION_FAILED');
      }
      return;
    }

    if (body?.claimWelcomeEnergy === true || body?.welcome_energy_granted === true) {
      if (!player.welcome_energy_granted) {
        player.energy = Math.max(0, Number(player.energy) || 0) + 131;
        player.welcome_energy_granted = true;
        player.last_energy_update = new Date().toISOString();
        queueDirtyPlayerFlush(player.id);
      }
      sendData(response, 200, normalizePlayerProgression(player));
      return;
    }

    if (body?.battlePassAction) {
      if (!battlePassEnabled()) {
        sendError(response, 404, 'Battle Pass test is disabled', 'BATTLE_PASS_DISABLED');
        return;
      }
      try {
        recordBattlePassEvent(player, { type: 'login' });
        let battlePassClaimed;
        if (body.battlePassAction.type === 'claim-all') battlePassClaimed = claimAllBattlePassRewards(player);
        else if (body.battlePassAction.type === 'claim') claimBattlePassReward(player, body.battlePassAction);
        else if (body.battlePassAction.type !== 'sync') throw new Error('Unknown Battle Pass action');
        queueDirtyPlayerFlush(player.id);
        sendData(response, 200, { ...normalizePlayerProgression(player), ...(battlePassClaimed ? { battlePassClaimed } : {}) });
      } catch (error) {
        sendError(response, 400, error.message, 'BATTLE_PASS_ACTION_FAILED');
      }
      return;
    }

    if (body?.talentUpgrade?.id) {
      try {
        upgradeTalent(player, String(body.talentUpgrade.id));
        shouldPersistGlobalState = false;
        sendData(response, 200, normalizePlayerProgression(player));
      } catch (error) {
        sendError(response, 400, error.message || 'Talent upgrade failed', error.code || 'TALENT_UPGRADE_FAILED');
      }
      return;
    }

    if (body?.claimReferralReward) {
      try {
        const result = claimReferralRewardForPlayer(player, body.claimReferralReward);
        sendData(response, 200, result);
      } catch (error) {
        sendError(response, 400, error.message || 'Failed to claim referral reward', error.code || 'REFERRAL_REWARD_FAILED');
      }
      return;
    }

      if (body?.spinRoulette) {
      const result = spinRoulette(player, String(body.spinRoulette?.spinType || 'free'), body.spinRoulette?.count ?? 1);
      sendData(response, 200, result);
      return;
    }

      if (body?.claimRouletteReward) {
        const pendingReward = player.roulette_pending_reward || null;
        const requestedId = String(body.claimRouletteReward?.pendingId || '').trim();
        const pendingId = String(pendingReward?.pendingId || pendingReward?.id || '').trim();
        if (!pendingReward) {
        sendData(response, 200, normalizePlayerProgression(player));
        return;
      }
      if (requestedId && pendingId && requestedId !== pendingId) {
        sendError(response, 409, 'Roulette reward mismatch', 'ROULETTE_REWARD_MISMATCH');
        return;
        }
        for (const reward of pendingReward.rewards || [pendingReward]) {
          applyRouletteReward(player, reward);
          if (reward.type === 'tentacles') recordBattlePassEvent(player, { type: 'earnedDm', source: 'reward', amount: reward.amount });
        }
        player.last_energy_update = new Date().toISOString();
        delete player.roulette_pending_reward;
        console.log('[roulette] reward claimed', {
          playerId: player.id,
          rewardId: pendingReward.id || null,
          pendingId: pendingReward.pendingId || null,
          energy: Number(player.energy || 0),
          premium: Number(player.premium || 0),
          tentacles: Number(player.tentacles || 0),
          maxEnergy: Number(player.max_energy || GAME_CONFIG.MAX_ENERGY_BASE),
        });
        sendData(response, 200, normalizePlayerProgression(player));
        return;
      }

    const previousNickname = String(player.nickname || player.username || '').trim();
    const energyBeforePatch = Number(player.energy || 0);
    const energySpentBeforePatch = Number(player.energy_spent_today || 0);
    const tasksBeforePatch = Number(player.total_tasks_today || 0);
    if (typeof body?.nickname === 'string') {
      const requestedNickname = body.nickname.trim().slice(0, 40);
      if (requestedNickname !== String(player.nickname || player.username || '').trim()) {
        if (requestedNickname.length < 3) {
        sendError(response, 400, 'Nickname must contain at least 3 characters', 'NICKNAME_TOO_SHORT');
        return;
        }
        const nicknameChangeCount = Math.max(0, Number(player.nickname_change_count || 0));
        const nicknameChangePrice = 500;
        if (nicknameChangeCount >= 1) {
          const premium = Math.max(0, Number(player.premium || 0));
          if (premium < nicknameChangePrice) {
            sendError(response, 400, 'Not enough T-Pape', 'NICKNAME_CHANGE_PAYMENT_REQUIRED');
            return;
          }
          player.premium = premium - nicknameChangePrice;
        }
        player.nickname_change_count = nicknameChangeCount + 1;
      }
      body.nickname = requestedNickname;
    }
    if (body.tentacles === undefined && body.scrap !== undefined) body.tentacles = body.scrap;
    if (body.safe_tentacles === undefined && body.safe_scrap !== undefined) body.safe_tentacles = body.safe_scrap;
    delete body.scrap;
    delete body.safe_scrap;
    const safePatch = pickSafePlayerPatch(body);
    const dailyShopValidation = validateDailyShopPatch(player, body);
    if (dailyShopValidation.error) {
      sendError(response, 409, dailyShopValidation.error, 'DAILY_SHOP_LIMIT_REACHED');
      return;
    }
    Object.assign(safePatch, dailyShopValidation.patch);
    const ignoredKeys = Object.keys(body).filter((key) => !Object.hasOwn(safePatch, key));
    if (ignoredKeys.length) {
      void recordDiagnosticEvent({ source: 'api', method: 'PATCH', path: '/players/:id', status: 200,
        code: 'PLAYER_PATCH_IGNORED', message: ignoredKeys.slice(0, 20).join(', ') }).catch(() => {});
    }
    for (const [key, value] of Object.entries(safePatch)) {
      player[key] = value;
    }
    if (typeof safePatch.nickname === 'string' && safePatch.nickname !== previousNickname) {
      for (const candidate of store.players) {
        for (const entry of candidate.puddle_senders || []) {
          if (String(entry?.sender_id) === String(player.id)) entry.sender_name = safePatch.nickname;
        }
        for (const mail of candidate.clan_mail || []) {
          if (String(mail?.author_id || '') === String(player.id) || (!mail?.author_id && mail?.author === previousNickname)) {
            mail.author = safePatch.nickname;
            mail.author_id = player.id;
          }
        }
      }
      for (const clan of store.clans || []) {
        for (const mail of clan.clan_mail || []) {
          if (String(mail?.author_id || '') === String(player.id) || (!mail?.author_id && mail?.author === previousNickname)) {
            mail.author = safePatch.nickname;
            mail.author_id = player.id;
          }
        }
      }
    }
    const requestedEnergySpend = Math.max(0, Number(player.energy_spent_today || 0) - energySpentBeforePatch);
    const actualEnergySpend = Math.max(0, energyBeforePatch - Number(player.energy || 0));
    const battlePassEnergySpend = Math.min(requestedEnergySpend, actualEnergySpend);
    if (battlePassEnergySpend > 0) {
      recordBattlePassEvent(player, { type: 'missionSpend', energy: battlePassEnergySpend });
      progressClanQuestMetric(getClanForPlayer(player), player, 'energy', battlePassEnergySpend);
    }
    const requestedMissionCount = Math.max(0, Number(player.total_tasks_today || 0) - tasksBeforePatch);
    const battlePassMissionCount = battlePassEnergySpend > 0 ? Math.min(requestedMissionCount, 1) : 0;
    if (battlePassMissionCount > 0) {
      recordBattlePassEvent(player, { type: 'missionComplete', count: battlePassMissionCount });
      progressClanQuestMetric(getClanForPlayer(player), player, 'missions', battlePassMissionCount);
    }
    queueDirtyPlayerFlush(player.id);
    shouldPersistGlobalState = Boolean(getClanForPlayer(player));
    sendData(response, 200, normalizePlayerProgression(player));
    return;
  }

  if (url.pathname.startsWith('/players/') && url.pathname.endsWith('/tasks/complete') && request.method === 'POST') {
    const parts = url.pathname.split('/').filter(Boolean);
    const playerId = parts[1];
    const body = await readJsonBody(request);
    const player = store.players.find((item) => item.id === playerId);

    if (!player) {
      sendError(response, 404, 'Player not found', 'PLAYER_NOT_FOUND');
      return;
    }

    if (!canAccessPlayer(request, player)) {
      sendError(response, 403, 'You can only update your own profile', 'PLAYER_FORBIDDEN');
      return;
    }

    materializePlayerState(player);

    const locationId = String(body?.task?.locationId || '').trim();
    if (locationId && !isQuestLocationUnlocked(player, locationId)) {
      sendError(response, 403, 'Quest location is locked', 'QUEST_LOCATION_LOCKED');
      return;
    }

    const missionId = String(body?.task?.id || body?.taskId || body?.missionId || '').trim();
    const requestId = String(body?.requestId || '').trim();
    if (requestId && !/^[a-zA-Z0-9_-]{12,80}$/.test(requestId)) {
      sendError(response, 400, 'Invalid request id', 'MISSION_REQUEST_ID_INVALID');
      return;
    }
    const previousRequest = requestId && (player.mission_request_history || []).find((entry) => entry.id === requestId);
    if (previousRequest) {
      sendData(response, 200, { ...previousRequest.result, player: normalizePlayerProgression(player) });
      return;
    }
    const mission = GAME_CONFIG.TASKS.find((task) => task.id === missionId);
    let result;
    try {
      result = mission ? applyMission(player, mission.id) : applyQuestMission(player, body?.task || {});
    } catch (error) {
      const status = error?.code === 'NOT_ENOUGH_ENERGY' ? 400 : 404;
      sendError(response, status, error?.message || 'Mission failed', error?.code || 'MISSION_FAILED');
      return;
    }
    if (requestId) player.mission_request_history = [...(player.mission_request_history || []), { id: requestId, result }].slice(-30);
    // Persist this player's update in the background; waiting here keeps each
    // quest segment spinning on a SQL round trip.
    queueDirtyPlayerFlush(player.id);
    shouldPersistGlobalState = Boolean(getClanForPlayer(player));
    sendData(response, 200, {
      ...result,
      player: normalizePlayerProgression(player),
    });
    return;
  }

  if ((url.pathname === '/leaderboard' || url.pathname === '/leaderboard/me') && request.method === 'GET') {
    const { sort = '-level', limit = '100' } = getQuery(url);
    const referralCounts = sort === '-referrals' ? getPlayerReferralCounts(store.players) : null;
    const powerById = sort === '-referrals' || sort === '-stat_strength'
      ? new Map(store.players.map((player) => [String(player.id), getPowerForLeaderboard(player)]))
      : null;
    const players = sort === '-referrals'
      ? [...store.players].sort((a, b) => {
          const referralDiff = (referralCounts.get(String(b.id)) || 0) - (referralCounts.get(String(a.id)) || 0);
          return referralDiff || powerById.get(String(b.id)) - powerById.get(String(a.id)) || String(a.id).localeCompare(String(b.id));
        })
      : sort === '-stat_strength' ? [...store.players].sort((a, b) => powerById.get(String(b.id)) - powerById.get(String(a.id)) || String(a.id).localeCompare(String(b.id))) : sortPlayers(store.players, sort);
    if (url.pathname === '/leaderboard/me') {
      const player = ensureCurrentPlayer(request);
      if (!player) { sendError(response, 401, 'Authentication required', 'AUTH_REQUIRED'); return; }
      const index = players.findIndex(entry => String(entry.id) === String(player.id));
      sendData(response, 200, { rank: index >= 0 ? index + 1 : null, player: publicPlayerProfile(player, referralCounts?.get(String(player.id)) ?? null) });
      return;
    }
    const safeLimit = Math.max(0, Math.min(100, Number(limit) || 50));
    sendData(response, 200, players.slice(0, safeLimit).map((player) => publicPlayerProfile(player, referralCounts?.get(String(player.id)) ?? null)));
    return;
  }

  if (url.pathname === '/chat/messages' && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    const { channel = 'world', limit = '50', scope = '' } = getQuery(url);
    const safeChannel = channel === 'clan' ? 'clan' : 'world';
    const playerClan = String(player?.clan_name || '').trim();
    const includeAll = scope === 'all';
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
    const canViewRestricted = safeChannel === 'clan' && canManageClan(player, getClanForPlayer(player));
    const activeFightIds = new Set(store.bossFights.filter(isActiveBossFight).map((fight) => String(fight.id)));
    const playerById = new Map(store.players.map((entry) => [String(entry.id), entry]));
    const recentMessages = [];
    for (let index = store.chatMessages.length - 1; index >= 0 && recentMessages.length < safeLimit; index -= 1) {
      const message = store.chatMessages[index];
      if (message.channel !== safeChannel) continue;
      if (!includeAll && safeChannel === 'clan' && playerClan && String(message?.clan || '').trim() !== playerClan) continue;
      if (message.restricted && !canViewRestricted) continue;
      if (message.kind === 'boss_fight_invite' && !activeFightIds.has(String(message.bossFightInvite?.fightId || ''))) continue;
      recentMessages.push(message);
    }
    const messages = recentMessages.reverse()
      .map((message) => normalizeChatMessage(message, player, playerById))
      .sort((a, b) => (Date.parse(a.created_at || '') || 0) - (Date.parse(b.created_at || '') || 0));

    sendData(response, 200, messages);
    return;
  }

  if (url.pathname === '/chat/messages' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const channel = body.channel === 'clan' ? 'clan' : 'world';
    const text = String(body.text || '').trim().slice(0, 180);

    if (!text) {
      sendError(response, 400, 'Message text is required', 'CHAT_TEXT_REQUIRED');
      return;
    }

    if (channel === 'clan' && !getClanForPlayer(player)) { sendError(response, 403, 'Clan membership required', 'CLAN_REQUIRED'); return; }
    const reply = body.replyToId ? store.chatMessages.find(entry => entry.id === body.replyToId && entry.channel === channel && !entry.restricted && (channel !== 'clan' || entry.clan === player.clan_name)) : null;
    if (body.replyToId && !reply) { sendError(response, 400, 'Reply target unavailable', 'CHAT_REPLY_INVALID'); return; }
    const inviteClan = body.kind === 'clan_invite' ? getClanForPlayer(player) : null;
    let bossFightInvite = null;
    if (body.kind === 'boss_fight_invite') {
      const fightId = String(body.bossFightInvite?.fightId || '');
      const fight = store.bossFights.find((entry) => String(entry.id) === fightId);
      if (channel !== 'clan' || !fight || !isActiveBossFight(fight) || String(fight.opened_by_email || '').toLowerCase() !== String(player.created_by || '').toLowerCase()) {
        sendError(response, 403, 'Only the player who started an active fight can invite the clan', 'BOSS_FIGHT_INVITE_FORBIDDEN');
        return;
      }
      const existingInvite = store.chatMessages.find((entry) => entry.kind === 'boss_fight_invite' && String(entry.bossFightInvite?.fightId || '') === fightId);
      if (fight.clan_invite_sent_at || existingInvite) {
        sendError(response, 409, 'The clan has already been invited to this boss fight', 'BOSS_FIGHT_INVITE_ALREADY_SENT');
        return;
      }
      bossFightInvite = { fightId: fight.id, bossId: fight.boss_id, bossName: fight.boss_name || getBossById(fight.boss_id)?.name || '', clanLogoId: player.clan_logo_id || '' };
    }
    if (body.kind === 'clan_invite' && (!inviteClan || channel !== 'world')) { sendError(response, 403, 'Clan membership required', 'CLAN_REQUIRED'); return; }
    if (inviteClan && !canManageClan(player, inviteClan)) { sendError(response, 403, 'Leader or deputy required', 'NO_PERMISSION'); return; }
    if (inviteClan && store.chatMessages.some(entry => entry.kind === 'clan_invite' && entry.clanInvite?.id === inviteClan.id && Date.now() - Date.parse(entry.created_at) < 20 * 60000)) { sendError(response, 429, 'Wait 20 minutes before inviting again', 'CHAT_INVITE_COOLDOWN'); return; }
    const createdAt = new Date().toISOString();
    const message = {
      kind: inviteClan ? 'clan_invite' : bossFightInvite ? 'boss_fight_invite' : 'text',
      clanInvite: inviteClan ? { id: inviteClan.id, name: inviteClan.name, logoId: inviteClan.logo_id, level: Number(inviteClan.level || 0) } : undefined,
      bossFightInvite,
      reply: reply ? { id: reply.id, author: reply.author, text: reply.text.slice(0, 120) } : undefined,
      id: store.generateId('chat'),
      channel,
      player_id: player.id,
      author: player.nickname || player.username || 'player',
      clan: player.clan_name || '',
      role: channel === 'clan' ? 'Боєць' : undefined,
      avatar: player.avatar || player.photoUrl || player.photo_url || '',
      avatar_frame_id: player.avatar_frame_id || player.selected_avatar_frame || '',
      text,
      created_at: createdAt,
    };

    store.chatMessages.push(message);
    if (bossFightInvite) {
      const fight = store.bossFights.find((entry) => String(entry.id) === String(bossFightInvite.fightId));
      if (fight) fight.clan_invite_sent_at = createdAt;
      store.persistSoon(0);
    }
    sendData(response, 201, normalizeChatMessage(message, player));
    return;
  }

  if (url.pathname === '/chat/messages' && request.method === 'DELETE') {
    store.chatMessages.length = 0;
    sendData(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/events/poison-shop' && request.method === 'GET') {
    ensureCurrentPlayer(request);
    sendData(response, 200, poisonShopState(store.players));
    return;
  }
  if (url.pathname === '/events/poison-shop/buy' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    const body = await readJsonBody(request);
    let receipt;
    try { receipt = purchaseEventPoison(store.players, player, body); }
    catch (error) { sendError(response, 400, error.message, 'POISON_SHOP_PURCHASE_FAILED'); return; }
    await playerDb.flushDirtyPlayers([player.id]);
    sendData(response, 200, { receipt, shop: poisonShopState(store.players) });
    return;
  }
  if (url.pathname === '/raid-boss' && request.method === 'GET') {
    sendData(response, 200, store.raidBoss ? { ...store.raidBoss, started_at: EVENT_SCHEDULE['raid-boss'].startAt, ends_at: EVENT_SCHEDULE['raid-boss'].endAt, event_phase: eventPhase('raid-boss') } : null);
    return;
  }

  if (url.pathname === '/boss-fights/last-winners' && request.method === 'GET') {
    const latestByBoss = new Map();
    store.bossFights
      .filter((fight) => fight?.status === 'dead' && fight?.boss_id && fight?.ended_at)
      .sort((left, right) => Date.parse(right.ended_at) - Date.parse(left.ended_at))
      .forEach((fight) => {
        if (latestByBoss.has(fight.boss_id)) return;
        const winner = store.players.find((player) => String(player.created_by) === String(fight.opened_by_email));
        latestByBoss.set(fight.boss_id, {
          player_id: winner?.id || '',
          name: winner?.nickname || winner?.username || 'player',
          avatar: winner?.avatar || winner?.photoUrl || winner?.photo_url || '',
          defeated_at: fight.ended_at,
        });
      });
    sendData(response, 200, Object.fromEntries(latestByBoss));
    return;
  }

  if (url.pathname === '/raid-boss/leaderboard' && request.method === 'GET') {
    const playersById = new Map(store.players.map((player) => [String(player.id), player]));
    const entries = rankRaidParticipants(store.raidBoss?.participants).map(row => [row.playerId, store.raidBoss.participants[row.playerId]])
      .map(([playerId, contribution]) => {
        const player = playersById.get(String(playerId));
        return {
          player_id: playerId,
          player_email: player?.created_by || playerId,
          player_name: contribution?.name || player?.nickname || player?.username || 'player',
          damage: Number(contribution?.damage || 0),
          hits: Number(contribution?.hits || 0),
          clan_name: player?.clan_name || '',
          clan_logo_id: player?.clan_logo_id || '',
          battle_pass_tier: player ? normalizePlayerProgression(player).battle_pass_view?.tier || 'free' : 'free',
          avatar: player?.avatar || player?.photoUrl || '',
          avatar_frame_id: player?.avatar_frame_id || 'frame1',
        };
      })
      .sort((a, b) => b.damage - a.damage || b.hits - a.hits || String(a.player_id).localeCompare(String(b.player_id)));
    sendData(response, 200, entries);
    return;
  }

  if (url.pathname === '/raid-boss/attack' && request.method === 'POST') {
    if (eventPhase('raid-boss') !== 'active') { sendError(response, 409, 'Raid event is not active', 'EVENT_INACTIVE'); return; }
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    if (getBossEscapeCooldownRemaining(player.weapon_cooldowns) > 0) {
      sendError(response, 429, 'Boss attacks are blocked for 30 minutes after escaping.', 'BOSS_ESCAPE_COOLDOWN');
      return;
    }
    const localTester = isLocalTester(player);
    if (player.puddle_active && !localTester) {
      sendError(response, 403, 'Ти стоїш в калюжі, за собою подивитись не можеш, а вже на боса лізеш. Спочатку приберися.', 'PUDDLE_CLEANUP_REQUIRED');
      return;
    }

    const raidBoss = store.raidBoss;
    if (!raidBoss || raidBoss.status !== 'active' || Number(raidBoss.current_hp || 0) <= 0) {
      sendError(response, 400, 'Raid boss is not active', 'RAID_BOSS_NOT_ACTIVE');
      return;
    }

    const body = await readJsonBody(request);
    Object.assign(player, migrateTalentTreeState(player));
    const weapon = getWeaponById(body.weaponId);
    if (!weapon) {
      sendError(response, 400, 'Weapon not found', 'WEAPON_NOT_FOUND');
      return;
    }
    const effectiveWeapon = buildEffectiveWeapon(weapon, player);
    const poisonInventoryId = { satchel: 'small-poison', f4: 'medium-poison', c4: 'large-poison' }[effectiveWeapon.id];
    const requestedMultiplier = Number(body.multiplier);
    const attackCount = poisonInventoryId && (requestedMultiplier === 10 || requestedMultiplier === 100) ? requestedMultiplier : 1;
    if (!localTester && poisonInventoryId && Number((player.weapon_inventory || {})[poisonInventoryId] || 0) < attackCount) {
      sendError(response, 400, 'Not enough poison in inventory', 'NOT_ENOUGH_POISON');
      return;
    }
    const lastUsed = (player.weapon_cooldowns || {})[weapon.id];
    if (!localTester && effectiveWeapon.cooldownMin > 0 && lastUsed && (new Date() - new Date(lastUsed)) / 60000 < effectiveWeapon.cooldownMin) {
      sendError(response, 400, 'Weapon is on cooldown', 'WEAPON_ON_COOLDOWN');
      return;
    }
    if (!localTester) player.weapon_cooldowns = { ...(player.weapon_cooldowns || {}), [weapon.id]: new Date().toISOString() };
    const raidFightKey = `raid:${raidBoss.id || 'active'}`;
    const previousRaidState = player.talent_combat_state?.[raidFightKey] || {};
    const allyDamage = Object.entries(raidBoss.participants || {}).filter(([playerId]) => playerId !== player.id).reduce((sum, [, entry]) => sum + Number(entry?.damage || 0), 0);
    const allyTier = Math.floor(allyDamage / 100000);
    const previousAllyTier = Number(previousRaidState.lastAllyDamageTier || 0);
    const raidState = allyTier > previousAllyTier && Number(player.talent_levels?.t59 || 0) > 0
      ? { ...previousRaidState, lastAllyDamageTier: allyTier, pendingAllyBonus: Number(previousRaidState.pendingAllyBonus || 0) + (allyTier - previousAllyTier) * Number(player.talent_levels.t59) * 5 }
      : previousRaidState;
    let raidCombat = null;
    let raidTalentDamage = 0;
    let raidRuntimeState = raidState;
    for (let index = 0; index < attackCount; index += 1) {
      raidCombat = resolveTalentAttack({ weapon: effectiveWeapon, levels: Number(player.talent_tree_version || 0) >= 2 ? (player.talent_levels || {}) : {}, state: raidRuntimeState, fight: raidBoss, player, now: Date.now() + index });
      raidRuntimeState = raidCombat.state;
      raidTalentDamage += raidCombat.damage + raidCombat.bleedDamage + raidCombat.repeatDamage;
    }
    const isCrit = Boolean(raidCombat?.isCrit);
    const damage = Math.max(1, Math.floor(raidTalentDamage * (1 + Number(effectiveWeapon.equipmentBossDamagePct || 0)) * (poisonInventoryId ? getClanPoisonMultiplier(player) : 1)));
    player.talent_combat_state = { ...(player.talent_combat_state || {}), [raidFightKey]: raidCombat.state };
    if (isCrit && effectiveWeapon.id === 'fist' && Number(player.talent_levels?.t14 || 0) > 0 && Number(effectiveWeapon.cooldownMin || 0) > 0) {
      const reducedElapsedMs = Number(effectiveWeapon.cooldownMin) * 60000 * Math.min(.1, Number(player.talent_levels.t14) * .01);
      player.weapon_cooldowns = { ...(player.weapon_cooldowns || {}), fist: new Date(Date.now() - reducedElapsedMs).toISOString() };
    }
    let poisonUsed = 0;
    if (poisonInventoryId) {
      const savedUses = Array.from({ length: attackCount }).filter(() => Math.random() < Number(effectiveWeapon.saveChance || 0)).length;
      poisonUsed = localTester ? 0 : attackCount - savedUses;
      if (!localTester) {
        player.weapon_inventory = { ...(player.weapon_inventory || {}), [poisonInventoryId]: Math.max(0, Number((player.weapon_inventory || {})[poisonInventoryId] || 0) - poisonUsed) };
      }
    }
    const raidPreviousHp = Number(raidBoss.current_hp || 0);
    raidBoss.current_hp = Math.max(0, raidPreviousHp - damage);
    player.talent_combat_state[raidFightKey] = registerHpThresholds(player.talent_combat_state[raidFightKey], raidPreviousHp, Number(raidBoss.current_hp || 0), Number(raidBoss.max_hp || 1));
    if (isCrit && Number(player.talent_levels?.t48 || 0) > 0 && Math.random() < Number(player.talent_levels.t48) * .02) {
      refundCombatEnergy(player, 10);
    }
    raidBoss.participants = { ...(raidBoss.participants || {}) };
    const contribution = raidBoss.participants[player.id] || { name: player.nickname || player.username || 'player', damage: 0, hits: 0, poison_used: 0, poison_tracking_complete: true };
    contribution.damage += damage;
    contribution.hits += attackCount;
    contribution.poison_used = Number(contribution.poison_used || 0) + poisonUsed;
    if (contribution.poison_tracking_complete !== true) contribution.poison_tracking_complete = false;
    raidBoss.participants[player.id] = contribution;
    if (raidBoss.current_hp <= 0) {
      raidBoss.status = 'defeated';
      raidBoss.defeated_at = new Date().toISOString();
    }
    player.raid_boss_hits_today = Number(player.raid_boss_hits_today || 0) + attackCount;
    progressClanQuestMetric(getClanForPlayer(player), player, 'hits', attackCount);
    addClanBossDamage(player, damage);
    recordBattlePassEvent(player, { type: 'boss', damage, raid: true, smallPoison: effectiveWeapon.id === 'satchel' });
    awardTalentProgressV2(player, damage);
    store.persistSoon();
    const fight = { ...raidBoss, boss_id: 'heli', boss_name: raidBoss.name || 'Raid Boss' };
    sendData(response, 200, {
      raidBoss,
      fight,
      damage,
      hit: { damage, isCrit },
      playerDamageLog: { damage: contribution.damage, hits: contribution.hits },
      player: normalizePlayerProgression(player),
    });
    return;
  }

  if (url.pathname === '/boss-fights/active' && request.method === 'GET') {
    if (expireStaleBossFights(store.bossFights)) store.persistSoon(0);
    const player = getCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    const fight = store.bossFights.find((item) => item.status === 'active' && Number(item.current_hp || 0) > 0 && (item.invited_player_ids || []).map(String).includes(String(player.id)))
      || store.bossFights.find((item) => item.status === 'active' && Number(item.current_hp || 0) > 0 && String(item.opened_by_email || '').toLowerCase() === String(player.created_by || '').toLowerCase())
      || null;
    const legacyInviteAt = fight && store.chatMessages.find((message) => message.kind === 'boss_fight_invite' && String(message.bossFightInvite?.fightId || '') === String(fight.id))?.created_at;
    sendData(response, 200, fight ? { ...fight, clan_invite_sent_at: fight.clan_invite_sent_at || legacyInviteAt || null } : null);
    return;
  }

  if (url.pathname === '/boss-fights' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const fight = { id: store.generateId('fight'), ...body };
    store.bossFights.push(fight);
    sendData(response, 201, fight);
    return;
  }

  if (url.pathname === '/boss-fights/spawn' && request.method === 'POST') {
    if (expireStaleBossFights(store.bossFights)) store.persistSoon(0);
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const activeFight = store.bossFights.find((item) => isActiveBossFight(item)
      && (String(item.opened_by_email || '').toLowerCase() === String(player.created_by || '').toLowerCase()
        || (item.invited_player_ids || []).map(String).includes(String(player.id))));
    if (activeFight) {
      if (String(activeFight.opened_by_email || '').toLowerCase() === String(player.created_by || '').toLowerCase()) {
        sendData(response, 200, activeFight);
      } else {
        sendError(response, 409, 'Finish your current boss fight before starting another.', 'BOSS_FIGHT_ALREADY_ACTIVE');
      }
      return;
    }
    if (getBossEscapeCooldownRemaining(player.weapon_cooldowns) > 0) {
      sendError(response, 429, 'Boss attacks are blocked for 30 minutes after escaping.', 'BOSS_ESCAPE_COOLDOWN');
      return;
    }
    const boss = getBossById(body.bossId);
    if (!boss) {
      sendError(response, 404, 'Boss not found', 'BOSS_NOT_FOUND');
      return;
    }
    if (!getAvailableBosses(player).some((availableBoss) => availableBoss.id === boss.id)) {
      sendError(response, 403, 'Boss is not unlocked yet', 'BOSS_NOT_UNLOCKED');
      return;
    }

    const localTester = isLocalTester(player);
    const keycards = player.keycards || {};
    const requiresKey = !localTester && boss.id !== GAME_CONFIG.BOSSES[0]?.id;
    if (requiresKey && (keycards[boss.keycardLocation] || 0) < 1) {
      sendError(response, 400, 'Not enough keycards', 'NOT_ENOUGH_KEYCARDS');
      return;
    }

    if (requiresKey) {
      player.keycards = {
        ...keycards,
        [boss.keycardLocation]: keycards[boss.keycardLocation] - 1,
      };
    }

    // Weapon cooldowns belong to a fight, but an escape penalty follows the account.
    const escapeCooldownUntil = player.weapon_cooldowns?.boss_escape_until;
    player.weapon_cooldowns = escapeCooldownUntil ? { boss_escape_until: escapeCooldownUntil } : {};

    const fight = {
      id: store.generateId('fight'),
      boss_id: boss.id,
      boss_name: boss.name,
      location: boss.location,
      max_hp: boss.maxHp,
      current_hp: boss.maxHp,
      status: 'active',
      opened_by_email: player.created_by,
      started_at: new Date().toISOString(),
      ended_at: null,
    };

    store.bossFights.push(fight);
    sendData(response, 201, fight);
    return;
  }

  if (url.pathname.startsWith('/boss-fights/') && request.method === 'GET') {
    const parts = url.pathname.split('/').filter(Boolean);
    const fightId = parts[1];
    const subResource = parts[2];

    if (!subResource) {
      if (expireStaleBossFights(store.bossFights)) store.persistSoon(0);
      const fight = store.bossFights.find((item) => item.id === fightId);
      if (!fight) {
        sendError(response, 404, 'Boss fight not found', 'BOSS_FIGHT_NOT_FOUND');
        return;
      }
      sendData(response, 200, fight);
      return;
    }

    if (subResource === 'damage-logs') {
      if (parts[3] === 'me') {
        const player = getCurrentPlayer(request);
        const log = player
          ? store.bossDamageLogs.find((item) => item.fight_id === fightId && item.player_email === player.created_by) || null
          : null;
        sendData(response, 200, log);
        return;
      }

      const { limit = '100' } = getQuery(url);
      const logs = store.bossDamageLogs
        .filter((item) => item.fight_id === fightId)
        .sort((a, b) => (b.damage || 0) - (a.damage || 0))
        .slice(0, Number(limit))
        .map((item) => {
          const player = store.players.find((entry) => entry.created_by === item.player_email);
          return { ...item, player_id: player?.id || item.player_id || null, username: player?.username || '', nickname: player?.nickname || '', player_name: player?.nickname || item.player_name, clan_name: player?.clan_name || '', clan_logo_id: player?.clan_logo_id || '', battle_pass_tier: player ? normalizePlayerProgression(player).battle_pass_view?.tier || 'free' : 'free' };
        });
      sendData(response, 200, logs);
      return;
    }
  }

  if (url.pathname.startsWith('/boss-fights/') && request.method === 'PATCH') {
    if (!requireAdminToken(request, response)) return;
    const fightId = url.pathname.split('/')[2];
    const body = await readJsonBody(request);
    const fight = store.bossFights.find((item) => item.id === fightId);

    if (!fight) {
      sendError(response, 404, 'Boss fight not found', 'BOSS_FIGHT_NOT_FOUND');
      return;
    }

    Object.assign(fight, body);
    sendData(response, 200, fight);
    return;
  }

  if (url.pathname.startsWith('/boss-fights/') && request.method === 'POST') {
    const parts = url.pathname.split('/').filter(Boolean);
    const fightId = parts[1];
    const action = parts[2];

    if (action === 'join') {
      const player = ensureCurrentPlayer(request);
      if (!player) { sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED'); return; }
      const fight = store.bossFights.find((item) => String(item.id) === String(fightId));
      const clanName = String(player.clan_name || '').trim();
      const validInvite = store.chatMessages.some((message) => message.kind === 'boss_fight_invite'
        && String(message.bossFightInvite?.fightId || '') === String(fightId)
        && String(message.clan || '').trim() === clanName
        && clanName);
      if (!fight || !isActiveBossFight(fight) || !validInvite) {
        sendError(response, 403, 'No active clan invitation for this boss fight', 'BOSS_FIGHT_INVITE_REQUIRED');
        return;
      }
      const activeFight = store.bossFights.find((item) => isActiveBossFight(item)
        && (String(item.opened_by_email || '').toLowerCase() === String(player.created_by || '').toLowerCase()
          || (item.invited_player_ids || []).map(String).includes(String(player.id))));
      if (activeFight && String(activeFight.id) !== String(fight.id)) {
        sendError(response, 409, 'Finish your current boss fight before joining another.', 'BOSS_FIGHT_ALREADY_ACTIVE');
        return;
      }
      fight.invited_player_ids = [...new Set([...(fight.invited_player_ids || []).map(String), String(player.id)])];
      store.persistSoon(0);
      sendData(response, 200, fight);
      return;
    }

    if (action === 'escape') {
      const player = ensureCurrentPlayer(request);
      if (!player) {
        sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
        return;
      }
      const fight = store.bossFights.find((item) => item.id === fightId);
      if (!fight || String(fight.opened_by_email || '').toLowerCase() !== String(player.created_by || '').toLowerCase()) {
        sendError(response, 404, 'Boss fight not found', 'BOSS_FIGHT_NOT_FOUND');
        return;
      }
      if (fight.status === 'active') {
        fight.status = 'abandoned';
        fight.ended_at = new Date().toISOString();
        player.weapon_cooldowns = applyBossEscapeCooldown(player.weapon_cooldowns);
        store.persistSoon();
        queueDirtyPlayerFlush(player.id);
      }
      sendData(response, 200, { ...fight, boss_escape_cooldown_until: player.weapon_cooldowns?.boss_escape_until || null });
      return;
    }

    if (action === 'attack') {
      if (expireStaleBossFights(store.bossFights)) store.persistSoon(0);
      const player = ensureCurrentPlayer(request);
      if (!player) {
        sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
        return;
      }
      const localTester = isLocalTester(player);
      const fight = store.bossFights.find((item) => String(item.id) === String(fightId));
      if (!isActiveBossFight(fight)) {
        sendError(response, 404, 'Active boss fight not found', 'BOSS_FIGHT_NOT_FOUND');
        return;
      }
      if (player.puddle_active && !localTester) {
        sendError(response, 403, 'Ти стоїш в калюжі, за собою подивитись не можеш, а вже на боса лізеш. Спочатку приберися.', 'PUDDLE_CLEANUP_REQUIRED');
        return;
      }
      const ownsFight = String(fight.opened_by_email || '').trim().toLowerCase() === String(player.created_by || '').trim().toLowerCase();
      const joinedByClanInvite = (fight.invited_player_ids || []).map(String).includes(String(player.id));
      if (!ownsFight && !joinedByClanInvite) {
        sendError(response, 403, 'You can only attack your own or invited boss fight', 'BOSS_FIGHT_NOT_OWNED');
        return;
      }
      if (getBossEscapeCooldownRemaining(player.weapon_cooldowns) > 0) {
        sendError(response, 429, 'Boss attacks are blocked for 30 minutes after escaping.', 'BOSS_ESCAPE_COOLDOWN');
        return;
      }

      const body = await readJsonBody(request);
      Object.assign(player, migrateTalentTreeState(player));
      const weapon = getWeaponById(body.weaponId);
      if (!weapon) {
        sendError(response, 400, 'Weapon not found', 'WEAPON_NOT_FOUND');
        return;
      }

      const newbieStats = { ...(player.newbie_stats || {}) };
      if (weapon.id === 'fist' || weapon.id === 'finger') newbieStats.fist_uses = Number(newbieStats.fist_uses || 0) + 1;
      if (weapon.id === 'knuckle' || weapon.id === 'pencil') newbieStats.knuckle_uses = Number(newbieStats.knuckle_uses || 0) + 1;
      if (weapon.id === 'satchel' || weapon.id === 'small-poison') newbieStats.small_poison_uses = Number(newbieStats.small_poison_uses || 0) + 1;

      const effectiveWeapon = buildEffectiveWeapon(weapon, player);
      const poisonInventoryId = {
        satchel: 'small-poison',
        f4: 'medium-poison',
        c4: 'large-poison',
      }[effectiveWeapon.id];
      const poisonInventory = player.weapon_inventory || {};
      const usesStoredPoison = poisonInventoryId && (poisonInventory[poisonInventoryId] || 0) > 0;
      const isPoisonWeapon = Boolean(poisonInventoryId);
      const requestedMultiplier = Number(body.multiplier);
      const attackCount = isPoisonWeapon && (requestedMultiplier === 10 || requestedMultiplier === 100) ? requestedMultiplier : 1;

      if (!localTester && isPoisonWeapon && (!usesStoredPoison || Number(poisonInventory[poisonInventoryId] || 0) < attackCount)) {
        sendError(response, 400, 'Not enough poison in inventory', 'NOT_ENOUGH_POISON');
        return;
      }

      if (!localTester && effectiveWeapon.cooldownMin > 0) {
        const lastUsed = (player.weapon_cooldowns || {})[weapon.id];
        if (lastUsed && (new Date() - new Date(lastUsed)) / 60000 < effectiveWeapon.cooldownMin) {
          sendError(response, 400, 'Weapon is on cooldown', 'WEAPON_ON_COOLDOWN');
          return;
        }
      }

      if (!localTester && !usesStoredPoison && effectiveWeapon.costType === 'tentacles' && (player.tentacles || 0) < effectiveWeapon.cost) {
        sendError(response, 400, 'Not enough tentacles', 'NOT_ENOUGH_tentacles');
        return;
      }

      if (!localTester && !usesStoredPoison && effectiveWeapon.costType === 'premium' && (player.premium || 0) < effectiveWeapon.cost) {
        sendError(response, 400, 'Not enough T-Pape', 'NOT_ENOUGH_PREMIUM');
        return;
      }

      const savedPoisonUses = isPoisonWeapon && effectiveWeapon.saveChance > 0
        ? Array.from({ length: attackCount }).filter(() => Math.random() < effectiveWeapon.saveChance).length
        : 0;
      const consumedPoisonUses = attackCount - savedPoisonUses;
      const saveRollSucceeded = consumedPoisonUses === 0;

      if (!localTester && effectiveWeapon.cooldownMin > 0) {
        player.weapon_cooldowns = {
          ...(player.weapon_cooldowns || {}),
          [weapon.id]: new Date().toISOString(),
        };
      }

      // The retained baseline attack plumbing below receives an empty modifier map;
      // all v2 talent effects are applied exactly once by resolveTalentAttack.
      const resolvedTalentLevels = Number(player.talent_tree_version || 0) >= 2 ? (player.talent_levels || {}) : {};
      const talentLevels = {};
      const combatStates = player.talent_combat_state || {};
      const originalCombatState = combatStates[fight.id] || {};
      const combatState = combatStates[fight.id] || { toxicMarks: 0, lastActiveAction: null, combo: [] };
      const maxMarks = Math.min(8, 3 + Math.floor(Number(talentLevels.t35 || 0) / 2));
      const prevMarks = Math.max(0, Number(combatState.toxicMarks || 0));
      const nowMs = Date.now();
      let bleedDamage = 0;
      if (combatState.bleed && Number(combatState.bleed.expiresAt || 0) > nowMs) {
        const ticks = Math.floor((nowMs - Number(combatState.bleed.lastTickAt || nowMs)) / 10000);
        if (ticks > 0) {
          bleedDamage = ticks * Number(combatState.bleed.damage || 0);
          combatState.bleed.lastTickAt = Number(combatState.bleed.lastTickAt || nowMs) + ticks * 10000;
        }
      } else {
        delete combatState.bleed;
      }
      let damageMultiplier = 1;
      let extraFlatDamage = 0;
      const attackType = effectiveWeapon.id;
      const previousActions = Array.isArray(combatState.combo) ? combatState.combo : [];
      if (combatState.pendingHpThreshold && talentLevels.t45 > 0) {
        damageMultiplier += talentLevels.t45 * 0.01;
        combatState.pendingHpThreshold = false;
      }
      if (talentLevels.t49 > 0 && Number(player.energy || 0) < Number(player.max_energy || 100) * 0.1) {
        const lastWill = Number(combatState.lastWillAt || 0);
        if (nowMs - lastWill >= 10000) { extraFlatDamage += talentLevels.t49 * 3; combatState.lastWillAt = nowMs; }
      }
      if (talentLevels.t56 > 0 && !combatState.lastChanceUsed && (fight.current_hp || 0) < (fight.max_hp || 1) * 0.1) {
        extraFlatDamage += talentLevels.t56 * 5;
        combatState.lastChanceUsed = true;
      }
      if (previousActions.length >= 2 && previousActions.at(-1) !== previousActions.at(-2)) extraFlatDamage += Number(talentLevels.t41 || 0) * 2;
      if (attackType === 'fist' && previousActions.at(-1) === 'satchel') extraFlatDamage += Number(talentLevels.t20 || 0) * 3;
      if (attackType === 'knuckle' && previousActions.at(-1) === 'f4') extraFlatDamage += Number(talentLevels.t26 || 0) * 2;
      if (attackType === 'knuckle' && previousActions.slice(-2).join(',') === 'satchel,fist') extraFlatDamage += Number(talentLevels.t42 || 0) * 3;

      if (talentLevels.t43 > 0 && (fight.current_hp || 0) <= (fight.max_hp || 1) * 0.5) {
        damageMultiplier += talentLevels.t43 * 0.01;
      }
      if (effectiveWeapon.equipmentBossDamagePct) {
        damageMultiplier += Number(effectiveWeapon.equipmentBossDamagePct || 0);
      }
      if (isPoisonWeapon) {
        if (talentLevels.t36 > 0 && prevMarks > 0) damageMultiplier += prevMarks * talentLevels.t36 * 0.005;
        if (effectiveWeapon.id === 'c4' && talentLevels.t38 > 0 && prevMarks >= 5) {
          const key = String(fight.boss_id || '');
          const overdosedByBoss = player.overdosed_bosses || {};
          if (!overdosedByBoss[key]) {
            extraFlatDamage += talentLevels.t38 * 10;
            player.overdosed_bosses = { ...overdosedByBoss, [key]: true };
          }
        }
      }
      if (effectiveWeapon.id === 'fist' && talentLevels.t17 > 0 && prevMarks >= 3) {
        extraFlatDamage += talentLevels.t17 * 2;
      }
      if (effectiveWeapon.id === 'knuckle' && combatState.bleed) {
        extraFlatDamage += Number(talentLevels.t24 || 0);
        damageMultiplier += Number(talentLevels.t27 || 0) * 0.005;
      }
      const triggerFinalBurst = talentLevels.t40 > 0 && prevMarks >= 8 && (effectiveWeapon.id === 'fist' || effectiveWeapon.id === 'knuckle' || effectiveWeapon.id === 'c4');
      if (triggerFinalBurst) damageMultiplier += talentLevels.t40 * 0.04;

      const collMult = getCollectionDamageBonus(player);
      const fightMinutes = Math.floor((nowMs - new Date(fight.started_at || nowMs).getTime()) / 120000);
      const critChance = Math.min(1, Number(effectiveWeapon.critChance || 0) + (effectiveWeapon.id === 'knuckle' && combatState.bleed ? Number(talentLevels.t28 || 0) * 0.005 : 0) + Math.min(0.1, fightMinutes * Number(talentLevels.t57 || 0) * 0.01));
      let isCrit = critChance > 0 && Math.random() < critChance;
      const variance = 0.85 + Math.random() * 0.3;
      let damage = Math.floor(
        (effectiveWeapon.damage + extraFlatDamage) * collMult * damageMultiplier * (isCrit ? effectiveWeapon.critMultiplier : 1) * variance
      ) * attackCount;
      let poisonDamage = isPoisonWeapon ? Math.max(0, damage - bleedDamage) : 0;
      damage += bleedDamage;
      if (isPoisonWeapon) {
        const clanPoisonMultiplier = getClanPoisonMultiplier(player);
        poisonDamage = Math.floor(poisonDamage * clanPoisonMultiplier);
        damage = Math.floor(damage * clanPoisonMultiplier);
      }
      // Test-season onboarding: four large poisons can defeat the 1000-HP first boss.
      if (battlePassEnabled() && fight.boss_id === GAME_CONFIG.BOSSES[0]?.id && effectiveWeapon.id === 'c4') {
        const onboardingDamage = Math.max(damage, 250 * attackCount);
        poisonDamage += onboardingDamage - damage;
        damage = onboardingDamage;
      }

      let nextMarks = prevMarks;
      let nextChain = 0;
      if (isPoisonWeapon) {
        nextMarks = Math.min(maxMarks, prevMarks + 1);
        nextChain = 1;
        if (effectiveWeapon.id === 'satchel') player.last_poison_small = true;
        if (effectiveWeapon.id === 'f4') player.last_poison_medium = true;
      } else if (effectiveWeapon.id === 'fist') {
        nextChain = (player.toxic_combo_chain || 0) >= 1 ? 2 : 0;
      }
      if (effectiveWeapon.id === 'fist' || effectiveWeapon.id === 'knuckle') {
        if (triggerFinalBurst) nextMarks = Math.max(0, prevMarks - 8);
        player.last_poison_small = false;
        player.last_poison_medium = false;
      }
      if (effectiveWeapon.id === 'knuckle') {
        const durationMs = 30000 * (1 + Number(talentLevels.t23 || 0) * 0.03) + (combatState.bleed ? Number(talentLevels.t25 || 0) * 500 : 0);
        combatState.bleed = { damage: 5 + Number(talentLevels.t07 || 0) + Number(talentLevels.t22 || 0), lastTickAt: nowMs, expiresAt: nowMs + durationMs };
      }
      player.toxic_marks = nextMarks;
      player.toxic_combo_chain = nextChain;
      player.talent_combat_state = { ...combatStates, [fight.id]: { ...combatState, toxicMarks: nextMarks } };
      player.talent_combat_state[fight.id].combo = [...previousActions, attackType].slice(-3);
      player.talent_combat_state[fight.id].lastActiveAction = attackType;
      // The talent combat service is authoritative. The legacy-compatible block above
      // remains only for non-v2 profiles while their saved state is migrated.
      if (Number(player.talent_tree_version || 0) >= 2) {
        let talentCombat = null;
        let talentDamage = 0;
        let talentPoisonDamage = 0;
        let runtimeState = originalCombatState;
        for (let index = 0; index < attackCount; index += 1) {
          talentCombat = resolveTalentAttack({ weapon: effectiveWeapon, levels: resolvedTalentLevels, state: runtimeState, fight, player, now: nowMs + index });
          runtimeState = talentCombat.state;
          talentDamage += talentCombat.damage + talentCombat.bleedDamage + talentCombat.repeatDamage;
          if (isPoisonWeapon) talentPoisonDamage += talentCombat.damage + talentCombat.repeatDamage;
        }
        isCrit = Boolean(talentCombat?.isCrit);
        damage = Math.max(1, Math.floor(talentDamage * getCollectionDamageBonus(player) * (1 + Number(effectiveWeapon.equipmentBossDamagePct || 0))));
        poisonDamage = isPoisonWeapon
          ? Math.min(damage, Math.floor(talentPoisonDamage * getCollectionDamageBonus(player) * (1 + Number(effectiveWeapon.equipmentBossDamagePct || 0))))
          : 0;
        player.talent_combat_state = { ...combatStates, [fight.id]: talentCombat.state };
        player.toxic_marks = Number(talentCombat.state.toxicMarks || 0);
        if (talentCombat.isCrit && Number(resolvedTalentLevels.t48 || 0) > 0 && Math.random() < Number(resolvedTalentLevels.t48) * .02) {
          refundCombatEnergy(player, 10);
        }
      }
      // Consumables are removed only after the successful damage calculation.
      if (usesStoredPoison && !saveRollSucceeded) {
        if (!localTester) player.weapon_inventory = { ...poisonInventory, [poisonInventoryId]: Math.max(0, Number(poisonInventory[poisonInventoryId] || 0) - consumedPoisonUses) };
      }
      if (!localTester && !usesStoredPoison && effectiveWeapon.costType === 'tentacles' && !saveRollSucceeded) player.tentacles = Number(player.tentacles || 0) - Number(effectiveWeapon.cost || 0);
      if (!localTester && !usesStoredPoison && effectiveWeapon.costType === 'premium' && !saveRollSucceeded) player.premium = Number(player.premium || 0) - Number(effectiveWeapon.cost || 0);
      player.newbie_stats = newbieStats;
      if (isPoisonWeapon) player.poison_found_today = Number(player.poison_found_today || 0) + 1;
      const endedAt = new Date().toISOString();
      const impacts = getClanDamageFightTargets({
        attacker: player,
        sourceFight: fight,
        fights: store.bossFights,
        players: store.players,
      })
        .filter(isActiveBossFight)
        .map((targetFight) => applyDamageToPersonalBossFight(targetFight, player, damage, attackCount, endedAt, {
          poisonType: poisonInventoryId ? poisonInventoryId.replace('-poison', '') : '',
          poisonDamage,
          plannedPoisonDamage: poisonDamage,
          consumedPoisonUses,
          attackCount,
        }));
      const sourceImpact = impacts.find((impact) => impact.fight.id === fight.id);
      const thresholds = [0.75, 0.5, 0.25];
      const previousHp = Number(sourceImpact?.hpBefore ?? fight.current_hp ?? 0);
      const crossedThreshold = thresholds.find((threshold) => previousHp > Number(fight.max_hp || 1) * threshold && Number(fight.current_hp || 0) <= Number(fight.max_hp || 1) * threshold && !(combatState.crossedHpThresholds || []).includes(threshold));
      if (crossedThreshold !== undefined && Number(player.talent_tree_version || 0) < 2) {
        combatState.crossedHpThresholds = [...(combatState.crossedHpThresholds || []), crossedThreshold];
        combatState.pendingHpThreshold = true;
        player.talent_combat_state[fight.id] = { ...combatState, toxicMarks: nextMarks };
      }
      if (Number(player.talent_tree_version || 0) >= 2) {
        player.talent_combat_state = {
          ...player.talent_combat_state,
          [fight.id]: registerHpThresholds(player.talent_combat_state?.[fight.id], previousHp, Number(fight.current_hp || 0), Number(fight.max_hp || 1)),
        };
      }
      const playerLog = sourceImpact?.damageLog || null;
      const isDead = Boolean(sourceImpact?.defeated);
      const clanAssists = impacts
        .filter((impact) => impact.fight.id !== fight.id)
        .map((impact) => {
          const owner = getBossFightOwner(impact.fight);
          return {
            fightId: impact.fight.id,
            bossId: impact.fight.boss_id,
            player_id: owner?.id || null,
            player_name: owner?.username || owner?.nickname || '',
            damage: impact.appliedDamage,
            current_hp: impact.fight.current_hp,
            max_hp: impact.fight.max_hp,
            status: impact.fight.status,
            defeated: impact.defeated,
          };
        });

      player.boss_hits_today = (player.boss_hits_today || 0) + attackCount;
      progressClanQuestMetric(getClanForPlayer(player), player, 'hits', attackCount);
      const actualDamage = Number(sourceImpact?.appliedDamage || 0);
      player.boss_damage_today = (player.boss_damage_today || 0) + actualDamage;
      player.boss_damage_lifetime = (player.boss_damage_lifetime || 0) + actualDamage;
      addClanBossDamage(player, actualDamage);
      if (isCrit && resolvedTalentLevels.t48 > 0 && Math.random() < resolvedTalentLevels.t48 * 0.005) {
        refundCombatEnergy(player, 1);
      }
      recordBattlePassEvent(player, { type: 'boss', damage: actualDamage, smallPoison: effectiveWeapon.id === 'satchel' });
      awardTalentProgressV2(player, actualDamage);

      let rewardSummary = null;
      const xpGranted = isDead ? 50 : isCrit ? 10 : 4;
      grantXpToPlayer(player, xpGranted);

      for (const impact of impacts) {
        if (!impact.defeated) continue;
        const isSourceFight = impact.fight.id === fight.id;
        const owner = getBossFightOwner(impact.fight);
        const summary = settlePersonalBossFightDefeat({ fight: impact.fight });
        if (isSourceFight) {
          rewardSummary = summary;
        } else if (summary) {
          // A teammate's personal victory grants their progression, not the helper's.
          grantXpToPlayer(owner, 50);
        }
      }

      const attackResponse = {
        fight,
        playerDamageLog: playerLog,
        hit: {
          damage: actualDamage,
          isCrit,
          icon: effectiveWeapon.icon,
        },
        rewardSummary,
        clanAssists,
        xpGranted,
        xpApplied: true,
        player: normalizePlayerProgression(player),
      };
      // Return the resolved hit immediately so HP and damage react without
      // waiting for two database upserts. Persistence continues in background.
      sendData(response, 200, attackResponse);
      void playerDb.flushDirtyPlayers().catch((error) => {
        console.error('[boss-attack] background player flush failed', error);
      });
      return;
    }
  }

  if (url.pathname === '/boss-damage-logs' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const log = { id: store.generateId('damage'), ...body };
    store.bossDamageLogs.push(log);
    sendData(response, 201, log);
    return;
  }

  if (url.pathname.startsWith('/boss-damage-logs/') && request.method === 'PATCH') {
    if (!requireAdminToken(request, response)) return;
    const logId = url.pathname.split('/')[2];
    const body = await readJsonBody(request);
    const log = store.bossDamageLogs.find((item) => item.id === logId);

    if (!log) {
      sendError(response, 404, 'Boss damage log not found', 'BOSS_DAMAGE_LOG_NOT_FOUND');
      return;
    }

    Object.assign(log, body);
    sendData(response, 200, log);
    return;
  }

  if (url.pathname === '/attack-logs' && request.method === 'GET') {
    const { defenderEmail, limit = '20' } = getQuery(url);
    const logs = store.attackLogs
      .filter((item) => !defenderEmail || item.defender_email === defenderEmail)
      .slice(0, Number(limit));
    sendData(response, 200, logs);
    return;
  }

  if (url.pathname === '/attack-logs' && request.method === 'POST') {
    if (!requireAdminToken(request, response)) return;
    const body = await readJsonBody(request);
    const log = {
      id: store.generateId('attack'),
      created_date: new Date().toISOString(),
      ...body,
    };
    store.attackLogs.unshift(log);
    sendData(response, 201, log);
    return;
  }

  if (url.pathname === '/loot/claim' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const instanceId = body.instanceId || null;

    // A lost response must not turn an already granted box into an empty modal.
    // Receipts are scoped to the authenticated player and replayed without
    // granting the drops a second time.
    const priorReceipt = instanceId && (player.loot_claim_receipts || []).find((entry) => entry.instanceId === instanceId);
    if (priorReceipt) {
      sendData(response, 200, {
        drops: priorReceipt.drops,
        xpGranted: priorReceipt.xpGranted,
        xpApplied: true,
        replayed: true,
        player: normalizePlayerProgression(player),
      });
      return;
    }

    const pendingBox = instanceId
      ? (player.pending_boss_boxes || []).find((entry) => entry?.instanceId === instanceId)
      : null;
    if (!pendingBox) {
      sendError(response, 404, 'Box not found', 'BOX_NOT_FOUND');
      return;
    }

    const boxType = pendingBox.boxType;
    const bossId = pendingBox.bossId || null;
    const fightId = pendingBox.fightId || null;

    if (!boxType) {
      sendError(response, 400, 'Missing box type', 'BOX_TYPE_REQUIRED');
      return;
    }

    const claimKey = `${player.id}:${fightId || 'no-fight'}:${boxType}:${bossId || 'none'}:${instanceId || 'default'}`;
    if (store.claimedLoot.includes(claimKey)) {
      sendError(response, 409, 'Loot already claimed', 'LOOT_ALREADY_CLAIMED');
      return;
    }

    const rewardBoxTypes = Array.isArray(pendingBox?.rewardBoxTypes) && pendingBox.rewardBoxTypes.length ? pendingBox.rewardBoxTypes : [boxType];
    const drops = (pendingBox?.rewardFormula === 'boss_v2' || pendingBox?.rewardFormula === 'raid_rank_v1')
      ? (Array.isArray(pendingBox.rewardSnapshot) ? pendingBox.rewardSnapshot : [])
      : pendingBox?.rewardFormula === 'damage_v1'
      ? [
        ...rollBossDamageReward({ damage: pendingBox.damage, bossId: pendingBox.bossId || bossId, maxHp: pendingBox.maxHp }),
        ...(Array.isArray(pendingBox?.bonusDrops) ? pendingBox.bonusDrops : []),
      ]
      : [
        ...rewardBoxTypes.flatMap((rewardBoxType) => openBox(rewardBoxType, bossId, store.lootBoxTables)),
        ...(Array.isArray(pendingBox?.bonusDrops) ? pendingBox.bonusDrops : []),
      ];
    const normalizedDrops = stripRetiredBossFragments(limitBossBoxEquipment(drops.map((drop) => {
      if (drop?.type === 'boss_gear_piece') return resolveBossEquipmentDrop(player, drop.bossId || bossId);
      if (drop?.type === 'boss_pet') return resolveBossPetDrop(player, drop.bossId || bossId);
      if (drop?.type === 'boss_background') return resolveBossBackgroundDrop(player, drop.bossId || bossId);
      return drop;
    }).filter(Boolean)));
    let xpGranted = 0;
    player.opened_boxes_total = (player.opened_boxes_total || 0) + 1;
    recordBattlePassEvent(player, { type: 'box' });
    recordBattlePassEvent(player, { type: 'earnedDm', source: 'reward', amount: normalizedDrops.filter((drop) => drop.type === 'tentacles').reduce((sum, drop) => sum + Number(drop.qty || 0), 0) });
    if (instanceId) {
      player.pending_boss_boxes = (player.pending_boss_boxes || []).filter((entry) => entry?.instanceId !== instanceId);
    }
    for (const drop of normalizedDrops) {
      if (drop.type === 'tentacles') {
        player.tentacles = (player.tentacles || 0) + drop.qty;
      }

      if (drop.type === 'xp') {
        xpGranted += drop.qty;
      }

      if (drop.type === 'weapon' && drop.id) {
        const weaponKey = drop.id === 'satchel' ? 'small-poison' : drop.id === 'c4' ? 'large-poison' : 'medium-poison';
        player.weapon_inventory = {
          ...(player.weapon_inventory || {}),
          [weaponKey]: ((player.weapon_inventory || {})[weaponKey] || 0) + (drop.qty || 1),
        };
      }

      if (drop.type === 'collection_item') {
        const existing = player.collection_items || [];
        if (!existing.includes(drop.id)) {
          player.collection_items = [...existing, drop.id];
        }
      }

      if (drop.type === 'energy') {
        grantEnergyGain(player, drop.qty, 'boss_box');
      }

      if (drop.type === 'spin') player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + Number(drop.qty || 0);

      if (drop.type === 'premium') {
        player.premium = (player.premium || 0) + drop.qty;
      }

      if (drop.type === 'strength') {
        player.stat_strength = (player.stat_strength || 1) + drop.qty;
      }

      if (drop.type === 'keycard' && drop.location) {
        player.keycards = {
          ...(player.keycards || {}),
          [drop.location]: ((player.keycards || {})[drop.location] || 0) + drop.qty,
        };
      }

      if (drop.type === 'poison') {
        player.weapon_inventory = {
          ...(player.weapon_inventory || {}),
          'small-poison': ((player.weapon_inventory || {})['small-poison'] || 0) + drop.qty,
        };
      }

      if (drop.type === 'background' && drop.backgroundId) {
        player.unlocked_backgrounds = Array.from(new Set([
          'garage',
          ...(player.unlocked_backgrounds || []),
          drop.backgroundId,
        ]));
      }

      if (drop.type === 'pet_shard') {
        const field = 'boss_pet_shards';
        player[field] = {
          ...(player[field] || {}),
          [bossId || 'generic']: ((player[field] || {})[bossId || 'generic'] || 0) + drop.qty,
        };
      }

      if (['rare_gear', 'epic_gear', 'legendary_gear'].includes(drop.type)) {
        player.inventory_items = [
          ...(player.inventory_items || []),
          {
            id: `${drop.type}-${bossId || 'boss'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'custom',
            name: drop.name,
            icon: '',
            rarity: drop.type.replace('_gear', ''),
          },
        ];
      }

      if (drop.type === 'equipment' && drop.itemId) {
        const existingItem = (player.inventory_items || []).find((entry) => entry?.id === drop.itemId);
        if (existingItem) {
          const salvageQty = randInt(250, 500);
          player.tentacles = (player.tentacles || 0) + salvageQty;
          drop.type = 'tentacles';
          drop.name = 'tentacles fallback';
          drop.qty = salvageQty;
          delete drop.itemId;
        } else {
          const slot = String(drop.itemId).split('_').pop() || 'weapon';
          player.inventory_items = [
            ...(player.inventory_items || []),
            { id: drop.itemId, type: 'equipment', slot, bossId, quality: drop.quality || 'boss_gear_piece', count: 1 },
          ];
          drop.qty = 1;
        }
      }
      if (drop.type === 'pet' && drop.petId) {
        const existingPet = (player.inventory_items || []).find((entry) => entry?.slot === 'pet' && entry?.id === drop.petId);
        if (existingPet) {
          const salvageQty = randInt(250, 500);
          player.tentacles = (player.tentacles || 0) + salvageQty;
          drop.type = 'tentacles';
          drop.name = 'tentacles fallback';
          drop.qty = salvageQty;
          delete drop.petId;
        } else {
          player.inventory_items = [
            ...(player.inventory_items || []),
            { id: drop.petId, type: 'equipment', slot: 'pet', bossId, count: 1 },
          ];
          drop.qty = 1;
        }
      }
    }

    if (xpGranted > 0) {
      grantXpToPlayer(player, xpGranted);
    }

    const mergedDrops = Array.from(
      normalizedDrops.reduce((map, drop) => {
        const key = drop.type === 'equipment'
          ? ['equipment', drop.itemId || drop.item?.id || drop.name || 'item'].join('::')
          : drop.type === 'pet'
            ? ['pet', drop.petId || drop.item?.id || drop.name || 'pet'].join('::')
          : [drop.type, drop.location || '', drop.id || '', drop.item?.id || ''].join('::');

        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...drop });
          return map;
        }

        existing.qty = (existing.qty || 0) + (drop.qty || 0);
        return map;
      }, new Map()).values(),
    );

    store.claimedLoot.push(claimKey);
    if (instanceId) {
      player.loot_claim_receipts = [
        ...(player.loot_claim_receipts || []).filter((entry) => entry.instanceId !== instanceId),
        { instanceId, drops: mergedDrops, xpGranted },
      ].slice(-30);
    }
    console.log('[loot] reward granted', {
      playerId: player.id,
      boxType,
      bossId,
      fightId,
      instanceId,
      xpGranted,
      drops: mergedDrops.map((drop) => ({ type: drop.type, qty: drop.qty, id: drop.id || drop.itemId || drop.petId || null })),
    });
    sendData(response, 200, {
      drops: mergedDrops,
      xpGranted,
      xpApplied: true,
      player: normalizePlayerProgression(player),
    });
    return;
  }

  if (url.pathname === '/raids/resolve' && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const target = store.players.find((item) => item.id === body.targetId);

    if (!target) {
      sendError(response, 404, 'Raid target not found', 'RAID_TARGET_NOT_FOUND');
      return;
    }

    if (target.id === player.id) {
      sendError(response, 400, 'Cannot raid yourself', 'INVALID_RAID_TARGET');
      return;
    }

    const isRevenge = Boolean(body.isRevenge);
    if (!canSpendTutorialEnergyOnMission(player, null)) {
      sendError(response, 403, 'During the newbie tutorial, energy can only be spent on the highlighted first-planet quest', 'TUTORIAL_ENERGY_RESTRICTED');
      return;
    }
    if ((player.energy || 0) < GAME_CONFIG.RAID_ENERGY_COST) {
      sendError(response, 400, 'Not enough energy for raid', 'NOT_ENOUGH_ENERGY');
      return;
    }

    player.energy = Math.max(0, (player.energy || 0) - GAME_CONFIG.RAID_ENERGY_COST);
    player.last_energy_update = new Date().toISOString();
    player.raid_boss_hits_today = Number(player.raid_boss_hits_today || 0) + 1;
    console.log('[energy] updated', {
      source: 'raid_spend',
      playerId: player.id,
      currentEnergy: player.energy,
      regenCap: Number(player.max_energy || GAME_CONFIG.MAX_ENERGY_BASE),
    });

    const success = Math.random() < calculateRaidSuccess(player.attack_power, target.defense_power || 5, isRevenge);

    if (success) {
      const stolen = calculateStealAmount(target.tentacles || 0, target.defense_level || 1);

      player.tentacles = (player.tentacles || 0) + stolen;
      player.total_raids = (player.total_raids || 0) + 1;
      player.successful_raids = (player.successful_raids || 0) + 1;
      player.total_stolen = (player.total_stolen || 0) + stolen;

      target.tentacles = Math.max(0, (target.tentacles || 0) - stolen);
      target.total_lost = (target.total_lost || 0) + stolen;

      const log = {
        id: store.generateId('attack'),
        attacker_email: player.created_by,
        attacker_name: player.username,
        defender_email: target.created_by,
        defender_name: target.username,
        success: true,
        amount_stolen: stolen,
        is_revenge: isRevenge,
        seen: false,
        created_date: new Date().toISOString(),
      };
      store.attackLogs.unshift(log);

      grantXpToPlayer(player, 30);
      sendData(response, 200, {
        success: true,
        amount: stolen,
        penalty: 0,
        xp: 30,
        xpApplied: true,
        targetName: target.username,
        attacker: normalizePlayerProgression(player),
        defender: normalizePlayerProgression(target),
      });
      return;
    }

    const penalty = GAME_CONFIG.RAID_FAIL_PENALTY;
    player.tentacles = Math.max(0, (player.tentacles || 0) - penalty);
    player.total_raids = (player.total_raids || 0) + 1;

    const failLog = {
      id: store.generateId('attack'),
      attacker_email: player.created_by,
      attacker_name: player.username,
      defender_email: target.created_by,
      defender_name: target.username,
      success: false,
      amount_stolen: 0,
      is_revenge: isRevenge,
      seen: false,
      created_date: new Date().toISOString(),
    };
    store.attackLogs.unshift(failLog);

    grantXpToPlayer(player, 5);
    sendData(response, 200, {
      success: false,
      amount: 0,
      penalty,
      xp: 5,
      xpApplied: true,
      targetName: target.username,
      attacker: normalizePlayerProgression(player),
      defender: normalizePlayerProgression(target),
    });
    return;
  }

  if ((url.pathname === '/shop/config' || url.pathname === '/api/shop/config') && request.method === 'GET') {
    sendData(response, 200, getShopCatalog());
    return;
  }

  if ((url.pathname === '/payments/rates' || url.pathname === '/api/payments/rates') && request.method === 'GET') {
    try {
      sendData(response, 200, await paymentRates.getRates());
    } catch {
      sendError(response, 503, 'Payment rates unavailable', 'PAYMENT_RATES_UNAVAILABLE');
    }
    return;
  }

  if ((url.pathname === '/payments/catalog' || url.pathname === '/api/payments/catalog') && request.method === 'GET') {
    sendData(response, 200, getShopCatalog());
    return;
  }

  if ((url.pathname === '/newbie-packs' || url.pathname === '/api/newbie-packs') && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    const offers = syncNewbiePackOffers(player);
    store.persistSoon();
    sendData(response, 200, { offers });
    return;
  }

  if ((url.pathname === '/payments/purchase' || url.pathname === '/api/payments/purchase') && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const itemId = String(body.itemId || '').trim();
    const paymentMethod = String(body.paymentMethod || '').trim().toLowerCase();

    if (!itemId || !paymentMethod) {
      sendError(response, 400, 'itemId and paymentMethod are required', 'PAYMENT_REQUEST_INVALID');
      return;
    }
    if (browserSession && !request.headers['x-telegram-init-data'] && paymentMethod !== 'near') {
      sendError(response, 400, 'Web purchases use NEAR', 'PAYMENT_METHOD_UNSUPPORTED'); return;
    }

    try {
      if (itemId.startsWith('newbie_pack_')) {
        assertNewbiePackPurchasable(player, itemId);
        store.persistSoon();
      }
      const order = await paymentService.purchase({
        itemId,
        userId: player.id,
        paymentMethod,
      });

      if (paymentMethod === 'telegram_stars') {
        const item = findShopPackById(itemId);
        const invoiceLink = await starsPayment.createInvoiceLink({
          order,
          item,
          title: item?.title || itemId,
          description: `${item?.title || itemId} purchase`,
        });
        await paymentDb.updateTransaction(order.id, {
          payment_payload: {
            ...(order.payment_payload || {}),
            invoiceLink,
          },
        });
        sendData(response, 201, {
          order: {
            ...order,
            payment_payload: {
              ...(order.payment_payload || {}),
              invoiceLink,
            },
          },
          invoiceLink,
        });
        return;
      }

      sendData(response, 201, { order });
    } catch (error) {
      sendError(response, 400, error.message || 'Failed to create payment order', error.code || 'PAYMENT_ORDER_FAILED');
    }
    return;
  }

  if ((url.pathname === '/payments/orders' || url.pathname === '/api/payments/orders') && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const { limit = '50' } = getQuery(url);
    const rows = await paymentDb.listTransactionsByUser(player.id, Number(limit));
    sendData(response, 200, rows);
    return;
  }

  if ((url.pathname.startsWith('/payments/orders/') || url.pathname.startsWith('/api/payments/orders/')) && request.method === 'GET') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const orderId = parts[parts.length - 1];
    const order = await paymentDb.findTransactionById(orderId);
    if (!order || String(order.user_id || '') !== String(player.id || '')) {
      sendError(response, 404, 'Payment order not found', 'PAYMENT_ORDER_NOT_FOUND');
      return;
    }
    sendData(response, 200, order);
    return;
  }

  if ((url.pathname === '/payments/confirm' || url.pathname === '/api/payments/confirm') && request.method === 'POST') {
    const player = ensureCurrentPlayer(request);
    if (!player) {
      sendError(response, 401, 'Player session not found', 'AUTH_REQUIRED');
      return;
    }

    const body = await readJsonBody(request);
    const orderId = String(body.orderId || '').trim();
    const paymentMethod = String(body.paymentMethod || '').trim().toLowerCase();
    if (browserSession && !request.headers['x-telegram-init-data'] && paymentMethod !== 'near') {
      sendError(response, 400, 'Web purchases use NEAR', 'PAYMENT_METHOD_UNSUPPORTED'); return;
    }
    const order = await paymentDb.findTransactionById(orderId);
    if (!order || String(order.user_id || '') !== String(player.id || '')) {
      sendError(response, 404, 'Payment order not found', 'PAYMENT_ORDER_NOT_FOUND');
      return;
    }

    try {
      if (paymentMethod !== order.payment_method) { sendError(response, 400, 'Payment method does not match order', 'PAYMENT_METHOD_MISMATCH'); return; }
      if (paymentMethod === 'ton') {
        const verified = await tonPayment.verifyTonTransaction({
          order,
          receiver: TON_RECEIVER,
          expectedNanoAmount: order.tonAmountNano || order.ton_amount_nano,
          orderComment: order.payment_payload?.ton?.comment || `order:${order.id}:${order.item_id}`,
          txHash: String(body.txHash || body.boc || '').trim(),
          senderAddress: String(body.senderAddress || body.sender || '').trim(),
        });
        const result = await paymentService.confirmTonPayment({
          orderId: order.id,
          txHash: verified.txHash,
          // Ledger verification above compares the exact nanoTON value.
          // The payment service stores the human-readable locked amount.
          amount: order.ton_amount_locked,
          recipient: verified.recipient,
          confirmed: verified.confirmed,
        });
        sendData(response, 200, {
          order: result,
          player: normalizePlayerProgression(player),
        });
        return;
      }

      if (paymentMethod === 'near') {
        const verified = await nearPayment.verifyNearTransaction({
          txHash: String(body.txHash || '').trim(),
          senderAccountId: String(body.senderAccountId || body.sender || '').trim(),
          receiverAccountId: NEAR_RECEIVER,
          expectedYoctoAmount: order.nearAmountYocto || order.near_amount_yocto,
          network: serverConfig.nearNetwork,
        });
        if (!verified.confirmed) { sendError(response, 400, 'NEAR transfer does not match this order or is not final', 'NEAR_PAYMENT_NOT_CONFIRMED'); return; }
        const result = await paymentService.confirmNearPayment({
          orderId: order.id,
          txHash: verified.txHash,
          // Ledger verification above compares the exact yoctoNEAR value.
          amount: order.near_amount_locked,
          recipient: verified.recipient,
          senderAccountId: verified.senderAccountId,
          confirmed: verified.confirmed,
        });
        sendData(response, 200, {
          order: result,
          player: normalizePlayerProgression(player),
        });
        return;
      }

      if (paymentMethod === 'telegram_stars') {
        const result = await paymentService.confirmStarsPayment({
          orderId: order.id,
          telegramPaymentChargeId: String(body.telegramPaymentChargeId || body.txHash || '').trim(),
          amount: Number(body.amount || body.totalAmount || order.starsAmountLocked || order.stars_amount_locked || 0),
          currency: String(body.currency || 'XTR').trim(),
          confirmed: body.confirmed !== false,
        });
        sendData(response, 200, {
          order: result,
          player: normalizePlayerProgression(player),
        });
        return;
      }

      sendError(response, 400, 'Unsupported payment method', 'PAYMENT_METHOD_UNSUPPORTED');
    } catch (error) {
      sendError(response, 400, error.message || 'Failed to confirm payment', error.code || 'PAYMENT_CONFIRM_FAILED');
    }
    return;
  }

  if ((url.pathname === '/telegram/webhook' || url.pathname === '/api/telegram/webhook') && request.method === 'POST') {
    const secret = String(serverConfig.telegramWebhookSecret || '').trim();
    if (!secret) {
      sendError(response, 503, 'Webhook is not configured', 'TELEGRAM_WEBHOOK_DISABLED');
      return;
    }
    if (secret) {
      const provided = String(request.headers['x-telegram-bot-api-secret-token'] || '').trim();
      if (provided !== secret) {
        sendError(response, 401, 'Invalid webhook secret', 'TELEGRAM_WEBHOOK_SECRET_INVALID');
        return;
      }
    }

    const update = await readJsonBody(request);
    try {
      if (update?.pre_checkout_query) {
        const query = update.pre_checkout_query;
        const order = await paymentDb.findTransactionById(String(query.invoice_payload || '').trim());
        if (!order || order.status !== 'pending' || Number(query.total_amount || 0) !== Number(order.stars_amount_locked || 0) || String(query.currency || '').trim() !== 'XTR') {
          await starsPayment.answerPreCheckoutQuery({
            preCheckoutQueryId: query.id,
            ok: false,
            errorMessage: 'Order validation failed',
          });
        } else {
          const item = findShopPackById(order.item_id);
          const orderPlayer = store.players.find((candidate) => String(candidate.id || '') === String(order.user_id || ''));
          if (String(item?.id || '').startsWith('newbie_pack_')) {
            try {
              assertNewbiePackPurchasable(orderPlayer, item.id);
            } catch {
              await starsPayment.answerPreCheckoutQuery({ preCheckoutQueryId: query.id, ok: false, errorMessage: 'This offer is no longer available' });
              sendData(response, 200, { ok: true });
              return;
            }
          }
          await starsPayment.answerPreCheckoutQuery({
            preCheckoutQueryId: query.id,
            ok: true,
          });
        }
        sendData(response, 200, { ok: true });
        return;
      }

      if (update?.message?.successful_payment) {
        const payment = update.message.successful_payment;
        const order = await paymentDb.findTransactionById(String(payment.invoice_payload || '').trim());
        if (!order) {
          sendError(response, 404, 'Payment order not found', 'PAYMENT_ORDER_NOT_FOUND');
          return;
        }
        const result = await paymentService.confirmStarsPayment({
          orderId: order.id,
          telegramPaymentChargeId: String(payment.telegram_payment_charge_id || '').trim(),
          amount: Number(payment.total_amount || 0),
          currency: String(payment.currency || 'XTR').trim(),
          confirmed: true,
        });
        sendData(response, 200, result);
        return;
      }

      sendData(response, 200, { ok: true });
    } catch (error) {
      sendError(response, 400, error.message || 'Webhook handling failed', error.code || 'TELEGRAM_WEBHOOK_FAILED');
    }
    return;
  }

  if (url.pathname.startsWith('/attack-logs/') && request.method === 'PATCH') {
    if (!requireAdminToken(request, response)) return;
    const logId = url.pathname.split('/')[2];
    const body = await readJsonBody(request);
    const log = store.attackLogs.find((item) => item.id === logId);

    if (!log) {
      sendError(response, 404, 'Attack log not found', 'ATTACK_LOG_NOT_FOUND');
      return;
    }

    Object.assign(log, body);
    sendData(response, 200, log);
    return;
  }

  if (['GET', 'HEAD'].includes(request.method) && tryServeStatic(url.pathname, response, request)) {
    return;
  }

  shouldPersistGlobalState = false;
  sendError(response, 404, `Route ${request.method} ${url.pathname} not found`, 'ROUTE_NOT_FOUND');
  } catch (error) {
    const message = error?.message || 'Internal server error';
    response.diagnosticMessage = `${error?.name || 'Error'}: ${message}`;
    console.error('[api] request failed', {
      method: request.method,
      endpoint: url.pathname,
      name: error?.name || 'Error',
      message,
      stack: error?.stack,
    });
    const isStorageError = message.includes('Persistent storage');
    if (isStorageError) {
      sendJson(response, 503, {
        error: 'storage_unavailable',
        message: 'Storage unavailable',
      });
      return;
    }
    sendError(response, error.statusCode || 500, error.statusCode ? message : 'Internal server error', error.code || 'INTERNAL_SERVER_ERROR');
  } finally {
    if (storeReady) {
      // Keep the request response independent of the global SQL flush queue.
      // A slow write for another player must not make every Go/Claim wait.
      if (!dirtyPlayerFlushQueued) {
        void playerDb.flushDirtyPlayers().catch((error) => {
          console.error('[sql] player flush failed', {
            message: error?.message || 'unknown_error',
          });
        });
      }
      if (shouldPersistImmediately && shouldPersistGlobalState && IS_PRODUCTION) {
        try {
          await store.persistNow();
          console.info('[mutation]', {
            method: request.method,
            endpoint: url.pathname,
            persist: 'persistNow.completed',
          });
        } catch (error) {
          console.error('[mutation]', {
            method: request.method,
            endpoint: url.pathname,
            persist: 'persistNow.failed',
            message: error?.message || 'unknown_error',
          });
        }
      } else if (shouldPersistImmediately && shouldPersistGlobalState) {
        store.persistSoon(200);
      }
    }
  }
}

export function createApp() {
  return http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      console.error('Server error:', error);
      sendError(response, 500, error.message || 'Internal server error', 'INTERNAL_SERVER_ERROR');
    });
  });
}

