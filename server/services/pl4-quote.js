const SOURCE = 'https://nearly.trade/api/launch/pl4.nearlytrade.near';
export function createPl4QuoteService({ fetchImpl = fetch, now = Date.now } = {}) {
  let cached;
  let pending;
  return async function getQuote() {
    if (cached && now() - cached.fetched_at < 60000) return cached;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetchImpl(SOURCE, { signal: AbortSignal.timeout(7000) });
        if (!response.ok) throw Error('Quote unavailable');
        const data = await response.json();
        if (data.token !== 'pl4.nearlytrade.near' || typeof data.price_usd !== 'number' || !Number.isFinite(data.price_usd) || data.price_usd <= 0) throw Error('Invalid quote');
        cached = { token: data.token, price_usd: data.price_usd, change_24h: typeof data.change_24h === 'number' && Number.isFinite(data.change_24h) ? data.change_24h : null, fetched_at: now(), stale: false };
        return cached;
      } catch {
        if (cached && now() - cached.fetched_at < 300000) return { ...cached, stale: true };
        throw Error('PL4 quote temporarily unavailable');
      }
    })();
    try { return await pending; } finally { pending = null; }
  };
}
export const getPl4Quote = createPl4QuoteService();
