import { resolveBoneCurse } from './skeletonBattlePassSet.js';
import { hasBossArmor, SHKRABAN_ARMOR } from './bossArmor.js';
import { advancedLevel as A } from './advancedTalents.js';
import { getPoisonPreserveChance } from './talents.js';
export const TALENT_ATTACK_TYPES=Object.freeze({FINGER:'fist',PENCIL:'knuckle',SMALL_POISON:'satchel',MEDIUM_POISON:'f4',LARGE_POISON:'c4'});
const POISONS=new Set(['satchel','f4','c4']); const n=v=>Math.max(0,Number(v||0)); const ratio=f=>n(f?.current_hp)/Math.max(1,n(f?.max_hp));
export function createTalentCombatState(s={}){return {...s,toxicMarks:Math.min(15,n(s.toxicMarks)),bleed:s.bleed||null};}
export function getBleedTicks(s, now = Date.now(), random = Math.random) {
  const b = s?.bleed;
  if (!b) return { state: s, damage: 0, ticks: 0 };
  const until = Math.min(now, n(b.expiresAt));
  const ticks = Math.max(0, Math.floor((until - n(b.lastTickAt)) / 1000));
  const expired = now >= n(b.expiresAt);
  const state = expired ? { ...s, bleed: null } : ticks > 0 ? { ...s, bleed: { ...b, lastTickAt: n(b.lastTickAt) + ticks * 1000 } } : s;
  let damage = ticks * n(b.damage);
  if (n(b.critChance)>0) for(let i=0;i<ticks;i++) if(random()<Math.min(1,n(b.critChance))) damage+=n(b.damage);
  return { state, damage, ticks };
}
export function resolveTalentAttack({weapon,levels={},state:raw,fight,now=Date.now(),random=Math.random, batchIndex=0, batchCount=1}){const tick=getBleedTicks(createTalentCombatState(raw),now,random),s=createTalentCombatState(tick.state),L=id=>n(levels[id]),marks=n(s.toxicMarks=Math.min(5+A(levels,'a08'),n(s.toxicMarks))),bleeding=!!(s.bleed&&n(s.bleed.expiresAt)>now),hp=ratio(fight);let flat=L('t10')*2+L('t41')*3+L('t58')*5,crit=n(weapon.critChance);
flat+=L('t50')*5;if(hp<.5)flat+=L('t43')*6;if(hp<.25)flat+=L('t45')*10;if(hp<.15)flat+=L('t46')*15;if(hp<.1)flat+=L('t56')*25;if(weapon.id==='fist'||weapon.id==='knuckle')crit+=L('t05')*.01;if(hp<.5)crit+=L('t57')*.02;
if(weapon.id==='fist'){if(marks>=3)flat+=L('t15')*10;if(hp<.5)flat+=L('t16')*8;if(marks>=5)flat+=L('t17')*15;if(bleeding)flat+=L('t18')*8;if(hp<.15)flat+=L('t19')*15;if(hp>=.75)flat+=L('t55')*8;crit+=L('t14')*.01;}
if(weapon.id==='knuckle'){if(bleeding)flat+=L('t24')*8;if(marks)flat+=L('t26')*6;if(marks>=3)flat+=L('t30')*15+L('t54')*20;if(hp<.2)flat+=L('t29')*12;if(hp>=.75)flat+=L('t55')*8;crit+=L('t28')*.01;}
if(POISONS.has(weapon.id)){flat+=L('t49')*10+marks*L('t36')*3;if(weapon.id==='satchel')flat+=L('t35')*3;if(weapon.id==='f4')flat+=L('t37')*5;if(bleeding)flat+=L('t42')*8;if(marks>=3)flat+=L('t59')*15;}if(bleeding&&marks>=5)flat+=L('t60')*20;
if(POISONS.has(weapon.id)&&bleeding)crit+=A(levels,'a16')*.01;
if(POISONS.has(weapon.id))crit+=n(s.lastDropStacks)*A(levels,'a20')*.002;
const isCrit=crit>0&&random()<Math.min(1,crit);let damage=Math.max(1,Math.floor((n(weapon.damage)+flat)*(isCrit?2:1)));if(isCrit&&weapon.id==='fist')damage+=L('t20')*10;if(weapon.advancedAttack)damage=Math.floor(damage*1.2);if(POISONS.has(weapon.id)&&n(s.breachUntil)>now)damage=Math.floor(damage*(1+A(levels,'a10')*.02));const physical=['fist','knuckle'].includes(weapon.id);const doubleChance=(weapon.id==='fist'?L('t13')*.005:0)+(physical?A(levels,'a06')*.01:0);const doubled=doubleChance>0&&random()<doubleChance;const hitCount=doubled?(A(levels,'a07')>0&&random()<A(levels,'a07')*.01?3:2):1;let repeatDamage=damage*(hitCount-1);
if(weapon.id==='knuckle'){const duration=6000+L('t23')*1000+(bleeding?L('t25')*1000:0);s.bleed={critChance:A(levels,'a14')*.01,baseDuration:duration,damage:5+L('t07')*3+L('t22')*3+L('t51')*8+(marks>=3?L('t27')*5:0),lastTickAt:now,expiresAt:Math.max(now+duration,bleeding?n(s.bleed.expiresAt)+L('t25')*1000:0)};}if(weapon.id==='satchel'||weapon.id==='f4')s.toxicMarks=Math.min(5+A(levels,'a08'),marks+1);if(weapon.id==='c4'&&marks>=5){damage+=Math.floor((L('t38')*60+L('t40')*80+L('t53')*75)*(isCrit?2:1)*(1+Math.max(0,marks-5)*A(levels,'a13')*.005)*(1+(n(s.breachUntil)>now?A(levels,'a10')*.02:0)));s.toxicMarks=A(levels,'a11')>0&&random()<A(levels,'a11')*.02?marks:0;}return{hitCount,damage,bleedDamage:tick.damage,repeatDamage,isCrit,critChance:crit,state:s,reasons:[],poisonPreserveChance:getPoisonPreserveChance(levels,weapon.id)};}
export function registerHpThresholds(s){return createTalentCombatState(s);}

// Equipment must not replace a stronger active wound or discard pending ticks.
export function applyEquipmentBleed(state, { damage, durationMs, now = Date.now() }) {
  const current = state?.bleed;
  const active = current && n(current.expiresAt) > now;
  return {
    ...state,
    bleed: {
      ...(active ? current : {}),
      damage: Math.max(n(damage), active ? n(current.damage) : 0),
      lastTickAt: active ? current.lastTickAt : now,
      expiresAt: Math.max(now + n(durationMs), active ? n(current.expiresAt) : 0),
    },
  };
}


// Resolve batch-only effects once; dose damage/crit/mark consumption remain sequential.
export function resolveTalentBatch({weapon,levels={},state={},fight={},player,now=Date.now(),count=1,random=Math.random}) {
 const poison=POISONS.has(weapon.id), physical=['fist','knuckle'].includes(weapon.id);
 const uses=poison&&[1,5,10,100].includes(count)?count:1;
 let runtime=createTalentCombatState(state), damage=0,bleedDamage=0,isCrit=false,hits=0;
 const armored=hasBossArmor(fight);
 const wasOpen=n(runtime.breachUntil)>now;
 const blockChance=armored&&!wasOpen?(poison?SHKRABAN_ARMOR.poisonBlockChance:SHKRABAN_ARMOR.physicalBlockChance):0;
 const blocked=blockChance>0&&random()<blockChance;
 let breach=false;
 const attempt=()=>{if(!armored||breach)return;const chance=poison?A(levels,'a03')*.005+n(runtime.corrosionStacks)*A(levels,'a09')*.001:weapon.advancedAttack?A(levels,weapon.id==='fist'?'a01':'a02')*.01*(weapon.id==='knuckle'?2:1):0;if(chance>0&&random()<chance)breach=true;};
 if(poison)attempt();
 if(blocked){const tick=getBleedTicks(runtime,now,random);runtime=tick.state;bleedDamage=tick.damage;if(physical)attempt();}
 else for(let i=0;i<uses;i++){
  const hit=resolveTalentAttack({weapon,levels,state:runtime,fight,now,random});runtime=hit.state;damage+=hit.damage+hit.repeatDamage;bleedDamage+=hit.bleedDamage;isCrit ||= hit.isCrit;hits+=hit.hitCount;
  if(physical)for(let j=0;j<hit.hitCount;j++)attempt();
 }
 if(poison&&armored&&!wasOpen){runtime.corrosionStacks=A(levels,'a09')>0?(breach?0:Math.min(5,n(runtime.corrosionStacks)+1)):0;}
 if(poison&&!blocked){
  if(['satchel','f4'].includes(weapon.id)&&A(levels,'a12')>0&&random()<A(levels,'a12')*.02)runtime.toxicMarks=Math.min(5+A(levels,'a08'),runtime.toxicMarks+1);
  const bleed=runtime.bleed;
  if(bleed&&n(bleed.expiresAt)>now){let until=n(bleed.expiresAt);
   if(A(levels,'a15')>0&&random()<A(levels,'a15')*.02)until=Math.max(until,Math.min(now+60000,until+3000));
   if(isCrit&&A(levels,'a19')>0&&random()<A(levels,'a19')*.02)until=Math.max(until,now+Math.min(60000,n(bleed.baseDuration)||16000));
   runtime={...runtime,bleed:{...bleed,expiresAt:until}};
  }
  runtime.lastDropStacks=A(levels,'a20')>0?(isCrit?0:Math.min(5,n(runtime.lastDropStacks)+1)):0;
 }
 const cooldownResets=[];
 if(physical&&weapon.advancedAttack&&A(levels,'a05')>0&&random()<A(levels,'a05')*.01)cooldownResets.push(weapon.id);
 if(breach){runtime.breachUntil=Math.max(n(runtime.breachUntil),now+SHKRABAN_ARMOR.baseBreachMs+A(levels,'a04')*SHKRABAN_ARMOR.breachPerLevelMs);runtime.corrosionStacks=0;if(!wasOpen&&A(levels,'a18')>0&&random()<A(levels,'a18')*.02)cooldownResets.push('fist','knuckle');}
 const refundBatch=poison&&blocked&&A(levels,'a17')>0&&random()<A(levels,'a17')*.03;
 runtime.lastArmorResult=armored?{blocked,breached:breach,count:uses,at:now}:null;
 const curse = player && poison && !blocked ? resolveBoneCurse(player, damage, now, random) : null;
 return {state:runtime,damage:curse?.damage ?? damage,bleedDamage,repeatDamage:0,isCrit,blocked,breached:breach,refundBatch,cooldownResets:[...new Set(cooldownResets)],hits,boneCurseApplied:curse?.applied ?? false};
}
export function applyTalentCooldownResets(player,result){
 if(!result.cooldownResets?.length)return;
 const cooldowns={...player.weapon_cooldowns};for(const id of result.cooldownResets)delete cooldowns[id];player.weapon_cooldowns=cooldowns;
}
