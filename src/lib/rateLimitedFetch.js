const reads = new Map();
export async function rateLimitedFetch(url, options = {}) {
  const method = options.method || 'GET';
  const safe = method === 'GET' || String(url).endsWith('/players/bootstrap');
  if (!safe) return fetch(url, options);
  const key = `${method}:${url}`;
  if (reads.has(key)) return (await reads.get(key)).clone();
  const pending = (async () => {
    for (let attempt = 0; ; attempt += 1) {
      const response = await fetch(url, options);
      if (response.status !== 429 || attempt >= 2) return response;
      const header = response.headers.get('retry-after');
      const seconds = Number(header);
      const delay = header && Number.isFinite(seconds) ? seconds * 1000 : 60000;
      await new Promise(resolve => setTimeout(resolve, Math.max(1000, Math.min(120000, delay)) + 250));
    }
  })();
  reads.set(key, pending);
  try { return (await pending).clone(); }
  finally { reads.delete(key); }
}
