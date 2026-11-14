const requests = [];
export function recordPerformanceRequest(duration, status) {
  requests.push({duration, status});
  if (requests.length > 200) requests.shift();
}
export function summarizePerformanceRequests() {
  const batch = requests.splice(0), values = batch.map(x=>x.duration).sort((a,b)=>a-b);
  return {request_count:values.length,request_p95_ms:values[Math.floor(values.length*.95)] || 0,request_max_ms:values.at(-1) || 0,request_errors:batch.filter(x=>x.status>=400 || !x.status).length};
}

// Three seconds of frame sampling per minute; no continuous frame observer.
export function installPerformanceDiagnostics({ scope = globalThis, report, now = () => Date.now() }) {
  const Observer = scope.PerformanceObserver;
  let disposed = false, frameId, sampling = false;
  const visibility = () => { if (scope.document?.hidden) { scope.cancelAnimationFrame?.(frameId); sampling = false; } };
  scope.document?.addEventListener?.('visibilitychange', visibility);
  const timer = scope.setInterval?.(() => {
    if (disposed || scope.document?.hidden || sampling) return;
    const details = {...summarizePerformanceRequests(),dom_nodes:scope.document?.getElementsByTagName('*').length || 0};
    if (!scope.requestAnimationFrame) return;
    sampling = true;
    let start, last;
    const frames = [];
    const frame = time => {
      if (disposed || scope.document?.hidden) { sampling = false; return; }
      start ??= time;
      if (last != null) frames.push(time-last);
      last = time;
      if (time-start < 3000) { frameId = scope.requestAnimationFrame(frame); return; }
      frames.sort((a,b)=>a-b);
      report('PERFORMANCE_SAMPLE','Visible frame sample (3s)',scope.location?.pathname || '',{
        ...details,sample_fps:frames.length*1000/Math.max(1,time-start),
        frame_p95_ms:frames[Math.floor(frames.length*.95)] || 0,
        long_frames:frames.filter(x=>x>50).length,
      });
      sampling = false;
    };
    frameId = scope.requestAnimationFrame(frame);
  },60000);
  const cleanup = () => { disposed = true; scope.clearInterval?.(timer); scope.cancelAnimationFrame?.(frameId); scope.document?.removeEventListener?.('visibilitychange', visibility); };
  if (!Observer?.supportedEntryTypes?.includes('longtask')) return cleanup;
  let started = now(), blocked = 0, count = 0, lastReport = started;
  const observer = new Observer(list => {
    if (scope.document?.hidden) { started = now(); blocked = 0; count = 0; return; }
    const current = now();
    if (current - started > 10000) { started = current; blocked = 0; count = 0; }
    for (const entry of list.getEntries()) {
      if (entry.duration < 100) continue;
      blocked += entry.duration; count++;
    }
    if (blocked < 1500 || count < 3 || current - lastReport < 60000) return;
    lastReport = current;
    report('UI_STALL', `Main thread blocked ${Math.round(blocked)}ms across ${count} tasks in 10s`, scope.location?.pathname || '',{blocked_ms:blocked,long_tasks:count});
    blocked = 0; count = 0; started = current;
  });
  observer.observe({ type: 'longtask', buffered: false });
  return () => { cleanup(); observer.disconnect(); };
}
