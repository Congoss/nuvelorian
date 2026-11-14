import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

test('Cleopatra suspends hidden and departed scenes and resumes without a time jump',()=>{
 const listeners=new Map(),queue=new Map();let id=0,mutation;
 const on=(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list);};
 const emit=name=>(listeners.get(name)||[]).forEach(fn=>fn());
 const document={hidden:false,addEventListener:on};
 const window={addEventListener:on};
 const context={window,document,MutationObserver:class{constructor(fn){mutation=fn;}observe(){}},requestAnimationFrame:fn=>{queue.set(++id,fn);return id;},cancelAnimationFrame:key=>queue.delete(key)};
 const source=fs.readFileSync('public/boss7-scene/bridge.js','utf8').split('const cleopatraLayers=')[0];
 vm.runInNewContext(source,context);
 const canvas={isConnected:true,hidden:false},frames=[];
 window.cleopatraRenderLoop(canvas,(now,resumed)=>frames.push([now,resumed]));
 const tick=now=>{const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(now));};
 tick(10);tick(26);assert.equal(frames.length,2);assert.equal(frames[1][1],false);
 document.hidden=true;emit('visibilitychange');assert.equal(queue.size,0);tick(50);assert.equal(frames.length,2);
 document.hidden=false;emit('visibilitychange');tick(1000);assert.deepEqual(frames.at(-1),[1000,true]);
 canvas.hidden=true;mutation();assert.equal(queue.size,0);
 canvas.hidden=false;mutation();tick(1016);assert.equal(frames.length,4);
 emit('pagehide');assert.equal(queue.size,0);emit('pageshow');tick(2000);assert.equal(frames.length,5);
 canvas.isConnected=false;tick(2016);assert.equal(queue.size,0);assert.equal(frames.length,5);
});
