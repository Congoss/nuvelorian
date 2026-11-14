import { store } from '../data/store.js';
import { playerDb } from '../data/player-db.js';
import { normalizeGiftMailContent, normalizeGiftRewards } from '../utils/giftMail.js';
import { defaultNftHolderCampaign, loadNearCampaignMetadata } from './nft-holder-campaign.js';
import { HOLDER_PET_OPTIONS, holderPetAlreadyGranted } from '../../src/lib/holderPetRewards.js';

const accountPattern = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/;
const utcDay = () => new Date().toISOString().slice(0, 10);
const rpcUrls = () => {
  const network = process.env.NEAR_NETWORK || process.env.VITE_NEAR_NETWORK || 'mainnet';
  if (!['mainnet', 'testnet'].includes(network)) throw new Error('Unsupported NEAR network');
  return [...new Set([
    process.env.NEAR_HOLDER_RPC_URL || process.env.NEAR_AUDIENCE_RPC_URL,
    `https://rpc.${network}.near.org`,
    network === 'mainnet' ? 'https://free.rpc.fastnear.com' : 'https://test.rpc.fastnear.com',
  ].filter(Boolean))];
};
const rpcCooldowns = new Map();
const scheduledDrops = new Set();
const runningDrops = new Set();
let petGrantRunning = false;
const nearNetwork = () => process.env.NEAR_NETWORK || process.env.VITE_NEAR_NETWORK || 'mainnet';
function tokenClaim(contract, tokenId) {
  return (store.nftPetClaims || []).find(claim => claim.network === nearNetwork() && claim.contract === contract && claim.tokenId === tokenId);
}
function hasLegacyNftPetClaims(contract) {
  return (store.players || []).some(player => Object.values(player.holder_pet_grants || {}).some(claim => claim.contract === contract && !claim.tokenId));
}
function petTokenStatus(drop, holding) {
  const legacyUnknown = hasLegacyNftPetClaims(drop.contract);
  const tokens = (holding.tokenIds || []).map(tokenId => {
    const claim = tokenClaim(drop.contract, tokenId);
    return { tokenId, claimed: Boolean(claim), unknown: !claim && legacyUnknown, claimedAt: claim?.at || '' };
  });
  return { petTokens: tokens, availablePetNfts: tokens.filter(token => !token.claimed && !token.unknown).length, legacyNftClaimsUnknown: legacyUnknown };
}

export async function checkNftPetStatus(contract, tokenId) {
  contract = String(contract || '').trim().toLowerCase();
  tokenId = String(tokenId || '').trim();
  if (!accountPattern.test(contract) || !tokenId || tokenId.length > 512) throw Object.assign(new Error('Invalid NFT contract or token ID'), { statusCode: 400 });
  const drop = getHolderDrops().find(item => item.kind === 'nft' && item.contract === contract && item.petRewardId);
  const claim = tokenClaim(contract, tokenId);
  if (!drop && !claim) throw Object.assign(new Error('No pet reward configured for this collection'), { statusCode: 404 });
  const token = await view(contract, 'nft_token', { token_id: tokenId });
  if (!token || token.token_id !== tokenId) throw Object.assign(new Error('NFT not found'), { statusCode: 404 });
  const unknown = !claim && hasLegacyNftPetClaims(contract);
  return { contract, tokenId, claimed: Boolean(claim), unknown, claimedAt: claim?.at || '', petId: claim?.petId || drop.petRewardId, available: !claim && !unknown, network: nearNetwork() };
}

function titleDefaults(kind) {
  return kind === 'nft'
    ? { uk: 'Бонус холдерам NFT-колекції', en: 'NFT collection holder bonus', ru: 'Бонус холдерам NFT-коллекции' }
    : { uk: 'Бонус холдеру токена', en: 'Token holder bonus', ru: 'Бонус холдеру токена' };
}

export function newHolderDrop(kind = 'nft') {
  const type = kind === 'token' ? 'token' : 'nft';
  const legacy = defaultNftHolderCampaign();
  return normalizeHolderDrop({
    id: store.generateId(type), kind: type, enabled: false,
    contract: type === 'nft' ? legacy.nftContract : legacy.tokenContract,
    name: type === 'nft' ? '' : 'Planet4', symbol: type === 'token' ? 'PL4' : '',
    decimals: type === 'token' ? 18 : 0, icon: '', iconMime: '',
    threshold: type === 'token' ? '1000000' : '1',
    rewards: type === 'nft' ? [{ field: 'large_poison', amount: 1 }] : [{ field: 'large_poison', amount: 1 }],
    title: titleDefaults(type), text: { uk: '', en: '', ru: '' }, sentByDay: {},
    lastRunAt: '', lastResult: null, holders: [],
  });
}

export function normalizeHolderDrop(input = {}, { keepState = true } = {}) {
  const kind = input.kind === 'token' ? 'token' : 'nft';
  const drop = { ...newHolderDropBase(kind), ...input, kind };
  drop.id = String(input.id || store.generateId(kind)).slice(0, 120);
  drop.enabled = Boolean(input.enabled);
  drop.petRewardId = String(input.petRewardId || '');
  if (drop.petRewardId && (kind !== 'nft' || !HOLDER_PET_OPTIONS.some(pet => pet.id === drop.petRewardId))) throw new Error('Select a valid NFT holder pet');
  drop.contract = String(input.contract || '').trim().toLowerCase();
  if (!accountPattern.test(drop.contract)) throw new Error('Invalid NEAR contract account');
  drop.name = String(input.name || '').slice(0, 100);
  drop.symbol = String(input.symbol || '').slice(0, 32);
  drop.decimals = Math.max(0, Math.min(36, Math.floor(Number(input.decimals) || 0)));
  drop.icon = String(input.icon || '').slice(0, 2_000_000);
  drop.iconMime = String(input.iconMime || '').slice(0, 80);
  drop.threshold = String(input.threshold || (kind === 'token' ? '1000000' : '1')).trim();
  if (kind === 'token' && !/^\d+(?:\.\d{1,36})?$/.test(drop.threshold)) throw new Error('Token threshold must be a positive decimal amount');
  if (kind === 'nft' && (!/^\d+$/.test(drop.threshold) || BigInt(drop.threshold) < 1n)) throw new Error('NFT threshold must be a positive whole number');
  drop.rewards = normalizeGiftRewards(input.rewards || [{ field: 'large_poison', amount: 1 }]);
  drop.title = normalizeGiftMailContent(input.title || titleDefaults(kind), `${kind} holder bonus`, 120);
  drop.text = normalizeGiftMailContent(input.text || {}, '', 4000);
  drop.sentByDay = keepState && input.sentByDay && typeof input.sentByDay === 'object' ? input.sentByDay : {};
  drop.lastRunAt = keepState ? String(input.lastRunAt || '') : '';
  drop.lastResult = keepState ? input.lastResult || null : null;
  drop.holders = keepState && Array.isArray(input.holders) ? input.holders.slice(0, 2000) : [];
  return drop;
}

function newHolderDropBase(kind) {
  const legacy = defaultNftHolderCampaign();
  return {
    enabled: false, kind,
    contract: kind === 'nft' ? legacy.nftContract : legacy.tokenContract,
    name: kind === 'nft' ? '' : 'Planet4', symbol: kind === 'token' ? 'PL4' : '', decimals: kind === 'token' ? 18 : 0,
    icon: '', iconMime: '', threshold: kind === 'token' ? '1000000' : '1',
    rewards: [{ field: 'large_poison', amount: 1 }], title: titleDefaults(kind), text: { uk: '', en: '', ru: '' },
    sentByDay: {}, lastRunAt: '', lastResult: null, holders: [],
  };
}

function migrateLegacy() {
  if (Array.isArray(store.nftHolderDrops) && store.nftHolderDrops.length) return store.nftHolderDrops;
  const old = store.nftHolderCampaign;
  if (!old || typeof old !== 'object') return store.nftHolderDrops = [];
  const drops = [];
  for (const kind of ['nft', 'token']) {
    const prefix = kind === 'nft' ? 'nft' : 'token';
    if (!old[`${prefix}Enabled`] && !old.enabled) continue;
    drops.push(normalizeHolderDrop({
      id: `legacy-${kind}`, kind, enabled: Boolean(old[`${prefix}Enabled`] ?? old.enabled),
      contract: old[`${prefix}Contract`], name: old[`${prefix}Name`], symbol: old[`${prefix}Symbol`], decimals: old[`${prefix}Decimals`],
      icon: old[`${prefix}Icon`], iconMime: old[`${prefix}IconMime`], threshold: kind === 'nft' ? '1' : '1000000',
      rewards: kind === 'nft' ? old.nftRewards : [{ field: 'large_poison', amount: 1 }], title: old[`${prefix}Title`], text: old[`${prefix}Text`],
      sentByDay: old.sentByDay, lastRunAt: old.lastRunAt, lastResult: old.lastResult,
    }));
  }
  store.nftHolderDrops = drops;
  store.persistSoon(0);
  return drops;
}

export function getHolderDrops() { return migrateLegacy(); }
export function getHolderDrop(id) { return getHolderDrops().find((drop) => drop.id === String(id)); }
export function saveHolderDrop(input) {
  if (runningDrops.has(String(input.id))) throw Object.assign(new Error('Holder drop is already running'), { statusCode: 409, code: 'HOLDER_DROP_BUSY' });
  const old = getHolderDrop(input.id);
  const drop = normalizeHolderDrop({ ...input, sentByDay: old?.sentByDay, lastRunAt: old?.lastRunAt, lastResult: old?.lastResult, holders: old?.holders });
  store.nftHolderDrops = [...getHolderDrops().filter((item) => item.id !== drop.id), drop];
  store.persistSoon(0);
  return drop;
}
export function deleteHolderDrop(id) {
  if (runningDrops.has(String(id))) throw Object.assign(new Error('Holder drop is already running'), { statusCode: 409, code: 'HOLDER_DROP_BUSY' });
  store.nftHolderDrops = getHolderDrops().filter((drop) => drop.id !== String(id));
  store.persistSoon(0);
}
export function holderDropIcon(id) {
  const drop = getHolderDrop(id);
  if (!drop?.icon || !/^image\/[a-zA-Z0-9.+-]+$/.test(drop.iconMime)) return null;
  return { mime: drop.iconMime, data: drop.icon };
}

async function view(contract, method, args) {
  const urls = rpcUrls();
  let lastError;
  for (let attempt = 0; attempt < urls.length + 1; attempt += 1) {
    const now = Date.now();
    const available = urls.filter(url => Number(rpcCooldowns.get(url) || 0) <= now);
    const url = available[0] || [...urls].sort((a, b) => Number(rpcCooldowns.get(a) || 0) - Number(rpcCooldowns.get(b) || 0))[0];
    if (!available.length) {
      // Do not keep hammering a provider while its Retry-After window is active.
      const wait = Number(rpcCooldowns.get(url) || 0) - now;
      if (wait > 2000) throw lastError || new Error('NEAR RPC rate limited; try again later (429)');
      await new Promise(resolve => setTimeout(resolve, Math.max(0, wait)));
    }
    try {
      const response = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ jsonrpc: '2.0', id: 'holder-drop', method: 'query', params: { request_type: 'call_function', finality: 'final', account_id: contract, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64') } }),
      });
      if (!response.ok) {
        const error = new Error(`NEAR RPC unavailable (${response.status})`);
        error.retryable = response.status === 429 || response.status >= 500;
        const header = response.headers?.get?.('retry-after');
        const delay = header ? (Number.isFinite(Number(header)) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 30000;
        error.retryAfterMs = Number.isFinite(delay) ? Math.max(500, delay) : 30000;
        throw error;
      }
      const payload = await response.json();
      if (payload.error || !Array.isArray(payload.result?.result)) {
        const detail = JSON.stringify(payload.error || payload.result?.error || 'empty result').slice(0, 300);
        const error = new Error(`NEAR contract call failed: ${method}: ${detail}`);
        error.retryable = /rate.?limit|too many|timeout|unavailable|internal.?error/i.test(detail);
        throw error;
      }
      return JSON.parse(Buffer.from(payload.result.result).toString('utf8'));
    } catch (error) {
      if (error.retryable === false) throw error;
      lastError = error;
      rpcCooldowns.set(url, Date.now() + Number(error.retryAfterMs || 1000));
      if (attempt + 1 < urls.length + 1 && available.length <= 1) await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  throw lastError;
}

function unitRaw(amount, decimals) {
  const [whole, fraction = ''] = String(amount).split('.');
  if (fraction.length > decimals) throw new Error(`Token threshold supports at most ${decimals} decimals`);
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0');
}

function formatToken(rawBalance, decimals) {
  const raw = BigInt(rawBalance);
  const scale = 10n ** BigInt(decimals);
  const whole = (raw / scale).toLocaleString('en-US');
  const fraction = decimals ? (raw % scale).toString().padStart(decimals, '0').replace(/0+$/, '') : '';
  return fraction ? `${whole}.${fraction}` : whole;
}

async function evaluate(drop, player) {
  const wallet = String(player.near_wallet_id || '').trim().toLowerCase();
  if (!accountPattern.test(wallet) || player.is_banned) return null;
  if (drop.kind === 'nft') {
    const count = BigInt(String(await view(drop.contract, 'nft_supply_for_owner', { account_id: wallet })));
    const threshold = BigInt(drop.threshold);
    if (count < threshold) return null;
    const tokenIds = [];
    if (drop.petRewardId) {
      if (count > 2000n) throw new Error('NFT ownership list exceeds the 2000 token scan limit');
      while (BigInt(tokenIds.length) < count) {
        const tokens = await view(drop.contract, 'nft_tokens_for_owner', { account_id: wallet, from_index: String(tokenIds.length), limit: 50 });
        if (!Array.isArray(tokens) || !tokens.length || tokens.length > 50) throw new Error('Unable to enumerate wallet NFTs');
        for (const token of tokens) {
          if (token.owner_id !== wallet || typeof token.token_id !== 'string' || !token.token_id || tokenIds.includes(token.token_id)) throw new Error('Invalid NFT ownership response');
          tokenIds.push(token.token_id);
        }
      }
      if (BigInt(tokenIds.length) !== count) throw new Error('NFT ownership changed during scan; try again');
    }
    return { wallet, holding: count.toString(), rewardMultiplier: 1, tokenIds };
  }
  const balance = String(await view(drop.contract, 'ft_balance_of', { account_id: wallet }));
  if (!/^\d+$/.test(balance)) throw new Error('Contract returned an invalid token balance');
  const threshold = unitRaw(drop.threshold, drop.decimals);
  if (threshold <= 0n) throw new Error('Token threshold must be greater than zero');
  const multiplier = BigInt(balance) / threshold;
  if (multiplier < 1n) return null;
  return { wallet, holding: balance, rewardMultiplier: Number(multiplier > 1000000n ? 1000000n : multiplier), displayBalance: formatToken(balance, drop.decimals) };
}

function publicHolder(player, holding, previous, drop) {
  return {
    id: String(player.id), nickname: String(player.nickname || player.username || player.id), wallet: holding.wallet,
    walletVerified: player.near_wallet_verified === true,
    holding: holding.holding, displayBalance: holding.displayBalance || holding.holding,
    rewardMultiplier: holding.rewardMultiplier, rewards: drop.rewards.map((item) => ({ ...item, amount: Math.min(Number.MAX_SAFE_INTEGER, item.amount * holding.rewardMultiplier) })),
    sentToday: Boolean(previous), lastSentAt: previous?.at || '',
    petGranted: holderPetAlreadyGranted(player, drop.petRewardId, store.players),
    petRewardId: drop.petRewardId || '',
    ...petTokenStatus(drop, holding),
    walletPetGranted: (store.nftPetClaims || []).some(claim => claim.network === nearNetwork() && claim.wallet === holding.wallet && claim.petId === drop.petRewardId)
      || Boolean((store.players || []).some(p => p.holder_pet_grants?.[drop.petRewardId]?.wallet === holding.wallet)),
  };
}

async function scan(drop, selectedIds = null) {
  let cursor = 0;
  const candidates = (store.players || []).filter((player) => !player.is_banned && (!selectedIds || selectedIds.has(String(player.id))));
  const profilesWithWallet = candidates.filter((player) => accountPattern.test(String(player.near_wallet_id || '').trim().toLowerCase()));
  const unverifiedWallets = profilesWithWallet.filter((player) => player.near_wallet_verified !== true).length;
  // Scan every wallet already saved on a game profile. Verification is useful metadata,
  // but requiring it here would permanently exclude legacy linked wallets.
  const players = profilesWithWallet;
  const holders = [];
  const successfulIds = new Set();
  const errors = [];
  const previous = drop.sentByDay?.[utcDay()] || {};
  const walletReads = new Map();
  await Promise.all(Array.from({ length: Math.min(2, players.length) }, async () => {
    while (cursor < players.length) {
      const player = players[cursor++];
      try {
        const wallet = String(player.near_wallet_id || '').trim().toLowerCase();
        if (!walletReads.has(wallet)) walletReads.set(wallet, evaluate(drop, player));
        const holding = await walletReads.get(wallet);
        successfulIds.add(String(player.id));
        if (holding) holders.push(publicHolder(player, holding, previous[String(player.id)], drop));
      } catch (error) { errors.push({ id: String(player.id), nickname: player.nickname || player.username || '', wallet: player.near_wallet_id || '', error: error.message }); }
      if (cursor < players.length) await new Promise(resolve => setTimeout(resolve, 250));
    }
  }));
  holders.sort((a, b) => Number(b.rewardMultiplier) - Number(a.rewardMultiplier) || a.nickname.localeCompare(b.nickname));
  // A failed RPC is unknown eligibility, not proof that a holder sold their assets.
  const failedIds = new Set(errors.map(error => error.id));
  const cached = (drop.holders || []).filter(holder => !successfulIds.has(holder.id)
    && ((selectedIds && !selectedIds.has(holder.id)) || failedIds.has(holder.id)))
    .map(holder => ({ ...holder, stale: failedIds.has(holder.id) || Boolean(holder.stale), sentToday: Boolean(previous[holder.id]), lastSentAt: previous[holder.id]?.at || '' }));
  drop.holders = [...holders.map(holder => ({ ...holder, stale: false })), ...cached].slice(0, 2000);
  drop.lastScanErrors = [
    ...(selectedIds ? (drop.lastScanErrors || []).filter(error => !selectedIds.has(error.id)) : []),
    ...errors,
  ].slice(0, 2000);
  return {
    snapshotAt: new Date().toISOString(), checked: players.length, profilesWithWallet: profilesWithWallet.length,
    unverifiedWallets, holders, errors,
  };
}

export async function previewHolderDrop(id) {
  return processHolderDrop({ id, previewOnly: true });
}

export async function claimNftHolderPet(player, petId) {
  if (!HOLDER_PET_OPTIONS.some(pet => pet.id === petId)) throw Object.assign(new Error('Unknown pet'), { statusCode: 400 });
  if (player.inventory_items?.some(item => item.id === petId) || player.equipped_items?.pet === petId) return { status: 'owned' };
  if (!player.near_wallet_id) return { status: 'wallet_required' };
  if (player.near_wallet_verified !== true) return { status: 'wallet_unverified' };
  if (holderPetAlreadyGranted(player, petId, store.players)) return { status: 'already_claimed' };
  const drop = getHolderDrops().find(item => item.kind === 'nft' && item.petRewardId === petId);
  if (!drop) return { status: 'not_configured' };
  const result = await processHolderDrop({ id: drop.id, petOnly: true, playerIds: [String(player.id)] });
  if (result.sent) return { status: 'granted', contract: drop.contract };
  if (result.errors.length) return { status: hasLegacyNftPetClaims(drop.contract) ? 'history_unknown' : 'rpc_error', contract: drop.contract };
  const holder = getHolderDrop(drop.id)?.holders?.find(item => item.id === String(player.id) && !item.stale);
  if (holder?.walletPetGranted || holder?.petGranted) return { status: 'already_claimed', contract: drop.contract };
  return { status: holder ? 'nft_used' : 'no_nft', contract: drop.contract };
}

function makeMail(drop, at, multiplier) {
  const assetName = drop.name || drop.symbol || drop.contract;
  const rewards = drop.rewards.map((item) => ({ ...item, amount: Math.min(Number.MAX_SAFE_INTEGER, item.amount * multiplier) }));
  return {
    id: store.generateId('holder-drop'), title: drop.title, text: drop.text, rewards,
    senderName: assetName, senderIconUrl: `/api/holder-drop-icon?id=${encodeURIComponent(drop.id)}`,
    collectionName: assetName, campaignKind: drop.kind, created_at: at,
  };
}

export async function processHolderDrop(options = {}) {
  const id = String(options.id || '');
  if (options.petOnly && petGrantRunning) throw Object.assign(new Error('Pet issuance is already running'), { statusCode: 409, code: 'HOLDER_DROP_BUSY' });
  if (runningDrops.has(id)) throw Object.assign(new Error('Holder drop is already running. Try again after it finishes.'), { statusCode: 409, code: 'HOLDER_DROP_BUSY' });
  runningDrops.add(id);
  if (options.petOnly) petGrantRunning = true;
  try { return await runHolderDrop(options); }
  finally { runningDrops.delete(id); if (options.petOnly) petGrantRunning = false; }
}

async function runHolderDrop({ id, forcePlayerId = '', playerIds, previewOnly = false, petOnly = false } = {}) {
  const drop = getHolderDrop(id);
  if (!drop) throw new Error('Drop not found');
  if (petOnly && (drop.kind !== 'nft' || !drop.petRewardId || !Array.isArray(playerIds) || !playerIds.length)) {
    throw Object.assign(new Error('Choose an NFT holder pet and select recipients'), { statusCode: 400, code: 'HOLDER_PET_REQUIRED' });
  }
  if (playerIds !== undefined && (!Array.isArray(playerIds) || !playerIds.length || playerIds.length > 200 || playerIds.some(id => typeof id !== 'string' || !id || id.length > 160))) {
    throw Object.assign(new Error('Select between 1 and 200 players'), { statusCode: 400, code: 'HOLDER_PLAYERS_REQUIRED' });
  }
  const selectedIds = forcePlayerId ? new Set([String(forcePlayerId)]) : playerIds ? new Set(playerIds) : null;
  if (!drop.enabled && !selectedIds && !previewOnly) return { skipped: true, reason: 'disabled' };
  if (!previewOnly && !petOnly && !Object.values(drop.text || {}).some((value) => String(value || '').trim())) {
    throw Object.assign(new Error('Add mail text in at least one language before sending this holder drop'), { statusCode: 400, code: 'HOLDER_DROP_TEXT_REQUIRED' });
  }
  const day = utcDay();
  if (!selectedIds && !previewOnly && !petOnly && drop.lastSuccessfulFullScanDay === day) return { skipped: true, reason: 'already-checked-today' };
  const scanned = await scan(drop, selectedIds);
  if (previewOnly) { drop.lastPreviewAt = scanned.snapshotAt; store.persistSoon(0); return { ...scanned, holders: drop.holders }; }
  const players = (store.players || []).filter((player) => !player.is_banned && (!selectedIds || selectedIds.has(String(player.id))));
  const holdersById = new Map(scanned.holders.map((holder) => [holder.id, holder]));
  const at = new Date().toISOString();
  const sent = [];
  const previous = drop.sentByDay?.[day] || {};
  for (const player of players) {
    const holder = holdersById.get(String(player.id));
    if (!holder) continue;
    if (petOnly) {
      if (holderPetAlreadyGranted(player, drop.petRewardId, store.players)) continue;
      if (holder.walletPetGranted) continue;
      if (hasLegacyNftPetClaims(drop.contract)) { scanned.errors.push({ id: String(player.id), nickname: holder.nickname, wallet: holder.wallet, error: 'Historical pet grants have no NFT IDs; reconcile them before issuing more pets' }); continue; }
      if (player.near_wallet_verified !== true) { scanned.errors.push({ id: String(player.id), nickname: holder.nickname, wallet: holder.wallet, error: 'Verify wallet ownership before receiving a pet' }); continue; }
      let eligibleToken;
      for (const item of holder.petTokens || []) {
        if (tokenClaim(drop.contract, item.tokenId)) continue;
        try {
          const token = await view(drop.contract, 'nft_token', { token_id: item.tokenId });
          if (token?.token_id === item.tokenId && token.owner_id === holder.wallet && player.near_wallet_id === holder.wallet && player.near_wallet_verified === true) { eligibleToken = item.tokenId; break; }
        } catch (error) { scanned.errors.push({ id: String(player.id), nickname: holder.nickname, wallet: holder.wallet, error: error.message }); break; }
      }
      if (!eligibleToken) continue;
      store.nftPetClaims ||= [];
      store.nftPetClaims.push({ network: nearNetwork(), contract: drop.contract, tokenId: eligibleToken, petId: drop.petRewardId, wallet: holder.wallet, playerId: String(player.id), at });
      player.inventory_items = [...(player.inventory_items || []), { id: drop.petRewardId, slot: 'pet', type: 'equipment', count: 1, locked: false, sourceType: 'nft_holder', sourceContract: drop.contract }];
      player.holder_pet_grants = { ...player.holder_pet_grants, [drop.petRewardId]: { wallet: holder.wallet, contract: drop.contract, tokenId: eligibleToken, network: nearNetwork(), at } };
      sent.push({ ...holder, petGranted: true, sent: true });
      continue;
    }
    if (!forcePlayerId && previous[String(player.id)]) continue;
    player.gift_mail = [...(player.gift_mail || []), makeMail(drop, at, holder.rewardMultiplier)].slice(-100);
    previous[String(player.id)] = { at, wallet: holder.wallet, holding: holder.holding, rewardMultiplier: holder.rewardMultiplier };
    sent.push({ ...holder, sent: true });
  }
  drop.sentByDay = { [day]: previous };
  if (!selectedIds) {
    drop.lastRunAt = at;
    if (!scanned.errors.length) drop.lastSuccessfulFullScanDay = day;
  }
  drop.holders = drop.holders.map((holder) => ({ ...holder, sentToday: Boolean(previous[holder.id]), lastSentAt: previous[holder.id]?.at || '', petRewardId: drop.petRewardId || '', petGranted: holderPetAlreadyGranted(store.players.find(player => String(player.id) === holder.id) || {}, drop.petRewardId, store.players) }));
  drop.holders = drop.holders.map(holder => ({ ...holder, ...petTokenStatus(drop, { tokenIds: (holder.petTokens || []).map(token => token.tokenId) }), walletPetGranted: holder.walletPetGranted || (store.nftPetClaims || []).some(claim => claim.network === nearNetwork() && claim.wallet === holder.wallet && claim.petId === drop.petRewardId) }));
  drop.lastResult = {
    day, checked: scanned.checked, profilesWithWallet: scanned.profilesWithWallet,
    unverifiedWallets: scanned.unverifiedWallets, holders: scanned.holders.length,
    sent: sent.length, errors: scanned.errors.length, snapshotAt: scanned.snapshotAt,
  };
  drop.lastScanErrors = [...(drop.lastScanErrors || []).filter(error => !scanned.errors.some(item => item.id === error.id)), ...scanned.errors];
  store.nftHolderDrops = [...getHolderDrops().filter((item) => item.id !== drop.id), drop];
  if (sent.length) await playerDb.flushDirtyPlayers(sent.map(holder => holder.id));
  await store.persistNow();
  return { ...drop.lastResult, recipients: sent, errors: scanned.errors };
}

export async function processAllHolderDrops() {
  const results = [];
  for (const drop of getHolderDrops().filter((item) => item.enabled)) {
    if (scheduledDrops.has(drop.id)) continue;
    scheduledDrops.add(drop.id);
    try { results.push({ id: drop.id, ...(await processHolderDrop({ id: drop.id })) }); }
    catch (error) { results.push({ id: drop.id, error: error.message }); }
    finally { scheduledDrops.delete(drop.id); }
  }
  return results;
}

export { loadNearCampaignMetadata };
