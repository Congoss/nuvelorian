import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEquipmentEffects } from '../src/lib/equipmentEffects.js';
import { getBalancedEquipmentItem } from '../src/lib/equipmentBalance.js';
import { applyAnubisLayerOverrides } from '../src/lib/anubisEquipment.js';
const slots=['weapon','head','armor','hands','legs','boots'];
test('Anubis stats resolve from persisted drops and all set tiers stack',()=>{
 const equipped_items=Object.fromEntries(slots.map(slot=>[slot,`anubis_${slot}`]));
 const {effects,setCounts}=calculateEquipmentEffects({equipped_items});
 assert.equal(setCounts.anubis,6);
 assert.deepEqual([effects.fingerDamageFlat,effects.pencilDamageFlat,effects.poisonDamageFlat,effects.bossDamageFlat,effects.fingerCooldownSec,effects.pencilCooldownSec],[450,525,300,585,-75,-150]);
 assert.equal(getBalancedEquipmentItem('anubis_head').bonuses[0].value,135);
 const map={head:'mask.png',weapon:'staff.png'};
 const items=new Map(slots.map(slot=>[`anubis_${slot}`,getBalancedEquipmentItem(`anubis_${slot}`)]));
 applyAnubisLayerOverrides(map,equipped_items,items);
 assert.equal(map.rearWeapon,'staff.png');assert.equal(map.weapon,undefined);assert.equal(map.hideBaseHead,true);assert.equal(map.bootsOverLegs,true);
});
process.env.NODE_ENV='test';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[key]='';
const [{createApp},{store},{playerDb}]=await Promise.all([import('../server/app.js'),import('../server/data/store.js'),import('../server/data/player-db.js')]);
test('Cleopatrash drops all six unique pieces and unlocks temple; replay and duplicates are safe',async()=>{
 await store.init();await playerDb.init(store);
 const [player]=playerDb.attachPlayers([{id:'anubis-test',telegram_id:'90723',created_by:'telegram_90723@miniapp.local',level:80,tentacles:0,inventory_items:[]}]);
 store.players=[player];store.claimedLoot=[];
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const headers={'x-telegram-user-id':'90723','content-type':'application/json'};
 const claim=async(instanceId,type)=>{
  player.pending_boss_boxes=[{instanceId,boxType:'wooden',bossId:'boss7',rewardFormula:'boss_v2',rewardSnapshot:[{type,qty:1,bossId:'boss7'}]}];
  const res=await fetch(`http://127.0.0.1:${server.address().port}/loot/claim`,{method:'POST',headers,body:JSON.stringify({instanceId})});
  const json=await res.json();assert.equal(res.status,200,JSON.stringify(json));return json.data;
 };
 try {
  for(let i=0;i<6;i++){const result=await claim(`anubis-${i}`,'boss_gear_piece');assert.equal(result.drops[0].type,'equipment');assert.match(result.drops[0].itemId,/^anubis_/);}
  assert.equal(new Set(player.inventory_items.map(i=>i.id)).size,6);
  assert.equal((await claim('anubis-duplicate','boss_gear_piece')).drops[0].type,'tentacles');
  assert.equal((await claim('temple-first','boss_background')).drops[0].backgroundId,'boss-7-fight');
  assert.ok(player.unlocked_backgrounds.includes('boss-7-fight'));
  assert.equal((await claim('temple-first','boss_background')).replayed,true);
  assert.equal((await claim('temple-duplicate','boss_background')).drops[0].type,'tentacles');
  const equipped_items=Object.fromEntries(slots.map(slot=>[slot,`anubis_${slot}`]));
  const res=await fetch(`http://127.0.0.1:${server.address().port}/players/${player.id}`,{method:'PATCH',headers,body:JSON.stringify({equipped_items,selected_camp_background:'boss-7-fight'})});
  assert.equal(res.status,200,await res.text());assert.equal(player.selected_camp_background,'boss-7-fight');assert.equal(player.equipped_items.weapon,'anubis_weapon');
 }finally{await new Promise(r=>server.close(r));}
});
