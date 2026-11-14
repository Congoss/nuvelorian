import { useState } from 'react';
import { Check, Hammer } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import { SHIP_ASSET_BASE } from '@/lib/clanShipPreview';

const fmt = n => Number(n).toLocaleString('uk-UA', { maximumFractionDigits: 2 });
const art = id => `${SHIP_ASSET_BASE}${id}.png`;

export default function ShipConstructionDialog({ module, progress, available, wallet, currencies, onContribute, onSelect, onBoss, notice, sector, buff }) {
  const [currency, setCurrency] = useState('tentacles');
  const [amounts, setAmounts] = useState({ tentacles: '100000', paper: '10', stars: '25' });
  const cfg = currencies[currency];
  const value = progress[module.id], ready = value >= module.cost;
  const percent = Math.min(100, value / module.cost * 100);
  const remaining = Math.ceil(Math.max(0, module.cost - value) / cfg.rate);
  const limit = Math.min(Math.floor(wallet[currency]), remaining);
  const entered = Number(amounts[currency]);
  const valid = available && !ready && Number.isSafeInteger(entered) && entered > 0 && entered <= limit;
  const step = currency === 'tentacles' ? 10000 : 1;

  const setAmount = n => setAmounts(old => ({ ...old, [currency]: String(n) }));
  const quick = currency === 'tentacles' ? [10000, 100000] : currency === 'paper' ? [1, 10] : [25, 100];
  if (!sector.unlocked && !ready) return <div className="ship-sector-content"><small>СЕКТОР {module.level} · ЗАКРИТО</small><h2>{module.name}</h2><img className="ship-sector-feature" src={art(module.id)} alt=""/><p>{module.benefit}</p><p>Збудуйте «{sector.previous.name}» і переможіть його боса, щоб відкрити цей сектор.</p><GameTextureButton tone="yellow" className="ship-construction-submit" onClick={()=>onSelect(sector.previous.id)}><span className="ship-control-content">ДО СЕКТОРУ {sector.previous.level}</span></GameTextureButton></div>;
  if (ready) return <div className="ship-sector-content ship-sector-buff-card">
    <small>СЕКТОР {module.level}</small><h2>{module.name}</h2>
    <img className="ship-sector-module-thumb" src={art(module.id)} alt={module.name}/>
    <div className="ship-buff-heading"><h3>✦ {buff}</h3><span>РІВЕНЬ {sector.level}/10</span></div>
    <div className="ship-buff-segments" aria-label={`Рівень ${sector.level} з 10`}>{Array.from({length:10},(_,i)=><i key={i} className={i<sector.level?'is-filled':''}/>)}</div>
    {sector.level>0&&<p className="ship-buff-active">Діє на весь клан: <b>+{sector.bonus}%</b> · {buff}</p>}
    {sector.level<10?<><p className={sector.level?'ship-buff-next':'ship-buff-active'}>Наступний бонус: +{(sector.level+1)*2}% · {buff}</p><div className="ship-buff-win-progress" role="progressbar" aria-label="Перемоги до наступного рівня" aria-valuenow={sector.wins%10} aria-valuemin={0} aria-valuemax={10}><i style={{width:(sector.wins%10)*10+'%'}}/><b>{sector.wins%10} / 10 перемог</b></div><p className="ship-buff-remaining">Ще {sector.nextWins} перемог до рівня {sector.level+1}.</p></>:<p className="ship-buff-remaining">Максимальний бонус · усі 10 рівнів відкрито.</p>}
    <GameTextureButton tone="yellow" className="ship-construction-submit" onClick={onBoss}><span className="ship-control-content">ДО БОСА ↓</span></GameTextureButton>
  </div>;
  return <div className="ship-construction">
    <section className="ship-construction-panel">
      <div className="ship-sector-plate">СЕКТОР {module.level}</div>
      <h3>{module.name}</h3>
      <div className="ship-module-overview"><img src={art(module.id)} alt={module.name} /><div><span className={`ship-module-state ${ready ? 'is-ready' : ''}`}>{ready ? <Check /> : <Hammer />}{ready ? 'ЗБУДОВАНО' : 'БУДІВНИЦТВО'}</span><p>{module.benefit}</p></div></div>
      <div className="ship-construction-progress" role="progressbar" aria-label="Будівництво сектора" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${percent}%` }} /><div><b>{fmt(percent)}%</b><small>{fmt(value)} / {fmt(module.cost)}</small></div></div>
      <section className="ship-contribution-controls"><h4>ЗРОБИТИ ВНЕСОК</h4>
        <div className="ship-terminal-currencies" role="group" aria-label="Валюта внеску">{Object.entries(currencies).map(([id,c]) => <GameTextureButton type="button" key={id} tone={currency === id ? 'green' : 'gray'} aria-label={c.name} aria-pressed={currency === id} onClick={() => setCurrency(id)}><span className="ship-control-content"><img src={c.icon} alt="" /></span></GameTextureButton>)}</div>
        <div className="ship-terminal-balance"><img src={cfg.icon} alt="" /><span>{cfg.name}: <b>{fmt(wallet[currency])}</b></span></div>
        <div className="ship-terminal-amount"><GameTextureButton tone="yellow" aria-label="Зменшити кількість" disabled={entered <= 1 || !available || ready} onClick={() => setAmount(Math.max(1,(Number.isFinite(entered) ? entered : 1)-step))}><span className="ship-control-content">−</span></GameTextureButton><input aria-label={`Кількість: ${cfg.name}`} type="number" min="1" max={limit} step="1" value={amounts[currency]} onChange={e => setAmount(e.target.value)} /><GameTextureButton tone="yellow" aria-label="Збільшити кількість" disabled={entered >= limit || limit < 1 || !available || ready} onClick={() => setAmount(Math.min(limit,(Number.isFinite(entered) ? entered : 0)+step))}><span className="ship-control-content">+</span></GameTextureButton></div>
        <div className="ship-terminal-quick">{quick.map(n => <GameTextureButton tone="yellow" key={n} disabled={limit < 1 || !available || ready} onClick={() => setAmount(Math.min(limit,(Number.isFinite(entered) ? entered : 0)+n))}><span className="ship-control-content">+{fmt(n)}</span></GameTextureButton>)}<GameTextureButton tone="yellow" disabled={limit < 1 || !available || ready} onClick={() => setAmount(limit)}><span className="ship-control-content">МАКС</span></GameTextureButton></div>
        <GameTextureButton tone="yellow" className="ship-construction-submit" disabled={!valid} onClick={() => onContribute({ amount: entered, currency })}><span className="ship-control-content"><Hammer />ВНЕСТИ</span></GameTextureButton>
        <p className="ship-terminal-note" role="status">{ready ? 'Модуль готовий. Час розбудити тварюку.' : !available ? 'Спершу здолайте боса попереднього сектора.' : entered > remaining ? 'Для завершення потрібно менше ресурсів.' : entered > limit ? 'На такий внесок ресурсів забракне.' : notice.startsWith('Тест:') ? 'Внесок прийнято. Майстри вже за роботою.' : 'Кожен внесок наближає запуск.'}</p>
      </section>


    </section>
  </div>;
}
