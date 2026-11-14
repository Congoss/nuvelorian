import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&?';

export default function ScrambleLockHint({ text }) {
  const [displayText, setDisplayText] = useState(text);
  useEffect(() => {
    const startedAt = Date.now();
    const scramble = (revealed) => text.split('').map((character, index) => character === ' ' || index < revealed ? character : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]).join('');
    setDisplayText(scramble(0));
    const intervalId = window.setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / 1800, 1);
      setDisplayText(scramble(Math.floor(progress * (text.length + 3))));
      if (progress >= 1) window.clearInterval(intervalId);
    }, 70);
    return () => window.clearInterval(intervalId);
  }, [text]);
  return <span className="inline-flex items-center gap-2 px-3 py-2 font-jura text-[13px] font-bold uppercase leading-none tracking-[0.04em] text-[#ff3b30] opacity-100 [text-shadow:0_0_2px_#ff3b30,0_0_6px_rgba(255,59,48,0.55)]"><Lock className="h-4 w-4 shrink-0" />{displayText}</span>;
}
