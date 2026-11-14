import { useEffect, useState } from 'react';
import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function Pl4Ticker({ language }) {
  const [quote, setQuote] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const refresh = async () => {
      if (busy || document.visibilityState === 'hidden') return;
      busy = true;
      try {
        const response = await fetch('/api/public/pl4-quote', { signal: controller.signal, cache: 'no-store' });
        const payload = await response.json();
        const data = payload.data || payload;
        if (!response.ok || data.token !== 'pl4.nearlytrade.near' || !Number.isFinite(data.price_usd) || data.price_usd <= 0) throw Error('Quote unavailable');
        setQuote({ ...data, receivedAt: Date.now() }); setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { busy = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const valid = quote && Date.now() - quote.receivedAt < 300000;
  const stale = valid && (failed || quote.stale);
  const change = valid && Number.isFinite(quote.change_24h) ? quote.change_24h * 100 : null;
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const unavailable = language === 'uk' ? 'Курс недоступний' : language === 'ru' ? 'Курс недоступен' : 'Price unavailable';
  const cachedLabel = language === 'uk' ? 'Останній курс' : language === 'ru' ? 'Последний курс' : 'Last price';
  const buy = language === 'uk' ? 'Купити' : language === 'ru' ? 'Купить' : 'Buy';
  return <div className="web-login__ticker"><a className="web-login__ticker-market" href="https://nearly.trade/pl4.nearlytrade.near" target="_blank" rel="noopener noreferrer" aria-label="$PL4 · Nearly Trade">
    <strong>$PL4</strong>
    <span className="web-login__ticker-price">{valid ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 10, maximumSignificantDigits: 4 }).format(quote.price_usd) : failed ? unavailable : '…'}</span>
    {change !== null && <span className={`web-login__ticker-change ${change > 0 ? 'is-up' : change < 0 ? 'is-down' : ''}`}><ChangeIcon size={12} aria-hidden="true" />{change > 0 ? '+' : ''}{change.toFixed(2)}%<small>24h</small></span>}
    {stale && <small className="web-login__ticker-stale">{cachedLabel}</small>}
    <ArrowUpRight className="web-login__ticker-arrow" size={12} aria-hidden="true" />
  </a><a className="web-login__token-buy" href="https://nearly.trade/pl4.nearlytrade.near" target="_blank" rel="noopener noreferrer">{buy}<ArrowUpRight size={12} aria-hidden="true" /></a></div>;
}
