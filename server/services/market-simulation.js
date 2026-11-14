import {randomUUID} from 'node:crypto';
import {marketCommand} from './local-market.js';
import {configureAgents,analyzeMarket,fairFor,runAgentTurn,treasuryState,policy} from './market-agents.js';
import {FALLBACK_PL4_USD,usdToHundredths} from '../../src/lib/marketPricing.js';
// Fixed-seed offline stress rehearsal: a scenario, not a profit forecast.
export async function runMarketSimulation(){
const eq=id=>({id,type:'equipment',slot:id.split('_').at(-1),count:1});
const human=id=>({id,nickname:id,level:100,created_at:'2026-01-01T00:00:00Z',equipped_items:{},inventory_items:[],local_market_p4:usdToHundredths(50)});
const humans=Array.from({length:6},(_,i)=>human('player-'+i));
const store={players:[...humans,human('smith'),human('hunter')],local_market_pl4_usd:FALLBACK_PL4_USD};
const agents=configureAgents(store,['smith','hunter'],2),persist=()=>true;
const startingTotal=store.players.reduce((n,p)=>n+p.local_market_p4,0);
const pool=['night_disinfector_weapon','night_disinfector_head','night_disinfector_boots','nuvelor_hands','nuvelor_legs','nuvelor_head'];
let seed=7,now=Date.parse('2026-11-11T00:00:00Z');const rnd=()=>((seed=seed*16807%2147483647)/2147483647);
const rows=[];let failures=0;
for(let day=0;day<7;day++){
 for(let tick=0;tick<144;tick++){
  now+=600000;const h=humans[Math.floor(rnd()*humans.length)];
  if(rnd()<.3){const id=pool[Math.floor(rnd()*pool.length)];if(!h.inventory_items.some(i=>i.id===id)&&!(h.local_market_lots||[]).some(l=>l.status==='active'&&l.item.id===id)){
   h.inventory_items.push(eq(id));const price=Math.round(fairFor(analyzeMarket(store,now),eq(id),store)*(.4+rnd()));
   await marketCommand(store,h,{requestId:randomUUID(),action:'list',itemId:id,price},true,{persist,now});
  }}
  if(rnd()<.2){const lot=agents.flatMap(a=>(a.local_market_lots||[]).filter(l=>l.status==='active')).find(l=>l.price<=h.local_market_p4&&!h.inventory_items.some(i=>i.id===l.item.id));if(lot)await marketCommand(store,h,{requestId:randomUUID(),action:'buy',lotId:lot.id},true,{persist,now}).catch(()=>{failures++;});}
  await runAgentTurn(store,agents[tick%agents.length],{env:{},persist,now});
 }
 const treasury=treasuryState(store),dayKey=new Date(now).toISOString().slice(0,10);
 rows.push({day:day+1,at:dayKey,cash:treasury.cash,stockAtCost:treasury.stock,treasuryChange:treasury.pnl,feeIncome:treasury.fees,dailySpent:store.local_market_agent_ledger?.spent || 0,paused:!!store.local_market_agents_paused,activeLots:store.players.flatMap(p=>p.local_market_lots || []).filter(l=>l.status==='active').length});
}
const total=store.players.reduce((n,p)=>n+p.local_market_p4,0)+(store.local_market_burned || 0);
if(total!==startingTotal)throw Error('SIMULATED_FUNDS_NOT_CONSERVED');
const report={mode:'simulation',seed:7,settings:policy(),quote:{priceUsd:FALLBACK_PL4_USD,source:'fixed illustrative fallback; no live RPC'},onChainTransfers:0,humanPlayers:6,agents:2,days:7,rows,journalEntries:store.local_market_journal.length,rejectedRaces:failures,fundsConserved:true,limitation:'One fixed-seed simulated scenario under the current local policy; not a profitability forecast or production load test.'};
return report;
}

let cached,pending;
export async function getMarketSimulation(){
  if(cached && Date.now()-cached.at<60000)return cached.report;
  if(!pending)pending=runMarketSimulation().then(report=>{cached={at:Date.now(),report};return report;}).finally(()=>{pending=null;});
  return pending;
}

