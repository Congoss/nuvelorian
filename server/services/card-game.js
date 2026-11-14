import {withKeyLock} from '../utils/keyLock.js';
import {getPostgresSql,withPostgresTransaction} from '../data/postgres.js';
import {playerDb,savePlayerSnapshot,publishCommittedProfile} from '../data/player-db.js';
import {saveLocalState} from '../data/local-state.js';
import {newCardState,applyCardCommand,cardStateView,creditCardPayment} from '../utils/cardGame.js';
const fields=['card_game_bonus','weapon_inventory','enhancement_gums','roulette_bonus_spins','energy','premium','tentacles'];
const displayCache=new WeakMap();
const displayView=(state,player,now)=>({...cardStateView({...state,bonus:state.bonus+Math.max(0,Math.floor(Number(player.card_game_bonus)||0))},now),player:structuredClone(Object.fromEntries(fields.map(f=>[f,player[f]])))});
let schemaPromise;
function schema(){return schemaPromise||=(getPostgresSql()`CREATE TABLE IF NOT EXISTS player_card_games (player_id TEXT PRIMARY KEY,state JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`).catch(e=>{schemaPromise=null;throw e;});}
const pendingDisplayReads=new WeakMap();
export async function readCardDisplayState(sql,playerId){
 const rows=await sql`SELECT state FROM player_card_games WHERE player_id=${String(playerId)}`;
 const state=rows[0]?.state || newCardState();
 const paid=await sql`SELECT id,item_id,status FROM payment_transactions WHERE user_id=${String(playerId)} AND status='success' AND item_id IN ('card_play_1','card_play_3') AND NOT (${JSON.stringify(state.payments)}::jsonb ? id)`;
 for(const transaction of paid)creditCardPayment(state,transaction);
 return state;
}
export async function cardGameCommand(store,player,command,body={},options={}) {
 const cached=displayCache.get(player);
 const hasDb=options.hasDb??['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(k=>String(process.env[k]||'').trim());
 if(command==='shown' && cached?.store===store && !cardStateView(cached.state,options.now).showDaily)return displayView(cached.state,player,options.now);
 if(command==='state'&&!options.refreshState&&cached?.store===store){
  if(Date.now()-cached.at>15000&&!cached.pending){cached.pending=true;void cardGameCommand(store,player,command,body,{...options,refreshState:true}).catch(error=>console.warn('[cards] display refresh failed',error.message)).finally(()=>{cached.pending=false;});}
  return displayView(cached.state,player,options.now);
 }
 if(command==='state' && hasDb){
  let read=pendingDisplayReads.get(player);
  if(!read){
   read=(async()=>{
    await schema();const state=await readCardDisplayState(getPostgresSql(),player.id);
    // An attack/claim that committed while this display read was in flight
    // wins over the older result; display reads never alter saved balances.
    const latest=displayCache.get(player);
    if(latest!==cached && latest?.store===store)return latest.state;
    displayCache.set(player,{store,state:structuredClone(state),at:Date.now(),pending:false});return state;
   })();pendingDisplayReads.set(player,read);
   void read.finally(()=>{if(pendingDisplayReads.get(player)===read)pendingDisplayReads.delete(player);}).catch(()=>{});
  }
  return displayView(await read,player,options.now);
 }
 await playerDb.flushDirtyPlayers([player.id]);
 return withKeyLock('persist-player:'+player.id,async()=>{
  let draft=JSON.parse(JSON.stringify(player)),state,before;
  const execute=()=>{before=structuredClone(draft);const bonus=Math.max(0,Math.floor(Number(draft.card_game_bonus)||0));if(bonus){state.bonus+=bonus;draft.card_game_bonus=0;}if(command==='payment')creditCardPayment(state,options.transaction);else applyCardCommand(state,draft,command,body,options);};
  if(hasDb){
   await schema();
   await withPostgresTransaction(async sql=>{
    await sql`INSERT INTO player_card_games (player_id,state) VALUES (${String(player.id)},${JSON.stringify(newCardState())}::jsonb) ON CONFLICT (player_id) DO NOTHING`;
    const [row]=await sql`SELECT p.*,c.state AS card_state FROM player_card_games c JOIN players p ON p.id=c.player_id WHERE c.player_id=${String(player.id)} FOR UPDATE OF c,p`;
    if(!row)throw Object.assign(new Error('PLAYER_NOT_FOUND'),{statusCode:404});
    state=row.card_state;draft=playerDb.fromDbPlayerRecord(row);
    const beforePlayer=JSON.stringify(draft),beforeState=JSON.stringify(state);
    // Recover verified payments even if the provider callback stopped after confirmation.
    const paid=['state','shown','begin','payment'].includes(command)?await sql`SELECT id,item_id,status FROM payment_transactions WHERE user_id=${String(player.id)} AND status='success' AND item_id IN ('card_play_1','card_play_3') AND NOT (${JSON.stringify(state.payments)}::jsonb ? id)`:[];
    for(const transaction of paid)creditCardPayment(state,transaction);
    execute();
    if(JSON.stringify(draft)!==beforePlayer)await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draft),JSON.stringify(playerDb.buildPlayerProgress(draft)));
    if(JSON.stringify(state)!==beforeState)await sql`UPDATE player_card_games SET state=${JSON.stringify(state)}::jsonb,updated_at=now() WHERE player_id=${String(player.id)}`;
   });
  }else{
   state=JSON.parse(JSON.stringify(store.cardGames?.[player.id]||newCardState()));execute();
   const ok=await (options.persistLocal||saveLocalState)({...store,cardGames:{...store.cardGames,[player.id]:state},players:store.players.map(p=>String(p.id)===String(player.id)?draft:p)});
   if(ok===false)throw Object.assign(new Error('CARD_STORAGE_UNAVAILABLE'),{statusCode:503});
   store.cardGames={...store.cardGames,[player.id]:state};
  }
  publishCommittedProfile(player,before,draft,fields);
  if(hasDb)playerDb.acknowledgeCommittedPlayer(player,draft);
  displayCache.set(player,{store,state:structuredClone(state),at:Date.now(),pending:false});
  return displayView(state,player,options.now);
 });
}
