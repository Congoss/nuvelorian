// Presentation cache only. Never use cached data to authorize a mutation.
export function createReadCache({ttl=5000,max=1000,now=Date.now,onError=()=>{}}={}) {
  const entries=new Map();
  function refresh(key,entry,load) {
    if(entry.pending)return entry.pending;
    const task=Promise.resolve().then(load).then(value=>{
      if(entries.get(key)===entry){entry.value=value;entry.ready=true;entry.at=now();}
      return value;
    }).catch(error=>{if(!entry.ready&&entries.get(key)===entry)entries.delete(key);throw error;})
      .finally(()=>{if(entry.pending===task)entry.pending=null;});
    entry.pending=task;return task;
  }
  return {
    peek(key){const entry=entries.get(key);return entry?.ready?entry.value:undefined;},
    get(key,load){
      let entry=entries.get(key);
      if(!entry){if(entries.size>=max)entries.delete(entries.keys().next().value);entry={ready:false,pending:null,at:0};entries.set(key,entry);}
      if(entry.ready){if(now()-entry.at>=ttl)void refresh(key,entry,load).catch(onError);return Promise.resolve(entry.value);}
      return refresh(key,entry,load);
    },
    set(key,value){if(!entries.has(key)&&entries.size>=max)entries.delete(entries.keys().next().value);entries.set(key,{ready:true,value,at:now(),pending:null});},
    invalidate(key){entries.delete(key);},clear(){entries.clear();},
  };
}

export function selectChatMessages(messages, limit) {
  const size=Math.max(1,Math.min(100,Number(limit)||50));
  const result=messages.slice(-size);
  const latest=messages.filter(message=>message.releaseVersion).reduce((a,b)=>!a||Date.parse(b.created_at)>Date.parse(a.created_at)?b:a,null);
  if(latest&&!result.some(message=>message.id===latest.id)){if(result.length>=size)result.shift();result.unshift(latest);}
  return result;
}
