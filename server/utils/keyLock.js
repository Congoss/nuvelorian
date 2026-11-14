// FIFO locks shared by HTTP mutations and durable player writes.
const locks = new Map();
export async function acquireKeyLock(key) {
 const previous = locks.get(key) || Promise.resolve();
 let release;
 const current = new Promise(resolve => { release = resolve; });
 locks.set(key, current);
 await previous;
 let done = false;
 return () => { if (done) return; done = true; release(); if (locks.get(key) === current) locks.delete(key); };
}
export async function withKeyLock(key, action) {
 const release = await acquireKeyLock(key);
 try { return await action(); } finally { release(); }
}

export const isKeyLocked = key => locks.has(key);
export async function withKeyLocks(keys,action){
 const releases=[];try{for(const key of [...new Set(keys)].sort())releases.push(await acquireKeyLock(key));return await action();}finally{for(const release of releases.reverse())release();}
}
