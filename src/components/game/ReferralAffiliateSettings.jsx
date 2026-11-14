import { useEffect, useState } from 'react';

const text = {
  uk: { title:'Stars + ігрові бонуси', hint:'У Telegram відкрий профіль PLANET4 → Партнерська програма та скопіюй своє посилання. Встав його один раз — запрошення з гри збереже і партнерську комісію, і бонуси.', label:'Твоє партнерське посилання Telegram', save:'Зберегти', remove:'Відключити', linked:'Посилання підключено. Комісію та строк визначає програма Telegram.', invalid:'Потрібне партнерське посилання саме на PLANET4.', failed:'Не вдалося зберегти. Спробуй ще раз.' },
  ru: { title:'Stars + игровые бонусы', hint:'В Telegram открой профиль PLANET4 → Партнёрская программа и скопируй свою ссылку. Вставь её один раз — приглашение из игры сохранит и партнёрскую комиссию, и бонусы.', label:'Твоя партнёрская ссылка Telegram', save:'Сохранить', remove:'Отключить', linked:'Ссылка подключена. Комиссию и срок определяет программа Telegram.', invalid:'Нужна партнёрская ссылка именно на PLANET4.', failed:'Не удалось сохранить. Попробуй ещё раз.' },
  en: { title:'Stars + game bonuses', hint:'In Telegram, open the PLANET4 profile → Affiliate Program and copy your own link. Paste it once to include affiliate commissions and game bonuses in invitations from the game.', label:'Your Telegram affiliate link', save:'Save', remove:'Disconnect', linked:'Link connected. Commission and duration follow the Telegram program terms.', invalid:'Use a PLANET4 affiliate link.', failed:'Could not save. Try again.' },
};

export default function ReferralAffiliateSettings({ profile, affiliateUrl, onSaved }) {
  const t = text[profile?.language] || text.uk;
  const [draft, setDraft] = useState(affiliateUrl || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setDraft(affiliateUrl || ''); setError(''); }, [profile?.id, affiliateUrl]);
  if (!profile?.telegram_id) return null;
  const save = async value => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const initData = window.Telegram?.WebApp?.initData;
      const response = await fetch('/api/referrals/affiliate', {
        method:'POST', headers:{'Content-Type':'application/json', ...(initData ? {'X-Telegram-Init-Data':initData} : {})},
        body:JSON.stringify({url:value.trim()}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.code || payload.error?.code || 'SAVE_FAILED');
      setDraft(payload.data.affiliateUrl);
      onSaved(payload.data.affiliateUrl);
    } catch (e) { setError(e.message === 'INVALID_TELEGRAM_AFFILIATE_LINK' ? t.invalid : t.failed); }
    finally { setBusy(false); }
  };
  return <details className="mt-2 shrink-0 rounded border border-[#28ee90]/60 bg-[#10170d] p-2 text-[10px] text-[#dbeccb]">
    <summary className="cursor-pointer font-bold">{t.title}{affiliateUrl ? ' ✓' : ''}</summary>
    <p className="mt-2 leading-relaxed">{t.hint}</p>
    <label className="mt-2 block">{t.label}<input type="url" value={draft} onChange={e=>setDraft(e.target.value)} disabled={busy}
      placeholder="https://t.me/planet_4bot?start=_tgr_…" className="mt-1 w-full rounded border border-[#28ee90]/60 bg-black/50 p-2 text-[11px]" /></label>
    <div className="mt-2 flex gap-2"><button type="button" disabled={busy || !draft.trim()} onClick={()=>void save(draft)} className="min-h-9 rounded border border-[#28ee90] px-3 font-bold">{t.save}</button>
      {affiliateUrl ? <button type="button" disabled={busy} onClick={()=>void save('')} className="min-h-9 rounded border border-[#28ee90]/50 px-3">{t.remove}</button> : null}</div>
    {affiliateUrl ? <p className="mt-2 text-[#b9e985]" role="status">{t.linked}</p> : null}
    {error ? <p className="mt-2 text-red-400" role="alert">{error}</p> : null}
  </details>;
}
