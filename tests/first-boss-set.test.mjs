import test from 'node:test';
import assert from 'node:assert/strict';
import {firstBossSetReward,FIRST_BOSS_SET_IDS} from '../src/lib/firstBossSet.js';
const reward=(player,kills,drops=[])=>firstBossSetReward(player,{bossId:'heli',firstBossId:'heli',fightId:'fight-'+kills,kills,drops,random:()=>.99});
test('first win guarantees visible gear; worst luck completes all six by win 41 even with unopened chests and reloads',()=>{
 let player={inventory_items:[],pending_boss_boxes:[]};
 const won=[];
 for(let kill=1;kill<=41;kill++){
  const drops=reward(player,kill),gear=drops.filter(d=>d.type==='equipment');
  if(kill===1){assert(['cardboard_head','cardboard_armor'].includes(gear[0].itemId));assert.equal(gear[0].starterEquipment,true);}
  for(const item of gear){assert(!won.includes(item.itemId));won.push(item.itemId);}
  player.pending_boss_boxes.push({rewardSnapshot:drops});
  player=JSON.parse(JSON.stringify(player));
 }
 assert.deepEqual([...won].sort(),[...FIRST_BOSS_SET_IDS].sort());
 assert.equal(reward(player,42).length,0);
});
test('random gear resets the eight-win streak and does not duplicate inventory or equipped parts',()=>{
 const player={inventory_items:[{id:'cardboard_head'}],equipped_items:{armor:'cardboard_armor'}};
 const first=reward(player,1);assert(!['cardboard_head','cardboard_armor'].includes(first[0].itemId));
 player.inventory_items.push({id:first[0].itemId});
 for(let kill=2;kill<=6;kill++)assert.equal(reward(player,kill).length,0);
 const lucky=reward(player,7,[{type:'boss_gear_piece'},{type:'xp',qty:10}]);
 assert.equal(lucky.filter(d=>d.type==='equipment').length,1);assert(lucky.some(d=>d.type==='xp'));
 player.inventory_items.push({id:lucky.find(d=>d.itemId).itemId});
 for(let kill=8;kill<=14;kill++)assert.equal(reward(player,kill).length,0);
 assert.equal(reward(player,15).filter(d=>d.type==='equipment').length,1);
});
test('other boss sets and repeated processing do not advance first-set pity',()=>{
 const player={},drops=[{type:'boss_gear_piece'}];
 assert.equal(firstBossSetReward(player,{bossId:'tank',firstBossId:'heli',fightId:'x',kills:1,drops}),drops);
 assert.equal(player.first_boss_set_progress,undefined);
 reward(player,5);const before=JSON.stringify(player);reward(player,5);assert.equal(JSON.stringify(player),before);
});
