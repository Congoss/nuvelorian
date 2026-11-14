import test from 'node:test';
import assert from 'node:assert/strict';
import { createWriteQueue } from '../server/utils/writeQueue.js';

test('waiting writes merge player scopes and preserve the next pass during a write', async () => {
  const calls = [];
  let finish;
  const enqueue = createWriteQueue(async ids => {
    calls.push(ids);
    if (calls.length === 1) await new Promise(resolve => { finish = resolve; });
  });
  const first = enqueue(['a']);
  assert.equal(enqueue(['b']), first);
  await Promise.resolve(); await Promise.resolve();
  const second = enqueue(['c']);
  assert.notEqual(second, first);
  assert.equal(enqueue(['d']), second);
  assert.deepEqual(calls, [['a', 'b']]);
  finish();
  await Promise.all([first, second]);
  assert.deepEqual(calls, [['a', 'b'], ['c', 'd']]);
});

test('an all-player request includes every scope and failures allow a later retry', async () => {
  let attempts = 0;
  const enqueue = createWriteQueue(async ids => {
    assert.equal(ids, null);
    if (++attempts === 1) throw new Error('offline');
    return 'saved';
  });
  const first = enqueue(['a']);
  enqueue();
  enqueue(['b']);
  await assert.rejects(first, /offline/);
  assert.equal(await enqueue(), 'saved');
});
