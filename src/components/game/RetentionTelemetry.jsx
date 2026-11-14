import { useEffect } from 'react';
import { getTelegramSession } from '@/lib/platform/telegram';
export default function RetentionTelemetry({ playerId, screen }) {
 useEffect(()=>{
  if(!playerId)return;
  let busy=false;
  const ping=async()=>{
   if(document.visibilityState!=='visible'||busy)return;
   busy=true;
   try{const session=getTelegramSession();const headers={'Content-Type':'application/json'};if(session?.initData)headers['X-Telegram-Init-Data']=session.initData;if(session?.telegramId)headers['X-Telegram-User-Id']=String(session.telegramId);if(session?.source==='mock')headers['X-Telegram-Mock-User']='true';await fetch('/api/player-activity',{method:'POST',headers,body:JSON.stringify({screen})});}catch{/* Telemetry must not interrupt gameplay. */}finally{busy=false;}
  };
  ping();const interval=setInterval(ping,60000);document.addEventListener('visibilitychange',ping);
  return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',ping);};
 },[playerId,screen]);
 return null;
}
