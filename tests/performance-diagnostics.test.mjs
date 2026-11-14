import test from 'node:test';
import assert from 'node:assert/strict';
import { installPerformanceDiagnostics,recordPerformanceRequest,summarizePerformanceRequests } from '../src/lib/performanceDiagnostics.js';

function fixture() {
  let clock = 0, callback, disconnected = false;
  const reports = [];
  class Observer {
    static supportedEntryTypes = ['longtask'];
    constructor(cb) { callback = cb; }
    observe(options) { assert.deepEqual(options, {type:'longtask',buffered:false}); }
    disconnect() { disconnected = true; }
  }
  const scope = {PerformanceObserver:Observer,document:{hidden:false},location:{pathname:'/game'}};
  const stop = installPerformanceDiagnostics({scope,now:()=>clock,report:(...args)=>reports.push(args)});
  return {scope,reports,stop,get disconnected(){return disconnected;},emit(time,durations){clock=time;callback({getEntries:()=>durations.map(duration=>({duration}))});}};
}

test('reports sustained UI stalls at most once per minute, excluding startup',()=>{
  const f=fixture();
  f.emit(500,[600,600,600]); assert.equal(f.reports.length,0);
  f.emit(61000,[600,600,600]); assert.equal(f.reports.length,1);
  assert.equal(f.reports[0][0],'UI_STALL'); assert.equal(f.reports[0][2],'/game');
  f.emit(62000,[900,900,900]); assert.equal(f.reports.length,1);
  f.emit(122000,[600,600,600]); assert.equal(f.reports.length,2);
  f.stop(); assert.equal(f.disconnected,true);
});

test('does not report background tasks, isolated stalls, or short tasks',()=>{
  const f=fixture(); f.scope.document.hidden=true;
  f.emit(61000,[1000,1000,1000]); assert.equal(f.reports.length,0);
  f.scope.document.hidden=false;
  f.emit(62000,[1600]); assert.equal(f.reports.length,0);
  f.emit(73000,Array(40).fill(60)); assert.equal(f.reports.length,0);
  f.emit(74000,[600,600,600]); assert.equal(f.reports.length,1);
});

test('unsupported browsers need no observer',()=>{
  assert.doesNotThrow(()=>installPerformanceDiagnostics({scope:{},report:()=>{throw Error('unexpected');}})());
});

test('request samples are bounded and reset between reporting windows',()=>{
  for(let i=0;i<250;i++)recordPerformanceRequest(i,i===249?500:200);
  const summary=summarizePerformanceRequests();
  assert.equal(summary.request_count,200);assert.equal(summary.request_max_ms,249);
  assert.equal(summary.request_errors,1);assert.equal(summary.request_p95_ms,240);
  assert.equal(summarizePerformanceRequests().request_count,0);
});

test('frame sampling reports and stops instead of running continuously',()=>{
  let tick,callback,cancelled=false;
  const reports=[];
  const scope={document:{hidden:false,getElementsByTagName:()=>[1,2]},location:{pathname:'/'},setInterval:cb=>{tick=cb;return 1;},clearInterval:()=>{},requestAnimationFrame:cb=>{callback=cb;return 2;},cancelAnimationFrame:()=>{cancelled=true;}};
  const stop=installPerformanceDiagnostics({scope,report:(...args)=>reports.push(args)});
  tick();
  for(let i=0;i<=180 && callback;i++){const next=callback;callback=null;next(i*17);}
  assert.equal(reports.length,1);assert.equal(reports[0][0],'PERFORMANCE_SAMPLE');
  assert.equal(reports[0][3].dom_nodes,2);
  assert(reports[0][3].sample_fps>58);
  stop();assert(cancelled);
});
