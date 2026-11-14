const capacity = 2048;
const windows = new Map();

export function recordCombatLatency(method, path, status, duration) {
  if (method !== 'POST') return;
  const scope = /^\/(?:api\/)?boss-fights\/[^/]+\/attack$/.test(path) ? 'personal'
    : /^\/(?:api\/)?clans\/[^/]+\/ship\/attack$/.test(path) ? 'ship'
    : /^\/(?:api\/)?raid-boss\/attack$/.test(path) ? 'raid' : null;
  if (!scope) return;
  let window = windows.get(scope);
  if (!window) windows.set(scope, window = { cursor: 0, samples: [] });
  window.samples[window.cursor] = { status, duration, time: Date.now() };
  window.cursor = (window.cursor + 1) % capacity;
}

export function summarizeCombatLatency(now = Date.now()) {
  return Object.fromEntries([...windows].map(([scope, { samples }]) => {
    const recent = samples.filter(sample => now - sample.time <= 300000);
    const confirmed = recent.filter(sample => sample.status >= 200 && sample.status < 300)
      .map(sample => sample.duration).sort((a, b) => a - b);
    const percentile = p => confirmed.length ? confirmed[Math.ceil(p * confirmed.length) - 1] : null;
    return [scope, { attempts: recent.length, confirmed: confirmed.length, p50_ms: percentile(0.5), p95_ms: percentile(0.95), max_ms: confirmed.at(-1) ?? null }];
  }));
}
