import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {marketCommand} from '../server/services/local-market.js';
import {seedRestockDemand} from './helpers/restock-demand.mjs';
import {usdToHundredths} from '../src/lib/marketPricing.js';
import {AGENT_PROFILES,agentCount,analyzeMarket,baseValue,configureAgents,fairFor,llmChoose,proposeActions,runAgentTurn,withMarketAgents} from '../server/services/market-agents.js';

// Most tests trade set5 gear; the $1 default cap has its own test below.
process.env.MARKET_AGENT_MAX_BUY_USD = '100';
process.env.MARKET_AGENTS_DAILY_USD = '1000';
const persist = () => true;
const noLlm = {env:{}, persist};
const eq = (id,extra={}) => ({id,type:'equipment',slot:id.split('_').at(-1),count:1,...extra});
function world(count = 5) {
  const human = {id:'human',nickname:'Human',level:100,created_at:'2026-01-01T00:00:00Z',inventory_items:[eq('set5_weapon')],equipped_items:{},local_market_p4:100000};
  const ids = AGENT_PROFILES.slice(0,count).map((_,i)=>`agent${i}`);
  const store = {players:[human, ...ids.map(id=>({id,telegram_id:id,inventory_items:[]}))]};
  const agents = configureAgents(store, ids, count);
  seedRestockDemand(store,agents[0]);
  const by = key => agents.find(a=>a.ai_agent.key===key);
  return {store,human,agents,by};
}
const list = (store,p,itemId,price) => marketCommand(store,p,{action:'list',itemId,price,requestId:randomUUID()},true,{persist});

test('agent count defaults to 2 and is clamped to 1..5', () => {
  assert.equal(agentCount(undefined),2); assert.equal(agentCount('0'),2); assert.equal(agentCount('1'),1); assert.equal(agentCount('9'),5); assert.equal(agentCount('4'),4);
});

test('configureAgents is idempotent and keeps progress', () => {
  const {store,by} = world(3);
  by('smith').local_market_p4 = 1;
  configureAgents(store,['agent0','agent1','agent2'],3);
  assert.equal(by('smith').local_market_p4,1);
  assert.equal(store.players.filter(p=>p.ai_agent).length,3);
});

test('value scales with set power, slot, enhancement and the PL4 quote', () => {
  assert.ok(baseValue(eq('set5_head')) > baseValue(eq('set4_head')));
  assert.ok(baseValue(eq('set5_legs')) > baseValue(eq('set5_boots')));
  const market = new Map();
  assert.ok(fairFor(market,eq('set4_head',{enhancementLevel:3})) > fairFor(market,eq('set4_head')));
  // Doubling the PL4 price halves the PL4 amount: prices stay anchored in USD.
  const cheap = baseValue(eq('set5_legs'),{local_market_pl4_usd:0.00001}), dear = baseValue(eq('set5_legs'),{local_market_pl4_usd:0.00002});
  assert.ok(Math.abs(cheap/dear-2) < 0.001);
});

test('fair price drops with oversupply and rises with recent sales', () => {
  const {store,human,by} = world();
  const quiet = analyzeMarket(store).get('set5_weapon').fair;
  const base = baseValue(eq('set5_weapon'));
  human.local_market_lots = ['a','b','c','d'].map(id=>({id,item:eq('set5_weapon'),price:base,status:'active',createdAt:new Date().toISOString()}));
  assert.ok(analyzeMarket(store).get('set5_weapon').fair < quiet);
  store.players.push(...['a','b','c'].map(id=>({id:'buyer-'+id,inventory_items:[]})));
  human.local_market_lots = ['a','b','c'].map(id=>({id,item:eq('set5_weapon'),price:Math.round(base*1.3),status:'sold',buyerId:'buyer-'+id,soldAt:new Date().toISOString()}));
  assert.ok(analyzeMarket(store).get('set5_weapon').fair > quiet);
  assert.ok(by('hunter'));
});

test('hunter buys an underpriced human listing through the normal escrow', async () => {
  const {store,human,by} = world(2);
  const fair = fairFor(analyzeMarket(store),eq('set5_weapon'));
  await list(store,human,'set5_weapon',Math.floor(fair*0.5));
  const event = await runAgentTurn(store,by('hunter'),noLlm);
  assert.equal(event.action,'buy');
  assert.equal(human.local_market_lots[0].status,'sold');
  assert.ok(human.local_market_lots[0].soldAt);
  assert.ok(by('hunter').inventory_items.some(i=>i.id==='set5_weapon'));
  assert.equal(human.local_market_p4,100000+Math.floor(fair*0.5)-Math.ceil(Math.floor(fair*0.5)*0.05));
  assert.equal(store.local_market_feed.at(-1).seller,'Human');
});

test('hunter ignores fairly priced listings and relists its own stock with markup', async () => {
  const {store,human,by} = world(2);
  const fair = fairFor(analyzeMarket(store),eq('set5_weapon'));
  await list(store,human,'set5_weapon',fair);
  const candidates = proposeActions(store,by('hunter'),analyzeMarket(store));
  assert.ok(!candidates.some(c=>c.action==='buy'));
  const relist = candidates.find(c=>c.action==='list');
  assert.ok(relist && relist.price > relist.fair);
});

test('smith forges missing low-tier supply for free by default, then lists it', async () => {
  const {store,by} = world(1+1);
  store.local_market_agent_ledger = null;
  const smith = by('smith');
  smith.inventory_items = [];
  const before = smith.local_market_p4;
  const event = await runAgentTurn(store,smith,noLlm);
  assert.equal(event.action,'craft');
  assert.match(event.itemId,/^(night_disinfector|nuvelor)_/);
  assert.equal(event.price,0);
  assert.equal(smith.local_market_p4,before);
  assert.equal(store.local_market_burned||0,0);
  const next = await runAgentTurn(store,smith,noLlm);
  assert.equal(next.action,'list');
  assert.ok(smith.local_market_lots.some(l=>l.status==='active'));
});

test('collector only buys wanted slots, never sells', () => {
  const {store,human,by} = world(3);
  human.local_market_lots = [
    {id:'w',item:eq('set4_weapon'),price:Math.round(baseValue(eq('set4_weapon'))*0.75),status:'active',createdAt:new Date().toISOString()},
    {id:'h',item:eq('set4_head'),price:1,status:'active',createdAt:new Date().toISOString()},
  ];
  by('collector').inventory_items = [eq('set5_head')];
  const actions = proposeActions(store,by('collector'),analyzeMarket(store));
  assert.deepEqual(actions.map(a=>a.lotId||a.action),['w']);
});

test('agents keep a cash reserve', () => {
  const {store,human,by} = world(2);
  const hunter = by('hunter');
  hunter.local_market_p4 = Math.floor(hunter.ai_agent.budget*0.1)+10;
  human.local_market_lots = [{id:'x',item:eq('set5_weapon'),price:100,status:'active',createdAt:new Date().toISOString()}];
  assert.ok(!proposeActions(store,hunter,analyzeMarket(store)).some(a=>a.action==='buy'));
});

test('LLM may choose a candidate and speak, but cannot invent prices', async () => {
  const {store,human,by} = world(2);
  const fair = fairFor(analyzeMarket(store),eq('set5_weapon'));
  await list(store,human,'set5_weapon',Math.floor(fair*0.5));
  const env = {MARKET_AGENT_LLM_URL:'https://llm.test/v1',MARKET_AGENT_LLM_KEY:'k'};
  let request;
  const fetchImpl = async (url,init) => { request = {url,body:JSON.parse(init.body)}; return {ok:true,json:async()=>({choices:[{message:{content:'{"choice":0,"say":"Дёшево взял!","price":1}'}}]})}; };
  const event = await runAgentTurn(store,by('hunter'),{env,fetchImpl,persist});
  assert.equal(request.url,'https://llm.test/v1/chat/completions');
  assert.equal(event.action,'buy'); assert.equal(event.say,'Дёшево взял!'); assert.equal(event.ai,true);
  assert.equal(event.price,Math.floor(fair*0.5));
});

test('invalid or failing LLM replies fall back to rules', async () => {
  const env = {MARKET_AGENT_LLM_URL:'https://llm.test/v1',MARKET_AGENT_LLM_KEY:'k'};
  const agent = {ai_agent:{name:'X',persona:''}};
  const candidates = [{action:'list',itemId:'set4_head',price:10,fair:10,reason:''}];
  for (const content of ['nope','{"choice":7}','{"choice":1.5}']) {
    const fetchImpl = async () => ({ok:true,json:async()=>({choices:[{message:{content}}]})});
    assert.equal(await llmChoose({agent,candidates,market:new Map(),fetchImpl,env}),null);
  }
  assert.equal(await llmChoose({agent,candidates,market:new Map(),fetchImpl:async()=>{throw Error('down');},env}),null);
  assert.equal(await llmChoose({agent,candidates,market:new Map(),env:{}}),null);
});

test('web snapshot exposes agents, feed and fair hints; Telegram stays unchanged', async () => {
  const {store,human,by} = world(3);
  await list(store,by('smith'),'nuvelor_hands',2000);
  const base = {items:[eq('set5_weapon')],lots:[{id:'l',item:eq('set4_head'),price:2000,sellerAi:true}]};
  const view = withMarketAgents(store,human,true,base);
  assert.equal(view.agents.length,3);
  assert.ok(view.items[0].fair > 0 && view.lots[0].fair > 0);
  assert.equal(withMarketAgents(store,human,false,base),base);
});

test('a simulated session keeps P4 conserved except for fees and forging burn', async () => {
  const {store,human} = world(5);
  const total = () => store.players.reduce((s,p)=>s+(p.local_market_p4??0),0);
  const fees = () => store.players.reduce((s,p)=>s+(p.local_market_fee_pending||0),0);
  const start = total();
  await list(store,human,'set5_weapon',1500);
  const agents = store.players.filter(p=>p.ai_agent);
  for (let i=0;i<40;i++) await runAgentTurn(store,agents[i%agents.length],{...noLlm,now:Date.now()+i*61_000});
  assert.equal(total()+fees()+(store.local_market_burned||0),start);
  assert.ok(store.local_market_feed.length > 5);
  for (const p of store.players) assert.equal(new Set((p.inventory_items||[]).map(i=>i.id)).size,(p.inventory_items||[]).length);
});

test('AI players never buy or forge above the per-item USD cap', () => {
  const {store,human,by} = world(2);
  const at = usd => usdToHundredths(usd);
  human.local_market_lots = [
    {id:'cheap',item:eq('night_disinfector_hands'),price:at(0.30),status:'active',createdAt:new Date().toISOString()},
    {id:'dear',item:eq('set5_legs'),price:at(1.50),status:'active',createdAt:new Date().toISOString()},
  ];
  const ids = () => proposeActions(store,by('hunter'),analyzeMarket(store)).filter(a=>a.action==='buy').map(a=>a.lotId);
  try {
    delete process.env.MARKET_AGENT_MAX_BUY_USD; // default $1
    assert.deepEqual(ids(),['cheap']);
    by('smith').inventory_items=[];
    const crafts = proposeActions(store,by('smith'),analyzeMarket(store)).filter(a=>a.action==='craft');
    assert.ok(crafts.length > 0 && crafts.every(c=>c.price <= at(1)));
    process.env.MARKET_AGENT_MAX_BUY_USD='5';
    assert.deepEqual(ids().sort(),['cheap','dear']);
  } finally { process.env.MARKET_AGENT_MAX_BUY_USD='100'; }
});

test('agents always buy below the price they sell at, so loops through agents lose money', () => {
  const {store,human,by} = world(5);
  for (const agent of store.players.filter(p=>p.ai_agent)) agent.inventory_items=[eq('nuvelor_head')];
  const market = analyzeMarket(store);
  const fair = fairFor(market,eq('nuvelor_head'));
  human.local_market_lots=[{id:'x',item:eq('nuvelor_legs'),price:Math.round(fairFor(market,eq('nuvelor_legs'))*0.85),status:'active',createdAt:new Date().toISOString()}];
  for (const agent of store.players.filter(p=>p.ai_agent)) {
    const actions = proposeActions(store,agent,market);
    for (const a of actions.filter(a=>a.action==='list')) assert.ok(a.price >= fair*0.9 - 1, `${agent.ai_agent.key} lists below 90%`);
    assert.ok(!actions.some(a=>a.action==='buy'), `${agent.ai_agent.key} buys above 80%`);
  }
});

test('agents do not buy back items an agent sold within 7 days', async () => {
  const {store,human,by} = world(2);
  const smith = by('smith'); smith.inventory_items=[eq('nuvelor_head')];
  await list(store,smith,'nuvelor_head',1000);
  await marketCommand(store,human,{action:'buy',lotId:smith.local_market_lots.find(l=>l.status==='active').id,requestId:randomUUID()},true,{persist});
  const bought = human.inventory_items.find(i=>i.id==='nuvelor_head');
  assert.ok(bought.agentSoldAt);
  await list(store,human,'nuvelor_head',1);
  assert.ok(!proposeActions(store,by('hunter'),analyzeMarket(store)).some(a=>a.action==='buy'));
});

test('only aged level-30+ players can sell to agents, once a day', async () => {
  const {store,human,by} = world(2);
  human.inventory_items=[eq('nuvelor_head'),eq('nuvelor_legs')];
  await list(store,human,'nuvelor_head',1); await list(store,human,'nuvelor_legs',1);
  const buys = () => proposeActions(store,by('hunter'),analyzeMarket(store)).filter(a=>a.action==='buy').length;
  human.level=10; assert.equal(buys(),0);
  human.level=100; human.created_at=new Date().toISOString(); assert.equal(buys(),0);
  human.created_at='2026-01-01T00:00:00Z'; assert.equal(buys(),2);
  const event = await runAgentTurn(store,by('hunter'),noLlm);
  assert.equal(event.action,'buy');
  assert.equal(buys(),0,'second sale the same day is refused');
});

test('daily spend limit covers all agents', () => {
  const {store,human,by} = world(2);
  process.env.MARKET_AGENTS_DAILY_USD='0.05';
  try {
    human.local_market_lots=[{id:'x',item:eq('night_disinfector_hands'),price:usdToHundredths(0.2),status:'active',createdAt:new Date().toISOString()}];
    assert.ok(!proposeActions(store,by('hunter'),analyzeMarket(store)).some(a=>a.action==='buy'));
  } finally { process.env.MARKET_AGENTS_DAILY_USD='1000'; }
});

test('kill switch and treasury auto-pause stop all agents', async () => {
  const {store,human,by} = world(2);
  human.local_market_lots=[{id:'x',item:eq('night_disinfector_hands'),price:1,status:'active',createdAt:new Date().toISOString()}];
  process.env.MARKET_AGENTS_ENABLED='0';
  try { assert.equal(await runAgentTurn(store,by('hunter'),noLlm),null); } finally { delete process.env.MARKET_AGENTS_ENABLED; }
  for (const a of store.players.filter(p=>p.ai_agent)) { a.local_market_p4 = 1; a.inventory_items = []; }
  assert.equal(await runAgentTurn(store,by('hunter'),noLlm),null);
  assert.equal(store.local_market_agents_paused.reason,'treasury_below_limit');
  assert.equal(store.local_market_feed.at(-1).action,'pause');
});

test('seller fees go to the treasury agent', async () => {
  const {store,human,by} = world(2);
  const other = {id:'other',inventory_items:[],local_market_p4:100000};
  store.players.push(other);
  await list(store,human,'set5_weapon',10000);
  const before = by('hunter').local_market_p4;
  await marketCommand(store,other,{action:'buy',lotId:human.local_market_lots[0].id,requestId:randomUUID()},true,{persist});
  assert.equal(by('hunter').local_market_p4, before + 500);
  assert.equal(human.local_market_fee_pending, undefined);
});

test('an agent never lists below its cost basis plus 5%', async () => {
  const {store,human,by} = world(2);
  const hunter = by('hunter');
  hunter.inventory_items=[{...eq('nuvelor_head'),agentCost:usdToHundredths(5)}];
  const list = proposeActions(store,hunter,analyzeMarket(store)).find(a=>a.action==='list');
  assert.ok(list.price >= Math.ceil(usdToHundredths(5)*1.05));
});

test('agents cap their stock and skip items already oversupplied', () => {
  const {store,human,by} = world(2);
  const hunter = by('hunter');
  const lot = (id,item,sellerId='human') => ({id,item:eq(item),price:1,status:'active',createdAt:new Date().toISOString()});
  const other = {id:'other',level:100,created_at:'2026-01-01T00:00:00Z',inventory_items:[],local_market_lots:[lot('o1','nuvelor_head'),lot('o2','nuvelor_head')]};
  store.players.push(other);
  human.local_market_lots=[lot('h1','nuvelor_head'),lot('h2','night_disinfector_head')];
  const buys = () => proposeActions(store,hunter,analyzeMarket(store)).filter(a=>a.action==='buy').map(a=>a.itemId);
  assert.deepEqual(buys(),['night_disinfector_head'],'three nuvelor heads listed: no buy');
  hunter.inventory_items=Array.from({length:6},(_,i)=>eq(['set4_head','set4_legs','set4_boots','set4_hands','set4_armor','set4_weapon'][i]));
  assert.deepEqual(buys(),[],'stock cap reached');
});

test('a week of mixed human trading keeps agents profitable on every sale', async () => {
  const {store,human,by} = world(2);
  const agents = store.players.filter(p=>p.ai_agent);
  const humans = [human, ...[2,3,4].map(n=>({id:'h'+n,nickname:'H'+n,level:60,created_at:'2026-01-01T00:00:00Z',inventory_items:[],equipped_items:{},local_market_p4:usdToHundredths(50)}))];
  store.players.push(...humans.slice(1));
  const pool = ['night_disinfector_weapon','night_disinfector_legs','nuvelor_boots','nuvelor_hands','nuvelor_head','night_disinfector_hands'];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let t = Date.parse('2026-11-12T00:00:00Z');
  for (let step = 0; step < 7*24*6; step++) {           // 10-minute steps for a week
    t += 600_000;
    const h = humans[Math.floor(rnd()*humans.length)];
    if (rnd() < 0.3) { // a human lists a dropped item at a random price
      const id = pool[Math.floor(rnd()*pool.length)];
      if (!h.inventory_items.some(i=>i.id===id) && !(h.local_market_lots||[]).some(l=>l.status==='active'&&l.item.id===id)) {
        h.inventory_items.push(eq(id));
        const price = Math.round(fairFor(analyzeMarket(store,t),eq(id)) * (0.4 + rnd()));
        await marketCommand(store,h,{action:'list',itemId:id,price,requestId:randomUUID()},true,{persist});
      }
    }
    if (rnd() < 0.2) { // a human buys an agent listing they can afford
      const lot = agents.flatMap(a=>(a.local_market_lots||[]).filter(l=>l.status==='active')).find(l=>!h.inventory_items.some(i=>i.id===l.item.id) && l.price<=h.local_market_p4);
      if (lot) await marketCommand(store,h,{action:'buy',lotId:lot.id,requestId:randomUUID()},true,{persist}).catch(()=>{});
    }
    await runAgentTurn(store,agents[step%agents.length],{...noLlm,now:t});
  }
  const sold = agents.flatMap(a=>(a.local_market_lots||[]).filter(l=>l.status==='sold'));
  assert.ok(sold.length > 3, 'agents sold something');
  for (const l of sold) assert.ok(l.price - l.fee >= (Number(l.item.agentCost)||0), `loss on ${l.item.id}`);
  const t1 = (await import('../server/services/market-agents.js')).treasuryState(store, analyzeMarket(store,t));
  assert.ok(t1.realized > 0 && t1.pnl > 0, `pnl ${t1.pnl}`);
});

test('optional forge cost burns PL4 when MARKET_AGENT_FORGE_COST_RATIO is set', async () => {
  process.env.MARKET_AGENT_FORGE_COST_RATIO='0.6';
  try {
    const {store,by} = world(2);
    const smith = by('smith'); smith.inventory_items = [];
    const before = smith.local_market_p4;
    const event = await runAgentTurn(store,smith,noLlm);
    assert.equal(event.action,'craft'); assert.ok(event.price > 0);
    assert.equal(smith.local_market_p4,before-event.price);
    assert.equal(store.local_market_burned,event.price);
  } finally { delete process.env.MARKET_AGENT_FORGE_COST_RATIO; }
});
