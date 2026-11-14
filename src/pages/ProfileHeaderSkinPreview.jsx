import { unlockLocalProfileHeaderSkin, equipLocalProfileHeaderSkin } from '@/lib/localProfileHeaderSkin';
import TopBar from '@/components/game/TopBar';
import { LeaderboardRow } from '@/components/game/LeaderboardShared';
import avatar from '@/assets/optimized/nav-hero.webp';
import { useState } from 'react';
import { PROFILE_HEADER_THEMES } from '@/lib/profileHeaderThemes';

const player={id:'skin-candidate',nickname:'local_tester',avatar,clan_name:'JUNK CONCEPT',stat_strength:18253,level:100,xp:0,max_energy:600,energy:600};
export default function ProfileHeaderSkinPreview(){
  const requestedTheme=new URLSearchParams(window.location.search).get('theme');
  const [theme,setTheme]=useState(PROFILE_HEADER_THEMES[requestedTheme]?requestedTheme:'all');
  const themes=theme==='all'?Object.keys(PROFILE_HEADER_THEMES):[theme];
  return <main className="game-app min-h-screen overflow-x-auto bg-[#0b110c] p-3 font-sans text-[#eee5c6]">
    <div className="mb-4 flex max-w-[720px] flex-wrap gap-2">{[['all','Усі рамки'],...Object.entries(PROFILE_HEADER_THEMES).map(([id,names])=>[id,names.uk])].map(([id,name])=><button type="button" aria-pressed={theme===id} key={id} onClick={()=>setTheme(id)} className={`border px-2 py-2 text-xs ${theme===id?'border-[#e1bd71] bg-[#665132]':'border-[#506146] bg-[#19221b]'}`}>{name}</button>)}</div>
    <p className="mb-4 text-xs">Всі рамки · шапка й топ · 320 / 375 / 520 px</p>
    {[320,375,520].map(width=><section key={width} className="mb-7">
      <p className="mb-2 text-xs">{width} px</p>
      <div className="flex flex-wrap items-start gap-5">{themes.map(id=><article key={`${width}-${id}`} style={{width}} className="mb-2">
        <div className="mb-1 flex items-center justify-between gap-2"><p className="text-xs">{PROFILE_HEADER_THEMES[id]?.uk}</p><button className="rounded border border-[#697858] bg-[#253224] px-2 py-1 text-xs" onClick={()=>{unlockLocalProfileHeaderSkin('local-dossier-preview',id);equipLocalProfileHeaderSkin('local-dossier-preview',true,id);}}>Приміряти</button></div>
        <TopBar profile={player} previewHeaderSkin={id}/>
        <div className="mt-2"><LeaderboardRow rank={1} titlePlayer={player} title={player.nickname} subtitle={player.clan_name} mediaSrc={avatar} compactRank onClick={()=>{}} previewHeaderSkin={id} rightNode={<b className="text-xs">CA 18 253</b>} rightNodeClassName="min-w-[75px]"/></div>
      </article>)}</div>
    </section>)}
  </main>;
}
