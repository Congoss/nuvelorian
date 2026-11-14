import { useSyncExternalStore } from 'react';
import goldBackground from '@/assets/ui/underweight-gold-profile-background-v4.png';

export const UNDERWEIGHT_GOLD_HEADER = goldBackground;
const EVENT = 'local-profile-header-skin';
const PREVIEW_OWNER = 'local-dossier-preview';
const ACTIVE_OWNER_KEY = 'p4-local-header-owner';
const PENDING_KEY = 'p4-local-header-fitting';
const enabled = () => import.meta.env.DEV && ['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
const key = ownerId => `p4-local-header-skin:${ownerId}`;
function read(ownerId) {
  if (!ownerId || !enabled()) return '';
  try { return window.localStorage.getItem(key(ownerId)) || ''; } catch { return ''; }
}
function subscribe(listener) {
  window.addEventListener(EVENT,listener);
  window.addEventListener('storage',listener);
  return () => { window.removeEventListener(EVENT,listener);window.removeEventListener('storage',listener); };
}
export function useLocalProfileHeaderSkin(ownerId, bossId='heli') {
  const state=useSyncExternalStore(subscribe,()=>read(ownerId),()=> '');
  const data=decode(state);
  return {unlocked:data.unlocked.includes(bossId),equipped:data.selected===bossId,activeBossId:data.selected,hasEquipped:Boolean(data.selected)};
}
function decode(state){
  if(['unlocked','equipped'].includes(state))return {unlocked:['heli'],selected:state==='equipped'?'heli':''};
  try {const data=JSON.parse(state);return {unlocked:Array.isArray(data.unlocked)?data.unlocked:[],selected:typeof data.selected==='string'?data.selected:''};}catch{return {unlocked:[],selected:''};}
}
function save(ownerId,data){window.localStorage.setItem(key(ownerId),JSON.stringify(data));window.dispatchEvent(new Event(EVENT));}
export function unlockLocalProfileHeaderSkin(ownerId,bossId='heli') {
  if(!ownerId || !enabled())return;
  const data=decode(read(ownerId));
  if(!data.unlocked.includes(bossId))save(ownerId,{...data,unlocked:[...data.unlocked,bossId]});
}
export function equipLocalProfileHeaderSkin(ownerId,equipped,bossId='heli') {
  if(!ownerId || !enabled())return;
  const data=decode(read(ownerId));
  if(!data.unlocked.includes(bossId))return;
  save(ownerId,{...data,selected:equipped?bossId:''});
  if(ownerId===PREVIEW_OWNER){
    window.localStorage.setItem(PENDING_KEY,JSON.stringify({bossId,equipped}));
    const activeOwner=window.localStorage.getItem(ACTIVE_OWNER_KEY);
    if(activeOwner)rememberLocalHeaderOwner(activeOwner);
  }
}
export function rememberLocalHeaderOwner(ownerId){
  if(!ownerId||ownerId===PREVIEW_OWNER||!enabled())return;
  window.localStorage.setItem(ACTIVE_OWNER_KEY,String(ownerId));
  const raw=window.localStorage.getItem(PENDING_KEY);
  if(!raw)return;
  try{const fitting=JSON.parse(raw);if(typeof fitting.bossId!=='string'||typeof fitting.equipped!=='boolean')return;const data=decode(read(ownerId));save(ownerId,{unlocked:[...new Set([...data.unlocked,fitting.bossId])],selected:fitting.equipped?fitting.bossId:''});window.localStorage.removeItem(PENDING_KEY);}catch{/* Leave the current frame intact if a fitting is invalid. */}
}
export function applyLocalDossierFitting(){
  if(!enabled())return;
  const selected=decode(read(PREVIEW_OWNER)).selected;
  if(selected)equipLocalProfileHeaderSkin(PREVIEW_OWNER,true,selected);
}
