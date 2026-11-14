import {marketIdentity} from '../utils/marketIdentity.js';
const level=item=>Math.max(0,Math.min(15,Math.floor(Number(item?.enhancementLevel)||0)));
export const restockClass=item=>`${item.id}:${level(item)}`;
export function restockSpent(store){
  const ids=new Set(store.players.filter(p=>p.ai_agent?.key).map(p=>String(p.id)));
  return (store.local_market_journal||[]).filter(e=>e.action==='buy'&&ids.has(String(e.actorId))).reduce((sum,e)=>sum+(e.price||0),0);
}
export function restockTicket(store,lot){
  const budget=store.local_market_pilot_budget;
  if(budget&&lot.price>Math.max(0,budget.maxHundredths-(restockSpent(store)-budget.baselineSpent)))return null;
  if(lot.item.agentOrigin||lot.item.agentSoldAt||lot.item.forged)return null;
  const seller=store.players.find(p=>String(p.id)===String(lot.sellerId));
  if(!seller||seller.ai_agent?.key||seller.is_banned)return null;
  const kind=restockClass(lot.item),agents=store.players.filter(p=>p.ai_agent?.key);
  const stock=agents.flatMap(p=>[...(p.inventory_items||[]),...(p.local_market_lots||[]).filter(l=>['active','reserved'].includes(l.status)).map(l=>l.item)]).filter(i=>i.type==='equipment'&&restockClass(i)===kind).length+(store.orders||[]).filter(o=>o.agentKey&&o.status==='awaiting_payment'&&restockClass(o.item)===kind).length;
  if(stock>=2)return null;
  for(const agent of agents)for(const sale of agent.local_market_lots||[]){
    if(sale.status!=='sold'||sale.restockVersion!==1||sale.restockConsumedBy||restockClass(sale.item)!==kind)continue;
    const buyer=store.players.find(p=>String(p.id)===String(sale.buyerId));
    if(!buyer||buyer.ai_agent?.key||buyer.is_banned||marketIdentity(buyer)===marketIdentity(seller))continue;
    const maxPrice=Math.floor((sale.price-(sale.fee||0))*0.8);
    if(Number.isSafeInteger(lot.price)&&lot.price>0&&lot.price<=maxPrice)return {saleId:sale.id,maxPrice};
  }
  return null;
}
