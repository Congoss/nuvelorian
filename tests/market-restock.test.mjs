import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {marketCommand} from '../server/services/local-market.js';
import {restockTicket} from '../server/services/market-restock.js';
const item=(extra={})=>({id:'night_disinfector_weapon',type:'equipment',slot:'weapon',count:1,...extra});
const player=(id,inventory_items=[])=>({id,inventory_items,equipped_items:{},local_market_p4:100000});
const cmd=(s,p,b,options={})=>marketCommand(s,p,{requestId:randomUUID(),...b},true,{persist:()=>true,...options});
async function fixture(){
 const bot=player('bot',[item()]);bot.ai_agent={key:'smith'};
 const buyer=player('buyer'),farmer=player('farmer',[item()]),store={players:[bot,buyer,farmer]};
 await cmd(store,bot,{action:'list',itemId:item().id,price:10000});
 await cmd(store,buyer,{action:'buy',lotId:bot.local_market_lots[0].id});
 await cmd(store,farmer,{action:'list',itemId:item().id,price:7000});
 return {store,bot,buyer,farmer,lot:farmer.local_market_lots[0]};
}
test('no sales means no farm purchases, even with a funded treasury and 1000 cheap listings',()=>{
 const bot=player('bot');bot.ai_agent={key:'hunter'};
 const farmers=Array.from({length:1000},(_,n)=>({...player('farmer'+n),local_market_lots:[{id:'l'+n,status:'active',price:1,item:item()}]}));
 const store={players:[bot,...farmers]};
 for(const farmer of farmers)assert.equal(restockTicket(store,{...farmer.local_market_lots[0],sellerId:farmer.id}),null);
});
test('one real sale funds one replacement, persists consumed credit, and failed saves consume nothing',async()=>{
 const {store,bot,farmer,lot}=await fixture();
 assert.equal(restockTicket(store,{...lot,sellerId:farmer.id}).maxPrice,7600);
 assert.equal(restockTicket(store,{...lot,price:7601,sellerId:farmer.id}),null);
 const options={agentTrade:{validate:()=>true}};
 const before=structuredClone(store);
 await assert.rejects(cmd(store,bot,{action:'buy',lotId:lot.id},{...options,persist:()=>false}),/STORAGE/);assert.deepEqual(store,before);
 const request={requestId:randomUUID(),action:'buy',lotId:lot.id};
 await marketCommand(store,bot,request,true,{persist:()=>true,...options});
 await marketCommand(store,bot,request,true,{persist:()=>true,...options});
 const restarted=structuredClone(store);const retail=restarted.players[0].local_market_lots[0];assert.equal(retail.restockConsumedBy,lot.id);
 assert.equal(restockTicket(restarted,{...lot,id:'another',sellerId:farmer.id}),null);
 assert.equal(bot.inventory_items.length,1);
});
test('origin, exact enhancement and buyer identity cannot be laundered into eligible replacement demand',async()=>{
 const {store,farmer,lot,buyer}=await fixture();
 for(const patch of [{agentOrigin:true},{agentSoldAt:'2000-01-01'},{forged:true},{enhancementLevel:1}])assert.equal(restockTicket(store,{...lot,item:item(patch),sellerId:farmer.id}),null);
 Object.assign(farmer,{near_wallet_verified:true,near_wallet_id:'same.near'});Object.assign(buyer,{near_wallet_verified:true,near_wallet_id:'same.near'});
 assert.equal(restockTicket(store,{...lot,sellerId:farmer.id}),null);
});
test('shared pilot cap survives restart and blocks a second agent in a race',async()=>{
 const {store,bot,farmer,lot}=await fixture();
 const otherBot=player('otherBot');otherBot.ai_agent={key:'hunter'};store.players.push(otherBot);
 const otherFarmer=player('otherFarmer',[item()]);store.players.push(otherFarmer);
 await cmd(store,otherFarmer,{action:'list',itemId:item().id,price:7000});
 bot.local_market_lots.push({...structuredClone(bot.local_market_lots[0]),id:'second-retail-sale'});
 store.local_market_pilot_budget={maxHundredths:7000,baselineSpent:0};
 const outcomes=await Promise.allSettled([[bot,lot],[otherBot,otherFarmer.local_market_lots[0]]].map(([actor,l])=>cmd(store,actor,{action:'buy',lotId:l.id},{agentTrade:{validate:()=>true}})));
 assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
 const restarted=structuredClone(store);
 assert.equal(restockTicket(restarted,{...lot,id:'after-restart',sellerId:farmer.id}),null);
});
