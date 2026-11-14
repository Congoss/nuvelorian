import {createHash,timingSafeEqual} from 'node:crypto';
const same=(a,b)=>Boolean(a)&&Boolean(b)&&timingSafeEqual(createHash('sha256').update(String(a)).digest(),createHash('sha256').update(String(b)).digest());
export function adminRole(token,owner,operator=process.env.ADMIN_OPERATOR_PASSWORD){if(same(token,owner))return 'owner';if(same(token,operator))return 'operator';return null;}
export function operatorAllowed(path,method){path=path.replace(/^\/api/, '');
 if(method==='GET')return /^\/admin\/(analytics|players(?:\/summary)?|transactions(?:\/revenue)?|promo-codes|partners|leaderboard|mail-log)$/.test(path);
 if(method==='POST')return /^\/admin\/(grants(?:\/preview)?|promo-codes(?:\/(toggle|delete))?|partners(?:\/(update|delete))?|players\/ban|players\/[^/]+\/(starter-guide|battle-pass))$/.test(path);
 if(method==='PATCH'||method==='PUT')return /^\/admin\/players\/[^/]+$/.test(path);
 return false;
}
