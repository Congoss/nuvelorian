import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('src/components/game/WeaponEnhancementEffect.jsx','utf8');
const start=source.indexOf('  const frame=stamp=>{'),end=source.indexOf('  const sync=',start);
for(const hz of [60,120,144])test('weapon animation keeps 24 FPS and real animation time on '+hz+' Hz display',()=>{
 let calls=0;
 const context=vm.createContext({canAnimate:()=>true,paint:()=>calls++,requestAnimationFrame:()=>1});
 vm.runInContext('let raf=0,last=0,lastPaint=0,time=0;const frameRate=24;'+source.slice(start,end)+'globalThis.tick=frame;globalThis.elapsed=()=>time;',context);
 for(let i=1;i<=hz*10;i++)context.tick(i*1000/hz);
 assert.ok(calls>=238&&calls<=242, 'actual frames: '+calls);
 assert.ok(Math.abs(context.elapsed()-10)<.1,'actual elapsed: '+context.elapsed());
});
