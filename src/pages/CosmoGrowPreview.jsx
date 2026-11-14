import { useEffect, useState } from 'react';
import { Droplets, Zap, FlaskConical, Sprout, ArrowUpRight, Orbit } from 'lucide-react';
import { createGrowState, growAction, growProgress, growDuration, growYield, lampConfig } from '@/lib/cosmoGrow';
import sky from '@/assets/IVENTS/cosmo-grow/layers-v3/sky.png';
import ground from '@/assets/IVENTS/cosmo-grow/layers-v3/ground.png';
import pot from '@/assets/IVENTS/cosmo-grow/layers-v3/pot.png';
import bush1 from '@/assets/IVENTS/cosmo-grow/layers-v3/bush-1.png';
import bush2 from '@/assets/IVENTS/cosmo-grow/layers-v3/bush-2.png';
import bush3 from '@/assets/IVENTS/cosmo-grow/layers-v3/bush-3.png';
import bud from '@/assets/IVENTS/cosmo-grow/layers-v3/bud.png';
import lamp1 from '@/assets/IVENTS/cosmo-grow/layers-v3/lamp-1.png';
import lamp2 from '@/assets/IVENTS/cosmo-grow/layers-v3/lamp-2.png';
import lamp3 from '@/assets/IVENTS/cosmo-grow/layers-v3/lamp-3.png';
import tank from '@/assets/IVENTS/cosmo-grow/layers-v3/tank.png';
import './cosmoGrowPreview.css';

const STORAGE_KEY = 'planet4.cosmo-grow.prototype.v1';
const BUSHES = [null, bush1, bush2, bush3];
const LAMPS = [lamp1, lamp2, lamp3];
const STAGES = ['Порожній', 'Паросток', 'Ріст', 'Зрілий кущ'];
const BUDS = [
  { left: 50, top: 31, rotate: -5 },
  { left: 43, top: 41, rotate: -17 },
  { left: 57, top: 42, rotate: 14 },
  { left: 40, top: 54, rotate: -12 },
  { left: 62, top: 55, rotate: 17 },
];
const LAYERS = [
  ['sky', 'Космос'], ['ground', 'Астероїд'], ['pot', 'Горщик'],
  ['bush', 'Кущ'], ['buds', 'Шишки'], ['lamp', 'Лампа'], ['beam', 'Світло'], ['tank', 'Вода'],
];
const CARE = [
  { id: 'water', label: 'Гідрополив', detail: 'Вода з астероїда', Icon: Droplets },
  { id: 'light', label: 'Заряд світла', detail: 'Активувати лампу', Icon: Zap },
  { id: 'feed', label: 'Біорозчин', detail: 'Живлення для росту', Icon: FlaskConical },
];

function restore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && (s.plantedAt === null || Number.isFinite(s.plantedAt)) && Array.isArray(s.care) && s.care.every(x => CARE.some(c => c.id === x)) && new Set(s.care).size === s.care.length && Number.isFinite(s.harvest) && s.harvest >= 0 && Number.isFinite(s.cycles) && s.cycles >= 0) {
      const level = value => [1, 2, 3].includes(value) ? value : 1;
      return { ...createGrowState(), ...s, lampLevel: level(s.lampLevel), cycleLampLevel: level(s.cycleLampLevel) };
    }
  } catch { /* Local preview can run without storage. */ }
  return createGrowState();
}

export default function CosmoGrowPreview() {
  const [state, setState] = useState(restore);
  const [previewStage, setPreviewStage] = useState(null);
  const [previewLamp, setPreviewLamp] = useState(null);
  const [hiddenLayers, setHiddenLayers] = useState([]);
  const [now, setNow] = useState(Date.now);
  const [message, setMessage] = useState('Посади астронасіння. Доглядай кущ і збирай зоряні шишки.');
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Optional persistence. */ } }, [state]);
  useEffect(() => {
    [sky, ground, pot, bush1, bush2, bush3, bud, ...LAMPS, tank].forEach(src => { const img = new Image(); img.src = src; });
  }, []);
  const progress = growProgress(state, now);
  const planted = state.plantedAt !== null;
  const ready = progress === 1;
  const stage = !planted ? 0 : Math.min(3, 1 + Math.floor(progress * 3));
  const shownStage = previewStage ?? stage;
  const lampLevel = state.lampLevel || 1;
  const shownLamp = previewLamp ?? lampLevel;
  const lamp = lampConfig(lampLevel);
  const seconds = planted ? Math.max(0, Math.ceil((growDuration(state) - now + state.plantedAt) / 1000)) : lamp.duration / 1000;
  const visible = layer => !hiddenLayers.includes(layer);
  const previewing = previewStage !== null || previewLamp !== null;
  const budsVisible = shownStage === 3;
  const ripe = previewStage !== null || ready;
  const resume = () => { setPreviewStage(null); setPreviewLamp(null); };
  const act = action => {
    resume();
    setState(current => growAction(current, action));
    if (action === 'plant') setMessage('Астронасіння посаджено. Три дії догляду дадуть +9 до врожаю.');
    else if (action === 'harvest') setMessage(`Зібрано ${growYield(state)} зоряних шишок. Частину можна витратити на лампу.`);
    else if (action === 'upgrade-lamp') setMessage('Лампу покращено. Швидший ріст і бонус до врожаю — з наступної посадки.');
    else if (action === 'exchange') setMessage('Тестовий обмін: 20 шишок → 1 жетон.');
    else setMessage('Догляд виконано: +3 до майбутнього врожаю.');
  };
  return <main className="cg-page"><div className="cg-app">
    <header className="cg-header"><div className="cg-logo"><Orbit size={21}/><span>PLANET<span>4</span></span></div><span className="cg-tag">ЛОКАЛЬНИЙ ПРОТОТИП</span></header>
    <div className="cg-heading"><span className="cg-eyebrow">ЖИВІ ІВЕНТИ / АСТЕРОЇД 04</span><h1>АСТРО<span>КУЩ</span></h1><p>Збирай зоряні шишки. Прокачуй свою ділянку.</p></div>
    <div className="cg-stats"><div><span>ЗОРЯНІ ШИШКИ</span><strong>{state.harvest}<small> ◈</small></strong></div><div><span>СВІТЛО · РІВЕНЬ {lampLevel}</span><strong>{lamp.duration / 1000}<small> сек / +{lamp.bonus} урожаю</small></strong></div></div>
    <section className={`cg-chamber cg-layered cg-lamp-level-${shownLamp}`} aria-label="Пошарова ділянка вирощування">
      {visible('sky') && <img className="cg-layer cg-sky" src={sky} alt="Космічний фон" />}
      {visible('ground') && <img className="cg-layer cg-ground" src={ground} alt="Астероїд" />}
      {visible('beam') && <div className="cg-light-beam" aria-hidden="true" />}
      {visible('bush') && shownStage > 0 && <img className={`cg-layer cg-plant cg-plant-${shownStage}`} src={BUSHES[shownStage]} alt={`Астрокущ: ${STAGES[shownStage]}`} />}
      {visible('pot') && <img className="cg-layer cg-pot" src={pot} alt="Горщик" />}
      {visible('tank') && <img className="cg-layer cg-tank" src={tank} alt="Водяний бак і шланг" />}
      {visible('buds') && budsVisible && BUDS.map((position, index) => <img key={index} className={`cg-layer cg-fruit ${ripe ? 'cg-fruit-ripe' : ''}`} src={bud} alt={`Зоряна шишка ${index + 1}`} style={{ left: `${position.left}%`, top: `${position.top}%`, '--bud-rotate': `${position.rotate}deg` }} />)}
      {visible('lamp') && <img className="cg-layer cg-grow-lamp" src={LAMPS[shownLamp - 1]} alt={`Лампа: ${lampConfig(shownLamp).name}`} />}
      <div className="cg-scene-label"><span><i/> ДІЛЯНКА 01</span><button onClick={resume}>{previewing ? 'ДО ГРИ ↩' : ready ? 'ГОТОВО ДО ЗБОРУ' : planted ? 'КУЩ РОСТЕ' : 'ОЧІКУЄ НАСІННЯ'}</button></div>
      <div className="cg-specimen"><span>АСТРОКУЩ · NEBULA</span><strong>{previewing ? 'ПЕРЕГЛЯД ШАРІВ' : `УРОЖАЙ: ${growYield(state)} ◈ · ДОГЛЯД ${state.care.length}/3`}</strong></div>
      <div className="cg-stage-row" aria-label="Перегляд стадій росту">{STAGES.map((name, index) => <button key={name} aria-pressed={previewStage === index} onClick={() => setPreviewStage(index)} className={index === shownStage ? 'active' : ''}><i/>{name}</button>)}</div>
    </section>
    <section className="cg-controls"><div className="cg-progress-label"><span>{ready ? 'Урожай дозрів' : planted ? STAGES[stage] : 'Новий цикл'} <b>{Math.floor(progress * 100)}%</b></span><strong>{ready ? 'ЗБИРАЙ' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</strong></div>
      <progress max="1" value={progress} aria-label="Ріст куща"/>
      <div className="cg-care">{CARE.map(({ id, label, detail, Icon }) => <button key={id} disabled={!planted || ready || state.care.includes(id)} onClick={() => act(id)}><Icon size={23}/><strong>{label}</strong><small>{state.care.includes(id) ? 'Виконано ✓ · +3' : detail}</small></button>)}</div>
      <button className="cg-main-button" disabled={planted && !ready} onClick={() => act(ready ? 'harvest' : 'plant')}><Sprout size={20}/>{ready ? `Зібрати врожай · ${growYield(state)} ◈` : planted ? 'Кущ росте' : 'Посадити астронасіння'}<ArrowUpRight size={18}/></button>
      <p className="cg-message" role="status">{message}</p>
    </section>
    <section className="cg-exchange cg-lamp-upgrade"><div><span className="cg-eyebrow">ПОКРАЩЕННЯ СВІТЛА · {lampLevel}/3</span><h2>{lamp.name}</h2><p>{lampLevel < 3 ? `Наступний: ${lampConfig(lampLevel + 1).duration / 1000} сек · +${lampConfig(lampLevel + 1).bonus} до врожаю` : 'Максимальний рівень світла'}</p></div><button disabled={lamp.upgradeCost === null || state.harvest < lamp.upgradeCost} onClick={() => act('upgrade-lamp')}>{lamp.upgradeCost === null ? 'МАКС' : `Покращити · ${lamp.upgradeCost} ◈`}</button></section>
    <section className="cg-exchange"><div><span className="cg-eyebrow">ОБМІН · ЖЕТОНИ: {state.tokens || 0}</span><h2>Урожай має цінність</h2><p>20 зоряних шишок → 1 тестовий жетон</p></div><button disabled={state.harvest < 20} onClick={() => act('exchange')}>Обміняти ↗</button></section>
    <details className="cg-layer-inspector"><summary>Шари сцени · перегляд</summary><div className="cg-layer-toggles">{LAYERS.map(([id, label]) => <label key={id}><input type="checkbox" checked={visible(id)} onChange={() => setHiddenLayers(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])}/>{label}</label>)}</div><div className="cg-lamp-previews">Вигляд лампи: {[1, 2, 3].map(level => <button key={level} aria-pressed={shownLamp === level} onClick={() => setPreviewLamp(level)}>{level}</button>)}<button onClick={resume}>До гри</button></div></details>
    <footer>3 стадії куща · шишки та обладнання окремими шарами<br/>Прогрес локальний. Ігрові нагороди не нараховуються.</footer>
  </div></main>;
}
