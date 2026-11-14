import {randomUUID} from 'node:crypto';
import {configureAgents,proposeActions,analyzeMarket,llmChoose,marketAgentsView,policy} from './market-agents.js';
import {mainnetAgentsEnabled} from './market-mainnet-runtime.js';
import {mainnetBookProjection,marketBookCommand} from './market-mainnet-book.js';
const accounts={smith:'tor.nuvelorian.near',hunter:'grym.nuvelorian.near'};
export function initializeMainnetAgents(book){
 if(book.agents)return;
 book.agents=Object.keys(accounts).map(key=>({id:'mainnet-agent-'+key,inventory_items:[],equipped_items:{},near_wallet_verified:true,near_wallet_id:accounts[key],created_at:'2026-01-01T00:00:00Z'}));
 const projection={players:book.agents,local_market_pl4_usd:book.budgetQuote};
 configureAgents(projection,book.agents.map(a=>a.id),2);
 for(const agent of book.agents){agent.local_market_p4=0;agent.ai_agent.budget=0;agent.ai_agent.nearAccount=accounts[agent.ai_agent.key];for(const item of agent.inventory_items)item.forged=true;}
 book.agentFeed=[];
}
export async function chooseMainnetAgentAction(book,players,agentId,{fetchImpl=fetch,env={}}={}){
 if(!policy().enabled)return null;
 const projection=mainnetBookProjection(book,players),agent=projection.players.find(a=>a.id===agentId);
 const market=analyzeMarket(projection),candidates=proposeActions(projection,agent,market);
 if(!candidates.length)return null;
 const choice=await llmChoose({agent,candidates,market,fetchImpl,env});
 if(choice?.index===-1)return null;
 return {...candidates[choice?choice.index:0],say:choice?.say||'',ai:Boolean(choice)};
}
export function applyMainnetAgentAction(book,players,agentId,candidate){
 if(!policy().enabled)return null;
 const agent=book.agents.find(a=>a.id===agentId),projection=mainnetBookProjection(book,players);
 const view=projection.players.find(a=>a.id===agentId);
 const valid=proposeActions(projection,view,analyzeMarket(projection)).some(c=>c.action===candidate.action&&c.itemId===candidate.itemId&&c.lotId===candidate.lotId&&c.price===candidate.price);
 if(!valid)return null;
 let result;
 if(candidate.action==='craft'){
  if(candidate.price!==0)return null;
  agent.inventory_items.push({id:candidate.itemId,type:'equipment',slot:candidate.itemId.split('_').at(-1),count:1,instanceId:randomUUID(),forged:true,agentCost:0});
  result={action:'craft',itemId:candidate.itemId};
  book.journal.push({id:randomUUID(),actorId:agent.id,action:'craft',price:0,itemId:candidate.itemId,at:new Date().toISOString()});
 }else result=marketBookCommand(book,players,agent,{action:candidate.action==='buy'?'reserve':candidate.action,itemId:candidate.itemId,lotId:candidate.lotId,price:candidate.price,requestId:randomUUID()});
 book.agentFeed=[...(book.agentFeed||[]),{id:randomUUID(),at:new Date().toISOString(),agent:agent.ai_agent.key,name:agent.ai_agent.name,action:candidate.action==='buy'?'wait':candidate.action,itemId:candidate.itemId,price:candidate.price,fair:candidate.fair,say:candidate.say,ai:candidate.ai}].slice(-40);
 return result;
}
export function mainnetAgentView(book,players){
 const view=marketAgentsView(mainnetBookProjection(book,players));
 view.treasury.pnl=null;view.paused ||=!mainnetAgentsEnabled();
 view.dailyLeft=Math.max(0,Math.min(view.dailyLeft,book.capHundredths-book.orders.reduce((sum,o)=>sum+o.price,0)));
 return {...view,feed:(book.agentFeed||[]).slice().reverse(),llm:Boolean(book.agentAiConfigured)};
}
