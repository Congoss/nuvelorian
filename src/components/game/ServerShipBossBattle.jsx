import { readShipScene, saveShipScene, subscribeShipScene } from '@/lib/shipSceneCache';
import {recoverShipAttack} from '@/lib/shipAttackRecovery';
import {mergeShipCombatResponse,projectPendingShipFight} from '@/lib/shipCombatResponse';
import {combatSnapshotDecision} from '@/lib/combatSnapshotOrder';
import {combatResponseMeta,recordCombatHpTransition} from '@/lib/combatHpTrace';
import ShipKangarooBoss from './ShipKangarooBoss';
import ShipGumQueenBoss from './ShipGumQueenBoss';
import { SHIP_BATTLE_TEXT } from '@/lib/shipBattleText';
import { useEffect,useMemo,useRef,useState } from 'react';
import { createPortal } from 'react-dom';
import { sendChatMessage } from '@/services/gameApi';
import { gameApi } from '@/services/gameApi';
import BossPanel from './BossPanel';
import CombatLoader from './CombatLoader';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ShipCheeseBoss from './ShipCheeseBoss';
import ShipSoldierBoss from './ShipSoldierBoss';
function ShipBattleScene({moduleId,hp,hitToken=0,language,portrait}){
 return moduleId==='hull'?<ShipCheeseBoss hp={hp} hitToken={hitToken} language={language} fullScene/>:moduleId==='engine'?<ShipSoldierBoss hp={hp} hitToken={hitToken} language={language}/>:moduleId==='hangar'?<ShipKangarooBoss hp={hp} hitToken={hitToken} language={language}/>:moduleId==='portal'?<ShipGumQueenBoss hp={hp} hitToken={hitToken} language={language}/>:<img src={portrait} alt="" className="absolute inset-0 h-full w-full object-cover"/>;
}

export default function ServerShipBossBattle({module,name,portrait,language,clanId,profile:initialProfile,onClose,onDefeat,onNavigate,expectedFightId,initialData=null}){
 const t=SHIP_BATTLE_TEXT[language]||SHIP_BATTLE_TEXT.uk;
 const sceneKey=`${initialProfile.id}:${clanId}:${module.id}`;
 const cachedScene=readShipScene(sceneKey,expectedFightId);
 const seedData=cachedScene ? mergeShipCombatResponse(initialData,cachedScene) : initialData;
 const [data,setData]=useState(()=>seedData?mergeShipCombatResponse({player:initialProfile},seedData):null),[error,setError]=useState(''),[navHeight,setNavHeight]=useState(96),[openAttempt,setOpenAttempt]=useState(0);
 const [reservedPoison,setReservedPoison]=useState(null);
 const [projectedDamage,setProjectedDamage]=useState(0);
 const [recovering,setRecovering]=useState(false);
 const attackRef=useRef(null);
 const status=useRef('active');
 const alive=useRef(true),busy=useRef(false),epoch=useRef(0),fightId=useRef(seedData?.fight.id||null),root=useRef(null),pending=useRef(null),reported=useRef(null);
 useEffect(()=>{status.current=data?.fight.status||'active'},[data?.fight.status]);
 const commitData=(source,result)=>{const previous=readShipScene(sceneKey,expectedFightId),decision=combatSnapshotDecision(previous,result);recordCombatHpTransition(source,previous,result,{accepted:decision.accept,reason:decision.reason,meta:combatResponseMeta(result)});const accepted=saveShipScene(sceneKey,result);if(alive.current)setData(current=>mergeShipCombatResponse(current||{player:initialProfile},accepted));return accepted;};
 useEffect(()=>subscribeShipScene(sceneKey,snapshot=>{if(!expectedFightId||snapshot.fight.id===expectedFightId)setData(current=>mergeShipCombatResponse(current||{player:initialProfile},snapshot));}),[sceneKey,expectedFightId]);
 const key=`ship-attack:${initialProfile.id}:${clanId}:${module.id}`;
 const remember=body=>{pending.current=body;try{if(body)sessionStorage.setItem(key,JSON.stringify(body));else sessionStorage.removeItem(key);}catch{/* Server receipts remain authoritative. */}};
 useEffect(()=>{
  alive.current=true;let cancelled=false,syncBusy=false;
  try{pending.current=JSON.parse(sessionStorage.getItem(key)||'null');if(pending.current)setRecovering(true);}catch{/* No pending request. */}
  if(!seedData){
  const openKey=key+':open';let openBody;
  try{openBody=JSON.parse(sessionStorage.getItem(openKey)||'null');}catch{/* Use a new request. */}
  if(expectedFightId && openBody?.fightId!==expectedFightId)openBody=null;
  openBody ||= {requestId:crypto.randomUUID(),moduleId:module.id,...(expectedFightId?{fightId:expectedFightId}:{})};
  try{sessionStorage.setItem(openKey,JSON.stringify(openBody));}catch{/* Retry remains safe through the server fight state. */}
  gameApi.clanShipCombat(clanId,'open',openBody).then(result=>{
   try{sessionStorage.removeItem(openKey);}catch{/* Ignore unavailable storage. */}
   if(!cancelled){fightId.current=result.fight.id;commitData('ship_open',result);}
  }).catch(e=>{
   if(cancelled)return;
   if(e.code==='BOSS_FIGHT_ALREADY_ACTIVE'){
    try{sessionStorage.removeItem(openKey);}catch{/* Ignore unavailable storage. */}
    onClose();return;
   }
   setError(e.message);
  });
  }
  // Re-entry with a cached open result still needs an immediate authoritative
  // sync, guarded against any attack accepted while the request is in flight.
  if(seedData){
   const version=epoch.current;
   gameApi.clanShipCombat(clanId,'sync',{moduleId:module.id,fightId:fightId.current}).then(result=>{
    if(!cancelled&&!busy.current&&version===epoch.current)commitData('ship_reentry_sync',result);
   }).catch(()=>{});
  }
  const timer=setInterval(async()=>{
   if(document.hidden||busy.current||pending.current||!fightId.current||status.current!=='active'||syncBusy)return;
   syncBusy=true;
   const version=epoch.current;
   try{const result=await gameApi.clanShipCombat(clanId,'sync',{moduleId:module.id,fightId:fightId.current});if(!cancelled&&!busy.current&&version===epoch.current)commitData('ship_poll',result);}
   catch(e){if(!cancelled)setError(e.message)}finally{syncBusy=false;}
  },3000);
  return()=>{cancelled=true;alive.current=false;clearInterval(timer)};
 },[clanId,module.id,key,openAttempt,expectedFightId,initialData]);
 useEffect(()=>{if(data?.fight.status==='dead'&&reported.current!==data.fight.id){reported.current=data.fight.id;onDefeat?.(module.id)}},[data?.fight.id,data?.fight.status,module.id,onDefeat]);
 const fight=useMemo(()=>data?{...projectPendingShipFight(data.fight,projectedDamage),boss_name:name}:{id:expectedFightId||'ship-opening-'+module.id,boss_id:'ship-'+module.id,boss_name:name,current_hp:module.level*2000000,max_hp:module.level*2000000,status:'active'},[data?.fight.id,data?.fight.current_hp,data?.fight.combat_revision,data?.fight.status,data?.fight.started_at,data?.fight.ends_at,data?.fight.clan_invite_sent_at,name,projectedDamage,expectedFightId,module.id,module.level]);
 const attack=async({weapon,multiplier,presses},retry=false)=>{
  if(busy.current)throw new Error(t.busy);
  if(pending.current&&!retry)return attackRef.current({},true);
  busy.current=true;epoch.current++;
  // Queued taps share one request; the server resolves each press in order under one receipt.
  const body=pending.current||{requestId:crypto.randomUUID(),moduleId:module.id,fightId:fightId.current,...(Array.isArray(presses)&&presses.length>1?{presses}:{weaponId:weapon.id,multiplier})};remember(body);
  if(weapon?.id&&!weapon.queuedFeedback)setProjectedDamage(Math.max(0,Number(weapon.previewDamage||weapon.damage)||0)*(Number(body.multiplier)||1));
  const stockKey=({satchel:'small-poison',f4:'medium-poison',c4:'large-poison'})[body.weaponId];
  // A recovered request may already be included in the open/sync snapshot.
  // Only a fresh direct tap owns a reservation in this adapter.
  if(stockKey&&weapon&&!retry&&!weapon.queuedFeedback)setReservedPoison({key:stockKey,amount:Number(body.multiplier)||1});
  try{
   const result=await recoverShipAttack(saved=>gameApi.clanShipCombat(clanId,'attack',saved),body,{onRetry:()=>{if(alive.current){setRecovering(true);setError('');}}});remember(null);
   const accepted=commitData(retry?'ship_attack_recovery':'ship_attack',result);
   if(alive.current)setError('');
   return {...accepted,fight:{...accepted.fight,boss_name:name}};
  }catch(e){
   if(e.status>=400&&e.status<500&&e.status!==408&&e.status!==429)remember(null);
   if(e.code==='NO_POISON_INVENTORY'){
    try{
     const snapshot=await gameApi.clanShipCombat(clanId,'sync',{moduleId:module.id,fightId:fightId.current});
     e.combatSnapshot=snapshot;
     if(alive.current)commitData('ship_inventory_recovery_sync',snapshot);
    }catch{/* The last confirmed checkpoint remains available to the queue. */}
   }
   if(alive.current&&e.name!=='AbortError')setError(e.message);throw e;
  }
  finally{busy.current=false;if(alive.current&&!pending.current){setReservedPoison(null);setProjectedDamage(0);setRecovering(false);}}
 };
 attackRef.current=attack;
 useEffect(()=>{
  if(!data?.fight.id||!pending.current||busy.current)return;
  void attackRef.current({},true).catch(()=>{});
 },[data?.fight.id,openAttempt]);
 const refresh=async()=>{
  if(!fightId.current||busy.current||pending.current)return;
  const version=epoch.current;
  const result=await gameApi.clanShipCombat(clanId,'sync',{moduleId:module.id,fightId:fightId.current});if(alive.current&&!busy.current&&version===epoch.current)commitData('ship_manual_sync',result);return result;
 };
 const profile=data?{...data.player,language,weapon_inventory:reservedPoison?{...data.player.weapon_inventory,[reservedPoison.key]:Math.max(0,Number(data.player.weapon_inventory?.[reservedPoison.key]||0)-reservedPoison.amount)}:data.player.weapon_inventory,pending_boss_boxes:(data.player.pending_boss_boxes||[]).filter(box=>box.fightId===data.fight.id)}:initialProfile;
 const inviteClan=async()=>{
  await sendChatMessage({channel:'clan',text:language==='en'?'Join our clan ship boss battle!':language==='ru'?'Помогите клану победить корабельного босса!':'Допоможіть клану перемогти корабельного боса!',kind:'ship_boss_invite',bossFightInvite:{fightId:fightId.current,moduleId:module.id}});
  await refresh();
 };
 const escape=async()=>{
  if(busy.current||pending.current||!fightId.current)throw new Error(t.busy);
  busy.current=true;epoch.current++;
  try{
   await gameApi.clanShipCombat(clanId,'escape',{moduleId:module.id,fightId:fightId.current,requestId:crypto.randomUUID()});
   status.current='escaped';remember(null);onClose();
  }finally{busy.current=false;}
 };
 const adapter={fight,entering:!data,attackPending:recovering,portrait,inviteClan,escape,portalRoot:root.current,damageLog:data?.playerDamageLog,leaderboard:data?.leaderboard,attack,onClose,renderScene:({hitToken})=><ShipBattleScene moduleId={module.id} hp={data?.fight.current_hp ?? fight.current_hp} hitToken={hitToken} language={language} portrait={portrait}/>};
 return createPortal(<div ref={root} data-screen={`ship-${module.id}`} className="game-app ship-battle-screen fixed inset-0 z-[400] bg-[#080e09]" style={{paddingTop:'var(--app-top-offset, 0px)',paddingBottom:'var(--app-safe-bottom, 0px)'}}>
  <div className="game-shell ui-uppercase relative mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col overflow-hidden bg-[#080e09]" style={{'--bottom-nav-space':navHeight+'px'}}>
   <TopBar mode="compact" profile={profile} showSettings onOpenSettings={onClose}/>
   {error&&<div role="alert" className="relative z-[150] p-2 text-sm text-[#f2c69c]">{error}{!data&&<button type="button" onClick={()=>{setError('');setOpenAttempt(n=>n+1)}}>{t.retryLoad}</button>}</div>}
   <div className="relative min-h-0 flex-1 overflow-hidden">{data ? <BossPanel key={data.fight.id} profile={profile} fightAdapter={adapter} onSyncProfile={()=>{}} onRefreshProfile={refresh} onUpdateProfile={async()=>{}}/> : <CombatLoader/>}</div>
   <BottomNav activeTab="clan" language={language} onHeightChange={setNavHeight} onTabChange={onNavigate||onClose}/>
  </div>
 </div>,document.body);
}
