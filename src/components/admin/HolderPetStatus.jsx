const copy = {
  uk: { wallet: 'Статус видачі пета', yes: 'Видано', no: 'Не видано', unknown: 'Не перевірено', nfts: 'NFT → пет', used: 'Пета вже видано', free: 'Пет доступний', refresh: 'Потрібна нова перевірка', verify: 'Підтвердіть володіння гаманцем' },
  ru: { wallet: 'Статус выдачи питомца', yes: 'Выдан', no: 'Не выдан', unknown: 'Не проверено', nfts: 'NFT → питомец', used: 'Питомец уже выдан', free: 'Питомец доступен', refresh: 'Нужна новая проверка', verify: 'Подтвердите владение кошельком' },
  en: { wallet: 'Pet issuance status', yes: 'Issued', no: 'Not issued', unknown: 'Not checked', nfts: 'NFT → pet', used: 'Pet already issued', free: 'Pet available', refresh: 'Check again', verify: 'Verify wallet ownership' },
};
export default function HolderPetStatus({ holder, lang }) {
  const t = copy[lang] || copy.en;
  const unknown = holder.stale || holder.walletPetGranted == null;
  return <div className="mt-2 min-w-48 space-y-1 text-xs">
    <p className={holder.walletPetGranted ? 'text-emerald-300' : unknown ? 'text-amber-300' : 'text-slate-300'}>{t.wallet}: {holder.walletPetGranted ? t.yes : unknown ? t.unknown : t.no}</p>
    {!holder.walletVerified && <p className="text-amber-300">{t.verify}</p>}
    {holder.stale || holder.legacyNftClaimsUnknown || !Array.isArray(holder.petTokens) ? <p className="text-amber-300">{holder.legacyNftClaimsUnknown ? (lang === 'uk' ? 'Старі видачі без NFT-ID: потрібна звірка' : lang === 'ru' ? 'Старые выдачи без NFT-ID: нужна сверка' : 'Historical grants lack NFT IDs: reconciliation required') : t.refresh}</p> : <details><summary className="cursor-pointer">{t.nfts} · {holder.availablePetNfts || 0}/{holder.petTokens.length}</summary><ul className="mt-1 max-h-40 space-y-1 overflow-auto">{holder.petTokens.map(token => <li key={token.tokenId} className="break-all"><span className="font-mono">{token.tokenId}</span> — <span className={token.claimed ? 'text-amber-300' : 'text-emerald-300'}>{token.claimed ? t.used : t.free}</span></li>)}</ul></details>}
  </div>;
}
