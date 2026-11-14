import pet from '@/assets/hero/accessories/raidboss2-pet.png';
import yellowMask from '@/assets/hero/accessories/raidboss2-pet-yellow-mask.png';
import { useEffect, useId, useRef, useState } from 'react';
import { useAnimationsEnabled } from '@/lib/animationPreference';
import './raidScarecrowPet.css';

const BOLTS = ['M65 728 82 734 74 739 97 744 90 750 119 746 128 754', 'M111 758 98 772 115 777 103 790 126 796 111 809 136 819 127 831', 'M64 791 80 802 72 809 95 816 84 824 111 829', 'M151 779 137 788 148 795 133 807 156 815'];

export default function RaidScarecrowPet({ className = '' }) {
  const maskId = `raid-pet-yellow-${useId().replaceAll(':', '')}`;
  const root = useRef(null);
  const enabled = useAnimationsEnabled();
  const [burst, setBurst] = useState(null);
  useEffect(() => {
    let timer;
    let visible = true;
    let sequence = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const schedule = () => {
      clearTimeout(timer);
      if (!enabled || !visible || document.hidden || reducedMotion.matches) return;
      timer = setTimeout(() => {
        const paths = BOLTS.filter((_, i) => i === sequence % BOLTS.length || Math.random() < .4)
          .map(path => path.replace(/\d+/g, number => String(Number(number) + Math.round((Math.random() - .5) * 8))));
        setBurst({ id: ++sequence, paths, duration: 180 + Math.random() * 420, double: Math.random() < .45 });
        schedule();
      }, 1800 + Math.random() * 5400);
    };
    const sync = () => { setBurst(null); schedule(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', sync); reducedMotion.removeEventListener('change', sync); };
  }, [enabled]);
  return <svg ref={root} viewBox="0 0 500 896" preserveAspectRatio="xMidYMid meet" className={`raid-scarecrow-pet pointer-events-none ${className}`} role="img" aria-label="Рейдове опудало">
    <defs><mask id={maskId} x="0" y="0" width="500" height="896" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}><image href={yellowMask} width="500" height="896" /></mask></defs>
    <g className="raid-pet-idle">
    <image href={pet} width="500" height="896" />
    {enabled && burst && <g key={burst.id} mask={`url(#${maskId})`} style={{ '--raid-burst-duration': `${burst.duration}ms` }} className={burst.double ? 'raid-pet-double' : ''}>
    <g className="raid-pet-lightning" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {burst.paths.map(d => <path key={d} d={d} />)}
    </g>
    <g className="raid-pet-lightning raid-pet-lightning-core" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {burst.paths.map(d => <path key={d} d={d} />)}
    </g>
    </g>}
    </g>
  </svg>;
}
