import test from 'node:test';
import assert from 'node:assert/strict';
import {chargeEnvelope,weaponDischarges} from '../src/lib/weaponChargeEffects.js';
test('maximum tier has near-continuous smoothly fading discharges; +12 stays rare',()=>{
 assert.equal(chargeEnvelope(.4,10).alpha,0);
 assert.equal(chargeEnvelope(.3,12).charge,0);
 assert(chargeEnvelope(.425,15).alpha>.99);
 assert.equal(chargeEnvelope(3,15).cycle,3);
 assert.equal(chargeEnvelope(3,12).cycle,0);
 let active=0;for(let i=0;i<1000;i++)if(chargeEnvelope(i*.0085,15).alpha>.05)active++;
 assert(active>850,'+15 should discharge through most of its cycle');
 assert.equal(chargeEnvelope(2,12).alpha,0);
});
test('electrical branches originate at the real contour and are stable during a burst',()=>{
 const edge=[{x:20,y:100,nx:1,ny:0},{x:40,y:150,nx:-1,ny:0}],axis={x:0,y:-1};
 const paths=weaponDischarges(edge,axis,2,3);
 assert.equal(paths.length,3);assert.deepEqual(paths,weaponDischarges(edge,axis,2,3));
 for(const path of paths){assert.equal(path.points.length,17);assert.equal(path.branch.length,9);assert(path.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
 assert.deepEqual(weaponDischarges([],axis,1,3),[]);
});
