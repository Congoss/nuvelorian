import React from 'react';

const FRAME = {
  friday13_player_1: { ink: '#141315', main: '#bde945', dark: '#34542b', mark: 'I', shape: 'jagged' },
  friday13_player_2: { ink: '#17151a', main: '#b8c4d7', dark: '#3a4050', mark: 'II', shape: 'round' },
  friday13_player_3: { ink: '#17151a', main: '#d89a55', dark: '#5f3824', mark: 'III', shape: 'round' },
  friday13_guild_1: { ink: '#101411', main: '#82e85b', dark: '#23513a', mark: 'G1', shape: 'jagged' },
  friday13_guild_2: { ink: '#17131c', main: '#c477ef', dark: '#54336c', mark: 'G2', shape: 'round' },
  friday13_guild_3: { ink: '#151317', main: '#f06460', dark: '#673238', mark: 'G3', shape: 'jagged' },
};

export default function Friday13AvatarFrame({ frameId, alt = '' }) {
  const style = FRAME[frameId];
  if (!style) return null;
  const points = style.shape === 'jagged'
    ? '64,3 79,8 92,5 99,17 113,19 115,34 125,43 120,57 126,70 118,82 121,98 106,104 101,119 85,117 72,126 59,119 43,124 36,111 20,108 21,92 7,83 12,68 4,55 13,43 10,28 25,22 33,9 48,13'
    : '64,3 82,7 96,8 101,21 116,28 115,43 125,54 120,68 124,84 112,95 106,111 88,113 73,125 57,120 41,124 32,111 16,106 15,91 4,80 10,65 3,51 13,39 13,24 29,20 39,8 52,12';
  return <svg className="friday13-avatar-frame pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 128 128" role="img" aria-label={alt}>
    <polygon points={points} fill={style.ink} stroke={style.ink} strokeWidth="6" strokeLinejoin="round" />
    <polygon points={points} fill="none" stroke={style.main} strokeWidth="4" strokeLinejoin="round" />
    <path d="M24 26 Q64 10 104 26 L105 42 Q64 28 23 43Z" fill={style.dark} stroke={style.ink} strokeWidth="3" />
    <path d="M23 89 Q64 102 105 89 L103 103 Q64 117 25 103Z" fill={style.dark} stroke={style.ink} strokeWidth="3" />
    <path d="M12 64h10m84 0h10M64 8v9m0 94v9" stroke={style.main} strokeWidth="3" strokeLinecap="round" />
    <circle cx="18" cy="18" r="4" fill={style.main} stroke={style.ink} strokeWidth="2" />
    <circle cx="110" cy="18" r="4" fill={style.main} stroke={style.ink} strokeWidth="2" />
    <circle cx="18" cy="110" r="4" fill={style.main} stroke={style.ink} strokeWidth="2" />
    <circle cx="110" cy="110" r="4" fill={style.main} stroke={style.ink} strokeWidth="2" />
    <text x="64" y="39" fill={style.main} stroke={style.ink} strokeWidth="1.5" paintOrder="stroke" textAnchor="middle" fontFamily="monospace" fontWeight="1000" fontSize="12">13</text>
    <text x="64" y="100" fill="#fff4d7" stroke={style.ink} strokeWidth="1.5" paintOrder="stroke" textAnchor="middle" fontFamily="monospace" fontWeight="1000" fontSize="10">{style.mark}</text>
  </svg>;
}
