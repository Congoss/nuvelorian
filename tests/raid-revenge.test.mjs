import test from 'node:test';
import assert from 'node:assert/strict';
import {findAvailableRevenge} from '../server/utils/raidRevenge.js';
test('revenge requires a recent real incoming raid and cannot be reused',()=>{
  const now=Date.now(),player={created_by:'a'},target={created_by:'b'};
  const log={attacker_email:'b',defender_email:'a',success:true,created_date:new Date(now-1000).toISOString()};
  assert.equal(findAvailableRevenge([],player,target,true,now),null);
  assert.equal(findAvailableRevenge([log],player,target,'true',now),null);
  assert.equal(findAvailableRevenge([log],player,{created_by:'c'},true,now),null);
  assert.equal(findAvailableRevenge([log],player,target,true,now),log);
  assert.equal(findAvailableRevenge([log],player,target,true,now+86400000),null);
  log.revenge_used_at=new Date(now).toISOString();
  assert.equal(findAvailableRevenge([log],player,target,true,now),null);
});
