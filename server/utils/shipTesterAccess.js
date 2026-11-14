import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
const digest=value=>createHash('sha256').update(String(value)).digest();
const equal=(a,b)=>{const x=digest(a),y=digest(b);return timingSafeEqual(x,y)};
export function createShipTesterAccess({password=()=>process.env.CLAN_SHIP_TEST_PASSWORD||'',secret=()=>process.env.CLAN_SHIP_TEST_SESSION_SECRET||'',now=Date.now,lifetimeMs=8*3600000,maxAttempts=5,windowMs=15*60000}={}){
 const attempts=new Map(),cookieName='p4_ship_tester';
 const get=value=>typeof value==='function'?value():value;
 const enabled=()=>Boolean(get(password));
 const key=()=>digest('p4-ship-test:'+get(secret)+':'+get(password));
 const sign=value=>createHmac('sha256',key()).update(value).digest('base64url');
 const token=(playerId,clanId)=>{const payload=Buffer.from(JSON.stringify({p:String(playerId),c:String(clanId),exp:now()+lifetimeMs})).toString('base64url');return payload+'.'+sign(payload)};
 function allowed(headers,playerId,clanId){
  if(!enabled())return false;
  const value=String(headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!value||value.length>2048)return false;const [payload,sig,extra]=value.split('.');if(!payload||!sig||extra||!equal(sig,sign(payload)))return false;
  try{const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.p===String(playerId)&&data.c===String(clanId)&&Number.isFinite(data.exp)&&data.exp>now();}catch{return false;}
 }
 function unlock(headers,playerId,clanId,entered,{secure=true}={}){
  if(!enabled())throw Object.assign(new Error('SHIP_TEST_DISABLED'),{statusCode:403,code:'SHIP_TEST_DISABLED'});
  const id=String(playerId),time=now();
  if(attempts.size>1000)for(const [key,state] of attempts)if(state.until<=time)attempts.delete(key);
  let entry=attempts.get(id);
  if(!entry||entry.until<=time){entry={count:0,until:time+windowMs};attempts.set(id,entry);}
  if(entry.count>=maxAttempts)throw Object.assign(new Error('SHIP_TEST_RATE_LIMIT'),{statusCode:429,code:'SHIP_TEST_RATE_LIMIT'});
  if(typeof entered!=='string'||entered.length>256||!equal(entered,get(password))){entry.count++;throw Object.assign(new Error('SHIP_TEST_PASSWORD_INVALID'),{statusCode:403,code:'SHIP_TEST_PASSWORD_INVALID'});}
  attempts.delete(id);
  if(attempts.size>10000)for(const [id,state] of attempts)if(state.until<=time)attempts.delete(id);
  return `${cookieName}=${token(playerId,clanId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(lifetimeMs/1000)}${secure?'; Secure':''}`;
 }
 return {enabled,allowed,unlock};
}
