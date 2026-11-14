// Isolated local game + market; no production DB, bot, wallet signing or payment workers.
import path from 'node:path';
process.env.NODE_ENV='development';
process.env.HOST='127.0.0.1';
process.env.PORT='3011';
process.env.LOCAL_MARKET_TEST='1';
// Synthetic localhost demo identities only; an access file overrides this list.
process.env.MARKET_TEAM_TELEGRAM_IDS ??= '880001,880002';
const {readMarketAccess}=await import('../server/services/market-access.js');
const localTesterIds=[...new Set(['880001','880002',...(readMarketAccess().telegramIds || []).map(String).filter(id=>/^\d+$/.test(id))])];
// Demo testers are created at launch; production keeps the 7-day account-age rule.
process.env.MARKET_AGENT_MIN_ACCOUNT_DAYS ??= '0';
process.env.LOCAL_MARKET_ORIGIN='http://127.0.0.1:4183';
// The dev proxy changes the Host header, so name the local page as the web origin (guest play needs it).
process.env.WEB_GAME_ORIGIN='http://127.0.0.1:4183';
process.env.LOCAL_GAME_STATE_PATH=path.resolve('.local/market-game-state.json');
process.env.VITE_LOCAL_MARKET_TEST='1';
process.env.VITE_TELEGRAM_USE_MOCK='true';
process.env.VITE_API_BASE_URL='/api';
for(const key of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING','TELEGRAM_BOT_TOKEN','TELEGRAM_WEBHOOK_SECRET','ADMIN_TOKEN','X_API_BEARER_TOKEN','X_CLIENT_SECRET'])process.env[key]=' ';
const {createApp,prepareGameState}=await import('../server/app.js');
const {store}=await import('../server/data/store.js');
const {saveLocalState}=await import('../server/data/local-state.js');
await prepareGameState();
const api=createApp();
const handler=api.listeners('request')[0];
api.removeAllListeners('request');
api.on('request',(req,res)=>{
 // Guest play is local-only account creation (no wallet, no payment), so it stays enabled here.
 if(/\/(payments|wallets|auth\/web)(\/|\?|$)/.test(req.url) && !/\/auth\/web\/(guest|logout)(\?|$)/.test(req.url) && req.method==='POST'){
  res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'REAL_PAYMENTS_DISABLED',message:'Local market test only'}));return;
 }
 handler(req,res);
});
await new Promise((resolve,reject)=>{api.once('error',reject);api.listen(3011,'127.0.0.1',resolve);});
for(const id of localTesterIds){
 const response=await fetch('http://127.0.0.1:3011/players/bootstrap',{method:'POST',headers:{'X-Telegram-User-Id':id,'X-Telegram-Username':'market_tester_'+id,'X-Telegram-Mock-User':'true'}});
 if(!response.ok)throw new Error('Local bootstrap failed: '+response.status);
 const p=store.players.find(p=>String(p.telegram_id)===id);
 if(!p.local_market_seeded){
  Object.assign(p,{nickname:'Market tester '+id,language:'uk',level:100,tutorial_disabled:true,tutorial_step:'completed',tutorial_level_eight_reward_claimed:true,first_boss_tutorial_seen:true,tentacles:10000,local_market_p4:100000,local_market_seeded:true,update_notices:{...p.update_notices,'ship-forge-v1':true},equipped_items:{},inventory_items:['set4_weapon','set4_head','set4_boots'].map(itemId=>({id:itemId,type:'equipment',slot:itemId.split('_').at(-1),count:1}))});
 }
 if(id==='880002' && !p.local_market_supply_v2){
  p.inventory_items.push(...['weapon','boots'].map(slot=>({id:'set5_'+slot,type:'equipment',slot,count:1})));
  p.local_market_lots=[...(p.local_market_lots || []),{id:'local-demo-set5-head',item:{id:'set5_head',type:'equipment',slot:'head',count:1},price:2500,createdAt:new Date().toISOString(),status:'active'}];
  p.local_market_supply_v2=true;
 }
 if(!p.local_market_demo_v2){
  // Synthetic local demo users only: satisfy the real seven-day seller policy.
  p.created_at=new Date(Date.now()-8*86400000).toISOString();
  for(const slot of ['weapon','hands']){const id='night_disinfector_'+slot;if(!p.inventory_items.some(i=>i.id===id))p.inventory_items.push({id,type:'equipment',slot,count:1,bossId:'tank'});}
  p.local_market_demo_v2=true;
 }
}
// Prices are USD-anchored: take the live PL4 quote once at start (fallback in marketPricing.js).
const {usdToHundredths,startingPriceUsd,FALLBACK_PL4_USD}=await import('../src/lib/marketPricing.js');
try{const {getPl4Quote}=await import('../server/services/pl4-quote.js');store.local_market_pl4_usd=(await getPl4Quote()).price_usd;}catch{store.local_market_pl4_usd ||= FALLBACK_PL4_USD;}
for(const id of localTesterIds){
 const p=store.players.find(p=>String(p.telegram_id)===id);
 if(p && !p.local_market_usd_v1){
  p.local_market_p4=usdToHundredths(100,store.local_market_pl4_usd); // $100 of test PL4
  for(const lot of p.local_market_lots||[])if(lot.status==='active')lot.price=usdToHundredths(startingPriceUsd(lot.item)??1,store.local_market_pl4_usd);
  p.local_market_usd_v1=true;
 }
}
console.log(`PL4 quote: $${store.local_market_pl4_usd}`);
// AI market players: ordinary local players driven by server/services/market-agents.js.
const {agentCount,configureAgents,startMarketAgents}=await import('../server/services/market-agents.js');
const agentIds=['990001','990002','990003','990004','990005'].slice(0,agentCount());
for(const id of agentIds){
 const response=await fetch('http://127.0.0.1:3011/players/bootstrap',{method:'POST',headers:{'X-Telegram-User-Id':id,'X-Telegram-Username':'market_agent_'+id,'X-Telegram-Mock-User':'true'}});
 if(!response.ok)throw new Error('Agent bootstrap failed: '+response.status);
}
const agents=configureAgents(store,agentIds);
saveLocalState(store);
startMarketAgents(store);
// Read-only check of the agents' NEAR accounts (MARKET_AGENT_<KEY>_NEAR), now and every 5 minutes.
const {checkAgentWallets}=await import('../server/services/agent-wallets.js');
const refreshWallets=()=>checkAgentWallets().then(r=>{store.local_market_agent_wallets=r;for(const [k,v] of Object.entries(r))console.log(`Agent wallet ${k}: ${v.ok?'OK':'CHECK'} ${v.account}${v.ok?` ${v.pl4.toFixed(0)} PL4`:' '+(v.error||v.issues.join('; '))}`);}).catch(e=>console.warn('Agent wallet check failed:',e.message));
void refreshWallets();setInterval(refreshWallets,300000).unref();
console.log(`AI market players: ${agents.map(a=>a.ai_agent.name).join(', ')}${process.env.MARKET_AGENT_LLM_URL?' (LLM on)':' (rules only; set MARKET_AGENT_LLM_URL/KEY for LLM)'}`);
const {createServer}=await import('vite');
const vite=await createServer({server:{host:'127.0.0.1',port:4183,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:3011',changeOrigin:true,rewrite:p=>p.replace(/^\/api/,'')}}}});
await vite.listen();
console.log('Web: http://127.0.0.1:4183/?mockUserId=880001');
console.log('Seller: http://127.0.0.1:4183/?mockUserId=880002');
console.log('Telegram: http://127.0.0.1:4183/?mockUserId=880001&platform=telegram');
console.log('Landing (guest / judge tour): http://127.0.0.1:4183/web?judge=1');
