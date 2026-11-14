const DEFAULT_REFRESH_MS = 10 * 60 * 1000;

const runtime = {
  cache: null,
  inflight: null,
  timer: null,
};

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeRates(payload = {}) {
  return {
    tonUsd: String(payload.tonUsd ?? payload.ton_usd ?? payload.ton ?? '0'),
    nearUsd: String(payload.nearUsd ?? payload.near_usd ?? payload.near ?? '0'),
    starsPerUsd: Number(payload.starsPerUsd ?? payload.stars_per_usd ?? 100),
    fetchedAt: payload.fetchedAt || new Date().toISOString(),
    source: payload.source || 'coingecko',
  };
}

async function fetchRatesFromCoinGecko(fetchImpl = fetch) {
  const response = await fetchImpl('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network,near&vs_currencies=usd', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Rate fetch failed with status ${response.status}`);
  }
  const payload = await response.json();
  return normalizeRates({
    tonUsd: payload?.['the-open-network']?.usd,
    nearUsd: payload?.near?.usd,
    starsPerUsd: 100,
    fetchedAt: new Date().toISOString(),
    source: 'coingecko',
  });
}

export function createPaymentRateService({
  fetchImpl = fetch,
  refreshMs = DEFAULT_REFRESH_MS,
  initialRates = null,
} = {}) {
  if (initialRates) {
    runtime.cache = normalizeRates(initialRates);
  }

  async function refreshRates() {
    if (runtime.inflight) return runtime.inflight;
    runtime.inflight = (async () => {
      try {
        const rates = await fetchRatesFromCoinGecko(fetchImpl);
        runtime.cache = rates;
        return rates;
      } catch (error) {
        if (!runtime.cache) throw error;
        return runtime.cache;
      } finally {
        runtime.inflight = null;
      }
    })();
    return runtime.inflight;
  }

  async function getRates() {
    if (runtime.cache) return runtime.cache;
    return refreshRates();
  }

  function start() {
    if (runtime.timer || refreshMs <= 0) return;
    runtime.timer = setInterval(() => {
      refreshRates().catch((error) => {
        console.error('[payment-rates]', error?.message || 'refresh_failed');
      });
    }, refreshMs);
    if (typeof runtime.timer.unref === 'function') runtime.timer.unref();
  }

  function stop() {
    if (!runtime.timer) return;
    clearInterval(runtime.timer);
    runtime.timer = null;
  }

  return {
    getRates,
    refreshRates,
    start,
    stop,
    normalizeRates,
  };
}

