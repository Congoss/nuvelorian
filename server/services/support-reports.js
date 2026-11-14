import {randomUUID} from 'node:crypto';
import {getPostgresSql} from '../data/postgres.js';
import {saveLocalState} from '../data/local-state.js';
let ready;
const db=()=>['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(k=>String(process.env[k]||'').trim());
async function schema(){if(!ready)ready=getPostgresSql()`CREATE TABLE IF NOT EXISTS support_reports (id TEXT PRIMARY KEY,player_id TEXT NOT NULL,body JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())`.catch(e=>{ready=null;throw e;});await ready;}
export async function submitBug(store,player,body){
 const text=String(body.text||'').trim();if(text.length<3||text.length>2000)throw Object.assign(Error('REPORT_TEXT_INVALID'),{statusCode:400});
 const now=Date.now();if(now-Date.parse(player.last_bug_report_at||'1970-01-01')<60000)throw Object.assign(Error('REPORT_COOLDOWN'),{statusCode:429});
 const row={id:randomUUID(),playerId:String(player.id),nickname:player.nickname||player.username||'',text,language:player.language||'uk',version:String(body.version||'').slice(0,30),status:'new',createdAt:new Date(now).toISOString()};
 if(db()){await schema();const sql=getPostgresSql();await sql`INSERT INTO support_reports (id,player_id,body) VALUES (${row.id},${row.playerId},${JSON.stringify(row)}::jsonb)`;}
 else {const reports=[...(store.supportReports||[]),row];const ok=saveLocalState({...store,supportReports:reports});if(!ok)throw Object.assign(Error('REPORT_STORAGE_UNAVAILABLE'),{statusCode:503});store.supportReports=reports;}
 player.last_bug_report_at=row.createdAt;return {id:row.id};
}
export async function supportReports(store,id,status){
 if(id&&!['new','reviewing','closed'].includes(status))throw Object.assign(Error('STATUS_INVALID'),{statusCode:400});
 if(db()){await schema();const sql=getPostgresSql();if(id)await sql`UPDATE support_reports SET body=jsonb_set(body,'{status}',${JSON.stringify(status)}::jsonb) WHERE id=${id}`;return (await sql`SELECT body FROM support_reports ORDER BY created_at DESC LIMIT 500`).map(r=>r.body);}
 if(id){const row=(store.supportReports||[]).find(r=>r.id===id);if(row)row.status=status;await store.persistNow();}
 return [...(store.supportReports||[])].reverse().slice(0,500);
}
