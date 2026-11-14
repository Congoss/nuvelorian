import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { transform } from 'esbuild';

test('compiled clan donation generates an ID before sending and preserves explicit retry IDs', async () => {
 const source = await readFile(new URL('../src/services/gameApi/remoteGameApi.js', import.meta.url), 'utf8');
 const method = source.match(/  async donateToClan\([\s\S]*?\n  },/)[0].trim().replace(/,$/, '');
 const { code } = await transform('globalThis.api = {' + method + '};', { target: 'es2015', minify: true });
 const requests = [];
 const crypto = { randomUUID() { assert.equal(this, crypto); return 'generated-donation-id'; } };
 const context = { crypto, remoteRequest: async (path, options) => { requests.push({ path, options }); return { counted: options.body.amount }; } };
 runInNewContext(code, context);
 const result = await context.api.donateToClan('clan/id', 1000000);
 assert.equal(result.counted, 1000000);
 assert.equal(requests[0].path, '/clans/clan%2Fid/donations');
 assert.equal(requests[0].options.body.actionId, 'generated-donation-id');
 await context.api.donateToClan('clan/id', 100, 'retry-id');
 assert.equal(requests[1].options.body.actionId, 'retry-id');
 context.crypto = undefined;
 await context.api.donateToClan('clan/id', 100);
 assert.ok(requests[2].options.body.actionId);
});
