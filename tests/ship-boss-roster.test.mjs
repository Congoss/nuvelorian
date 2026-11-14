import test from 'node:test';import assert from 'node:assert/strict';
import {getShipBossRoster} from '../src/lib/clanShipSectorState.js';
import {SHIP_MODULES} from '../src/lib/clanShipPreview.js';
test('boss roster previews the first unfinished sector alongside all built sectors',()=>{
 const [first,second,third]=SHIP_MODULES;
 assert.deepEqual(getShipBossRoster(SHIP_MODULES,{}).map(m=>m.id),[first.id]);
 assert.deepEqual(getShipBossRoster(SHIP_MODULES,{[first.id]:first.cost,[second.id]:1}).map(m=>m.id),[first.id,second.id]);
 assert.deepEqual(getShipBossRoster(SHIP_MODULES,{[first.id]:first.cost,[second.id]:second.cost}).map(m=>m.id),[first.id,second.id,third.id]);
 assert.equal(getShipBossRoster(SHIP_MODULES,Object.fromEntries(SHIP_MODULES.map(m=>[m.id,m.cost]))).length,14);
});
