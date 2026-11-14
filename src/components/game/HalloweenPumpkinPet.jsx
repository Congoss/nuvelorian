import { useEffect, useId, useState } from 'react';
import pet from '@/assets/hero/halloween-set/hellow-pet.png';
import eyeBase from '@/assets/hero/halloween-set/hellow-set-eye-baza.png';
import eyeClip from '@/assets/hero/halloween-set/hellow-set-eyeclip.png';
import pupil from '@/assets/hero/halloween-set/hellow-set-zrachok.png';

export default function HalloweenPumpkinPet({ className = '' }) {
  const eyeMaskId = `pumpkin-eye-${useId().replaceAll(':', '')}`;
  const [jumping, setJumping] = useState(false);

  useEffect(() => {
    let jumpTimer;
    let resetTimer;
    const schedule = () => {
      jumpTimer = window.setTimeout(() => {
        setJumping(true);
        resetTimer = window.setTimeout(() => {
          setJumping(false);
          schedule();
        }, 900);
      }, 1800 + Math.random() * 3000);
    };
    schedule();
    return () => { window.clearTimeout(jumpTimer); window.clearTimeout(resetTimer); };
  }, []);

  const layer = 'absolute inset-0 h-full w-full object-contain object-bottom select-none';
  return (
    <div className={`pointer-events-none ${className}`} aria-label="Pumpkin Frankie">
      <div className={`absolute inset-0 origin-bottom ${jumping ? 'halloween-pet-jump' : ''}`}>
        <img src={pet} alt="" className={layer} draggable="false" />
        <img src={eyeBase} alt="" className={layer} draggable="false" />
        <div className="absolute inset-0" style={{ maskImage:`url("${eyeBase}")`, WebkitMaskImage:`url("${eyeBase}")`, maskSize:'contain', WebkitMaskSize:'contain', maskPosition:'center bottom', WebkitMaskPosition:'center bottom', maskRepeat:'no-repeat', WebkitMaskRepeat:'no-repeat' }}>
          <img src={pupil} alt="" className={`${layer} halloween-pet-pupil`} draggable="false" />
        </div>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 950" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <defs>
            <mask id={eyeMaskId} maskUnits="userSpaceOnUse" x="206" y="790" width="51" height="56" style={{ maskType: 'alpha' }}>
              <image href={eyeClip} width="500" height="950" />
            </mask>
          </defs>
          <image href={eyeClip} width="500" height="950" />
          <g mask={`url(#${eyeMaskId})`}>
            <g fill="#f47719" stroke="#90350e" strokeWidth="1.5">
              <path className="halloween-pet-upper-lid" d="M204 787H259V818Q232 822 204 818Z" />
              <path className="halloween-pet-lower-lid" d="M204 818Q232 822 259 818V849H204Z" />
            </g>
          </g>
        </svg>
      </div>
      <style>{`
        @keyframes halloween-pet-jump { 0%{transform:translateY(0) scale(1)} 12%{transform:translateY(2%) scaleX(1.13) scaleY(.84)} 28%{transform:translateY(-12%) scaleX(.91) scaleY(1.16)} 52%{transform:translateY(-17%) scaleX(.88) scaleY(1.2)} 76%{transform:translateY(-4%) scaleX(.96) scaleY(1.06)} 88%{transform:translateY(1%) scaleX(1.16) scaleY(.8)} 100%{transform:translateY(0) scale(1)} }
        @keyframes halloween-pet-look { 0%,12%,100%{transform:translateX(0)} 24%,40%{transform:translateX(-5px)} 55%,72%{transform:translateX(5px)} 84%{transform:translateX(1px)} }
        @keyframes halloween-pet-upper-blink { 0%,43%,49%,100%{transform:translateY(-34px)} 45%,47%{transform:translateY(0)} }
        @keyframes halloween-pet-lower-blink { 0%,43%,49%,100%{transform:translateY(34px)} 45%,47%{transform:translateY(0)} }
        .halloween-pet-jump{animation:halloween-pet-jump .9s cubic-bezier(.24,.72,.3,1)}
        .halloween-pet-pupil{animation:halloween-pet-look 5.4s ease-in-out infinite}
        .halloween-pet-upper-lid{animation:halloween-pet-upper-blink 4.8s ease-in-out infinite}
        .halloween-pet-lower-lid{animation:halloween-pet-lower-blink 4.8s ease-in-out infinite}
      `}</style>
    </div>
  );
}
