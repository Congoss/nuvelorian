import test from 'node:test';
import assert from 'node:assert/strict';
import {observeAutoplayVideos} from '../src/lib/videoVisibility.js';
function fixture(){
 let entries,mutation,covered=false;const listeners=new Map();
 const video={paused:false,isConnected:true,plays:0,pauses:0,closest:selector=>selector.includes('scene-covered')&&covered?{}:null,pause(){this.paused=true;this.pauses++;},play(){this.paused=false;this.plays++;return Promise.resolve();}};
 const document={hidden:false,documentElement:{},querySelectorAll:()=>video.isConnected?[video]:[],addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
 const scope={document,IntersectionObserver:class{constructor(cb){entries=cb;}observe(){}unobserve(){}disconnect(){}},MutationObserver:class{constructor(cb){mutation=cb;}observe(){}disconnect(){}}};
 return{video,scope,listeners,intersect:value=>entries([{target:video,isIntersecting:value}]),cover:value=>{covered=value;mutation([{type:'attributes'}]);}};
}
test('offscreen, covered and background videos pause; visible videos resume',()=>{
 const f=fixture(),stop=observeAutoplayVideos(f.scope);
 assert(f.video.paused);f.intersect(true);assert(!f.video.paused);
 f.cover(true);assert(f.video.paused);f.cover(false);assert(!f.video.paused);
 f.scope.document.hidden=true;f.listeners.get('visibilitychange')();assert(f.video.paused);
 f.scope.document.hidden=false;f.listeners.get('visibilitychange')();assert(!f.video.paused);
 f.intersect(false);assert(f.video.paused);stop();assert.equal(f.listeners.size,0);
});
test('disabled animations never restart autoplay video',()=>{
 const f=fixture(),stop=observeAutoplayVideos(f.scope,{enabled:false});
 f.intersect(true);assert(f.video.paused);assert.equal(f.video.plays,0);stop();
});
