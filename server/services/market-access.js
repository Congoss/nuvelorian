import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Local pilot only. Never grants access from a query parameter or client ID.
export function marketTeamAllowed(player,config){
  if(!player||player.is_banned||player.ai_agent?.key)return false;
  const id=String(player.telegram_id || '');
  return /^\d+$/.test(id)&&Array.isArray(config?.telegramIds)&&config.telegramIds.some(value=>String(value)===id);
}
export function readMarketAccess({env=process.env,file=resolve('.local/market-access.json')}={}){
  try{
    if(env.NODE_ENV==='production')return {telegramIds:String(env.MARKET_TEAM_TELEGRAM_IDS || '').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x))};
    // An existing file is authoritative, including an empty/revoked list.
    if(existsSync(file))return JSON.parse(readFileSync(file,'utf8'));
    return {telegramIds:String(env.MARKET_TEAM_TELEGRAM_IDS || '').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x))};
  }catch{return {telegramIds:[]};}
}
export const hasMarketAccess=player=>marketTeamAllowed(player,readMarketAccess());
