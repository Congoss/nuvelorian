import {readFileSync} from 'node:fs';
const names=JSON.parse(readFileSync(new URL('./market-item-names.json',import.meta.url),'utf8'));
export function saleNotice(order,seller){
 const lang=String(seller.language||'uk').toLowerCase(),i=lang.startsWith('ru')?1:lang.startsWith('en')?2:0;
 const n=names[order.item.id]||order.item.names||{},name=String(n[['ua','ru','en'][i]]||n.uk||n.ua||n.en||order.item.name||order.item.id).replace(/[\r\n]/g,' ').slice(0,150);
 const level=Math.max(0,Math.floor(Number(order.item.enhancementLevel||0)));
 const fmt=v=>(v/100).toLocaleString(['uk-UA','ru-RU','en-US'][i],{maximumFractionDigits:2});
 const fee=Math.ceil(order.price*5/100),net=order.price-fee;
 return [
 `🧪 Продано: «${name} +${level}»!\nХтось забрав твій мотлох в інший вимір. Угода реальна, мутанте!\n\nЦіна: ${fmt(order.price)} $PL4\nКомісія 5%: ${fmt(fee)} $PL4\nТобі на гаманець: ${fmt(net)} $PL4`,
 `🧪 Продано: «${name} +${level}»!\nКто-то забрал твой хлам в другое измерение. Сделка настоящая, мутант!\n\nЦена: ${fmt(order.price)} $PL4\nКомиссия 5%: ${fmt(fee)} $PL4\nТебе на кошелёк: ${fmt(net)} $PL4`,
 `🧪 Sold: “${name} +${level}”!\nSomeone hauled your junk into another dimension. Real deal, mutant!\n\nPrice: ${fmt(order.price)} $PL4\n5% fee: ${fmt(fee)} $PL4\nTo your wallet: ${fmt(net)} $PL4`
 ][i]+`\n\nhttps://nearblocks.io/txns/${order.txHash}`;
}
export function queueSaleNotice(book,order){
 if(book.agents?.some(a=>String(a.id)===order.sellerId))return;
 book.saleNotices||={};book.saleNotices[order.id]||={orderId:order.id,sellerId:order.sellerId,status:'queued'};
}
export async function sendSaleNotice(token,chatId,text,fetchImpl=fetch){
 const response=await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text,link_preview_options:{is_disabled:true}}),signal:AbortSignal.timeout(10000)});
 const data=await response.json();if(!response.ok||data.ok!==true)throw Error('TELEGRAM_SALE_NOTICE_FAILED');
 return data.result?.message_id;
}
