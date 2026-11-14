import { useId } from 'react';
import './localRabbitHeadEffects.css';

export default function LocalRabbitHeadEffects({ active }) {
  const id = useId().replace(/:/g, '');
  if (!active) return null;
  return <g className="rabbit-head-effects" aria-hidden="true" pointerEvents="none">
    <defs>
      <clipPath id={`${id}-eyes`}><rect x="204" y="52" width="54" height="54" /><rect x="298" y="56" width="55" height="54" /></clipPath>
      <clipPath id={`${id}-visor`}><path d="M194 37 358 48 351 123 193 112Z" /></clipPath>
      <clipPath id={`${id}-teeth`}><path d="M255 149 286 151 284 166 257 164Z" /></clipPath>
    </defs>
    <g clipPath={`url(#${id}-eyes)`}>
      <image className="rabbit-eye-pulse" href="/local-rabbit/head.webp" x="0" y="-224" width="500" height="1120" />
      <image className="rabbit-eye-glitch" href="/local-rabbit/head.webp" x="0" y="-224" width="500" height="1120" />
    </g>
    <g clipPath={`url(#${id}-visor)`}><path className="rabbit-visor-scan" d="M190 40H363" stroke="#ffb8ac" strokeWidth="2" /></g>
    <g clipPath={`url(#${id}-teeth)`}><path className="rabbit-tooth-sheen" d="M240 143 248 143 269 172 261 172Z" fill="#fff" /></g>
    <path className="rabbit-tooth-spark" d="M273 149v12m-6-6h12m-10-4 8 8m0-8-8 8" fill="none" stroke="#fffceb" strokeWidth="1.5" strokeLinecap="round" />
  </g>;
}
