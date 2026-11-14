import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTalentAttack} from '../src/lib/talentCombat.js';
const ids=['fist','knuckle','satchel','f4','c4'];
for(const id of ids)for(const hp of [100,75,50,49,25,15,10,1])test(`${id}: critical sources at ${hp}% HP`,()=>{
 const levels={t05:3,t14:4,t28:5,t57:6};
 const chance=.07+(['fist','knuckle'].includes(id)?.03:0)+(id==='fist'?.04:0)+(id==='knuckle'?.05:0)+(hp<50?.12:0);
 const args={weapon:{id,damage:100,critChance:.07},levels,state:{},fight:{current_hp:hp,max_hp:100}};
 const hit=resolveTalentAttack({...args,random:()=>chance-.00001});
 assert.equal(hit.isCrit,true);assert.ok(Math.abs(hit.critChance-chance)<1e-10);
 assert.equal(resolveTalentAttack({...args,random:()=>chance+.00001}).isCrit,false);
 assert.equal(hit.damage,resolveTalentAttack({...args,random:()=>1}).damage*2);
});
test('finger critical bonus T20 and repeat T13 preserve critical damage',()=>{
 const args={weapon:{id:'fist',damage:100,critChance:1},levels:{t20:3,t13:10},state:{},fight:{current_hp:100,max_hp:100},random:()=>0};
 const hit=resolveTalentAttack(args);assert.equal(hit.damage,230);assert.equal(hit.repeatDamage,230);
});
test('critical chance above 100% is capped for the random roll',()=>{
 for(const id of ids)assert.equal(resolveTalentAttack({weapon:{id,damage:100,critChance:2},fight:{current_hp:100,max_hp:100},random:()=>.999}).isCrit,true);
});
