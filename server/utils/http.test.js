import test from 'node:test';
import assert from 'node:assert/strict';
import { sendData } from './http.js';

test('player API responses never expose stored X OAuth tokens', () => {
  const response = { writeHead() {}, end(text) { this.body = text; } };
  sendData(response, 200, { player: { id: '1', x_oauth: { access_token: 'secret' }, partner_claims: { p: 'now' } } });
  assert.deepEqual(JSON.parse(response.body), { data: { player: { id: '1', partner_claims: { p: 'now' } } } });
});
