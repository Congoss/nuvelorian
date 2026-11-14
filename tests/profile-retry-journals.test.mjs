import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayerProgression } from '../server/utils/progression.js';
import { buildBootstrapPayload } from '../server/utils/bootstrap.js';
import { playerDb } from '../server/data/player-db.js';

test('client profiles and bootstrap omit retry bodies while authoritative storage retains them', () => {
 const journals={combat_receipts:[{id:'one',response:{body:'x'.repeat(100000)}}],combat_retired_requests:['old'],combat_request_floor:12,forge_receipts:[{id:'forge'}]};
 const player={id:'journals',level:1,xp:0,...journals};
 for(const view of [normalizePlayerProgression(player),buildBootstrapPayload(player).bootstrap.player]){
  for(const key of Object.keys(journals))assert.equal(Object.hasOwn(view,key),false);
  assert.ok(JSON.stringify(view).length<100000);
 }
 const stored=playerDb.toDbPlayerRecord(player).data;
 for(const [key,value] of Object.entries(journals))assert.deepEqual(stored[key],value);
});
