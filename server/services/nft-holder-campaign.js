import { store } from '../data/store.js';
import { playerDb } from '../data/player-db.js';
import { normalizeGiftMailContent, normalizeGiftRewards } from '../utils/giftMail.js';

const DEFAULT = {
  enabled: false, nftEnabled: false, tokenEnabled: false,
  nftContract: 'nft.herewallet.near', nftName: '', nftSymbol: '', nftIcon: '', nftIconMime: '', nftRewards: [{ field: 'large_poison', amount: 1 }],
  tokenContract: 'pl4.nearlytrade.near', tokenName: 'Planet4', tokenSymbol: 'PL4', tokenDecimals: 18, tokenIcon: '', tokenIconMime: '',
  nftTitle: { uk: 'Бонус холдерам NFT-колекції', en: 'NFT collection holder bonus', ru: 'Бонус холдерам NFT-коллекции' },
  nftText: { uk: '', en: '', ru: '' },
  tokenTitle: { uk: 'Бонус холдеру PL4', en: 'PL4 holder bonus', ru: 'Бонус холдеру PL4' },
  tokenText: { uk: '', en: '', ru: '' }, lastRunAt: '', lastResult: null, sentByDay: {},
};
const accountPattern = /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/;
const rpcUrl = () => `https://rpc.${process.env.NEAR_NETWORK || process.env.VITE_NEAR_NETWORK || 'mainnet'}.near.org`;

export function defaultNftHolderCampaign() { return structuredClone(DEFAULT); }
export function normalizeNftHolderCampaign(input = {}) {
  const base = { ...DEFAULT, ...(input && typeof input === 'object' ? input : {}) };
  for (const key of ['nftContract', 'tokenContract']) {
    base[key] = String(base[key] || '').trim().toLowerCase();
    if (base[key] && !accountPattern.test(base[key])) throw new Error(`Invalid NEAR contract: ${key}`);
  }
  if (!base.nftContract || !base.tokenContract) throw new Error('NFT and token contracts are required');
  base.nftName = String(base.nftName || '').slice(0, 100);
  base.nftSymbol = String(base.nftSymbol || '').slice(0, 32);
  base.tokenName = String(base.tokenName || 'Planet4').slice(0, 100);
  base.tokenSymbol = String(base.tokenSymbol || 'PL4').slice(0, 32);
  base.tokenDecimals = Math.max(0, Math.min(36, Math.floor(Number(base.tokenDecimals ?? 18))));
  base.nftIcon = String(base.nftIcon || '').slice(0, 2_000_000);
  base.tokenIcon = String(base.tokenIcon || '').slice(0, 2_000_000);
  base.nftIconMime = String(base.nftIconMime || '').slice(0, 80);
  base.tokenIconMime = String(base.tokenIconMime || '').slice(0, 80);
  base.nftRewards = normalizeGiftRewards(base.nftRewards || []);
  const legacyTitle = input.title || {};
  const legacyText = input.text || {};
  base.nftTitle = normalizeGiftMailContent(input.nftTitle || legacyTitle, 'NFT holder bonus', 120);
  base.nftText = normalizeGiftMailContent(input.nftText || legacyText, '', 4000);
  base.tokenTitle = normalizeGiftMailContent(input.tokenTitle || legacyTitle, 'PL4 holder bonus', 120);
  base.tokenText = normalizeGiftMailContent(input.tokenText || legacyText, '', 4000);
  base.nftEnabled = input.nftEnabled === undefined ? Boolean(input.enabled) : Boolean(input.nftEnabled);
  base.tokenEnabled = input.tokenEnabled === undefined ? Boolean(input.enabled) : Boolean(input.tokenEnabled);
  base.enabled = base.nftEnabled || base.tokenEnabled;
  base.sentByDay = input.sentByDay && typeof input.sentByDay === 'object' ? input.sentByDay : {};
  return base;
}

async function view(contract, method, args = {}) {
  const response = await fetch(rpcUrl(), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ jsonrpc: '2.0', id: 'holder-campaign', method: 'query', params: { request_type: 'call_function', finality: 'final', account_id: contract, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64') } }),
  });
  if (!response.ok) throw new Error(`NEAR RPC unavailable (${response.status})`);
  const payload = await response.json();
  if (payload.error || !payload.result?.result) throw new Error(`NEAR contract call failed: ${method}`);
  return JSON.parse(Buffer.from(payload.result.result).toString('utf8'));
}

function parseIcon(icon) {
  const match = String(icon || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  return match ? { mime: match[1], data: match[2] } : { mime: '', data: '' };
}
export async function loadNearCampaignMetadata(contract, kind) {
  if (!accountPattern.test(String(contract || ''))) throw new Error('Invalid NEAR contract account');
  const meta = await view(contract, kind === 'nft' ? 'nft_metadata' : 'ft_metadata');
  const image = parseIcon(meta.icon);
  return { name: String(meta.name || ''), symbol: String(meta.symbol || ''), decimals: Number(meta.decimals ?? 0), icon: image.data, iconMime: image.mime };
}

export function largePoisonForPl4Balance(rawBalance, decimals = 18) {
  if (!/^\d+$/.test(String(rawBalance)) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) return 0;
  const perMillion = 1_000_000n * (10n ** BigInt(decimals));
  const amount = BigInt(rawBalance) / perMillion;
  return Number(amount > 1_000_000n ? 1_000_000n : amount);
}

const utcDay = () => new Date().toISOString().slice(0, 10);
const hasNft = async (contract, account) => BigInt(await view(contract, 'nft_supply_for_owner', { account_id: account })) > 0n;
const pl4Poison = async (contract, account, decimals) => largePoisonForPl4Balance(String(await view(contract, 'ft_balance_of', { account_id: account })), decimals);

function makeMail(config, type, at, amount = 0) {
  const assetName = type === 'nft' ? (config.nftName || config.nftContract) : `${config.tokenName || 'Planet4'} (${config.tokenSymbol || 'PL4'})`;
  const rewards = type === 'nft' ? config.nftRewards : [{ field: 'large_poison', amount }];
  return {
    id: store.generateId('holder-bonus'), title: type === 'nft' ? config.nftTitle : config.tokenTitle, text: type === 'nft' ? config.nftText : config.tokenText, rewards,
    senderName: assetName, senderIconUrl: `/api/nft-holder-campaign/icon?asset=${type}`,
    collectionName: assetName, campaignKind: type, created_at: at,
  };
}

async function evaluatePlayer(player, config) {
  const account = String(player.near_wallet_id || '').trim().toLowerCase();
  if (!player.near_wallet_verified || !accountPattern.test(account) || player.is_banned) return { nft: false, tokenAmount: 0 };
  const [nft, tokenAmount] = await Promise.all([
    config.nftEnabled ? hasNft(config.nftContract, account) : false,
    config.tokenEnabled ? pl4Poison(config.tokenContract, account, config.tokenDecimals) : 0,
  ]);
  return { nft, tokenAmount };
}

export async function processNftHolderCampaign({ forcePlayerId = '' } = {}) {
  const config = normalizeNftHolderCampaign(store.nftHolderCampaign || DEFAULT);
  if (!config.enabled) return { skipped: true, reason: 'disabled' };
  if (!forcePlayerId && config.lastRunAt && config.lastRunAt.slice(0, 10) === utcDay() && Number(config.lastResult?.errors || 0) === 0) return { skipped: true, reason: 'already-checked-today' };
  const players = forcePlayerId
    ? (store.players || []).filter((player) => String(player.id) === String(forcePlayerId))
    : (store.players || []).filter((player) => player.near_wallet_verified && !player.is_banned);
  const day = utcDay();
  if (!config.sentByDay || typeof config.sentByDay !== 'object') config.sentByDay = {};
  const delivered = config.sentByDay[day] || {};
  const at = new Date().toISOString();
  const results = [];
  let playerIndex = 0;
  await Promise.all(Array.from({ length: Math.min(8, players.length) }, async () => {
    while (playerIndex < players.length) {
      const player = players[playerIndex++];
      if (!player.near_wallet_verified || !player.near_wallet_id) continue;
      let holdings;
      try { holdings = await evaluatePlayer(player, config); }
      catch (error) { results.push({ id: player.id, nickname: player.nickname || player.username || '', error: error.message }); continue; }
      const playerState = delivered[String(player.id)] || {};
      const added = [];
      for (const type of ['nft', 'token']) {
        const active = type === 'nft' ? config.nftEnabled : config.tokenEnabled;
        const eligible = active && (type === 'nft' ? holdings.nft : holdings.tokenAmount > 0);
        const repeat = forcePlayerId && String(forcePlayerId) === String(player.id);
        if (!eligible || (!repeat && playerState[type])) continue;
        player.gift_mail = [...(player.gift_mail || []), makeMail(config, type, at, holdings.tokenAmount)].slice(-100);
        playerState[type] = true;
        added.push(type);
      }
      if (added.length) {
        delivered[String(player.id)] = playerState;
        results.push({ id: player.id, nickname: player.nickname || player.username || '', wallet: player.near_wallet_id, sent: added, largePoison: holdings.tokenAmount });
      } else if (!forcePlayerId) results.push({ id: player.id, nickname: player.nickname || player.username || '', wallet: player.near_wallet_id, sent: [], largePoison: holdings.tokenAmount });
    }
  }));
  config.sentByDay = { [day]: delivered };
  config.lastRunAt = at;
  config.lastResult = { day, checked: players.length, sent: results.filter((row) => row.sent?.length).length, errors: results.filter((row) => row.error).length, recipients: results.filter((row) => row.sent?.length).slice(0, 500) };
  store.nftHolderCampaign = config;
  await playerDb.flushDirtyPlayers();
  await store.persistNow();
  return { ...config.lastResult, results };
}

export function campaignIcon(asset) {
  const config = store.nftHolderCampaign || {};
  const key = asset === 'nft' ? 'nft' : asset === 'token' ? 'token' : '';
  if (!key) return null;
  const data = config[`${key}Icon`];
  const mime = config[`${key}IconMime`];
  if (!data || !/^image\/[a-zA-Z0-9.+-]+$/.test(String(mime || ''))) return null;
  return { mime, data };
}
