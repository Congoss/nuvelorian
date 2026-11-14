import { LOCAL_TV_CAPTIONS } from '@/lib/localTvChannels';

// Crisp vector lettering stays readable at the actual in-game screen size.
export default function LocalTvBroadcast({ channel }) {
  const caption = LOCAL_TV_CAPTIONS[channel.id];
  return <g pointerEvents="none">
    <rect width="1" height="1" fill="#182226" />
    <image href={channel.src} width="1" height="1" preserveAspectRatio="none" />
    {caption && <g>
      <rect y={caption.top} width="1" height={1 - caption.top} fill={caption.background} />
      {caption.lines.map((line, index) => <text key={line} x=".5" y={caption.lines.length === 1 ? (caption.top + 1) / 2 : .765 + index * .155} textAnchor="middle" dominantBaseline="central" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize={caption.size} fill={caption.color} stroke="#000" strokeWidth=".006" paintOrder="stroke" textLength={line.length > 8 ? .88 : undefined} lengthAdjust="spacingAndGlyphs">{line}</text>)}
    </g>}
  </g>;
}
