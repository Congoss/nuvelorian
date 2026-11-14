import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAchievementDamage, poisonCount, unlockAchievement, claimAchievementReward } from '../server/utils/playerAchievements.js';
import { buildBootstrapPayload } from '../server/utils/bootstrap.js';
import { attackShipFight, tickShipFight } from '../server/utils/clanShip.js';

function event(fight, player, damage, extra = {}) {
  const hpBefore = fight.current_hp;
  fight.current_hp = Math.max(0, hpBefore - damage);
  recordAchievementDamage({fight, player, hpBefore, damage: Math.min(hpBefore, damage), ...extra});
}
test('exactly one HP, persistent and idempotent unlock', () => {
  const player={id:'a'},fight={id:'f',max_hp:100,current_hp:100};
  event(fight,player,99,{weaponId:'fist',now:1000});
  assert.ok(player.player_achievements.still_breathing);
  const original=player.player_achievements.still_breathing;
  const second={id:'g',max_hp:100,current_hp:100};
  event(second,player,99,{weaponId:'fist',now:2000});
  assert.equal(player.player_achievements.still_breathing,original);
  assert.deepEqual(buildBootstrapPayload(player).player.player_achievements,player.player_achievements);
});
test('greed requires saved last poison and a killing blow', () => {
  assert.equal(poisonCount({weapon_inventory:{'small-poison':1,'medium-poison':1}}),2);
  for(const saved of [false,true]){
    const player={id:'p'},fight={id:'f',max_hp:20,current_hp:20};
    event(fight,player,10,{weaponId:'satchel',lastPoisonSaved:saved});
    assert.equal(player.player_achievements?.greed_saved,undefined);
    event(fight,player,10,{weaponId:'satchel',lastPoisonSaved:saved});
    assert.equal(Boolean(player.player_achievements?.greed_saved),saved);
  }
});
test('only bleed kill unlocks hands off, not nonlethal ticks or direct kill',()=>{
  for(const bleed of [false,true]){
    const player={id:'p'},fight={id:'f',max_hp:10,current_hp:10};
    event(fight,player,2,{bleed});assert.equal(player.player_achievements?.hands_off,undefined);
    event(fight,player,8,{bleed});assert.equal(Boolean(player.player_achievements?.hands_off),bleed);
  }
});
test('ten fingers requires exactly ten contributors, only finger, complete history',()=>{
  for(const [count,bad,old] of [[10,false,false],[9,false,false],[11,false,false],[10,true,false],[10,false,true]]){
    const players=Array.from({length:count},(_,i)=>({id:String(i)}));
    const fight={id:'f',max_hp:count+(old?1:0),current_hp:count};
    players.forEach((player,i)=>event(fight,player,1,{players,weaponId:bad&&i===0?'knuckle':'fist'}));
    for(const p of players)assert.equal(Boolean(p.player_achievements?.ten_fingers),count===10&&!bad&&!old);
  }
});
test('changing attack type disqualifies the entire fight',()=>{
  const players=Array.from({length:10},(_,i)=>({id:String(i)}));
  const fight={id:'f',max_hp:11,current_hp:11};
  event(fight,players[0],1,{players,weaponId:'satchel'});
  players.forEach(player=>event(fight,player,1,{players,weaponId:'fist'}));
  assert.ok(players.every(p=>!p.player_achievements?.ten_fingers));
});
test('real ship finger attack tracks contribution and replay is idempotent',()=>{
 const player={id:'p',weapon_inventory:{'small-poison':1},talent_tree_version:2,talent_levels:{},equipped_items:{},inventory_items:[]};
 const fight={id:'f',moduleId:'x',boss_id:'ship-x',max_hp:1000,current_hp:1000,status:'active',participants:{},ends_at:new Date(Date.now()+60000).toISOString()};
 const clan={id:'c',ship:{fights:{x:fight},receipts:{},kills:{},history:{},progress:{},donations:[],lastWinners:{}}};
 attackShipFight(clan,player,[player],{moduleId:'x',fightId:'f',weaponId:'fist',requestId:'achievement-test-1234'},{rng:()=>0.99});
 assert.ok(fight.achievement_combat.contributors.p.fingerOnly);
 const hp=fight.current_hp;
 attackShipFight(clan,player,[player],{moduleId:'x',fightId:'f',weaponId:'fist',requestId:'achievement-test-1234'},{rng:()=>0.99});
 assert.equal(fight.current_hp,hp);
});
test('ship passive bleed tick unlocks hands off',()=>{
 const player={id:'p'},now=10000;
 const fight={id:'f',moduleId:'x',boss_id:'ship-x',max_hp:100,current_hp:1,status:'active',participants:{p:{name:'p',damage:99,hits:1,refund:{},runtime:{bleed:{damage:1,lastTickAt:9000,expiresAt:11000}}}},ends_at:new Date(20000).toISOString()};
 const clan={id:'c',ship:{fights:{x:fight},receipts:{},kills:{},history:{},progress:{},donations:[],lastWinners:{}}};
 tickShipFight(clan,fight,[player],{now,rng:()=>0.99});
 assert.ok(player.player_achievements.hands_off);
 assert.equal(fight.status,'dead');
});

test('real ship poison preservation checks the entire poison inventory',()=>{
 for(const extra of [0,1]){
  const player={id:'p',weapon_inventory:{'small-poison':1,'medium-poison':extra},talent_tree_version:2,talent_levels:{t34:1},equipped_items:{},inventory_items:[]};
  const fight={id:'f',moduleId:'x',boss_id:'ship-x',max_hp:100,current_hp:1,status:'active',participants:{},ends_at:new Date(Date.now()+60000).toISOString()};
  const clan={id:'c',ship:{fights:{x:fight},receipts:{},kills:{},history:{},progress:{},donations:[],lastWinners:{}}};
  attackShipFight(clan,player,[player],{moduleId:'x',fightId:'f',weaponId:'satchel',requestId:'achievement-poison-1234'},{rng:()=>0});
  assert.equal(player.weapon_inventory['small-poison'],1);
  assert.equal(Boolean(player.player_achievements?.greed_saved),extra===0);
 }
});
test('real ship ten-person finger-only victory awards all ten players',()=>{
 const players=Array.from({length:10},(_,i)=>({id:String(i),talent_tree_version:2,talent_levels:{},equipped_items:{},inventory_items:[]}));
 const fight={id:'f',moduleId:'x',boss_id:'ship-x',max_hp:200,current_hp:200,status:'active',participants:{},ends_at:new Date(Date.now()+60000).toISOString()};
 const clan={id:'c',ship:{fights:{x:fight},receipts:{},kills:{},history:{},progress:{},donations:[],lastWinners:{}}};
 for(const player of players)attackShipFight(clan,player,players,{moduleId:'x',fightId:'f',weaponId:'fist',requestId:'achievement-finger-1234'},{rng:()=>0.99});
 assert.equal(fight.current_hp,0);
 assert.ok(players.every(player=>player.player_achievements?.ten_fingers));
});

test('passive equipment bleeding does not count as using a second weapon',()=>{
 const players=Array.from({length:10},(_,i)=>({id:String(i)}));
 const fight={id:'f',max_hp:11,current_hp:11};
 for(const player of players)event(fight,player,1,{players,weaponId:'fist'});
 event(fight,players[0],1,{players,bleed:true});
 assert.ok(players.every(p=>p.player_achievements?.ten_fingers));
 assert.ok(players[0].player_achievements.hands_off);
});

test('achievement pack is additive, recorded and never granted twice',()=>{
 const player={id:'p',weapon_inventory:{'small-poison':2,'medium-poison':4},roulette_bonus_spins:7};
 const fight={id:'f'};
 assert.equal(unlockAchievement(player,'greed_saved',fight,1000),true);
 assert.equal(player.weapon_inventory['small-poison'],2);
 assert.equal(player.player_achievements.greed_saved.reward_status,'pending');
 assert.equal(claimAchievementReward(player,'greed_saved').replayed,false);
 assert.equal(player.weapon_inventory['small-poison'],62);
 assert.equal(player.weapon_inventory['medium-poison'],44);
 assert.equal(player.roulette_bonus_spins,7);
 assert.deepEqual(player.player_achievements.greed_saved.rewards,{smallPoison:60,mediumPoison:40,largePoison:20});
 const restored=JSON.parse(JSON.stringify(player));
 assert.equal(unlockAchievement(restored,'greed_saved',{id:'other'},2000),false);
 assert.equal(claimAchievementReward(restored,'greed_saved').replayed,true);
 assert.equal(restored.weapon_inventory['small-poison'],62);
 assert.equal(restored.roulette_bonus_spins,7);
 assert.equal(unlockAchievement(restored,'unknown',fight),false);
});
test('all ten contributors each receive the group pack once',()=>{
 const players=Array.from({length:10},(_,i)=>({id:String(i)}));
 const fight={id:'f',max_hp:10,current_hp:10};
 for(const player of players)event(fight,player,1,{players,weaponId:'fist'});
 for(const player of players){
  assert.equal(player.weapon_inventory,undefined);
  if(player.player_achievements.still_breathing)claimAchievementReward(player,'still_breathing');
  claimAchievementReward(player,'ten_fingers');
  assert.equal(player.weapon_inventory['medium-poison'],50);
  // The ninth finger also earned the exactly-1-HP pack.
  assert.equal(player.weapon_inventory['large-poison'],player.id==='8'?35:25);
  assert.equal(player.roulette_bonus_spins,player.id==='8'?60:10);
  assert.ok(player.player_achievements.ten_fingers.rewards);
 }
});
