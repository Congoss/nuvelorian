import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { listClanQuests } from '@/services/gameApi';
import { toast } from './use-toast';
import { completedPlayerClanQuests, clanQuestCompletionMessage } from '@/lib/clanQuestNotifications';

export function useClanQuestNotifications(profile,onRefreshProfile){
 const queryClient=useQueryClient();
 const refresh=useRef(onRefreshProfile);refresh.current=onRefreshProfile;
 const playerId=profile?.id,clanId=profile?.clan_id||profile?.clan_name,language=profile?.language||'uk';
 useEffect(()=>{
  if(!playerId||!clanId)return;
  const storageKey=`clan-quest-notified:v1:${playerId}:${clanId}`;
  let initialized=false,disposed=false,busy=false,seen=new Set();
  try{const saved=localStorage.getItem(storageKey);if(saved){seen=new Set(JSON.parse(saved));initialized=true;}}catch{}
  const poll=async()=>{
   if(busy||document.hidden||disposed)return;busy=true;
   try{
    const data=await queryClient.fetchQuery({queryKey:['clan-feature',clanId,playerId,'quests'],queryFn:()=>listClanQuests(clanId),staleTime:5000});if(disposed)return;
    const completed=completedPlayerClanQuests(Array.isArray(data)?data:data?.quests,playerId);
    const fresh=initialized?completed.filter(quest=>!seen.has(quest.id)):[];
    for(const quest of completed)seen.add(quest.id);
    initialized=true;try{localStorage.setItem(storageKey,JSON.stringify([...seen]));}catch{}
    if(fresh.length){toast({...clanQuestCompletionMessage(language),duration:2500});void refresh.current?.();}
   }catch{}finally{busy=false;}
  };
  void poll();const interval=setInterval(poll,10000);const onVisible=()=>{if(!document.hidden)void poll();};document.addEventListener('visibilitychange',onVisible);
  return()=>{disposed=true;clearInterval(interval);document.removeEventListener('visibilitychange',onVisible);};
 },[playerId,clanId,language,queryClient]);
}
