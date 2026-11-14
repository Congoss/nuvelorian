import { getActiveBattlePassTier } from '../utils/battlePass.js';
import {coalesceShipRead,primeShipRead,refreshShipSnapshot} from '../utils/shipReadCoalescer.js';
import {shipCombatPlayerSnapshot,shipSyncNeedsTick,shipCombatDraft,captureShipCombatChanges} from '../utils/shipCombatSnapshot.js';
import {assertSingleBossFight} from '../utils/singleBossFight.js';
import { parseShipConstructionProduct } from '../../src/lib/shipConstructionPayments.js';
import { withKeyLock, withKeyLocks } from '../utils/keyLock.js';
import { contributeShip, ensureShip, shipView, applyShipConstructionPayment, openShipFight, attackShipFight, tickShipFight, escapeShipFight } from '../utils/clanShip.js';
import { getPostgresSql, withPostgresTransaction } from '../data/postgres.js';
import { playerDb, savePlayerSnapshot, publishCommittedProfile } from '../data/player-db.js';
import {commitCombatWrite, lockShipCombatRows, saveCombatBatch, enqueueBackgroundCombatWrite, useBackgroundCombatWrites} from '../data/combat-write.js';
import { saveLocalState } from '../data/local-state.js';
const clone=value=>JSON.parse(JSON.stringify(value));
const hasDb=()=>['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'].some(key=>String(process.env[key]||'').trim());
let schemaPromise;
const pendingShipWrites = new Map();
const shipWriteKey = clan => String(clan.id);
const waitForShipWrites = clan => pendingShipWrites.get(shipWriteKey(clan));

function queueShipWrite(clan, playerIds, save, records) {
 const key = shipWriteKey(clan);
 const write = enqueueBackgroundCombatWrite(playerIds, save, records);
 pendingShipWrites.set(key, write);
 void write.then(() => {
  if (pendingShipWrites.get(key) === write) pendingShipWrites.delete(key);
 }, error => {
  console.error('[combat] background ship write failed', error);
 });
}

function publishShipSettings(clan, next) {
 if (!useBackgroundCombatWrites()) {
  clan.ship = next;
  return;
 }
 const live = ensureShip(clan);
 const receipts = Object.fromEntries(Object.entries(next.receipts || {}).filter(([key]) =>
  !key.startsWith('combat:') && !key.startsWith('open:')));
 for (const [key, receipt] of Object.entries(live.receipts || {})) {
  if (key.startsWith('combat:') || key.startsWith('open:')) receipts[key] = receipt;
 }
 clan.ship = { ...next, receipts, fights: live.fights, history: live.history,
  kills: live.kills, lastWinners: live.lastWinners, lastWinnerProfiles: live.lastWinnerProfiles };
}

async function ensureSchema(){
 if(!schemaPromise)schemaPromise=getPostgresSql()`CREATE TABLE IF NOT EXISTS clan_ship_state (clan_id TEXT PRIMARY KEY, state JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`.catch(error=>{schemaPromise=null;throw error;});
 await schemaPromise;
}
export function createClanShipService({store,persistLocal=saveLocalState}={}) {
 const membership=(clan,player)=>{
  const key=value=>String(value||'').trim().toLowerCase();
  const belongs=clan && player && (player.clan_id ? key(player.clan_id)===key(clan.id) : Boolean(player.clan_name)&&key(player.clan_name)===key(clan.name));
  if(!player||player.is_banned||!belongs)throw Object.assign(new Error('CLAN_MEMBERSHIP_REQUIRED'),{statusCode:403,code:'CLAN_MEMBERSHIP_REQUIRED'});
 };
 async function read(clan,player,{recoverPayments=true,includeView=true}={}){
  membership(clan,player);
  if(hasDb()){
   await ensureSchema();
   const pending=recoverPayments ? await getPostgresSql()`SELECT p.id FROM payment_transactions p LEFT JOIN clan_ship_state c ON c.clan_id=${String(clan.id)} WHERE p.user_id=${String(player.id)} AND p.status='success' AND split_part(p.item_id,':',1)='ship_build' AND split_part(p.item_id,':',2)=${encodeURIComponent(String(clan.id))} AND NOT (COALESCE(c.state->'receipts','{}'::jsonb) ? ('payment:' || p.user_id || ':' || p.id)) ORDER BY p.created_at LIMIT 100` : [];
   for(const payment of pending)await creditPayment(clan,player,payment.id);
   if (!useBackgroundCombatWrites() && !waitForShipWrites(clan)) await coalesceShipRead(clan,()=>refreshShipSnapshot(clan,async()=>{
    const [row]=await getPostgresSql()`SELECT state FROM clan_ship_state WHERE clan_id=${String(clan.id)}`;
    return row?.state;
   }));
  }
  return includeView ? shipView(clan,player,store.players) : undefined;
 }
 async function rename(clan,player,body){
  membership(clan,player);
  const requireLeader=()=>{membership(clan,player);if(String(clan.owner_id)!==String(player.id))throw Object.assign(new Error('SHIP_RENAME_LEADER_ONLY'),{statusCode:403,code:'SHIP_RENAME_LEADER_ONLY'});};
  requireLeader();
  const name=typeof body.name==='string'?body.name.trim().replace(/ +/g,' '):'';
  if([...name].length<2||[...name].length>32||/[\p{Cc}\p{Cf}]/u.test(name))throw Object.assign(new Error('SHIP_NAME_INVALID'),{statusCode:400,code:'SHIP_NAME_INVALID'});
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId||''))throw Object.assign(new Error('REQUEST_ID_REQUIRED'),{statusCode:400,code:'REQUEST_ID_REQUIRED'});
  return withKeyLock('ship-clan:'+clan.id,async()=>{
   await waitForShipWrites(clan);
   requireLeader();const draft={...clan,ship:clone(ensureShip(clan))};
   const apply=()=>{
    const previous=draft.ship.rename;
    if(previous){if(previous.requestId===body.requestId&&previous.playerId===String(player.id)&&draft.ship.name===name)return;throw Object.assign(new Error('SHIP_RENAME_USED'),{statusCode:409,code:'SHIP_RENAME_USED'});}
    draft.ship.name=name;draft.ship.rename={requestId:body.requestId,playerId:String(player.id),at:new Date().toISOString()};
   };
   if(hasDb()){
    await ensureSchema();await withPostgresTransaction(async sql=>{
     await sql`INSERT INTO clan_ship_state (clan_id,state) VALUES (${String(clan.id)},${JSON.stringify(draft.ship)}::jsonb) ON CONFLICT (clan_id) DO NOTHING`;
     const [row]=await sql`SELECT state FROM clan_ship_state WHERE clan_id=${String(clan.id)} FOR UPDATE`;draft.ship=row.state;apply();
     await sql`UPDATE clan_ship_state SET state=${JSON.stringify(draft.ship)}::jsonb,updated_at=now() WHERE clan_id=${String(clan.id)}`;
    });
   }else{
    apply();const saved=await persistLocal({...store,clans:store.clans.map(c=>String(c.id)===String(clan.id)?draft:c)});
    if(saved===false&&process.env.NODE_ENV!=='test')throw Object.assign(new Error('SHIP_STORAGE_UNAVAILABLE'),{statusCode:503,code:'SHIP_STORAGE_UNAVAILABLE'});
   }
   publishShipSettings(clan,draft.ship);return {ship:shipView(clan,player,store.players)};
  });
 }
 async function contribute(clan,player,body){
  membership(clan,player);
  return withKeyLock(`ship-clan:${clan.id}`,async()=>{
   await waitForShipWrites(clan);
   // Drain older projected snapshots before the transaction updates this player.
   await playerDb.flushDirtyPlayers([player.id]);
   return withKeyLock(`persist-player:${player.id}`,async()=>{
    membership(clan,player);
    const draftPlayer=clone(player),draftClan={...clan,ship:clan.ship?clone(clan.ship):undefined};
    let result, before;
    if(hasDb()){
     await ensureSchema();
     await withPostgresTransaction(async sql=>{
      await sql`INSERT INTO clan_ship_state (clan_id,state) VALUES (${String(clan.id)},${JSON.stringify(ensureShip(draftClan))}::jsonb) ON CONFLICT (clan_id) DO NOTHING`;
      const [row]=await sql`SELECT state FROM clan_ship_state WHERE clan_id=${String(clan.id)} FOR UPDATE`;
      draftClan.ship=row.state;
      const [storedPlayer]=await sql`SELECT id, data, coins FROM players WHERE id=${String(player.id)} FOR UPDATE`;
      if(!storedPlayer)throw Object.assign(new Error('PLAYER_NOT_FOUND'),{statusCode:404});
      membership(clan,{...draftPlayer,...storedPlayer.data});
      // Resource authority is the locked database row, not browser values.
      draftPlayer.tentacles=Number(storedPlayer.data?.tentacles??storedPlayer.coins??0);
      draftPlayer.premium=Number(storedPlayer.data?.premium||0);
      before={tentacles:draftPlayer.tentacles,premium:draftPlayer.premium};
      result=contributeShip(draftClan,draftPlayer,body);
      await savePlayerSnapshot(sql,playerDb.toDbPlayerRecord(draftPlayer),JSON.stringify(playerDb.buildPlayerProgress(draftPlayer)));
      await sql`UPDATE clan_ship_state SET state=${JSON.stringify(draftClan.ship)}::jsonb,updated_at=now() WHERE clan_id=${String(clan.id)}`;
     });
    }else{
     before={tentacles:draftPlayer.tentacles,premium:draftPlayer.premium};
     result=contributeShip(draftClan,draftPlayer,body);
     const snapshot={...store,players:store.players.map(p=>String(p.id)===String(player.id)?draftPlayer:p),clans:store.clans.map(c=>String(c.id)===String(clan.id)?draftClan:c)};
     const saved=await persistLocal(snapshot);
     if(saved===false&&process.env.NODE_ENV!=='test')throw Object.assign(new Error('Persistent storage is required for ship contributions'),{statusCode:503,code:'SHIP_STORAGE_UNAVAILABLE'});
    }
    // Publish only committed fields; failures never debit the live in-memory player.
    publishShipSettings(clan,draftClan.ship);
    publishCommittedProfile(player,before,draftPlayer,['tentacles','premium']);
    if(hasDb())playerDb.acknowledgeCommittedPlayer(player,draftPlayer);
    return {...result,ship:shipView(clan,player,store.players)};
   });
  });
 }
 async function creditPayment(clan,player,paymentId){
  if(!hasDb())throw Object.assign(new Error('Persistent payment storage required'),{statusCode:503});
  await ensureSchema();
  return withKeyLock('ship-clan:'+clan.id,async()=>{
   await waitForShipWrites(clan);
   const draft={...clan,ship:clan.ship?clone(clan.ship):undefined};let result;
   await withPostgresTransaction(async sql=>{
    const [transaction]=await sql`SELECT * FROM payment_transactions WHERE id=${paymentId} FOR UPDATE`;
    const item=parseShipConstructionProduct(transaction?.item_id);
    if(!item||transaction.status!=='success'||String(transaction.user_id)!==String(player.id)||item.clanId!==String(clan.id))throw Object.assign(new Error('INVALID_SHIP_PAYMENT'),{statusCode:403});
    await sql`INSERT INTO clan_ship_state (clan_id,state) VALUES (${String(clan.id)},${JSON.stringify(ensureShip(draft))}::jsonb) ON CONFLICT (clan_id) DO NOTHING`;
    const [row]=await sql`SELECT state FROM clan_ship_state WHERE clan_id=${String(clan.id)} FOR UPDATE`;draft.ship=row.state;
    result=applyShipConstructionPayment(draft,transaction,item);
    await sql`UPDATE clan_ship_state SET state=${JSON.stringify(draft.ship)}::jsonb,updated_at=now() WHERE clan_id=${String(clan.id)}`;
   });
   publishShipSettings(clan,draft.ship);return result;
  });
 }
 function combatView(clan,player,result,body){
    const playersById=new Map(store.players.map(p=>[String(p.id),p]));
    const actor=playersById.get(String(player.id));
    const f=Object.values(clan.ship.fights).find(f=>f.id===result.fightId)||clan.ship.history?.[result.fightId];
    if(!f)throw new Error('SHIP_FIGHT_NOT_FOUND');
    const leaderboard=Object.entries(f.participants).map(([id,p])=>{const member=playersById.get(String(id));return {id:f.id+':'+id,player_id:id,player_email:id===String(actor.id)?actor.created_by:undefined,player_name:member?.nickname||p.name,battle_pass_tier:getActiveBattlePassTier(member),profile_header_theme:member?.profile_header_theme||null,avatar_frame_id:member?.avatar_frame_id,clan_name:member?.clan_name||clan.name,clan_logo_id:member?.clan_logo_id||clan.logo_id,avatar:member?.avatar,photo_url:member?.photo_url,damage:p.damage,hits:p.hits};}).sort((a,b)=>b.damage-a.damage);
    const own=f.participants[actor.id];
    const publicFight={clan_invite_sent_at:store.chatMessages?.find(m=>m.kind==='ship_boss_invite'&&m.bossFightInvite?.fightId===f.id)?.created_at,id:f.id,boss_id:f.boss_id,moduleId:f.moduleId,combat_revision:f.combat_revision,current_hp:f.current_hp,max_hp:f.max_hp,status:f.status,last_hit_player_id:f.last_hit_player_id,last_hit_player_name:f.last_hit_player_name,started_at:f.started_at,ends_at:f.ends_at,ended_at:f.ended_at};
    const snapshot=body.compact?shipCombatPlayerSnapshot(actor,[f.id,...Object.keys(actor.talent_combat_state||{}).filter(key=>key.startsWith('raid:'))]):clone(actor);
    return {...result,fight:publicFight,player:{...snapshot,talent_combat_state:{...snapshot.talent_combat_state,[f.id]:own?.runtime||{}}},playerDamageLog:leaderboard.find(row=>row.player_id===String(actor.id))||null,leaderboard,...(body.compact?{}:{ship:shipView(clan,actor,store.players)}),hit:{damage:result.damage||0,isCrit:result.isCrit||false,boneCurseApplied:result.boneCurseApplied||false,weaponId:body.weaponId,attackType:body.weaponId}};
 }
 async function combat(clan,player,command,body,options={}){
  const measure=(name,start)=>options.onTiming?.(name,Date.now()-start);
  if(!['open','attack','sync','escape'].includes(command))throw Object.assign(new Error('INVALID_SHIP_COMMAND'),{statusCode:400});
  // Response format must not change an existing attack's idempotency fingerprint.
  const background = useBackgroundCombatWrites();
  const actionBody={...body};delete actionBody.compact;
  const readStarted=Date.now();
  membership(clan,player);
  if (!background) await read(clan,player,{recoverPayments:false,includeView:false});
  measure('ship_read',readStarted);
  const view=result=>{const started=Date.now(),value=combatView(clan,player,result,body);measure('ship_view',started);return value;};
  const currentShip=ensureShip(clan);
  // Read-only polls do not queue behind participant action or persistence locks.
  const displayFight=currentShip.fights[body.moduleId];
  if(command==='sync'&&displayFight?.id===body.fightId&&!shipSyncNeedsTick(displayFight,options.now??Date.now()))return view({fightId:displayFight.id,status:displayFight.status,damage:0});
  const targetFight=currentShip.fights[body.moduleId]?.id===body.fightId||command==='open'?currentShip.fights[body.moduleId]:currentShip.history?.[body.fightId];
  const participantIds=new Set(Object.keys(targetFight?.participants||{}));
  const actors=store.players.filter(p=>p.id===player.id || participantIds.has(String(p.id)));
  const ids=actors.map(p=>String(p.id));
  const lockStarted=Date.now();
  const applyCombat = async()=>{
   measure('ship_lock',lockStarted);
   membership(clan,player);
   // Polls with no pending bleed or deadline transition are read-only.
   const syncedFight=ensureShip(clan).fights[body.moduleId];
   if(command==='sync'&&syncedFight?.id===body.fightId&&!shipSyncNeedsTick(syncedFight,options.now??Date.now())){
    return view({fightId:syncedFight.id,status:syncedFight.status,damage:0});
   }
   if (!background) {
    const flushStarted=Date.now();await playerDb.flushDirtyPlayers(ids);measure('ship_flush',flushStarted);
   }
   const run = async()=>{
    const draftClan={...clan,ship:hasDb()&&!background?ensureShip(clan):shipCombatDraft(ensureShip(clan),body.moduleId,body.fightId)};let drafts=hasDb()&&!background?[]:actors.map(clone),result,progressEvents=[];
    const execute=()=>{
     const actor=drafts.find(p=>String(p.id)===String(player.id));membership(clan,actor);
     const ship=ensureShip(draftClan),now=options.now??Date.now();
     const affectedIds=new Set([ship.fights[body.moduleId]?.id,body.fightId].filter(Boolean));
     const affectedFights=()=>[ship.fights[body.moduleId],...Array.from(affectedIds,id=>ship.history?.[id])].filter((f,i,rows)=>f&&rows.findIndex(row=>row?.id===f.id)===i);
     const beforeContributions=new Map(affectedFights().map(f=>[f.id,clone(f.participants||{})]));
     const moduleId=body.moduleId;
     const activeFight = ship.fights[moduleId];
     const continuing = activeFight?.status === 'active'
      && (command === 'open' || activeFight.id === body.fightId)
      && !(activeFight.escaped_player_ids || []).map(String).includes(String(actor.id))
      && (activeFight.participants?.[actor.id] || (activeFight.joined_player_ids || []).map(String).includes(String(actor.id)));
     if ((command === 'open' || command === 'attack') && !continuing) {
      assertSingleBossFight({...store,clans:store.clans.map(c=>String(c.id)===String(clan.id)?draftClan:c)},actor,command==='open'?activeFight?.id:body.fightId,now);
     }
     if(command==='open'){
      if(body.fightId && (ship.fights[moduleId]?.id!==body.fightId || ship.fights[moduleId]?.status!=='active' || Date.parse(ship.fights[moduleId]?.ends_at)<=now))throw Object.assign(new Error('SHIP_FIGHT_NOT_ACTIVE'),{code:'SHIP_FIGHT_NOT_ACTIVE',statusCode:409});
      if(ship.fights[moduleId])tickShipFight(draftClan,ship.fights[moduleId],drafts,{...options,now});
      if(body.fightId && ship.fights[moduleId]?.status!=='active')throw Object.assign(new Error('SHIP_FIGHT_NOT_ACTIVE'),{code:'SHIP_FIGHT_NOT_ACTIVE',statusCode:409});
      result=openShipFight(draftClan,actor,actionBody,now);
     }else{
      const fight=ship.fights[moduleId]?.id===body.fightId?ship.fights[moduleId]:ship.history?.[body.fightId];
      if(!fight||fight.moduleId!==moduleId)throw Object.assign(new Error('SHIP_FIGHT_NOT_FOUND'),{code:'SHIP_FIGHT_NOT_FOUND',statusCode:404});
      tickShipFight(draftClan,fight,drafts,{...options,now});
      if(command==='attack'&&(fight.status==='active'||ship.receipts['combat:'+actor.id+':'+body.requestId]))result=attackShipFight(draftClan,actor,drafts,actionBody,{...options,now});
      else if(command==='escape')result=escapeShipFight(fight,actor);
      else result={fightId:fight.id,status:fight.status,damage:0};
     }
     progressEvents=[];
     for(const fight of affectedFights())for(const [playerId,contribution] of Object.entries(fight.participants||{})){
      const before=beforeContributions.get(fight.id)?.[playerId];
      const damage=Math.max(0,Number(contribution.damage||0)-Number(before?.damage||0));
      const hits=Math.max(0,Number(contribution.hits||0)-Number(before?.hits||0));
      if(damage||hits)progressEvents.push({playerId,damage,hits});
     }
    };
    const writeStarted=Date.now();
    if(background){
     const receiptKey=(command==='open'?'open:':'combat:')+player.id+':'+body.requestId;
     const shipChanges=captureShipCombatChanges(draftClan.ship,body.moduleId,body.fightId,receiptKey);
     const beforePlayers=new Map(drafts.map(draft=>[draft.id,JSON.stringify(draft)]));
     const initialState=command==='open' && hasDb() ? structuredClone(ensureShip(clan)) : null;
     execute();
     const players=drafts.filter(draft=>JSON.stringify(draft)!==beforePlayers.get(draft.id)).map(draft=>{
      const record=playerDb.toDbPlayerRecord(draft);
      return {id:record.id,username:record.username,level:record.level,xp:record.xp,coins:record.coins,data:record.data,progress:playerDb.buildPlayerProgress(draft)};
     });
     const patch=shipChanges();
     const batch=structuredClone({mode:'ship',stateKey:clan.id,state:patch,stateChanged:Object.keys(patch).length>0,players});
     if(batch.stateChanged || players.length) queueShipWrite(clan, players.map(record=>record.id), async()=>{
      if(!hasDb()){
       const saved=await persistLocal(store);
       if(saved===false&&process.env.NODE_ENV!=='test')throw new Error('SHIP_STORAGE_UNAVAILABLE');
       return;
      }
      await ensureSchema();
      await commitCombatWrite(getPostgresSql(),()=>withPostgresTransaction(async sql=>{
       if(initialState)await sql`INSERT INTO clan_ship_state (clan_id,state) VALUES (${String(clan.id)},${JSON.stringify(initialState)}::jsonb) ON CONFLICT (clan_id) DO NOTHING`;
       await saveCombatBatch(sql,batch);
      }),()=>batch);
     }, batch.players);
    }else if(hasDb()){
     await ensureSchema();
     let batch;
     await commitCombatWrite(getPostgresSql(), () => withPostgresTransaction(async sql=>{
      if(command==='open')await sql`INSERT INTO clan_ship_state (clan_id,state) VALUES (${String(clan.id)},${JSON.stringify(draftClan.ship)}::jsonb) ON CONFLICT (clan_id) DO NOTHING`;
      const selectStarted=Date.now();
      const locked=await lockShipCombatRows(sql,clan.id,ids);
      draftClan.ship=locked.state;
      const rows=locked.players;
      measure('ship_select',selectStarted);
      const computeStarted=Date.now();
      const receiptKey=(command==='open'?'open:':'combat:')+player.id+':'+body.requestId;
      drafts=rows.map(playerDb.fromDbPlayerRecord);
      const beforePlayers=new Map(drafts.map(p=>[p.id,JSON.stringify(p)]));
      const shipChanges=captureShipCombatChanges(draftClan.ship,body.moduleId,body.fightId,receiptKey);
      execute();
      measure('ship_compute',computeStarted);
      const encodeStarted=Date.now();
      const changed=drafts.filter(draft=>JSON.stringify(draft)!==beforePlayers.get(draft.id)).map(draft=>{
       const record=playerDb.toDbPlayerRecord(draft);
       return {id:record.id,username:record.username,level:record.level,xp:record.xp,coins:record.coins,data:record.data,progress:playerDb.buildPlayerProgress(draft)};
      });
      measure('ship_encode',encodeStarted);
      const saveStarted=Date.now();
      const patch = shipChanges();
      batch = {mode:'ship',stateKey:clan.id,state:patch,stateChanged:Object.keys(patch).length>0,players:changed};
      await saveCombatBatch(sql,batch);
      measure('ship_save',saveStarted);
     },{onTiming:options.onTiming}), () => batch);
    }else{
     execute();const byId=new Map(drafts.map(p=>[String(p.id),p]));
     const snapshot={...store,players:store.players.map(p=>byId.get(String(p.id))||p),clans:store.clans.map(c=>String(c.id)===String(clan.id)?draftClan:c)};
     const saved=await persistLocal(snapshot);
     if(saved===false&&process.env.NODE_ENV!=='test')throw Object.assign(new Error('Persistent storage is required for ship combat'),{code:'SHIP_STORAGE_UNAVAILABLE',statusCode:503});
    }
    measure('ship_write',writeStarted);
    clan.ship=draftClan.ship;
    if(hasDb())primeShipRead(clan);
    const fields=['energy','roulette_bonus_spins','player_achievements','battle_pass','battle_pass_archive','talent_tree_version','legacy_talent_levels','talent_levels','advanced_attacks','bone_curse','available_talent_points','total_talent_points_earned','total_talent_points_spent','talent_damage_progress','next_talent_threshold_index','unlocked_talent_sectors','talent_combat_state','talent_base_max_energy','talent_points','boss_talent_progress','boss_talent_level','boss_talent_progress_goal','weapon_inventory','weapon_cooldowns','pending_boss_boxes','boss_daily_rewards','ship_boss_kills','boss_hits_today','boss_damage_today','boss_damage_lifetime','poison_refund_progress'];
    for(const draft of drafts){const live=store.players.find(p=>String(p.id)===String(draft.id));if(live)for(const key of fields)if(draft[key]!==undefined && JSON.stringify(live[key])!==JSON.stringify(draft[key]))live[key]=draft[key];}
    if(hasDb()&&!background)for(const draft of drafts){const live=store.players.find(p=>String(p.id)===String(draft.id));if(live)playerDb.acknowledgeCommittedPlayer(live,draft);}
    // Receipts and read-only polls add no progress.
    for(const event of progressEvents)options.onProgress?.(event);
    return view(result);
   };
   return background ? run() : withKeyLocks(ids.map(id=>'persist-player:'+id),run);
  };
  return withKeyLocks(ids.map(id=>'action-player:'+id),()=>
   withKeyLock((background ? 'ship-combat:' : 'ship-clan:')+clan.id, applyCombat));
 }
 return {read,rename,contribute,creditPayment,combat};
}
