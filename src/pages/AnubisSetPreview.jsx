import { useState } from 'react';
import LayeredHero from '@/components/game/LayeredHero';
import './AnubisSetPreview.css';

const slots = [
  ['head', 'Маска'], ['armor', 'Броня'], ['hands', 'Наручі'],
  ['legs', 'Бинти'], ['boots', 'Взуття'], ['weapon', 'Посохи'],
];
const art = import.meta.glob('/src/assets/hero/anubis/*.png', { eager: true, query: '?url', import: 'default' });
const source = (slot) => art[`/src/assets/hero/anubis/${slot}.png`];
const allSlots = Object.fromEntries(slots.map(([slot]) => [slot, true]));

export default function AnubisSetPreview() {
  const [enabled, setEnabled] = useState(allSlots);
  const [background, setBackground] = useState('dark');
  const [mask, setMask] = useState('head');
  const [animated, setAnimated] = useState(true);
  const overrides = Object.fromEntries(slots.filter(([slot]) => enabled[slot] && slot !== 'weapon').map(([slot]) => [slot, source(slot)]));
  if (enabled.weapon) overrides.rearWeapon = source('weapon');
  overrides.hideBaseHead = Boolean(enabled.head);
  overrides.bootsOverLegs = true;
  overrides.anubisEffects = animated;
  overrides.anubisFrontMask = mask === 'head-front';
  if (enabled.head) overrides.head = source(mask);
  return <main className={`anubis-preview anubis-preview--${background}`}>
    <section className="anubis-preview-stage">
      <LayeredHero className="anubis-preview-hero" visibleSlots={enabled} layerOverrides={overrides} />
    </section>
    <aside className="anubis-preview-controls">
      <h1>Сет Анубіса</h1>
      <p>Окремі шари на базовому герої</p>
      <label><input type="checkbox" checked={animated} onChange={(event) => setAnimated(event.target.checked)} />Анімації</label>
      <label>Форма маски<select aria-label="Форма маски" value={mask} onChange={(event) => setMask(event.target.value)}><option value="head">Шакал — легкий поворот</option><option value="head-front">Попередня фронтальна</option></select></label>
      {slots.map(([slot, label]) => <div className="anubis-preview-slot" key={slot}><label><input type="checkbox" aria-label={label} checked={Boolean(enabled[slot])} onChange={(event) => setEnabled((value) => ({ ...value, [slot]: event.target.checked }))} />{label}</label><a href={source(slot)} download={`${slot}.png`}>PNG ↓</a></div>)}
      <div><button onClick={() => setEnabled(allSlots)}>Увесь сет</button><button onClick={() => setEnabled({})}>Зняти все</button></div>
      <label>Фон<select value={background} onChange={(event) => setBackground(event.target.value)}><option value="dark">Темний</option><option value="light">Світлий</option><option value="check">Шахівниця</option></select></label>
    </aside>
  </main>;
}
