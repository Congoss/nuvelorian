import { getPoisonPreserveChance } from './talents.js';
export const TALENT_ATTACK_TYPES=Object.freeze({FINGER:'fist',PENCIL:'knuckle',SMALL_POISON:'satchel',MEDIUM_POISON:'f4',LARGE_POISON:'c4'});
const POISONS=new Set(['satchel','f4','c4']); const n=v=>Math.max(0,Number(v||0)); const ratio=f=>n(f?.current_hp)/Math.max(1,n(f?.max_hp));
export function createTalentCombatState(s={}){return {...s,toxicMarks:Math.min(5,n(s.toxicMarks)),bleed:s.bleed||null};}
export function getBleedTicks(s, now = Date.now()) {
  const b = s?.bleed;
  if (!b) return { state: s, damage: 0, ticks: 0 };
  const until = Math.min(now, n(b.expiresAt));
  const ticks = Math.max(0, Math.floor((until - n(b.lastTickAt)) / 1000));
  const expired = now >= n(b.expiresAt);
  const state = expired ? { ...s, bleed: null } : ticks > 0 ? { ...s, bleed: { ...b, lastTickAt: n(b.lastTickAt) + ticks * 1000 } } : s;
  return { state, damage: ticks * n(b.damage), ticks };
}
export function resolveTalentAttack({weapon,levels={},state:raw,fight,now=Date.now(),random=Math.random}){const tick=getBleedTicks(createTalentCombatState(raw),now),s=createTalentCombatState(tick.state),L=id=>n(levels[id]),marks=n(s.toxicMarks),bleeding=!!(s.bleed&&n(s.bleed.expiresAt)>now),hp=ratio(fight);let flat=L('t10')*2+L('t41')*3+L('t58')*5,crit=0;
flat+=L('t50')*5;if(hp<.5)flat+=L('t43')*6;if(hp<.25)flat+=L('t45')*10;if(hp<.15)flat+=L('t46')*15;if(hp<.1)flat+=L('t56')*25;if(weapon.id==='fist'||weapon.id==='knuckle')crit+=L('t05')*.01;if(hp<.5)crit+=L('t57')*.02;
if(weapon.id==='fist'){if(marks>=3)flat+=L('t15')*10;if(hp<.5)flat+=L('t16')*8;if(marks>=5)flat+=L('t17')*15;if(bleeding)flat+=L('t18')*8;if(hp<.15)flat+=L('t19')*15;if(hp>=.75)flat+=L('t55')*8;crit+=L('t14')*.01;}
if(weapon.id==='knuckle'){if(bleeding)flat+=L('t24')*8;if(marks)flat+=L('t26')*6;if(marks>=3)flat+=L('t30')*15+L('t54')*20;if(hp<.2)flat+=L('t29')*12;if(hp>=.75)flat+=L('t55')*8;crit+=L('t28')*.01;}
if(POISONS.has(weapon.id)){flat+=L('t49')*10+marks*L('t36')*3;if(weapon.id==='satchel')flat+=L('t35')*3;if(weapon.id==='f4')flat+=L('t37')*5;if(bleeding)flat+=L('t42')*8;if(marks>=3)flat+=L('t59')*15;}if(bleeding&&marks>=5)flat+=L('t60')*20;
const isCrit=crit>0&&random()<Math.min(1,crit);let damage=Math.max(1,Math.floor((n(weapon.damage)+flat)*(isCrit?2:1)));if(isCrit&&weapon.id==='fist')damage+=L('t20')*10;const repeatDamage=weapon.id==='fist'&&random()<L('t13')*.005?damage:0;
if(weapon.id==='knuckle'){const duration=6000+L('t23')*1000+(bleeding?L('t25')*1000:0);s.bleed={damage:5+L('t07')*3+L('t22')*3+L('t51')*8+(marks>=3?L('t27')*5:0),lastTickAt:now,expiresAt:now+duration};}if(weapon.id==='satchel'||weapon.id==='f4')s.toxicMarks=Math.min(5,marks+1);if(weapon.id==='c4'&&marks>=5){damage+=L('t38')*60+L('t40')*80+L('t53')*75;s.toxicMarks=0;}return{damage,bleedDamage:tick.damage,repeatDamage,isCrit,critChance:crit,state:s,reasons:[],poisonPreserveChance:getPoisonPreserveChance(levels,weapon.id)};}
export function registerHpThresholds(s){return createTalentCombatState(s);}
