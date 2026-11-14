import { FRIDAY13_PET } from './friday13Promo.js';
import { FRIDAY13_END_AT } from './friday13Event.js';
export const RESOURCE_PACKS=[
 {id:'forge_pack_i',retired:true,title:'PACK I',names:{uk:'Я дещо знайшов',ru:'Я тут кое-что нашёл',en:'I Found Stuff'},stars:999,usd:9.99,paymentMethods:['telegram_stars','near'],gums:{normal:20,improved:15,premium:10},spins:100,energy:5000,poisons:[0,0,100],art:'/resource-packs/pack-i.webp'},
 {id:'forge_pack_ii',retired:true,title:'PACK II',names:{uk:'З-під парти',ru:'Из-под парты',en:'Desk Gum'},stars:2999,usd:29.99,paymentMethods:['telegram_stars','near'],gums:{normal:50,improved:40,premium:30},spins:300,energy:10000,poisons:[0,0,250],art:'/resource-packs/pack-ii.webp'},
 {id:'friday13_pack',title:'13TH',names:{uk:'Малюк Тринадцятий',ru:'Малыш Тринадцатый',en:'Little Thirteen'},stars:2626,usd:26.26,paymentMethods:['telegram_stars','near'],gums:{normal:33,improved:23,premium:13},spins:66,cardPlays:13,energy:0,poisons:[666,66,66],petId:FRIDAY13_PET.id,endsAt:FRIDAY13_END_AT,art:'/friday13/promo-pet-v4.webp'},
];
export function nextResourcePack(player){const bought=new Set(Object.values(player?.resource_pack_receipts||{}));return RESOURCE_PACKS.findIndex(pack=>!pack.retired&&(!pack.endsAt||Date.now()<Date.parse(pack.endsAt))&&!bought.has(pack.id))}
export function assertResourcePackAvailable(player,packId){const next=nextResourcePack(player);if(next<0||RESOURCE_PACKS[next].id!==packId)throw Object.assign(new Error('RESOURCE_PACK_UNAVAILABLE'),{code:'RESOURCE_PACK_UNAVAILABLE',statusCode:409})}
export function resourcePackValue(pack){return pack.gums.premium*99+pack.spins*10+pack.energy*.49+pack.poisons.reduce((sum,n,i)=>sum+n*[9,19,39][i],0)}
export function applyResourcePack(player,pack,transactionId,{mail=false}={}){
 if(!transactionId)throw Error('PAYMENT_ID_REQUIRED');
 const prior=player.resource_pack_receipts?.[transactionId];
 if(prior){if(prior!==pack.id)throw Error('PAYMENT_ITEM_MISMATCH');return false}
 if(pack.petId){player.inventory_items=[...(player.inventory_items||[])];if(!player.inventory_items.some(item=>item.id===pack.petId))player.inventory_items.push({...FRIDAY13_PET,locked:false,count:1});}
 if(pack.cardPlays)player.card_game_bonus=Number(player.card_game_bonus||0)+pack.cardPlays;
 if(mail&&(pack.id.startsWith('forge_pack_')||pack.petId)){
  const rewards=[...Object.entries(pack.gums).map(([type,amount])=>({field:'enhancement_gum_'+type,amount})),{field:'roulette_bonus_spins',amount:pack.spins},{field:'energy',amount:pack.energy},...pack.poisons.map((amount,i)=>({field:['small_poison','medium_poison','large_poison'][i],amount}))].filter(r=>r.amount>0);
  player.gift_mail=[...(player.gift_mail||[]),{id:'paid-pack-'+transactionId,title:{uk:pack.title+' · '+pack.names.uk,ru:pack.title+' · '+pack.names.ru,en:pack.title+' · '+pack.names.en},text:{uk:'Дякуємо за покупку! Заберіть усі нагороди набору кнопкою нижче.',ru:'Спасибо за покупку! Заберите все награды набора кнопкой ниже.',en:'Thanks for your purchase! Claim all pack rewards using the button below.'},rewards,created_at:new Date().toISOString()}];
 }else{
 player.enhancement_gums={normal:0,improved:0,premium:0,...player.enhancement_gums};
 for(const type of ['normal','improved','premium'])player.enhancement_gums[type]=Number(player.enhancement_gums[type]||0)+pack.gums[type];
 player.roulette_bonus_spins=Number(player.roulette_bonus_spins||0)+pack.spins;
 player.energy=Number(player.energy||0)+pack.energy;
 player.weapon_inventory={...player.weapon_inventory};
 ['small-poison','medium-poison','large-poison'].forEach((key,i)=>player.weapon_inventory[key]=Number(player.weapon_inventory[key]||0)+pack.poisons[i]);
 }
 player.resource_pack_receipts={...player.resource_pack_receipts,[transactionId]:pack.id};
 player.last_paid_purchase_at=new Date().toISOString();player.last_paid_purchase_item_id=pack.id;
 return true;
}

export const GUM_PACKS=[1,5,15].map(q=>({id:'gum_cosmol_'+q,title:'Cosmol ×'+q,stars:q*99,usd:q*.99,paymentMethods:['telegram_stars','near'],gums:{normal:0,improved:0,premium:q},spins:0,energy:0,poisons:[0,0,0]}));
