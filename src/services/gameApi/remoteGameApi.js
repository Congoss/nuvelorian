import { trackGameWrite } from '@/lib/gameBuildRefresh';
import { recoverShipAttack } from '@/lib/shipAttackRecovery.js';
import i18n from '@/i18n';
import { localizeApiError } from '@/lib/apiErrorTranslations';
import { rateLimitedFetch } from '@/lib/rateLimitedFetch.js';
import { recordPerformanceRequest } from '@/lib/performanceDiagnostics.js';
import { readRemoteResponse } from '@/lib/remoteResponse.js';
import { responseErrorCode } from '@/lib/responseErrorCode.js';
import {withShipRequestTimeout} from '@/lib/shipCombatRequest.js';
import { syncServerClock } from '@/lib/serverClock.js';
import { platformConfig } from '@/lib/platform/config';
import { getTelegramSession } from '@/lib/platform/telegram';
import { reportClientDiagnostic } from '@/lib/diagnosticReporter';
import { createReadCache, selectChatMessages } from '@/lib/displayReadCache';

const displayReads=createReadCache({ttl:2000,max:100});
let lastSlowApiReport = -Infinity;

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

function attachResponseMeta(value, response, path) {
  if (!value || typeof value !== 'object') return value;
  const meta={path,request_id:response.headers.get('x-request-id') || '',received_at:Date.now()};
  try {
    Object.defineProperty(value, '__combat_response_meta', { configurable:true, enumerable:true, value:meta });
    if(value.fight&&typeof value.fight==='object')Object.defineProperty(value.fight,'__combat_response_meta',{configurable:true,enumerable:true,value:meta});
  } catch { /* Response metadata is diagnostic only. */ }
  return value;
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

function remoteRequest(path, options) {
  const method = options?.method || 'GET';
  return method === 'GET' || method === 'HEAD'
    ? sendRemoteRequest(path, options)
    : trackGameWrite(() => sendRemoteRequest(path, options));
}

async function sendRemoteRequest(path, { method = 'GET', query, body,signal,headers = {} } = {}) {
  if(method!=='GET'&&(path==='/chat/messages'||path.startsWith('/releases/')))displayReads.clear();
  const baseUrl = ensureApiBaseUrl();
  const url = `${baseUrl}${path}${buildQuery(query)}`;
  const hasBody = body !== undefined;

  let response;
  const requestStarted = performance.now();
  try {
    response = await rateLimitedFetch(url, {
      method,
      signal,
      cache: 'no-store',
      headers: buildHeaders({...headers,...(hasBody ? { 'Content-Type': 'application/json' } : {})}),
      body: hasBody ? normalizePayload(body) : undefined,
    });
  } catch (error) {
    recordPerformanceRequest(performance.now() - requestStarted, 0);
    if (error?.name !== 'AbortError') reportClientDiagnostic('NETWORK_ERROR', error, path);
    throw error;
  }

  const fetchDuration = performance.now() - requestStarted;
  syncServerClock(response);
  const parsed = await readRemoteResponse(response);

  const requestDuration = performance.now() - requestStarted;
  recordPerformanceRequest(requestDuration, response.status);
  if (requestDuration >= 2000 && !document.hidden && performance.now() - lastSlowApiReport >= 60000) {
    lastSlowApiReport = performance.now();
    reportClientDiagnostic('SLOW_API', `${method} ${response.status}: ${Math.round(requestDuration)}ms; server-timing: ${(response.headers.get('server-timing') || 'unavailable').slice(0, 400)}`, path, {elapsed_ms:requestDuration,fetch_ms:fetchDuration,parse_ms:requestDuration-fetchDuration,method,request_id:response.headers.get('x-request-id') || '',server_timing:response.headers.get('server-timing') || ''});
  }

  if (!response.ok || parsed?.code==='REMOTE_INVALID_RESPONSE' || parsed?.code==='GATEWAY_UNAVAILABLE') {
    if([502,503,504].includes(response.status) || parsed?.code==='REMOTE_INVALID_RESPONSE') {
      reportClientDiagnostic('GATEWAY_ERROR',`${parsed?.code || 'GATEWAY_UNAVAILABLE'} (HTTP ${response.status})`,path,{elapsed_ms:requestDuration,method,request_id:response.headers.get('x-request-id') || ''});
    }
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
    const errorCode = responseErrorCode(response.status,parsed);
    const error = new Error(localizeApiError(errorCode, parsed?.message || `Remote API request failed with status ${response.status}`, i18n.language));
    error.status = response.status;
    error.code = errorCode || 'REMOTE_GAME_API_REQUEST_FAILED';
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

  return attachResponseMeta(extractResponseData(parsed), response, path);
}

const readCache = new Map();
function cachedRemoteRequest(path, ttlMs) {
  const now = Date.now();
  const cached = readCache.get(path);
  if (cached && (cached.pending || cached.expiresAt > now)) return cached.value;
  const pending = remoteRequest(path).then((value) => {
    readCache.set(path, { value: Promise.resolve(value), expiresAt: Date.now() + ttlMs, pending: false });
    return value;
  }).catch((error) => {
    readCache.delete(path);
    throw error;
  });
  readCache.set(path, { value: pending, expiresAt: now + ttlMs, pending: true });
  return pending;
}

function getPlayerLookupQuery(filter = {}) {
  if (filter.created_by) {
    return null;
  }

  return filter;
}

export const remoteGameApi = {
  submitBug(payload){return remoteRequest('/support/reports',{method:'POST',body:payload});},
  cardGame(command,payload={}) { return remoteRequest('/card-game/'+command,{method:'POST',body:payload}); },
  clanShipCombat(clanId, command, payload) { return withShipRequestTimeout(signal=>remoteRequest('/clans/'+encodeURIComponent(clanId)+'/ship/'+command, {method:'POST',signal,body:{...payload,compact:true}})).catch(error=>{if(error.code==='SHIP_REQUEST_TIMEOUT')error.message=localizeApiError(error.code,error.message,i18n.language);throw error;}); },
  localMarket(body) { return remoteRequest(import.meta.env.DEV?'/local-market':'/market-pilot', {headers:{'X-Local-Market-Platform':platformConfig.platform},...(body ? {method:'POST',body} : {})}); },
  marketSimulation() { return remoteRequest('/local-market/simulation', {headers:{'X-Local-Market-Platform':platformConfig.platform}}); },
  marketAccess() { return remoteRequest(import.meta.env.DEV?'/local-market/access':'/market-pilot/access'); },
  marketPaymentInstruction(orderId) { return remoteRequest('/market-pilot/instruction',{method:'POST',headers:{'X-Local-Market-Platform':platformConfig.platform},body:{orderId}}); },
  marketRegistration() { return remoteRequest('/market-pilot/registration',{method:'POST',body:{}}); },
  marketTestnet(body) { return remoteRequest('/local-market/testnet', {headers:{'X-Local-Market-Platform':platformConfig.platform},...(body?{method:'POST',body}:{})}); },
  equipmentForge(body) { return remoteRequest('/equipment-forge', body ? {method:'POST',body} : {}); },
  pvp(body) { return remoteRequest('/pvp', body ? {method:'POST',body} : {}); },
  pvpOnline(body) { return remoteRequest('/pvp/online', body ? {method:'POST',body} : {}); },
  getClanShip(clanId) { return remoteRequest('/clans/'+encodeURIComponent(clanId)+'/ship'); },
  contributeClanShip(clanId, payload) { return remoteRequest('/clans/'+encodeURIComponent(clanId)+'/ship/contribute', {method:'POST',body:payload}); },
  renameClanShip(clanId, payload) { return remoteRequest('/clans/'+encodeURIComponent(clanId)+'/ship/rename', {method:'POST',body:payload}); },
  async getHalloweenEvent({ force = false } = {}) {
    if (force) readCache.delete('/events/halloween');
    return cachedRemoteRequest('/events/halloween', 2000);
  },
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
    return displayReads.get('clans',()=>remoteRequest('/clans'));
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

  async donateToClan(clanId, amount, actionId) {
    actionId ??= globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    return remoteRequest(`/clans/${encodeURIComponent(clanId)}/donations`, { method: 'POST', body: { amount, actionId } });
  },

  async getShopConfig() {
    return cachedRemoteRequest('/shop/config', 300000);
  },

  async getPaymentRates() {
    return cachedRemoteRequest('/payments/rates', 60000);
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

  async listChatMessages(channel = 'world', limit = 50, scope = {}) {
    if(!scope.playerId)return remoteRequest('/chat/messages',{query:{channel,limit}});
    const key=JSON.stringify(['chat',String(scope.playerId),channel,channel==='clan'?String(scope.clanId||''):'']);
    const messages=await displayReads.get(key,()=>remoteRequest('/chat/messages',{query:{channel,limit:100}}));
    return selectChatMessages(messages,limit);
  },

  async sendChatMessage({ channel = 'world', text, replyToId, kind, bossFightInvite }) {
    return remoteRequest('/chat/messages', {
      method: 'POST',
      body: { channel, text, replyToId, kind, bossFightInvite },
    });
  },
  async claimReleaseReward(version) {
    return remoteRequest(`/releases/${encodeURIComponent(version)}/claim`, {method:'POST'});
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

  async completeMission({ profileId, task, requestId, count = 1, batchMode }) {
    if (!profileId) {
      const error = new Error('Profile id is required');
      error.code = 'PROFILE_ID_REQUIRED';
      throw error;
    }
    return remoteRequest(`/players/${profileId}/tasks/complete`, {
      method: 'POST',
      body: { task, requestId, count, batchMode },
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

  async attackBoss({ fight, weapon, multiplier = 1, presses = null }) {
    const requestId = 'combat:' + Date.now() + ':' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    // Several queued taps travel together; the server still resolves them one by one.
    const body = Array.isArray(presses) && presses.length > 1 ? { presses, requestId } : { weaponId: weapon.id, multiplier, requestId };
    return recoverShipAttack(payload => withShipRequestTimeout(signal => remoteRequest(`/boss-fights/${fight.id}/attack`, {
      method: 'POST', body: payload, signal,
    }), {timeoutMs:8000}), body, {maxRetries:1});
  },

  async spawnBossFight({ boss, mode = 'solo' }) {
    return remoteRequest('/boss-fights/spawn', {
      method: 'POST',
      body: {
        bossId: boss.id,
        mode,
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

  async attackRaidBoss({ weapon, multiplier = 1, presses = null }) {
    const requestId = 'combat:' + Date.now() + ':' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    const body = Array.isArray(presses) && presses.length > 1 ? { presses, requestId } : { weaponId: weapon.id, multiplier, requestId };
    return recoverShipAttack(payload => withShipRequestTimeout(signal => remoteRequest('/raid-boss/attack', { method: 'POST', body: payload, signal }), {timeoutMs:8000}), body, {maxRetries:1});
  },

  async listRaidBossLeaderboard() {
    return remoteRequest('/raid-boss/leaderboard');
  },
};
