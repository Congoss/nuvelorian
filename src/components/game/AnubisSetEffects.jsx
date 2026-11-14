import { useEffect, useId, useState } from 'react';
import './AnubisSetEffects.css';

export default function AnubisSetEffects({ slots, frontMask = false }) {
  const id = useId().replace(/:/g, '');
  const [glint, setGlint] = useState(null);
  const [exhale, setExhale] = useState(0);
  useEffect(() => {
    if (!slots.head || frontMask) return;
    let timer;
    const next = () => {
      setExhale(value => value + 1);
      timer = setTimeout(next, 4500 + Math.random()*4000);
    };
    timer = setTimeout(next, 1800);
    return () => clearTimeout(timer);
  }, [slots.head, frontMask]);
  useEffect(() => {
    const candidates = [
      ...(slots.head ? [[194,31],[292,91]] : []),
      ...(slots.armor ? [[184,196],[329,196],[235,207],[275,211],[273,385],[217,632],[299,632]] : []),
      ...(slots.hands ? [[168,411],[338,411]] : []),
      ...(slots.boots ? [[205,785],[298,785]] : []),
    ];
    let timer;
    const next = () => {
      if (!candidates.length) return;
      const [x,y] = candidates[Math.floor(Math.random()*candidates.length)];
      setGlint({x,y,key:Math.random()});
      timer = setTimeout(next, 1900+Math.random()*1500);
    };
    timer = setTimeout(next, 500);
    return () => clearTimeout(timer);
  }, [slots]);
  const gems = [
    ...(slots.head ? [frontMask ? [251, 82, 7] : [300, 107, 6]] : []),
    ...(slots.armor ? [[256, 219, 7], [217, 632, 7], [299, 632, 7]] : []),
    ...(slots.hands ? [[168, 435, 5], [338, 435, 5]] : []),
  ];
  return <div className="anubis-effects" aria-hidden="true">
    <svg viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="anubis-effects-canvas">
      <defs>
        <radialGradient id={`${id}-gem`}><stop stopColor="#eaffff" stopOpacity=".9" /><stop offset=".35" stopColor="#47fff0" stopOpacity=".5" /><stop offset="1" stopColor="#00e4ff" stopOpacity="0" /></radialGradient>
        <clipPath id={`${id}-orb`}><ellipse cx="428" cy="64" rx="19" ry="13" /></clipPath>
        <linearGradient id={`${id}-fire`} x1="0" y1="1" x2="0" y2="0"><stop stopColor="white" /><stop offset=".55" stopColor="#e8ffff" stopOpacity=".9" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${id}-gold`}><stop stopColor="#fffef0" stopOpacity=".95" /><stop offset=".22" stopColor="#ffe693" stopOpacity=".7" /><stop offset="1" stopColor="#ffcf52" stopOpacity="0" /></radialGradient>
      </defs>
      {gems.map(([x,y,r], i) => <g key={i}>
        <g className="anubis-gem-pulse" style={{ animationDelay: `${i * -1.3}s` }}><circle cx={x} cy={y} r={r*2.5} fill={`url(#${id}-gem)`} /><ellipse cx={x} cy={y} rx={r*.7} ry={r} fill="#64ffec" opacity=".2" /></g>
        <g transform={`translate(${x} ${y})`}><g className="anubis-gem-energy" style={{animationDelay:`${i*-1.7}s`}}><ellipse rx={r*.7} ry={r*.35} fill="none" stroke="#e5ffff" strokeWidth=".5" opacity=".4" /><circle cx={r*.6} cy="0" r=".8" fill="white" opacity=".7" /></g></g>
      </g>)}
      {glint ? <g key={glint.key} className="anubis-random-glint" transform={`translate(${glint.x} ${glint.y})`}><circle r="14" fill={`url(#${id}-gold)`} /><path d="M-9 0H9M0-9V9" stroke="#fff7d6" strokeWidth="1.25" /><path d="M-4-4L4 4M-4 4L4-4" stroke="#ffe9a4" strokeWidth=".8" /><circle r="2" fill="white" /></g> : null}
      {slots.head ? (frontMask ? [[218,125,1],[297,125,1]] : [[268,130,1],[322,135,.65]]).map(([x,y,scale],i)=><g key={`eye-${i}`} transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse className="anubis-eye-glow" rx="10" ry="4" fill="white" />
        <g className="anubis-eye-flame" style={{animationDelay:`${i*-.37}s`}}>
          <path d="M-7 1C-11-8 2-14-4-29C8-23 1-13 8-18C14-8 9-4 6 1Z" fill={`url(#${id}-fire)`}>
            <animate attributeName="d" dur={`${4.8+i*.7}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;.33;.66;1" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1" values="M-7 1C-11-8 2-14-4-29C8-23 1-13 8-18C14-8 9-4 6 1Z;M-7 1C-13-7-5-18 1-32C11-19 3-13 10-20C12-9 10-3 6 1Z;M-7 1C-9-9 5-16 7-28C10-21-3-12 6-16C13-7 9-2 6 1Z;M-7 1C-11-8 2-14-4-29C8-23 1-13 8-18C14-8 9-4 6 1Z" />
          </path>
          <path d="M-4 1C-7-6 1-11-1-18C6-13 8-5 4 1Z" fill="white" opacity=".8">
            <animate attributeName="d" dur={`${3.9+i*.8}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".42 0 .58 1;.42 0 .58 1" values="M-4 1C-7-6 1-11-1-18C6-13 8-5 4 1Z;M-4 1C-6-7-3-12 3-21C7-13 5-5 4 1Z;M-4 1C-7-6 1-11-1-18C6-13 8-5 4 1Z" />
          </path>
        </g>
      </g>) : null}
      {slots.weapon ? <g className="anubis-weapon-motion">
        <g clipPath={`url(#${id}-orb)`}>
          <g className="anubis-galaxy-spin">
            {[0,60,120].map(angle => <ellipse key={angle} cx="428" cy="64" rx="16" ry="6" transform={`rotate(${angle} 428 64)`} fill="none" stroke={angle===60?'#e27dff':'#9bffff'} strokeWidth=".7" opacity=".55" />)}
            <circle cx="433" cy="57" r="1.4" fill="white" /><circle cx="416" cy="67" r="1" fill="#a5ffff" />
          </g>
        </g>
        <circle className="anubis-gem-pulse" cx="428" cy="64" r="21" fill={`url(#${id}-gem)`} opacity=".45" />
        {[[415,44],[451,63],[404,80],[86,48],[65,88]].map(([x,y],i)=><path key={i} className="anubis-star" style={{animationDelay:`${i*-.9}s`}} d={`M${x-3},${y}h6M${x},${y-3}v6`} stroke="#fff1b1" strokeWidth=".8" />)}
      </g> : null}
      {slots.head && !frontMask && exhale > 0 ? <g key={`exhale-${exhale}`} transform="translate(344 174) rotate(30)">
        <g className="anubis-nose-breath"><ellipse cx="15" cy="0" rx="16" ry="3" fill="white" opacity=".65" /><ellipse cx="28" cy="0" rx="13" ry="5" fill="#e5faff" opacity=".35" /></g>
        <g className="anubis-nose-breath anubis-nose-breath-second"><ellipse cx="16" cy="3" rx="14" ry="2.5" fill="white" opacity=".5" /></g>
      </g> : null}
    </svg>
  </div>;
}
