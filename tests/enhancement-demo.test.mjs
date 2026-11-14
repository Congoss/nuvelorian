import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createEnhancementDemo} from '../server/utils/enhancementDemo.js';
const owner='11111111-1111-1111-1111-111111111111';
let serial=0;const request=()=>`request-0000000000-${++serial}`;
function settings(demo,normal=0,level=70){return demo.act(owner,{action:'settings',requestId:request(),settings:{normal,improved:100,pct:1},level});}
test('guaranteed +1 is instance-specific, durable, idempotent and paid once',()=>{
 const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'enhance-')),'state.json');
 let rolls=0;const demo=createEnhancementDemo({file,rng:()=>{rolls++;return .9;}});const initial=demo.get(owner,'weapon'),[one,two]=initial.items;
 const body={action:'enhance',requestId:request(),instanceId:one.instanceId,version:0,gum:'premium'};
 const first=demo.act(owner,body);assert.equal(first.result.after,1);assert.equal(first.state.gums.premium,9998);assert.equal(first.state.items.find(i=>i.instanceId===two.instanceId).enhancementLevel,0);assert.equal(rolls,0);
 assert.equal(demo.act(owner,body).replayed,true);
 const restarted=createEnhancementDemo({file});assert.equal(restarted.act(owner,body).replayed,true);assert.equal(restarted.get(owner,'weapon').gums.premium,9998);
 assert.throws(()=>demo.act(owner,{...body,gum:'normal'}),/REQUEST_ID_REUSED/);
 assert.throws(()=>demo.act(owner,{...body,requestId:request()}),/STALE_ITEM/);
});
test('failure floors at zero, lowers intermediate levels and improved gum has no protection',()=>{
 const demo=createEnhancementDemo({rng:()=>.999});const item=demo.get(owner).items[0];settings(demo,0);
 let r=demo.act(owner,{action:'enhance',requestId:request(),instanceId:item.instanceId,version:0,gum:'normal'});assert.equal(r.result.after,0);assert.equal(r.state.gums.normal,9998);
 r=demo.act(owner,{action:'enhance',requestId:request(),instanceId:item.instanceId,version:1,gum:'premium'});assert.equal(r.result.after,1);
 demo.act(owner,{action:'settings',requestId:request(),settings:{normal:0,improved:0,pct:1},level:70});
 r=demo.act(owner,{action:'enhance',requestId:request(),instanceId:item.instanceId,version:2,gum:'improved'});assert.equal(r.result.after,0);
});
test('level chances, wrong owner and level lock are enforced',()=>{
 const demo=createEnhancementDemo();const item=demo.get(owner).items[0];
 const body={action:'enhance',requestId:request(),instanceId:item.instanceId,version:0,gum:'normal'};
 const first=demo.act(owner,body);assert.equal(first.result.chance,90);
 const other='22222222-2222-2222-2222-222222222222';demo.get(other);
 assert.throws(()=>demo.act(other,body),/ITEM_NOT_OWNED/);
 settings(demo,100,69);assert.throws(()=>demo.act(owner,{...body,requestId:request(),version:1,gum:'premium'}),/LEVEL_70_REQUIRED/);
 assert.equal(demo.get(owner).gums.premium,9999);
});
test('max +15 and concurrent stale requests are guarded',async()=>{
 const demo=createEnhancementDemo({rng:()=>0});const item=demo.get(owner).items[0];settings(demo,100);
 for(let i=0;i<15;i++)demo.act(owner,{action:'enhance',requestId:request(),instanceId:item.instanceId,version:i,gum:'normal'});
 assert.throws(()=>demo.act(owner,{action:'enhance',requestId:request(),instanceId:item.instanceId,version:15,gum:'premium'}),/MAX_ENHANCEMENT/);
 const second=demo.get(owner).items[1];
 const results=await Promise.allSettled(Array.from({length:8},()=>Promise.resolve().then(()=>demo.act(owner,{action:'enhance',requestId:request(),instanceId:second.instanceId,version:0,gum:'premium'}))));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
});
test('shop and boss claims replay without duplicating rewards',()=>{
 const demo=createEnhancementDemo({rng:()=>.01});demo.get(owner);
 const buy={action:'buy',requestId:request()};assert.equal(demo.act(owner,buy).state.stars,900);assert.equal(demo.act(owner,buy).state.gums.premium,10000);
 const boss={action:'boss',requestId:request()};assert.equal(demo.act(owner,boss).state.gums.normal,10000);assert.equal(demo.act(owner,boss).state.gums.normal,10000);
});
test('1, 5 and 15 packs use server prices and credit the selected quantity once',()=>{
 const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'gum-packs-')),'state.json');
 const seed=createEnhancementDemo({file});seed.get(owner);
 const fixture=JSON.parse(fs.readFileSync(file,'utf8'));fixture[owner].stars=3000;fs.writeFileSync(file,JSON.stringify(fixture));
 const demo=createEnhancementDemo({file});let stars=3000,gums=9999;
 for(const quantity of [1,5,15]){
  const body={action:'buy',quantity,cost:1,requestId:request()};
  const result=demo.act(owner,body);stars-=quantity*99;gums+=quantity;
  assert.equal(result.state.stars,stars);assert.equal(result.state.gums.premium,gums);
  assert.equal(result.result.quantity,quantity);assert.equal(result.result.cost,quantity*99);
  assert.equal(demo.act(owner,body).state.gums.premium,gums);
 }
 for(const quantity of [0,2,-1,100,'5',1.5])assert.throws(()=>demo.act(owner,{action:'buy',quantity,requestId:request()}),/INVALID_PACK/);
 assert.throws(()=>demo.act(owner,{action:'buy',quantity:15,requestId:request()}),/NOT_ENOUGH_STARS/);
 assert.equal(demo.get(owner).gums.premium,gums);
});
