import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {marketCommand,marketState,localMarketEnabled,npcQuote} from '../server/services/local-market.js';
const item=(id='set4_weapon')=>({id,type:'equipment',slot:'weapon',count:1,enhancementLevel:3});
const setup=()=>{const seller={id:'seller',tentacles:0,inventory_items:[item()],equipped_items:{}},buyer={id:'buyer',inventory_items:[],tentacles:0};return {store:{players:[seller,buyer]},seller,buyer};};
const command=(store,p,b,web=true,persist=()=>true)=>marketCommand(store,p,{requestId:randomUUID(),...b},web,{persist});
test('escrow, purchase, exact fee and replay',async()=>{const {store,seller,buyer}=setup();await command(store,seller,{action:'list',itemId:'set4_weapon',price:10001});assert.equal(seller.inventory_items.length,0);const lot=seller.local_market_lots[0];const body={action:'buy',lotId:lot.id,requestId:randomUUID()};await marketCommand(store,buyer,body,true,{persist:()=>true});assert.equal(buyer.local_market_p4,89999);assert.equal(seller.local_market_p4,109500);assert.equal(seller.local_market_fee_pending,501);assert.equal(buyer.inventory_items[0].enhancementLevel,3);await marketCommand(store,buyer,body,true,{persist:()=>true});assert.equal(buyer.local_market_p4,89999);await assert.rejects(command(store,buyer,{action:'buy',lotId:lot.id}),/LOT_UNAVAILABLE/);});
test('NPC works in Telegram; P4 is web only',async()=>{const {store,seller}=setup();await assert.rejects(command(store,seller,{action:'list',itemId:'set4_weapon',price:1},false),/WEB_ONLY/);await command(store,seller,{action:'npc',itemId:'set4_weapon'},false);assert.equal(seller.tentacles,126500);assert.equal(seller.inventory_items.length,0);assert.deepEqual(marketState(store,seller,false).lots,[]);});
test('equipped, locked, stack and bound items cannot be sold',async()=>{for(const patch of [{locked:true},{bound:true},{nonTransferable:true},{count:2}]){const {store,seller}=setup();Object.assign(seller.inventory_items[0],patch);await assert.rejects(command(store,seller,{action:'npc',itemId:'set4_weapon'}),/ITEM_UNAVAILABLE/);}const {store,seller}=setup();seller.equipped_items.weapon='set4_weapon';await assert.rejects(command(store,seller,{action:'list',itemId:'set4_weapon',price:10}),/ITEM_UNAVAILABLE/);});
test('cancel restores item; other players cannot cancel or self buy',async()=>{const {store,seller,buyer}=setup();await command(store,seller,{action:'list',itemId:'set4_weapon',price:50});const lot=seller.local_market_lots[0];await assert.rejects(command(store,buyer,{action:'cancel',lotId:lot.id}),/NOT_YOUR_LOT/);await assert.rejects(command(store,seller,{action:'buy',lotId:lot.id}),/OWN_LOT/);await command(store,seller,{action:'cancel',lotId:lot.id});assert.equal(seller.inventory_items[0].enhancementLevel,3);});
test('invalid amounts, insufficient balance and failed persistence do not mutate',async()=>{const {store,seller,buyer}=setup();for(const price of [0,-1,1.5,NaN,100000000001])await assert.rejects(command(store,seller,{action:'list',itemId:'set4_weapon',price}),/INVALID_PRICE/);await assert.rejects(command(store,seller,{action:'npc',itemId:'set4_weapon'},true,()=>false),/STORAGE_UNAVAILABLE/);assert.equal(seller.inventory_items.length,1);await command(store,seller,{action:'list',itemId:'set4_weapon',price:200000});await assert.rejects(command(store,buyer,{action:'buy',lotId:seller.local_market_lots[0].id}),/INSUFFICIENT_P4/);assert.equal(seller.local_market_lots[0].status,'active');});
test('concurrent purchases settle once',async()=>{const {store,seller,buyer}=setup();const other={id:'other',inventory_items:[]};store.players.push(other);await command(store,seller,{action:'list',itemId:'set4_weapon',price:100});const lotId=seller.local_market_lots[0].id;const results=await Promise.allSettled([command(store,buyer,{action:'buy',lotId}),command(store,other,{action:'buy',lotId})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(buyer.inventory_items.length+other.inventory_items.length,1);});
test('local market defaults disabled',()=>{assert.equal(localMarketEnabled({socket:{remoteAddress:'127.0.0.1'}}),false);});

test('only boss drops trade; NFT, starter and Battle Pass items stay bound',async()=>{
 const cases=[[{id:'legion_pet',type:'equipment',slot:'pet',count:1,sourceType:'nft_holder'}],[{id:'pet5',type:'equipment',slot:'pet',count:1,sourceType:'nft_holder'}],[{id:'cardboard_head',type:'equipment',slot:'head',count:1,starterEquipment:true}],[{id:'bp_legendary_weapon',type:'equipment',slot:'weapon',count:1}],[{id:'halloween_2026_head',type:'equipment',slot:'head',count:1}],
  ];
 for(const [item] of cases){const seller={id:'s',inventory_items:[item],equipped_items:{}},store={players:[seller]};
  await assert.rejects(command(store,seller,{action:'list',itemId:item.id,price:10}),/ITEM_UNAVAILABLE/);
  if(item.id!=='cardboard_head')await assert.rejects(command(store,seller,{action:'npc',itemId:item.id}),/ITEM_UNAVAILABLE/);}
 // First boss drops (no keycard, farmable on cooldown) and bound farmed drops: scrap only.
 for(const item of [{id:'cardboard_weapon',type:'equipment',slot:'weapon',count:1,bossId:'heli'},{id:'cardboard_head',type:'equipment',slot:'head',count:1,starterEquipment:true},{id:'pet-bot',type:'equipment',slot:'pet',count:1,bossId:'heli'},{id:'set5_legs',type:'equipment',slot:'legs',count:1,marketBound:true}]){
  const seller={id:'s',inventory_items:[item],equipped_items:{},tentacles:0},store={players:[seller]};
  assert.equal(marketState(store,seller,true).items[0].tradable,false);
  await assert.rejects(command(store,seller,{action:'list',itemId:item.id,price:10}),/ITEM_UNAVAILABLE/);
  await command(store,seller,{action:'npc',itemId:item.id});
  assert.equal(seller.tentacles,({cardboard_weapon:1000,cardboard_head:1000,'pet-bot':5000,set5_legs:500000})[item.id]);assert.equal(seller.inventory_items.length,0);
 }
 // Legacy NFT pet without sourceType is recognised by the grant record.
 const legacy={id:'s',inventory_items:[{id:'pet5',type:'equipment',slot:'pet',count:1}],equipped_items:{},holder_pet_grants:{pet5:{tokenId:'7'}}};
 await assert.rejects(command({players:[legacy]},legacy,{action:'list',itemId:'pet5',price:10}),/ITEM_UNAVAILABLE/);
 const boss={id:'s',inventory_items:[{id:'pet5',type:'equipment',slot:'pet',count:1,bossId:'boss4'}],equipped_items:{}};
 await command({players:[boss]},boss,{action:'list',itemId:'pet5',price:10});
 assert.equal(boss.local_market_lots.length,1);
});


test('NPC applies approved set prices, enhancement boundaries and ignores client payout',async()=>{
 for(const [prefix,price] of Object.entries({cardboard:1000,night_disinfector:5000,nuvelor:80000,set4:110000,set5:500000,anubis:615000,shkraban:940000})){
  for(const slot of ['weapon','head','hands','armor','legs','boots'])assert.equal(npcQuote({id:prefix+'_'+slot,enhancementLevel:0}),price);
 }
 assert.equal(npcQuote({id:'shkraban_weapon',enhancementLevel:10}),1410000);
 assert.equal(npcQuote({id:'shkraban_weapon',enhancementLevel:15}),1645000);
 assert.equal(npcQuote({id:'shkraban_weapon',enhancementLevel:999}),1645000);
 assert.equal(npcQuote({id:'shkraban_weapon',enhancementLevel:-5}),940000);
 for(const [id,price] of Object.entries({'pet-bot':5000,'pet-skunk':400000,pet5:500000,'pet-purrgulp':2800000,'pet-toaster':4300000})){assert.equal(npcQuote({id}),price);assert.equal(npcQuote({id,enhancementLevel:15}),price);}
 const {store,seller}=setup();await command(store,seller,{action:'npc',itemId:'set4_weapon',price:999999999});assert.equal(seller.tentacles,126500);
});
