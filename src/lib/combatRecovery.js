// Recovery reads must not retain the attack lock indefinitely after a gateway
// error. Never replay a regular boss mutation: it has no idempotency receipt.
export async function settleCombatRecovery(tasks,{timeoutMs=5000}={}){
 let timer;
 try{return await Promise.race([
  Promise.allSettled(tasks.map(task=>Promise.resolve().then(task))),
  new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs);}),
 ]);}finally{clearTimeout(timer);}
}
