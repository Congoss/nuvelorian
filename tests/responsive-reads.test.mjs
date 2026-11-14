import {getBattlePassSeason} from '../server/utils/battlePass.js';
import {getPlayerPassTier} from '../src/lib/playerPassTier.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadCache} from '../server/utils/readCache.js';
import {publicClanFields,publicClanMember} from '../server/utils/publicClan.js';
import {projectPendingShipFight} from '../src/lib/shipCombatResponse.js';
test('display cache returns immediately during refresh, coalesces reads and rejects stale invalidated results',async()=>{
 let now=0,resolve,calls=0;const cache=createReadCache({ttl:10,now:()=>now});
 assert.equal(await cache.get('a',async()=>{calls++;return 1;}),1);
 now=11;const load=()=>{calls++;return new Promise(r=>resolve=r);};
 assert.equal(await cache.get('a',load),1);assert.equal(await cache.get('a',load),1);assert.equal(calls,2);
 cache.invalidate('a');cache.set('a',3);resolve(2);await new Promise(r=>setImmediate(r));
 assert.equal(await cache.get('a',load),3);
});
test('cold concurrent display reads share one fetch and failed reads can retry',async()=>{
 const cache=createReadCache();let calls=0;
 const values=await Promise.all(Array.from({length:10},()=>cache.get('same',async()=>{calls++;return 9;})));
 assert.deepEqual(values,Array(10).fill(9));assert.equal(calls,1);
 await assert.rejects(cache.get('bad',()=>{throw Error('offline');}));assert.equal(await cache.get('bad',()=>8),8);
});
test('clan summaries exclude receipts and member reads exclude economic payloads without mutating players',()=>{
 const clan={id:'c',name:'C',ship:{name:'S',progress:{hull:1},kills:{hull:1},history:{secret:1},receipts:{huge:'x'.repeat(100000)}}};
 const view=publicClanFields(clan);assert.equal(view.ship.name,'S');assert.equal(view.ship.receipts,undefined);assert.equal(view.ship.history,undefined);assert(JSON.stringify(view).length<200);
 const player={id:'p',nickname:'P',level:20,avatar:'p.webp',battle_pass:{seasonId:getBattlePassSeason().id,tier:'epic'},gift_mail:[{secret:'x'}],weapon_inventory:{'large-poison':5}};
 const before=JSON.stringify(player),member=publicClanMember(player);assert.equal(member.avatar,'p.webp');assert.equal(member.battle_pass_view.tier,'epic');assert.equal(member.gift_mail,undefined);assert.equal(member.weapon_inventory,undefined);assert.equal(JSON.stringify(player),before);
});
test('clan member premium appears in the first response despite a stale presentation',()=>{
 for(const tier of ['epic','legendary']){
  const player={id:'premium',battle_pass:{seasonId:getBattlePassSeason().id,tier},battle_pass_view:{tier:'free'}};
  const before=JSON.stringify(player);
  assert.equal(publicClanMember(player).battle_pass_view.tier,tier);
  assert.equal(JSON.stringify(player),before);
 }
 assert.equal(publicClanMember({battle_pass:{tier:'free'},battle_pass_view:{tier:'legendary'}}).battle_pass_view.tier,'free');
});
test('clan and player names ignore previous-season premium',()=>{
 const player={battle_pass:{seasonId:'old',tier:'legendary'},battle_pass_view:{tier:'free'}};
 assert.equal(publicClanMember(player).battle_pass_view.tier,'free');
 assert.equal(getPlayerPassTier(player),'free');
 assert.equal(getPlayerPassTier({battle_pass_tier:'epic'}),'epic');
});
test('instant HP prediction never grants an unconfirmed victory or changes authoritative HP',()=>{
 const fight={id:'f',current_hp:100,max_hp:100,status:'active'};
 assert.equal(projectPendingShipFight(fight,30).current_hp,70);const lethal=projectPendingShipFight(fight,1000);assert.equal(lethal.current_hp,0);assert.equal(lethal.status,'active');assert.equal(lethal.client_projected,true);assert.equal(fight.current_hp,100);
 const dead={...fight,status:'dead',current_hp:0};assert.equal(projectPendingShipFight(dead,5),dead);
});
