import { useState } from 'react';

// Short guided path for NEAR Hackathon judges (enabled from /web?judge=1 or the landing page).
const KEY = 'p4-judge-tour';
const text = {
  en: { title: 'NEAR Hackathon tour', market: 'Open the market', marketHint: 'Player trades in PL4 and the AI merchants Tor and Grym', wallet: 'Link a NEAR wallet', walletHint: 'Profile → NEAR wallet (keeps this guest progress)', chain: 'Check it on-chain', close: 'Hide' },
  uk: { title: 'Тур для суддів NEAR Hackathon', market: 'Відкрити маркет', marketHint: 'Угоди гравців у PL4 та ШІ-торговці Тор і Грим', wallet: 'Підключити NEAR-гаманець', walletHint: 'Профіль → NEAR-гаманець (прогрес гостя збережеться)', chain: 'Перевірити в блокчейні', close: 'Сховати' },
  ru: { title: 'Тур для судей NEAR Hackathon', market: 'Открыть маркет', marketHint: 'Сделки игроков в PL4 и ИИ-торговцы Тор и Грим', wallet: 'Подключить NEAR-кошелёк', walletHint: 'Профиль → NEAR-кошелёк (прогресс гостя сохранится)', chain: 'Проверить в блокчейне', close: 'Скрыть' },
};
export const enableJudgeTour = () => { try { window.localStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ } };

export default function JudgeTour({ profile, onOpenMarket, onOpenProfile }) {
  const [open, setOpen] = useState(() => {
    if (new URLSearchParams(window.location.search).get('judge') === '1') return true;
    try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  if (!open || !profile?.id) return null;
  const lang = profile.language === 'ua' ? 'uk' : profile.language;
  const t = text[lang] || text.en;
  const close = () => {
    try { window.localStorage.setItem(KEY, '0'); } catch { /* ignore */ }
    const url = new URL(window.location.href); url.searchParams.delete('judge');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    setOpen(false);
  };
  const step = 'flex w-full items-start gap-2 rounded-[10px] border border-[#2e4a22] bg-[#121a0f] px-2 py-1.5 text-left hover:border-[#9dff43]';
  return <aside aria-label={t.title} className="fixed bottom-[86px] right-2 z-[60] w-[260px] rounded-[14px] border border-[#9dff43] bg-[#0b0f09]/95 p-2.5 font-mono text-[#edf8d9] shadow-[0_0_24px_rgba(157,255,67,.25)]">
    <div className="mb-2 flex items-center justify-between"><b className="text-[11px] uppercase tracking-[.08em] text-[#9dff43]">{t.title}</b><button type="button" onClick={close} className="text-[10px] text-[#9cb087] underline">{t.close}</button></div>
    <div className="space-y-1.5 text-[11px]">
      <button type="button" className={step} onClick={onOpenMarket}><span className="text-[#9dff43]">1</span><span><b>{t.market}</b><br /><small className="text-[#9cb087]">{t.marketHint}</small></span></button>
      <button type="button" className={step} onClick={onOpenProfile}><span className="text-[#9dff43]">2</span><span><b>{t.wallet}</b><br /><small className="text-[#9cb087]">{t.walletHint}</small></span></button>
      <a className={step} href="https://nearblocks.io/address/tor.nuvelorian.near" target="_blank" rel="noopener noreferrer"><span className="text-[#9dff43]">3</span><span><b>{t.chain}</b><br /><small className="text-[#9cb087]">tor / grym.nuvelorian.near · pl4.nearlytrade.near</small></span></a>
    </div>
  </aside>;
}
