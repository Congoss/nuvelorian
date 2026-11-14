import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

// Live numbers for the landing page: game players from our server, on-chain activity from NearBlocks.
const REPO_URL = import.meta.env.VITE_REPO_URL || '';
const VIDEO_URL = import.meta.env.VITE_DEMO_VIDEO_URL || '';
const copy = {
  en: { title: 'Live on NEAR', players: 'players', wallets: 'with a NEAR wallet', today: 'active today', merchants: 'AI merchants with their own NEAR accounts', smith: 'smith · forges what nobody sells', hunter: 'hunter · restocks only what he sold', recent: 'Latest on-chain activity', none: 'On-chain feed is loading or unavailable — open NearBlocks directly.', token: 'PL4 token', market: 'PL4 player market · mainnet pilot', lots: 'items listed', trades: 'verified trades', volume: 'PL4 traded', lastTrades: 'Latest market trades', noTrades: 'No trades yet. A sale is counted only after its payment is confirmed on NEAR.', kinds: { player: 'player → player', 'merchant-sale': 'merchant sold', 'merchant-buy': 'merchant bought' }, judges: 'For NEAR Hackathon judges', steps: ['Press “Judge demo” — no wallet or tutorial needed.', 'Follow the tour: open the Market and meet Tor and Grym.', 'Link a NEAR wallet in Profile to keep your progress. Guests can view the market; trading requires a verified wallet. Every trade listed here links to NearBlocks.'], repo: 'Source code & README', video: 'Demo video', judgeLink: 'Start the judge tour' },
  uk: { title: 'Наживо на NEAR', players: 'гравців', wallets: 'з NEAR-гаманцем', today: 'активні сьогодні', merchants: 'ШІ-торговці з власними NEAR-акаунтами', smith: 'коваль · кує те, чого ніхто не продає', hunter: 'скупник · докуповує лише продане', recent: 'Останні транзакції', none: 'Стрічка завантажується або недоступна — відкрийте NearBlocks.', token: 'Токен PL4', market: 'Ринок гравців за PL4 · пілот у mainnet', lots: 'лотів виставлено', trades: 'підтверджених угод', volume: 'PL4 в угодах', lastTrades: 'Останні угоди на ринку', noTrades: 'Угод ще не було. Продаж рахується лише після підтвердження оплати в NEAR.', kinds: { player: 'гравець → гравець', 'merchant-sale': 'торговець продав', 'merchant-buy': 'торговець купив' }, judges: 'Для суддів NEAR Hackathon', steps: ['Натисніть «Демо для суддів» — без гаманця й навчання.', 'Пройдіть тур: відкрийте маркет і познайомтеся з Тором і Гримом.', 'Підключіть NEAR-гаманець у профілі, щоб зберегти прогрес. Гостям доступний перегляд ринку; для торгівлі потрібен підтверджений гаманець. Кожна угода тут веде на NearBlocks.'], repo: 'Код і README', video: 'Демо-відео', judgeLink: 'Почати тур для суддів' },
  ru: { title: 'Вживую на NEAR', players: 'игроков', wallets: 'с NEAR-кошельком', today: 'активны сегодня', merchants: 'ИИ-торговцы со своими NEAR-аккаунтами', smith: 'кузнец · куёт то, что никто не продаёт', hunter: 'скупщик · докупает только проданное', recent: 'Последние транзакции', none: 'Лента загружается или недоступна — откройте NearBlocks.', token: 'Токен PL4', market: 'Рынок игроков за PL4 · пилот в mainnet', lots: 'лотов выставлено', trades: 'подтверждённых сделок', volume: 'PL4 в сделках', lastTrades: 'Последние сделки на рынке', noTrades: 'Сделок пока не было. Продажа считается только после подтверждения оплаты в NEAR.', kinds: { player: 'игрок → игрок', 'merchant-sale': 'торговец продал', 'merchant-buy': 'торговец купил' }, judges: 'Для судей NEAR Hackathon', steps: ['Нажмите «Демо для судей» — без кошелька и обучения.', 'Пройдите тур: откройте маркет и познакомьтесь с Тором и Гримом.', 'Подключите NEAR-кошелёк в профиле, чтобы сохранить прогресс. Гостям доступен просмотр рынка; для торговли нужен подтверждённый кошелёк. Каждая сделка здесь ведёт на NearBlocks.'], repo: 'Код и README', video: 'Демо-видео', judgeLink: 'Начать тур для судей' },
};
const short = hash => `${hash.slice(0, 6)}…${hash.slice(-4)}`;
const nb = path => `https://nearblocks.io/${path}`;

export default function WebLiveStats({ language, highlight }) {
  const t = copy[language] || copy.en;
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/stats', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(d => setStats(d?.data || null)).catch(() => {});
    return () => controller.abort();
  }, []);
  const number = value => new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : language).format(Number(value) || 0);
  // the market book keeps PL4 in hundredths
  const pl4 = hundredths => new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : language, { maximumFractionDigits: 2 }).format((Number(hundredths) || 0) / 100);
  return <section className={`web-live${highlight ? ' web-live--highlight' : ''}`} aria-labelledby="web-live-title">
    <div className="web-live__panel">
      <h2 id="web-live-title">{t.title}</h2>
      <div className="web-live__numbers">
        <div><b>{stats ? number(stats.players) : '—'}</b><span>{t.players}</span></div>
        <div><b>{stats ? number(stats.walletPlayers) : '—'}</b><span>{t.wallets}</span></div>
        <div><b>{stats ? number(stats.activeToday) : '—'}</b><span>{t.today}</span></div>
      </div>
      {stats?.market ? <>
        <p className="web-live__label">{t.market}</p>
        <div className="web-live__numbers">
          <div><b>{number(stats.market.activeLots)}</b><span>{t.lots}</span></div>
          <div><b>{number(stats.market.trades)}</b><span>{t.trades}</span></div>
          <div><b>{pl4(stats.market.volumeHundredths)}</b><span>{t.volume}</span></div>
        </div>
        {stats.market.recent?.length ? <>
          <p className="web-live__label">{t.lastTrades}</p>
          <ul className="web-live__txs">
            {stats.market.recent.map(trade => <li key={trade.hash}><a href={nb('txns/' + trade.hash)} target="_blank" rel="noopener noreferrer"><code>{short(trade.hash)}</code><span>{t.kinds[trade.kind] || trade.kind}</span><span>{pl4(trade.priceHundredths)} PL4</span>{trade.at ? <time dateTime={new Date(trade.at).toISOString()}>{new Date(trade.at).toLocaleDateString()}</time> : null}</a></li>)}
          </ul>
        </> : <p className="web-live__empty">{t.noTrades}</p>}
      </> : null}
      <p className="web-live__label">{t.merchants}</p>
      <ul className="web-live__merchants">
        <li><a href={nb('address/tor.nuvelorian.near')} target="_blank" rel="noopener noreferrer"><b>Tor</b> <code>tor.nuvelorian.near</code><ArrowUpRight size={13} aria-hidden="true" /></a><small>{t.smith}</small></li>
        <li><a href={nb('address/grym.nuvelorian.near')} target="_blank" rel="noopener noreferrer"><b>Grym</b> <code>grym.nuvelorian.near</code><ArrowUpRight size={13} aria-hidden="true" /></a><small>{t.hunter}</small></li>
        <li><a href={nb('token/pl4.nearlytrade.near')} target="_blank" rel="noopener noreferrer"><b>{t.token}</b> <code>pl4.nearlytrade.near</code><ArrowUpRight size={13} aria-hidden="true" /></a></li>
      </ul>
      <p className="web-live__label">{t.recent}</p>
      {stats?.recent?.length ? <ul className="web-live__txs">
        {stats.recent.map(tx => <li key={tx.hash}><a href={nb('txns/' + tx.hash)} target="_blank" rel="noopener noreferrer"><code>{short(tx.hash)}</code><span>{tx.method || 'tx'}</span><span>{tx.from.replace('.near', '')} → {tx.to.replace('.near', '')}</span>{tx.at ? <time dateTime={new Date(tx.at).toISOString()}>{new Date(tx.at).toLocaleDateString()}</time> : null}</a></li>)}
      </ul> : <p className="web-live__empty">{t.none}</p>}
    </div>
    <div className="web-live__panel" id="judges">
      <h2>{t.judges}</h2>
      <ol className="web-live__steps">{t.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <div className="web-live__links">
        <a className="web-live__primary" href="/web?judge=1">{t.judgeLink}</a>
        {REPO_URL ? <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t.repo}<ArrowUpRight size={13} aria-hidden="true" /></a> : null}
        {VIDEO_URL ? <a href={VIDEO_URL} target="_blank" rel="noopener noreferrer">{t.video}<ArrowUpRight size={13} aria-hidden="true" /></a> : null}
      </div>
    </div>
  </section>;
}
