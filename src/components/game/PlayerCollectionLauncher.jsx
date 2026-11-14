import { useAchievementLanguage } from '@/lib/useAchievementLanguage';
import awardsButton from '@/assets/ui/awards-button.webp';
// Ribbon shape shared by the Top and PvP strips: a thin banner, not a full nav icon, so a new
// permanent entry point does not add another big button to an already busy home screen.
function Ribbon({ onClick, label, title, fill, stroke, strokeLight, strokeDark, strip, text }) {
  return <button type="button" onClick={onClick} aria-label={title} title={title} className="group relative flex h-7 w-[100px] shrink-0 items-center justify-center overflow-visible transition hover:brightness-110 active:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4e99a]">
    <svg viewBox="0 0 132 36" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[1px_2px_1px_#0008]">
      <path d="M-6 4 34 3 38 5 81 3 86 5 113 4 126 15 123 19 127 22 116 32 76 31 72 33 29 31-6 33Z" fill={fill} stroke={stroke} strokeWidth="2.8" strokeLinejoin="round"/>
      <path d="m0 7 33-1 6 2 41-2 7 2 24-1 9 9M0 29l28-1 43 2 6-2 37 1 7-6" fill="none" stroke={strokeLight} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="m9 11 7-1m5 16 8 1m73-17 7 2m-11 14 7-2" stroke={strokeDark} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M-2 3 9 4 8 32-2 33Z" fill={strip} stroke={stroke} strokeWidth="1.7"/>
      <circle cx="4" cy="17" r="2.7" fill={strokeLight} stroke={strokeDark} strokeWidth="1.2"/>
      <path d="m2 18 4-2" stroke={strokeDark} strokeWidth="1.1"/>
    </svg>
    <span className="relative pl-2 pr-1 font-sans text-[10px] font-black uppercase leading-none tracking-[.03em] text-[#f0e8c6] [text-shadow:0_1px_2px_#101608]">{text ?? label}</span>
  </button>;
}
export default function PlayerCollectionLauncher({ language = 'uk', onClick, leaderboard = false, pvp = false }) {
  const lang = useAchievementLanguage(language);
  if (pvp) {
    const copy = {uk:['PvP','Дуелі проти ШІ-пілотів'],ru:['PvP','Дуэли против ИИ-пилотов'],en:['PvP','Duels against AI pilots']}[lang];
    return <Ribbon onClick={onClick} title={copy[1]} text={copy[0]} fill="#6b2a2a" stroke="#1d1212" strokeLight="#aa6a6a" strokeDark="#2b1a1a" strip="#8b4a3c" />;
  }
  const copy = leaderboard ? {uk:['Топ','Рейтинг гравців'],ru:['Топ','Рейтинг игроков'],en:['Top','Player leaderboard']}[lang] : { uk: ['Нагороди', 'Усі медалі й ачівки гравця'], ru: ['Награды', 'Все медали и достижения игрока'], en: ['Awards', 'All player medals and achievements'] }[lang];
  if(leaderboard)return <Ribbon onClick={onClick} title={copy[1]} text={copy[0]} fill="#59623b" stroke="#171d12" strokeLight="#a6aa72" strokeDark="#303b23" strip="#82764b" />;
  return <button type="button" onClick={onClick} aria-label={copy[1]} title={copy[1]} className="group relative flex h-9 w-[96px] shrink-0 items-center justify-center transition hover:brightness-110 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4e99a]">
    <img src={awardsButton} alt="" aria-hidden="true" draggable="false" className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-[0_2px_2px_#0008]" />
    <span className="relative -mt-1 pl-5 pr-2 text-[8px] font-black uppercase leading-none tracking-[0.02em] text-[#ecedce] [text-shadow:0_1px_2px_#000]">{copy[0]}</span>
  </button>;
}
