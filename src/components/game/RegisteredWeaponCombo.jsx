import { useId } from 'react';
import lavaHands from '@/assets/hero/bp leg set/setbp2-hands.png';
import pirateHands from '@/assets/hero/halloween-set/hellow-set-hands-bottom54.png';
import epicHands from '@/assets/hero/bp epic set/setbp1-hands.png';
import epicSwordGrip from '@/assets/hero/weapon-combos/epic-sword-grip-v3.png';
import lavaGrips from '@/assets/hero/weapon-combos/lava-grips-v2.png';
import pirateGrips from '@/assets/hero/weapon-combos/pirate-grips-v2.png';
import pirateSwordGrip from '@/assets/hero/weapon-combos/pirate-sword-grip-v3.png';
import pirateRatGrip from '@/assets/hero/weapon-combos/pirate-rat-grip-v3.png';
import pirateNewspaperGrip from '@/assets/hero/weapon-combos/pirate-newspaper-grip-v3.png';
import pirateAcidGrip from '@/assets/hero/weapon-combos/pirate-acid-grip-v3.png';
import pirateBatGrip from '@/assets/hero/weapon-combos/pirate-bat-grip-v3.png';
import pirateBlasterGrip from '@/assets/hero/weapon-combos/pirate-blaster-grip-v3.png';
import lavaBlasterGrip from '@/assets/hero/weapon-combos/lava-blaster-grip-v3.png';
import lavaBatGrip from '@/assets/hero/weapon-combos/lava-bat-grip-v3.png';
import lavaSwordGrip from '@/assets/hero/weapon-combos/lava-sword-grip-v3.png';
import lavaRatGrip from '@/assets/hero/weapon-combos/lava-rat-grip-v3.png';
import lavaNewspaperGrip from '@/assets/hero/weapon-combos/lava-newspaper-grip-v3.png';
import lavaAcidGrip from '@/assets/hero/weapon-combos/lava-acid-grip-v3.png';
import sword from '@/assets/hero/set1-weap1.png';
import newspaper from '@/assets/hero/night-disinfector/set2-hands-weap1.png';
import acidGun from '@/assets/hero/gumset/set4-weap4-without-hands.png';
import blaster from '@/assets/hero/cosmo set/set5-hands-weap5.png';
import hockeyStick from '@/assets/hero/newbie pack/set-newbiepack-hands-weap.png';
import acidRat from '@/assets/hero/bp epic set/setbp1-weap.png';
import ratHandle from '@/assets/hero/bp epic set/setbp1-weap1.png';
import bounds from './weaponGripBounds.json';

const weapons = {
  cardboard_weapon: [sword],
  night_disinfector_weapon: [newspaper],
  set4_weapon: [acidGun],
  set5_weapon: [blaster],
  newbie_pack_ii_weapon: [hockeyStick],
  bp_epic_weapon: [acidRat, ratHandle],
};

export function resolveRegisteredWeaponCombo(handsId, weaponId) {
  const kind = handsId === 'bp_legendary_hands' ? 'lava' : handsId === 'halloween_2026_hands' ? 'pirate' : handsId === 'bp_epic_hands' && weaponId === 'cardboard_weapon' ? 'epic' : null;
  if (!kind || !weapons[weaponId]) return null;
  const preciseGrip = kind === 'pirate' ? {
    set4_weapon: { src: pirateAcidGrip, x: -5, y: 4, acid: true, flip: true, clip: 'M150 465H200V505L190 521H159L150 500Z' },
    newbie_pack_ii_weapon: { src: pirateBatGrip, x: -3, y: -19, clip: 'M140 465H195V500L183 518H151L140 502Z' },
    set5_weapon: { src: pirateBlasterGrip, x: -2, y: 12, clip: 'M310 465H365V510L350 523H320L310 503Z' },
  }[weaponId] : kind === 'lava' ? {
    set5_weapon: { src: lavaBlasterGrip, x: -10, y: -7, handStart: 490, clip: 'M305 490H370V507L352 523H320L305 503Z' },
    newbie_pack_ii_weapon: { src: lavaBatGrip, x: -3, y: 1, handStart: 490, batSkin: true, clip: 'M140 490H200V500L184 520H150L140 503Z' },
    cardboard_weapon: { src: lavaSwordGrip, x: -3, y: 3, handStart: 480, clip: 'M145 480H200V518L155 533L145 515Z' },
    night_disinfector_weapon: { src: lavaNewspaperGrip, x: -7, y: -12, paperCut: true, clip: 'M140 465H200V516L180 530H150L140 508Z' },
    set4_weapon: { src: lavaAcidGrip, x: 5, y: 1, acid: true, clip: 'M140 465H200V500L189 522H150L140 505Z' },
  }[weaponId] : { cardboard_weapon: { src: epicSwordGrip, x: 4, y: 0, handStart: 490, clip: 'M145 490H200V518L155 533L145 515Z' } }[weaponId];
  return { kind, original: kind === 'lava' ? lavaHands : kind === 'epic' ? epicHands : pirateHands, grip: kind === 'lava' ? lavaGrips : pirateGrips, weaponLayers: weapons[weaponId], right: weaponId === 'set5_weapon', preciseSword: kind === 'pirate' && weaponId === 'cardboard_weapon', preciseRat: weaponId === 'bp_epic_weapon', preciseNewspaper: kind === 'pirate' && weaponId === 'night_disinfector_weapon', preciseGrip };
}

export default function RegisteredWeaponCombo({ kind, original, grip, weaponLayers, right, preciseSword, preciseRat, preciseNewspaper, preciseGrip }) {
  const id = useId();
  if (preciseGrip) return <svg role="img" aria-label="Pirate fingers gripping weapon handle" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
    <defs>
      <mask id={`${id}-original`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        <rect x={right ? 305 : 140} y={preciseGrip.handStart || 465} width="65" height={550 - (preciseGrip.handStart || 465)} fill="black" />
      </mask>
      <clipPath id={`${id}-fingers`}><path d={preciseGrip.clip} /></clipPath>
      <mask id={`${id}-grip-only`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        {preciseGrip.paperCut ? <path d="M172 485L181 492L190 550H140L160 505Z" fill="black" /> : null}
      </mask>
      <mask id={`${id}-skin`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        {preciseGrip.acid ? <rect x="181" y="450" width="12" height="53" fill="black" /> : null}
        {preciseGrip.batSkin ? <><rect x="180" y="490" width="15" height="40" fill="black" /><rect x="150" y="510" width="12" height="25" fill="black" /></> : null}
      </mask>
    </defs>
    {weaponLayers.map(src => <image key={src} href={src} width="500" height="896" mask={`url(#${id}-skin)`} />)}
    <image href={original} width="500" height="896" mask={`url(#${id}-original)`} />
    <g clipPath={`url(#${id}-fingers)`} mask={`url(#${id}-grip-only)`}>
      <image href={preciseGrip.src} x={preciseGrip.x} y={preciseGrip.y} width="500" height="896" transform={preciseGrip.flip ? 'translate(340 0) scale(-1 1)' : undefined} />
    </g>
  </svg>;
  if (preciseNewspaper) return <svg role="img" aria-label="Pirate fingers gripping rolled newspaper" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
    <defs>
      <mask id={`${id}-original`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        <rect x="140" y="465" width="65" height="85" fill="black" />
      </mask>
      <clipPath id={`${id}-fingers`}><rect x="140" y="465" width="65" height="65" /></clipPath>
    </defs>
    <image href={newspaper} width="500" height="896" />
    <image href={original} width="500" height="896" mask={`url(#${id}-original)`} />
    <image href={pirateNewspaperGrip} y="10" width="500" height="896" clipPath={`url(#${id}-fingers)`} />
  </svg>;
  if (preciseRat) return <svg role="img" aria-label="Pirate fingers gripping acid rat tail" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
    <defs>
      <mask id={`${id}-original`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        <rect x="140" y={kind === 'lava' ? 490 : 465} width="65" height={kind === 'lava' ? 60 : 85} fill="black" />
      </mask>
      <clipPath id={`${id}-fingers`}><rect x="140" y={kind === 'lava' ? 490 : 465} width="65" height={kind === 'lava' ? 48 : 73} /></clipPath>
    </defs>
    <image href={acidRat} width="500" height="896" />
    <image href={original} width="500" height="896" mask={`url(#${id}-original)`} />
    <image href={kind === 'lava' ? lavaRatGrip : pirateRatGrip} x={kind === 'lava' ? 4 : 35} y={kind === 'lava' ? 53 : 105} width={kind === 'lava' ? 450 : 375} height={kind === 'lava' ? 806.4 : 672} clipPath={`url(#${id}-fingers)`} />
  </svg>;
  if (preciseSword) return <svg role="img" aria-label="Pirate fingers gripping wooden sword" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
    <defs>
      <mask id={`${id}-original`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        <rect x="140" y="465" width="65" height="85" fill="black" />
      </mask>
      <clipPath id={`${id}-fingers`}><path d="M145 465H200V518L155 533L145 515Z" /></clipPath>
    </defs>
    <image href={sword} width="500" height="896" />
    <image href={original} width="500" height="896" mask={`url(#${id}-original)`} />
    <image href={pirateSwordGrip} x="2" y="7" width="500" height="896" clipPath={`url(#${id}-fingers)`} />
  </svg>;
  const holdingX = right ? 305 : 130;
  const targetX = right ? 316 : 148;
  const sheet = bounds[kind];
  // Rotate only the upward-facing lava fist; weapon registration stays intact.
  const box = sheet.boxes[kind === 'lava' ? (right ? 0 : 1) : (right ? 1 : 0)];
  return <svg role="img" aria-label="Gloves holding equipped weapon" viewBox="0 0 500 896" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 h-full w-full select-none">
    <defs>
      <mask id={`${id}-hands`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        <rect x={holdingX} y="465" width="80" height="85" fill="black" />
      </mask>
      <mask id={`${id}-weapon`} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="896">
        <rect width="500" height="896" fill="white" />
        <rect x={right ? 320 : 145} y="450" width="48" height="80" fill="black" />
      </mask>
    </defs>
    {weaponLayers.map(src => <image key={src} href={src} x="0" y="0" width="500" height="896" mask={`url(#${id}-weapon)`} />)}
    <image href={original} width="500" height="896" mask={`url(#${id}-hands)`} />
    <svg x={targetX} y="465" width="44" height="58" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="xMidYMin meet" overflow="hidden">
      <image href={grip} width={sheet.width} height={sheet.height} transform={kind === 'lava' ? `rotate(180 ${box.x + box.width / 2} ${box.y + box.height / 2})` : undefined} />
    </svg>
  </svg>;
}
