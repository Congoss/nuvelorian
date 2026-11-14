import { useId, useRef } from 'react';
import { useSceneAnimationsEnabled } from '@/lib/animationPreference';
import antenna from '@/assets/hero/hereearlypet/antena.webp';
import fire from '@/assets/hero/hereearlypet/fire.webp';
import fireMask from '@/assets/hero/hereearlypet/fire-interior-mask.webp';
import tail from '@/assets/hero/hereearlypet/hvost.webp';
import legs from '@/assets/hero/hereearlypet/legs.webp';
import glasses from '@/assets/hero/hereearlypet/ochky.webp';
import body from '@/assets/hero/hereearlypet/telo.webp';
import tooth from '@/assets/hero/hereearlypet/zub.webp';
import './hereEarlyPet.css';
import CoinFire from './CoinFire';

export default function HereEarlyPet({ className = '', closeup = false }) {
  const id = `here-pet-${useId().replaceAll(':', '')}`;
  const root = useRef(null);
  const enabled = useSceneAnimationsEnabled(root);
  return <svg ref={root} viewBox={closeup ? '15 493 200 346' : '0 0 500 896'} className={`here-early-pet pointer-events-none ${className}`} data-animated={enabled} role="img" aria-label="HERE Early Pet">
    <defs>
      <mask id={`${id}-coin-interior`} maskUnits="userSpaceOnUse" x="47" y="610" width="53" height="71" style={{ maskType: 'alpha' }}><image href={fireMask} x="47" y="610" width="53" height="71" /></mask>
      <clipPath id={`${id}-lenses`}><path d="M56 574 73 570 77 587 59 591Z M94 567 111 564 115 582 97 586Z" /></clipPath>
      <linearGradient id={`${id}-shine`}><stop stopColor="white" stopOpacity="0" /><stop offset=".5" stopColor="#fff9db" stopOpacity=".9" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>

    </defs>
    <g className="here-pet-tail"><image href={tail} x="129" y="692" width="72" height="70" /></g>
    <image data-pet-legs="static" href={legs} x="32" y="771" width="141" height="60" />
    <g className="here-pet-body">
      <image href={body} x="25" y="509" width="156" height="278" />
      <image href={fire} x="47" y="610" width="53" height="71" />
      {enabled && <g className="here-pet-burning-coin" mask={`url(#${id}-coin-interior)`}>
        <foreignObject x="47" y="610" width="53" height="71"><CoinFire /></foreignObject>
      </g>}
      <image href={glasses} x="52" y="560" width="67" height="37" />
      <g clipPath={`url(#${id}-lenses)`}><path className="here-pet-lens-shine" d="M32 553 45 553 64 602 51 602Z" fill={`url(#${id}-shine)`} /></g>
      <image href={antenna} x="150" y="509" width="10" height="10" />
      <g className="here-pet-signal" fill="none" stroke="#ffcc42" strokeWidth="1.4" strokeLinecap="round">
        <path d="M146 508 Q155 499 164 508 M141 503 Q155 489 169 503" />
      </g>
      <circle className="here-pet-antenna-glow" cx="155" cy="514" r="3" fill="#fff1a3" />
      <image href={tooth} x="115" y="597" width="11" height="12" />
      <g transform="translate(121 601)"><path className="here-pet-tooth-shine" d="M0-8 1.7-1.7 8 0 1.7 1.7 0 8-1.7 1.7-8 0-1.7-1.7Z" fill="#fff" stroke="#d7f8ff" strokeWidth=".55" /></g>
    </g>
  </svg>;
}
