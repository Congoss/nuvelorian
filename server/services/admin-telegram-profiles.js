// Read-only lookup: never sends messages or changes player balances/state.
export async function resolveTelegramProfiles(players, ids, {token, fetchImpl=fetch}={}) {
  if (!token) throw Object.assign(new Error('Telegram bot is not configured'), {statusCode:503});
  if (!Array.isArray(ids) || ids.length>5 || ids.some(id=>typeof id!=='string')) throw Object.assign(new Error('Expected up to 5 player IDs'), {statusCode:400});
  const selected=new Set(ids);
  return Promise.all(players.filter(p=>selected.has(p.id)).map(async p=>{
    const telegramId=String(p.telegram_id||'');
    const result={id:p.id,telegramId,telegramUsername:'',telegramLink:'',telegramStatus:'unavailable'};
    if(!/^[1-9]\d*$/.test(telegramId))return {...result,telegramStatus:'not_linked'};
    try {
      const response=await fetchImpl(`https://api.telegram.org/bot${token}/getChat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:telegramId}),signal:AbortSignal.timeout(8000)});
      const body=await response.json();
      if(body.error_code===429)return {...result,telegramStatus:'rate_limited',retryAfter:Math.max(1,Number(body.parameters?.retry_after)||30)};
      if(!response.ok||!body.ok||body.result?.type!=='private'||String(body.result.id)!==telegramId)return result;
      const username=String(body.result.username||'');
      return {...result,telegramUsername:username,telegramLink:username?`https://t.me/${username}`:'',telegramStatus:username?'found':'no_username'};
    } catch { return result; }
  }));
}
