import { randomUUID } from 'node:crypto';
import { withKeyLock } from '../utils/keyLock.js';
const langs=['uk','ru','en'];
const language=p=>String(p.language||'uk').toLowerCase().startsWith('ru')?'ru':String(p.language||'').toLowerCase().startsWith('en')?'en':'uk';
export function newsRecipients(players,segment='all',now=Date.now()) {
 if(!['all','new','inactive','active'].includes(segment))throw Object.assign(new Error('INVALID_SEGMENT'),{statusCode:400});
 const unique=new Map();
 for(const p of players){
  if(!/^\d+$/.test(String(p.telegram_id||''))||p.is_banned||p.telegram_news_blocked)continue;
  const last=Date.parse(p.last_seen_at||p.last_login_date||''),created=Date.parse(p.created_at||p.created_date||'');
  if(segment==='new'&&!(created>=now-7*86400000))continue;
  if(segment==='inactive'&&!(Number.isFinite(last)&&last<now-3*86400000))continue;
  if(segment==='active'&&!(last>=now-86400000))continue;
  unique.set(String(p.telegram_id),{chatId:String(p.telegram_id),language:language(p),status:'pending'});
 }
 return [...unique.values()];
}
export function createNewsDraft(players,body,now=Date.now()) {
 const texts=Object.fromEntries(langs.map(lang=>[lang,String(body.texts?.[lang]||'').trim()]));
 const photo=String(body.photo||'').trim();
 if(langs.some(lang=>!texts[lang]||texts[lang].length>(photo?1024:4096)))throw Object.assign(new Error(photo?'TEXT_REQUIRED_MAX_1024':'TEXT_REQUIRED_MAX_4096'),{statusCode:400});
 if(photo&&!/^https:\/\/[^\s]+$/i.test(photo)&&!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(photo))throw Object.assign(new Error('INVALID_IMAGE'),{statusCode:400});
 if(photo.length>800000)throw Object.assign(new Error('IMAGE_TOO_LARGE'),{statusCode:400});
 const recipients=newsRecipients(players,body.segment,now);
 return {id:randomUUID(),createdAt:new Date(now).toISOString(),status:'draft',texts,photo,segment:body.segment||'all',recipients};
}
export function newsSummary(job, includeMedia = true) {
 const counts={pending:0,sent:0,failed:0,blocked:0,uncertain:0,sending:0};const reasons={};for(const r of job.recipients){counts[r.status]=(counts[r.status]||0)+1;if(['failed','blocked','uncertain'].includes(r.status)){const reason=String(r.error||'Unknown').slice(0,250);reasons[reason]=(reasons[reason]||0)+1;}}
 return {id:job.id,createdAt:job.createdAt,status:job.status,segment:job.segment,texts:job.texts,photo:includeMedia?job.photo:undefined,hasPhoto:Boolean(job.photo),total:job.recipients.length,counts,errorReasons:Object.entries(reasons).map(([message,count])=>({message,count})).sort((a,b)=>b.count-a.count),returns:Object.keys(job.returns||{}).length,test:job.test===true};
}
export function telegramNewsPayload(job,recipient) {
 const text=job.texts[recipient.language]||job.texts.uk;
 const bot=String(process.env.TELEGRAM_BOT_USERNAME||process.env.VITE_TELEGRAM_BOT_USERNAME||'planet_4bot').replace(/^@/,'');
 const reply_markup={inline_keyboard:[[{text:{uk:'Грати',ru:'Играть',en:'Play'}[recipient.language]||'Play',url:`https://t.me/${bot}?startapp=news_${job.id.replaceAll('-','')}`}]]};
 return {chat_id:recipient.chatId,...(job.photo?{photo:job.photo,caption:text}:{text}),reply_markup};
}
export async function sendNewsTelegram(job,recipient,token,fetcher=fetch) {
 const payload=telegramNewsPayload(job,recipient);let body,headers;
 if(job.photo.startsWith('data:')){
  const [prefix,data]=job.photo.split(',');const mime=prefix.includes('png')?'image/png':'image/jpeg';
  const form=new FormData();for(const [key,value]of Object.entries(payload))if(key!=='photo')form.append(key,typeof value==='object'?JSON.stringify(value):value);
  form.append('photo',new Blob([Buffer.from(data,'base64')],{type:mime}),mime==='image/png'?'news.png':'news.jpg');body=form;
 }else{body=JSON.stringify(payload);headers={'Content-Type':'application/json'};}
 const response=await fetcher(`https://api.telegram.org/bot${token}/${job.photo?'sendPhoto':'sendMessage'}`,{method:'POST',headers,body,signal:AbortSignal.timeout(15000)});
 const result=await response.json();
 if(!response.ok||!result.ok){const error=new Error('TELEGRAM_SEND_FAILED');error.telegramCode=result.error_code||response.status;error.retryAfter=result.parameters?.retry_after;error.telegramDescription=String(result.description||'').slice(0,240);throw error;}
 return result.result?.message_id;
}
let running=false;
export async function processNewsQueue(store,{token=process.env.TELEGRAM_BOT_TOKEN,send=sendNewsTelegram,persist=()=>store.persistNow(),now=Date.now()}={}) {
 if(running||!String(token||'').trim())return;running=true;
 try{await withKeyLock('telegram-news',async()=>{
  const job=(store.newsCampaigns||[]).find(job=>job.status==='queued'||job.status==='sending');if(!job)return;
  job.status='sending';
  // A persisted in-flight send after restart has an unknown delivery outcome. Never blindly resend.
  for(const recipient of job.recipients)if(recipient.status==='sending')recipient.status='uncertain';
  let count=0;
  for(const recipient of job.recipients){
   if(count>=5)break;if(recipient.status!=='pending'||Number(recipient.notBefore||0)>now)continue;
   recipient.status='sending';await persist();count++;
   try{recipient.messageId=await send(job,recipient,token);recipient.status='sent';recipient.sentAt=new Date().toISOString();}
   catch(error){
    if(error.telegramCode===429){recipient.status='pending';recipient.notBefore=Date.now()+Math.max(1,Number(error.retryAfter)||30)*1000;await persist();break;}
    recipient.status=error.telegramCode===403?'blocked':error.telegramCode?'failed':'uncertain';
    recipient.error=error.telegramCode?'Telegram '+error.telegramCode+(error.telegramDescription?': '+error.telegramDescription:''):'Delivery unknown';
   }
   await persist();
  }
  if(!job.recipients.some(r=>r.status==='pending'||r.status==='sending'))job.status='completed';
  await persist();
 });}finally{running=false;}
}

export function recordNewsReturn(store,player,startParam,now=Date.now()) {
 const match=String(startParam||'').match(/^news_([a-f0-9]{32})$/);if(!match)return;
 const job=(store.newsCampaigns||[]).find(item=>item.id.replaceAll('-','')===match[1]);if(!job||job.test)return;
 const recipient=job.recipients.find(r=>r.chatId===String(player.telegram_id)&&r.status==='sent');
 if(!recipient||now-Date.parse(recipient.sentAt)>7*86400000)return;
 job.returns||={};if(!job.returns[player.id])job.returns[player.id]=new Date(now).toISOString();
}
