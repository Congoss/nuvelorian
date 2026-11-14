import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { createApp } = await import('../server/app.js');
const { playerDb } = await import('../server/data/player-db.js');

test('web shell and missing assets bypass database initialization', async () => {
  const originalInit = playerDb.init;
  let calls = 0;
  playerDb.init = async () => { calls += 1; throw new Error('Database unavailable'); };
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const shell = await fetch(`${origin}/web`);
    assert.equal(shell.status, 200);
    assert.match(await shell.text(), /<html/);
    const missing = await fetch(`${origin}/assets/missing-fast-path-test.js`);
    assert.equal(missing.status, 404);
    assert.equal(calls, 0);
  } finally {
    playerDb.init = originalInit;
    await new Promise(resolve => server.close(resolve));
  }
});
