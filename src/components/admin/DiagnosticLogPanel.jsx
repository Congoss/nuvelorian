import { useMemo, useState } from 'react';

const LABELS = {
  uk: { title: 'Журнал помилок', all: 'Усі джерела', api: 'API', client: 'Браузер', empty: 'Помилок поки немає.', refresh: 'Оновити', copy: 'Копіювати JSON', copied: 'Скопійовано', copyFailed: 'Не вдалося скопіювати', note: 'До 2000 записів за 14 днів. Параметри URL та типові секрети маскуються; перевір JSON перед надсиланням.' },
  en: { title: 'Error journal', all: 'All sources', api: 'API', client: 'Browser', empty: 'No errors yet.', refresh: 'Refresh', copy: 'Copy JSON', copied: 'Copied', copyFailed: 'Could not copy', note: 'Up to 2000 entries for 14 days. URL queries and common secrets are masked; review JSON before sharing.' },
  ru: { title: 'Журнал ошибок', all: 'Все источники', api: 'API', client: 'Браузер', empty: 'Ошибок пока нет.', refresh: 'Обновить', copy: 'Копировать JSON', copied: 'Скопировано', copyFailed: 'Не удалось скопировать', note: 'До 2000 записей за 14 дней. Параметры URL и типовые секреты маскируются; проверь JSON перед отправкой.' },
};

export default function DiagnosticLogPanel({ events = [], lang = 'uk', onRefresh }) {
  const t = LABELS[lang] || LABELS.uk;
  const [source, setSource] = useState('all');
  const [suspicious,setSuspicious]=useState(false);
  const [query,setQuery]=useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const visible = useMemo(() => events.filter(event=>(source==='all'||event.source===source)&&(!suspicious||['PLAYER_PATCH_IGNORED','REQUEST_ID_REUSED','NO_PERMISSION','BOSS_FIGHT_NOT_OWNED','RATE_LIMITED','TOO_MANY_REQUESTS','CARD_SELECTION_LOCKED','INVALID_MULTIPLIER'].includes(event.code)||event.status===429)&&`${event.code} ${event.message} ${event.player_id||''} ${event.path}`.toLowerCase().includes(query.toLowerCase())), [events, source,suspicious,query]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(visible, null, 2));
      setCopyStatus(t.copied);
    } catch {
      setCopyStatus(t.copyFailed);
    }
  };

  return (
    <section className="admin-gradient-card rounded-2xl border border-transparent bg-[#171526] p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h2 className="font-black">{t.title} <span className="text-sm text-slate-400">({visible.length})</span></h2>
          <p className="mt-1 text-xs text-slate-400">{t.note}</p>
        </div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={suspicious} onChange={e=>setSuspicious(e.target.checked)}/>{{uk:'Підозріла активність · для перевірки',ru:'Подозрительная активность · для проверки',en:'Suspicious activity · review only'}[lang]}</label><input aria-label="Search" placeholder="ID / code / URL" value={query} onChange={e=>setQuery(e.target.value)} className="rounded border border-white/10 bg-black/20 p-2 text-xs"/>
        <select aria-label={t.all} className="rounded-lg border border-white/10 bg-[#100f1a] px-3 py-2 text-sm" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="all">{t.all}</option>
          <option value="api">{t.api}</option>
          <option value="client">{t.client}</option>
        </select>
        <button type="button" onClick={onRefresh} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">{t.refresh}</button>
        <button type="button" onClick={copy} disabled={!visible.length} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">{t.copy}</button>
        {copyStatus && <span role="status" className="text-xs text-violet-200">{copyStatus}</span>}
      </div>
      {visible.length ? (
        <div className="max-h-[65vh] space-y-2 overflow-y-auto">
          {visible.map((event) => (
            <article key={event.id} className="rounded-xl border border-white/10 bg-[#100f1a] p-3 font-mono text-xs">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400">
                <time>{new Date(event.created_at).toLocaleString(lang === 'uk' ? 'uk-UA' : lang === 'ru' ? 'ru-RU' : 'en-US')}</time>
                <span>{event.source === 'client' ? t.client : t.api}</span>
                {event.status > 0 && <span className={event.status >= 500 ? 'text-red-300' : event.status >= 400 ? 'text-amber-300' : 'text-sky-300'}>HTTP {event.status}</span>}
                {event.duration_ms > 0 && <span>{event.duration_ms} ms</span>}
              </div>
              <div className="mt-2 break-all text-slate-100">{event.method ? `${event.method} ` : ''}{event.path}</div>
              <div className="mt-1 break-all text-violet-200">{event.code}{event.message ? ` · ${event.message}` : ''}</div>
            </article>
          ))}
        </div>
      ) : <p className="text-sm text-slate-400">{t.empty}</p>}
    </section>
  );
}
