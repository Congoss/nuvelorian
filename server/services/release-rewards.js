import { withPostgresTransaction } from '../data/postgres.js';
import { playerDb, savePlayerSnapshot } from '../data/player-db.js';
import { withKeyLock } from '../utils/keyLock.js';

export async function claimReleaseReward(player, version, { transaction = withPostgresTransaction, flush = ids => playerDb.flushDirtyPlayers(ids), save = (sql,draft) => savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draft),JSON.stringify(playerDb.buildPlayerProgress(draft))), decode = row => playerDb.fromDbPlayerRecord(row), acknowledge = (live,draft) => playerDb.acknowledgeCommittedPlayer(live,draft) } = {}) {
  if(!/^\d+\.\d+$/.test(version))throw Object.assign(new Error('Invalid release'),{statusCode:400,code:'INVALID_RELEASE'});
  return withKeyLock('action-player:'+player.id,async()=>{
    await flush([player.id]);
    return withKeyLock('persist-player:'+player.id,async()=>{
      let draft;
      const result=await transaction(async sql=>{
        const [announcement]=await sql`SELECT message FROM release_announcements WHERE version=${version}`;
        const reward=announcement?.message?.reward;
        if(reward?.field!=='medium_poison'||!Number.isSafeInteger(reward.amount)||reward.amount<1)throw Object.assign(new Error('Release reward is unavailable'),{statusCode:404,code:'RELEASE_REWARD_UNAVAILABLE'});
        const [stored]=await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;
        if(!stored)throw Object.assign(new Error('Player not found'),{statusCode:404});
        draft=decode(stored);
        const receipts=await sql`INSERT INTO release_reward_claims (version,player_id,amount) VALUES (${version},${String(player.id)},${reward.amount}) ON CONFLICT (version,player_id) DO NOTHING RETURNING version`;
        if(!receipts.length)return {claimed:true,replayed:true,amount:reward.amount};
        draft.weapon_inventory={...draft.weapon_inventory,'medium-poison':Math.max(0,Number(draft.weapon_inventory?.['medium-poison'])||0)+reward.amount};
        if(reward.cardGamePlays===5)draft.card_game_bonus=Math.max(0,Number(draft.card_game_bonus)||0)+5;
        await save(sql,draft);
        return {claimed:true,replayed:false,amount:reward.amount};
      });
      player.weapon_inventory=draft.weapon_inventory;
      if(draft.card_game_bonus!==undefined)player.card_game_bonus=draft.card_game_bonus;
      acknowledge(player,draft);
      return result;
    });
  });
}
