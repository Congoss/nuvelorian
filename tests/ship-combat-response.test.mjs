import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeShipCombatResponse,projectPendingShipFight} from '../src/lib/shipCombatResponse.js';
import {readShipScene,saveShipScene,subscribeShipScene} from '../src/lib/shipSceneCache.js';

test('explicit revisions determine order even when authoritative HP increases',()=>{
 const previous={fight:{id:'revision',combat_revision:3,current_hp:100,status:'active'},player:{weapon_inventory:{'large-poison':9}}};
 const newer={fight:{id:'revision',combat_revision:4,current_hp:200,status:'active'},player:{weapon_inventory:{'large-poison':8}}};
 assert.equal(mergeShipCombatResponse(previous,newer).fight.current_hp,200);
 assert.equal(mergeShipCombatResponse(newer,{...previous,fight:{...previous.fight,current_hp:50}}),newer);
});

test('same fight revision cannot carry two authoritative HP values',()=>{
 const previous={fight:{id:'revision-conflict',combat_revision:7,current_hp:700,status:'active'}};
 const conflict={fight:{id:'revision-conflict',combat_revision:7,current_hp:900,status:'active'}};
 assert.equal(mergeShipCombatResponse(previous,conflict),previous);
 const projected={fight:{...previous.fight,current_hp:650,client_projected:true}};
 assert.equal(mergeShipCombatResponse(projected,previous).fight.current_hp,700);
});

test('scene re-entry receives a late accepted attack once without replaying a reservation',()=>{
 const key='scene:test';
 const initial={fight:{id:'cached',combat_revision:1,current_hp:1000,status:'active'},player:{weapon_inventory:{'large-poison':10}}};
 const confirmed={fight:{id:'cached',combat_revision:2,current_hp:800,status:'active'},player:{weapon_inventory:{'large-poison':9}}};
 saveShipScene(key,initial);
 const updates=[];const unsubscribe=subscribeShipScene(key,snapshot=>updates.push(snapshot));
 saveShipScene(key,confirmed);saveShipScene(key,initial);
 assert.equal(readShipScene(key,'cached').player.weapon_inventory['large-poison'],9);
 assert.equal(readShipScene(key,'other'),null);
 assert.equal(updates.at(-1).fight.current_hp,800);
 unsubscribe();
});

test('a same-fight snapshot cannot lower confirmed personal damage', () => {
 const fight = {id:'ship-1',current_hp:900,status:'active'};
 const previous = {fight,playerDamageLog:{hits:10,damage:100}};
 const stale = {fight:{...fight,current_hp:850},playerDamageLog:{hits:10,damage:75}};
 assert.equal(mergeShipCombatResponse(previous,stale),previous);
});
import {shipCombatPlayerSnapshot,shipSyncNeedsTick} from '../server/utils/shipCombatSnapshot.js';

test('late pre-attack polls cannot restore HP, poison stock or old talent flags',()=>{
 const confirmed={fight:{id:'cheese',current_hp:500,status:'active'},player:{weapon_inventory:{'large-poison':80},talent_combat_state:{cheese:{marks:4}}},playerDamageLog:{hits:20,damage:500}};
 const stale={fight:{id:'cheese',current_hp:900,status:'active'},player:{weapon_inventory:{'large-poison':96},talent_combat_state:{cheese:{marks:1}}},playerDamageLog:{hits:4,damage:100}};
 assert.equal(mergeShipCombatResponse(confirmed,stale),confirmed);
 assert.equal(mergeShipCombatResponse(confirmed,{...stale,fight:{...stale.fight,current_hp:500}}),confirmed);
 const other={...stale,fight:{...stale.fight,id:'new-cheese'}};
 assert.equal(mergeShipCombatResponse(confirmed,other).fight.current_hp,900);
});
test('compact updates keep equipment and identity while replacing confirmed stock',()=>{
 const previous={fight:{current_hp:100},player:{id:'p',avatar:'own.webp',equipped_items:{weapon:'club'},weapon_inventory:{'large-poison':100}}};
 const next={fight:{current_hp:50},player:{id:'p',weapon_inventory:{'large-poison':95}}};
 const merged=mergeShipCombatResponse(previous,next);
 assert.equal(merged.player.avatar,'own.webp');assert.deepEqual(merged.player.equipped_items,{weapon:'club'});
 assert.equal(merged.player.weapon_inventory['large-poison'],95);assert.equal(merged.fight.current_hp,50);
 assert.equal(previous.player.weapon_inventory['large-poison'],100);
});

test('compact ship updates replace stale equipment and collections used by the HP forecast',()=>{
 const old={fight:{id:'ship',status:'active',current_hp:300000},player:{id:'p',equipped_items:{pet:'pet5'},inventory_items:[{id:'old',enhancementLevel:15}],collection_items:['old-collection']}};
 const live={id:'p',equipped_items:{pet:'hereearlypet'},inventory_items:[{id:'new',enhancementLevel:3}],collection_items:['live-collection'],weapon_inventory:{'small-poison':86}};
 const snapshot=shipCombatPlayerSnapshot(live);
 const merged=mergeShipCombatResponse(old,{fight:{id:'ship',status:'active',current_hp:238095},player:snapshot});
 assert.deepEqual(merged.player.equipped_items,live.equipped_items);
 assert.deepEqual(merged.player.inventory_items,live.inventory_items);
 assert.deepEqual(merged.player.collection_items,live.collection_items);
 snapshot.inventory_items[0].enhancementLevel=0;assert.equal(live.inventory_items[0].enhancementLevel,3);
});

test('ship pending-hit fallback never invents 1 HP or a victory before confirmation',()=>{
 const fight={id:'ship',current_hp:6062,status:'active'};
 const pending=projectPendingShipFight(fight,9000);
 assert.equal(pending.current_hp,0);assert.equal(pending.status,'active');
 assert.equal(projectPendingShipFight(fight,5144).current_hp,918);
});
test('combat snapshots omit mail and display payloads without dropping combat progress',()=>{
 const player={id:'p',avatar:'image'.repeat(20000),gift_mail:[{text:'mail'.repeat(20000)}],weapon_inventory:{'large-poison':90},talent_levels:{t1:2},ship_boss_kills:{hangar:1}};
 const compact=shipCombatPlayerSnapshot(player);
 assert(JSON.stringify(compact).length<JSON.stringify(player).length/100);
 assert.equal(compact.weapon_inventory['large-poison'],90);assert.equal(compact.ship_boss_kills.hangar,1);
 compact.weapon_inventory['large-poison']=0;assert.equal(player.weapon_inventory['large-poison'],90);
});
test('polls persist only due bleed ticks, expiry or fight transitions',()=>{
 const fight={status:'active',ends_at:new Date(10000).toISOString(),participants:{p:{runtime:{bleed:{lastTickAt:1000,expiresAt:6000}}}}};
 assert.equal(shipSyncNeedsTick(fight,1999),false);assert.equal(shipSyncNeedsTick(fight,2000),true);
 assert.equal(shipSyncNeedsTick(fight,6000),true);fight.participants={};assert.equal(shipSyncNeedsTick(fight,9000),false);assert.equal(shipSyncNeedsTick(fight,10000),true);
});

test('confirmed zero HP finishes the battle even if compact response still says active',()=>{
 const previous={fight:{id:'ship',current_hp:10,status:'active'},player:{id:'p'}};
 const result=mergeShipCombatResponse(previous,{fight:{id:'ship',current_hp:0,status:'active'}});
 assert.equal(result.fight.status,'dead');assert.equal(result.fight.current_hp,0);
 assert.equal(previous.fight.status,'active');
 assert.equal(mergeShipCombatResponse(null,{fight:{current_hp:0,status:'active'}}).fight.status,'dead');
 assert.equal(mergeShipCombatResponse(null,{fight:{status:'active'}}).fight.status,'active');
});
