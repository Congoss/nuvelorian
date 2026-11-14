import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {seedRestockDemand} from './helpers/restock-demand.mjs';
import {configureAgents,runAgentTurn,proposeActions,analyzeMarket,treasuryState} from '../server/services/market-agents.js';
import {marketCommand,marketState} from '../server/services/local-market.js';
import {restoreLocalMarketState} from '../server/utils/localMarketState.js';
import {usdToHundredths} from '../src/lib/marketPricing.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const eq=(id,extra={})=>({id,type:'equipment',slot:id.split('_').at(-1),count:1,...extra});
const human=(id,items=[])=>({id,level:100,created_at:'2026-01-01T00:00:00Z',inventory_items:items,equipped_items:{},local_market_p4:100000});
function world(n=3){const h=human('human',[eq('night_disinfector_weapon'),eq('nuvelor_boots')]);const ids=Array.from({length:n},(_,i)=>'bot-'+i);const store={players:[h,...ids.map(id=>human(id))]};const agents=configureAgents(store,ids,n);seedRestockDemand(store,agents[0]);return {store,h,agents};}
const list=(s,p,id,price)=>marketCommand(s,p,{requestId:randomUUID(),action:'list',itemId:id,price},true,{persist:()=>true});
const withLimits=async(env,fn)=>{const before={};for(const [k,v] of Object.entries(env)){before[k]=process.env[k];process.env[k]=v;}try{return await fn();}finally{for(const [k,v] of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}};

test('purchase snapshot includes cost, seller limits, fees, feed and journal before acknowledgement',async()=>{
 const {store,h,agents}=world(2);const hunter=agents[1];
 await list(store,h,'night_disinfector_weapon',usdToHundredths(.2));
 let disk;
 const result=await runAgentTurn(store,hunter,{env:{},persist:s=>{disk=clone(s);return true;}});
 assert.equal(result.action,'buy');
 assert.equal(disk.players.find(p=>p.id===hunter.id).inventory_items.find(i=>i.id==='night_disinfector_weapon').agentCost,result.price);
 assert.equal(disk.local_market_agent_ledger.sellers.human,1);
 assert.equal(disk.local_market_agent_ledger.spent,result.price);
 assert(disk.local_market_fee_income>0);
 assert.equal(disk.local_market_feed.at(-1).action,'buy');
 assert.equal(disk.local_market_journal.at(-1).action,'buy');
 const restarted={players:disk.players};restoreLocalMarketState(restarted,disk);
 assert(!proposeActions(restarted,restarted.players.find(p=>p.id===hunter.id),analyzeMarket(restarted)).some(c=>c.action==='buy'));
 const view=marketState(store,hunter,true);assert(!JSON.stringify(view).includes('agentCost'));assert.equal(view.withdrawalEnabled,false);
});

test('failed purchase persistence leaves every limit, balance and metadata unchanged',async()=>{
 const {store,h,agents}=world(2);await list(store,h,'night_disinfector_weapon',usdToHundredths(.2));
 const before=clone(store);assert.equal(await runAgentTurn(store,agents[1],{env:{},persist:()=>false}),null);assert.deepEqual(store,before);
});

test('concurrent LLM choices cannot overspend the shared daily limit',async()=>withLimits({MARKET_AGENTS_DAILY_USD:'.3'},async()=>{
 const {store,h,agents}=world(3),hunter=agents[1],collector=agents[2];
 hunter.inventory_items=[eq('night_disinfector_weapon')];
 await list(store,h,'nuvelor_boots',usdToHundredths(.2));
 const second=human('second',[eq('night_disinfector_weapon')]);store.players.push(second);await list(store,second,'night_disinfector_weapon',usdToHundredths(.2));
 let arrived=0,release;const barrier=new Promise(r=>{release=r;});
 const fetchImpl=async()=>{if(++arrived===2)release();await barrier;return {ok:true,json:async()=>({choices:[{message:{content:'{"choice":0}'}}]})};};
 const env={MARKET_AGENT_LLM_URL:'https://mock.invalid/v1',MARKET_AGENT_LLM_KEY:'test'};
 const outcomes=await Promise.all([hunter,collector].map(a=>runAgentTurn(store,a,{env,fetchImpl,persist:()=>true})));
 assert.equal(outcomes.filter(e=>e?.action==='buy').length,1);
 assert(store.local_market_agent_ledger.spent<=usdToHundredths(.3));
}));

test('same verified wallet shares one seller limit across accounts',async()=>{
 const {store,h,agents}=world(2);Object.assign(h,{near_wallet_id:'linked.near',near_wallet_verified:true});
 const linked=human('linked',[eq('nuvelor_head')]);Object.assign(linked,{near_wallet_id:'linked.near',near_wallet_verified:true});store.players.push(linked);
 await list(store,h,'night_disinfector_weapon',usdToHundredths(.2));await list(store,linked,'nuvelor_head',usdToHundredths(.2));
 assert.equal((await runAgentTurn(store,agents[1],{env:{},persist:()=>true})).action,'buy');
 assert(!proposeActions(store,agents[1],analyzeMarket(store)).some(c=>c.action==='buy'));
});

test('repeated pair, unknown buyer and linked-wallet trades cannot pump the estimate',()=>{
 const {store,h}=world(2);const honest=analyzeMarket(store).get('night_disinfector_weapon').fair;
 const linked=human('linked');Object.assign(h,{near_wallet_verified:true,near_wallet_id:'same.near'});Object.assign(linked,{near_wallet_verified:true,near_wallet_id:'same.near'});store.players.push(linked);
 h.local_market_lots=Array.from({length:10},(_,n)=>({id:'l'+n,item:eq('night_disinfector_weapon'),price:honest*100,status:'sold',buyerId:n<5?'missing':'linked',soldAt:new Date().toISOString()}));
 assert.equal(analyzeMarket(store).get('night_disinfector_weapon').fair,honest);
 const other=human('other');store.players.push(other);h.local_market_lots=h.local_market_lots.map(l=>({...l,buyerId:'other'}));
 const repeated=analyzeMarket(store).get('night_disinfector_weapon');assert.equal(repeated.demand,1);assert(repeated.fair<=Math.ceil(honest*1.051));
});

test('free forging stays at zero cost in the durable treasury snapshot',async()=>{
 const {store,agents}=world(2),smith=agents[0];smith.inventory_items=[];let disk;
 const result=await runAgentTurn(store,smith,{env:{},persist:s=>{disk=clone(s);return true;}});
 assert.equal(result.action,'craft');assert.equal(result.price,0);assert.equal(disk.local_market_agent_ledger.spent,0);
 const restarted={players:disk.players};restoreLocalMarketState(restarted,disk);assert.equal(treasuryState(restarted).stock,0);assert.equal(disk.local_market_journal.at(-1).action,'craft');
});

test('gift provenance cannot be laundered using a boss equipment ID',async()=>{
 for(const sourceType of ['gift','pack','battle_pass','event','nft_holder']){const p=human('p',[eq('nuvelor_head',{sourceType})]),store={players:[p]};assert.equal(marketState(store,p,true).items.length,0);await assert.rejects(list(store,p,'nuvelor_head',1),/ITEM_UNAVAILABLE/);}
});

test('real local store initialization restores agent safety metadata from disk',async()=>{
 const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const folder=mkdtempSync(join(tmpdir(),'p4-market-restart-')),file=join(folder,'state.json');
 const saved={players:[],local_market_agent_ledger:{day:'2026-11-11',spent:123,sellers:{a:1}},local_market_agents_paused:{reason:'test'},local_market_fee_income:77,local_market_treasury_start:10000,local_market_journal:[{mode:'simulation',action:'buy'}]};
 writeFileSync(file,JSON.stringify(saved));
 try{
  const script=`const {store}=await import(${JSON.stringify(new URL('../server/data/store.js',import.meta.url).href)});await store.init();console.log('MARKET_RESTART:'+JSON.stringify({ledger:store.local_market_agent_ledger,paused:store.local_market_agents_paused,fees:store.local_market_fee_income,journal:store.local_market_journal,start:store.local_market_treasury_start}));`;
  const env={...process.env,NODE_ENV:'test',LOCAL_GAME_STATE_PATH:file};for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING','TELEGRAM_BOT_TOKEN'])env[key]=' ';
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{env,encoding:'utf8',timeout:20000});
  assert.equal(result.status,0,result.stderr || result.stdout);const line=result.stdout.split('\n').find(l=>l.startsWith('MARKET_RESTART:'));const restored=JSON.parse(line.slice('MARKET_RESTART:'.length));
  assert.deepEqual(restored.ledger,saved.local_market_agent_ledger);assert.deepEqual(restored.paused,saved.local_market_agents_paused);assert.equal(restored.fees,77);assert.equal(restored.start,10000);assert.deepEqual(restored.journal,saved.local_market_journal);
 }finally{rmSync(folder,{recursive:true,force:true});}
});

test('zero daily budget blocks even the smallest paid agent purchase',async()=>withLimits({MARKET_AGENTS_DAILY_USD:'0'},async()=>{
 const {store,h,agents}=world(2);await list(store,h,'night_disinfector_weapon',1);assert(!proposeActions(store,agents[1],analyzeMarket(store)).some(c=>c.action==='buy'));
}));

test('all agents share the daily cap for copies of the same item',async()=>{
 const {store,h,agents}=world(4),id='night_disinfector_weapon';
 for(let n=0;n<3;n++){
  const seller=n===0?h:human('seller-'+n,[eq(id)]);if(n>0)store.players.push(seller);
  await list(store,seller,id,usdToHundredths(.2));
  const agent=agents[n+1];
  if(n<2)assert.equal((await runAgentTurn(store,agent,{env:{},persist:()=>true})).action,'buy');
  else assert(!proposeActions(store,agent,analyzeMarket(store)).some(c=>c.action==='buy'));
 }
 assert.equal(store.local_market_agent_ledger.items[id],2);
});

test('request replay adds neither a second transfer nor a second journal event',async()=>{
 const seller=human('s',[eq('nuvelor_head')]),buyer=human('b'),store={players:[seller,buyer]};await list(store,seller,'nuvelor_head',100);
 const body={action:'buy',lotId:seller.local_market_lots[0].id,requestId:randomUUID()};await marketCommand(store,buyer,body,true,{persist:()=>true});const before=clone(store);
 await marketCommand(store,buyer,body,true,{persist:()=>true});assert.deepEqual(store,before);
});

test('fast-forward simulation is isolated, repeatable and has no network or signer',async()=>{
 const {runMarketSimulation}=await import('../server/services/market-simulation.js');
 const originalFetch=globalThis.fetch;let networkCalls=0;globalThis.fetch=async()=>{networkCalls++;throw Error('Network forbidden in rehearsal');};
 try{const before={...process.env};const first=await runMarketSimulation(),second=await runMarketSimulation();assert.equal(first.onChainTransfers,0);assert.equal(first.fundsConserved,true);assert.equal(first.days,7);assert.equal(first.rows.length,7);assert.deepEqual(first.rows,second.rows);assert.equal(networkCalls,0);assert.deepEqual({...process.env},before);}finally{globalThis.fetch=originalFetch;}
});
