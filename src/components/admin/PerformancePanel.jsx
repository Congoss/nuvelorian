import { useCallback, useEffect, useRef, useState } from 'react';

const COPY = {
  uk:{title:'Діагностика швидкодії',search:'Нік / ID / запит / сесія',refresh:'Оновити',copy:'Копіювати JSON',download:'Завантажити JSON',empty:'Даних поки немає. Збір почнеться після встановлення оновленого клієнта.',all:'Усі джерела',client:'Пристрій',api:'Сервер',hour:'Остання година',day:'24 години',week:'14 днів',note:'До 2000 останніх записів за 14 днів. FPS вимірюється вибірково 3 секунди на хвилину у видимій грі. Відсутні метрики можуть не підтримуватися браузером.',copied:'Скопійовано',failed:'Не вдалося скопіювати',count:'Записів',details:'Деталі',loading:'Завантаження…'},
  ru:{title:'Диагностика быстродействия',search:'Ник / ID / запрос / сессия',refresh:'Обновить',copy:'Копировать JSON',download:'Скачать JSON',empty:'Данных пока нет. Сбор начнётся после установки обновлённого клиента.',all:'Все источники',client:'Устройство',api:'Сервер',hour:'Последний час',day:'24 часа',week:'14 дней',note:'До 2000 последних записей за 14 дней. FPS измеряется выборочно 3 секунды в минуту в видимой игре. Часть метрик может не поддерживаться браузером.',copied:'Скопировано',failed:'Не удалось скопировать',count:'Записей',details:'Подробности',loading:'Загрузка…'},
  en:{title:'Performance diagnostics',search:'Nickname / ID / request / session',refresh:'Refresh',copy:'Copy JSON',download:'Download JSON',empty:'No data yet. Collection starts after the updated client is installed.',all:'All sources',client:'Device',api:'Server',hour:'Last hour',day:'24 hours',week:'14 days',note:'Up to 2000 latest entries over 14 days. FPS samples cover 3 seconds per visible minute. Some metrics may be unsupported by the browser.',copied:'Copied',failed:'Could not copy',count:'Records',details:'Details',loading:'Loading…'},
};
const style='rounded-lg border border-white/10 bg-black/20 p-2 text-sm';
export default function PerformancePanel({api,lang='uk'}) {
  const t=COPY[lang] || COPY.uk;
  const [query,setQuery]=useState(''),[source,setSource]=useState(''),[hours,setHours]=useState('24');
  const [data,setData]=useState({events:[],server:null}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const sequence=useRef(0);
  const load=useCallback(async()=>{
    const id=++sequence.current;setBusy(true);setError('');
    try {
      const params=new URLSearchParams({view:'performance',limit:'2000',q:query.trim(),source,since:new Date(Date.now()-Number(hours)*3600000).toISOString()});
      const result=await api('/api/admin/diagnostics?'+params);
      if(id===sequence.current)setData(result);
    } catch(e){if(id===sequence.current)setError(e.message);}
    finally{if(id===sequence.current)setBusy(false);}
  },[api,query,source,hours]);
  useEffect(()=>{const timer=setTimeout(load,350);return()=>{clearTimeout(timer);sequence.current++;};},[load]);
  const events=data.events || [];
  const exportJson=()=>JSON.stringify({generated_at:new Date().toISOString(),filters:{query,source,hours},retention_days:14,limit:2000,frame_sample_seconds:3,...data},null,2);
  const copy=async()=>{try{await navigator.clipboard.writeText(exportJson());setNotice(t.copied);}catch{setNotice(t.failed);}};
  const download=()=>{const url=URL.createObjectURL(new Blob([exportJson()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`planet4-performance-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const fps=events.filter(e=>e.details?.sample_fps!=null).map(e=>e.details.sample_fps);
  const apiMs=events.filter(e=>e.source==='api').map(e=>e.duration_ms).sort((a,b)=>a-b);
  return <section className="admin-gradient-card rounded-2xl border border-white/10 p-4">
    <h2 className="font-black">{t.title}</h2><p className="my-2 text-xs text-slate-400">{t.note}</p>
    <div className="my-3 flex flex-wrap gap-2">
      <input className={style} aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)}/>
      <select className={style} aria-label={t.all} value={source} onChange={e=>setSource(e.target.value)}><option value="">{t.all}</option><option value="client">{t.client}</option><option value="api">{t.api}</option></select>
      <select className={style} aria-label={t.day} value={hours} onChange={e=>setHours(e.target.value)}><option value="1">{t.hour}</option><option value="24">{t.day}</option><option value="336">{t.week}</option></select>
      <button className={style} onClick={load} disabled={busy}>{t.refresh}</button><button className={style} disabled={busy} onClick={copy}>{t.copy}</button><button className={style} disabled={busy} onClick={download}>{t.download}</button>
    </div>
    <p role="status" className="text-xs text-violet-200">{busy?t.loading:notice}</p>{error&&<p role="alert" className="text-red-300">{error}</p>}
    <div className="my-3 flex flex-wrap gap-4 text-xs text-slate-300"><span>{t.count}: {events.length}</span><span>{({uk:'Вибірковий FPS мін.',ru:'Выборочный FPS мин.',en:'Sample FPS min'})[lang] || 'Sample FPS min'}: {fps.length?Math.min(...fps).toFixed(1):'—'}</span><span>{({uk:'Повільні API p95',ru:'Медленные API p95',en:'Slow API p95'})[lang] || 'Slow API p95'}: {apiMs.length?apiMs[Math.floor(apiMs.length*.95)]+' ms':'—'}</span><span>Server RSS: {data.server?.rss_mb?.toFixed(0) ?? '—'} MB</span><span>Server: {data.server?.version || '—'}</span></div>
    <div className="max-h-[65vh] space-y-2 overflow-auto">{events.map(e=><article key={e.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
      <div className="flex flex-wrap gap-3 text-slate-400"><time>{new Date(e.created_at).toLocaleString(lang==='uk'?'uk-UA':lang==='ru'?'ru-RU':'en-US')}</time><span>{e.source==='api'?t.api:t.client}</span><span>{e.details?.player_name} · {e.player_id}</span><span>{e.details?.screen}</span><span>{e.duration_ms?e.duration_ms+' ms':''}</span></div>
      <p className="mt-2 break-all font-mono">{e.code} · {e.method} {e.path}</p><p className="break-all text-violet-200">{e.message}</p>
      <details className="mt-2"><summary className="cursor-pointer">{t.details}</summary><pre className="mt-2 whitespace-pre-wrap break-all">{JSON.stringify(e.details,null,2)}</pre></details>
    </article>)}{!events.length&&!busy&&<p>{t.empty}</p>}</div>
  </section>;
}
