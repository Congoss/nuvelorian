import {mkdirSync,writeFileSync} from 'node:fs';
import {GAME_CONFIG} from '../src/lib/gameConfig.js';
import {EQUIPMENT_SET_BALANCE,getBalancedEquipmentItem} from '../src/lib/equipmentBalance.js';
import {BASE_TALENT_DEFS,applyTalentUpgrade,buildEffectiveWeapon} from '../src/lib/talents.js';
import {resolveTalentAttack} from '../src/lib/talentCombat.js';
const dir='output/pvp-balance';mkdirSync(dir,{recursive:true});
const slots=['weapon','head','armor','hands','legs','boots'];
const sets=['cardboard_survivor','night_disinfector','nuvelor','set4','set5','anubis','shkraban'];
const actions=['fist','knuckle','satchel'];
const weights={balanced:[1,1,1],physical:[2,2,.5],poison:[.5,.5,3]};
function gear(set,enh){const prefix=EQUIPMENT_SET_BALANCE[set].prefix;return slots.map(slot=>({id:prefix+'_'+slot,type:'equipment',slot,enhancementLevel:enh}));}
function player(set,enh){const items=gear(set,enh);return {level:120,language:'uk',talent_tree_version:2,talent_levels:{},max_energy:100,energy:0,inventory_items:items,equipped_items:Object.fromEntries(items.map(i=>[i.slot,i.id])),collection_items:[]};}
function stats(p,phase='opening'){
 return actions.map(id=>{
  const w=buildEffectiveWeapon(GAME_CONFIG.WEAPONS.find(x=>x.id===id),p);
  const r=resolveTalentAttack({weapon:w,levels:p.talent_levels,state:phase==='wounded'?{toxicMarks:3,bleed:{damage:5,lastTickAt:0,expiresAt:10000}}:{},fight:{max_hp:1000,current_hp:phase==='opening'?1000:190},now:0,random:()=>.999999});
  return {action:id,preview:w.damage,hit:r.damage+ r.repeatDamage,critChance:r.critChance,cooldownSec:Math.round(w.cooldownMin*60)};
 });
}
function talents(budget,focus){let p={...player('cardboard_survivor',0),available_talent_points:budget};
 while(p.available_talent_points>0){let best;
  for(const t of BASE_TALENT_DEFS){const patch=applyTalentUpgrade(p,t.id);if(!patch)continue;const next={...p,...patch};
   const score=stats(next).reduce((s,x,i)=>s+weights[focus][i]*x.hit*(1+Math.min(1,x.critChance)),0)+(t.isKeyTalent?.001:0);
   if(!best||score>best.score)best={next,score};
  }
  if(!best)break;p=best.next;
 }
 return {levels:p.talent_levels,spent:budget-p.available_talent_points};
}
const rows=[];
for(const points of [0,100,300,600])for(const focus of Object.keys(weights)){
 const t=talents(points,focus);
 for(const set of sets)for(const enhancement of [0,5,10,15]){
  const p={...player(set,enhancement),talent_levels:t.levels};
  rows.push({set,enhancement,focus,pointsSpent:t.spent,talentLevels:t.levels,opening:stats(p),wounded:stats(p,'wounded')});
 }
}
const full=player('cardboard_survivor',15),withoutWeapon=structuredClone(full);delete withoutWeapon.equipped_items.weapon;
const findings={model:'Existing production combat rules, synthetic legal base-tree allocations; no PvP damage normalization or HP policy applied',scope:'7 boss sets x 4 enhancement levels x 4 point budgets x 3 allocation strategies',excludes:['pets','clan bonuses','collections','advanced tree','real-time bleed ticks','random crit/double procs'],weaponContributionExample:{full:stats(full),withoutWeapon:stats(withoutWeapon)},profiles:rows};
writeFileSync(dir+'/profiles.json',JSON.stringify(findings,null,2));
writeFileSync(dir+'/profiles.csv','set,enhancement,focus,points,finger,pencil,small_poison,finger_wounded,pencil_wounded,poison_wounded\n'+rows.map(r=>[r.set,r.enhancement,r.focus,r.pointsSpent,...r.opening.map(x=>x.hit),...r.wounded.map(x=>x.hit)].join(',')).join('\n'));
let report='# Модель PvP: спорядження та таланти\n\nРозраховано '+rows.length+' профілів через чинні buildEffectiveWeapon + resolveTalentAttack. Розподіли талантів побудовані через applyTalentUpgrade з перевіркою залежностей. Це синтетичні профілі, не статистика гравців. Стабільний удар без випадкового криту/подвоєння; показані умови відкриття та добивання з мітками/кровотечею, без шкоди кровотечі за час.\n\n| Сет | Заточка | Очки талантів | Палець | Олівець | Мала отрута |\n|---|---:|---:|---:|---:|---:|\n';
for(const r of rows.filter(r=>r.focus==='balanced'&&[0,15].includes(r.enhancement)))report+='| '+[r.set,r.enhancement,r.pointsSpent,...r.opening.map(x=>x.hit)].join(' | ')+' |\n';
report+='\n## Висновки\n\n- База трьох прийомів уже визначена зброєю/навичкою: fist=20, knuckle=50, satchel=35. До них додаються таланти та чинні бонуси предметів/сету. HP цілі не має задавати силу удару.\n- Заточка в наявній грі підсилює отрути: шість речей +15 дають +90 процентних пунктів до множника базової шкоди отрут. Фізичні удари від самої заточки зараз не зростають.\n- Перенесення PvE без адаптації не забезпечує однакову тривалість дуелей. Раніше запропоновані 2600 HP не є готовим балансом для всіх профілів.\n- Сила PvP-урону має походити від надітого спорядження/зброї та вибраної гілки талантів. Окремий PvP-коефіцієнт і підбір близьких за силою суперників потрібні до фіксації HP.\n- Перед повною симуляцією дуелей треба визначити раундові еквіваленти cooldown, bleed, marks, crit, double strike та boss-only бонусів. Час на роздуми не повинен створювати додаткову кровотечу.\n- Середній/великий яд, економія витратників, енергія й броня боса не мають автоматично діяти в RPS-режимі з трьома діями. Кожен талант позначається: діє без змін, адаптований, не застосовується.\n- Ніяких PvP-функцій, нагород або змін бою на сервер не встановлено.\n';
writeFileSync(dir+'/MODEL.md',report);
console.log(JSON.stringify({profiles:rows.length,firstSet15:rows.filter(r=>r.set==='cardboard_survivor'&&r.enhancement===15&&r.focus==='balanced').map(r=>({points:r.pointsSpent,hit:r.opening.map(x=>x.hit)})),shkraban15:rows.filter(r=>r.set==='shkraban'&&r.enhancement===15&&r.focus==='balanced').map(r=>({points:r.pointsSpent,hit:r.opening.map(x=>x.hit)})),files:[dir+'/MODEL.md',dir+'/profiles.csv',dir+'/profiles.json']},null,2));
