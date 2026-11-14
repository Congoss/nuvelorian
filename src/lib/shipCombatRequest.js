// A timed-out attack may already be committed. Callers retain its request ID for retry.
export async function withShipRequestTimeout(action,{timeoutMs=15000}={}){
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
  const error=Object.assign(new Error('SHIP_REQUEST_TIMEOUT'),{code:'SHIP_REQUEST_TIMEOUT'});
  reject(error);controller.abort();
 },timeoutMs);});
 try{return await Promise.race([Promise.resolve().then(()=>action(controller.signal)),deadline]);}
 finally{clearTimeout(timer);}
}
