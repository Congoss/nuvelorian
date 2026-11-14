export async function prepareReferralMessage({player,token,language='en',fetchImpl=fetch}) {
 const userId=Number(player.telegram_id);
 const code=String(player.referral_code||player.telegram_id||player.id);
 if(!Number.isSafeInteger(userId)||userId<=0||!/^[A-Za-z0-9_-]{1,60}$/.test(code))throw new Error('Telegram referral account required');
 if(!token)throw new Error('Telegram bot is not configured');
 const origin=new URL(process.env.PUBLIC_APP_URL||'https://p4.nuvelor.gg').origin;
 const bot=String(process.env.TELEGRAM_BOT_USERNAME||process.env.VITE_TELEGRAM_BOT_USERNAME||'planet_4bot').replace(/^@/,'');
 const link='https://t.me/'+encodeURIComponent(bot)+'?startapp=ref_'+encodeURIComponent(code);
 const copy={uk:['Боси, прокачка та пригоди — грай зі мною!','🎮 Грати в PLANET4'],ru:['Боссы, прокачка и приключения — играй со мной!','🎮 Играть в PLANET4'],en:['Boss battles, upgrades and adventures — join me!','🎮 Play PLANET4']}[language]||['Boss battles, upgrades and adventures — join me!','🎮 Play PLANET4'];
 const response=await fetchImpl('https://api.telegram.org/bot'+token+'/savePreparedInlineMessage',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({user_id:userId,allow_user_chats:true,allow_group_chats:true,allow_channel_chats:true,result:{type:'photo',id:'ref_'+code,photo_url:origin+'/referral-card-v2.jpg',thumbnail_url:origin+'/referral-card-v2.jpg',photo_width:1280,photo_height:720,caption:'PLANET4 · NUVELORIAN\n\n'+copy[0],reply_markup:{inline_keyboard:[[{text:copy[1],url:link}]]}}})});
 const data=await response.json();
 if(!response.ok||!data.ok||!data.result?.id)throw new Error(data.description||'Could not prepare referral invitation');
 return data.result;
}
