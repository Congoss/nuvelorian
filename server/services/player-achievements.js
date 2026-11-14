import { withKeyLock } from '../utils/keyLock.js';
import { withPostgresTransaction } from '../data/postgres.js';
import { playerDb, savePlayerSnapshot, publishCommittedProfile } from '../data/player-db.js';
import { saveLocalState } from '../data/local-state.js';
import { claimAchievementReward, reconcilePlayerAchievements } from '../utils/playerAchievements.js';
import { claimDossierReward } from '../utils/bossDossier.js';
// The HTTP mutation handler holds action-player; keep persistence serialized too.
export async function claimPlayerAchievement(store,player,id,{persistLocal=saveLocalState,transaction=withPostgresTransaction,hasDb=['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(key=>String(process.env[key]||'').trim())}={}) {
 await playerDb.flushDirtyPlayers([player.id]);
 return withKeyLock('persist-player:'+player.id,async()=>{
  let draft=JSON.parse(JSON.stringify(player)),result,before;
  const claimReward = (draft, achievementId) => {
    if (achievementId.startsWith('dossier_')) return claimDossierReward(draft, achievementId);
    reconcilePlayerAchievements(draft);
    return claimAchievementReward(draft, achievementId);
  };
  if(hasDb){
   await transaction(async sql=>{
    const [row]=await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;
    if(!row)throw Object.assign(new Error('PLAYER_NOT_FOUND'),{statusCode:404});
    draft=playerDb.fromDbPlayerRecord(row);
    before=structuredClone(draft);result=claimReward(draft,id);
    if(!result.replayed)await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draft),JSON.stringify(playerDb.buildPlayerProgress(draft)));
   });
  }else{
   before=structuredClone(draft);result=claimReward(draft,id);
   if(!result.replayed){const ok=await persistLocal({...store,players:store.players.map(p=>String(p.id)===String(player.id)?draft:p)});if(ok===false)throw Object.assign(new Error('ACHIEVEMENT_STORAGE_UNAVAILABLE'),{statusCode:503});}
  }
  publishCommittedProfile(player,before,draft,['weapon_inventory','roulette_bonus_spins','player_achievements','enhancement_gums']);
  if(hasDb)playerDb.acknowledgeCommittedPlayer(player,draft);
  return result;
 });
}
