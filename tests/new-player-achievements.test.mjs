import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_ACHIEVEMENTS, ACHIEVEMENT_REWARDS } from '../src/lib/playerAchievements.js';
import { reconcilePlayerAchievements, recordFishingAchievement, recordDonationAchievement, recordBossTimeoutAchievement } from '../server/utils/playerAchievements.js';
import { enhanceEquipment } from '../server/utils/equipmentForge.js';
import { createEquipmentForge } from '../server/services/equipment-forge.js';
import { expireStaleBossFights } from '../server/utils/clanBossDamage.js';
import { tickShipFight } from '../server/utils/clanShip.js';
import { createPaymentService } from '../server/services/payment-service.js';
const slots = ['weapon','head','hands','armor','legs','boots'];
const set = (level=0, prefix='cardboard') => slots.map(slot=>({id:prefix+'_'+slot,type:'equipment',slot,count:1,enhancementLevel:level}));

test('all 14 achievements have localized names, hints and rewards; old packs unchanged',()=>{
  assert.equal(PLAYER_ACHIEVEMENTS.length,14);
  assert.equal(new Set(PLAYER_ACHIEVEMENTS.map(a=>a.id)).size,14);
  for(const item of PLAYER_ACHIEVEMENTS){for(const lang of ['uk','ru','en']){assert.equal(item[lang].length,2);assert.ok(item[lang].every(s=>typeof s==='string'&&s.length>5));}assert.ok(ACHIEVEMENT_REWARDS[item.id]);}
  assert.deepEqual(ACHIEVEMENT_REWARDS.greed_saved,{smallPoison:60,mediumPoison:40,largePoison:20});
});

test('complete sets require six distinct slots of the same known set, all +15 for upgraded set',()=>{
  for(const inventory_items of [set().slice(1),Array(6).fill(set()[0]),set().map((i,n)=>n===0?{...i,id:'set4_weapon'}:i)]){
    const p={inventory_items};reconcilePlayerAchievements(p);assert.equal(p.player_achievements,undefined);
  }
  const p={inventory_items:set(15)};p.inventory_items[5].enhancementLevel=14;
  reconcilePlayerAchievements(p);assert.ok(p.player_achievements.first_full_set);assert.equal(p.player_achievements.full_set_plus_15,undefined);
  p.inventory_items[5].enhancementLevel=15;reconcilePlayerAchievements(p);assert.ok(p.player_achievements.full_set_plus_15);
  const receipt=p.player_achievements.full_set_plus_15;reconcilePlayerAchievements(p);assert.equal(p.player_achievements.full_set_plus_15,receipt);
});

test('karma counts received reactions independently and includes existing totals',()=>{
  const p={likes_received_count:499,dislikes_received_count:99};reconcilePlayerAchievements(p);assert.equal(p.player_achievements,undefined);
  p.likes_received_count=500;p.dislikes_received_count=100;reconcilePlayerAchievements(p);
  assert.ok(p.player_achievements.positive_karma_500);assert.ok(p.player_achievements.negative_karma_100);
});

test('fishing catches reset miss streak, third consecutive miss unlocks',()=>{
  const p={};for(const caught of [false,false,true,false,false])recordFishingAchievement(p,caught);
  assert.equal(p.player_achievements,undefined);recordFishingAchievement(p,false);assert.ok(p.player_achievements.three_empty_casts);
});

test('donation requires new confirmed server-marked order of at least $5, never old or pending orders',()=>{
  const p={},order={id:'new',status:'success',usd_price:'5.00',exchange_rate_snapshot:{achievementDonationV1:true}};
  for(const invalid of [{...order,usd_price:'4.99'},{...order,usd_price:'NaN'},{...order,status:'pending'},{...order,exchange_rate_snapshot:{}}])assert.equal(recordDonationAchievement(p,invalid),false);
  assert.equal(recordDonationAchievement(p,order),true);assert.equal(recordDonationAchievement(p,order),false);
});

test('new payment marker survives database reload and confirmed payment unlocks donation once',async()=>{
  const rows=new Map(),p={};let grants=0;
  const service=createPaymentService({
    fetchRates:async()=>({tonUsd:'2.50',nearUsd:'5.00',starsPerUsd:100}),
    catalog:{gemPacks:[{id:'achievement_test_pack',usd:5,paymentMethods:['ton']}]},
    db:{
      createTransaction:async t=>{rows.set(t.id,structuredClone(t));},
      findTransactionById:async id=>structuredClone(rows.get(id)),
      findTransactionByHash:async()=>null,
      updateTransaction:async(id,patch)=>{const next={...rows.get(id),...patch};rows.set(id,next);return next;},
    },
    grantReward:async({transaction})=>{grants++;recordDonationAchievement(p,transaction);},
  });
  const order=await service.purchase({itemId:'achievement_test_pack',userId:'p',paymentMethod:'ton'});
  assert.equal(rows.get(order.id).exchange_rate_snapshot.achievementDonationV1,true);
  assert.equal(p.player_achievements,undefined);
  const confirmation={orderId:order.id,txHash:'achievement-tx',amount:order.tonAmountLocked,recipient:order.ton_receiver,confirmed:true};
  await service.confirmTonPayment(confirmation);await service.confirmTonPayment(confirmation);
  assert.equal(grants,1);assert.ok(p.player_achievements.generous_soul);
});

test('gum failures use committed attempts, success resets, replay never counts twice',()=>{
  const p={id:'gum',level:80,inventory_items:set(),enhancement_gums:{normal:40,premium:2}};
  const attempt=(n,success=false)=>{const i=p.inventory_items[0];return enhanceEquipment(p,{action:'enhance',instanceId:i.id,version:i.enhancementVersion||0,gum:success?'premium':'normal',requestId:'achievement-gum-'+String(n).padStart(4,'0')},{rng:()=>.999999});};
  for(let i=0;i<9;i++)attempt(i);assert.equal(p.player_achievements.gum_no_upgrade_10,undefined);
  attempt(9,true);assert.equal(p.achievement_progress.gumMisses,0);
  for(let i=10;i<19;i++)attempt(i);assert.equal(p.player_achievements.gum_no_upgrade_10,undefined);
  const item=p.inventory_items[0],body={action:'enhance',instanceId:item.id,version:item.enhancementVersion,gum:'normal',requestId:'achievement-gum-final'};
  enhanceEquipment(p,body,{rng:()=>.999999});assert.ok(p.player_achievements.gum_no_upgrade_10);
  const receipt=p.player_achievements.gum_no_upgrade_10;enhanceEquipment(p,body);assert.equal(p.achievement_progress.gumMisses,10);assert.equal(p.player_achievements.gum_no_upgrade_10,receipt);
});

test('forge storage failure leaves streak and achievement untouched; successful commit returns both',async()=>{
  const p={id:'forge-ach',level:80,inventory_items:set(),enhancement_gums:{premium:1},achievement_progress:{gumMisses:9}};
  const body={action:'enhance',instanceId:'cardboard_weapon',version:0,gum:'premium',requestId:'achievement-forge-commit'};
  const before=JSON.stringify(p);
  await assert.rejects(createEquipmentForge({store:{players:[p]},persistLocal:async()=>false}).enhance(p,body),/FORGE_STORAGE_UNAVAILABLE/);
  assert.equal(JSON.stringify(p),before);
  const result=await createEquipmentForge({store:{players:[p]},persistLocal:async()=>true}).enhance(p,body);
  assert.equal(p.achievement_progress.gumMisses,0);assert.ok(result.player_achievements.first_full_set);
});

test('timeout requires surviving boss strictly under 20%, rewards owner and damaging contributors only',()=>{
  const players=[{id:'owner',created_by:'o'},{id:'helper'},{id:'outsider'}];
  const f={id:'f',opened_by_email:'o',max_hp:100,current_hp:20,status:'expired',participants:{helper:{damage:3}}};
  recordBossTimeoutAchievement(f,players);assert.equal(players[0].player_achievements,undefined);
  for(const status of ['dead','active'])recordBossTimeoutAchievement({...f,current_hp:19,status},players);
  assert.equal(players[0].player_achievements,undefined);
  recordBossTimeoutAchievement({...f,current_hp:0},players);assert.equal(players[0].player_achievements,undefined);
  recordBossTimeoutAchievement({...f,current_hp:19},players);assert.ok(players[0].player_achievements.almost_finished);assert.ok(players[1].player_achievements.almost_finished);assert.equal(players[2].player_achievements,undefined);
});

test('personal and ship expiration paths award timeout achievement',()=>{
  const now=Date.now(),p={id:'p',created_by:'owner'};
  const personal={id:'personal',opened_by_email:'owner',started_at:new Date(now-7*3600000).toISOString(),status:'active',current_hp:19,max_hp:100};
  assert.equal(expireStaleBossFights([personal],now,[p]),1);assert.ok(p.player_achievements.almost_finished);
  const member={id:'member'},ship={id:'ship',status:'active',current_hp:19,max_hp:100,ends_at:new Date(now-1).toISOString(),participants:{member:{damage:81}}};
  tickShipFight({},ship,[member],{now});assert.equal(ship.status,'expired');assert.ok(member.player_achievements.almost_finished);
});
