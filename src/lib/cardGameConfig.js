export const CARD_PRIZES = [
 ['small','small-poison',6,14.5],['medium','medium-poison',4,14],['large','large-poison',2,10],
 ['energy','energy',100,10],['energy','energy',150,8],['energy','energy',200,5],['energy','energy',250,3],['energy','energy',300,2],
 ['spin','spin',5,8],['gum','normal',1,9],['better','improved',1,2],
 ['paper','premium',10,4],['paper','premium',20,3],['paper','premium',30,1],
 ['tentacles','tentacles',200000,1.5],['tentacles','tentacles',300000,1],['tentacles','tentacles',500000,1],
 ['freegame','card-play',1,2],['freegame','card-play',2,1],
];
export function getCardPlayPack(mode) {
 if (![1,3].includes(mode)) return null;
 return {id:`card_play_${mode}`,title:mode===1?'Card play ×1':'Cards: choose 3 of 4',stars:mode===1?20:60,usd:mode===1?.2:.6,cardMode:mode,paymentMethods:['telegram_stars','near']};
}
