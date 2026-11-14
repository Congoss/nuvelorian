import { useEffect, useId, useRef, useState } from 'react';
import { LOCAL_TV_CHANNELS, nextTvChannel } from '@/lib/localTvChannels';
import './localTvHead.css';
import LocalTvBroadcast from './LocalTvBroadcast';
import { SHKRABAN_ROOT } from '@/lib/shkrabanContent';

// Original boss artwork, positioned in the existing rabbit-set hero coordinates.
export default function LocalTvHead({ active = true, channelIndex, onChannelChange, auto = true, hitToken = 0 }) {
  const id = useId().replace(/:/g, '');
  const [internalChannel, setInternalChannel] = useState(0);
  const lastHit = useRef(hitToken);
  useEffect(() => {
    if (lastHit.current === hitToken) return;
    lastHit.current = hitToken;
    setInternalChannel(previous => nextTvChannel(previous));
  }, [hitToken]);
  const index = channelIndex ?? internalChannel;
  const channel = LOCAL_TV_CHANNELS[index] || LOCAL_TV_CHANNELS[0];
  function change() {
    const next = nextTvChannel(index);
    if (onChannelChange) onChannelChange(next);
    else setInternalChannel(next);
  }
  useEffect(() => {
    if (!active || !auto) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (onChannelChange) onChannelChange(nextTvChannel(index));
      else setInternalChannel(previous => nextTvChannel(previous));
    }, 12000);
    return () => clearInterval(timer);
  }, [active, auto, index, onChannelChange]);
  return <g transform="translate(-10 -82) scale(.48)">
    <defs>
      <clipPath id={`${id}-head`}>
        <path d="M310 229 340 195 380 178 427 169 751 191Q778 194 779 218L782 471Q782 492 762 497L432 484 333 472 310 445Z" />
        <path d="M345 177 344 82Q344 45 370 32L403 28 437 33Q471 47 492 91L500 119Q495 158 468 168L429 176Z" />
        <path d="M519 174 529 137 539 133 552 67 578 73 589 25Q578 11 591 8Q611 5 607 24L595 26 585 80 559 76 547 137 565 140 575 176Z" />
        <path d="M621 180 635 157 650 153 682 115 792 70Q792 58 805 63Q821 69 810 80L799 82 690 124 665 162 677 184Z" />
      </clipPath>
      <clipPath id={`${id}-screen`}><path d="M482 215Q600 207 720 236Q738 240 736 273L735 414Q734 447 710 447L481 434Q456 432 457 408L458 247Q458 218 482 215Z" /></clipPath>
    </defs>
    <image href={`${SHKRABAN_ROOT}/source-boss.webp`} width="1024" height="1536" clipPath={`url(#${id}-head)`} pointerEvents="none" />
    <g role="button" tabIndex="0" aria-label={`Канал: ${channel.title}. Натисніть для перемикання`} className="local-tv-screen" onClick={event => { event.stopPropagation(); change(); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); change(); } }}>
      <g clipPath={`url(#${id}-screen)`}>
        <g transform="matrix(282 16 -3 218 457 213)">
          <LocalTvBroadcast channel={channel} />
          {active && <rect key={channel.id} className="local-tv-switch" width="1" height="1" fill="#d7ffef" />}
          {Array.from({ length: 36 }, (_, line) => <rect key={line} y={line / 36} width="1" height=".002" fill="#000" opacity=".08" />)}
        </g>
      </g>
    </g>
  </g>;
}
