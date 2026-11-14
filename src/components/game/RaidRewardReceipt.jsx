import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { currentRaidRewardReceipt } from '@/lib/raidRewardReceipt';
import { PersonalRewardContent } from './RaidRankPrizes';

export default function RaidRewardReceipt({ profile, automatic = false }) {
  const receipt = currentRaidRewardReceipt(profile);
  const key = `p4-raid-reward-seen:${profile?.id}:${receipt?.encounter}`;
  const [dismissed, setDismissed] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  let seen = false;
  try { seen = localStorage.getItem(key) === '1'; } catch { /* Session dismissal still works. */ }
  if (!receipt) return null;
  const language = profile.language || 'uk';
  const text = (uk, ru, en) => language === 'ru' ? ru : language === 'en' ? en : uk;
  const open = automatic ? dismissed !== key && !seen : manualOpen;
  const close = () => {
    setManualOpen(false);
    setDismissed(key);
    try { localStorage.setItem(key, '1'); } catch { /* Keep the replay available. */ }
  };
  return <Dialog.Root open={open} onOpenChange={value => value ? setManualOpen(true) : close()}>
    {!automatic && <Dialog.Trigger asChild><button type="button" className="mb-3 w-full rounded border border-[#d4ac45] bg-[#2a220d] p-3 text-xs font-black text-[#ffe196]">{text('Рейд: отримані нагороди', 'Рейд: полученные награды', 'Raid: received rewards')}</button></Dialog.Trigger>}
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[260] bg-black/80"/><Dialog.Content className="fixed left-1/2 top-1/2 z-[261] grid max-h-[85dvh] w-[calc(100%-24px)] max-w-[390px] -translate-x-1/2 -translate-y-1/2 gap-3 overflow-y-auto border border-[#28ee90] bg-[#10170d] p-4 text-[#eff7d1]">
      <PersonalRewardContent rank={receipt.rank} reward={receipt.reward} language={language} received />
      <p className="text-xs">{text('Таблички: налаштування → Рамки профілю → Надягнути. Кланова табличка відображається в рейтингу кланів.', 'Таблички: настройки → Рамки профиля → Надеть. Клановая табличка отображается в рейтинге кланов.', 'Nameplates: settings → Profile frames → Equip. Clan nameplates appear in the clan ranking.')}</p>
      <Dialog.Close className="min-h-11 rounded border border-[#28ee90] text-sm font-bold">{text('Закрити', 'Закрыть', 'Close')}</Dialog.Close>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
