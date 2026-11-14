// Adversarial rehearsal of the market economy: every scenario is a way a player could try to
// drain the AI merchants or bend prices. Each one runs against the real market service and the
// real agent rules in a fresh in-memory store: no network, no keys, no saved game, no LLM.
//
// A scenario reports what the attacker did, what the merchants paid, and the rule that stopped it.
// `control` scenarios are honest trades that must still work, so the rules are not just "refuse all".
import {randomUUID} from 'node:crypto';
import {marketCommand} from './local-market.js';
import {configureAgents,runAgentTurn,analyzeMarket,fairFor,treasuryState,dailyBudgetLeft,policy} from './market-agents.js';
import {FALLBACK_PL4_USD,usdToHundredths} from '../../src/lib/marketPricing.js';

const POLICY_ENV=['MARKET_AGENTS_ENABLED','MARKET_AGENT_MIN_ACCOUNT_DAYS','MARKET_AGENT_MIN_SELLER_LEVEL','MARKET_AGENT_RESALE_DAYS','MARKET_AGENT_SELLS_PER_PLAYER_DAY','MARKET_AGENTS_ITEM_BUYS_PER_DAY','MARKET_AGENTS_DAILY_USD','MARKET_AGENTS_TREASURY_USD','MARKET_AGENT_MAX_BUY_USD','MARKET_AGENT_MAX_HOLDINGS','MARKET_AGENT_FORGE_COST_RATIO','MARKET_AGENT_FORGE_LISTINGS','MARKET_PILOT_BUDGET_USD'];
const SLOTS=['weapon','head','hands','armor','legs','boots'];
const ITEMS=['night_disinfector','nuvelor'].flatMap(set=>SLOTS.map(slot=>`${set}_${slot}`));
const usd=value=>usdToHundredths(value,FALLBACK_PL4_USD);
const RETAIL=usd(0.5),CHEAP=usd(0.2);
// Test PL4 in hundredths -> readable text, using the fixed illustrative quote of the simulation.
const money=hundredths=>`${(hundredths/100).toLocaleString('en-US',{maximumFractionDigits:0})} PL4 (≈ $${(hundredths/100*FALLBACK_PL4_USD).toFixed(2)})`;
const persist=()=>true;
const eq=id=>({id,type:'equipment',slot:id.split('_').at(-1),count:1});
const person=(id,extra={})=>({id,nickname:id,level:100,created_at:'2026-01-01T00:00:00Z',inventory_items:[],equipped_items:{},local_market_p4:usd(100),...extra});

function world(extraPlayers=[]){
  const store={players:[person('smith'),person('hunter'),...extraPlayers],local_market_pl4_usd:FALLBACK_PL4_USD};
  const [smith,hunter]=configureAgents(store,['smith','hunter'],2);
  smith.inventory_items=[];hunter.inventory_items=[];
  store.local_market_treasury_start=treasuryState(store).value;
  const add=player=>{store.players.push(player);return player;};
  const command=(player,body)=>marketCommand(store,player,{requestId:randomUUID(),...body},true,{persist});
  const give=(player,id)=>{player.inventory_items.push(eq(id));};
  const list=async(player,id,price)=>{await command(player,{action:'list',itemId:id,price});return player.local_market_lots.findLast(l=>l.item.id===id&&l.status==='active');};
  // A merchant sells `id` to an ordinary customer. This is the only thing that lets the hunter buy one copy back.
  const retailSale=async(id,index=0)=>{
    const customer=add(person(`customer-${id}-${index}`));
    give(smith,id);const lot=await list(smith,id,RETAIL);
    await command(customer,{action:'buy',lotId:lot.id});
    return customer;
  };
  const agentBuys=()=>(store.local_market_journal||[]).filter(e=>e.action==='buy'&&['smith','hunter'].includes(String(e.actorId)));
  // Let both merchants act until neither buys anything for several rounds.
  const runMerchants=async(rounds=40)=>{
    let idle=0;
    for(let i=0;i<rounds&&idle<6;i++){
      const before=agentBuys().length;
      for(const agent of [hunter,smith])await runAgentTurn(store,agent,{env:{},persist});
      idle=agentBuys().length===before?idle+1:0;
    }
  };
  const total=()=>store.players.reduce((sum,p)=>sum+(p.local_market_p4||0)+(p.local_market_fee_pending||0),0);
  const paidTo=ids=>agentBuys().filter(e=>{const lot=store.players.flatMap(p=>(p.local_market_lots||[]).map(l=>({...l,sellerId:p.id}))).find(l=>l.id===e.lotId);return lot&&ids.includes(String(lot.sellerId));}).reduce((sum,e)=>sum+(e.price||0),0);
  return {store,smith,hunter,add,command,give,list,retailSale,runMerchants,agentBuys,total,paidTo};
}
const rejects=async promise=>{try{await promise;return null;}catch(error){return error.code||error.message;}};

const scenarios=[
  {id:'honest-restock',control:true,title:'Honest trade still works',
   attack:'A merchant sold one item to a customer; one ordinary player offers the same item cheaply.',
   rule:'One retail sale buys at most one identical replacement, for at most 80% of that sale\'s net revenue.',
   async run(){
     const w=world();await w.retailSale(ITEMS[0]);
     const seller=w.add(person('honest'));w.give(seller,ITEMS[0]);await w.list(seller,ITEMS[0],CHEAP);
     await w.runMerchants();
     const buys=w.agentBuys().length;
     return {ok:buys===1,merchantBuys:buys,merchantPaid:w.paidTo(['honest']),detail:`merchant bought ${buys} item for ${money(w.paidTo(['honest']))}`};
   }},
  {id:'supply-flood',title:'Flood the market with 200 drops',
   attack:'200 established accounts list boss drops far below their estimate and wait for the merchants to buy.',
   rule:'No guaranteed buyback: without a prior retail sale there is nothing to replace.',
   async run(){
     const w=world(),ids=[];
     for(let i=0;i<200;i++){const p=w.add(person('flood-'+i));ids.push(p.id);const id=ITEMS[i%ITEMS.length];w.give(p,id);await w.list(p,id,usd(0.05));}
     const before=w.total();await w.runMerchants();
     const paid=w.paidTo(ids);
     return {ok:paid===0&&w.total()===before,merchantBuys:w.agentBuys().length,merchantPaid:paid,detail:`200 listings, merchants bought ${w.agentBuys().length} and paid ${money(paid)}`};
   }},
  {id:'flood-one-ticket',title:'Flood after a single real sale',
   attack:'One item really sold once. 60 accounts then list the same item to share the buyback.',
   rule:'One sale = one replacement; while other copies are on sale the merchant does not buy at all.',
   async run(){
     const w=world(),ids=[];await w.retailSale(ITEMS[0]);
     for(let i=0;i<60;i++){const p=w.add(person('crowd-'+i));ids.push(p.id);w.give(p,ITEMS[0]);await w.list(p,ITEMS[0],CHEAP);}
     await w.runMerchants();
     const buys=w.agentBuys().length;
     return {ok:buys<=1,merchantBuys:buys,merchantPaid:w.paidTo(ids),detail:`60 sellers, merchants bought ${buys} and paid ${money(w.paidTo(ids))}`};
   }},
  {id:'repeat-seller',title:'One player sells again and again',
   attack:'Six different items each sold once at retail; one player offers all six cheaply the same day.',
   rule:'A seller can sell to the merchants once per day.',
   async run(){
     const w=world();for(const id of ITEMS.slice(0,6))await w.retailSale(id);
     const seller=w.add(person('repeat'));
     for(const id of ITEMS.slice(0,6)){w.give(seller,id);await w.list(seller,id,CHEAP);}
     await w.runMerchants();
     const buys=w.agentBuys().length;
     return {ok:buys===1,merchantBuys:buys,merchantPaid:w.paidTo(['repeat']),detail:`6 offers from one seller, merchants bought ${buys} (the one allowed) for ${money(w.paidTo(['repeat']))}`};
   }},
  {id:'linked-accounts',title:'Split across linked accounts',
   attack:'Six game accounts share one verified NEAR wallet and each offers a different item.',
   rule:'Accounts linked by a verified wallet or Telegram identity share one daily limit.',
   async run(){
     const w=world(),ids=[];for(const id of ITEMS.slice(0,6))await w.retailSale(id);
     for(const [i,id] of ITEMS.slice(0,6).entries()){const p=w.add(person('alt-'+i,{near_wallet_verified:true,near_wallet_id:'farmer.near'}));ids.push(p.id);w.give(p,id);await w.list(p,id,CHEAP);}
     await w.runMerchants();
     const buys=w.agentBuys().length;
     return {ok:buys===1,merchantBuys:buys,merchantPaid:w.paidTo(ids),detail:`6 linked accounts, merchants bought ${buys} (the one allowed) for ${money(w.paidTo(ids))}`};
   }},
  {id:'sell-back-loop',title:'Buy from a merchant, sell it back',
   attack:'A player buys a merchant item, relists it, and also passes it through a second account first.',
   rule:'An item that came from a merchant is never bought by a merchant again, whoever holds it.',
   async run(){
     const w=world();await w.retailSale(ITEMS[0],0);await w.retailSale(ITEMS[0],1); // two open replacement allowances
     const first=w.store.players.find(p=>p.id===`customer-${ITEMS[0]}-0`),second=w.add(person('mule'));
     await w.list(first,ITEMS[0],CHEAP);await w.runMerchants(12);
     const direct=w.agentBuys().length;
     const lot=first.local_market_lots.find(l=>l.status==='active');
     await w.command(second,{action:'buy',lotId:lot.id});await w.list(second,ITEMS[0],CHEAP);await w.runMerchants(12);
     const buys=w.agentBuys().length;
     return {ok:direct===0&&buys===0,merchantBuys:buys,merchantPaid:w.paidTo([first.id,'mule']),detail:`direct resale and resale through a second account: merchants bought ${buys}`};
   }},
  {id:'fresh-accounts',title:'Throwaway accounts',
   attack:'A brand-new account and a low-level account offer an item the merchant is allowed to replace.',
   rule:'Sellers need a minimum level and account age before merchants trade with them.',
   async run(){
     const w=world();await w.retailSale(ITEMS[0],0);await w.retailSale(ITEMS[1],0);
     const fresh=w.add(person('fresh',{created_at:new Date().toISOString()})),low=w.add(person('low',{level:5}));
     w.give(fresh,ITEMS[0]);await w.list(fresh,ITEMS[0],CHEAP);w.give(low,ITEMS[1]);await w.list(low,ITEMS[1],CHEAP);
     await w.runMerchants();
     const buys=w.agentBuys().length,rules=policy();
     return {ok:buys===0,merchantBuys:buys,merchantPaid:w.paidTo(['fresh','low']),detail:`needs level ${rules.minSellerLevel} and ${rules.minAccountDays} days; merchants bought ${buys}`};
   }},
  {id:'overpriced',title:'Ask for more than the sale earned',
   attack:'After a real sale, a player offers the replacement at the full retail price.',
   rule:'The merchant pays at most 80% of the net revenue of the sale it replaces.',
   async run(){
     const w=world();await w.retailSale(ITEMS[0]);
     const seller=w.add(person('greedy'));w.give(seller,ITEMS[0]);await w.list(seller,ITEMS[0],RETAIL);
     await w.runMerchants();
     const buys=w.agentBuys().length;
     return {ok:buys===0,merchantBuys:buys,merchantPaid:w.paidTo(['greedy']),detail:`asked ${money(RETAIL)}, limit ${money(Math.floor((RETAIL-Math.ceil(RETAIL*0.05))*0.8))}; merchants bought ${buys}`};
   }},
  {id:'daily-budget',title:'Many honest-looking sellers at once',
   attack:'Twelve different items sold at retail twice each; 24 separate established players offer replacements.',
   rule:'All merchants share one daily spending cap and buy at most two copies of an item per day.',
   async run(){
     const w=world(),ids=[];
     for(const id of ITEMS){await w.retailSale(id,0);await w.retailSale(id,1);}
     const start=dailyBudgetLeft(w.store);
     for(const [i,id] of [...ITEMS,...ITEMS].entries()){const p=w.add(person('seller-'+i));ids.push(p.id);w.give(p,id);await w.list(p,id,CHEAP);}
     await w.runMerchants(80);
     const paid=w.paidTo(ids),perItem=Math.max(0,...ITEMS.map(id=>w.agentBuys().filter(e=>e.itemId===id).length));
     return {ok:paid<=start&&perItem<=policy().itemBuysPerDay,merchantBuys:w.agentBuys().length,merchantPaid:paid,detail:`24 offers; merchants bought ${w.agentBuys().length} and paid ${money(paid)} of the ${money(start)} daily cap, at most ${perItem} per item and ${policy().maxHoldings} items held per merchant`};
   }},
  {id:'wash-trading',title:'Fake trades to raise the price estimate',
   attack:'Two accounts on one wallet trade an item back and forth at 20x its value; then two unrelated accounts repeat one inflated trade ten times.',
   rule:'Linked accounts never set prices, a pair of players counts once, and the estimate stays within 30% of the price list.',
   async run(){
     const w=world(),id=ITEMS[0];
     const base=fairFor(analyzeMarket(w.store),{id},w.store);
     const a=w.add(person('wash-a',{near_wallet_verified:true,near_wallet_id:'wash.near'})),b=w.add(person('wash-b',{near_wallet_verified:true,near_wallet_id:'wash.near'}));
     w.give(a,id);let holder=a,other=b;
     for(let i=0;i<10;i++){const lot=await w.list(holder,id,base*20);await w.command(other,{action:'buy',lotId:lot.id});[holder,other]=[other,holder];}
     const linked=fairFor(analyzeMarket(w.store),{id},w.store);
     const c=w.add(person('pump-c')),d=w.add(person('pump-d'));
     const lot0=await w.list(holder,id,1);await w.command(c,{action:'buy',lotId:lot0.id});holder=c;other=d;
     for(let i=0;i<10;i++){const lot=await w.list(holder,id,base*20);await w.command(other,{action:'buy',lotId:lot.id});[holder,other]=[other,holder];}
     const pumped=fairFor(analyzeMarket(w.store),{id},w.store);
     return {ok:linked===base&&pumped<=Math.round(base*1.3),merchantBuys:w.agentBuys().length,merchantPaid:0,detail:`estimate ${money(base)} -> ${money(linked)} after 10 linked trades at 20x -> ${money(pumped)} after 10 repeated pair trades at 20x (hard ceiling ${money(Math.round(base*1.3))})`};
   }},
  {id:'replay',title:'Replay a payment request',
   attack:'A buyer sends the same purchase request twice, then reuses its request id for a different purchase.',
   rule:'Every request has an id: a repeat changes nothing and a reused id with different contents is refused.',
   async run(){
     const w=world();w.give(w.smith,ITEMS[0]);w.give(w.smith,ITEMS[1]);
     const lot=await w.list(w.smith,ITEMS[0],RETAIL),lot2=await w.list(w.smith,ITEMS[1],RETAIL),buyer=w.add(person('replayer'));
     const request={action:'buy',lotId:lot.id,requestId:randomUUID()};
     await marketCommand(w.store,buyer,request,true,{persist});
     const after=buyer.local_market_p4,items=buyer.inventory_items.length;
     await marketCommand(w.store,buyer,request,true,{persist});
     const reused=await rejects(marketCommand(w.store,buyer,{...request,lotId:lot2.id},true,{persist}));
     return {ok:buyer.local_market_p4===after&&buyer.inventory_items.length===items&&reused==='REQUEST_ID_REUSED',merchantBuys:0,merchantPaid:0,detail:`charged once (${money(usd(100)-after)}), one item delivered, reused id answered ${reused}`};
   }},
];

/** Runs every scenario. Returns a report; `passed` is false if any attack got through or an honest trade failed. */
export async function runAttackDemo(){
  const saved=Object.fromEntries(POLICY_ENV.map(key=>[key,process.env[key]]));
  for(const key of POLICY_ENV)delete process.env[key];
  try{
    const results=[];
    for(const scenario of scenarios){
      let outcome;
      try{outcome=await scenario.run();}catch(error){outcome={ok:false,merchantBuys:null,merchantPaid:null,detail:'scenario failed: '+(error.code||error.message)};}
      results.push({id:scenario.id,title:scenario.title,control:Boolean(scenario.control),attack:scenario.attack,rule:scenario.rule,
        result:scenario.control?(outcome.ok?'works':'BROKEN'):(outcome.ok?'blocked':'GOT THROUGH'),...outcome});
    }
    const attacks=results.filter(r=>!r.control);
    return {mode:'simulation',network:false,llm:false,passed:results.every(r=>r.ok),attacks:attacks.length,blocked:attacks.filter(r=>r.ok).length,
      merchantSpendHundredths:attacks.reduce((sum,r)=>sum+(r.merchantPaid||0),0),merchantSpend:money(attacks.reduce((sum,r)=>sum+(r.merchantPaid||0),0)),results};
  }finally{
    for(const key of POLICY_ENV){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
  }
}
