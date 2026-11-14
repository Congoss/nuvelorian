import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import {mkdir,appendFile} from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import readline from 'node:readline';
export const auditContext=new AsyncLocalStorage();
const directory=()=>path.resolve(process.env.PLAYER_AUDIT_DIR || 'data/player-audit');
const filename=id=>path.join(directory(),createHash('sha256').update(String(id)).digest('hex')+'.jsonl');
export function snapshotPlayer(player){return Object.fromEntries(['level','xp','xp_to_next_level','energy','max_energy','tentacles','premium','stat_strength','boss_kills','total_boss_damage','weapon_inventory','keycards','available_talent_points','battle_pass_xp','task_completions','equipped_items','talent_levels','boss_daily_rewards','ca_rank_rewards_claimed','roulette_bonus_spins','energy_spent_total','total_stolen','total_lost'].map(k=>[k,structuredClone(player[k]??null)]))}
const auditWrites=new Map();
export function appendPlayerAudit(id,event){
 const file=filename(id),line=JSON.stringify({at:new Date().toISOString(),...event})+'\n';
 const task=(auditWrites.get(file)||Promise.resolve()).then(async()=>{await mkdir(path.dirname(file),{recursive:true});await appendFile(file,line);}).catch(error=>console.error('[player-audit] write failed',error.message));
 auditWrites.set(file,task);void task.finally(()=>{if(auditWrites.get(file)===task)auditWrites.delete(file);});
}

export function trackPlayer(player){const ctx=auditContext.getStore();if(ctx&&player?.id&&!ctx.players.has(player.id))ctx.players.set(player.id,{player,before:snapshotPlayer(player)})}
export function auditXp(player,amount){const ctx=auditContext.getStore();if(ctx)ctx.xp.push({playerId:player.id,amount,stack:new Error().stack.split('\n').slice(2,6).map(s=>s.trim())})}
export async function withPlayerAudit(request,response,action){const ctx={id:randomUUID(),route:new URL(request.url,'http://local').pathname,method:request.method,players:new Map(),xp:[],refs:{}};return auditContext.run(ctx,async()=>{try{return await action()}finally{for(const {player,before}of ctx.players.values()){const after=snapshotPlayer(player);if(!['GET','HEAD','OPTIONS'].includes(ctx.method)||JSON.stringify(before)!==JSON.stringify(after))appendPlayerAudit(player.id,{requestId:ctx.id,route:ctx.route,method:ctx.method,status:response.statusCode,code:response.diagnosticCode||null,refs:ctx.refs,result:ctx.result||null,before,after,xpGrants:ctx.xp.filter(x=>x.playerId===player.id)})}}})}
export function auditBody(body){const ctx=auditContext.getStore();if(!ctx)return;for(const k of ['id','fightId','bossId','taskId','questId','instanceId','rewardId','weaponId','multiplier','action','field','amount','count','missionId','requestId','targetId','isRevenge'])if(['string','number','boolean'].includes(typeof body[k]))ctx.refs[k]=String(body[k]).slice(0,150);for(const [key,value]of Object.entries({taskId:body.task?.id,actionType:body.playerAction?.type,itemId:body.playerAction?.itemId,actionRequestId:body.playerAction?.requestId,rank:body.claimCARankReward?.rank}))if(['string','number'].includes(typeof value))ctx.refs[key]=String(value).slice(0,150)}
export function auditResult(data){const ctx=auditContext.getStore();if(!ctx||!data||typeof data!=='object')return;ctx.result={};for(const key of ['xpGranted','xpApplied','drops','reward','gainedXp','gainedTentacles','spentEnergy','completedCount','amount','success'])if(data[key]!==undefined)ctx.result[key]=structuredClone(data[key]);if(data.hit)ctx.result.hit=structuredClone(data.hit);if(data.fight)ctx.result.fight={id:data.fight.id,bossId:data.fight.boss_id,hp:data.fight.current_hp,maxHp:data.fight.max_hp};}
export async function readPlayerAudit(id,from='',to=''){await auditWrites.get(filename(id));const rows=[];if(!fs.existsSync(filename(id)))return rows;const stream=fs.createReadStream(filename(id));const lines=readline.createInterface({input:stream,crlfDelay:Infinity});for await(const line of lines){try{const row=JSON.parse(line);if((!from||row.at>=from)&&(!to||row.at<=to)){rows.push(row);if(rows.length>50000)throw Error('EXPORT_LIMIT')}}catch(error){if(error.message==='EXPORT_LIMIT')throw error}}return rows}
