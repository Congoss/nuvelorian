// Read-only on-chain status of the AI market players' NEAR accounts.
// No keys: it only reads account existence, NEAR balance, PL4 storage
// registration and PL4 balance, so the accounts can be checked before any
// settlement is enabled. Accounts come from MARKET_AGENT_<KEY>_NEAR.
export const PL4_TOKEN = 'pl4.nearlytrade.near';
const ACCOUNT = /^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*$/;
const rpcUrls = (network = 'mainnet') => network === 'testnet'
  ? ['https://rpc.testnet.near.org', 'https://test.rpc.fastnear.com']
  : ['https://rpc.mainnet.near.org', 'https://free.rpc.fastnear.com'];

export function agentWalletConfig(env = process.env, keys = ['smith', 'hunter', 'collector', 'maker', 'panic']) {
  return keys.map(key => ({key, account: String(env[`MARKET_AGENT_${key.toUpperCase()}_NEAR`] || '').trim().toLowerCase()}))
    .filter(entry => entry.account);
}

async function rpc(params, {fetchImpl, network}) {
  let lastError;
  for (const url of rpcUrls(network)) {
    try {
      const response = await fetchImpl(url, {method:'POST', headers:{'Content-Type':'application/json'}, signal:AbortSignal.timeout(10000),
        body:JSON.stringify({jsonrpc:'2.0', id:'agent-wallets', method:'query', params:{finality:'final', ...params}})});
      const payload = await response.json();
      if (payload.error) {
        const cause = payload.error.cause?.name || payload.error.data || payload.error.message || '';
        if (/UNKNOWN_ACCOUNT|does not exist/i.test(JSON.stringify(cause))) return {missing:true};
        throw new Error(String(cause || 'RPC error'));
      }
      if (payload.result?.error) {
        if (/does not exist/i.test(payload.result.error)) return {missing:true};
        throw new Error(payload.result.error);
      }
      return {result: payload.result};
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('NEAR RPC unavailable');
}
const view = (contract, method, args, options) => rpc({request_type:'call_function', account_id:contract, method_name:method,
  args_base64:Buffer.from(JSON.stringify(args)).toString('base64')}, options)
  .then(r => r.missing ? r : {result: JSON.parse(Buffer.from(r.result.result).toString('utf8'))});

const fromYocto = (raw, decimals) => { const v = BigInt(raw || '0'); const unit = 10n ** BigInt(decimals); return Number(v / unit) + Number(v % unit) / Number(unit); };

export async function checkAgentWallet(account, {fetchImpl = fetch, network = process.env.NEAR_NETWORK || 'mainnet', token = PL4_TOKEN, decimals = 18} = {}) {
  if (!ACCOUNT.test(account)) return {account, ok:false, error:'invalid account id'};
  const options = {fetchImpl, network};
  try {
    const acc = await rpc({request_type:'view_account', account_id:account}, options);
    if (acc.missing) return {account, ok:false, exists:false, error:'account does not exist'};
    const [storage, balance] = await Promise.all([
      view(token, 'storage_balance_of', {account_id:account}, options),
      view(token, 'ft_balance_of', {account_id:account}, options),
    ]);
    const registered = Boolean(storage.result);
    const pl4 = fromYocto(balance.result || '0', decimals);
    const near = fromYocto(acc.result.amount, 24);
    const issues = [];
    if (near < 0.05) issues.push('less than 0.05 NEAR for gas/storage');
    if (!registered) issues.push(`not registered on ${token} (call storage_deposit)`);
    return {account, ok:issues.length === 0, exists:true, near, registered, pl4, issues, checkedAt:new Date().toISOString()};
  } catch (error) {
    return {account, ok:false, error:error.message};
  }
}

export async function checkAgentWallets(options = {}) {
  const config = agentWalletConfig(options.env);
  const results = {};
  for (const {key, account} of config) results[key] = await checkAgentWallet(account, options);
  return results;
}
