import {dispatchMarketSaleNotices} from './market-sale-dispatcher.js';
import {mainnetAgentsEnabled} from './market-mainnet-runtime.js';
import {getPostgresSql,withPostgresTransaction} from '../data/postgres.js';
import {playerDb,savePlayerSnapshot,publishCommittedProfile} from '../data/player-db.js';
import {withKeyLock} from '../utils/keyLock.js';
import {createMainnetBook,marketBookCommand,verifiedMarketWallet,marketRequestFingerprint} from './market-mainnet-book.js';
import {createMainnetMarketReader,mainnetPayment} from './market-mainnet-rpc.js';
import {marketState} from './local-market.js';
import {marketPublicStats} from './market-public-stats.js';
import {withMarketAgents} from './market-agents.js';
import {getPl4Quote} from './pl4-quote.js';
import {usdToHundredths} from '../../src/lib/marketPricing.js';
import {auditMainnetMarketDatabase} from './market-mainnet-audit.js';
import {initializeMainnetAgents,chooseMainnetAgentAction,applyMainnetAgentAction,mainnetAgentView} from './market-mainnet-agents.js';
import {agentSecrets,createAgentSigner,claimAgentPayment} from './market-mainnet-signer.js';
import {marketBookCommand as agentBookCommand} from './market-mainnet-book.js';
const clone=v=>JSON.parse(JSON.stringify(v));
let schema,dbVerified=false,agentTimer,agentBusy=false,agentIndex=0;
let publicSnapshot=null;
const reader=createMainnetMarketReader();
const fail=code=>{throw Object.assign(new Error(code),{code,statusCode:409});};
async function ready(){
 if(process.env.MARKET_MAINNET_PILOT!=='1')fail('MAINNET_PILOT_DISABLED');
 if(!schema)schema=(async()=>{await auditMainnetMarketDatabase();await getPostgresSql()`CREATE TABLE IF NOT EXISTS market_mainnet_pilot (id text PRIMARY KEY,state jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`;dbVerified=true;console.log('[market-mainnet] DB_SELF_CHECK_OK');})().catch(e=>{schema=null;dbVerified=false;throw e;});
 await schema;
}
async function readBook(){
 await ready();const sql=getPostgresSql();let [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1'`;
 if(!row){
  const [meta,quote]=await Promise.all([reader.metadata(),getPl4Quote()]);
  if(quote.stale||!(quote.price_usd>0))fail('LIVE_QUOTE_REQUIRED');
  const book=createMainnetBook({decimals:meta.decimals,capHundredths:usdToHundredths(5,quote.price_usd),feeRecipient:'nuvelorian.near'});
  book.budgetUsd=5;book.budgetQuote=quote.price_usd;
  initializeMainnetAgents(book);
  await sql`INSERT INTO market_mainnet_pilot(id,state) VALUES('pilot-v1',${JSON.stringify(book)}::jsonb) ON CONFLICT(id) DO NOTHING`;
  [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1'`;
 }
 const book=row.state;
 if(book.version!==1||book.network!=='mainnet'||book.feePercent!==5||book.feeRecipient!=='nuvelorian.near')fail('PILOT_CONFIG_MISMATCH');
 return book;
}
function view(book,player){
 const ids=new Set(book.lots.map(l=>l.sellerId));ids.add(String(player.id));
 const players=[...ids].map(id=>id===String(player.id)?{...player,local_market_lots:book.lots.filter(l=>l.sellerId===id)}:{id,nickname:book.lots.find(l=>l.sellerId===id)?.seller||'Player',inventory_items:[],local_market_lots:book.lots.filter(l=>l.sellerId===id)});
 const store={players,local_market_pl4_usd:book.budgetQuote};
 const result=withMarketAgents(store,players.find(p=>String(p.id)===String(player.id)),true,marketState(store,player,true));
 Object.assign(result,mainnetAgentView(book,[player]));
 return {...result,balance:null,test:false,mode:'mainnet-pilot',withdrawalEnabled:false,feePercent:5,feeRecipient:book.feeRecipient,mainnet:true,tokenDecimals:book.decimals,
  orders:book.orders.filter(o=>o.buyerId===String(player.id)).map(({signedTx,signingClaim,item,...order})=>({...order,item:(({agentCost,...visible})=>visible)(item)})),pendingDeliveries:player.market_pending_deliveries||[],
  budget:{usd:book.budgetUsd,quote:book.budgetQuote,capHundredths:book.capHundredths,usedHundredths:book.orders.reduce((s,o)=>s+o.price,0)}};
}
function publicBook(){
 if(!publicSnapshot||Date.now()-publicSnapshot.at>15000){
  const pending={at:Date.now(),value:(async()=>{const book=await readBook();let registered=null;try{registered=await reader.registered(book.feeRecipient);}catch{/* indexer hiccup: unknown */}return {book,registered};})()};
  publicSnapshot=pending;pending.value.catch(()=>{if(publicSnapshot===pending)publicSnapshot=null;});
 }
 return publicSnapshot.value;
}
export const mainnetMarket={
 initialize:ready,
 isReady:()=>dbVerified,
 startAgents(getPlayers){
  if(agentTimer)return;
  agentTimer=setInterval(()=>{void dispatchMarketSaleNotices(getPlayers()).catch(()=>console.warn('[market-mainnet] SALE_NOTICE_FAILED'));void mainnetMarket.agentTick(getPlayers()).catch(()=>console.warn('[market-mainnet] AGENT_STEP_FAILED'));},15000);agentTimer.unref();
 },
 async agentTick(players){
  if(agentBusy||!mainnetAgentsEnabled())return;agentBusy=true;
  try{
   if(!agentSecrets())return;
   let snapshot=await readBook();if(!snapshot.agents)return;
   const agent=snapshot.agents[agentIndex++%snapshot.agents.length];
   const balance=await reader.balance(agent.near_wallet_id);agent.local_market_p4=Number(BigInt(balance)/(10n**BigInt(snapshot.decimals-2)));
   const pending=snapshot.orders.find(o=>o.buyerId===agent.id&&o.status==='awaiting_payment');
   if(pending){await mainnetMarket.settleAgentOrder(pending,players);return;}
   const secrets=agentSecrets();
   const env={MARKET_AGENT_LLM_URL:'https://cloud-api.near.ai/v1',MARKET_AGENT_LLM_KEY:secrets.llmKey||'',MARKET_AGENT_LLM_MODEL:'Qwen/Qwen3.6-35B-A3B-FP8',MARKET_AGENT_LLM_MAX_CALLS_DAY:'12',MARKET_AGENT_LANG:'uk'};
   const candidate=await chooseMainnetAgentAction(snapshot,players,agent.id,{env});
   let created;
   await withPostgresTransaction(async sql=>{
    const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;
    const book=clone(row.state),current=book.agents.find(a=>a.id===agent.id);current.local_market_p4=agent.local_market_p4;book.agentAiConfigured=Boolean(secrets.llmKey);
    if(candidate)created=applyMainnetAgentAction(book,players,agent.id,candidate);
    await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb,updated_at=now() WHERE id='pilot-v1'`;
   });
   if(created?.orderId){snapshot=await readBook();await mainnetMarket.settleAgentOrder(snapshot.orders.find(o=>o.id===created.orderId),players);}
  }finally{agentBusy=false;}
 },
 async settleAgentOrder(order,players){
  if(!mainnetAgentsEnabled())return;
  let snapshot=await readBook(),current=snapshot.orders.find(o=>o.id===order.id);if(current.status!=='awaiting_payment')return;
  const signer=createAgentSigner({authorize:async candidate=>{
   const book=await readBook(),saved=book.orders.find(o=>o.id===candidate.id);
   return mainnetAgentsEnabled()&&Boolean(saved&&saved.status==='awaiting_payment'&&saved.agentKey===candidate.agentKey&&saved.price===candidate.price&&saved.restockSaleId&&JSON.stringify(mainnetPayment(saved))===JSON.stringify(mainnetPayment(candidate)));
  }});
  if(!current.signedTx){
   const claim=crypto.randomUUID();let won=false;
   await withPostgresTransaction(async sql=>{const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;const book=clone(row.state),o=book.orders.find(o=>o.id===order.id);if(!claimAgentPayment(o,claim))return;won=true;await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb WHERE id='pilot-v1'`;});
   if(!won)return;
   let prepared;
   try{prepared=await signer.prepare(current,current.agentKey);}catch(error){await withPostgresTransaction(async sql=>{const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;const book=clone(row.state),o=book.orders.find(o=>o.id===order.id);if(o.signingClaim===claim&&!o.signedTx){delete o.signingClaim;await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb WHERE id='pilot-v1'`;}});throw error;}
   await withPostgresTransaction(async sql=>{const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;const book=clone(row.state),o=book.orders.find(o=>o.id===order.id);if(o.signingClaim!==claim||o.status!=='awaiting_payment')throw Error('AGENT_ORDER_CLAIM_LOST');Object.assign(o,prepared);await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb WHERE id='pilot-v1'`;});
   snapshot=await readBook();current=snapshot.orders.find(o=>o.id===order.id);
  }
  let proof;
  try{proof=await reader.verify(current,current.txHash);}catch{if(!mainnetAgentsEnabled())return;await signer.broadcast({signedTx:current.signedTx,txHash:current.txHash});proof=await reader.verify(current,current.txHash);}
  await withPostgresTransaction(async sql=>{const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;const book=clone(row.state),o=book.orders.find(o=>o.id===order.id);if(o.status!=='awaiting_payment')return;const agent=book.agents.find(a=>a.id===o.buyerId);agentBookCommand(book,players,agent,{action:'confirm',orderId:o.id,txHash:current.txHash,requestId:'agent-confirm-'+o.id},{proof});book.agentFeed=[...(book.agentFeed||[]),{id:crypto.randomUUID(),at:new Date().toISOString(),agent:agent.ai_agent.key,name:agent.ai_agent.name,action:'buy',itemId:o.item.id,price:o.price,txHash:current.txHash}].slice(-40);await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb WHERE id='pilot-v1'`;});
 },
 async read(player){
  const book=await readBook(),result=view(book,player);
  result.feeRecipientRegistered=await reader.registered(book.feeRecipient);
  // The fee-recipient registration button is shown only to the configured pilot owner.
  result.pilotOwner=Boolean(process.env.MARKET_PILOT_OWNER_TELEGRAM_ID)&&String(player.telegram_id)===String(process.env.MARKET_PILOT_OWNER_TELEGRAM_ID);
  if(player.near_wallet_verified&&player.near_wallet_id){const raw=BigInt(await reader.balance(player.near_wallet_id));result.balance=Number(raw/(10n**BigInt(book.decimals-2)));}else result.balance=0;
  return result;
 },
 // View-only market for players outside the pilot. One shared 15 s snapshot of the book:
 // no wallet balance lookup and no extra RPC or database read per viewer.
 async readPublic(player){
  const {book,registered}=await publicBook(),result=view(clone(book),player);
  if(registered!==null)result.feeRecipientRegistered=registered;
  result.balance=0;result.orders=[];result.pendingDeliveries=[];result.readOnly=true;
  return result;
 },
 // Verified-trade totals for the landing page; null while the pilot is switched off.
 async publicStats(){
  if(process.env.MARKET_MAINNET_PILOT!=='1')return null;
  return marketPublicStats((await publicBook()).book);
 },
 async command(player,body){
  const book=await readBook();let proof;
  if(body.action==='reserve'){
   const buyer=verifiedMarketWallet(player),lot=book.lots.find(l=>l.id===body.lotId);if(!lot)fail('LOT_UNAVAILABLE');
   for(const account of new Set([buyer,lot.sellerWallet,book.feeRecipient]))if(!await reader.registered(account))fail('PL4_STORAGE_REGISTRATION_REQUIRED');
   const balance=BigInt(await reader.balance(buyer));
   const required=BigInt(lot.price)*(10n**BigInt(book.decimals-2));if(balance<required)fail('INSUFFICIENT_PL4');
  }
  if(body.action==='confirm'){
   const order=book.orders.find(o=>o.id===body.orderId&&o.buyerId===String(player.id));if(!order)fail('ORDER_NOT_FOUND');
   if(['completed','claim_pending'].includes(order.status)){if(order.txHash!==body.txHash)fail('ORDER_ALREADY_PAID');}
   else proof=await reader.verify(order,body.txHash);
  }
  await playerDb.flushDirtyPlayers([player.id]);
  return withKeyLock('persist-player:'+player.id,async()=>{
   let before,after,result,committed;
   try{await withPostgresTransaction(async sql=>{
    const [stateRow]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;
    const [playerRow]=await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;
    if(!playerRow)fail('PLAYER_NOT_FOUND');
    before={...clone(player),...playerRow.data,id:player.id,level:playerRow.level,xp:playerRow.xp};after=clone(before);
    if(after.is_banned)fail('AUTH_REQUIRED');
    committed=clone(stateRow.state);result=marketBookCommand(committed,[after],after,body,{proof});
    await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(after),JSON.stringify(playerDb.buildPlayerProgress(after)));
    await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(committed)}::jsonb,updated_at=now() WHERE id='pilot-v1'`;
   });}catch(error){
    // Resolve a lost COMMIT reply using its durable receipt before publishing
    // the inventory projection. Never interpret a transport error as success.
    const sql=getPostgresSql();
    const [saved]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1'`;
    const receipt=saved?.state?.receipts?.[String(player.id)+':'+body.requestId];
    if(!receipt||receipt.fingerprint!==marketRequestFingerprint(body))throw error;
    const [row]=await sql`SELECT * FROM players WHERE id=${String(player.id)}`;
    if(!row)throw error;
    before ||=clone(player);after={...clone(player),...row.data,id:player.id,level:row.level,xp:row.xp};committed=saved.state;result=receipt.result;
   }
   publishCommittedProfile(player,before,after,['inventory_items','tentacles','market_pending_deliveries']);
   playerDb.acknowledgeCommittedPlayer(player,after);
   return {result,state:view(committed,player)};
  });
 },
 async instruction(player,orderId){const book=await readBook();const order=book.orders.find(o=>o.id===orderId&&o.buyerId===String(player.id));if(!order||order.status!=='awaiting_payment')fail('ORDER_NOT_PAYABLE');return mainnetPayment(order);},
 async registration(player){const owner=String(process.env.MARKET_PILOT_OWNER_TELEGRAM_ID||'');if(!owner||String(player.telegram_id)!==owner)fail('PILOT_OWNER_REQUIRED');const book=await readBook();return reader.registrationInstruction(verifiedMarketWallet(player),book.feeRecipient);},
};
