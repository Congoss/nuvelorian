import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { createStaticHandler } from './staticDelivery.js';

test('static delivery: video ranges, MIME, compression, caching and missing assets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'p4-static-'));
  await mkdir(join(root, 'assets'));
  const code = 'console.log("test");'.repeat(100);
  await Promise.all([
    writeFile(join(root, 'index.html'), '<h1>Game</h1>'),
    writeFile(join(root, 'assets', 'scene.mp4'), Buffer.from('0123456789')),
    writeFile(join(root, 'assets', 'code.js'), code),
    writeFile(join(root, 'assets', 'code.js.gz'), gzipSync(code)),
    writeFile(join(root, 'assets', 'code.js.br'), brotliCompressSync(code)),
  ]);
  const serve = createStaticHandler(root);
  const server = http.createServer((request, response) => serve(request.url, response, request));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let result = await fetch(base + '/assets/scene.mp4', { headers: { Range: 'bytes=2-5' } });
    assert.equal(result.status, 206);
    assert.equal(result.headers.get('content-type'), 'video/mp4');
    assert.equal(result.headers.get('content-range'), 'bytes 2-5/10');
    assert.equal(await result.text(), '2345');
    result = await fetch(base + '/assets/scene.mp4', { headers: { Range: 'bytes=-3' } });
    assert.equal(await result.text(), '789');
    result = await fetch(base + '/assets/scene.mp4', { headers: { Range: 'bytes=99-' } });
    assert.equal(result.status, 416);
    result = await fetch(base + '/assets/scene.mp4', { method: 'HEAD' });
    assert.equal(result.headers.get('content-length'), '10');
    assert.equal(await result.text(), '');
    const etag = result.headers.get('etag');
    result = await fetch(base + '/assets/scene.mp4', { headers: { 'If-None-Match': etag } });
    assert.equal(result.status, 304);
    for (const encoding of ['br', 'gzip', 'identity', 'br;q=0,gzip;q=0']) {
      result = await fetch(base + '/assets/code.js', { headers: { 'Accept-Encoding': encoding } });
      assert.equal(await result.text(), code);
      assert.equal(result.headers.get('content-encoding'), ['br', 'gzip'].includes(encoding) ? encoding : null);
    }
    result = await fetch(base + '/assets/missing.webp');
    assert.equal(result.status, 404);
    result = await fetch(base + '/skills/missing.webp');
    assert.equal(result.status, 404);
    result = await fetch(base + '/game');
    assert.equal(await result.text(), '<h1>Game</h1>');
    result = await fetch(base + '/assets/%2e%2e/%2e%2e/private.txt');
    assert.equal(result.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
