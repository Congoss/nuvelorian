import { useState } from 'react';
import LayeredHero from '@/components/game/LayeredHero';
import LocalTvBroadcast from '@/components/game/LocalTvBroadcast';
import { LOCAL_TV_CHANNELS, nextTvChannel } from '@/lib/localTvChannels';
import { BOSS_MEDAL_THRESHOLDS } from '@/lib/bossMedals';
import { weaponEnhancementVisual } from '@/lib/weaponEnhancementVisuals';
import './ShkrabanSetPreview.css';

export default function ShkrabanSetPreview() {
  const [channel, setChannel] = useState(0);
  const [auto, setAuto] = useState(true);
  const [television, setTelevision] = useState(true);
  const [enhancement, setEnhancement] = useState(15);
  const [paused, setPaused] = useState(false);
  const [pet, setPet] = useState(true);
  const [petKind, setPetKind] = useState('toaster');
  const [petReset, setPetReset] = useState(0);
  const enhancementStage = weaponEnhancementVisual(enhancement);
  const layers = Object.fromEntries(['head', 'armor', 'hands', 'legs', 'boots', 'weapon'].map(slot => [slot, `/local-rabbit/${slot}.webp`]));
  Object.assign(layers, { localTvHead: television, tvChannelIndex: channel, onTvChannelChange: setChannel, tvAuto: auto, localTvPet: pet, localTvPetKind: petKind, localTvPetReset: petReset });
  return <main className="shkraban-preview">
    <section className={`shkraban-preview-stage${paused ? ' preview-paused' : ''}`}><LayeredHero className="shkraban-preview-hero" layerOverrides={layers} weaponEnhancementLevel={enhancement} /></section>
    <aside><h1>ШКРЯБАН · TV SET</h1><p>Локальна примірка сету</p>
      <h2>Заточка механічних рук · +{enhancement}</h2>
      <input className="shkraban-enhancement-slider" type="range" min="0" max="15" step="1" value={enhancement} aria-label="Рівень заточки" onChange={event => setEnhancement(Number(event.target.value))} />
      <div className="shkraban-enhancement-presets">{[0, 4, 6, 8, 10, 12, 15].map(level => <button key={level} aria-pressed={enhancement === level} onClick={() => setEnhancement(level)}>+{level}</button>)}</div>
      <p style={{ color: enhancementStage?.color }}>{enhancementStage?.name || 'Без ефектів заточки'}</p>
      <label className="shkraban-check"><input type="checkbox" checked={paused} onChange={event => setPaused(event.target.checked)} />Пауза анімацій</label>
      <label className="shkraban-check"><input type="checkbox" checked={pet} onChange={event => setPet(event.target.checked)} />Показати пета</label>
      <label>Пет<select value={petKind} onChange={event => setPetKind(event.target.value)}><option value="toaster">Тостер-привид</option><option value="robot">TV-робот — порівняти</option></select></label>
      {pet && petKind === 'toaster' && <><button onClick={() => setPetReset(previous => previous + 1)}>Показати тост зараз</button><p>Тост вистрибує, обертається на 360° й повертається в щілину. Під час приготування очі світяться, важіль унизу. Натискання ховає тост на 30–60 секунд.</p></>}
      <label>Голова<select value={television ? 'tv' : 'rabbit'} onChange={event => setTelevision(event.target.value === 'tv')}><option value="tv">Телевізор</option><option value="rabbit">Робозаєць — порівняти</option></select></label>
      <label>Канал<select value={channel} onChange={event => setChannel(Number(event.target.value))}>{LOCAL_TV_CHANNELS.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></label>
      <button onClick={() => setChannel(previous => nextTvChannel(previous))}>Перемкнути канал</button>
      <label className="shkraban-check"><input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} />Автоматично раз на 12 секунд</label>
      <p>Можна натиснути прямо на екран голови. Канали статичні; при зміні — коротка перешкода.</p>
      <svg className="shkraban-channel-preview" viewBox="0 0 1 1" preserveAspectRatio="none" style={{ aspectRatio: '4 / 3' }} role="img" aria-label={LOCAL_TV_CHANNELS[channel].title}><LocalTvBroadcast channel={LOCAL_TV_CHANNELS[channel]} /></svg>
      <h2>Аватар боса</h2><img className="shkraban-avatar" src="/local-tv/avatar.svg" alt="Шкрябан — телевізійний бос" />
      <h2>Медалі</h2><div className="shkraban-medals">{Object.entries(BOSS_MEDAL_THRESHOLDS).map(([tier, kills]) => <figure key={tier}><img src={`/local-tv/medal-${tier}.svg`} alt={tier} /><figcaption>{kills} перемог</figcaption></figure>)}</div>
      <small>Локальні макети. Нагороди й баланс не змінюються.</small>
    </aside>
  </main>;
}
