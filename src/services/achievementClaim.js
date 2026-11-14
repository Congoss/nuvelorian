import { getTelegramSession } from '@/lib/platform/telegram';
export async function claimAchievement(id) {
 const session=getTelegramSession();
 const headers={Accept:'application/json'};
 if(session?.initData)headers['X-Telegram-Init-Data']=session.initData;
 if(session?.telegramId)headers['X-Telegram-User-Id']=String(session.telegramId);if(session?.source==='mock')headers['X-Telegram-Mock-User']='true';
 const response=await fetch('/api/player-achievements/'+encodeURIComponent(id)+'/claim',{method:'POST',headers});
 const payload=await response.json();
 if(!response.ok)throw new Error(payload.message||payload.error||'CLAIM_FAILED');
 return payload.data;
}
