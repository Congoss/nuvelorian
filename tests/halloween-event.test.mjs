import { FEATURE_FLAGS } from '../src/lib/featureFlags.js';
FEATURE_FLAGS.halloween = true;
import test from 'node:test';
import assert from 'node:assert/strict';
import { HALLOWEEN, halloweenState, earnPumpkin, exchangePumpkins, purchasePumpkinReward, claimHalloweenMilestone } from '../src/lib/halloweenEvent.js';
import { applyPlayerAction } from '../server/utils/playerActions.js';
import { shouldReceiveBossFightDamageReward } from '../server/utils/clanBossDamage.js';
const now=Date.parse(HALLOWEEN.startAt)+86400000+43200000;
test('legacy exchanged pumpkins are restored to ranking score',()=>{
 const p={halloween_event:{id:HALLOWEEN.id,balance:45,earned:45,purchases:{energy:1}}};
 assert.equal(halloweenState(p,now).activityEarned,35);
 assert.equal(halloweenState(p,now).activityTotal,45);
});
test('exchange has daily allowance, rolls over up to three days and increases ranking score',()=>{
 const p={tentacles:10000000};
 assert.equal(halloweenState(p,now).exchangeAvailable,30);
 exchangePumpkins(p,30,now);assert.equal(p.tentacles,9250000);
 assert.equal(halloweenState(p,now).balance,30);
 assert.equal(halloweenState(p,now).activityEarned||0,30);
 assert.equal(halloweenState(p,now).activityTotal||0,30);
 assert.throws(()=>exchangePumpkins(p,1,now));
 assert.equal(halloweenState(p,now+86400000).exchangeAvailable,15);
 assert.equal(halloweenState(p,now+10*86400000).exchangeAvailable,45);
 for(const qty of [-1,0,1.1,NaN,Infinity])assert.throws(()=>exchangePumpkins(p,qty,now));
});
test('closed event cannot earn, exchange, buy or claim',()=>{
 const p={tentacles:1000000};const late=Date.parse(HALLOWEEN.endAt);
 assert.equal(earnPumpkin(p,'daily',{now:late}),0);
 assert.throws(()=>exchangePumpkins(p,1,late));assert.throws(()=>purchasePumpkinReward(p,'energy',late));assert.throws(()=>claimHalloweenMilestone(p,10,late));assert.equal(p.halloween_event,undefined);
});
test('every drop awards one pumpkin, with pity, caps and UTC reset',()=>{
 const p={};for(let i=0;i<4;i++)assert.equal(earnPumpkin(p,'boss',{now,rng:()=>1}),0);
 assert.equal(earnPumpkin(p,'boss',{now,rng:()=>1}),1);
 assert.equal(earnPumpkin(p,'quest',{now,rng:()=>0}),1);
 assert.equal(earnPumpkin(p,'fishing',{now,rng:()=>0}),1);
 assert.equal(earnPumpkin(p,'fishing',{now,rng:()=>0}),1);
 for(let i=0;i<30;i++)earnPumpkin(p,'boss',{now,rng:()=>0});
 assert.equal(halloweenState(p,now).daily.boss,20);
 assert.equal(earnPumpkin(p,'boss',{now,rng:()=>0}),0);
 assert.equal(halloweenState(p,now+86400000).daily.boss,undefined);
 assert.equal(earnPumpkin(p,'boss',{now:now+86400000,rng:()=>0}),1);
});
test('event purchases have lifetime limits, exchanges unlock milestones and claims cannot repeat',()=>{
 const p={tentacles:10000000};exchangePumpkins(p,30,now);
 assert.deepEqual(claimHalloweenMilestone(p,10,now),{smallPoison:2});
 assert.throws(()=>claimHalloweenMilestone(p,10,now));
 assert.deepEqual(purchasePumpkinReward(p,'energy',now),{energy:50});
 assert.equal(halloweenState(p,now+86400000).purchases.energy,1);
 assert.throws(()=>purchasePumpkinReward(p,'missing',now));
});
test('exchange and purchase requests cannot replay rewards or reuse IDs with different quantities',t=>{
 t.mock.method(Date,'now',()=>now);const p={tentacles:1000000,energy:0};
 const a={type:'halloween-exchange',quantity:20,requestId:'halloween-test-001'};
 applyPlayerAction(p,a);const before=p.tentacles;
 assert.equal(applyPlayerAction(p,a).replayed,true);assert.equal(p.tentacles,before);
 assert.throws(()=>applyPlayerAction(p,{...a,quantity:1}));
 const b={type:'halloween-buy',productId:'energy',requestId:'halloween-test-002'};
 applyPlayerAction(p,b);assert.equal(p.energy,50);applyPlayerAction(p,b);assert.equal(p.energy,50);
});
test('a clan invitation never grants reward eligibility to unrelated contributors',()=>{
 const fight={opened_by_email:'owner',invited_player_ids:['invited']};
 assert.equal(shouldReceiveBossFightDamageReward(fight,{player_email:'owner'},'owner-id'),true);
 assert.equal(shouldReceiveBossFightDamageReward(fight,{player_email:'helper'},'invited'),true);
 assert.equal(shouldReceiveBossFightDamageReward(fight,{player_email:'outsider'},'not-invited'),false);
});

test('clan reward trusts server totals only and is claimable once per account',t=>{
 t.mock.method(Date,'now',()=>now);const p={clan_id:'pumpkins',energy:0};
 assert.throws(()=>applyPlayerAction(p,{type:'halloween-clan',clanTotal:100000}));
 const result=applyPlayerAction(p,{type:'halloween-clan'},{halloweenClanTotal:100});
 assert.equal(result.reward.energy,100);assert.equal(p.energy,100);
 assert.throws(()=>applyPlayerAction(p,{type:'halloween-clan'},{halloweenClanTotal:100}));
 assert.equal(p.energy,100);
});

test('paper exchange spends premium and shares allowance with tentacles',t=>{
 t.mock.method(Date,'now',()=>now);const p={premium:5,tentacles:1000000};
 const a={type:'halloween-exchange',resource:'paper',quantity:3,requestId:'paper-exchange-001'};
 applyPlayerAction(p,a);assert.equal(p.premium,2);assert.equal(p.tentacles,1000000);
 assert.equal(halloweenState(p,now).exchangeAvailable,27);
 assert.equal(applyPlayerAction(p,a).replayed,true);assert.equal(p.premium,2);
 assert.throws(()=>applyPlayerAction(p,{...a,resource:'tentacles'}));
 assert.throws(()=>exchangePumpkins(p,3,now,'paper'));
 exchangePumpkins(p,1,now);assert.equal(halloweenState(p,now).exchangeAvailable,26);
});

test('exclusive Halloween equipment requires earned pumpkins, grants inventory and cannot duplicate',t=>{
 t.mock.method(Date,'now',()=>now);const p={tentacles:1000000,halloween_event:{id:HALLOWEEN.id,balance:500,earned:0,activityEarned:0,activityTotal:0}};
 const action={type:'halloween-buy',productId:'halloween-pet',requestId:'halloween-pet-001'};
 assert.throws(()=>applyPlayerAction(p,action));assert.equal(p.halloween_event.balance,500);
 p.halloween_event.earned=140;p.halloween_event.activityEarned=140;p.halloween_event.activityTotal=140;
 applyPlayerAction(p,action);assert.equal(p.halloween_event.balance,300);
 assert.equal(p.inventory_items[0].id,'halloween_2026_pet');assert.equal(p.inventory_items[0].slot,'pet');assert.equal(p.inventory_items[0].locked,false);
 assert.equal(applyPlayerAction(p,action).replayed,true);assert.equal(p.inventory_items.length,1);
 assert.throws(()=>applyPlayerAction(p,{...action,requestId:'halloween-pet-002'}));
 applyPlayerAction(p,{type:'halloween-buy',productId:'halloween-set-armor',requestId:'halloween-charm-001'});
 assert.equal(p.halloween_event.balance,250);assert.equal(p.inventory_items[1].slot,'armor');
});

test('referral bonus excludes old accounts, missing dates and future registrations',async t=>{
 const {grantReferralPumpkins}=await import('../src/lib/halloweenEvent.js');
 const p={id:'inviter'};
 for(const [id,date]of [['old','2026-10-18T23:59:59Z'],['unknown',undefined],['future',new Date(now+86400000).toISOString()]])assert.equal(grantReferralPumpkins(p,{id,level:20,created_date:date},now),0);
 assert.equal(p.halloween_event,undefined);
 assert.equal(grantReferralPumpkins(p,{id:'new',level:20,created_date:HALLOWEEN.startAt},now),2);
 assert.equal(grantReferralPumpkins(p,{id:'new',level:20,created_date:HALLOWEEN.startAt},now),0);
});
