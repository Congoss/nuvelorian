import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createDuelService} from '../server/services/pvp-duel.js';
import {createBountyLedger,profitFromLocalStore} from '../server/services/pvp-bounty.js';
import {usdToHundredths} from '../src/lib/marketPricing.js';
// Merchant prizes read realised profit from the local market state (LOCAL_GAME_STATE_PATH).
// PVP_BOUNTY_DEMO_PROFIT_USD adds a demo profit per merchant for screen recordings only.
function localProfit(){
 const demo=usdToHundredths(Number(process.env.PVP_BOUNTY_DEMO_PROFIT_USD)||0);
 let real={smith:0,hunter:0};
 try{const path=process.env.LOCAL_GAME_STATE_PATH&&resolve(process.env.LOCAL_GAME_STATE_PATH);if(path&&existsSync(path))real=profitFromLocalStore(JSON.parse(readFileSync(path,'utf8')));}catch{}
 return {smith:real.smith+demo,hunter:real.hunter+demo};
}
export default function pvpPrototypePlugin(){return {name:'local-pvp-prototype',apply:'serve',configureServer(server){
 const service=createDuelService({bounty:createBountyLedger({profit:localProfit})});server.middlewares.use(async(req,res,next)=>{
  if(req.url?.split('?')[0]!=='/api/local-pvp')return next();
  const host=String(req.headers.host||'');if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)){res.statusCode=403;return res.end();}
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  if(req.headers.origin&&req.headers.origin!==`http://${host}`){res.statusCode=403;return res.end(JSON.stringify({code:'LOCAL_ONLY'}));}
  const key=String(req.headers['x-pvp-session']||'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(key)){res.statusCode=400;return res.end(JSON.stringify({code:'SESSION_REQUIRED'}));}
  try{
   if(req.method==='GET')return res.end(JSON.stringify({match:service.read(key),progress:service.standings(key)}));
   if(req.method!=='POST'){res.statusCode=405;return res.end('{}');}
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw Error('BODY_TOO_LARGE');}
   const b=JSON.parse(raw||'{}');let match;
   if(b.action==='start')match=service.start(key,b.preset,{merchant:b.merchant});
   else if(b.action==='choose')match=service.choose(key,b);
   else if(b.action==='abandon'){service.abandon(key);match=null;}else throw Error('UNKNOWN_ACTION');
   res.end(JSON.stringify({match,progress:service.standings(key)}));
  }catch(e){res.statusCode=e.status||400;res.end(JSON.stringify({code:e.code||e.message,progress:service.standings(key)}));}
 });
}};}
