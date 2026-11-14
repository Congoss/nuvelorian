import { useEffect, useState } from 'react';
import { fishingBeaconState } from '@/lib/fishingBeacon.js';
import { serverNow } from '@/lib/serverClock.js';
import './chatBeacon.css';

const labels = {
  uk: { available: 'Рибалка доступна', bite: 'Риба клює!', ready: 'Час витягнути вудку', result: 'Новий результат рибалки' },
  ru: { available: 'Рыбалка доступна', bite: 'Рыба клюёт!', ready: 'Пора вытащить удочку', result: 'Новый результат рыбалки' },
  en: { available: 'Fishing available', bite: 'Fish is biting!', ready: 'Time to reel in', result: 'New fishing result' },
};

export default function FishingBeacon({ profile }) {
  const [state, setState] = useState(() => fishingBeaconState(profile, serverNow()));
  useEffect(() => {
    const update = () => { if (!document.hidden) setState(fishingBeaconState(profile, serverNow())); };
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [profile]);
  if (!state) return null;
  const label = (labels[profile?.language] || labels.uk)[state];
  return <span className="pointer-events-none absolute right-1 top-1 z-20" title={label}>
    <span className="chat-unread-beacon" role="img" aria-label={label} />
  </span>;
}
