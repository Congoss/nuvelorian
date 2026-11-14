import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/lib/platform/telegram.js'],bundle:true,write:false,format:'cjs',platform:'node',alias:{'@':'./src'},define:{'import.meta.env':'{}'}});
for(const [width,height] of [[320,568],[360,640],[393,852],[412,915],[480,960]])test(`Telegram safe insets and fullscreen updates at ${width}x${height}`,()=>{
 const values=new Map(),events=new Map();
 const app={platform:'android',isFullscreen:true,viewportHeight:height,viewportStableHeight:height,safeAreaInset:{top:24,bottom:16},contentSafeAreaInset:{top:56,bottom:0},ready(){},expand(){},isVersionAtLeast(){return true;},requestFullscreen(){},onEvent(name,handler){events.set(name,handler);}};
 const context={module:{exports:{}},exports:{},console:{info(){},warn(){}},document:{documentElement:{style:{setProperty:(key,value)=>values.set(key,value)}}},window:{Telegram:{WebApp:app},innerHeight:height,innerWidth:width,location:{hostname:'localhost',origin:'http://localhost'},addEventListener(){},getComputedStyle(){return {getPropertyValue:key=>values.get(key)||''};}}};
 vm.runInNewContext(result.outputFiles[0].text,context);context.module.exports.initializeTelegramMiniApp();
 assert.equal(values.get('--tg-safe-area-inset-top'),'24px');assert.equal(values.get('--tg-content-safe-area-inset-top'),'56px');assert.equal(values.get('--app-telegram-controls-top'),'calc(48px + var(--tg-safe-area-inset-top, 0px))');
 app.contentSafeAreaInset.top=1;events.get('contentSafeAreaChanged')();assert.equal(values.get('--app-telegram-controls-top'),'calc(48px + var(--tg-safe-area-inset-top, 0px))');
 app.contentSafeAreaInset.top=72;events.get('contentSafeAreaChanged')();assert.equal(values.get('--tg-content-safe-area-inset-top'),'72px');
 app.isFullscreen=false;app.contentSafeAreaInset.top=0;events.get('fullscreenChanged')();assert.ok(events.has('activated'));assert.equal(values.get('--tg-content-safe-area-inset-top'),'0px');
});
