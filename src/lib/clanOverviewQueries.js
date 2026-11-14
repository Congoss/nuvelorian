// Display data only; every mutation still goes directly to the server.
export function clanOverviewQueries(profile, api, warmAvatar = () => {}) {
  const clanId = profile?.clan_id || profile?.clan_name || '';
  const scope = [String(profile?.id || ''), String(clanId)];
  const common = {enabled:Boolean(clanId && profile?.id), staleTime:15000, gcTime:300000, refetchOnWindowFocus:false};
  return {
    members:{...common,queryKey:['clan-overview',...scope,'members'],queryFn:async()=>{
      const rows=await api.listClanMembers(clanId);
      const members=Array.isArray(rows)?rows:[];
      for(const member of members.slice(0,10)) {
        const src=member.avatar||member.photoUrl||member.photo_url;
        if(src)try{Promise.resolve(warmAvatar(src)).catch(()=>{});}catch{/* Decorative only. */}
      }
      return members;
    }},
    clan:{...common,queryKey:['clan-overview',...scope,'clan'],queryFn:()=>api.getClan(clanId)},
    raid:{...common,staleTime:30000,queryKey:['clan-overview',...scope,'raid'],queryFn:()=>api.listRaidBossLeaderboard()},
  };
}
