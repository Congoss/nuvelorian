import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPoisonTap, rebasePoisonQueue } from '../src/lib/instantPoisonCombat.js';
import { GAME_CONFIG, getCollectionDamageBonus } from '../src/lib/gameConfig.js';

function initial() {
  return { fight: { id: 'fight', status: 'active', current_hp: 10000, max_hp: 10000 },
    profile: { talent_tree_version: 2, talent_levels: { t36: 4, t38: 1 }, talent_combat_state: {},
      weapon_inventory: { 'small-poison': 20, 'medium-poison': 20, 'large-poison': 20 },
      talent_damage_progress: 0, next_talent_threshold_index: 10 }, damageLog: { damage: 0, hits: 0 } };
}

test('an intermediate acknowledgement cannot raise displayed HP while taps remain queued', () => {
  const base = initial();
  const previous = {...base, fight: {...base.fight,current_hp:9000}};
  const result = {fight:{...base.fight,current_hp:9900},player:base.profile};
  const pending = [{fightId:'fight',weapon:{id:'satchel'},multiplier:1,queuedAt:1000}];
  const view = rebasePoisonQueue(previous,result,pending);
  assert.ok(view.fight.current_hp > 9000);
  assert.equal(view.displayHp,9000);
  assert.equal(rebasePoisonQueue(view,result,[]).displayHp,undefined);
});

test('a rapid series keeps its full displayed total through partial acknowledgements', () => {
 const base = initial();
 const first = projectPoisonTap(base, { weaponId: 'satchel', now: 1000 });
 const second = projectPoisonTap(first, { weaponId: 'satchel', now: 1001 });
 const response = {fight:{...first.fight,current_hp:9930}, player:first.profile, playerDamageLog:{damage:70,hits:1}};
 const partial = rebasePoisonQueue(second,response,[{fightId:'fight',weapon:{id:'satchel'},multiplier:1,queuedAt:1001}]);
 assert.equal(partial.displayDamageLog.damage,82);
 assert.equal(partial.damageLog.damage,117);
 const third = projectPoisonTap(partial, { weaponId:'satchel', now:1002 });
 assert.equal(third.displayDamageLog.damage,82+third.hit.damage);
 const last = rebasePoisonQueue(partial,{fight:partial.fight,player:partial.profile,playerDamageLog:partial.damageLog},[]);
 assert.equal(last.displayDamageLog.damage,117);
});
test('ten rapid taps show aggregate HP and do not replay intermediate confirmations', () => {
 const base=initial();base.fight.current_hp=1000000;base.fight.max_hp=1000000;
 base.profile.weapon_inventory['large-poison']=200;
 const states=[base];
 for(let i=0;i<10;i++)states.push(projectPoisonTap(states.at(-1),{weaponId:'c4',count:10,now:1000+i}));
 const projected=states.at(-1);
 assert.ok(base.fight.current_hp-projected.fight.current_hp>=10000);
 const pending=Array.from({length:9},(_,i)=>({fightId:'fight',weapon:{id:'c4'},multiplier:10,queuedAt:1001+i}));
 const first={fight:states[1].fight,player:states[1].profile,playerDamageLog:states[1].damageLog};
 const partial=rebasePoisonQueue(projected,first,pending);
 assert.equal(partial.displayHp??partial.fight.current_hp,projected.fight.current_hp);
 const final={fight:projected.fight,player:projected.profile,playerDamageLog:projected.damageLog};
 const settled=rebasePoisonQueue(partial,final,[]);
 assert.equal(settled.displayHp??settled.fight.current_hp,final.fight.current_hp);
});
test('each tap immediately advances HP, stock, marks and talent progress without mutating server state', () => {
  const base = initial();
  const first = projectPoisonTap(base, { weaponId: 'satchel', now: 1000 });
  const second = projectPoisonTap(first, { weaponId: 'satchel', now: 1001 });
  assert.equal(first.hit.damage, 35);
  assert.equal(second.hit.damage, 47);
  assert.equal(second.fight.current_hp, 10000 - 82);
  assert.equal(second.profile.weapon_inventory['small-poison'], 18);
  assert.equal(second.profile.talent_combat_state.fight.toxicMarks, 2);
  assert.equal(second.damageLog.damage, 82);
  assert.equal(second.profile.available_talent_points, 1);
  assert.equal(second.profile.talent_damage_progress, 0);
  assert.equal(base.fight.current_hp, 10000);
  assert.equal(base.profile.weapon_inventory['small-poison'], 20);
  assert.deepEqual(base.profile.talent_combat_state, {});
});

test('confirming a small poison rebuilds the pending five-mark flask from server marks and stock',()=>{
 const base=initial();base.fight.current_hp=2000000;base.fight.max_hp=2000000;
 base.profile.talent_levels={t36:10,t38:10,t40:10,t53:10};
 const pending=[...Array.from({length:4},(_,i)=>({fightId:'fight',weapon:{id:'satchel'},multiplier:1,queuedAt:1002+i})),{fightId:'fight',weapon:{id:'c4'},multiplier:1,queuedAt:1006}];
 const confirmed=projectPoisonTap(base,{weaponId:'satchel',now:1001});
 // Simulate confirmed preservation of that first dose, absent from the preview.
 confirmed.profile.weapon_inventory['small-poison']=20;
 const response={fight:confirmed.fight,player:confirmed.profile,playerDamageLog:confirmed.damageLog};
 const stale=JSON.parse(JSON.stringify(confirmed));stale.fight.current_hp=1000000;stale.profile.talent_combat_state.fight.toxicMarks=0;
 const actual=rebasePoisonQueue(stale,response,pending,'ship');
 let expected=confirmed;
 for(const entry of pending)expected=projectPoisonTap(expected,{weaponId:entry.weapon.id,count:entry.multiplier,mode:'ship',now:entry.queuedAt});
 assert.equal(actual.fight.current_hp,expected.fight.current_hp);
 assert.equal(actual.profile.weapon_inventory['small-poison'],16);
 assert.equal(actual.profile.weapon_inventory['large-poison'],19);
 assert.equal(actual.profile.talent_combat_state.fight.toxicMarks,0);
 const final=rebasePoisonQueue(stale,response,[],'ship');
 assert.equal(final.fight.current_hp,response.fight.current_hp);
 assert.equal(final.profile.weapon_inventory['small-poison'],20);
 assert.equal(final.damageLog.damage,response.playerDamageLog.damage);
});

test('ship projection applies collection bonus to the hit but never multiplies settled bleed',()=>{
 const base=initial();
 base.profile.talent_levels={};base.profile.collection_items=Object.values(GAME_CONFIG.COLLECTIONS).flatMap(items=>items.map(item=>item.id));
 assert(getCollectionDamageBonus(base.profile)>1);
 const withoutBleed=projectPoisonTap(base,{weaponId:'satchel',mode:'ship',now:2000});
 base.profile.talent_combat_state={fight:{toxicMarks:0,bleed:{damage:100,lastTickAt:1000,expiresAt:6000}}};
 const withBleed=projectPoisonTap(base,{weaponId:'satchel',mode:'ship',now:2000});
 assert.equal(withBleed.hit.damage-withoutBleed.hit.damage,100);
});

test('video regression: a critical response releases a poisoned 1-HP prediction without re-entering',()=>{
 const stuck=initial();stuck.fight={...stuck.fight,current_hp:1,max_hp:2000000};
 stuck.pendingDefeat=true;stuck.damageLog={damage:1994042,hits:400};
 stuck.profile.weapon_inventory={'small-poison':0,'medium-poison':23,'large-poison':68};
 const authoritative=initial();authoritative.fight={...authoritative.fight,current_hp:690078,max_hp:2000000};
 authoritative.profile.weapon_inventory={'small-poison':203,'medium-poison':180,'large-poison':128};
 authoritative.profile.talent_combat_state={fight:{toxicMarks:0}};
 const response={fight:authoritative.fight,player:authoritative.profile,playerDamageLog:{damage:1309922,hits:200},hit:{damage:9288,isCrit:true}};
 const resumed=rebasePoisonQueue(stuck,response,[],'ship');
 assert.equal(resumed.pendingDefeat,undefined);
 assert.equal(resumed.fight.current_hp,690078);
 assert.equal(resumed.confirmedDamageLog.damage,1309922);
 assert.deepEqual(resumed.profile.weapon_inventory,authoritative.profile.weapon_inventory);
 assert(projectPoisonTap(resumed,{weaponId:'satchel',mode:'ship',now:1000}));
 const finished=rebasePoisonQueue(resumed,{...response,fight:{...response.fight,current_hp:0,status:'dead'},player:{...response.player,pending_boss_boxes:[{fightId:'fight'}]}},[],'ship');
 assert.equal(finished.fight.current_hp,0);assert.equal(finished.fight.status,'dead');
 assert.equal(finished.profile.pending_boss_boxes.length,1);
});

test('pending lethal prediction does not add fabricated damage to the confirmed leaderboard',()=>{
 const base=initial();base.fight.current_hp=10;base.damageLog={damage:100,hits:1};
 const pending=projectPoisonTap(base,{weaponId:'c4',mode:'ship',now:1000});
 assert.equal(pending.pendingDefeat,true);
 assert.equal(pending.confirmedDamageLog.damage,100);
 assert.equal(pending.confirmedFight.current_hp,10);
});
test('multi-dose attacks simulate every dose and preserve marks across different poisons', () => {
  const small = projectPoisonTap(initial(), { weaponId: 'satchel', count: 5, now: 1000 });
  assert.equal(small.profile.weapon_inventory['small-poison'], 15);
  assert.equal(small.profile.talent_combat_state.fight.toxicMarks, 5);
  const large = projectPoisonTap(small, { weaponId: 'c4', now: 1001 });
  assert.equal(large.hit.damage, 320);
  assert.equal(large.profile.talent_combat_state.fight.toxicMarks, 0);
  assert.equal(large.profile.weapon_inventory['large-poison'], 19);
});
test('pending finishing hits never manufacture a stuck 1 HP, stop extra spending and never award a victory', () => {
  const base = initial();base.fight.current_hp = 10;
  const result = projectPoisonTap(base, { weaponId: 'satchel' });
  assert.equal(result.fight.current_hp, 0);
  assert.equal(result.pendingDefeat,true);
  assert.equal(projectPoisonTap(result,{weaponId:'satchel'}),null);
  assert.equal(result.fight.status, 'active');
  assert.equal(projectPoisonTap(result, { weaponId: 'satchel' }), null);
  assert.equal(result.profile.pending_boss_boxes, undefined);
  assert.equal(projectPoisonTap(base, { weaponId: 'satchel', count: 100 }), null);
});
