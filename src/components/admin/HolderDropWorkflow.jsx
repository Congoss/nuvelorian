import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Plus, RefreshCw, Save, Send, ShieldCheck } from 'lucide-react';
import { HOLDER_PET_OPTIONS } from '@/lib/holderPetRewards';

const copy = {
  uk: {title:'Щоденні нагороди холдерам',intro:'Вибери контракт, перевір холдерів і налаштуй нагороду. Перевіряються NEAR-гаманці, збережені у профілях гри.',contract:'1. Контракт',holders:'2. Перевірка холдерів',reward:'3. Нагорода й авторозсилка',create:'Новий дроп',check:'Перевірити холдерів',metadata:'Завантажити назву',unit:'За кожні',minimum:'Мінімальний холдинг',mode:'Розрахунок нагороди',scaled:'Множити за кількістю',fixed:'Одна нагорода на холдера',add:'Додати ресурс',save:'Зберегти налаштування',enable:'Увімкнути щоденну розсилку',pause:'Вимкнути авторозсилку',last:'Остання відправка',next:'Наступна розсилка',never:'Ще не відправлялось',off:'Вимкнено',queued:'У черзі · найближча перевірка до 5 хв',running:'Перевірка й відправлення…',completed:'Завершено',failed:'Помилка',partial:'Частково · повторна перевірка запланована',interrupted:'Перервано · повтори перевірку',status:'Статус',player:'Гравець',wallet:'Гаманець',holding:'Холдинг',gets:'Нарахується',sent:'Надіслано',ready:'Готово',stale:'Потрібна повторна перевірка',search:'Гравець або гаманець',empty:'Спочатку перевір холдерів контракту.',schedule:'Автоматично щодня після 00:00 UTC. Повторних листів за ту саму добу не буде.',formula:'Приклад',message:'Лист гравцеві',subject:'Тема',body:'Текст',manual:'Ручна відправка та одноразові пети',selected:'Надіслати вибраним',pet:'Видати вибраним пета',noPet:'Без пета',checked:'Перевірено гаманців',errors:'Помилки',working:'Виконується…',checkFirst:'Перед увімкненням перевір холдерів.',saved:'Збережено',daily:'Авторозсилка увімкнена',paused:'Авторозсилка вимкнена',help:'Нагороди надходять у внутрішню пошту гри. Залишок, менший за одну повну порцію, не враховується.',draft:'Є незбережені зміни. Нова конфігурація збережеться з вимкненою авторозсилкою.'},
  ru: {title:'Ежедневные награды холдерам',intro:'Выбери контракт, проверь холдеров и настрой награду. Проверяются NEAR-кошельки, сохранённые в профилях игры.',contract:'1. Контракт',holders:'2. Проверка холдеров',reward:'3. Награда и авторассылка',create:'Новый дроп',check:'Проверить холдеров',metadata:'Загрузить название',unit:'За каждые',minimum:'Минимальный холдинг',mode:'Расчёт награды',scaled:'Умножать по количеству',fixed:'Одна награда на холдера',add:'Добавить ресурс',save:'Сохранить настройки',enable:'Включить ежедневную рассылку',pause:'Выключить авторассылку',last:'Последняя отправка',next:'Следующая рассылка',never:'Ещё не отправлялось',off:'Выключено',queued:'В очереди · ближайшая проверка до 5 мин',running:'Проверка и отправка…',completed:'Завершено',failed:'Ошибка',partial:'Частично · повторная проверка запланирована',interrupted:'Прервано · повтори проверку',status:'Статус',player:'Игрок',wallet:'Кошелёк',holding:'Холдинг',gets:'Будет начислено',sent:'Отправлено',ready:'Готово',stale:'Нужна повторная проверка',search:'Игрок или кошелёк',empty:'Сначала проверь холдеров контракта.',schedule:'Автоматически ежедневно после 00:00 UTC. Повторных писем за те же сутки не будет.',formula:'Пример',message:'Письмо игроку',subject:'Тема',body:'Текст',manual:'Ручная отправка и одноразовые питомцы',selected:'Отправить выбранным',pet:'Выдать выбранным питомца',noPet:'Без питомца',checked:'Проверено кошельков',errors:'Ошибки',working:'Выполняется…',checkFirst:'Перед включением проверь холдеров.',saved:'Сохранено',daily:'Авторассылка включена',paused:'Авторассылка выключена',help:'Награды приходят во внутриигровую почту. Остаток меньше одной полной порции не учитывается.',draft:'Есть несохранённые изменения. Новая конфигурация сохранится с выключенной авторассылкой.'},
  en: {title:'Daily holder rewards',intro:'Choose a contract, check holders and configure rewards. Checks NEAR wallets saved on game profiles.',contract:'1. Contract',holders:'2. Check holders',reward:'3. Rewards and daily delivery',create:'New drop',check:'Check holders',metadata:'Load name',unit:'For every',minimum:'Minimum holding',mode:'Reward calculation',scaled:'Scale by holding',fixed:'One reward per holder',add:'Add resource',save:'Save settings',enable:'Enable daily delivery',pause:'Disable daily delivery',last:'Last sent',next:'Next delivery',never:'Not sent yet',off:'Disabled',queued:'Queued · next check within 5 min',running:'Checking and sending…',completed:'Completed',failed:'Failed',partial:'Partial · retry scheduled',interrupted:'Interrupted · check again',status:'Status',player:'Player',wallet:'Wallet',holding:'Holding',gets:'Reward preview',sent:'Sent',ready:'Ready',stale:'Check again',search:'Player or wallet',empty:'Check contract holders first.',schedule:'Automatically daily after 00:00 UTC. No duplicate daily mail.',formula:'Example',message:'In-game mail',subject:'Subject',body:'Message',manual:'Manual delivery and one-time pets',selected:'Send to selected',pet:'Grant pet to selected',noPet:'No pet',checked:'Wallets checked',errors:'Errors',working:'Working…',checkFirst:'Check holders before enabling delivery.',saved:'Saved',daily:'Daily delivery enabled',paused:'Daily delivery disabled',help:'Rewards arrive in game mail. Incomplete holding units do not count.',draft:'Unsaved changes. Saving this configuration will pause automatic delivery.'},
};
const resources = [
  ['tentacles','Щупальця','Щупальца','Tentacles'],['premium','Папір','Бумага','T-Pape'],['energy','Енергія','Энергия','Energy'],['xp','EXP','EXP','EXP'],['stat_strength','CA','CA','CA'],
  ['roulette_bonus_spins','Спіни','Спины','Spins'],
  ['small_poison','Мала отрута','Малый яд','Small poison'],['medium_poison','Середня отрута','Средний яд','Medium poison'],['large_poison','Велика отрута','Большой яд','Large poison'],
];
const empty = {id:'',kind:'token',enabled:false,contract:'',threshold:'1000000',rewardMode:'per_unit',rewards:[{field:'large_poison',amount:1}],title:{uk:'Нагорода холдерам',ru:'Награда холдерам',en:'Holder reward'},text:{uk:'Дякуємо за підтримку! Твоя щоденна нагорода холдера.',ru:'Спасибо за поддержку! Твоя ежедневная награда холдера.',en:'Thank you for your support! Here is your daily holder reward.'},holders:[]};
const endpoint='/api/admin/holder-drops';
const hydrate=row=>({...empty,...row,iconData:row.iconData||'',holders:row.holders||[],text:Object.values(row.text||{}).some(value=>String(value||'').trim())?row.text:empty.text});

export default function HolderDropWorkflow({api,button,primary,input,card,lang='uk',doAction,busy}) {
  const t=copy[lang]||copy.uk;
  const [drops,setDrops]=useState([]),[selectedId,setSelectedId]=useState(''),[form,setForm]=useState(empty);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[filter,setFilter]=useState(''),[selected,setSelected]=useState([]),[dirty,setDirty]=useState(false);
  const [working,setWorking]=useState(false);
  const operation=useRef(false),selectedRef=useRef('');
  selectedRef.current=selectedId;
  const label=field=>{const row=resources.find(item=>item[0]===field);return row?.[lang==='ru'?2:lang==='en'?3:1]||field;};
  const formatDate=value=>value?new Date(value).toLocaleString(lang==='uk'?'uk-UA':lang==='ru'?'ru-RU':'en-GB'):'—';
  const refresh=useCallback(async()=>{
    const list=await api(endpoint);setDrops(Array.isArray(list)?list:[]);
    setSelectedId(id=>list.some(row=>row.id===id)?id:list[0]?.id||'');
    const latest=list.find(row=>row.id===selectedRef.current);
    if(latest)setForm(current=>{const matches=['contract','threshold','rewardMode','decimals'].every(key=>current[key]===latest[key]);return {...current,delivery:latest.delivery,lastResult:latest.lastResult,...(matches?{holders:latest.holders||[],lastPreviewAt:latest.lastPreviewAt,lastPreviewResult:latest.lastPreviewResult,lastScanErrors:latest.lastScanErrors}:{})};});
    return list;
  },[api]);
  useEffect(()=>{void refresh().catch(e=>setError(e.message));},[refresh]);
  useEffect(()=>{
    const row=drops.find(item=>item.id===selectedId);
    if(row)setForm(hydrate(row));
    setDirty(false);setSelected([]);setError('');setNotice('');
  // Changes received by polling must not overwrite an unsaved form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedId]);
  const saved=drops.find(row=>row.id===selectedId);
  const delivery=saved?.delivery||form.delivery||{};
  const blocked=Boolean(busy||working||delivery.running);
  useEffect(()=>{
    const timer=setInterval(()=>{if(!document.hidden)void refresh().catch(e=>setError(e.message));},delivery.running?2000:15000);
    return()=>clearInterval(timer);
  },[refresh,delivery.running]);
  const update=(key,value)=>{
    setForm(current=>({...current,[key]:value,enabled:false,...(['contract','threshold','rewardMode'].includes(key)?{lastPreviewAt:'',holders:[]}: {})}));setDirty(true);setNotice('');
  };
  const perform=fn=>{
    if(operation.current||delivery.running)return;
    operation.current=true;setWorking(true);setError('');setNotice('');
    return doAction(async()=>{try{await fn();return false;}catch(e){setError(e.message);return false;}finally{operation.current=false;setWorking(false);}});
  };
  const saveConfig=async(enabled=form.enabled,overrides={})=>{
    const payload={id:form.id,kind:form.kind,contract:form.contract,threshold:form.threshold,rewardMode:form.rewardMode||'per_unit',rewards:form.rewards,enabled,
      name:form.name,symbol:form.symbol,decimals:form.decimals,petRewardId:form.petRewardId||'',title:form.title,text:form.text,iconData:form.iconData||undefined,iconMime:form.iconMime,...overrides};
    const result=await api(endpoint,'POST',payload);
    setForm(current=>({...hydrate(result),delivery:current.delivery}));setDirty(false);
    await refresh();return result;
  };
  const start=action=>perform(async()=>{
    if(action==='preview') {
      const metadata=await api(endpoint,'POST',{action:'metadata',kind:form.kind,contract:form.contract});
      await saveConfig(form.enabled,{name:metadata.name,symbol:metadata.symbol,decimals:metadata.decimals??form.decimals,iconData:metadata.icon||'',iconMime:metadata.iconMime||''});
    } else await saveConfig();
    await api(endpoint,'POST',{action,id:form.id,background:true,...(['send-selected','send-pet-selected'].includes(action)?{playerIds:selected}: {})});
    await refresh();
  });
  const create=kind=>perform(async()=>{
    const row=await api(endpoint,'POST',{action:'create',kind});
    const draft={...hydrate(row),rewardMode:'per_unit',title:empty.title,text:empty.text};
    setDrops(list=>[...list,row]);setSelectedId(row.id);setForm(draft);
    await refresh();
  });
  const loadMetadata=()=>perform(async()=>{
    const result=await api(endpoint,'POST',{action:'metadata',kind:form.kind,contract:form.contract});
    setForm(current=>({...current,name:result.name,symbol:result.symbol,decimals:result.decimals??current.decimals,iconData:result.icon,iconMime:result.iconMime,enabled:false}));setDirty(true);
  });
  const toggle=()=>perform(async()=>{
    const enabled=!saved?.enabled;
    if(enabled&&!form.lastPreviewAt)throw new Error(t.checkFirst);
    await saveConfig(enabled);setNotice(enabled?t.daily:t.paused);
  });
  const holders=(form.holders||[]).filter(row=>`${row.nickname} ${row.wallet}`.toLowerCase().includes(filter.toLowerCase()));
  const togglePlayer=id=>setSelected(ids=>ids.includes(id)?ids.filter(value=>value!==id):[...ids,id].slice(0,200));
  const checked=form.lastPreviewResult||form.lastResult;
  const statusText=delivery.running?t.running:({completed:t.completed,failed:t.failed,partial:t.partial,interrupted:t.interrupted,skipped:t.completed})[delivery.status]||'—';
  const field=`${input} w-full min-w-0`;
  const step=(title,children)=><section className={`${card} space-y-4`}><h3 className="text-base font-black">{title}</h3>{children}</section>;
  const rewardText=(row,multiplier=1)=>row.map(reward=>`${Number(reward.amount)*multiplier} ${label(reward.field)}`).join(' · ');

  const rewardEditor = (<div className="space-y-2">{form.rewards.map((reward,index)=><div key={index} className="flex gap-2"><select aria-label={t.reward} className={`${field} flex-1`} disabled={blocked} value={reward.field} onChange={e=>update('rewards',form.rewards.map((row,i)=>i===index?{...row,field:e.target.value}:row))}>{resources.map(([key])=><option key={key} value={key}>{label(key)}</option>)}</select><input aria-label={t.gets} className={`${input} w-28`} type="number" min="1" step="1" disabled={blocked} value={reward.amount} onChange={e=>update('rewards',form.rewards.map((row,i)=>i===index?{...row,amount:Number(e.target.value)}:row))}/><button aria-label="Remove reward" className={button} disabled={blocked||form.rewards.length<=1} onClick={()=>update('rewards',form.rewards.filter((_,i)=>i!==index))}>×</button></div>)}<button className={button} disabled={blocked||form.rewards.length>=12} onClick={()=>update('rewards',[...form.rewards,{field:'large_poison',amount:1}])}><Plus size={14} className="mr-1 inline"/>{t.add}</button></div>);

  return <div className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{t.title}</h2><p className="mt-1 max-w-3xl text-sm text-slate-400">{t.intro}</p></div><span className="flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck size={15}/> NEAR</span></header>
    {error&&<p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
    {notice&&<p role="status" className="text-sm text-emerald-300">{notice}</p>}
    {step(t.contract,<>
      <div className="flex flex-wrap gap-2"><select aria-label={t.contract} className={`${field} flex-1`} value={selectedId} disabled={working} onChange={e=>setSelectedId(e.target.value)}><option value="">—</option>{drops.map(row=><option key={row.id} value={row.id}>{row.kind==='nft'?'NFT':'TOKEN'} · {row.name||row.contract} · {row.enabled?'ON':'OFF'}</option>)}</select>{['token','nft'].map(kind=><button key={kind} className={button} disabled={blocked} onClick={()=>create(kind)}><Plus size={14} className="mr-1 inline"/>{t.create} · {kind.toUpperCase()}</button>)}</div>
      {form.id&&<div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto]"><label className="grid gap-1 text-xs text-slate-400">NEAR · {form.kind.toUpperCase()}<input className={field} disabled={blocked} value={form.contract} onChange={e=>update('contract',e.target.value)}/></label><button className={button} disabled={blocked||!form.contract} onClick={loadMetadata}>{t.metadata}</button></div>}
      {form.name&&<div className="flex items-center gap-3">{(form.iconData||saved?.iconUrl)&&<img src={form.iconData?`data:${form.iconMime};base64,${form.iconData}`:saved.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover"/>}<b>{form.name}</b><span className="text-xs text-slate-400">{form.symbol}</span></div>}
    </>)}
    {form.id&&<>
      {step(t.holders,<>
        <div className="flex flex-wrap gap-2"><input className={`${field} flex-1`} placeholder={t.search} value={filter} onChange={e=>setFilter(e.target.value)}/><button className={primary} disabled={blocked} onClick={()=>start('preview')}><Eye size={15} className="mr-1 inline"/>{blocked?t.working:t.check}</button><button className={button} disabled={working} aria-label="Refresh status" onClick={()=>refresh().catch(e=>setError(e.message))}><RefreshCw size={15}/></button></div>
        {checked&&<p className="text-xs text-slate-400">{t.checked}: {checked.checked||0} · {t.errors}: {checked.errors||0} · {form.lastPreviewAt?formatDate(form.lastPreviewAt):''}</p>}
        <div className="max-h-[30rem] overflow-auto rounded-xl border border-white/10"><table className="w-full min-w-[720px] text-left text-sm"><thead className="sticky top-0 bg-slate-900 text-xs text-slate-400"><tr><th className="p-3"><input type="checkbox" aria-label="Select visible holders" disabled={blocked||!holders.length} checked={holders.length>0&&holders.every(row=>selected.includes(row.id))} onChange={e=>setSelected(e.target.checked?holders.slice(0,200).map(row=>row.id):[])}/></th>{[t.player,t.wallet,t.holding,t.gets,t.status].map(name=><th key={name} className="p-3">{name}</th>)}</tr></thead><tbody>{holders.map(row=><tr key={row.id} className="border-t border-white/5"><td className="p-3"><input type="checkbox" aria-label={row.nickname} disabled={blocked} checked={selected.includes(row.id)} onChange={()=>togglePlayer(row.id)}/></td><td className="p-3 font-bold">{row.nickname}</td><td className="p-3 font-mono text-xs text-slate-400">{row.wallet}</td><td className="p-3 tabular-nums" title={row.displayBalance||row.holding}>{Number(row.displayBalance||row.holding).toLocaleString(undefined,{maximumFractionDigits:4})}</td><td className="max-w-64 p-3 text-xs">{rewardText(form.rewards,row.rewardMultiplier||0)}</td><td className="p-3 text-xs"><span className={row.stale?'text-amber-300':row.sentToday?'text-emerald-300':'text-slate-300'}>{row.stale?t.stale:row.sentToday?t.sent:t.ready}</span>{row.lastSentAt&&<p className="mt-1 text-slate-400">{formatDate(row.lastSentAt)}</p>}</td></tr>)}{!holders.length&&<tr><td colSpan={6} className="p-8 text-center text-slate-400">{t.empty}</td></tr>}</tbody></table></div>
        {!!form.lastScanErrors?.length&&<details className="rounded-lg border border-amber-500/30 p-3 text-xs text-amber-200"><summary>{t.errors} · {form.lastScanErrors.length}</summary>{form.lastScanErrors.slice(0,20).map(row=><p key={row.id} className="mt-2">{row.nickname||row.wallet}: {row.error}</p>)}</details>}
        <details className="rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm">{t.manual}</summary><div className="mt-3 space-y-2"><p className="text-xs text-slate-400">{lang==='uk'?'Ресурси для вибраних холдерів (ті самі налаштування, що й для авторозсилки):':lang==='ru'?'Ресурсы для выбранных холдеров (те же настройки, что и для авторассылки):':'Resources for selected holders (shared with daily delivery settings):'}</p>{rewardEditor}</div><div className="mt-3 flex flex-wrap gap-2"><button className={button} disabled={blocked||!selected.length} onClick={()=>start('send-selected')}><Send size={14} className="mr-1 inline"/>{t.selected} ({selected.length})</button>{form.kind==='nft'&&<><select className={input} disabled={blocked} value={form.petRewardId||''} onChange={e=>update('petRewardId',e.target.value)}><option value="">{t.noPet}</option>{HOLDER_PET_OPTIONS.map(pet=><option key={pet.id} value={pet.id}>{pet[lang]||pet.en}</option>)}</select><button className={button} disabled={blocked||!selected.length||!form.petRewardId} onClick={()=>start('send-pet-selected')}>{t.pet} ({selected.length})</button></>}</div></details>
      </>)}
      {step(t.reward,<>
        {dirty&&<p className="text-xs text-amber-300">{t.draft}</p>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-slate-400">{t.mode}<select className={field} disabled={blocked} value={form.rewardMode||'fixed'} onChange={e=>update('rewardMode',e.target.value)}><option value="per_unit">{t.scaled}</option><option value="fixed">{t.fixed}</option></select></label><label className="grid gap-1 text-xs text-slate-400">{form.rewardMode==='per_unit'?t.unit:t.minimum} · {form.kind==='nft'?'NFT':form.symbol||'TOKEN'}<input className={field} disabled={blocked} inputMode={form.kind==='nft'?'numeric':'decimal'} value={form.threshold} onChange={e=>update('threshold',e.target.value)}/></label></div>
        {rewardEditor}
        <p className="rounded-lg bg-violet-500/10 p-3 text-sm text-violet-200">{t.formula}: {form.threshold} {form.kind==='nft'?'NFT':form.symbol||'TOKEN'} → {rewardText(form.rewards)}{form.rewardMode==='per_unit'?` · ×3 → ${rewardText(form.rewards,3)}`:''}</p>
        <details className="rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm">{t.message}</summary><div className="mt-3 grid gap-3 md:grid-cols-3">{['uk','ru','en'].map(code=><div key={code} className="space-y-2"><label className="grid gap-1 text-xs text-slate-400">{code.toUpperCase()} · {t.subject}<input className={field} disabled={blocked} value={form.title?.[code]||''} onChange={e=>update('title',{...form.title,[code]:e.target.value})}/></label><label className="grid gap-1 text-xs text-slate-400">{t.body}<textarea className={`${field} min-h-24`} disabled={blocked} value={form.text?.[code]||''} onChange={e=>update('text',{...form.text,[code]:e.target.value})}/></label></div>)}</div></details>
        <p className="text-xs text-slate-400">{t.help}</p>
        <div className="flex flex-wrap gap-2"><button className={button} disabled={blocked} onClick={()=>perform(async()=>{await saveConfig();setNotice(t.saved);})}><Save size={14} className="mr-1 inline"/>{t.save}</button><button className={primary} disabled={blocked||(!saved?.enabled&&!form.lastPreviewAt)} onClick={toggle}>{saved?.enabled?t.pause:t.enable}</button></div>
        <div className="grid gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:grid-cols-3">{[[t.status,statusText],[t.last,delivery.lastSentAt?formatDate(delivery.lastSentAt):t.never],[t.next,!saved?.enabled?t.off:delivery.due?t.queued:formatDate(delivery.nextRunAt)]].map(([name,value])=><div key={name}><p className="text-xs text-slate-400">{name}</p><p className="mt-1 text-sm font-bold text-emerald-200">{value}</p></div>)}</div>
        <p className="text-xs text-slate-400">{t.schedule}</p>{delivery.error&&<p role="alert" className="text-sm text-rose-300">{delivery.error}</p>}
      </>)}
    </>}
  </div>;
}
