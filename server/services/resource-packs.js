import {withKeyLock} from '../utils/keyLock.js';
import {withPostgresTransaction} from '../data/postgres.js';
import {playerDb,savePlayerSnapshot,publishCommittedProfile} from '../data/player-db.js';
import {saveLocalState} from '../data/local-state.js';
import {applyResourcePack} from '../../src/lib/resourcePacks.js';
const fields=['inventory_items','card_game_bonus','gift_mail','enhancement_gums','roulette_bonus_spins','energy','weapon_inventory','resource_pack_receipts','last_paid_purchase_at','last_paid_purchase_item_id'];
export async function grantResourcePack({store,player,pack,transactionId,persistLocal=saveLocalState}){
 await playerDb.flushDirtyPlayers([player.id]);
 return withKeyLock('persist-player:'+player.id,async()=>{
  let draft=structuredClone(JSON.parse(JSON.stringify(player))),before;
  if(['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(k=>String(process.env[k]||'').trim())){
   await withPostgresTransaction(async sql=>{
    const [row]=await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;if(!row)throw Error('PLAYER_NOT_FOUND');
    draft={...draft,...row.data,id:player.id,level:row.level,xp:row.xp};
    before=structuredClone(draft);
    applyResourcePack(draft,pack,transactionId,{mail:true});
    await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draft),JSON.stringify(playerDb.buildPlayerProgress(draft)));
   });
  }else{before=structuredClone(draft);applyResourcePack(draft,pack,transactionId,{mail:true});const ok=await persistLocal({...store,players:store.players.map(p=>String(p.id)===String(player.id)?draft:p)});if(ok===false)throw Error('PACK_STORAGE_UNAVAILABLE')}
  publishCommittedProfile(player,before,draft,fields);return player;
 });
}
