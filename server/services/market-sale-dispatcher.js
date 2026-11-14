import {withPostgresTransaction} from '../data/postgres.js';
import {saleNotice,sendSaleNotice} from './market-sale-notifications.js';
let busy=false;
export async function dispatchMarketSaleNotices(players,{token=process.env.TELEGRAM_BOT_TOKEN,send=sendSaleNotice,transaction=withPostgresTransaction}={}){
 if(busy||!token)return;busy=true;
 try{
  let job;
  await transaction(async sql=>{
   const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;
   if(!row)return;const book=row.state,n=Object.values(book.saleNotices||{}).find(n=>n.status==='queued');if(!n)return;
   const seller=players.find(p=>String(p.id)===n.sellerId),order=book.orders.find(o=>o.id===n.orderId);
   if(!seller||!order)return;
   if(!['completed','claim_pending'].includes(order.status)||!/^\d+$/.test(String(seller.telegram_id||''))||seller.is_banned||seller.ai_agent){n.status='skipped';}
   else{n.status='sending';n.at=new Date().toISOString();job={orderId:n.orderId,chatId:String(seller.telegram_id),text:saleNotice(order,seller)};}
   await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb,updated_at=now() WHERE id='pilot-v1'`;
  });
  if(!job)return;
  // Claim is durable before Telegram I/O. Never resend an uncertain delivery.
  let status='sent',messageId;
  try{messageId=await send(token,job.chatId,job.text);}catch{status='delivery_unknown';console.warn('[market-mainnet] SALE_NOTICE_DELIVERY_UNCERTAIN');}
  await transaction(async sql=>{const [row]=await sql`SELECT state FROM market_mainnet_pilot WHERE id='pilot-v1' FOR UPDATE`;const book=row.state,n=book.saleNotices[job.orderId];if(n.status!=='sending')return;n.status=status;if(messageId)n.messageId=messageId;await sql`UPDATE market_mainnet_pilot SET state=${JSON.stringify(book)}::jsonb,updated_at=now() WHERE id='pilot-v1'`;});
 }finally{busy=false;}
}
