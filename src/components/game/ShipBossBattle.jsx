import ShipKangarooBoss from './ShipKangarooBoss';
import ShipGumQueenBoss from './ShipGumQueenBoss';
import ServerShipBossBattle from './ServerShipBossBattle';
import ShipSoldierBoss from './ShipSoldierBoss';
import { createPortal } from 'react-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useEffect, useRef, useState } from 'react';
import BossPanel from './BossPanel';
import ShipCheeseBoss from './ShipCheeseBoss';
import { attackShipBoss, createShipBossCombat, tickShipBossCombat } from '@/lib/shipBossCombat';

export default function ShipBossBattle(props) {
 return props.serverMode ? <ServerShipBossBattle {...props}/> : <LocalShipBossBattle {...props}/>;
}
function LocalShipBossBattle({module,name,portrait,language,onClose,onDefeat,onNavigate}) {
 const [state,setState]=useState(() => createShipBossCombat(module.level * 2000000));
 const [navHeight,setNavHeight]=useState(96);
 const stateRef=useRef(state),reported=useRef(false),started=useRef(new Date().toISOString());
 stateRef.current=state;
 const fight={id:'ship-preview-'+module.id,boss_id:'ship-'+module.id,boss_name:name,current_hp:state.hp,max_hp:state.maxHp,status:state.hp>0?'active':'dead',started_at:started.current};
 const profile={id:'ship-preview-player',created_by:'ship-preview',nickname:'LOCAL_TESTER',language,energy:100,max_energy:100,tentacles:0,premium:0,level:1,talent_tree_version:2,talent_levels:{},boss_kills:1,first_boss_tutorial_seen:true,weapon_inventory:state.stock,weapon_cooldowns:Object.fromEntries(Object.entries(state.cooldowns).map(([id,time])=>[id,new Date(time-({fist:10,knuckle:20}[id]||0)*60000).toISOString()])),talent_combat_state:{[fight.id]:state.runtime}};
 const row={id:'local-damage',player_id:profile.id,player_email:profile.created_by,player_name:'LOCAL_TESTER',damage:state.damage,hits:state.hits};
 useEffect(()=>{const timer=setInterval(()=>setState(old=>tickShipBossCombat(old,Date.now())),1000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{if(state.hp===0&&!reported.current){reported.current=true;onDefeat(module.id)}},[state.hp,module.id,onDefeat]);
 const adapter={fight,portrait,damageLog:row,leaderboard:state.damage?[row]:[],onClose,
  renderScene:({hp,hitToken})=>module.id==='hull'?<ShipCheeseBoss hp={hp} language={language} fullScene/>:module.id==='engine'?<ShipSoldierBoss hp={hp} hitToken={hitToken} language={language}/>:module.id==='hangar'?<ShipKangarooBoss hp={hp} hitToken={hitToken} language={language}/>:module.id==='portal'?<ShipGumQueenBoss hp={hp} hitToken={hitToken} language={language}/>:<img src={portrait} alt="" className="absolute inset-0 h-full w-full object-cover"/>,
  attack:async({weapon,multiplier})=>{
   const previous=stateRef.current,next=attackShipBoss(previous,weapon.id,multiplier,Date.now(),profile);
   if(next===previous)throw new Error('Attack unavailable');
   stateRef.current=next;setState(next);
   const nextFight={...fight,current_hp:next.hp,status:next.hp>0?'active':'dead'};
   const nextProfile={...profile,weapon_inventory:next.stock,talent_combat_state:{[fight.id]:next.runtime},weapon_cooldowns:{...profile.weapon_cooldowns,[weapon.id]:new Date().toISOString()}};
   return {fight:nextFight,player:nextProfile,playerDamageLog:{...row,damage:next.damage,hits:next.hits},hit:{damage:next.feedback.damage,isCrit:next.feedback.kind==='critical',weaponId:weapon.id,attackType:weapon.id}};
  }};
 return createPortal(<div className="game-app fixed inset-0 z-[110] bg-[#080e09]">
  <div className="game-shell ui-uppercase relative mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col overflow-hidden border-x border-[#1e2418] bg-[#080e09]" style={{'--bottom-nav-space':navHeight+'px'}}>
   <TopBar mode="compact" profile={profile} showSettings onOpenSettings={onClose}/>
   <div className="relative min-h-0 flex-1 overflow-hidden"><BossPanel profile={profile} fightAdapter={adapter} suppressLootModal onSyncProfile={()=>{}} onRefreshProfile={()=>{}} onUpdateProfile={()=>{}}/></div>
   <BottomNav activeTab="clan" language={language} onHeightChange={setNavHeight} onTabChange={onNavigate||onClose}/>
  </div>
 </div>,document.body);
}
