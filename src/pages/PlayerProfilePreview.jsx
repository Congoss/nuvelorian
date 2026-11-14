import {useState} from 'react';
import EquipmentPanel from '@/components/game/EquipmentPanel';
import {DEFAULT_EQUIPMENT_ITEMS} from '@/components/game/equipmentData';

const STORAGE='enhancement-profile-preview-v1';
function initialProfile(){
 const items=DEFAULT_EQUIPMENT_ITEMS.filter(item=>item.id.startsWith('nuvelor_'));
 return {id:'local-enhancement-hero',nickname:'Тестовий герой',language:'uk',level:70,xp:0,tentacles:0,premium:0,stat_strength:100,
  inventory_items:items.map(item=>({...item,type:'equipment',count:1,locked:false})),equipped_items:Object.fromEntries(items.map(item=>[item.slot,item.id]))};
}
export default function PlayerProfilePreview(){
 const [profile,setProfile]=useState(()=>{const base=initialProfile();try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');return saved?{...base,level:saved.level===69?69:70,equipped_items:saved.equipped_items||base.equipped_items}:base;}catch{return base;}});
 const update=async patch=>setProfile(previous=>{const next={...previous,...patch};localStorage.setItem(STORAGE,JSON.stringify({level:next.level,equipped_items:next.equipped_items}));return next;});
 return <main className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#090f0c] px-2 py-4 text-[#e5ecd1]">
  <div className="mx-auto max-w-[520px]">
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs"><a href="/equipment-enhance-preview" className="text-[#d8c77c]">← Майстерня</a><span className="text-[#94a58b]">Локальний тестовий профіль</span></div>
   <header className="mx-2 mb-3 rounded-xl border border-[#61704b] bg-[#1b291f] p-3"><div className="flex items-center justify-between gap-2"><div><h1 className="text-lg font-black">{profile.nickname}</h1><p className="mt-1 text-xs text-[#b6c49e]">Рівень {profile.level} · Nuvelor {Object.values(profile.equipped_items).filter(Boolean).length}/6</p></div><div className="flex gap-1">{[69,70].map(level=><button key={level} type="button" aria-pressed={profile.level===level} onClick={()=>update({level})} className={`rounded border px-3 py-2 text-xs font-bold ${profile.level===level?'border-[#edcd67] bg-[#5b512c]':'border-[#576547] bg-[#142017]'}`}>{level} LVL</button>)}</div></div><p className="mt-2 text-[11px] text-[#97ab8b]">Вибери річ → «Заточка · локальний тест». Жуйки й заточка зберігаються в окремому тестовому інвентарі.</p></header>
   <div className="equipment-preview-shell rounded-xl border border-[#334a39] bg-[#0e1711] py-2"><EquipmentPanel profile={profile} onClose={()=>window.location.assign('/equipment-enhance-preview')} onUpdateProfile={update} onRefreshProfile={()=>Promise.resolve(profile)}/></div>
  </div>
  <style>{`.equipment-preview-shell>div{height:auto;overflow:visible}.equipment-preview-shell .grid.min-h-0.flex-1{flex:none;max-height:330px;min-height:160px;overflow-y:auto}`}</style>
 </main>;
}
