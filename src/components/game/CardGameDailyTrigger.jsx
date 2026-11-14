import {useEffect,useRef} from 'react';
import {gameApi} from '@/services/gameApi';
export default function CardGameDailyTrigger({ready,playerId,onOpen}) {
 const pending=useRef(false),open=useRef(onOpen);open.current=onOpen;
 useEffect(()=>{
  if(!ready||!playerId||pending.current)return;
  let cancelled=false;pending.current=true;
  (async()=>{try{const state=await gameApi.cardGame('state');if(cancelled||!state.showDaily)return;open.current();}catch{/* A later visit can retry. */}finally{pending.current=false;}})();
  return()=>{cancelled=true;};
 },[ready,playerId]);
 return null;
}
