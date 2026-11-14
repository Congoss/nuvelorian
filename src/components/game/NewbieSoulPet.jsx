import petArt from '@/assets/hero/newbie-soul1.png';
import petEye from '@/assets/hero/newbie-soul-eye1.png';

export default function NewbieSoulPet({ className = '', label = 'Mr.Newbie', animated = true, fullCanvas = false }) {
  const positioningClass = /\babsolute\b/.test(className) ? '' : 'relative';
  return (
    <div className={`${positioningClass} isolate ${fullCanvas ? '' : 'aspect-[5/7]'} overflow-visible ${className}`} role="img" aria-label={label}>
      <div className={`absolute inset-0 ${animated ? 'newbie-soul-float' : ''}`}>
        {fullCanvas ? <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-[500/896] w-full max-h-full -translate-x-1/2 -translate-y-1/2">
            <span aria-hidden="true" className={`newbie-soul-glow${animated ? '' : ' newbie-soul-glow-static'} absolute left-[59%] top-[58%] h-[36%] w-[40%] rounded-full`} />
            {animated ? <span aria-hidden="true" className="newbie-soul-eyelid absolute left-[79.8%] top-[64.85%] h-[2.45%] w-[4%]" /> : null}
          </div>
          <img src={petArt} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_5px_rgba(43,237,255,.9)] drop-shadow-[0_0_13px_rgba(25,215,255,.55)]" />
          {animated ? <img src={petEye} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" /> : null}
        </> : <>
          <span aria-hidden="true" className={`newbie-soul-glow${animated ? '' : ' newbie-soul-glow-static'} pointer-events-none absolute inset-[-10%] rounded-full`} />
          <img src={petArt} alt="" aria-hidden="true" className="absolute left-[-150%] top-[-192.14%] h-[320%] w-[250%] max-w-none object-fill drop-shadow-[0_0_5px_rgba(43,237,255,.9)] drop-shadow-[0_0_13px_rgba(25,215,255,.55)]" />
          {animated ? <>
            <img src={petEye} alt="" aria-hidden="true" className="absolute left-[-150%] top-[-192.14%] h-[320%] w-[250%] max-w-none object-fill" />
            <span aria-hidden="true" className="newbie-soul-eyelid absolute left-[48.5%] top-[15.36%] h-[7.86%] w-[10%]" />
          </> : null}
        </>}
      </div>
    </div>
  );
}
