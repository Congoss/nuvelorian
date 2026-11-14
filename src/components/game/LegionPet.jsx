import pet from '@/assets/hero/legion-pet/legion-pet.png';
import acid from '@/assets/hero/legion-pet/legion-pet-animacid.png';
import eye from '@/assets/hero/legion-pet/legion-pet-anim-eye.png';
import smoke from '@/assets/hero/legion-pet/legion-pet-anim-nose-smoke.png';
import { useId } from 'react';

export default function LegionPet({ className = '' }) {
  const eyeMask = `legion-eye-${useId().replaceAll(':', '')}`;
  return <svg viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className={`pointer-events-none ${className}`} role="img" aria-label="Legion Pet">
    <defs><mask id={eyeMask} maskUnits="userSpaceOnUse" x="70" y="566" width="19" height="20" style={{ maskType: 'alpha' }}><image href={eye} width="500" height="896" /></mask></defs>
    <image href={pet} width="500" height="896" />
    <image href={acid} width="500" height="896" className="legion-pet-acid" />
    <image href={eye} width="500" height="896" />
    <g mask={`url(#${eyeMask})`}>
      <path className="legion-pet-eye" d="M68 564H91V576Q79 581 68 576Z" fill="#4d9f8b" stroke="#173e36" strokeWidth="1" />
    </g>
    <image href={smoke} width="500" height="896" />
    <g transform="translate(36 573)" fill="none" stroke="#a8d9bd" strokeLinecap="round">
      <path className="legion-pet-smoke" d="M0 0C-5-5 3-9-1-15S-6-23-2-29" strokeWidth="3" />
      <path className="legion-pet-smoke" style={{ animationDelay: '1.8s' }} d="M3 0C8-6-3-11 2-18S7-25 3-31" strokeWidth="2" />
    </g>
    <style>{`
      @keyframes legion-acid-glow { 0%,100%{opacity:.52;filter:drop-shadow(0 0 1px #26ffd0)} 50%{opacity:1;filter:drop-shadow(0 0 7px #18ffd0) brightness(1.35)} }
      @keyframes legion-eye-blink { 0%,42%,48%,100%{transform:translateY(-14px)} 44%,46%{transform:translateY(9px)} }
      @keyframes legion-nose-smoke { 0%,34%{opacity:0;transform:translateY(0) scale(.4)} 44%{opacity:.65} 72%{opacity:.3} 88%,100%{opacity:0;transform:translateY(-14px) scale(1.2)} }
      .legion-pet-acid{animation:legion-acid-glow 2.2s ease-in-out infinite}
      .legion-pet-eye{animation:legion-eye-blink 4.7s ease-in-out infinite}
      .legion-pet-smoke{opacity:0;transform-origin:0 0;animation:legion-nose-smoke 3.6s ease-out infinite}
    `}</style>
  </svg>;
}
