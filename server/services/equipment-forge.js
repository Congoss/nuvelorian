import {withKeyLock} from '../utils/keyLock.js';
import {withPostgresTransaction} from '../data/postgres.js';
import {playerDb,savePlayerSnapshot,publishCommittedProfile} from '../data/player-db.js';
import {saveLocalState} from '../data/local-state.js';
import {forgeState,enhanceEquipment} from '../utils/equipmentForge.js';
const clone=v=>JSON.parse(JSON.stringify(v));
const hasDb=()=>['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(k=>String(process.env[k]||'').trim());
export function createEquipmentForge({store,persistLocal=saveLocalState}={}){
 return {read:player=>({state:forgeState(player)}),async enhance(player,body){
  await playerDb.flushDirtyPlayers([player.id]);
  return withKeyLock('persist-player:'+player.id,async()=>{
   if(player.is_banned)throw Object.assign(new Error('AUTH_REQUIRED'),{statusCode:403});
   let draft=clone(player),result,before;
   if(hasDb())await withPostgresTransaction(async sql=>{
    const [row]=await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;
    if(!row)throw Object.assign(new Error('PLAYER_NOT_FOUND'),{statusCode:404});
    draft={...draft,...row.data,level:row.level,xp:row.xp,id:player.id};
    if(draft.is_banned)throw Object.assign(new Error('AUTH_REQUIRED'),{statusCode:403});
    before=clone(draft);result=enhanceEquipment(draft,body);
    await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draft),JSON.stringify(playerDb.buildPlayerProgress(draft)));
   });else{
    before=clone(draft);result=enhanceEquipment(draft,body);
    const saved=await persistLocal({...store,players:store.players.map(p=>String(p.id)===String(player.id)?draft:p)});
    if(saved===false)throw Object.assign(new Error('FORGE_STORAGE_UNAVAILABLE'),{statusCode:503});
   }
   publishCommittedProfile(player,before,draft,['inventory_items','enhancement_gums','forge_receipts','achievement_progress','player_achievements']);
   if(hasDb())playerDb.acknowledgeCommittedPlayer(player,draft);
   return {...result,playerId:player.id,inventory_items:player.inventory_items,enhancement_gums:player.enhancement_gums,player_achievements:player.player_achievements};
  });
 }};
}
