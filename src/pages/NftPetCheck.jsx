import { useState } from 'react';
const copy = {
  uk: { title: 'Перевірка NFT → пет', contract: 'Контракт колекції', id: 'NFT ID', check: 'Перевірити', busy: 'Перевірка…', free: 'Пет за цією NFT ще доступний', used: 'За цю NFT пета вже видано', hint: 'Перевіряй до купівлі. Статус може змінитися до моменту видачі. Один пет на гравця й гаманець; одна NFT використовується один раз.', error: 'Не вдалося перевірити. Спробуй ще раз; це не підтвердження доступності.' },
  ru: { title: 'Проверка NFT → питомец', contract: 'Контракт коллекции', id: 'NFT ID', check: 'Проверить', busy: 'Проверка…', free: 'Питомец по этой NFT ещё доступен', used: 'По этой NFT питомец уже выдан', hint: 'Проверяй до покупки. Статус может измениться до выдачи. Один питомец на игрока и кошелёк; одна NFT используется один раз.', error: 'Не удалось проверить. Попробуй снова; это не подтверждение доступности.' },
  en: { title: 'NFT → pet eligibility', contract: 'Collection contract', id: 'NFT ID', check: 'Check', busy: 'Checking…', free: 'This NFT has an unused pet reward', used: 'This NFT has already redeemed its pet', hint: 'Check before buying. Status can change before issuance. One pet per player and wallet; each NFT can be redeemed once.', error: 'Unable to check. Please retry; availability has not been confirmed.' },
};
export default function NftPetCheck() {
  const params = new URLSearchParams(window.location.search);
  const [lang, setLang] = useState('uk');
  const [contract, setContract] = useState(params.get('contract') || '');
  const [tokenId, setTokenId] = useState(params.get('tokenId') || '');
  const [busy, setBusy] = useState(false), [result, setResult] = useState(null), [error, setError] = useState(false);
  const t = copy[lang];
  const check = async e => {
    e.preventDefault(); setBusy(true); setResult(null); setError(false);
    try {
      const response = await fetch(`/api/holder-pet-status?${new URLSearchParams({contract:contract.trim(),tokenId:tokenId.trim()})}`, { cache: 'no-store' });
      const json = await response.json(); if (!response.ok) throw new Error('Check failed'); setResult(json.data);
    } catch { setError(true); } finally { setBusy(false); }
  };
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#0a110a] p-5 text-[#e2f4d4]"><div className="w-full max-w-lg space-y-5 rounded-xl border border-[#28ee90] p-5"><div className="flex justify-end gap-3">{['uk','ru','en'].map(code => <button key={code} onClick={() => setLang(code)} className={lang === code ? 'text-lime-300' : 'text-slate-400'}>{code.toUpperCase()}</button>)}</div><h1 className="text-xl font-bold">{t.title}</h1><form onSubmit={check} className="space-y-4"><label className="block text-sm">{t.contract}<input required disabled={busy} maxLength={64} value={contract} onChange={e => {setContract(e.target.value);setResult(null);setError(false);}} className="mt-1 w-full rounded border border-white/20 bg-black/30 p-3" /></label><label className="block text-sm">{t.id}<input required disabled={busy} maxLength={512} value={tokenId} onChange={e => {setTokenId(e.target.value);setResult(null);setError(false);}} className="mt-1 w-full rounded border border-white/20 bg-black/30 p-3" /></label><button disabled={busy} className="w-full rounded bg-lime-400 p-3 font-bold text-black disabled:opacity-50">{busy ? t.busy : t.check}</button></form>{result && <p role="status" className={result.claimed || result.unknown ? 'text-amber-300' : 'text-emerald-300'}>{result.claimed ? t.used : result.unknown ? t.error : t.free}</p>}{error && <p role="alert" className="text-amber-300">{t.error}</p>}<p className="text-sm text-slate-400">{t.hint}</p></div></main>;
}
