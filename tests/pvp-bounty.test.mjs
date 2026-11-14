import test from 'node:test';import assert from 'node:assert/strict';
import {createDuelService} from '../server/services/pvp-duel.js';
import {createBountyLedger,profitFromLocalStore,profitFromMainnetBook,bountyPolicy} from '../server/services/pvp-bounty.js';
import {usdToHundredths} from '../src/lib/marketPricing.js';
const preset={set:'cardboard_survivor',enhancement:15,talents:0};
const prize=usdToHundredths(0.05),usd=v=>usdToHundredths(v);
const policy={...bountyPolicy({}),enabled:true};
const winDuel=(s,key,merchant)=>{let m=s.start(key,preset,{merchant});while(m.status==='active')m=s.choose(key,{matchId:m.id,round:m.round,choice:'poison'});return m;};
test('profit = proceeds after fee minus cost basis, merchants only',()=>{
 const store={players:[
  {ai_agent:{key:'smith'},local_market_lots:[{status:'sold',price:1000,fee:50,item:{agentCost:0}},{status:'active',price:9999,item:{}}]},
  {ai_agent:{key:'hunter'},local_market_lots:[{status:'sold',price:1000,fee:50,item:{agentCost:800}},{status:'sold',price:500,fee:25,item:{agentCost:900}}]},
  {ai_agent:{key:'maker'},local_market_lots:[{status:'sold',price:5000,fee:0,item:{}}]},
  {local_market_lots:[{status:'sold',price:7000,item:{}}]}]};
 assert.deepEqual(profitFromLocalStore(store),{smith:950,hunter:150});
 assert.deepEqual(profitFromMainnetBook({lots:[{sellerAi:true,sellerWallet:'tor.nuvelorian.near',status:'sold',price:200,fee:10,item:{}},{sellerAi:false,sellerWallet:'grym.nuvelorian.near',status:'sold',price:200,item:{}}]}),{smith:190,hunter:0});
});
test('no realised profit -> no offer, no prize; losing costs nothing',()=>{
 const ledger=createBountyLedger({profit:()=>({smith:0,hunter:0}),policy});
 const s=createDuelService({random:()=>0,bounty:ledger});
 const m=winDuel(s,'p','smith');assert.equal(m.result,'win');assert.equal(m.bounty,null);assert.equal(ledger.awards().length,0);
});
test('win vs merchant pays once from profit share; per-player daily limit; idempotent',()=>{
 const ledger=createBountyLedger({profit:()=>({smith:usd(1),hunter:usd(1)}),policy,now:()=>0});
 const s=createDuelService({random:()=>0,now:()=>0,bounty:ledger});
 const m=winDuel(s,'p','smith');
 assert.equal(m.opponent.name,'Тор');assert.equal(m.bounty.amount,prize);assert.deepEqual(m.bounty.award,{amount:prize,status:'pending_payout'});
 assert.equal(ledger.award({matchId:m.id,playerKey:'p',agentKey:'smith'}).amount,prize);assert.equal(ledger.awards().length,1);
 assert.equal(ledger.quote('p','smith'),null,'one prize per merchant per player per day');
 assert.equal(ledger.quote('p','hunter').amount,prize);
 assert.equal(winDuel(s,'p','smith').bounty,null);
 assert.equal(s.standings('p').merchants.find(x=>x.agentKey==='smith').prize,0);
});
test('loss / abandon vs merchant pays nothing',()=>{
 const ledger=createBountyLedger({profit:()=>({smith:usd(1),hunter:usd(1)}),policy});
 const s=createDuelService({random:()=>0,bounty:ledger});
 let m=s.start('p',preset,{merchant:'hunter'});assert.equal(m.opponent.name,'Грим');assert.ok(m.bounty.amount>0);
 s.abandon('p');assert.equal(ledger.awards().length,0);
});
test('prizes never exceed profit share or merchant daily cap',()=>{
 let t=0;const ledger=createBountyLedger({profit:()=>({smith:prize*5,hunter:usd(100)}),policy,now:()=>t});
 for(let i=0;i<20;i++)ledger.award({matchId:'s'+i,playerKey:'p'+i,agentKey:'smith'});
 assert.equal(ledger.awards().filter(a=>a.agentKey==='smith').length,2,'50% of 5 prizes = 2 prizes');
 for(let i=0;i<40;i++)ledger.award({matchId:'h'+i,playerKey:'p'+i,agentKey:'hunter'});
 assert.equal(ledger.awards().filter(a=>a.agentKey==='hunter').length,10,'$0.50/day cap at $0.05 prize');
 t=86400000;assert.ok(ledger.award({matchId:'next-day',playerKey:'p0',agentKey:'hunter'}));
});
test('unknown merchant rejected; disabled policy offers nothing',()=>{
 const s=createDuelService({random:()=>0,bounty:createBountyLedger({profit:()=>({smith:usd(1),hunter:usd(1)}),policy:{...policy,enabled:false}})});
 assert.throws(()=>s.start('p',preset,{merchant:'collector'}),/UNKNOWN_MERCHANT/);
 assert.equal(s.start('p',preset,{merchant:'smith'}).bounty,null);
});
