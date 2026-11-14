import test from 'node:test';
import assert from 'node:assert/strict';
import { TALENT_DEFS, BASE_TALENT_DEFS, applyTalentUpgrade, getSpentTalentPoints, buildEffectiveWeapon } from '../src/lib/talents.js';
import { isAdvancedUnlocked, setAdvancedAttack, advancedCost, advancedSpent } from '../src/lib/advancedTalents.js';
import { resolveTalentBatch, resolveTalentAttack, getBleedTicks, applyTalentCooldownResets } from '../src/lib/talentCombat.js';
import { resetPlayerTalents } from '../server/utils/talentReset.js';
const base=Object.fromEntries(BASE_TALENT_DEFS.map(t=>[t.id,10]));
const player=()=>({talent_tree_version:2,talent_levels:{...base},available_talent_points:2235,level:1,max_energy:500,premium:0});
const fight={boss_id:'boss8',current_hp:100000,max_hp:100000};
const sequence=(...values)=>()=>values.length?values.shift():.99;

test('talent ten has its own 10 through 19 price curve',()=>{
 assert.equal(advancedCost(0,'a10'),10);assert.equal(advancedCost(9,'a10'),19);assert.equal(advancedSpent('a10',10),145);
 assert.equal(advancedCost(0,'a09'),2);assert.equal(advancedCost(9,'a09'),20);assert.equal(advancedSpent('a09',10),110);
});

test('second tree requires all original 600 levels, costs 2235 and resets refund 2835',()=>{
 const p=player();assert.equal(isAdvancedUnlocked(p),true);assert.equal(TALENT_DEFS.length,80);
 p.talent_levels.t01=9;assert.equal(applyTalentUpgrade(p,'a01'),null);p.talent_levels.t01=10;
 assert.equal(applyTalentUpgrade({...p,talent_levels:{...p.talent_levels,a18:9}},'a08'),null);
 const advanced = TALENT_DEFS.filter(t=>t.advanced);
 assert.equal(applyTalentUpgrade(p,'a18'),null);
 const order = ['a01','a02','a03','a05','a06','a07','a09','a04','a10','a18'];
 for(const t of [...order.map(id=>advanced.find(t=>t.id===id)), ...advanced.filter(t=>!order.includes(t.id))])for(let i=0;i<10;i++){
  const patch=applyTalentUpgrade(p,t.id);assert.ok(patch);Object.assign(p,patch);
 }
 assert.equal(p.available_talent_points,0);assert.equal(getSpentTalentPoints(p),2835);assert.equal(applyTalentUpgrade(p,'a01'),null);
 resetPlayerTalents(p);assert.equal(p.available_talent_points,2835);assert.equal(isAdvancedUnlocked(p),false);
});
test('replacement keeps equipment/cooldown, adds final damage once and can switch back',()=>{
 const p=player();p.talent_levels.a01=1;const w={id:'fist',damage:20,cooldownMin:10};
 const newW=buildEffectiveWeapon(w,p);assert.equal(newW.advancedAttack,true);
 const hit=weapon=>resolveTalentAttack({weapon,levels:p.talent_levels,state:{},fight,random:()=>.99});
 setAdvancedAttack(p,'fist',false);const oldW=buildEffectiveWeapon(w,p);
 assert.equal(newW.cooldownMin,oldW.cooldownMin);assert.equal(hit(newW).damage,Math.floor(hit(oldW).damage*1.2));
 assert.throws(()=>setAdvancedAttack(player(),'knuckle',true));
});
test('x1 and x100 have identical one-per-batch block and breach decisions',()=>{
 for(const count of [1,5,10,100]){
  const hit=resolveTalentBatch({weapon:{id:'satchel',damage:50},levels:{a03:10,a04:10},state:{},fight,now:1000,count,random:sequence(.1,.04)});
  assert.equal(hit.blocked,true);assert.equal(hit.breached,true);assert.equal(hit.damage,0);assert.equal(hit.state.toxicMarks,0);assert.equal(hit.state.breachUntil,21000);
 }
});
test('open armor lets the whole batch through and refresh does not stack duration',()=>{
 const result=resolveTalentBatch({weapon:{id:'satchel',damage:50},levels:{a03:10,a04:10},state:{breachUntil:21000},fight,now:2000,count:100,random:()=>0});
 assert.equal(result.blocked,false);assert.equal(result.damage,5000);assert.equal(result.state.breachUntil,22000);
});
test('batch that opens armor does not receive open-wound damage yet',()=>{
 const hit=resolveTalentBatch({weapon:{id:'satchel',damage:100},levels:{a03:10,a10:10},state:{},fight,now:1000,random:sequence(.9,.01)});
 assert.equal(hit.breached,true);assert.equal(hit.damage,100);
 const next=resolveTalentBatch({weapon:{id:'satchel',damage:100},levels:{a10:10},state:hit.state,fight,now:2000,random:()=>.99});assert.equal(next.damage,120);
});
test('extra hits are bounded, cooldown reset clears both inherited attack slots',()=>{
 const hit=resolveTalentBatch({weapon:{id:'fist',damage:100,advancedAttack:true},levels:{t13:10,a06:10,a07:10,a01:10,a05:10,a18:10},state:{},fight,now:1000,random:()=>0});
 // blocked physical hit can breach; momentum can reset both cooldowns without recursion
 assert.equal(hit.breached,true);const p={weapon_cooldowns:{fist:'x',knuckle:'x',boss_escape_until:'keep'}};applyTalentCooldownResets(p,hit);assert.deepEqual(p.weapon_cooldowns,{boss_escape_until:'keep'});
 const triple=resolveTalentBatch({weapon:{id:'fist',damage:100},levels:{a06:10,a07:10},state:{},fight:{},random:()=>0});assert.equal(triple.damage,300);assert.equal(triple.hits,3);
});
test('marks grow to 15 and overdose modifies flask bonus only',()=>{
 const hit=resolveTalentAttack({weapon:{id:'c4',damage:200},levels:{t38:1,a08:10,a13:10},state:{toxicMarks:15},fight,random:()=>.99});
 assert.equal(hit.damage,290);assert.equal(hit.state.toxicMarks,0);
 const preserved=resolveTalentAttack({weapon:{id:'c4',damage:200},levels:{t38:1,a08:10,a11:10},state:{toxicMarks:15},fight,random:()=>0});assert.equal(preserved.state.toxicMarks,15);
});
test('blocked poison refunds once without wound, marks or critical hit effects',()=>{
 const hit=resolveTalentBatch({weapon:{id:'satchel',damage:100,critChance:1},levels:{a17:10,a12:10,a15:10},state:{bleed:{damage:10,lastTickAt:0,expiresAt:5000}},fight,now:1000,count:100,random:()=>0});
 assert.equal(hit.refundBatch,true);assert.equal(hit.damage,0);assert.equal(hit.bleedDamage,10);assert.equal(hit.isCrit,false);assert.equal(hit.state.toxicMarks,0);assert.equal(hit.state.bleed.expiresAt,5000);
});
test('bleed crits tick independently, poison extension is capped and rolled per batch',()=>{
 assert.equal(getBleedTicks({bleed:{damage:10,critChance:.1,lastTickAt:1000,expiresAt:6000}},4000,()=>0).damage,60);
 const hit=resolveTalentBatch({weapon:{id:'satchel',damage:100},levels:{a15:10},state:{bleed:{damage:10,lastTickAt:1000,expiresAt:61000}},fight:{},now:1000,count:100,random:()=>0});assert.equal(hit.state.bleed.expiresAt,61000);
});
test('acid crit stacks and corrosion stop at five and reset on success',()=>{
 let state={};for(let i=0;i<10;i++)state=resolveTalentBatch({weapon:{id:'satchel',damage:100},levels:{a20:10,a09:10,a03:10},state,fight,now:1000,random:()=>.99}).state;
 assert.equal(state.lastDropStacks,5);assert.equal(state.corrosionStacks,5);
 const hit=resolveTalentBatch({weapon:{id:'satchel',damage:100,critChance:1},levels:{a20:10,a09:10,a03:10},state,fight,now:1000,random:sequence(.9,0,0)});assert.equal(hit.state.corrosionStacks,0);assert.equal(hit.state.lastDropStacks,0);
});
