import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']) process.env[key] = '';

const { recordDiagnosticEvent, listDiagnosticEvents } = await import('../server/data/diagnostics.js');
await recordDiagnosticEvent({
  source: 'client',
  path: '/api/players/player-123?token=private',
  code: 'JS_ERROR',
  message: 'token=short password=private test@example.com https://example.com/?secret=private',
});
const [first] = await listDiagnosticEvents();
assert.equal(first.path, '/api/players/:id');
assert.equal(first.code, 'JS_ERROR');
assert.doesNotMatch(JSON.stringify(first), /private|test@example\.com/);

const { createApp } = await import('../server/app.js');
const app = createApp();
await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${app.address().port}`;
try {
  const denied = await fetch(`${base}/api/admin/diagnostics`);
  assert.equal(denied.status, 401);

  const unauthenticated = await fetch(`${base}/api/diagnostics/client`, { method: 'POST', body: '{}' });
  assert.equal(unauthenticated.status, 401);

  const recorded = await fetch(`${base}/api/diagnostics/client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-User-Id': '100001' },
    body: JSON.stringify({ kind: 'NETWORK_ERROR', path: '/api/boss-fights/123456789/attack', message: 'Fetch failed' }),
  });
  assert.equal(recorded.status, 204);

  const allowed = await fetch(`${base}/api/admin/diagnostics`, { headers: { 'X-Admin-Token': 'dev-admin' } });
  assert.equal(allowed.status, 200);
  const payload = await allowed.json();
  assert.equal(payload.data[0].code, 'NETWORK_ERROR');
  assert.equal(payload.data[0].path, '/api/boss-fights/:id/attack');
  console.log('Diagnostic journal checks passed');
} finally {
  await new Promise((resolve) => app.close(resolve));
}
