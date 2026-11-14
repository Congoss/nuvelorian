import {randomUUID} from 'node:crypto';
import {saveLocalState} from '../data/local-state.js';
import {withKeyLock} from '../utils/keyLock.js';
import {marketIdentity} from '../utils/marketIdentity.js';
import {restockTicket} from './market-restock.js';
import {getBalancedEquipmentItem} from '../../src/lib/equipmentBalance.js';
import {isTradableItem,isScrappableItem,MAX_PRICE_HUNDREDTHS} from '../../src/lib/marketPricing.js';

export const MARKET_TOKEN = 'pl4.nearlytrade.near';
const slots = new Set(['weapon','head','hands','armor','legs','boots','pet','accessory']);
const fail = code => { throw Object.assign(new Error(code), {statusCode:409}); };
const clone = value => JSON.parse(JSON.stringify(value));
const available = (player,item) => item?.type === 'equipment' && slots.has(item.slot || getBalancedEquipmentItem(item.id)?.slot)
  && !item.locked && !item.protected && !item.bound && !item.soulbound && !item.nonTransferable && item.tradable !== false && Number(item.count ?? 1) === 1
  && !Object.values(player.equipped_items || {}).includes(item.id);
export const marketEligible = (player,item) => available(player,item) && isTradableItem(player,item);
export const npcEligible = (player,item) => available(player,item) && isScrappableItem(player,item);
const publicItem = item => {const {agentCost,...visible}=item;return visible;};
// Server-authoritative NPC payouts in standard currency; PL4 prices are separate.
const NPC_SET_BASES={cardboard:1000,night_disinfector:5000,nuvelor:80000,set4:110000,set5:500000,anubis:615000,shkraban:940000};
const NPC_PET_BASES={'pet-bot':5000,'pet-skunk':400000,pet5:500000,'pet-purrgulp':2800000,'pet-toaster':4300000};
export function npcBaseQuote(item){
 const id=String(item?.id||'');
 if(Object.hasOwn(NPC_PET_BASES,id))return NPC_PET_BASES[id];
 for(const [prefix,price] of Object.entries(NPC_SET_BASES)){
  const slot=id.slice(prefix.length+1);
  if(id.startsWith(prefix+'_')&&['weapon','head','hands','armor','legs','boots'].includes(slot))return price;
 }
 return 100; // Unlisted items retain their existing base quote.
}
export const npcQuote = item => Math.floor(npcBaseQuote(item) * (100 + 5 * Math.max(0,Math.min(15,Math.floor(Number(Object.hasOwn(NPC_PET_BASES,item.id)?0:item.enhancementLevel)||0)))) / 100);
export function localMarketEnabled(request) {
  return process.env.LOCAL_MARKET_TEST === '1' && process.env.NODE_ENV !== 'production'
    && Boolean(process.env.LOCAL_GAME_STATE_PATH)
    && !['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(k=>String(process.env[k]||'').trim())
    && ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress);
}
export function marketState(store,player,web) {
  const lots = store.players.flatMap(p=>(p.local_market_lots || []).map(l=>({...l,item:publicItem(l.item),sellerId:p.id,seller:p.nickname || p.username || 'Player',sellerAi:Boolean(p.ai_agent?.key)})));
  return {test:true,mode:'simulation',withdrawalEnabled:false,token:MARKET_TOKEN,feePercent:5,feeRecipient:null,web,
    balance:player.local_market_p4 ?? 100000,scrap:player.tentacles || 0,
    items:(player.inventory_items || []).filter(i=>npcEligible(player,i) || marketEligible(player,i)).map(i=>({...publicItem(i),npcPrice:npcQuote(i),tradable:marketEligible(player,i)})),
    lots:web ? lots : [],player:{id:player.id,inventory_items:(player.inventory_items || []).map(publicItem),equipped_items:player.equipped_items,tentacles:player.tentacles}};
}
export async function marketCommand(store,player,body,web,{persist=saveLocalState,agentTrade,now=Date.now()}={}) {
  return withKeyLock('local-market',()=>{
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId || '')) fail('REQUEST_ID_REQUIRED');
    const fingerprint=JSON.stringify([body.action,body.itemId,body.lotId,body.price]);
    const prior=player.local_market_receipts?.[body.requestId];
    if(prior){if(prior!==fingerprint)fail('REQUEST_ID_REUSED');return marketState(store,player,web);}
    if(body.action!=='npc' && !web)fail('WEB_ONLY');
    const drafts=store.players.map(p=>clone(p)),actor=drafts.find(p=>p.id===player.id);
    if(!actor || actor.is_banned)fail('AUTH_REQUIRED');
    if(actor.ai_agent?.key && body.action==='buy' && !agentTrade)fail('AGENT_AUTHORIZATION_REQUIRED');
    if(agentTrade && !agentTrade.validate(store,player,body,now))fail('AGENT_ACTION_STALE');
    const draftStore={...store,players:drafts};
    const stamp=new Date(now).toISOString();
    let journal={requestId:body.requestId,actorId:actor.id,action:body.action,at:stamp,mode:'simulation'};
    actor.local_market_p4 ??= 100000; // integer hundredths of test P4
    if(['npc','list'].includes(body.action)){
      const matches=(actor.inventory_items || []).filter(i=>i.id===body.itemId);
      if(matches.length!==1 || !(body.action==='npc'?npcEligible(actor,matches[0]):marketEligible(actor,matches[0])))fail('ITEM_UNAVAILABLE');
      const item=matches[0];
      if(body.action==='npc')actor.tentacles=Number(actor.tentacles || 0)+npcQuote(item);
      else {
        if(!Number.isSafeInteger(body.price) || body.price<1 || body.price>MAX_PRICE_HUNDREDTHS)fail('INVALID_PRICE');
        actor.local_market_lots=[...(actor.local_market_lots || []),{id:randomUUID(),item,price:body.price,createdAt:stamp,status:'active'}];
      }
      actor.inventory_items=actor.inventory_items.filter(i=>i!==item);
      journal={...journal,itemId:item.id,...(body.action==='list'?{lotId:actor.local_market_lots.at(-1).id,price:body.price}:{scrap:npcQuote(item)})};
    }else if(['buy','cancel'].includes(body.action)){
      const seller=drafts.find(p=>(p.local_market_lots || []).some(l=>l.id===body.lotId));
      const lot=seller?.local_market_lots.find(l=>l.id===body.lotId);
      if(!lot || lot.status!=='active')fail('LOT_UNAVAILABLE');
      if(body.action==='cancel'){
        if(seller.id!==actor.id)fail('NOT_YOUR_LOT');
      }else{
        if(seller.id===actor.id)fail('OWN_LOT');
        if(actor.ai_agent?.key){
          const ticket=restockTicket(draftStore,{...lot,sellerId:seller.id});
          if(!ticket)fail('RESTOCK_SALE_REQUIRED');
          const sale=drafts.flatMap(p=>p.local_market_lots||[]).find(l=>l.id===ticket.saleId);
          sale.restockConsumedBy=lot.id;lot.restockSaleId=sale.id;
        }
        if(actor.local_market_p4<lot.price)fail('INSUFFICIENT_P4');
        actor.local_market_p4-=lot.price;
        const fee=Math.ceil(lot.price*5/100);
        seller.local_market_p4=(seller.local_market_p4 ?? 100000)+lot.price-fee;
        const treasurer=drafts.find(p=>String(p.id)===String(store.local_market_fee_recipient ?? ''));
        if(treasurer)treasurer.local_market_p4=(treasurer.local_market_p4 ?? 0)+fee;
        else seller.local_market_fee_pending=(seller.local_market_fee_pending || 0)+fee;
        if(treasurer?.ai_agent?.key)draftStore.local_market_fee_income=(store.local_market_fee_income || 0)+fee;
        lot.fee=fee;lot.buyerId=actor.id;lot.soldAt=stamp;
        if(seller.ai_agent?.key&&!actor.ai_agent?.key)lot.restockVersion=1;
      }
      if((actor.inventory_items || []).some(i=>i.id===lot.item.id))fail('ITEM_ALREADY_OWNED');
      // Items bought from an AI player carry the sale time, so agents do not buy them back soon.
      const received=clone(lot.item);
      if(body.action==='buy' && !actor.ai_agent?.key)delete received.agentCost;
      actor.inventory_items=[...(actor.inventory_items || []),{...received,...(body.action==='buy' && seller.ai_agent?.key ? {agentSoldAt:stamp,agentOrigin:true} : {}),...(body.action==='buy' && actor.ai_agent?.key ? {agentCost:lot.price} : {})}];
      if(body.action==='buy' && actor.ai_agent?.key){
        const day=stamp.slice(0,10);
        const ledger=store.local_market_agent_ledger?.day===day?clone(store.local_market_agent_ledger):{day,spent:0,sellers:{}};
        ledger.spent+=lot.price;
        ledger.sellers[String(seller.id)]=(ledger.sellers[String(seller.id)] || 0)+1;
        ledger.identities={...ledger.identities,[marketIdentity(seller)]:(ledger.identities?.[marketIdentity(seller)] || 0)+1};
        ledger.items={...ledger.items,[lot.item.id]:(ledger.items?.[lot.item.id] || 0)+1};
        draftStore.local_market_agent_ledger=ledger;
      }
      lot.status=body.action==='cancel'?'cancelled':'sold';
      if(actor.ai_agent?.key && body.action==='cancel')actor.ai_agent.markdowns={...actor.ai_agent.markdowns,[lot.item.id]:(actor.ai_agent.markdowns?.[lot.item.id] || 0)+1};
      if(actor.ai_agent?.key && body.action==='buy' && actor.ai_agent.markdowns?.[lot.item.id])actor.ai_agent.markdowns[lot.item.id]=0;
      journal={...journal,lotId:lot.id,itemId:lot.item.id,sellerId:seller.id,price:lot.price,...(body.action==='buy'?{fee:lot.fee}:{})};
    }else fail('UNKNOWN_ACTION');
    actor.local_market_receipts={...actor.local_market_receipts,[body.requestId]:fingerprint};
    draftStore.local_market_journal=[...(store.local_market_journal || []),journal];
    if(agentTrade?.event)draftStore.local_market_feed=[...(store.local_market_feed || []),{id:randomUUID(),at:stamp,...agentTrade.event}].slice(-40);
    // Synchronous local snapshot commits escrow, balances and receipt together.
    if(persist(draftStore)!==true)fail('STORAGE_UNAVAILABLE');
    const fields=['inventory_items','tentacles','local_market_p4','local_market_lots','local_market_receipts','local_market_fee_pending','ai_agent'];
    for(const current of store.players){const draft=drafts.find(p=>p.id===current.id);for(const key of fields)if(key in draft)current[key]=draft[key];}
    for(const key of ['local_market_journal','local_market_agent_ledger','local_market_fee_income','local_market_feed'])if(key in draftStore)store[key]=draftStore[key];
    return marketState(store,player,web);
  });
}
