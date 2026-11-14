// Replay only the accepted request ID: the server receipt prevents duplicate spend.
export async function recoverShipAttack(send, body, {signal, onRetry=()=>{}, wait=retryWait, maxRetries=Infinity}={}) {
  let attempt=0;
  while(true){
    if(signal?.aborted)throw Object.assign(new Error('Recovery stopped'),{name:'AbortError'});
    try{return await send(body);}
    catch(error){
      if(signal?.aborted)throw Object.assign(new Error('Recovery stopped'),{name:'AbortError'});
      const status=Number(error?.status || error?.statusCode || 0);
      if(status>=400 && status<500 && status!==408 && status!==429)throw error;
      if(attempt>=maxRetries)throw error;
      onRetry(error);
      await wait(Math.min(15000,500*2**Math.min(attempt++,5)),signal);
    }
  }
}
function retryWait(ms,signal){
  return new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);globalThis.removeEventListener?.('online',finish);};
    const finish=()=>{cleanup();resolve();};
    const stop=()=>{cleanup();reject(Object.assign(new Error('Recovery stopped'),{name:'AbortError'}));};
    const timer=setTimeout(finish,ms);
    signal?.addEventListener('abort',stop,{once:true});
    globalThis.addEventListener?.('online',finish,{once:true});
    if(signal?.aborted)stop();
  });
}
