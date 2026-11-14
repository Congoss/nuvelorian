import {existsSync,readFileSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
// Dedicated pilot settings contain public IDs and a private-file path only.
// Existing hosting/database credentials are neither read nor changed here.
const file=resolve('.market-pilot.json');
export function mainnetAgentsEnabled(){
 if(process.env.MARKET_AGENTS_ENABLED==='0')return false;
 try{const settings=JSON.parse(readFileSync(file,'utf8'));return settings.enabled===true&&settings.agentsEnabled!==false;}catch{return false;}
}
if(existsSync(file))try{
 const settings=JSON.parse(readFileSync(file,'utf8'));
 // Generic guard (no private IDs in source): a small numeric allow-list, an owner from that
 // list, and an agent key file outside the project directory.
 const ids=Array.isArray(settings.telegramIds)?settings.telegramIds.map(String).sort():[];
 const owner=String(settings.ownerTelegramId||'');
 const keys=String(settings.agentKeysFile||'');
 const valid=ids.length>=1&&ids.length<=5&&ids.every(id=>/^\d{5,15}$/.test(id))&&ids.includes(owner)
  &&isAbsolute(keys)&&!resolve(keys).startsWith(resolve('.')+sep);
 if(settings.enabled!==true){process.env.MARKET_MAINNET_PILOT='0';}
 else if(!valid){
  process.env.MARKET_MAINNET_PILOT='0';console.error('[market-mainnet] PILOT_CONFIG_INVALID');
 }else{
  process.env.MARKET_MAINNET_PILOT='1';process.env.MARKET_TEAM_TELEGRAM_IDS=ids.join(',');process.env.MARKET_PILOT_OWNER_TELEGRAM_ID=owner;process.env.MARKET_AGENT_KEYS_FILE=settings.agentKeysFile;
  process.env.MARKET_AGENTS_ENABLED=settings.agentsEnabled===false?'0':'1';
 }
}catch{
 process.env.MARKET_MAINNET_PILOT='0';console.error('[market-mainnet] PILOT_CONFIG_INVALID');
}
