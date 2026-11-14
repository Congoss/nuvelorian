import { getPvpRankReward, canClaimPvpRankReward } from '../../src/lib/pvpRankRewards.js';
import { withKeyLock } from '../utils/keyLock.js';
import { withPostgresTransaction } from '../data/postgres.js';
import { playerDb, savePlayerSnapshot, publishCommittedProfile } from '../data/player-db.js';
import { saveLocalState } from '../data/local-state.js';

const fail = code => { throw Object.assign(new Error(code), { code, statusCode: 409 }); };
export function applyPvpRankReward(player, rank, standing, now = Date.now()) {
  const reward = getPvpRankReward(rank);
  if (!reward) fail('PVP_RANK_INVALID');
  const receipt = player.pvp_rank_rewards?.[rank];
  if (receipt) return { rank, reward: receipt.reward, alreadyClaimed: true };
  if (!canClaimPvpRankReward(rank, { ...standing, claimedRanks: [] })) fail('PVP_RANK_LOCKED');
  const inventory = { ...(player.weapon_inventory || {}) };
  for (const [id, key] of [['small-poison','smallPoison'],['medium-poison','mediumPoison'],['large-poison','largePoison']]) inventory[id] = Number(inventory[id] || 0) + reward[key];
  player.weapon_inventory = inventory;
  player.roulette_bonus_spins = Number(player.roulette_bonus_spins || 0) + reward.spins;
  player.card_game_bonus = Number(player.card_game_bonus || 0) + reward.cardPlays;
  player.pvp_rank_rewards = { ...(player.pvp_rank_rewards || {}), [rank]: { at: new Date(now).toISOString(), reward } };
  return { rank, reward, alreadyClaimed: false };
}
export async function claimPvpRankRewardDurable({ store, player, rank, standing }, {
  hasDb = ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(key => String(process.env[key] || '').trim()),
  transaction = withPostgresTransaction, persistLocal = saveLocalState,
  save = (sql, draft) => savePlayerSnapshot(sql, playerDb.toDbPlayerRecord(draft), JSON.stringify(playerDb.buildPlayerProgress(draft))),
} = {}) {
  await playerDb.flushDirtyPlayers([player.id]);
  return withKeyLock('persist-player:' + player.id, async () => {
    let draft = JSON.parse(JSON.stringify(player)), before, receipt;
    if (hasDb) {
      await transaction(async sql => {
        const [row] = await sql`SELECT * FROM players WHERE id=${String(player.id)} FOR UPDATE`;
        if (!row) fail('PLAYER_NOT_FOUND');
        draft = playerDb.fromDbPlayerRecord(row); before = structuredClone(draft);
        receipt = applyPvpRankReward(draft, rank, standing);
        if (!receipt.alreadyClaimed) await save(sql, draft);
      });
    } else {
      before = structuredClone(draft); receipt = applyPvpRankReward(draft, rank, standing);
      if (!receipt.alreadyClaimed && await persistLocal({ ...store, players: store.players.map(p => p.id === player.id ? draft : p) }) !== true) {
        throw Object.assign(new Error('Rank reward storage unavailable'), { code: 'PVP_REWARD_STORAGE_UNAVAILABLE', statusCode: 503 });
      }
    }
    publishCommittedProfile(player, before, draft, ['weapon_inventory','roulette_bonus_spins','card_game_bonus','pvp_rank_rewards']);
    if (hasDb) playerDb.acknowledgeCommittedPlayer(player, draft);
    else await playerDb.flushDirtyPlayers([player.id]);
    return receipt;
  });
}
