import { useEffect, useRef, useState } from 'react';
import AchievementUnlockPopup from './AchievementUnlockPopup';
import { PLAYER_ACHIEVEMENTS } from '@/lib/playerAchievements';
export default function AchievementNotifications({ profile, ready = true }) {
 const tracking=useRef(null);
 const [queue,setQueue]=useState([]);
 useEffect(()=>{
  if(!profile?.id)return;
  if(tracking.current?.playerId!==profile.id){
    let seen=[];
    try{const saved=JSON.parse(localStorage.getItem('achievement-popups:'+profile.id)||'[]');if(Array.isArray(saved))seen=saved;}catch{/* Storage may be unavailable. */}
    tracking.current={playerId:profile.id,seen:new Set(seen),queued:new Set()};
    setQueue([]);
  }
  const added=PLAYER_ACHIEVEMENTS.filter(item=>profile.player_achievements?.[item.id]&&!tracking.current.seen.has(item.id)&&!tracking.current.queued.has(item.id)).map(item=>item.id);
  for(const id of added)tracking.current.queued.add(id);
  if(added.length)setQueue(previous=>[...previous,...added]);
 },[profile?.id,profile?.player_achievements]);
 function dismiss(){
   const id=queue[0];
   tracking.current.seen.add(id);
   try{localStorage.setItem('achievement-popups:'+profile.id,JSON.stringify([...tracking.current.seen]));}catch{/* Keep session acknowledgement. */}
   setQueue(previous=>previous.slice(1));
 }
 return ready&&queue.length?<AchievementUnlockPopup key={queue[0]} id={queue[0]} ownerId={profile?.id} rewardStatus={profile?.player_achievements?.[queue[0]]?.reward_status} language={profile?.language} rewards={profile?.player_achievements?.[queue[0]]?.rewards} onClose={dismiss}/>:null;
}
