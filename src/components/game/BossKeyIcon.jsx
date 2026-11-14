const DEFAULT_COLORS = {
  main: '#8A8F8D',
  hole: '#0A1008',
  glow: 'rgba(138,143,141,0.35)',
};

export const BOSS_KEY_COLORS = {
  1: { main: '#8A8F8D', hole: '#101510', glow: 'rgba(138,143,141,0.35)' },
  2: { main: '#4CAF50', hole: '#0E1A10', glow: 'rgba(76,175,80,0.35)' },
  3: { main: '#2F80ED', hole: '#0B1422', glow: 'rgba(47,128,237,0.35)' },
  4: { main: '#7B3FF2', hole: '#160D2A', glow: 'rgba(123,63,242,0.35)' },
  5: { main: '#FF3FA4', hole: '#2A1020', glow: 'rgba(255,63,164,0.35)' },
  6: { main: '#FF8A00', hole: '#2A1908', glow: 'rgba(255,138,0,0.35)' },
  7: { main: '#FFD700', hole: '#2A260A', glow: 'rgba(255,215,0,0.35)' },
  8: { main: '#FFD700', hole: '#2A260A', glow: 'rgba(255,215,0,0.35)' },
  9: { main: '#EF4444', hole: '#260B12', glow: 'rgba(239,68,68,0.35)' },
};

export function getBossKeyColors(rank = 1) {
  return BOSS_KEY_COLORS[rank] || DEFAULT_COLORS;
}

export default function BossKeyIcon({ rank = 1, className = '', title = 'Boss key' }) {
  const colors = getBossKeyColors(rank);
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`boss-key-glow-${rank}`} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor={colors.glow} />
        </filter>
      </defs>
      <g filter={`url(#boss-key-glow-${rank})`} transform="translate(8 8)">
        <circle cx="34" cy="10" r="10" fill={colors.main} />
        <circle cx="34" cy="10" r="4.6" fill={colors.hole} />
        <path
          d="M9 40 0 31l17-17 9 9-2.8 2.8 3.4 3.4-3.4 3.4-3.4-3.4-2.8 2.8 3.4 3.4-3.4 3.4-3.4-3.4L9 40Z"
          fill={colors.main}
        />
      </g>
    </svg>
  );
}
