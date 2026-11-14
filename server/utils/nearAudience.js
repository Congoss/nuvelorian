import { selectGiftAudience } from './giftAudience.js';

const validAccount = value => typeof value === 'string' && value.length >= 2 && value.length <= 64 && /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(value);
export function decimalUnits(value, decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36 || !/^\d+(?:\.\d+)?$/.test(String(value))) throw new Error('Invalid token amount');
  const [whole, fraction = ''] = String(value).split('.');
  if (fraction.length > decimals) throw new Error('Amount exceeds token precision');
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
}
export function replayHold(balance, minimum, events, account, contract, cutoff, snapshot) {
  let previous = snapshot;
  let amount = BigInt(balance);
  if (amount < minimum) return false;
  for (const event of events) {
    const time = BigInt(event.block?.block_timestamp || event.block_timestamp);
    if (event.affected_account_id !== account || event.contract_account_id !== contract || time > previous || time > snapshot || !/^-?\d+$/.test(String(event.delta_amount))) throw new Error('Incomplete or invalid indexed history');
    previous = time;
    if (time < cutoff) break;
    amount -= BigInt(event.delta_amount);
    if (amount < 0n) throw new Error('Indexed history does not match balance');
    if (amount < minimum) return false;
  }
  return true;
}
export async function buildNearAudience(players, target = {}, { fetchImpl = fetch } = {}) {
  let candidates = selectGiftAudience(players, target);
  const token = String(target.tokenContract || '').trim();
  const nft = String(target.nftContract || '').trim();
  if (token || nft || target.walletRequired) candidates = candidates.filter((player) => player.near_wallet_verified === true);
  const days = Number(target.holdDays || 0);
  if (!Number.isFinite(days) || days < 0 || days > 3650) throw new Error('Hold duration must be between 0 and 3650 days');
  if (days && !token && !nft) throw new Error('Select a token or NFT contract for the hold filter');
  for (const contract of [token, nft].filter(Boolean)) if (!validAccount(contract)) throw new Error('Invalid NEAR contract account');
  const unknown = [];
  const network = process.env.NEAR_NETWORK || process.env.VITE_NEAR_NETWORK || 'mainnet';
  if (!['mainnet', 'testnet'].includes(network)) throw new Error('Unsupported NEAR network');
  const rpc = process.env.NEAR_AUDIENCE_RPC_URL || `https://rpc.${network}.near.org`;
  const indexer = network === 'testnet' ? 'https://api-testnet.nearblocks.io' : 'https://api.nearblocks.io';
  const json = async (url, options) => {
    for (let attempt = 0; ; attempt += 1) {
      const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(15000) });
      if (response.ok) return response.json();
      const retryable = [429, 502, 503, 504].includes(response.status);
      if (!retryable || attempt >= 3) throw new Error(`Blockchain data unavailable (${response.status})`);
      const retryAfter = Number(response.headers?.get?.('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(5000, retryAfter * 1000)
        : Math.min(4000, 500 * (2 ** attempt));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };
  const rpcCall = async (method, params) => {
    const value = await json(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'audience', method, params }) });
    if (value.error || !value.result) throw new Error('NEAR RPC could not verify asset');
    return value.result;
  };
  if (!token && !nft) return { recipients: candidates, unknown, network };
  const block = await rpcCall('block', { finality: 'final' });
  const timestamp = BigInt(block.header.timestamp_nanosec || block.header.timestamp);
  if (days) {
    const headers = process.env.NEARBLOCKS_API_KEY ? { Authorization: `Bearer ${process.env.NEARBLOCKS_API_KEY}` } : {};
    const indexed = await json(`${indexer}/v3/blocks?limit=1`, { headers });
    if (BigInt(indexed.data?.[0]?.block_height || 0) < BigInt(block.header.height)) throw new Error('Indexer has not reached the finalized snapshot. Try again later.');
  }
  const view = async (contract, method, args) => {
    const result = await rpcCall('query', { request_type: 'call_function', block_id: block.header.hash, account_id: contract, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64') });
    return JSON.parse(Buffer.from(result.result).toString());
  };
  const tokenMinimum = token ? decimalUnits(target.minTokenBalance || '1', Number((await view(token, 'ft_metadata', {})).decimals)) : null;
  const nftMinimum = nft ? decimalUnits(target.minNftCount || '1', 0) : null;
  if (tokenMinimum === 0n || nftMinimum === 0n) throw new Error('Minimum asset balance must be positive');
  const wallets = [...new Set(candidates.map(p => p.near_wallet_id).filter(validAccount))];
  if (wallets.length > 500) throw new Error('Narrow the audience to at most 500 wallets per scan');
  const eligible = new Set();
  const scanWallet = async account => {
    try {
      let matches = true;
      for (const [contract, minimum, method, kind] of [[token, tokenMinimum, 'ft_balance_of', 'ft'], [nft, nftMinimum, 'nft_supply_for_owner', 'nft']]) {
        if (!contract) continue;
        const balance = BigInt(await view(contract, method, { account_id: account }));
        if (balance < minimum) { matches = false; break; }
        if (!days) continue;
        const cutoff = timestamp - BigInt(Math.ceil(days * 86400000)) * 1000000n;
        const events = [];
        let next = '';
        let complete = false;
        const cursors = new Set();
        for (let page = 0; page < 20; page += 1) {
          const params = new URLSearchParams({ contract, limit: '100' });
          if (next) params.set('next', next);
          const headers = process.env.NEARBLOCKS_API_KEY ? { Authorization: `Bearer ${process.env.NEARBLOCKS_API_KEY}` } : {};
          const data = await json(`${indexer}/v3/accounts/${account}/${kind}-txns?${params}`, { headers });
          if (!Array.isArray(data.data)) throw new Error('Indexer response unavailable');
          if (data.data.some(event => !event.block?.block_height || !event.block?.block_timestamp)) throw new Error('History has no verifiable block reference');
          events.push(...data.data.filter(event => BigInt(event.block.block_height) <= BigInt(block.header.height)));
          next = data.meta?.next_page || '';
          if (!next || data.data.some(e => BigInt(e.block.block_timestamp) < cutoff)) { complete = true; break; }
          if (cursors.has(next)) throw new Error('Indexer pagination incomplete');
          cursors.add(next);
        }
        if (!complete) throw new Error('History exceeds scan limit');
        if (!events.some(event => BigInt(event.block.block_timestamp) < cutoff)) throw new Error('No indexed ownership evidence before the hold cutoff');
        if (!replayHold(balance, minimum, events, account, contract, cutoff, timestamp)) { matches = false; break; }
      }
      if (matches) eligible.add(account);
    } catch (error) { unknown.push({ wallet: account, reason: error.message }); }
  };
  let walletIndex = 0;
  await Promise.all(Array.from({ length: Math.min(1, wallets.length) }, async () => {
    while (walletIndex < wallets.length) await scanWallet(wallets[walletIndex++]);
  }));
  return { recipients: candidates.filter(p => eligible.has(p.near_wallet_id)), unknown, network, snapshotAt: new Date(Number(timestamp / 1000000n)).toISOString(), source: days ? 'NEAR RPC + NearBlocks indexed transfer history' : 'NEAR finalized RPC' };
}
