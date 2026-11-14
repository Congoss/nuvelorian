export function createAvatarFailures({ttl=300000,max=128,now=Date.now}={}) {
  const failed=new Map();
  return {
    has(src){const until=failed.get(src);if(!until)return false;if(until<=now()){failed.delete(src);return false;}return true;},
    remember(src){if(typeof src!=='string'||src.length>2048||!/^https?:\/\//i.test(src))return;
      if(!failed.has(src)&&failed.size>=max)failed.delete(failed.keys().next().value);
      failed.set(src,now()+ttl);
    },
  };
}
