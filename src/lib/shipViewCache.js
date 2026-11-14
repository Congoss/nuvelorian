const snapshots=new Map();
export function readShipViewCache(playerId,clanId,now=Date.now()){const row=snapshots.get(String(playerId)+':'+String(clanId));return row&&now-row.at<60000?structuredClone(row.value):null;}
export function writeShipViewCache(playerId,clanId,value,now=Date.now()){if(!playerId||!clanId||!value)return;if(snapshots.size>=20)snapshots.delete(snapshots.keys().next().value);snapshots.set(String(playerId)+':'+String(clanId),{at:now,value:structuredClone(value)});}
