// AI market players for the local P4 market test.
// Each agent is an ordinary player record (ai_agent set) and trades only through
// marketCommand, so escrow, fees, idempotency and ownership rules are the same
// as for humans. Rules propose candidate actions with bounded prices; an
// optional LLM (any OpenAI-compatible endpoint, e.g. NEAR AI Cloud) may pick
// one candidate and add a line in character, but can never invent a price.
import {randomUUID} from 'node:crypto';
import {marketCommand,marketEligible} from './local-market.js';
import {saveLocalState} from '../data/local-state.js';
import {withKeyLock} from '../utils/keyLock.js';
import {marketIdentity} from '../utils/marketIdentity.js';
import {restockTicket,restockSpent} from './market-restock.js';
import {MAX_PRICE_HUNDREDTHS,FALLBACK_PL4_USD,TRADABLE_SETS,baseUsd,enhancementUsd,usdToHundredths} from '../../src/lib/marketPricing.js';

// Starting cash = share of MARKET_AGENTS_TREASURY_USD (shares renormalised over active agents).
export const AGENT_PROFILES = [
  {key:'smith',name:'Тор Кузнец',role:'smith',share:0.4,
    persona:'A gruff blacksmith. Forges any set piece nobody is selling, at a premium over the market estimate.',
    seed:['night_disinfector_head','nuvelor_hands','nuvelor_boots']},
  {key:'hunter',name:'Грым Скупщик',role:'hunter',share:0.6,
    persona:'A bargain hunter. Snaps up anything listed well below its value and flips it for profit.',
    seed:['night_disinfector_boots']},
  {key:'collector',name:'Ирис Коллекционер',role:'collector',share:0.3,
    persona:'A collector who wants weapons, pets and enhanced gear and almost never sells.',
    seed:[]},
  {key:'maker',name:'Вексель Маркетмейкер',role:'maker',share:0.3,
    persona:'A calm market maker. Keeps prices close to fair value, buys slightly cheap, sells slightly dear, reprices stale listings.',
    seed:['set5_boots','set4_legs']},
  {key:'panic',name:'Мила Паникёр',role:'panic',share:0.2,
    persona:'A nervous trader. Dumps holdings when prices fall and chases items when prices rise.',
    seed:['set5_hands','set4_boots']},
];
// The smith forges any tradable boss-set piece that nobody has listed, so a player
// can always complete a set. Forged items sell at a premium (forgedRatio/forgedFloor),
// so players' own drops stay cheaper and sell first. Pets are never forged.
export const CRAFTABLE = Object.keys(TRADABLE_SETS).filter(p=>TRADABLE_SETS[p]).flatMap(p=>['weapon','head','hands','armor','legs','boots'].map(slot=>`${p}_${slot}`));
const SLOT_OF = id => id.split('_').at(-1);
const FEED_LIMIT = 40;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const round = v => Math.max(1,Math.round(v));

export const agentCount = (value = process.env.MARKET_AGENTS) => clamp(Math.floor(Number(value) || 2),1,5);

// Anti-abuse and treasury policy (docs/LOCAL_MARKET.md). All overridable by env.
const num = (key, fallback, env = process.env) => { const v = Number(env[key]); return env[key] !== undefined && Number.isFinite(v) && v >= 0 ? v : fallback; };
export const policy = (env = process.env) => ({
  enabled: env.MARKET_AGENTS_ENABLED !== '0',
  buyMax: 0.8,            // agents never pay more than 80% of the estimate...
  sellMin: 0.9,           // ...and never sell below 90%, so agent→player→agent loops lose money
  agentResaleDays: num('MARKET_AGENT_RESALE_DAYS', 7, env),        // agents skip items an agent sold recently
  minSellerLevel: num('MARKET_AGENT_MIN_SELLER_LEVEL', 30, env),
  minAccountDays: num('MARKET_AGENT_MIN_ACCOUNT_DAYS', 7, env),
  sellsPerPlayerPerDay: num('MARKET_AGENT_SELLS_PER_PLAYER_DAY', 1, env),
  itemBuysPerDay: num('MARKET_AGENTS_ITEM_BUYS_PER_DAY', 2, env),
  dailyUsd: num('MARKET_AGENTS_DAILY_USD', 2, env),                // all agents together, buys + forging
  treasuryUsd: num('MARKET_AGENTS_TREASURY_USD', 20, env),         // split between agents at setup
  pauseBelow: 0.5,        // auto-pause when agents hold < 50% of the treasury value in PL4
  minMargin: 0.08,        // never sell below cost basis + 5% (covers the 3% fee)
  maxHoldings: num('MARKET_AGENT_MAX_HOLDINGS', 6, env),          // items in stock + listed, per agent
  maxSupplyToBuy: 1,      // skip buying when other copies of that item are already listed
  forgeCostRatio: num('MARKET_AGENT_FORGE_COST_RATIO', 0, env),    // share of the estimate burned per forge; 0 = free
  forgeListings: num('MARKET_AGENT_FORGE_LISTINGS', 8, env),       // forged items on sale at once
  forgedRatio: 1.2, forgedFloor: 1.1,                               // forged items: 120% of estimate, never below 110%
});
const utcDay = now => new Date(now).toISOString().slice(0,10);
export const isAgent = player => Boolean(player?.ai_agent?.key);
// Spending cap per item for AI players (buys and forging), in USD. Default $1.
export const maxAgentSpendUsd = (env = process.env) => { const v = Number(env.MARKET_AGENT_MAX_BUY_USD); return Number.isFinite(v) && v >= 0 ? v : 1; };

export const pl4Usd = store => Number(store?.local_market_pl4_usd) > 0 ? Number(store.local_market_pl4_usd) : FALLBACK_PL4_USD;
// Starting value in PL4 hundredths for an unenhanced item (docs/MARKET_ECONOMY.md).
export function baseValue(item, store) {
  return usdToHundredths(baseUsd(item.id) ?? 1, pl4Usd(store));
}
const enhancementValue = (item, store) => Number(item.enhancementLevel) > 0 ? usdToHundredths(enhancementUsd(item.enhancementLevel), pl4Usd(store)) : 0;

// Market view per catalog id: recent sales, live supply, demand and fair price.
export function analyzeMarket(store, now = Date.now()) {
  const agentIds = new Set(store.players.filter(isAgent).map(p=>String(p.id)));
  const players=new Map(store.players.map(p=>[String(p.id),p]));
  const lots = store.players.flatMap(p=>(p.local_market_lots || []).map(l=>({...l,sellerId:p.id})));
  const byId = new Map();
  const entry = id => { if(!byId.has(id))byId.set(id,{id,active:[],sold:[]}); return byId.get(id); };
  for (const lot of lots) {
    if (lot.status==='active') entry(lot.item.id).active.push(lot);
    // Only trades between two different human players set prices: agent trades and
    // self-dealing cannot move the estimate the agents act on.
    else if (lot.status==='sold' && lot.buyerId && String(lot.buyerId)!==String(lot.sellerId) && !agentIds.has(String(lot.sellerId)) && !agentIds.has(String(lot.buyerId))) {
      const seller=players.get(String(lot.sellerId)),buyer=players.get(String(lot.buyerId));
      if(seller && buyer && !seller.is_banned && !buyer.is_banned && marketIdentity(seller)!==marketIdentity(buyer))entry(lot.item.id).sold.push(lot);
    }
  }
  for (const player of store.players) for (const item of player.inventory_items || []) if (item?.type==='equipment') entry(item.id);
  for (const info of byId.values()) {
    info.sold.sort((a,b)=>String(a.soldAt||'').localeCompare(String(b.soldAt||'')));
    const seenPairs=new Set();
    const unique=info.sold.slice().reverse().filter(lot=>{
      const pair=[marketIdentity(players.get(String(lot.sellerId))),marketIdentity(players.get(String(lot.buyerId)))].sort().join('|');
      if(seenPairs.has(pair))return false;seenPairs.add(pair);return true;
    }).reverse();
    const recent = unique.slice(-6);
    // Prices are normalised to +0 enhancement so items of different levels compare.
    const norm = lot => Math.max(1, lot.price - enhancementValue(lot.item, store));
    const base = baseValue({id:info.id}, store);
    const sorted = recent.map(norm).sort((a,b)=>a-b);
    const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length-1)/2] : (sorted.at(sorted.length/2-1)+sorted.at(sorted.length/2))/2) : base;
    const reference = recent.length >= 3 ? median : base;
    info.demand = unique.filter(l=>l.soldAt && now - Date.parse(l.soldAt)>=0 && now - Date.parse(l.soldAt) < 10*60_000).length;
    info.supply = info.active.length;
    info.trend = recent.length >= 3 ? norm(recent.at(-1)) / (recent.slice(0,-1).reduce((s,l)=>s+norm(l),0)/(recent.length-1)) - 1 : 0;
    // Never more than ±30% from the price list, whatever the trades say.
    info.fair = round(clamp(reference * clamp(1 + 0.05*info.demand - 0.07*Math.max(0,info.supply-1),0.7,1.3), base*0.7, base*1.3));
    info.lastPrice = recent.at(-1)?.price ?? null;
  }
  return byId;
}
export const fairFor = (market,item,store) => {
  const info = market.get(item.id);
  const fair = info?.fair ?? baseValue({id:item.id}, store);
  return round(fair + enhancementValue(item, store));
};

const owns = (agent,id) => (agent.inventory_items || []).some(i=>i.id===id);
const ownLots = agent => (agent.local_market_lots || []).filter(l=>l.status==='active');

// Seller rules for selling to agents: real, aged accounts; N sales a day; no
// items an agent sold recently (blocks buy-from-agent → sell-back loops).
export function sellerMaySellToAgents(store, lot, now = Date.now()) {
  const rules = policy();
  const seller = store.players.find(p=>String(p.id)===String(lot.sellerId));
  if (!seller || isAgent(seller) || seller.is_banned) return false;
  if (Number(seller.level || 0) < rules.minSellerLevel) return false;
  const created = Date.parse(seller.created_at || seller.created_date || seller.createdAt || '');
  if (rules.minAccountDays > 0 && !(now - created >= rules.minAccountDays * 86_400_000)) return false;
  const soldByAgentAt = Date.parse(lot.item?.agentSoldAt || '');
  if (soldByAgentAt && now - soldByAgentAt < rules.agentResaleDays * 86_400_000) return false;
  const ledger = store.local_market_agent_ledger;
  const sold = ledger?.day === utcDay(now) ? Number(ledger.sellers?.[String(seller.id)] || 0) : 0;
  const identity=marketIdentity(seller);
  const linkedSold=ledger?.day===utcDay(now)?Math.max(Number(ledger.identities?.[identity] || 0),store.players.filter(p=>marketIdentity(p)===identity).reduce((sum,p)=>sum+Number(ledger.sellers?.[String(p.id)] || 0),0)):0;
  const itemBuys=ledger?.day===utcDay(now)?Number(ledger.items?.[lot.item.id] || 0):0;
  return Math.max(sold,linkedSold) < rules.sellsPerPlayerPerDay && itemBuys<rules.itemBuysPerDay;
}
export function dailyBudgetLeft(store, now = Date.now()) {
  const ledger = store.local_market_agent_ledger;
  const spent = ledger?.day === utcDay(now) ? Number(ledger.spent || 0) : 0;
  return Math.max(0, usdToHundredths(policy().dailyUsd, pl4Usd(store)) - spent);
}
function recordSpend(store, candidate, now) {
  const day = utcDay(now);
  const ledger = store.local_market_agent_ledger?.day === day ? JSON.parse(JSON.stringify(store.local_market_agent_ledger)) : {day, spent:0, sellers:{}};
  ledger.spent += candidate.price;
  if (candidate.action === 'buy' && candidate.sellerId) ledger.sellers[String(candidate.sellerId)] = (ledger.sellers[String(candidate.sellerId)] || 0) + 1;
  store.local_market_agent_ledger = ledger;
}

// Candidates may wait on the LLM. Recheck inside the market lock, immediately
// before spending, so another agent cannot exhaust a shared limit in between.
export function validateAgentAction(store, agent, candidate, now=Date.now()) {
  const rules=policy();
  if(!rules.enabled || store.local_market_agents_paused || agent.is_banned)return false;
  const treasury=treasuryState(store);
  if(treasury.start && treasury.ratio<rules.pauseBelow)return false;
  return proposeActions(store,agent,analyzeMarket(store,now),now).some(next=>next.action===candidate.action
    && next.itemId===candidate.itemId && next.lotId===candidate.lotId && next.price===candidate.price);
}
// Treasury value = cash + stock at cost basis (what was actually paid; forged and
// starting items count 0), so free forging cannot inflate it. Below pauseBelow × start, agents stop.
export function treasuryState(store, market = analyzeMarket(store)) {
  const agents = store.players.filter(isAgent);
  const cash = agents.reduce((s,p)=>s+(p.local_market_p4||0),0);
  const stock = agents.reduce((s,p)=>s+[...(p.inventory_items||[]).filter(i=>i?.type==='equipment'), ...ownLots(p).map(l=>l.item)].reduce((t,i)=>t+(Number(i.agentCost)||0),0),0);
  const start = Number(store.local_market_treasury_start || 0);
  // Realised profit on items agents sold: proceeds after fee minus cost basis (starting stock costs 0).
  const realized = agents.flatMap(p=>(p.local_market_lots||[]).filter(l=>l.status==='sold')).reduce((s,l)=>s+(l.price-(l.fee||0)-(Number(l.item.agentCost)||0)),0);
  return {cash, stock, value:cash+stock, start, paused:Boolean(store.local_market_agents_paused), ratio:start ? (cash+stock)/start : 1,
    pnl:cash+stock-start, realized, fees:Number(store.local_market_fee_income||0)};
}

// Rule layer: every candidate already has a bounded, valid price.
export function proposeActions(store, agent, market, now = Date.now()) {
  const role = agent.ai_agent.role;
  const balance = agent.local_market_p4 ?? 0;
  const out = [];
  const active = store.players.flatMap(p=>(p.local_market_lots || []).filter(l=>l.status==='active').map(l=>({...l,sellerId:p.id})));
  const rules = policy();
  const holdings = (agent.inventory_items||[]).filter(i=>i?.type==='equipment').length + ownLots(agent).length;
  const supplyOf = (id, except) => active.filter(l=>l.item.id===id && l.id!==except).length;
  const buyable = holdings >= rules.maxHoldings ? [] : active.filter(l=>l.sellerId!==agent.id && l.price<=balance && !owns(agent,l.item.id)
    && supplyOf(l.item.id, l.id) <= rules.maxSupplyToBuy && sellerMaySellToAgents(store, l, now));
  // Cost basis + margin: an agent never sells at a loss.
  const costFloor = item => Number(item.agentCost) > 0 ? Math.ceil(Number(item.agentCost) * (1 + rules.minMargin)) : 1;
  const buyIf = (maxRatio, filter = () => true) => {
    const cap = Math.min(maxRatio, rules.buyMax);
    for (const lot of buyable.filter(filter)) {
      const ticket=restockTicket(store,lot);if(!ticket)continue;
      const fair = fairFor(market,lot.item,store);
      if (lot.price <= fair*cap) out.push({action:'buy',lotId:lot.id,sellerId:lot.sellerId,itemId:lot.item.id,price:lot.price,fair,reason:'replace sold stock using at most 80% of net sale proceeds'});
    }
  };
  const sellable = (agent.inventory_items || []).filter(i=>marketEligible(agent,i));
  // Unsold listings are marked down 5% per relist, never below the agent's floor.
  const markdowns = agent.ai_agent.markdowns || {};
  const listAt = (ratio, floor) => { for (const item of sellable) { const fair = fairFor(market,item,store); const [base, low] = item.forged ? [rules.forgedRatio, rules.forgedFloor] : [ratio, floor]; const r = Math.max(low, rules.sellMin, base - 0.05*(markdowns[item.id] || 0)); out.push({action:'list',itemId:item.id,price:clamp(Math.max(round(fair*r),costFloor(item)),1,MAX_PRICE_HUNDREDTHS),fair,reason:`list at ${Math.round(r*100)}% of fair`}); } };
  const reprice = (staleMs, floor) => { for (const lot of ownLots(agent)) { const fair = fairFor(market,lot.item,store); const age = now - Date.parse(lot.createdAt || 0); if (age > staleMs && (markdowns[lot.item.id] || 0) < 4 && lot.price > Math.max(fair*Math.max(lot.item.forged ? rules.forgedFloor : floor, rules.sellMin), costFloor(lot.item))*1.02) out.push({action:'cancel',lotId:lot.id,itemId:lot.item.id,price:lot.price,fair,reason:'unsold, marking down'}); } };

  if (role==='smith') {
    // Sell existing stock first; forge only while fewer than 3 own listings are live.
    listAt(1.1,0.75); reprice(120_000,0.75);
    // Missing from the market entirely; items players recently bought from each other first.
    const shortage = CRAFTABLE.filter(id=>!owns(agent,id) && !(market.get(id)?.supply) && !ownLots(agent).some(l=>l.item.id===id))
      .sort((a,b)=>(market.get(b)?.sold.length||0)-(market.get(a)?.sold.length||0));
    const unlisted = (agent.inventory_items||[]).filter(i=>i?.type==='equipment').length;
    if (ownLots(agent).length + unlisted < rules.forgeListings) for (const id of shortage) { const fair = fairFor(market,{id},store); const cost = Math.round(fair*rules.forgeCostRatio); if (cost <= balance) out.push({action:'craft',itemId:id,price:cost,fair,reason:'no supply on the market'}); }
  } else if (role==='hunter') {
    buyIf(0.85); listAt(1.08,0.9); reprice(150_000,0.9);
  } else if (role==='collector') {
    buyIf(rules.buyMax, l => ['weapon','pet','accessory'].includes(l.item.slot || SLOT_OF(l.item.id)) || Number(l.item.enhancementLevel) >= 3);
  } else if (role==='maker') {
    buyIf(0.92); listAt(1.03,0.95); reprice(90_000,0.95);
  } else if (role==='panic') {
    const falling = item => (market.get(item.id)?.trend ?? 0) < -0.05;
    for (const item of sellable.filter(falling)) { const fair = fairFor(market,item,store); out.push({action:'list',itemId:item.id,price:Math.max(round(fair*rules.sellMin),costFloor(item)),fair,reason:'prices are falling'}); }
    buyIf(rules.buyMax, l => (market.get(l.item.id)?.trend ?? 0) > 0.05);
    if (!out.length) { listAt(1.2,0.7); reprice(60_000,0.7); }
  }
  // Keep a little cash: never spend the last 10% of the starting budget.
  const reserve = Math.floor((agent.ai_agent.budget || 0) * 0.1);
  // Never spend more than the per-item cap (MARKET_AGENT_MAX_BUY_USD) on one buy or forge.
  const maxSpend = usdToHundredths(maxAgentSpendUsd(), pl4Usd(store));
  const dailyLeft = dailyBudgetLeft(store, now);
  return out.filter(c => !['buy','craft'].includes(c.action) || (balance - c.price >= reserve && c.price <= maxSpend && c.price <= dailyLeft))
    .sort((a,b) => (a.action==='buy'?a.price/a.fair:2) - (b.action==='buy'?b.price/b.fair:2));
}

// Optional LLM choice. Returns {index, say} or null; any failure falls back to rules.
const llmCalls={day:'',count:0};
const llmCooldown=new Map();
export async function llmChoose({agent, candidates, market, fetchImpl = fetch, env = process.env}) {
  const url = String(env.MARKET_AGENT_LLM_URL || '').trim().replace(/\/$/,'');
  const key = String(env.MARKET_AGENT_LLM_KEY || '').trim();
  if (!url || !key || !candidates.length) return null;
  const liveCloud=url==='https://cloud-api.near.ai/v1';
  if(liveCloud){
    const day=utcDay(Date.now());if(llmCalls.day!==day){llmCalls.day=day;llmCalls.count=0;}
    const configured=Number(env.MARKET_AGENT_LLM_MAX_CALLS_DAY??48),cap=Number.isFinite(configured)?Math.max(0,Math.min(48,configured)):0;
    const agentKey=String(agent.id||agent.ai_agent.key||agent.ai_agent.name);
    if(llmCalls.count>=cap||Date.now()<(llmCooldown.get(agentKey)||0))return null;
    llmCalls.count++;llmCooldown.set(agentKey,Date.now()+60000);
  }
  const lang = env.MARKET_AGENT_LANG || 'ru';
  const summary = [...market.values()].filter(i=>i.supply||i.sold.length).slice(0,12)
    .map(i=>`${i.id}: fair ${(i.fair/100).toFixed(2)} P4, supply ${i.supply}, recent sales ${i.sold.length}`).join('\n');
  const options = candidates.slice(0,8).map((c,i)=>`${i}. ${c.action} ${c.itemId} at ${(c.price/100).toFixed(2)} P4 (fair ${(c.fair/100).toFixed(2)}; ${c.reason})`).join('\n');
  try {
    const response = await fetchImpl(`${url}/chat/completions`, {
      method:'POST', signal:AbortSignal.timeout(8000),
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
      body:JSON.stringify({model:env.MARKET_AGENT_LLM_MODEL || 'Qwen/Qwen3.6-35B-A3B-FP8', temperature:0.7, max_tokens:120,
        ...(liveCloud?{chat_template_kwargs:{enable_thinking:false},response_format:{type:'json_object'}}:{}),
        messages:[
          {role:'system',content:`You are ${agent.ai_agent.name}, a trader in the game Planet4. ${agent.ai_agent.persona} Reply with JSON only: {"choice": <option number or -1 to wait>, "say": "<one short in-character line in language '${lang}', max 120 chars>"}.`},
          {role:'user',content:`Your balance: ${((agent.local_market_p4||0)/100).toFixed(2)} P4.\nMarket:\n${summary || 'quiet'}\nOptions:\n${options}`},
        ]}),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const text = String(payload?.choices?.[0]?.message?.content || '');
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}')+1));
    const index = Number(parsed.choice);
    if (!Number.isInteger(index) || index < -1 || index >= Math.min(8,candidates.length)) return null;
    return {index, say:String(parsed.say || '').replace(/\s+/g,' ').slice(0,120)};
  } catch { return null; }
}

function pushFeed(store, event) {
  store.local_market_feed = [...(store.local_market_feed || []), {id:randomUUID(), at:new Date().toISOString(), ...event}].slice(-FEED_LIMIT);
}

// Forging spends (burns) P4 and creates new supply; committed like a market command.
async function craft(store, agent, candidate, persist, now, event) {
  return withKeyLock('local-market', () => {
    if(!validateAgentAction(store,agent,candidate,now))return false;
    const drafts = store.players.map(p=>JSON.parse(JSON.stringify(p)));
    const actor = drafts.find(p=>p.id===agent.id);
    if ((actor.local_market_p4 ?? 0) < candidate.price || owns(actor,candidate.itemId)) return false;
    actor.local_market_p4 -= candidate.price;
    actor.ai_agent.burned = (actor.ai_agent.burned || 0) + candidate.price;
    actor.inventory_items = [...(actor.inventory_items || []), {id:candidate.itemId,type:'equipment',slot:SLOT_OF(candidate.itemId),count:1,agentCost:candidate.price,forged:true}];
    const draftStore={...store,players:drafts,local_market_burned:(store.local_market_burned || 0)+candidate.price};
    recordSpend(draftStore,candidate,now);
    draftStore.local_market_feed=[...(store.local_market_feed || []),{id:randomUUID(),at:new Date(now).toISOString(),...event}].slice(-FEED_LIMIT);
    draftStore.local_market_journal=[...(store.local_market_journal || []),{requestId:randomUUID(),actorId:agent.id,action:'craft',itemId:candidate.itemId,price:candidate.price,at:new Date(now).toISOString(),mode:'simulation'}];
    if (persist(draftStore) !== true) return false;
    for (const current of store.players) { const draft = drafts.find(p=>p.id===current.id); for (const key of ['inventory_items','local_market_p4','ai_agent']) current[key] = draft[key]; }
    for(const key of ['local_market_burned','local_market_agent_ledger','local_market_feed','local_market_journal'])store[key]=draftStore[key];
    return true;
  });
}

// One decision for one agent. Returns the feed event or null.
export async function runAgentTurn(store, agent, {fetchImpl = fetch, env = process.env, persist = saveLocalState, now = Date.now()} = {}) {
  if (!policy().enabled || store.local_market_agents_paused) return null;
  const market = analyzeMarket(store, now);
  const treasury = treasuryState(store, market);
  if (treasury.start && treasury.ratio < policy().pauseBelow) {
    const draft={...store,local_market_agents_paused:{at:new Date(now).toISOString(), reason:'treasury_below_limit', ratio:treasury.ratio}};
    pushFeed(draft, {agent:'system', name:'Market', action:'pause', reason:`treasury at ${Math.round(treasury.ratio*100)}%`});
    if(persist(draft)===true){store.local_market_agents_paused=draft.local_market_agents_paused;store.local_market_feed=draft.local_market_feed;}
    return null;
  }
  const candidates = proposeActions(store, agent, market, now);
  if (!candidates.length) return null;
  const llm = await llmChoose({agent, candidates, market, fetchImpl, env});
  if (llm?.index === -1) { const event = {agent:agent.ai_agent.key, name:agent.ai_agent.name, action:'wait', say:llm.say, ai:true}; pushFeed(store,event); return event; }
  const chosen = candidates[llm ? llm.index : 0];
  const event = {agent:agent.ai_agent.key, name:agent.ai_agent.name, action:chosen.action, itemId:chosen.itemId, price:chosen.price, fair:chosen.fair, reason:chosen.reason, say:llm?.say || '', ai:Boolean(llm)};
  try {
    if (chosen.action === 'craft') { if (!await craft(store, agent, chosen, persist, now, event)) return null; }
    else {
      if (chosen.action === 'buy') { const seller = store.players.find(p=>(p.local_market_lots||[]).some(l=>l.id===chosen.lotId)); event.seller = seller?.nickname || seller?.username || 'Player'; event.sellerAi = isAgent(seller); }
      await marketCommand(store, agent, {action:chosen.action, requestId:randomUUID(), ...(chosen.lotId ? {lotId:chosen.lotId} : {itemId:chosen.itemId}), ...(chosen.action==='list' ? {price:chosen.price} : {})}, true, {persist,now,agentTrade:{validate:()=>validateAgentAction(store,agent,chosen,now),event}});
    }
  } catch { return null; }
  return event;
}

// Turns agents existing local test players into market agents (idempotent).
export function configureAgents(store, playerIds, count = agentCount()) {
  const agents = [];
  const profiles = AGENT_PROFILES.slice(0, count);
  const shares = profiles.reduce((s,p)=>s+p.share,0);
  profiles.forEach((profile, index) => {
    const player = store.players.find(p=>String(p.id)===String(playerIds[index]) || String(p.telegram_id)===String(playerIds[index]));
    if (!player) return;
    if (!player.ai_agent) {
      const budget = usdToHundredths(policy().treasuryUsd * profile.share / shares, pl4Usd(store));
      Object.assign(player, {nickname:profile.name, level:100, tutorial_disabled:true, tutorial_step:'completed', equipped_items:{},
        local_market_p4:budget, inventory_items:profile.seed.map(id=>({id,type:'equipment',slot:SLOT_OF(id),count:1}))});
      player.ai_agent = {key:profile.key, name:profile.name, role:profile.role, persona:profile.persona, budget, burned:0,
        nearAccount:String(process.env[`MARKET_AGENT_${profile.key.toUpperCase()}_NEAR`] || '').trim() || null};
    }
    // Refresh public wallet association on restart without resetting stock/cash.
    player.ai_agent.nearAccount=String(process.env[`MARKET_AGENT_${profile.key.toUpperCase()}_NEAR`] || '').trim() || null;
    agents.push(player);
  });
  // Seller fees go to the buying agent (the market's treasury), so fees refill agent cash.
  const treasurer = agents.find(a=>a.ai_agent.role==='hunter') || agents[0];
  if (treasurer) store.local_market_fee_recipient = treasurer.id;
  if (!store.local_market_treasury_start) store.local_market_treasury_start = treasuryState(store).value;
  if(!store.local_market_pilot_budget&&Number(process.env.MARKET_PILOT_BUDGET_USD)>0){
    const usd=Number(process.env.MARKET_PILOT_BUDGET_USD);
    store.local_market_pilot_budget={usd,quote:pl4Usd(store),maxHundredths:usdToHundredths(usd,pl4Usd(store)),baselineSpent:restockSpent(store)};
  }
  return agents;
}

export function marketAgentsView(store) {
  return {
    agents: store.players.filter(isAgent).map(p=>({id:p.id, key:p.ai_agent.key, name:p.ai_agent.name, role:p.ai_agent.role, balance:p.local_market_p4 ?? 0,
      listings:ownLots(p).length, holdings:(p.inventory_items||[]).filter(i=>i?.type==='equipment').length, burned:p.ai_agent.burned || 0, nearAccount:p.ai_agent.nearAccount || null,
      wallet:(({ok,exists,near,registered,pl4,issues,error,checkedAt})=>({ok,exists,near,registered,pl4,issues,error,checkedAt}))(store.local_market_agent_wallets?.[p.ai_agent.key] || {}) })),
    feed:(store.local_market_feed || []).slice(-20).reverse(),
    burned:store.local_market_burned || 0,
    treasury:(({cash,stock,value,start,ratio,pnl,realized,fees})=>({cash,stock,value,start,ratio,pnl,realized,fees}))(treasuryState(store)),
    paused:Boolean(store.local_market_agents_paused) || !policy().enabled,
    dailyLeft:dailyBudgetLeft(store),
    llm:Boolean(String(process.env.MARKET_AGENT_LLM_URL||'').trim() && String(process.env.MARKET_AGENT_LLM_KEY||'').trim()),
  };
}

// Adds agents, the market feed and fair-price hints to a market snapshot (web only).
export function withMarketAgents(store, player, web, state) {
  if (!web) return state;
  const market = analyzeMarket(store);
  return {...state,
    items:state.items.map(item=>({...item,fair:fairFor(market,item,store)})),
    // Agents' cost basis stays server-side.
    lots:state.lots.map(({item:{agentCost, ...item}, ...lot})=>({...lot,item,fair:fairFor(market,item,store)})),
    pl4Usd:pl4Usd(store),
    ...marketAgentsView(store)};
}

// Round-robin loop: one agent acts per tick so the market moves at a watchable pace.
export function startMarketAgents(store, {intervalMs = Number(process.env.MARKET_AGENT_INTERVAL_MS) || 6000, ...options} = {}) {
  if (!policy().enabled) return () => {};
  let index = 0, running = false;
  const timer = setInterval(async () => {
    if (running) return;
    const agents = store.players.filter(isAgent);
    if (!agents.length) return;
    running = true;
    try { await runAgentTurn(store, agents[index++ % agents.length], options); }
    catch (error) { console.warn('[market-agents]', error?.message || error); }
    finally { running = false; }
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
