import './heroAccessory.css';

// The same 500×896 coordinate system and contain-fit as every hero layer.
// Accessory art replaces the head visually without changing equipped gear.
export default function HeroAccessory({ src }) {
  if (!src) return null;
  return <svg viewBox="0 0 500 896" preserveAspectRatio="xMidYMid meet" className="hero-accessory" role="img" aria-label="Корона чемпіона рейду">
    <g transform="translate(0 -4)">
      <image href={src} width="500" height="896" className="hero-crown-art" />
      {[{ x: 213, y: 26 }, { x: 293, y: 42 }, { x: 253, y: 65 }].map(({ x, y }, i) => <path key={i} d={`M${x-4} ${y}h8M${x} ${y-4}v8`} className="hero-crown-spark" style={{ animationDelay: `${i * -.9}s` }} />)}
    </g>
  </svg>;
}
