import React from 'react';
import { useAnimationsEnabled } from '@/lib/animationPreference.js';
import './RaidBossTwo.css';

export function RaidBossTwoBackground() {
  const animationsOn = useAnimationsEnabled();
  return <div className={`rb2-background${animationsOn ? ' is-animated' : ''}`} aria-hidden="true">
    <div className="rb2-arena-plane">
      <img src="/friday13/arena.webp" alt="" />
      {animationsOn && <svg className="rb2-forest-eyes" viewBox="0 0 720 1280" aria-hidden="true">
        <g style={{animationDelay:'-1.2s'}}><ellipse cx="148.5" cy="209.5" rx="2" ry="2.3"/><ellipse cx="155.5" cy="210" rx="2" ry="2.3"/></g>
        <g style={{animationDelay:'-3.7s'}}><ellipse cx="213.5" cy="292.5" rx="2" ry="2.3"/><ellipse cx="220.5" cy="293" rx="2" ry="2.3"/></g>
        <g style={{animationDelay:'-2.4s'}}><ellipse cx="187.5" cy="387.5" rx="2" ry="2"/><ellipse cx="194.5" cy="387.5" rx="1.5" ry="2"/></g>
      </svg>}
    </div>
    {animationsOn && <div className="rb2-fog-field"><i /><i /><i /><i /><i /><i /></div>}
    {animationsOn && <div className="rb2-lake-shimmer" />}
    {animationsOn && <span className="rb2-moon-haze" />}
  </div>;
}

export function RaidBossTwo({ hitToken }) {
  const animationsOn = useAnimationsEnabled();
  return <div className={`rb2-composite${animationsOn ? ' is-animated' : ''}`} aria-label="Raid Boss" data-hit-token={hitToken || ''}>
    <img className="rb2-boss-body" src="/friday13/raid-boss-body-v3.webp" alt="" />
    <img className={`rb2-boss-hand${animationsOn ? ' is-animated' : ''}`} src="/friday13/raid-boss-hand-v1.webp" alt="" />
    <img className={`rb2-boss-head${animationsOn ? ' is-animated' : ''}`} src="/friday13/raid-boss-head-v2.webp" alt="Raid Boss" />
  </div>;
}

export function RaidBossTwoForeground() {
  const animationsOn = useAnimationsEnabled();
  return animationsOn ? <div className="rb2-front-fog" aria-hidden="true"><i/><i/><i/></div> : null;
}
