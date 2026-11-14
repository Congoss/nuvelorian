import React, { useEffect, useRef, useState } from 'react';
import background from '@/assets/boss/raidboss2/arena-alternative.jpg';
import body from '@/assets/boss/raidboss2/raidboss2-body.png';
import legs from '@/assets/boss/raidboss2/raidboss2-legs.png';
import eyes from '@/assets/boss/raidboss2/raidboss2-anim-eye.png';
import shoulder from '@/assets/boss/raidboss2/raidboss2-anim-pleche.png';
import duckEye from '@/assets/boss/raidboss2/raidboss2-duck-eye.png';
import weaponButton from '@/assets/boss/raidboss2/raidboss2-weap-knopka.png';
import './RaidBossTwo.css';

const PHRASES = ['F*CK CRYPTO!', 'QUACK OFF!', 'WHERE LAMBO?!', 'RUG THIS!', 'BUY THE DIP?!', 'NO MORE MEMECOINS!', 'REKT AGAIN!', 'HODL MY DUCK!'];

export function RaidBossTwoBackground() {
  return <div className="rb2-background" aria-hidden="true">
    <img src={background} alt="" />
  </div>;
}

export function RaidBossTwo({ hitToken }) {
  const [reaction, setReaction] = useState(null);
  const lastPhrase = useRef(-1);
  useEffect(() => {
    if (!hitToken) return undefined;
    let phrase = Math.floor(Math.random() * (PHRASES.length - (lastPhrase.current < 0 ? 0 : 1)));
    if (lastPhrase.current >= 0 && phrase >= lastPhrase.current) phrase += 1;
    lastPhrase.current = phrase;
    setReaction({ token: hitToken, phrase });
    const timer = setTimeout(() => setReaction(null), 1250);
    return () => clearTimeout(timer);
  }, [hitToken]);

  return <div className="rb2-composite" aria-label="Raid Boss">
    <img src={legs} className="rb2-layer rb2-legs" alt="" aria-hidden="true" />
    <div className="rb2-upper">
      <img src={body} className="rb2-layer" alt="Raid Boss" />
      <img src={shoulder} className="rb2-layer rb2-shoulder" alt="" aria-hidden="true" />
      <img src={weaponButton} className="rb2-layer rb2-button" alt="" aria-hidden="true" />
      <img src={eyes} className="rb2-layer rb2-eyes" alt="" aria-hidden="true" />
      <span className="rb2-fire rb2-fire-left" aria-hidden="true" />
      <span className="rb2-fire rb2-fire-right" aria-hidden="true" />
      <div className="rb2-breath" aria-hidden="true">{[0, 1, 2].map(i => <i key={i} style={{ '--puff': i }} />)}</div>
      {reaction && <React.Fragment key={reaction.token}>
        <img src={duckEye} className="rb2-layer rb2-duck-eye" alt="" aria-hidden="true" />
        <span className="rb2-impact" aria-hidden="true" />
        <span className="rb2-talk">{PHRASES[reaction.phrase]}</span>
      </React.Fragment>}
    </div>
  </div>;
}
