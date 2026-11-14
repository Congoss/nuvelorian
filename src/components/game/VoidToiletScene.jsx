import { useEffect, useState } from 'react';
import background from '@/assets/IVENTS/void-flush/background.webp';
import toilet from '@/assets/IVENTS/void-flush/toilet.webp';
import foreground from '@/assets/IVENTS/void-flush/foreground.webp';
import tentacle from '@/assets/IVENTS/void-flush/mechanical-restraint.webp';
import './voidToiletScene.css';

export default function VoidToiletScene({ flushAnimation = 0, language = 'uk' }) {
  const [bursts, setBursts] = useState(null);
  useEffect(() => {
    if (!flushAnimation) return;
    setBursts(Array.from({ length: 5 }, () => ({ delay: Math.random() * .45, duration: .75 + Math.random() * .2 })));
    const timer = window.setTimeout(() => setBursts(null), 1450);
    return () => window.clearTimeout(timer);
  }, [flushAnimation]);
  return <div className="void-toilet-scene" role="img" aria-label={language === 'en' ? 'Void toilet with grasping animated tentacles' : language === 'ru' ? 'Унитаз бездны с хватающими щупальцами' : 'Унітаз безодні з хапальними щупальцями'}>
    <img src={background} alt="" className="void-toilet-layer" />
    <img src={toilet} alt="" className="void-toilet-layer" />
    <img src={foreground} alt="" className="void-toilet-layer" />
    {bursts && <div key={flushAnimation} className="void-tentacle-emergence">
      <div className="void-tentacle-rise">
        {bursts.map((burst, index) => <div key={index} className={`void-tentacle void-tentacle-${index}`} style={{ '--burst-delay': `${burst.delay}s`, '--burst-duration': `${burst.duration}s` }}><div className="void-tentacle-sprite" style={{ backgroundImage: `url(${tentacle})` }} /></div>)}
      </div>
    </div>}
    <img src={toilet} alt="" className="void-toilet-layer void-toilet-rim" />
  </div>;
}
