import { useRef, useState } from 'react';
import { claimNftHolderPet } from '@/services/gameApi';
import GameTextureButton from './GameTextureButton';
import { toast } from './use-toast';

const strings = {
  uk: { check: 'Перевірити NFT', busy: 'Перевіряємо NFT…', granted: 'Пета отримано! Тепер його можна одягнути.', owned: 'Пет уже у твоєму інвентарі.', wallet_required: 'Підключи NEAR-гаманець у профілі.', wallet_unverified: 'Підтвердь володіння NEAR-гаманцем у профілі.', already_claimed: 'Цей гравець або гаманець уже отримав пета.', no_nft: 'Потрібної NFT немає. Можеш придбати її на Hotcraft.', nft_used: 'За ці NFT пета вже отримали. Переказ NFT не скидає видачу.', not_configured: 'Видачу для цієї колекції ще не налаштовано.', history_unknown: 'Історія NFT потребує звірки адміністратором.', rpc_error: 'Не вдалося перевірити NFT. Спробуй пізніше.', buy: 'Відкрити Hotcraft', verify: 'Перевірити NFT перед купівлею' },
  ru: { check: 'Проверить NFT', busy: 'Проверяем NFT…', granted: 'Питомец получен! Теперь его можно надеть.', owned: 'Питомец уже в твоём инвентаре.', wallet_required: 'Подключи NEAR-кошелёк в профиле.', wallet_unverified: 'Подтверди владение NEAR-кошельком в профиле.', already_claimed: 'Этот игрок или кошелёк уже получил питомца.', no_nft: 'Нужной NFT нет. Можно купить её на Hotcraft.', nft_used: 'По этим NFT питомца уже получили. Передача NFT не сбрасывает выдачу.', not_configured: 'Выдача для этой коллекции ещё не настроена.', history_unknown: 'Историю NFT должен сверить администратор.', rpc_error: 'Не удалось проверить NFT. Попробуй позже.', buy: 'Открыть Hotcraft', verify: 'Проверить NFT перед покупкой' },
  en: { check: 'Check NFT', busy: 'Checking NFT…', granted: 'Pet received! You can now equip it.', owned: 'This pet is already in your inventory.', wallet_required: 'Connect a NEAR wallet in your profile.', wallet_unverified: 'Verify NEAR wallet ownership in your profile.', already_claimed: 'This player or wallet has already received the pet.', no_nft: 'The required NFT was not found. You can buy it on Hotcraft.', nft_used: 'These NFTs have already redeemed their pet. Transfers do not reset redemption.', not_configured: 'Rewards for this collection have not been configured yet.', history_unknown: 'An administrator must reconcile this collection’s history.', rpc_error: 'Unable to check NFTs. Please retry later.', buy: 'Open Hotcraft', verify: 'Check NFT before buying' },
};
export default function NftPetClaimButton({ item, language, onClaimed }) {
  const t = strings[language === 'ua' ? 'uk' : language] || strings.en;
  const [busy, setBusy] = useState(false), [result, setResult] = useState(null);
  const pending = useRef(false);
  const check = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setResult(null);
    try {
      const response = await claimNftHolderPet(item.id);
      setResult(response);
      if (['granted', 'owned'].includes(response.status)) {
        await onClaimed?.();
        toast({ title: t[response.status] });
      }
    } catch { setResult({ status: 'rpc_error' }); }
    finally { pending.current = false; setBusy(false); }
  };
  return <div className="mt-2 space-y-2" data-nft-pet-claim={item.id}>
    <GameTextureButton type="button" tone="green" disabled={busy} onClick={check} className="h-11 w-full"><span className="relative z-10 font-mono text-[11px] font-black uppercase text-[#15220b]">{busy ? t.busy : t.check}</span></GameTextureButton>
    {result && <p role="status" className="text-xs leading-relaxed text-[#d2e8bf]">{t[result.status] || t.rpc_error}</p>}
    {result && ['no_nft', 'nft_used'].includes(result.status) && <div className="flex flex-col gap-2 text-xs"><a className="text-[#8bff58] underline" href="https://hotcraft.art?ref=34725" target="_blank" rel="noopener noreferrer">{t.buy}</a>{result.contract && <a className="text-[#a9c88b] underline" href={`/nft-pet-check?contract=${encodeURIComponent(result.contract)}`} target="_blank" rel="noopener noreferrer">{t.verify}</a>}</div>}
  </div>;
}
