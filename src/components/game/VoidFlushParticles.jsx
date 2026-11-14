import PumpkinIcon from './PumpkinIcon';
import { getResourceIcon } from '@/lib/resourceIcons';

export default function VoidFlushParticles({ flight }) {
  const icon = getResourceIcon(flight.resource === 'tentacles' ? 'tentacles' : 't-pape');
  return <div aria-hidden="true">
    {Array.from({ length: 6 }, (_, index) => {
      const side = index % 2 ? 1 : -1;
      return <img key={index} src={icon} alt="" className="void-resource-flight" style={{ left: flight.x, top: flight.y, '--resource-x': `${side * flight.width * (.32 + (index % 3) * .05)}px`, '--resource-y': `${-flight.height * (.18 + (index % 3) * .08)}px`, '--resource-delay': `${index * .055}s`, '--resource-turn': `${side * 150}deg` }} />;
    })}
    <span className="void-ap-flight" style={{ left: flight.x, top: flight.y, '--flight-x': `${flight.dx}px`, '--flight-y': `${flight.dy}px` }}>
      {flight.pumpkins ? <PumpkinIcon className="h-10 w-10 object-contain" /> : <svg viewBox="0 0 48 48" width="40" height="40">
        <defs><linearGradient id="void-ap-token" x2="0" y2="1"><stop stopColor="#efff9c" /><stop offset="1" stopColor="#88bc1e" /></linearGradient></defs>
        <path d="M24 2 43 13v22L24 46 5 35V13Z" fill="url(#void-ap-token)" stroke="#e2ff73" strokeWidth="2" />
        <path d="M24 7 38 15v18L24 41 10 33V15Z" fill="#172609" stroke="#b7e943" />
        <text x="24" y="29" textAnchor="middle" fill="#dfff6b" fontFamily="Rubik, sans-serif" fontSize="15" fontWeight="900">AP</text>
      </svg>}
    </span>
  </div>;
}
