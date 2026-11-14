import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { createApp } = await import('../server/app.js');

test('analytics batch completes without loading or persisting game state', async () => {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/apps/test/analytics/track/batch`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '[]',
    });
    assert.equal(response.status, 204);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
