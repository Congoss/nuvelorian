import {withKeyLock} from '../utils/keyLock.js';
import {withPostgresTransaction} from '../data/postgres.js';
import {playerDb,savePlayerSnapshot,publishCommittedProfile} from '../data/player-db.js';
import {saveLocalState} from '../data/local-state.js';

// The caller owns action-player. Grant and claimed-rank receipt become visible
// together, only after their durable transaction succeeds.
export async function claimCARankRewardDurable({store,player,rank,apply}, {
 // Match postgres.js: blank/whitespace URLs (the local launcher's " ") mean no database.
 hasDb=['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(k=>String(process.env[k]||'').trim()!==''),
 transaction=withPostgresTransaction, persistLocal=saveLocalState,
 save=(sql,draft)=>savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draft),JSON.stringify(playerDb.buildPlayerProgress(draft))),
}={}) {
 await playerDb.flushDirtyPlayers([player.id]);
 return withKeyLock('persist-player:'+player.id,async()=>{
  let draft=JSON.parse(JSON.stringify(player)),reward,before;
  if(hasDb){
   await transaction(async sql=>{
    const [row]=await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;
    if(!row)throw Object.assign(Error('Player not found'),{statusCode:404});
    draft=playerDb.fromDbPlayerRecord(row);before=structuredClone(draft);reward=apply(draft,rank);
    await save(sql,draft);
   });
  }else{
   before=structuredClone(draft);reward=apply(draft,rank);
   if(process.env.LOCAL_GAME_STATE_PATH && await persistLocal({...store,players:store.players.map(p=>p.id===player.id?draft:p)})===false)throw Object.assign(Error('Rank reward storage unavailable'),{statusCode:503});
  }
  publishCommittedProfile(player,before,draft,['tentacles','energy','last_energy_update','weapon_inventory','roulette_bonus_spins','ca_rank_rewards_claimed']);
  if(hasDb)playerDb.acknowledgeCommittedPlayer(player,draft);
  else await playerDb.flushDirtyPlayers([player.id]);
  return reward;
 });
}
