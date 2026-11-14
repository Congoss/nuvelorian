const reads = new Map();
export async function rateLimitedFetch(url, options = {}) {
  const method = options.method || 'GET';
  const safe = method === 'GET' || String(url).endsWith('/players/bootstrap');
  // Combat writes are sent immediately and exactly once; no hidden retry wait.
  if (!safe) return fetch(url, options);
  const key = `${method}:${url}`;
  if (safe && reads.has(key)) return (await reads.get(key)).clone();
  const pending = (async () => {
    for (let attempt = 0; ; attempt += 1) {
      const response = await fetch(url, options);
      if (response.status !== 429 || attempt >= 2) return response;
      const header = response.headers.get('retry-after');
      const seconds = Number(header);
      const delay = header && Number.isFinite(seconds) ? seconds * 1000 : 60000;
      // Surface long cooldowns instead of holding all deduplicated reads for minutes.
      if (delay > 2000) return response;
      await new Promise(resolve => setTimeout(resolve, Math.max(1000, Math.min(120000, delay)) + 250));
    }
  })();
  if (safe) reads.set(key, pending);
  try { return (await pending).clone(); }
  finally { if (safe) reads.delete(key); }
}
