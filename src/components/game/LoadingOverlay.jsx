import { useMemo } from 'react';
import { APP_VERSION_LABEL } from '@/lib/appVersion';
import loadingSpaceBackground from '@/assets/optimized/all/loading/loading-background.webp';
import loadingPlanet360 from '@/assets/optimized/all/loading/pl360.webp';
import loadingEventPlanet360 from '@/assets/optimized/all/loading/pl360-event.webp';
import { halloweenActive } from '@/lib/halloweenEvent';
import loadingGreenPlanet from '@/assets/optimized/all/loading/green-planet-background.webp';
import loadingHero from '@/assets/optimized/all/loading/hero-loading.webp';
import loadingLogo from '@/assets/optimized/all/loading/NUVE-loading.webp';

export default function LoadingOverlay({ progress = 0, visible = true }) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const width = `${clamped}%`;
  const stars = useMemo(() => [
    [8, 16, 1.8, 0.2, '#b7f7ff'], [21, 28, 2.4, 1.1, '#d8b8ff'], [37, 12, 2.1, 0.7, '#8defff'],
    [54, 24, 2.8, 1.8, '#cbb4ff'], [72, 14, 1.6, 0.4, '#a9f7ff'], [89, 31, 2.3, 2.2, '#d7c0ff'],
    [14, 48, 2.6, 1.4, '#8defff'], [31, 61, 1.7, 2.8, '#d8b8ff'], [48, 43, 2.2, 0.9, '#b7f7ff'],
    [66, 55, 2.5, 1.7, '#cbb4ff'], [84, 64, 1.8, 2.5, '#8defff'], [7, 78, 2.1, 0.6, '#d7c0ff'],
    [27, 86, 2.7, 2.1, '#a9f7ff'], [58, 79, 1.6, 1.3, '#d8b8ff'], [78, 91, 2.4, 3.2, '#b7f7ff'],
    [4, 37, 1.9, 0.8, '#8defff'], [17, 7, 2.9, 2.4, '#d8b8ff'], [28, 39, 1.5, 1.6, '#b7f7ff'],
    [43, 5, 2.2, 3.4, '#a9f7ff'], [61, 36, 1.8, 0.3, '#d7c0ff'], [76, 45, 2.6, 2.7, '#8defff'],
    [94, 11, 1.7, 1.2, '#b7f7ff'], [92, 52, 2.5, 3.1, '#d8b8ff'], [11, 68, 2.1, 1.9, '#a9f7ff'],
    [39, 72, 2.8, 0.5, '#8defff'], [69, 73, 1.6, 2.6, '#d7c0ff'], [88, 82, 2.3, 1.5, '#b7f7ff'],
  ], []);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] overflow-hidden bg-black transition-opacity duration-500 ease-out ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="loading-stage absolute inset-0 m-auto" aria-hidden="true">
      <img
        src={loadingSpaceBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-fill"
        draggable="false"
      />
      <div className="absolute inset-0 z-[1]" aria-hidden="true">
        {stars.map(([left, top, duration, delay, color], index) => <i key={index} className="loading-star" style={{ left: `${left}%`, top: `${top}%`, width: `${index % 3 ? 3 : 4}px`, height: `${index % 3 ? 3 : 4}px`, background: color, animationDuration: `${duration}s`, animationDelay: `${delay}s` }} />)}
      </div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.4)_55%,rgba(0,0,0,0.72)_100%)]" />
      <div className="loading-planet-layer absolute inset-0 z-[2]" aria-hidden="true">
        <img src={halloweenActive() ? loadingEventPlanet360 : loadingPlanet360} alt="" className="loading-planet absolute left-4 top-[29%] h-auto w-[calc(100%-2rem)] object-contain" draggable="false" />
      </div>
      <img src={loadingGreenPlanet} alt="" aria-hidden="true" className="absolute inset-0 z-[3] h-full w-full object-fill" draggable="false" />
      <img src={loadingHero} alt="" aria-hidden="true" className="loading-hero absolute inset-0 z-[4] h-full w-full object-fill" draggable="false" />
      <img src={loadingLogo} alt="NUVELORIAN" aria-hidden="true" className="loading-logo absolute inset-0 z-[5] h-full w-full object-fill" draggable="false" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-center gap-1 px-4 pb-[max(8px,env(safe-area-inset-bottom,0px),var(--tg-safe-area-inset-bottom,0px))]">
        <div
          className="h-[12px] min-w-[160px] overflow-hidden rounded-full border-2 border-[#d8ff5a] bg-[#10180b]/90 shadow-[0_0_18px_rgba(216,255,90,.8)]"
          style={{ width: 'min(60vw, 360px)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width,
              backgroundImage: 'linear-gradient(90deg, #8CB138 0%, #94B83D 50%, #A9CB52 100%)',
              backgroundSize: '200% 100%',
              animation: 'loading-bar-shift 1.8s linear infinite',
              boxShadow: '0 0 12px rgba(148, 184, 61, 0.45)',
            }}
          />
        </div>
        <p className="text-center font-mono text-[10px] font-bold text-[#d8ff5a]">{APP_VERSION_LABEL}</p>
      </div>
      <style>{`
        .loading-stage { width: 100%; max-width: 520px; height: 100%; }
        .loading-star { position: absolute; border-radius: 999px; opacity: .3; box-shadow: 0 0 10px currentColor, 0 0 18px currentColor; animation: loading-star-twinkle ease-in-out infinite alternate; }
        .loading-planet { transform-origin: 50% 50%; animation: loading-planet-spin 40s linear infinite; }
        .loading-planet { filter: drop-shadow(0 0 8px rgba(82,234,255,.72)) drop-shadow(0 0 20px rgba(82,234,255,.42)); }
        .loading-hero { animation: loading-hero-breathe 4s ease-in-out infinite; }
        .loading-logo { animation: loading-logo-glow 4.5s ease-in-out infinite; }
        @keyframes loading-star-twinkle { from { opacity: .25; transform: scale(.8); } to { opacity: 1; transform: scale(1.25); } }
        @keyframes loading-planet-spin { to { transform: rotate(360deg); } }
        @keyframes loading-planet-glow { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .85; transform: scale(1.015); } }
        @keyframes loading-hero-breathe { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-1px) scale(1.003); } }
        @keyframes loading-logo-glow { 0%,100% { filter: drop-shadow(0 0 5px rgba(133,255,70,.25)); } 50% { filter: drop-shadow(0 0 12px rgba(133,255,70,.45)); } }
        @keyframes loading-bar-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @media (prefers-reduced-motion: reduce) { .loading-star, .loading-planet, .loading-hero, .loading-logo { animation: none; } }
      `}</style>
    </div>
  );
}


