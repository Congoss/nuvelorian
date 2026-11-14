export const CHAT_READ_EVENT='planet4:chat-read';
const readKey=(id,channel)=>`chat-last-read:${id}:${channel}`;
const releaseKey=(id,version)=>`chat-release-read:${id}:${version}`;
function read(storage,key){try{return storage?.getItem(key);}catch{return null;}}
export function chatIndicators(messages=[],playerId,channel,storage=globalThis.localStorage){
 const last=Number(read(storage,readKey(playerId,channel))||0);
 const patch=messages.filter(m=>m.releaseVersion).reduce((latest,m)=>!latest||Date.parse(m.created_at||'')>=Date.parse(latest.created_at||'')?m:latest,null);
 return {
  unread:messages.some(m=>!m.own&&!m.system&&!m.releaseVersion&&Date.parse(m.created_at||'')>last),
  patch:Boolean(patch&&!patch.rewardClaimed&&!read(storage,releaseKey(playerId,patch.releaseVersion))),
 };
}
function save(storage,key,value){try{if(storage?.getItem(key)===String(value))return;storage?.setItem(key,String(value));globalThis.window?.dispatchEvent(new Event(CHAT_READ_EVENT));}catch{/* Read indicators must not block chat. */}}
export function markChatRead(messages,playerId,channel,storage=globalThis.localStorage){
 const latest=messages.reduce((time,m)=>m.releaseVersion?time:Math.max(time,Date.parse(m.created_at||'')||0),Number(read(storage,readKey(playerId,channel))||0));
 if(latest)save(storage,readKey(playerId,channel),latest);
}
export function markReleaseRead(playerId,version,storage=globalThis.localStorage){if(playerId&&version)save(storage,releaseKey(playerId,version),'1');}
