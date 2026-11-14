import { mkdirSync, readFileSync, existsSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getPostgresSql, withPostgresTransaction } from '../data/postgres.js';
import { emptyOnlineState, onlineDuelCommand, creditPvpRefill } from './pvp-online.js';
import { schedulePvpAiCoaching } from './pvp-near-ai.js';

export function createOnlinePvpRepository({ localPath, transaction = withPostgresTransaction, sql = getPostgresSql, now = Date.now } = {}) {
  let queue = Promise.resolve(), ready;
  async function command(player, body, findPlayerById = null, credit = null) {
    const local = localPath || (process.env.NODE_ENV !== 'production' && process.env.LOCAL_GAME_STATE_PATH && resolve(dirname(process.env.LOCAL_GAME_STATE_PATH), 'pvp-online.json'));
    if (local) {
      const run = queue.then(() => {
        const path = resolve(local), state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : emptyOnlineState();
        if (credit) creditPvpRefill(state, player, credit.orderId, credit.attempts, now());
        const result = onlineDuelCommand(state, player, body, now(), Math.random, findPlayerById);
        mkdirSync(dirname(path), { recursive: true });
        const temp = path + '.' + process.pid + '.tmp';
        writeFileSync(temp, JSON.stringify(state)); renameSync(temp, path);
        return result;
      });
      queue = run.catch(() => {}); return run;
    }
    ready ||= (async () => {
      const query = sql();
      await query`CREATE TABLE IF NOT EXISTS pvp_online_state (id text PRIMARY KEY, state jsonb NOT NULL)`;
      await query`INSERT INTO pvp_online_state (id,state) VALUES ('ranked-v1',${JSON.stringify(emptyOnlineState())}::jsonb) ON CONFLICT (id) DO NOTHING`;
    })().catch(error => { ready = null; throw error; });
    await ready;
    return transaction(async query => {
      const [row] = await query`SELECT state FROM pvp_online_state WHERE id='ranked-v1' FOR UPDATE`;
      const before = JSON.stringify(row.state);
      if (credit) creditPvpRefill(row.state, player, credit.orderId, credit.attempts, now());
      const result = onlineDuelCommand(row.state, player, body, now(), Math.random, findPlayerById);
      if (JSON.stringify(row.state) !== before) await query`UPDATE pvp_online_state SET state=${JSON.stringify(row.state)}::jsonb WHERE id='ranked-v1'`;
      return result;
    });
  }
  return { command: async (player, body, findPlayerById) => { const result=await command(player,body,findPlayerById); schedulePvpAiCoaching(result.match); return result; }, creditRefill: (player, orderId, attempts) => command(player, undefined, null, { orderId, attempts }) };
}
export const onlinePvp = createOnlinePvpRepository();
