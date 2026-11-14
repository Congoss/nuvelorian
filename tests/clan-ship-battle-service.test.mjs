import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';for(const k of ['DATABASE_URL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING'])process.env[k]='';
const {createClanShipService}=await import('../server/services/clan-ship-service.js');
const {ensureShip}=await import('../server/utils/clanShip.js');
const {acquireKeyLock}=await import('../server/utils/keyLock.js');
test('a fresh clan starts with no free platform and existing progress is preserved',()=>{
 const clan={id:'new-clan'};const ship=ensureShip(clan);
 assert(Object.values(ship.progress).every(value=>value===0));
 ship.progress.hull=1234;
 assert.equal(ensureShip(clan).progress.hull,1234);
});
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(persistLocal=()=>true){
 const player={id:'fighter',created_by:'fighter@test',clan_id:'ship-clan',nickname:'Fighter',level:80,talent_tree_version:2,talent_levels:{},inventory_items:[],equipped_items:{},weapon_inventory:{'large-poison':1000,'small-poison':1000},weapon_cooldowns:{}},mate={...clone(player),id:'mate',created_by:'mate@test',nickname:'Mate'};
 const clan={id:'ship-clan',name:'ship-clan'};ensureShip(clan).progress.hull=100000000;const store={clans:[clan],players:[player,mate]};
 return {player,mate,clan,store,service:createClanShipService({store,persistLocal})};
}
const open={requestId:'open-boss-request-001',moduleId:'hull'};
const attack=(fightId,requestId='attack-boss-request-001')=>({requestId,moduleId:'hull',fightId,weaponId:'c4',multiplier:100});

test('ship escape releases the player, preserves damage and other participants, and permits rejoining',async()=>{
 const {assertSingleBossFight}=await import('../server/utils/singleBossFight.js');
 const {player,mate,clan,store,service}=fixture();
 const opened=await service.combat(clan,player,'open',open);
 await service.combat(clan,mate,'open',{...open,requestId:'mate-open-escape-test'});
 await service.combat(clan,player,'attack',{...attack(opened.fight.id),multiplier:1},{rng:()=>1});
 const damage=clan.ship.fights.hull.participants[player.id].damage;
 const hp=clan.ship.fights.hull.current_hp;
 const body={moduleId:'hull',fightId:opened.fight.id,requestId:'escape-test-request'};
 assert.throws(()=>assertSingleBossFight(store,player),{code:'BOSS_FIGHT_ALREADY_ACTIVE'});
 await service.combat(clan,player,'escape',body);
 await service.combat(clan,player,'escape',body);
 assert.doesNotThrow(()=>assertSingleBossFight(store,player));
 assert.throws(()=>assertSingleBossFight(store,mate),{code:'BOSS_FIGHT_ALREADY_ACTIVE'});
 assert.equal(clan.ship.fights.hull.current_hp,hp);
 assert.equal(clan.ship.fights.hull.participants[player.id].damage,damage);
 assert.equal(clan.ship.fights.hull.status,'active');
 await assert.rejects(service.combat(clan,player,'attack',{...attack(opened.fight.id,'stale-after-escape'),multiplier:1}),/SHIP_FIGHT_LEFT/);
 await service.combat(clan,player,'open',{...open,requestId:'rejoin-after-escape'});
 assert.throws(()=>assertSingleBossFight(store,player),{code:'BOSS_FIGHT_ALREADY_ACTIVE'});
 assert.equal(clan.ship.fights.hull.participants[player.id].damage,damage);
});

test('a player cannot escape another player’s ship fight without joining',async()=>{
 const {player,mate,clan,service}=fixture();
 const opened=await service.combat(clan,player,'open',open);
 await assert.rejects(service.combat(clan,mate,'escape',{moduleId:'hull',fightId:opened.fight.id}),/SHIP_FIGHT_NOT_JOINED/);
 assert.deepEqual(clan.ship.fights.hull.joined_player_ids,[player.id]);
});

test('critical acknowledgement unsticks a false lethal preview, then an actual kill settles once',async()=>{
 const {rebasePoisonQueue,projectPoisonTap}=await import('../src/lib/instantPoisonCombat.js');
 const {createPoisonAttackQueue}=await import('../src/lib/poisonAttackQueue.js');
 const {player,clan,service}=fixture();player.talent_levels={t57:100};
 const opened=await service.combat(clan,player,'open',open);
 clan.ship.fights.hull.current_hp=10000;
 let view={fight:{...opened.fight,current_hp:1},profile:clone(player),pendingDefeat:true,damageLog:{damage:1999999,hits:999}};
 let done;const settled=new Promise(resolve=>{done=resolve;});
 const queue=createPoisonAttackQueue({
  send:entry=>service.combat(clan,player,'attack',{...attack(opened.fight.id,'recover-video-request-'+entry.token),weaponId:entry.weapon.id,multiplier:entry.multiplier},{rng:()=>0}),
  onSettled:(_entry,result,remaining)=>{view=rebasePoisonQueue(view,result,remaining,'ship');},
  onChange:entries=>{if(!entries.length)done();},
 });
 queue.enqueue({weapon:{id:'c4'},multiplier:1,fightId:opened.fight.id},1000);
 await settled;
 assert.equal(view.fight.current_hp,9600);assert(!view.pendingDefeat);
 assert.equal(view.profile.weapon_inventory['large-poison'],999);
 assert(projectPoisonTap(view,{weaponId:'c4',mode:'ship'}));
 const finishing={...attack(opened.fight.id,'actual-video-finishing'),multiplier:100};
 const killed=await service.combat(clan,player,'attack',finishing,{rng:()=>0});
 view=rebasePoisonQueue(view,killed,[],'ship');
 assert.equal(view.fight.status,'dead');assert.equal(view.fight.current_hp,0);
 const boxes=view.profile.pending_boss_boxes.filter(box=>box.fightId===opened.fight.id);
 assert.equal(boxes.length,1);
 const replay=await service.combat(clan,player,'attack',finishing,{rng:()=>0});
 assert.equal(replay.player.pending_boss_boxes.filter(box=>box.fightId===opened.fight.id).length,1);
 assert.equal(replay.player.weapon_inventory['large-poison'],killed.player.weapon_inventory['large-poison']);
 assert.equal(killed.fight.combat_revision,2);
 assert.equal(replay.fight.combat_revision,killed.fight.combat_revision);
});

test('long small-poison/flask sequence reconciles every receipt and reopens with identical HP and inventory',async()=>{
 const {projectPoisonTap,rebasePoisonQueue}=await import('../src/lib/instantPoisonCombat.js');
 const {player,clan,service}=fixture();player.talent_levels={t36:10,t38:10,t40:10,t53:10,t57:10};
 const now=Date.now(),opened=await service.combat(clan,player,'open',open,{now});
 let view={fight:opened.fight,profile:opened.player,damageLog:opened.playerDamageLog};
 const entries=Array.from({length:36},(_,i)=>({fightId:opened.fight.id,weapon:{id:i%6===5?'c4':'satchel'},multiplier:1,queuedAt:now+i}));
 for(const entry of entries)view=projectPoisonTap(view,{weaponId:entry.weapon.id,mode:'ship',now:entry.queuedAt})||view;
 let last;
 for(let i=0;i<entries.length;i++){
  const entry=entries[i];last=await service.combat(clan,player,'attack',{...attack(opened.fight.id,'long-sequence-hit-'+i),weaponId:entry.weapon.id,multiplier:1},{now:entry.queuedAt,rng:()=>1});
  view=rebasePoisonQueue(view,last,entries.slice(i+1),'ship');
  assert.equal(view.damageLog.hits,36);
  assert.equal(view.profile.weapon_inventory['small-poison'],970);
  assert.equal(view.profile.weapon_inventory['large-poison'],994);
 }
 assert.equal(view.fight.current_hp,last.fight.current_hp);
 assert.equal(view.damageLog.damage,last.playerDamageLog.damage);
 const reentered=await service.combat(clan,player,'open',{...open,requestId:'long-sequence-reenter',fightId:opened.fight.id},{now:now+100});
 assert.equal(reentered.fight.current_hp,view.fight.current_hp);
 assert.deepEqual(reentered.player.weapon_inventory,view.profile.weapon_inventory);
 assert.equal(reentered.playerDamageLog.damage,view.damageLog.damage);
});

test('ship poison preservation uses talents and equipment on every dose with full damage',async()=>{
 for(const weaponId of ['satchel','f4','c4']){
  const {player,clan,service}=fixture();
  player.talent_levels={t09:10,t34:10};player.equipped_items={pet:'pet-skunk'};
  player.weapon_inventory['medium-poison']=1000;
  const stockKey={satchel:'small-poison',f4:'medium-poison',c4:'large-poison'}[weaponId];
  const opened=await service.combat(clan,player,'open',open);
  const result=await service.combat(clan,player,'attack',{...attack(opened.fight.id),weaponId,multiplier:10},{rng:()=>.05});
  assert.equal(result.player.weapon_inventory[stockKey],1000,weaponId);
  assert(result.hit.damage>0);assert.equal(result.playerDamageLog.hits,10);
  assert.equal(opened.fight.current_hp-result.fight.current_hp,result.hit.damage);
 }
});

test('pet crit applies above half HP and talent T57 adds chance below half HP on ship bosses',async()=>{
 for(const hp of [1900000,900000]){
  const {player,clan,service}=fixture();player.equipped_items={pet:'hereearlypet'};player.talent_levels={t57:10};
  const opened=await service.combat(clan,player,'open',open);clan.ship.fights.hull.current_hp=hp;
  const result=await service.combat(clan,player,'attack',{...attack(opened.fight.id),multiplier:1},{rng:()=>hp>1000000?.04:.24});
  assert.equal(result.hit.isCrit,true);
 }
});

test('ship poison crit responses contain doubled actual damage and deduct it from HP',async()=>{
 for(const weaponId of ['satchel','f4','c4']){
  const run=async rng=>{
   const {player,clan,service}=fixture();
   player.talent_levels={t57:10};player.weapon_inventory['medium-poison']=100;
   const opened=await service.combat(clan,player,'open',open);
   clan.ship.fights.hull.current_hp=900000;
   return service.combat(clan,player,'attack',{...attack(opened.fight.id),weaponId,multiplier:1},{rng});
  };
  const normal=await run(()=>1),crit=await run(()=>0);
  assert.equal(normal.hit.isCrit,false);assert.equal(crit.hit.isCrit,true);
  assert.equal(crit.hit.damage,normal.hit.damage*2);
  assert.equal(900000-crit.fight.current_hp,crit.hit.damage);
  assert.equal(crit.playerDamageLog.damage,crit.hit.damage);
 }
});

test('cheese poison sequence survives persisted reload and re-entry with matching HP stock and flags',async()=>{
 let saved;
 const {player,clan,service}=fixture(snapshot=>{saved=clone(snapshot);return true;});
 player.talent_levels={t23:5,t25:5,t28:10};
 const opened=await service.combat(clan,player,'open',open);
 let confirmed;
 for(let index=0;index<5;index++)confirmed=await service.combat(clan,player,'attack',{
  ...attack(opened.fight.id,'poison-reentry-hit-'+index),multiplier:10,compact:true,
 },{rng:()=>1});
 assert.equal(confirmed.playerDamageLog.hits,50);
 assert.equal(confirmed.player.weapon_inventory['large-poison'],950);
 assert.equal(confirmed.fight.current_hp,confirmed.fight.max_hp-confirmed.playerDamageLog.damage);
 const restored=clone(saved),restoredPlayer=restored.players.find(p=>p.id===player.id),restoredClan=restored.clans.find(c=>c.id===clan.id);
 const reopened=await createClanShipService({store:restored,persistLocal:()=>true}).combat(restoredClan,restoredPlayer,'open',{
  requestId:'poison-reentry-open-001',moduleId:'hull',fightId:opened.fight.id,compact:true,
 });
 assert.equal(reopened.fight.id,confirmed.fight.id);
 assert.equal(reopened.fight.current_hp,confirmed.fight.current_hp);
 assert.equal(reopened.player.weapon_inventory['large-poison'],950);
 assert.deepEqual(reopened.player.talent_combat_state,confirmed.player.talent_combat_state);
 assert.deepEqual(reopened.playerDamageLog,confirmed.playerDamageLog);
});

test('compact retries preserve the original request fingerprint and stock',async()=>{
 const {player,clan,service}=fixture();player.gift_mail=[{text:'mail'.repeat(20000)}];
 const opened=await service.combat(clan,player,'open',open),body=attack(opened.fight.id);
 const original=await service.combat(clan,player,'attack',body,{rng:()=>1});
 const retry=await service.combat(clan,player,'attack',{...body,compact:true},{rng:()=>1});
 assert.equal(retry.replayed,true);assert.equal(retry.damage,original.damage);
 assert.equal(retry.player.weapon_inventory['large-poison'],900);assert.equal(retry.player.gift_mail,undefined);assert.equal(retry.ship,undefined);
 assert(JSON.stringify(retry).length<JSON.stringify(original).length/5);
});

test('read-only sync does not wait for a participant action lock',async()=>{
 const {player,clan,service}=fixture();const opened=await service.combat(clan,player,'open',open);
 const release=await acquireKeyLock('action-player:'+player.id);let timer;
 try{
  const sync=await Promise.race([service.combat(clan,player,'sync',{moduleId:'hull',fightId:opened.fight.id,compact:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Read-only sync waited behind an action')),300);})]);
  assert.equal(sync.fight.current_hp,2000000);
 }finally{clearTimeout(timer);release();}
});

test('cheese boss accepts critical hits and accumulates pencil bleed extensions',async()=>{
 const {player,clan,service}=fixture();
 player.talent_levels={t23:5,t25:5,t28:100};
 const now=Date.parse('2026-10-28T12:00:00Z');
 const opened=await service.combat(clan,player,'open',open,{now});
 const body={...attack(opened.fight.id,'pencil-bleed-test-001'),weaponId:'knuckle',multiplier:1};
 const first=await service.combat(clan,player,'attack',body,{now,rng:()=>0});
 assert.equal(first.hit.isCrit,true);
 const initialExpiry=clan.ship.fights.hull.participants[player.id].runtime.bleed.expiresAt;
 for(let i=1;i<=3;i++){
  player.weapon_cooldowns={}; // Isolate bleed refresh from weapon cooldown.
  await service.combat(clan,player,'attack',{...body,requestId:'pencil-bleed-test-00'+(i+1)},{now:now+i*1000,rng:()=>0});
 }
 const expiry=clan.ship.fights.hull.participants[player.id].runtime.bleed.expiresAt;
 assert(expiry>=initialExpiry+15000);
});

test('ship damage and shared victory persist Battle Pass progress for contributors once',async()=>{
 const {player,mate,clan,service}=fixture();const now=Date.parse('2026-10-28T12:00:00Z');
 const opened=await service.combat(clan,player,'open',open,{now});
 await service.combat(clan,mate,'open',{...open,requestId:'mate-open-pass-0001',fightId:opened.fight.id},{now});
 clan.ship.fights.hull.current_hp=400;
 await service.combat(clan,mate,'attack',{...attack(opened.fight.id),multiplier:1},{now,rng:()=>1});
 const body={...attack(opened.fight.id),multiplier:1};
 await service.combat(clan,player,'attack',body,{now,rng:()=>1});
 for(const p of [player,mate]){
  assert.equal(p.battle_pass.daily.metrics.boss,1);
  assert.equal(p.battle_pass.daily.metrics.bossKills,1);
  assert.equal(p.battle_pass.daily.metrics.bossKillXp,10);
  assert(p.battle_pass.weekly.awarded.includes('boss'));
 }
 const before=JSON.stringify([player.battle_pass,mate.battle_pass]);
 await service.combat(clan,player,'attack',body,{now,rng:()=>1});
 await service.combat(clan,mate,'sync',{moduleId:'hull',fightId:opened.fight.id},{now});
 assert.equal(JSON.stringify([player.battle_pass,mate.battle_pass]),before);
});
for(const multiplier of [5,10,100])test(`x${multiplier} ship attack consumes exact stock and replay never charges twice`,async()=>{
 const {player,clan,service}=fixture();const opened=await service.combat(clan,player,'open',open);
 const body={...attack(opened.fight.id),multiplier};
 const result=await service.combat(clan,player,'attack',body,{rng:()=>1});
 assert.equal(player.weapon_inventory['large-poison'],1000-multiplier);
 assert.equal(result.fight.current_hp,2000000-200*multiplier);
 assert.equal(clan.ship.fights.hull.participants[player.id].hits,multiplier);
 await service.combat(clan,player,'attack',body,{rng:()=>1});
 assert.equal(player.weapon_inventory['large-poison'],1000-multiplier);
 await service.combat(clan,player,'attack',{...body,requestId:'next-poison-attack-001'},{rng:()=>1});
 assert.equal(player.weapon_inventory['large-poison'],1000-2*multiplier);
});

test('ship screen exposes gum stock and boss leaderboard retains pass name colors',async()=>{
 const {player,mate,clan,service}=fixture();
 player.enhancement_gums={normal:17,improved:3,premium:1};
 const {recordBattlePassEvent}=await import('../server/utils/battlePass.js');
 recordBattlePassEvent(player,{type:'login'});recordBattlePassEvent(mate,{type:'login'});
 player.battle_pass.tier='legendary';mate.battle_pass.tier='epic';
 player.battle_pass_view={tier:'free'};mate.battle_pass_view={tier:'free'};
 const view=await service.read(clan,player);assert.deepEqual(view.enhancementGums,{normal:17,improved:3,premium:1});
 const opened=await service.combat(clan,player,'open',open);
 await service.combat(clan,player,'attack',{...attack(opened.fight.id),multiplier:1},{rng:()=>1});
 const result=await service.combat(clan,mate,'attack',{...attack(opened.fight.id,'mate-color-attack-001'),multiplier:1},{rng:()=>1});
 assert.equal(result.leaderboard.find(row=>row.player_id===player.id).battle_pass_tier,'legendary');
 assert.equal(result.leaderboard.find(row=>row.player_id===mate.id).battle_pass_tier,'epic');
});

test('poison damage advances shared talent progression once and persists it',async()=>{
 let snapshot;const {player,clan,service}=fixture(value=>{snapshot=clone(value);return true});
 const {awardTalentDamage}=await import('../src/lib/talentTreeState.js');
 const before=clone(player),opened=await service.combat(clan,player,'open',open);
 const body=attack(opened.fight.id),result=await service.combat(clan,player,'attack',body,{rng:()=>1});
 assert.equal(result.leaderboard[0].clan_name,'ship-clan');
 const expected=awardTalentDamage(before,result.damage);
 for(const key of ['talent_damage_progress','available_talent_points','next_talent_threshold_index']){
  assert.equal(player[key],expected[key]);assert.equal(result.player[key],expected[key]);assert.equal(snapshot.players.find(p=>p.id===player.id)[key],expected[key]);
 }
 await service.combat(clan,player,'attack',body,{rng:()=>1});
 assert.equal(player.available_talent_points,expected.available_talent_points);
 assert.equal(player.talent_damage_progress,expected.talent_damage_progress);
});
test('reopening an active fight keeps HP, shared inventory and cooldowns',async()=>{
 const {player,mate,clan,service}=fixture();const first=await service.combat(clan,player,'open',open);assert.equal(first.fight.max_hp,2000000);
 const hit=await service.combat(clan,player,'attack',attack(first.fight.id),{rng:()=>1});assert.equal(player.weapon_inventory['large-poison'],900);assert.equal(hit.fight.current_hp,1980000);
 const reopened=await service.combat(clan,mate,'open',{...open,requestId:'open-other-request-001'});assert.equal(reopened.fight.id,first.fight.id);assert.equal(reopened.fight.current_hp,hit.fight.current_hp);assert.equal(reopened.leaderboard[0].player_name,'Fighter');
 const resumed=await service.combat(clan,player,'sync',{moduleId:'hull',fightId:first.fight.id});assert.equal(resumed.player.weapon_inventory['large-poison'],900);
});
test('concurrent duplicate attacks consume only the actual single paid batch',async()=>{
 const {player,clan,service}=fixture();const first=await service.combat(clan,player,'open',open),body=attack(first.fight.id);
 const results=await Promise.all([service.combat(clan,player,'attack',body,{rng:()=>1}),service.combat(clan,player,'attack',body,{rng:()=>1})]);
 assert.equal(player.weapon_inventory['large-poison'],900);assert.equal(clan.ship.fights.hull.current_hp,1980000);assert.equal(results.filter(r=>r.replayed).length,1);
 await assert.rejects(service.combat(clan,player,'attack',{...body,multiplier:10}),/REQUEST_ID_REUSED/);
});
test('lethal passive bleed awards every contributor once, keeps the chest and resumes after restart',async()=>{
 let saved;const {player,mate,clan,store,service}=fixture(snapshot=>{saved=clone(snapshot);return true});const first=await service.combat(clan,player,'open',open),fight=clan.ship.fights.hull,now=Date.now();
 fight.current_hp=5;fight.participants={fighter:{name:'Fighter',damage:1000000,hits:1,refund:{large:100},runtime:{bleed:{damage:5,lastTickAt:now-1000,expiresAt:now+1000}}},mate:{name:'Mate',damage:999995,hits:1,refund:{},runtime:{}}};
 const sync=await service.combat(clan,player,'sync',{moduleId:'hull',fightId:first.fight.id},{now,rng:()=>1});assert.equal(sync.fight.status,'dead');assert.equal(clan.ship.kills.hull,1);
 for(const p of [player,mate]){assert.equal(p.ship_boss_kills.hull,1);assert.equal(p.pending_boss_boxes.length,1);}
 const snapshot=JSON.stringify(store.players);await service.combat(clan,mate,'sync',{moduleId:'hull',fightId:first.fight.id},{now:now+1000,rng:()=>0});assert.equal(JSON.stringify(store.players),snapshot);
 const restored=createClanShipService({store:saved,persistLocal:()=>true});const resumed=await restored.combat(saved.clans[0],saved.players[0],'open',{...open,requestId:'reopen-dead-fight-001'});assert.equal(resumed.fight.id,first.fight.id);assert.equal(resumed.fight.status,'dead');
});
test('failed persistence and unauthorized attacks do not debit poison or award victory',async()=>{
 const {player,clan,store,service}=fixture();const first=await service.combat(clan,player,'open',open);const before=JSON.stringify(store);const broken=createClanShipService({store,persistLocal:()=>{throw Error('storage failed')}});
 await assert.rejects(broken.combat(clan,player,'attack',attack(first.fight.id)),/storage failed/);assert.equal(JSON.stringify(store),before);
 await assert.rejects(service.combat(clan,{...player,clan_id:'other'},'attack',attack(first.fight.id)),/CLAN_MEMBERSHIP_REQUIRED/);
 await assert.rejects(service.combat(clan,player,'attack',{...attack(first.fight.id),multiplier:999}),/INVALID_MULTIPLIER/);
});

test('expired fights cannot consume stock, while overdue lethal bleed before the deadline still wins',async()=>{
 const {player,clan,service}=fixture();const now=Date.now();const opened=await service.combat(clan,player,'open',open,{now});
 clan.ship.fights.hull.ends_at=new Date(now+1000).toISOString();
 const expired=await service.combat(clan,player,'sync',{moduleId:'hull',fightId:opened.fight.id},{now:now+2000});assert.equal(expired.fight.status,'expired');assert.equal(player.weapon_inventory['large-poison'],1000);assert(!player.pending_boss_boxes?.length);
 const next=await service.combat(clan,player,'open',{...open,requestId:'open-after-expiry-001'},{now:now+3000});assert.notEqual(next.fight.id,opened.fight.id);
 const fight=clan.ship.fights.hull;fight.current_hp=5;fight.ends_at=new Date(now+5000).toISOString();fight.participants={fighter:{name:'Fighter',damage:1999995,hits:1,refund:{},runtime:{bleed:{damage:5,lastTickAt:now+3000,expiresAt:now+9000}}}};
 const won=await service.combat(clan,player,'sync',{moduleId:'hull',fightId:next.fight.id},{now:now+10000,rng:()=>1});assert.equal(won.fight.status,'dead');assert.equal(player.ship_boss_kills.hull,1);
});

test('victory clears finger and pencil cooldowns for contributors once, preserving other timers',async()=>{
 const {player,mate,clan,service}=fixture();const opened=await service.combat(clan,player,'open',open);
 await service.combat(clan,player,'attack',{requestId:'cooldown-finger-owner',moduleId:'hull',fightId:opened.fight.id,weaponId:'fist',multiplier:1},{rng:()=>1});
 await service.combat(clan,mate,'attack',{requestId:'cooldown-finger-mate',moduleId:'hull',fightId:opened.fight.id,weaponId:'fist',multiplier:1},{rng:()=>1});
 for(const p of [player,mate])p.weapon_cooldowns={...p.weapon_cooldowns,knuckle:new Date().toISOString(),boss_escape_until:'keep-escape',custom_timer:'keep-custom'};
 clan.ship.fights.hull.current_hp=1;
 const finishing={requestId:'cooldown-winning-hit',moduleId:'hull',fightId:opened.fight.id,weaponId:'c4',multiplier:1};
 const won=await service.combat(clan,player,'attack',finishing,{rng:()=>1});assert.equal(won.fight.status,'dead');
 for(const p of [player,mate]){assert.equal(p.weapon_cooldowns.fist,undefined);assert.equal(p.weapon_cooldowns.knuckle,undefined);assert.equal(p.weapon_cooldowns.boss_escape_until,'keep-escape');assert.equal(p.weapon_cooldowns.custom_timer,'keep-custom');}
 assert.equal(won.player.weapon_cooldowns.fist,undefined);
 player.weapon_cooldowns.fist='newer-fight-attack';
 await service.combat(clan,player,'attack',finishing,{rng:()=>1});
 assert.equal(player.weapon_cooldowns.fist,'newer-fight-attack');
});

test('T48 ship batch returns ten energy once and replay never repeats the refund',async()=>{
 const {player,clan,service}=fixture();player.energy=10;player.max_energy=100;player.talent_levels={t57:100,t48:10};
 const opened=await service.combat(clan,player,'open',open);clan.ship.fights.hull.current_hp=900000;
 const body={...attack(opened.fight.id),compact:true};
 const first=await service.combat(clan,player,'attack',body,{rng:()=>0});
 assert.equal(first.hit.isCrit,true);assert.equal(first.player.energy,20);assert.equal(player.energy,20);
 const replay=await service.combat(clan,player,'attack',body,{rng:()=>0});
 assert.equal(replay.player.energy,20);assert.equal(player.energy,20);
});

test('legacy ship combat replies and deduplicates while a save is pending', async () => {
 const previous = process.env.COMBAT_BACKGROUND_WRITES;
 process.env.COMBAT_BACKGROUND_WRITES = '1';
 let release;
 const blocked = new Promise(resolve => { release = resolve; });
 let writes = 0;
 const { service, clan, player } = fixture(async () => {
  writes++;
  await blocked;
  return true;
 });
 try {
  const opened = await service.combat(clan, player, 'open', open);
  const body = attack(opened.fight.id);
  await service.combat(clan, player, 'attack', body, {rng:()=>1});
  const remaining = player.weapon_inventory['large-poison'];
  assert.equal(remaining, 900);
  await service.combat(clan, player, 'attack', body, {rng:()=>1});
  assert.equal(player.weapon_inventory['large-poison'], remaining);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes, 1);
 } finally {
  release();
  if (previous === undefined) delete process.env.COMBAT_BACKGROUND_WRITES;
  else process.env.COMBAT_BACKGROUND_WRITES = previous;
 }
});

test('an already joined ship fight remains playable when a second fight is recorded', async () => {
 const { service, clan, player, store } = fixture();
 const opened = await service.combat(clan, player, 'open', open);
 store.bossFights = [{id:'other-fight', status:'active', current_hp:1000, opened_by_email:player.created_by}];
 const resumed = await service.combat(clan, player, 'open', {...open, requestId:'resume-overlapping-fight'});
 assert.equal(resumed.fight.id, opened.fight.id);
 const result = await service.combat(clan, player, 'attack', attack(opened.fight.id), {rng:()=>1});
 assert.ok(result.fight.current_hp < opened.fight.current_hp);
});

test('ship burst responds while the shared background writer is blocked', async t => {
 const previous = process.env.COMBAT_BACKGROUND_WRITES;
 process.env.COMBAT_BACKGROUND_WRITES = '1';
 let release;
 const blocked = new Promise(resolve => { release = resolve; });
 const { service, clan, player } = fixture(async () => { await blocked; return true; });
 try {
  const opened = await service.combat(clan, player, 'open', open);
  const start = performance.now();
  await Promise.all(Array.from({length:100}, (_,i) => service.combat(clan, player, 'attack', {
   ...attack(opened.fight.id, 'ship-burst-request-'+i), multiplier:1, compact:true,
  }, {rng:()=>1})));
  t.diagnostic('ship 100 concurrent replies in ' + (performance.now()-start).toFixed(1) + ' ms');
  assert.equal(player.weapon_inventory['large-poison'],900);
 } finally {
  release();
  if (previous === undefined) delete process.env.COMBAT_BACKGROUND_WRITES;
  else process.env.COMBAT_BACKGROUND_WRITES = previous;
 }
});

test('ship attack bypasses a blocked rename and keeps its HP and receipt after save', async () => {
 const previous = process.env.COMBAT_BACKGROUND_WRITES;
 process.env.COMBAT_BACKGROUND_WRITES = '1';
 let release, entered;
 const saving = new Promise(resolve => { entered = resolve; });
 const blocked = new Promise(resolve => { release = resolve; });
 let blockRename = false;
 const { service, clan, player } = fixture(async snapshot => {
  if (blockRename && snapshot.clans[0].ship.name === 'Test ship') {
   blockRename = false;
   entered();
   await blocked;
  }
  return true;
 });
 clan.owner_id = player.id;
 try {
  const opened = await service.combat(clan, player, 'open', open);
  blockRename = true;
  const rename = service.rename(clan, player, {name:'Test ship',requestId:'rename-concurrency-001'});
  await saving;
  const body = {...attack(opened.fight.id),multiplier:1};
  const result = await service.combat(clan, player, 'attack', body, {rng:()=>1});
  assert.ok(result.fight.current_hp < opened.fight.current_hp);
  release();
  await rename;
  assert.equal(clan.ship.name,'Test ship');
  assert.equal(clan.ship.fights.hull.current_hp,result.fight.current_hp);
  await service.combat(clan, player, 'attack', body, {rng:()=>1});
  assert.equal(player.weapon_inventory['large-poison'],999);
 } finally {
  release();
  if (previous === undefined) delete process.env.COMBAT_BACKGROUND_WRITES;
  else process.env.COMBAT_BACKGROUND_WRITES = previous;
 }
});

test('ship attack bypasses a blocked contribution without reverting damage or currency', async () => {
 const previous = process.env.COMBAT_BACKGROUND_WRITES;
 process.env.COMBAT_BACKGROUND_WRITES = '1';
 let release, entered;
 const saving = new Promise(resolve => { entered = resolve; });
 const blocked = new Promise(resolve => { release = resolve; });
 const { service, clan, player, mate } = fixture(async snapshot => {
  if (snapshot.clans[0].ship.progress.engine === 1000) {
   entered();
   await blocked;
  }
  return true;
 });
 mate.tentacles = 2000;
 clan.ship.kills.hull = 1;
 try {
  const opened = await service.combat(clan, player, 'open', open);
  const contribution = service.contribute(clan, mate, {
   requestId:'concurrent-contribution-001',moduleId:'engine',currency:'tentacles',amount:1000,
  });
  await saving;
  const result = await service.combat(clan, player, 'attack', {...attack(opened.fight.id),multiplier:1}, {rng:()=>1});
  release();
  await contribution;
  assert.equal(mate.tentacles,1000);
  assert.equal(clan.ship.progress.engine,1000);
  assert.equal(clan.ship.fights.hull.current_hp,result.fight.current_hp);
  assert.equal(player.weapon_inventory['large-poison'],999);
 } finally {
  release();
  if (previous === undefined) delete process.env.COMBAT_BACKGROUND_WRITES;
  else process.env.COMBAT_BACKGROUND_WRITES = previous;
 }
});
