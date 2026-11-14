import {GAME_CONFIG} from '../src/lib/gameConfig.js';
import {BASE_TALENT_DEFS,buildEffectiveWeapon} from '../src/lib/talents.js';
import {ADVANCED_TALENTS} from '../src/lib/advancedTalents.js';
import {resolveTalentBatch} from '../src/lib/talentCombat.js';
import fs from 'node:fs/promises';
let seed=1897;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const levels=Object.fromEntries(BASE_TALENT_DEFS.map(t=>[t.id,10]));
const profiles={old:{talent_tree_version:2,talent_levels:levels},new:{talent_tree_version:2,talent_levels:{...levels,...Object.fromEntries(ADVANCED_TALENTS.map(t=>[t.id,10]))}}};
const rows=[];
for(const gear of ['none','anubis'])for(const version of ['old','new'])for(const count of [1,100]){
 const p={...profiles[version]};if(gear==='anubis'){p.equipped_items=Object.fromEntries(['head','body','hands','legs','boots','weapon'].map(slot=>[slot,`anubis_${slot}`]));p.inventory_items=Object.values(p.equipped_items).map(id=>({id,enhancementLevel:15}));p.equipped_items.pet='hereearlypet';}
 let sum=0;
 for(let i=0;i<2000;i++){
 let state={toxicMarks:version==='old'?5:15,bleed:{damage:245,lastTickAt:1000,expiresAt:60000,critChance:version==='new'?.1:0},breachUntil:version==='new'?21000:0};
 const hit=resolveTalentBatch({weapon:buildEffectiveWeapon(GAME_CONFIG.WEAPONS.find(w=>w.id==='c4'),p),levels:p.talent_levels,state,fight:{boss_id:'boss8',current_hp:40000,max_hp:100000},now:1000,count,random});sum+=hit.damage;
 }
 rows.push({gear,version,count,meanDirectDamage:Math.round(sum/2000)});
}
await fs.writeFile('docs/advanced-talents-simulation.json',JSON.stringify({seed:1897,iterations:2000,note:'Comparison scenario only: low HP Shkraban, bleeding, initial marks 5/15; new build starts with an open breach, old faces armor. Not a release balance certification.',rows},null,2));console.log(JSON.stringify(rows));
