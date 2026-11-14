import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverKarma } from '../server/utils/karmaRecovery.js';
test('recovery preserves totals, counts retained records and remains idempotent', () => {
  const target = { id: 'target', likes_received_count: 7, puddle_senders: [{sender_id:'a'}], like_box:{contributions:[{sender_id:'a'}]} };
  const a = { id:'a', social_reaction_log:[{target_id:'target',type:'like',created_at:'1'},{target_id:'target',type:'dislike',created_at:'2'}] };
  const b = { id:'b', social_reaction_log:[{target_id:'target',type:'dislike',created_at:'3'}] };
  assert.equal(recoverKarma([target,a,b]),true);
  assert.equal(target.likes_received_count,7);
  assert.equal(target.dislikes_received_count,2);
  assert.equal(recoverKarma([target,a,b]),false);
  assert.equal(target.dislikes_received_count,2);
  target.puddle_senders=[]; target.like_box.contributions=[];
  recoverKarma([target,a,b]);
  assert.equal(target.likes_received_count,7);
  assert.equal(target.dislikes_received_count,2);
});
