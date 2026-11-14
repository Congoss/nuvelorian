// PvP merchant bounties (LOCAL PROTOTYPE, docs/PVP_DUEL_DESIGN.md).
// Tor (smith) and Grym (hunter) can be challenged in a duel. The player pays
// nothing; a win earns a small PL4 prize that the merchant funds only from the
// profit it has already realised on the market. No profit -> no prize offer.
// Losses cost the player nothing, so there is no stake and no gambling loop.
// Amounts are integer hundredths of PL4 (same unit as the local market).
import {FALLBACK_PL4_USD,usdToHundredths} from '../../src/lib/marketPricing.js';

export const BOUNTY_MERCHANTS = {
  smith: {name:'Тор', wallet:'tor.nuvelorian.near'},
  hunter:{name:'Грим', wallet:'grym.nuvelorian.near'},
};
const num = (env,key,fallback) => { const v = Number(env[key]); return env[key] !== undefined && env[key] !== '' && Number.isFinite(v) && v >= 0 ? v : fallback; };
export const bountyPolicy = (env = process.env) => ({
  enabled: env.PVP_BOUNTY_ENABLED === '1', // off until after the hackathon (UI tab hidden)
  shareOfProfit: Math.min(1, num(env,'PVP_BOUNTY_PROFIT_SHARE', 0.5)), // at most half of realised profit
  prizeUsd: num(env,'PVP_BOUNTY_PRIZE_USD', 0.05),
  dailyUsd: num(env,'PVP_BOUNTY_DAILY_USD', 0.5),       // per merchant
  perPlayerPerDay: Math.floor(num(env,'PVP_BOUNTY_PER_PLAYER_DAY', 1)), // per merchant
});
const day = t => new Date(t).toISOString().slice(0,10);

// Realised profit per merchant from the local market store: proceeds after fee minus
// cost basis (forged/starting stock costs 0, same rule as treasuryState()).
export function profitFromLocalStore(store) {
  const out = {smith:0, hunter:0};
  for (const p of store?.players || []) {
    const key = p?.ai_agent?.key;
    if (!Object.hasOwn(out,key)) continue;
    for (const l of p.local_market_lots || []) if (l.status === 'sold')
      out[key] += Math.max(0, Number(l.price||0) - Number(l.fee||0) - Number(l.item?.agentCost||0));
  }
  return out;
}
// Mainnet pilot book: lots sold by the merchant wallets. Cost basis is not on the
// lot, so forged/seed stock counts at 0 (same rule as the local market). Units are
// the book's price units; mainnet payout is not wired (see PVP_DUEL_DESIGN.md).
export function profitFromMainnetBook(book) {
  const out = {smith:0, hunter:0};
  const byWallet = Object.fromEntries(Object.entries(BOUNTY_MERCHANTS).map(([k,m])=>[m.wallet,k]));
  for (const l of Array.isArray(book?.lots) ? book.lots : []) {
    const key = byWallet[l?.sellerWallet];
    if (!key || !l.sellerAi || l.status !== 'sold') continue;
    out[key] += Math.max(0, Number(l.price||0) - Number(l.fee||0) - Number(l.item?.agentCost||0));
  }
  return out;
}

export function createBountyLedger({profit = () => ({smith:0,hunter:0}), pl4Usd = FALLBACK_PL4_USD, policy = bountyPolicy(), now = Date.now} = {}) {
  const awards = [];
  const byMatch = new Map();
  const paidBy = key => awards.filter(a=>a.agentKey===key).reduce((s,a)=>s+a.amount,0);
  const paidToday = (key,t) => awards.filter(a=>a.agentKey===key && day(a.at)===day(t)).reduce((s,a)=>s+a.amount,0);
  function pool(key, t = now()) {
    const realised = Math.max(0, Math.floor(Number(profit()?.[key]) || 0));
    const budget = Math.floor(realised * policy.shareOfProfit) - paidBy(key);
    // Daily cap counted in whole prizes, so PL4 rounding never shaves one off.
    const perDay = policy.prizeUsd > 0 ? Math.floor(policy.dailyUsd / policy.prizeUsd + 1e-9) : 0;
    const daily = perDay * usdToHundredths(policy.prizeUsd, pl4Usd) - paidToday(key,t);
    return {realised, available:Math.max(0, Math.min(budget, daily))};
  }
  function quote(playerKey, agentKey, t = now()) {
    if (!policy.enabled || !BOUNTY_MERCHANTS[agentKey]) return null;
    const amount = usdToHundredths(policy.prizeUsd, pl4Usd);
    if (!amount) return null;
    const wins = awards.filter(a=>a.agentKey===agentKey && a.playerKey===playerKey && day(a.at)===day(t)).length;
    if (wins >= policy.perPlayerPerDay) return null;
    if (pool(agentKey,t).available < amount) return null;
    return {agentKey, merchant:BOUNTY_MERCHANTS[agentKey].name, amount, usd:policy.prizeUsd};
  }
  // Idempotent per match; re-checks the pool at payout time so two concurrent
  // offers can never pay more than the profit share or daily cap.
  function award({matchId, playerKey, agentKey}) {
    if (byMatch.has(matchId)) return byMatch.get(matchId);
    const offer = quote(playerKey, agentKey);
    if (!offer) return null;
    const entry = {id:`bounty-${matchId}`, matchId, playerKey, agentKey, amount:offer.amount, at:now(), status:'pending_payout', mode:'simulation'};
    awards.push(entry); byMatch.set(matchId, entry);
    return entry;
  }
  function summary(playerKey, t = now()) {
    return Object.keys(BOUNTY_MERCHANTS).map(key=>({agentKey:key, merchant:BOUNTY_MERCHANTS[key].name, ...pool(key,t), offer:quote(playerKey,key,t)}));
  }
  return {quote, award, pool, summary, awards:()=>awards.map(a=>({...a})), policy};
}
