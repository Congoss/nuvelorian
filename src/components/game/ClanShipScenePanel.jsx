import {warmShipScene} from '@/lib/sceneAssets';
import {getShipBossPortrait} from '@/lib/shipBossPresentation';
import { getShipBossName } from '@/lib/shipBattleText';
import ShipBossCard from './ShipBossCard';
import ShipBossBattle from './ShipBossBattle';
import { useEffect, useRef, useState } from 'react';
import { gameApi } from '@/services/gameApi';
import { useTranslation } from 'react-i18next';
import { getShipBuff, shipLanguage } from '@/lib/clanShipBuffs';
import tentacles from '@/assets/optimized/cosmohand.webp';
import nearIcon from '@/assets/ui/near-logo.svg';
import stars from '@/assets/ui/star1.png';
import bossAvatar from '@/assets/boss/avatars/moth.png';
import underweight from '@/assets/boss/avatars/underweight.png';
import shork from '@/assets/boss/avatars/shork.png';
import worm from '@/assets/boss/avatars/worm.png';
import { getShipSectorState, getShipBossRoster } from '@/lib/clanShipSectorState';
import ShipSectorPanel from './ShipSectorPanel';
import { isTelegramPlatform } from '@/lib/platform/config';

export const SHIP_CURRENCIES={tentacles:{name:'Щупальця',icon:tentacles,rate:1},stars:{name:'Stars',icon:stars,rate:4000,paid:true},near:{name:'NEAR',icon:nearIcon,rate:0,paid:true}};
const bossArts=[underweight,bossAvatar,shork,worm];


export default function ClanShipScenePanel({fights={},onNavigate,language:requestedLanguage,personalKills={},lastWinners={},lastWinnerProfiles={},clanId,profile,onServerChange,nearUsd=0,allowStars=true,serverMode=false,module,modules,progress,wallet,onContribute,notice,bossKills,onBossDefeat,onSelectBoss,panelOpen,onClosePanel,renderSectorPanel}) {
 const { i18n } = useTranslation();
 const language = shipLanguage(requestedLanguage || i18n.resolvedLanguage || i18n.language);
 useEffect(()=>{const timer=setTimeout(()=>{void warmShipScene(module.id);},100);return()=>clearTimeout(timer);},[module.id]);
 const bossName=getShipBossName(module.id,language);
 const buff = getShipBuff(module.id, getShipSectorState(module,modules,progress,bossKills).level, language);
 const [battle,setBattle]=useState(false);
 const [battleData,setBattleData]=useState(null),[battleError,setBattleError]=useState('');
 const entryBusy=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{
  const hangar=document.querySelector('.ship-game-screen');
  hangar?.classList.toggle('ship-battle-open',battle);
  return()=>hangar?.classList.remove('ship-battle-open');
 },[battle]);
 const sector=getShipSectorState(module,modules,progress,bossKills);
 const scrollTo=id=>requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'}));
 const show=id=>{onSelectBoss(id);scrollTo('ship-selected-sector')};
 const fight=async id=>{
  if(entryBusy.current||battle)return;
  entryBusy.current=true;setBattleError('');
  try{
   // The server validates the one-active-fight rule before mounting any scene.
   const result=serverMode?await gameApi.clanShipCombat(clanId,'open',{requestId:crypto.randomUUID(),moduleId:id}):null;
   if(!mounted.current)return;
   setBattleData(result);onSelectBoss(id);setBattle(true);
  }catch(error){if(mounted.current)setBattleError(error.message);}
  finally{entryBusy.current=false;}
 };
 return <>
  {battleError&&<p role="alert" className="px-3 py-2 text-sm text-[#ffad91]">{battleError}</p>}
  {panelOpen&&renderSectorPanel(<ShipSectorPanel onClose={onClosePanel} module={module} sector={sector} progress={progress} wallet={wallet} currencies={Object.fromEntries(Object.entries({...SHIP_CURRENCIES,near:{...SHIP_CURRENCIES.near,rate:nearUsd*400000}}).filter(([id])=>id==='tentacles'||(isTelegramPlatform ? id==='stars'&&allowStars : id==='near')))} buff={buff} language={language} onContribute={onContribute} onSelect={onSelectBoss} onBoss={()=>{onClosePanel();scrollTo('ship-boss-'+module.id)}} notice={notice}/>)}
  <section className="ship-boss-roster ship-sector-roster"><h3 lang={language}>{{uk:'БОСИ КОРАБЛЯ',ru:'БОССЫ КОРАБЛЯ',en:'SHIP BOSSES'}[language]}</h3><div>{getShipBossRoster(modules,progress).map(m=><ShipBossCard activeFight={fights[m.id]} medalWins={serverMode?(personalKills[m.id]||0):undefined} lastWinner={lastWinners[m.id]} lastWinnerProfile={lastWinnerProfiles[m.id]} battleAvailable={!battle} key={m.id} module={m} name={getShipBossName(m.id,language)} portrait={getShipBossPortrait(m.id,bossArts[(m.level-1)%bossArts.length])} sector={getShipSectorState(m,modules,progress,bossKills)} language={language} onAttack={()=>fight(m.id)} onDetails={()=>show(m.id)}/>)}</div></section>
  {battle&&<ShipBossBattle initialData={battleData} onNavigate={onNavigate} serverMode={serverMode} profile={profile} clanId={clanId} key={module.id} module={module} name={bossName} portrait={getShipBossPortrait(module.id,bossArts[(module.level-1)%bossArts.length])} language={language} onClose={()=>{setBattle(false);setBattleData(null);if(serverMode)void onServerChange?.().catch(()=>{});}} onDefeat={serverMode?()=>{void onServerChange?.().catch(()=>{})}:onBossDefeat}/>}
 </>;
}
