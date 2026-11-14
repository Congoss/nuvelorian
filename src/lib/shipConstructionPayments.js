import { SHIP_MODULES } from './clanShipPreview.js';
export const SHIP_STARS_BUILD_UNITS = 4000;
export function getShipConstructionProduct(clanId,moduleId,stars) {
 if(typeof clanId!=='string'||!clanId.trim()||clanId.length>128||!SHIP_MODULES.some(m=>m.id===moduleId)||!Number.isSafeInteger(stars)||stars<1||stars>100000)return null;
 return {id:`ship_build:${encodeURIComponent(clanId)}:${moduleId}:${stars}`,title:'Clan ship construction',usd:stars/100,stars,clanId,moduleId,constructionUnits:stars*SHIP_STARS_BUILD_UNITS,paymentMethods:['near','telegram_stars']};
}
export function parseShipConstructionProduct(id) {
 const match=String(id||'').match(/^ship_build:([^:]+):([a-z]+):([1-9]\d{0,5})$/);
 if(!match)return null;
 try{const item=getShipConstructionProduct(decodeURIComponent(match[1]),match[2],Number(match[3]));return item?.id===id?item:null;}catch{return null;}
}
