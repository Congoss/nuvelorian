import test from 'node:test';
import assert from 'node:assert/strict';
import { soldierPoint,drawSoldierFrame } from '../src/lib/soldierMesh.js';
test('mobile mesh reduces draw work and static frames draw only the original',()=>{
 let draws=0;const ctx=new Proxy({drawImage(){draws++;}},{get:(obj,key)=>obj[key]||(()=>{})});
 drawSoldierFrame(ctx,{},240,480,1,.2,{lowDetail:true});const mobile=draws;
 draws=0;drawSoldierFrame(ctx,{},240,480,1,.2);assert(mobile<draws/2);
 draws=0;drawSoldierFrame(ctx,{},240,480,0,0);assert.equal(draws,1);
});
test('boots remain anchored through breathing and hit response',()=>{
 for(let time=0;time<20;time+=.25)for(const x of [.2,.5,.8])assert.deepEqual(soldierPoint(x,.98,time,.8),{x,y:.98});
});
test('deformation preserves triangle orientation and stays subtle',()=>{
 for(let time=0;time<12;time+=.5)for(let y=0;y<24;y++)for(let x=0;x<10;x++){
  const a=soldierPoint(x/10,y/24,time,1),b=soldierPoint((x+1)/10,y/24,time,1),c=soldierPoint(x/10,(y+1)/24,time,1);
  assert.ok((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0);
  assert.ok(Math.abs(a.x-x/10)<.035);
 }
});
