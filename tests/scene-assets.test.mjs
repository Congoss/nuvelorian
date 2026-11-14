import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {warmSceneImage,warmFirstFrameImages,isSceneImageReady,SHIP_SCENE_ASSETS} from '../src/lib/sceneAssets.js';

test('first-frame warmup skips inline art and limits concurrent image requests',async()=>{
 const original=globalThis.Image;
 const requests=[];
 globalThis.Image=class {set src(url){requests.push({url,finish:()=>this.onload()});}decode(){return Promise.resolve();}};
 try {
  const task=warmFirstFrameImages(['/first.webp','/second.webp','/first.webp','data:image/webp;base64,AA','/third.webp']);
  assert.deepEqual(requests.map(row=>row.url),['/first.webp','/second.webp']);
  requests[0].finish();requests[1].finish();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests[2].url,'/third.webp');
  requests[2].finish();await task;
 } finally {globalThis.Image=original;}
});
test('scene warmup shares pending requests and waits for decoded pixels',async()=>{
 const original=globalThis.Image;let created=0,decode;
 globalThis.Image=class {constructor(){created++;}set src(value){queueMicrotask(()=>this.onload());}decode(){return new Promise(resolve=>{decode=resolve;});}};
 try{let done=false;const a=warmSceneImage('/test-dedup.webp');const b=warmSceneImage('/test-dedup.webp');assert.equal(a,b);a.then(()=>{done=true;});await new Promise(resolve=>setImmediate(resolve));assert.equal(done,false);assert.equal(created,1);decode();await a;assert.equal(done,true);}finally{globalThis.Image=original;}
});
test('failed warmup can retry rather than poisoning the scene cache',async()=>{
 const original=globalThis.Image;let fail=true;
 globalThis.Image=class {set src(value){queueMicrotask(()=>fail?this.onerror():this.onload());}decode(){return Promise.resolve();}};
 try{await assert.rejects(warmSceneImage('/test-retry.webp'));fail=false;await warmSceneImage('/test-retry.webp');}finally{globalThis.Image=original;}
});
test('ship scene warmup references actual production image assets',async()=>{for(const assets of Object.values(SHIP_SCENE_ASSETS))for(const url of assets)await fs.access('public'+url);});

test('decoded cache reuses warm images and evicts oldest pixels within its memory budget', async () => {
 const original = globalThis.Image;
 let created = 0;
 globalThis.Image = class {
  naturalWidth = 2048;
  naturalHeight = 2048;
  constructor() { created++; }
  set src(value) { queueMicrotask(() => this.onload()); }
  decode() { return Promise.resolve(); }
 };
 try {
  await warmSceneImage('/cache-budget-a.webp');
  await warmSceneImage('/cache-budget-b.webp');
  assert.equal(isSceneImageReady('/cache-budget-a.webp'), true);
  await warmSceneImage('/cache-budget-c.webp');
  assert.equal(isSceneImageReady('/cache-budget-b.webp'), false);
  assert.equal(isSceneImageReady('/cache-budget-a.webp'), true);
  await warmSceneImage('/cache-budget-a.webp');
  assert.equal(created, 3);
  await warmSceneImage('/cache-budget-b.webp');
  assert.equal(created, 4);
 } finally { globalThis.Image = original; }
});

test('decode failure is retried and never marked as a ready first frame', async () => {
 const original = globalThis.Image;
 let fail = true;
 globalThis.Image = class {
  naturalWidth = 10;
  naturalHeight = 10;
  set src(value) { queueMicrotask(() => this.onload()); }
  decode() { return fail ? Promise.reject(new Error('decode failed')) : Promise.resolve(); }
 };
 try {
  await warmSceneImage('/decode-retry.webp');
  assert.equal(isSceneImageReady('/decode-retry.webp'), false);
  fail = false;
  await warmSceneImage('/decode-retry.webp');
  assert.equal(isSceneImageReady('/decode-retry.webp'), true);
 } finally { globalThis.Image = original; }
});
