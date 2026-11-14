import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { unseenPartnerIds } from '@/lib/partnerTaskOrder';
const EMPTY = [];
function readSeen(playerId) {
  try { const value=JSON.parse(localStorage.getItem('p4-partner-seen:'+playerId)||'[]');return Array.isArray(value)?value:[]; } catch { return []; }
}
export function usePartnerTasks(profile) {
  const playerId=profile?.id;
  const [seen,setSeen]=useState(()=>readSeen(playerId));
  const query=useQuery({queryKey:['partner-tasks'],enabled:Boolean(playerId),staleTime:30000,refetchInterval:60000,retry:1,queryFn:async()=>{
    const response=await fetch('/api/partners');
    if(!response.ok)throw new Error('PARTNERS_UNAVAILABLE');
    const result=await response.json();return Array.isArray(result?.data)?result.data:[];
  }});
  const tasks=query.data||EMPTY;
  useEffect(()=>{
    const update=()=>setSeen(readSeen(playerId));
    update();window.addEventListener('p4-partner-seen',update);window.addEventListener('storage',update);
    return()=>{window.removeEventListener('p4-partner-seen',update);window.removeEventListener('storage',update);};
  },[playerId]);
  const markSeen=useCallback(()=>{
    if(!playerId||!tasks.some(task=>!seen.includes(task.id)))return;
    const next=[...new Set([...seen,...tasks.map(task=>task.id)])];
    try{localStorage.setItem('p4-partner-seen:'+playerId,JSON.stringify(next));window.dispatchEvent(new Event('p4-partner-seen'));}catch{/* Keep session state when storage is unavailable. */}
    setSeen(next);
  },[playerId,tasks,seen]);
  return {tasks,hasNew:unseenPartnerIds(tasks,seen,profile?.partner_claims).length>0,markSeen};
}
