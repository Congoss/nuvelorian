import i18n from '@/i18n';
import { localizeApiError } from '@/lib/apiErrorTranslations';
import { rateLimitedFetch } from '@/lib/rateLimitedFetch.js';
import { syncServerClock } from '@/lib/serverClock.js';
import { platformConfig } from '@/lib/platform/config';
import { getTelegramSession } from '@/lib/platform/telegram';
import { reportClientDiagnostic } from '@/lib/diagnosticReporter';

function setBootDebug(patch = {}) {
  if (typeof window === 'undefined') return;
  const current = window.__tgBootDebug || {};
  window.__tgBootDebug = { ...current, ...patch };
}

function ensureApiBaseUrl() {
  const baseUrl = String(platformConfig.apiBaseUrl || '').trim();

  if (!baseUrl) {
    const error = new Error('VITE_API_BASE_URL is required for remoteGameApi.');
    error.code = 'REMOTE_GAME_API_MISSING_BASE_URL';
    throw error;
  }

  return baseUrl.replace(/\/+$/, '');
}

function buildHeaders(extraHeaders = {}) {
  const telegramSession = getTelegramSession();
  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (telegramSession?.initData) {
    headers['X-Telegram-Init-Data'] = telegramSession.initData;
  }

  if (telegramSession?.telegramId) {
    headers['X-Telegram-User-Id'] = String(telegramSession.telegramId);
  }

  if (telegramSession?.username) {
    headers['X-Telegram-Username'] = telegramSession.username;
  }

  if (telegramSession?.photoUrl) {
    headers['X-Telegram-Photo-Url'] = telegramSession.photoUrl;
  }

  if (telegramSession?.startParam) {
    headers['X-Telegram-Start-Param'] = telegramSession.startParam;
  }

  if (telegramSession?.source === 'mock') {
    headers['X-Telegram-Mock-User'] = 'true';
  }

  return headers;
}

function normalizePayload(payload) {
  if (payload === undefined) return undefined;
  return JSON.stringify(payload);
}

function extractResponseData(result) {
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data;
  }

  return result;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    if (typeof value === 'object') {
      searchParams.set(key, JSON.stringify(value));
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function remoteRequest(path, { method = 'GET', query, body } = {}) {
  const baseUrl = ensureApiBaseUrl();
  const url = `${baseUrl}${path}${buildQuery(query)}`;
  const hasBody = body !== undefined;

  let response;
  try {
    response = await rateLimitedFetch(url, {
      method,
      cache: 'no-store',
      headers: buildHeaders(hasBody ? { 'Content-Type': 'application/json' } : undefined),
      body: hasBody ? normalizePayload(body) : undefined,
    });
  } catch (error) {
    reportClientDiagnostic('NETWORK_ERROR', error, path);
    throw error;
  }

  syncServerClock(response);
  let parsed;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    parsed = await response.json();
  } else {
    const text = await response.text();
    parsed = text ? { message: text } : null;
  }

  if (!response.ok) {
    setBootDebug({
      bootstrapStatus: path === '/players/bootstrap' ? response.status : (window.__tgBootDebug?.bootstrapStatus || null),
      bootstrapErrorCode: path === '/players/bootstrap' ? (parsed?.code || parsed?.error || 'BOOTSTRAP_FAILED') : (window.__tgBootDebug?.bootstrapErrorCode || null),
      bootStatus: 'remote_request_failed',
      lastFailingEndpoint: path,
    });
    console.warn('[bootStatus]', {
      stage: 'remote_request_failed',
      endpoint: path,
      status: response.status,
      body: parsed ? { message: parsed.message, code: parsed.code, error: parsed.error } : null,
      hasTelegramObject: Boolean(window.Telegram?.WebApp),
      hasInitData: Boolean(window.Telegram?.WebApp?.initData),
    });
    const error = new Error(localizeApiError(parsed?.code, parsed?.message || `Remote API request failed with status ${response.status}`, i18n.language));
    error.status = response.status;
    error.code = parsed?.code || 'REMOTE_GAME_API_REQUEST_FAILED';
    error.details = parsed;
    throw error;
  }

  if (path === '/players/bootstrap') {
    setBootDebug({
      bootstrapStatus: response.status,
      bootstrapErrorCode: null,
      bootStatus: 'bootstrap_success',
    });
  }

  return extractResponseData(parsed);
}

function getPlayerLookupQuery(filter = {}) {
  if (filter.created_by) {
    return null;
  }

  return filter;
}

export const remoteGameApi = {
  async claimNftHolderPet(petId) {
    return remoteRequest('/holder-pets/claim', { method: 'POST', body: { petId } });
  },
  async createNearWalletProofChallenge() {
    return remoteRequest('/wallets/near/proof-challenge', { method: 'POST', body: {} });
  },

  async disconnectNearWallet() {
    return remoteRequest('/wallets/near/disconnect', { method: 'POST', body: {} });
  },

  async verifyNearWalletProof({ challengeId, signedMessage }) {
    return remoteRequest('/wallets/near/proof-verify', { method: 'POST', body: { challengeId, signedMessage } });
  },

  async bootstrapCurrentPlayer() {
    try {
      return await remoteRequest('/players/bootstrap', {
        method: 'POST',
      });
    } catch (error) {
      if (error?.status >= 500) {
        const me = await remoteRequest('/players/me');
        if (me) return me;
      }
      throw error;
    }
  },

  async getCurrentWallets() {
    return remoteRequest('/wallets/me');
  },

  async connectTonWallet({ address, network, provider, label }) {
    return remoteRequest('/wallets/ton/connect', {
      method: 'POST',
      body: {
        address,
        network,
        provider,
        label,
      },
    });
  },

  async createTonProofPayload() {
    return remoteRequest('/wallets/ton/proof-payload', {
      method: 'POST',
    });
  },

  async verifyTonProof({ sessionId, address, network, provider, label, wallet, proof }) {
    return remoteRequest('/wallets/ton/proof-verify', {
      method: 'POST',
      body: {
        sessionId,
        address,
        network,
        provider,
        label,
        wallet,
        proof,
      },
    });
  },

  async disconnectTonWallet() {
    return remoteRequest('/wallets/ton', {
      method: 'DELETE',
    });
  },

  async listPlayerProfiles(sort = '-created_date', limit = 50) {
    return remoteRequest('/players', {
      query: { sort, limit },
    });
  },

  async getMyLeaderboardPosition(sort = '-stat_strength') {
    return remoteRequest('/leaderboard/me', {query:{sort}});
  },

  async listTopPlayers(sort = '-level', limit = 100) {
    return remoteRequest('/leaderboard', {
      query: { sort, limit },
    });
  },

  async listClanMembers(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/members`);
  },

  async getClan(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}`);
  },

  async listClans() {
    return remoteRequest('/clans');
  },

  async createClan(payload) {
    return remoteRequest('/clans', { method: 'POST', body: payload });
  },

  async joinClan(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/join`, { method: 'POST' });
  },

  async leaveClan(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/leave`, { method: 'POST' });
  },

  async getClanManagement(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/manage`);
  },

  async manageClan(clanId, action, payload = {}) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/manage`, { method: 'POST', body: { action, ...payload } });
  },

  async listClanQuests(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/quests`);
  },

  async startClanQuest(clanId, definitionId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/quests`, { method: 'POST', body: { definitionId } });
  },

  async helpClanQuest(clanId, questId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/quests/${encodeURIComponent(questId)}/help`, { method: 'POST' });
  },

  async listClanEnergyRequests(clanId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/energy-requests`);
  },

  async createClanEnergyRequest(clanId, amount) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/energy-requests`, { method: 'POST', body: { amount } });
  },

  async helpClanEnergyRequest(clanId, requestId) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/energy-requests/${encodeURIComponent(requestId)}/help`, { method: 'POST' });
  },

  async markPlayerPuddle(playerId) {
    return remoteRequest(`/players/${encodeURIComponent(playerId)}/puddle`, { method: 'POST' });
  },

  async getPlayerReaction(playerId) {
    return remoteRequest(`/players/${encodeURIComponent(playerId)}/reaction`);
  },

  async likePlayer(playerId) {
    return remoteRequest(`/players/${encodeURIComponent(playerId)}/like`, { method: 'POST' });
  },

  async claimLikeBox() {
    return remoteRequest('/players/me/like-box/claim', { method: 'POST' });
  },

  async donateToClan(clanId, amount, actionId = crypto.randomUUID()) {
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/donations`, { method: 'POST', body: { amount, actionId } });
  },

  async getShopConfig() {
    return remoteRequest('/shop/config');
  },

  async getPaymentRates() {
    return remoteRequest('/payments/rates');
  },

  async getNewbiePackOffers() {
    return remoteRequest('/newbie-packs');
  },

  async createPaymentOrder({ itemId, paymentMethod }) {
    return remoteRequest('/payments/purchase', {
      method: 'POST',
      body: { itemId, paymentMethod },
    });
  },

  async confirmPaymentOrder(payload) {
    return remoteRequest('/payments/confirm', {
      method: 'POST',
      body: payload,
    });
  },

  async getPaymentOrder(orderId) {
    return remoteRequest(`/payments/orders/${orderId}`);
  },

  async listPaymentOrders(limit = 50) {
    return remoteRequest('/payments/orders', {
      query: { limit },
    });
  },

  async listChatMessages(channel = 'world', limit = 50) {
    return remoteRequest('/chat/messages', {
      query: { channel, limit },
    });
  },

  async sendChatMessage({ channel = 'world', text, replyToId, kind, bossFightInvite }) {
    return remoteRequest('/chat/messages', {
      method: 'POST',
      body: { channel, text, replyToId, kind, bossFightInvite },
    });
  },

  async findPlayerProfiles(filter = {}) {
    if (filter.created_by) {
      const me = await remoteRequest('/players/me');
      return me ? [me] : [];
    }

    return remoteRequest('/players', {
      query: getPlayerLookupQuery(filter),
    });
  },

  async createPlayerProfile(payload) {
    return remoteRequest('/players', {
      method: 'POST',
      body: payload,
    });
  },

  async updatePlayerProfile(profileId, updates) {
    if (!profileId) {
      const error = new Error('Profile id is required');
      error.code = 'PROFILE_ID_REQUIRED';
      throw error;
    }
    const claimPayload = updates?.claimReferralReward;
    if (claimPayload) {
      console.log('[api] claimReferralReward request', { profileId, claimPayload });
      return remoteRequest(`/players/${profileId}`, {
        method: 'PATCH',
        body: { claimReferralReward: claimPayload },
      }).then((result) => {
        console.log('[api] claimReferralReward response', result);
        return result;
      });
    }
    const rouletteClaimPayload = updates?.claimRouletteReward;
    if (rouletteClaimPayload) {
      console.log('[api] claimRouletteReward request', { profileId, rouletteClaimPayload });
      return remoteRequest(`/players/${profileId}`, {
        method: 'PATCH',
        body: { claimRouletteReward: rouletteClaimPayload },
      }).then((result) => {
        console.log('[api] claimRouletteReward response', result);
        return result;
      });
    }
    return remoteRequest(`/players/${profileId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async spinRoulette({ profileId, spinType }) {
    if (!profileId) {
      const error = new Error('Profile id is required');
      error.code = 'PROFILE_ID_REQUIRED';
      throw error;
    }
    return remoteRequest(`/players/${profileId}`, {
      method: 'PATCH',
      body: { spinRoulette: { spinType } },
    });
  },

  async claimRouletteReward({ profileId, pendingRewardId = null }) {
    if (!profileId) {
      const error = new Error('Profile id is required');
      error.code = 'PROFILE_ID_REQUIRED';
      throw error;
    }
    return remoteRequest(`/players/${profileId}`, {
      method: 'PATCH',
      body: { claimRouletteReward: { pendingId: pendingRewardId } },
    });
  },

  async completeMission({ profileId, task, requestId }) {
    if (!profileId) {
      const error = new Error('Profile id is required');
      error.code = 'PROFILE_ID_REQUIRED';
      throw error;
    }
    return remoteRequest(`/players/${profileId}/tasks/complete`, {
      method: 'POST',
      body: { task, requestId },
    });
  },

  async claimReferralReward({ profileId, kind, rewardId }) {
    if (!profileId) {
      const error = new Error('Profile id is required');
      error.code = 'PROFILE_ID_REQUIRED';
      throw error;
    }
    return remoteRequest(`/players/${profileId}`, {
      method: 'PATCH',
      body: { claimReferralReward: { kind, rewardId } },
    });
  },

  async listActiveBossFights(playerEmail = null) {
    const activeFight = await remoteRequest('/boss-fights/active', {
      query: playerEmail ? { playerEmail } : undefined,
    });
    return activeFight ? [activeFight] : [];
  },

  async getBossFightById(fightId) {
    return remoteRequest(`/boss-fights/${fightId}`);
  },

  async createBossFight(payload) {
    return remoteRequest('/boss-fights', {
      method: 'POST',
      body: payload,
    });
  },

  async updateBossFight(fightId, updates) {
    return remoteRequest(`/boss-fights/${fightId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async listBossDamageLogs(fightId, limit = 100) {
    return remoteRequest(`/boss-fights/${fightId}/damage-logs`, {
      query: { limit },
    });
  },

  async getPlayerBossDamageLog(fightId, _playerEmail) {
    return remoteRequest(`/boss-fights/${fightId}/damage-logs/me`);
  },

  async createBossDamageLog(payload) {
    return remoteRequest('/boss-damage-logs', {
      method: 'POST',
      body: payload,
    });
  },

  async updateBossDamageLog(logId, updates) {
    return remoteRequest(`/boss-damage-logs/${logId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async listAttackLogsForDefender(defenderEmail, limit = 20) {
    return remoteRequest('/attack-logs', {
      query: { defenderEmail, limit },
    });
  },

  async createAttackLog(payload) {
    return remoteRequest('/attack-logs', {
      method: 'POST',
      body: payload,
    });
  },

  async updateAttackLog(logId, updates) {
    return remoteRequest(`/attack-logs/${logId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async resolveRaid({ targetProfile, isRevenge = false }) {
    return remoteRequest('/raids/resolve', {
      method: 'POST',
      body: {
        targetId: targetProfile.id,
        isRevenge,
      },
    });
  },

  async attackBoss({ fight, weapon, multiplier = 1 }) {
    return remoteRequest(`/boss-fights/${fight.id}/attack`, {
      method: 'POST',
      body: {
        weaponId: weapon.id,
        multiplier,
      },
    });
  },

  async spawnBossFight({ boss }) {
    return remoteRequest('/boss-fights/spawn', {
      method: 'POST',
      body: {
        bossId: boss.id,
      },
    });
  },

  async claimBossBox({ boxType, bossId, fightId, instanceId }) {
    return remoteRequest('/loot/claim', {
      method: 'POST',
      body: {
        boxType,
        bossId,
        fightId,
        instanceId,
      },
    });
  },

  async claimGiftMail({ mailId }) {
    return remoteRequest('/mail/gifts/claim', {
      method: 'POST',
      body: { mailId },
    });
  },

  async escapeBossFight(fightId) {
    return remoteRequest(`/boss-fights/${fightId}/escape`, { method: 'POST' });
  },

  async joinBossFightInvite(fightId) {
    return remoteRequest(`/boss-fights/${fightId}/join`, { method: 'POST', body: {} });
  },

  async listLastBossWinners() {
    return remoteRequest('/boss-fights/last-winners');
  },

  async getEventPoisonShop() {
    return remoteRequest('/events/poison-shop');
  },
  async buyEventPoison(body) {
    return remoteRequest('/events/poison-shop/buy', { method: 'POST', body });
  },
  async getRaidBoss() {
    return remoteRequest('/raid-boss');
  },

  async attackRaidBoss({ weapon, multiplier = 1 }) {
    return remoteRequest('/raid-boss/attack', { method: 'POST', body: { weaponId: weapon.id, multiplier } });
  },

  async listRaidBossLeaderboard() {
    return remoteRequest('/raid-boss/leaderboard');
  },
};
