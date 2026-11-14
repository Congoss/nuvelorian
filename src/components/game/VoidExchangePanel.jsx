import PumpkinIcon from './PumpkinIcon';
import { Minus, Plus, ArrowDownToLine } from 'lucide-react';
import { getResourceIcon } from '@/lib/resourceIcons';
import GameTextureButton from './GameTextureButton';
import './voidExchangePanel.css';

const text = (language, uk, ru, en) => language === 'en' ? en : language === 'ru' ? ru : uk;
const formatNumber = (value, language) => new Intl.NumberFormat(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uk-UA').format(value);

export default function VoidExchangePanel({ language, resource, onResourceChange, ap, setAp, rate, balance, maxAp, busy, resourceAvailability = {}, onFlush, feedback, compact = false, pumpkins = false }) {
  const currency = pumpkins ? <PumpkinIcon /> : 'AP';
  const format = (value) => formatNumber(value, language);
  const idleTone = pumpkins ? (resource === 'tentacles' ? 'dark-orange' : 'dark-purple') : resource === 'tentacles' ? 'dark-green' : 'dark-pink';
  const unit = resource === 'tentacles' ? text(language, 'щупалець', 'щупалец', 'tentacles') : text(language, 'паперу', 'бумаги', 'paper');
  const options = [
    { id: 'tentacles', name: text(language, 'Щупальця', 'Щупальца', 'Tentacles'), icon: 'tentacles' },
    { id: 'paper', name: text(language, 'Т-ПЕЙП', 'Т-ПЕЙП', 'T-PAPE'), icon: 't-pape' },
  ];
  return <section data-resource={resource} className={`void-exchange-panel${compact ? ' void-exchange-compact' : ''}`}>
    <div className="void-exchange-heading">
      {pumpkins && <svg className="halloween-exchange-spider" aria-hidden="true" viewBox="0 0 80 76" fill="none"><path d="M57 0v27" stroke="#a394b2" strokeWidth="1"/><path d="m48 40-11-9-8 4m20 9-15-2-7 7m23 0-12 8-2 9m29-26 9-9 5 4m-13 9 11-2 3 7m-15 0 10 8 1 9" stroke="#ab8bbd" strokeWidth="2" strokeLinecap="round"/><ellipse cx="57" cy="44" rx="11" ry="14" fill="#33213c" stroke="#9b6d9a"/><circle cx="54" cy="38" r="1.6" fill="#ffca72"/><circle cx="60" cy="38" r="1.6" fill="#ffca72"/></svg>}
      <h2 className="void-exchange-title">{pumpkins ? text(language, 'ОБМІН НА ГАРБУЗИ', 'ОБМЕН НА ТЫКВЫ', 'EXCHANGE FOR PUMPKINS') : text(language, 'ОБМІН НА AP', 'ОБМЕН НА AP', 'EXCHANGE FOR AP')}</h2>
      <p className="void-exchange-subtitle">{text(language, 'Відправ ресурси в чорну діру', 'Отправь ресурсы в чёрную дыру', 'Send resources into the black hole')}</p>
      <span className="void-exchange-vortex" aria-hidden="true" />
    </div>
    <div className="void-exchange-resources" role="group" aria-label={text(language, 'Ресурс', 'Ресурс', 'Resource')}>
      {options.map((option) => <GameTextureButton tone={busy || resourceAvailability[option.id] === false ? 'gray' : pumpkins ? (option.id === 'tentacles' ? 'orange' : 'purple') : option.id === 'tentacles' ? 'green' : 'pink'} key={option.id} type="button" aria-pressed={resource === option.id} disabled={busy || resourceAvailability[option.id] === false} onClick={() => onResourceChange(option.id)} className={`void-exchange-resource ${busy || resourceAvailability[option.id] === false ? 'opacity-45 grayscale cursor-not-allowed' : resource === option.id ? 'is-selected' : ''}`}>
        <span className="void-exchange-resource-content"><img src={getResourceIcon(option.icon)} alt="" /><span>{option.name}</span></span>
      </GameTextureButton>)}
    </div>
    <p className="void-exchange-rate flex items-center justify-center gap-1.5"><span>{rate >= 1000 && rate % 1000 === 0 ? (rate / 1000) + 'к' : format(rate)}</span><img src={getResourceIcon(resource === 'tentacles' ? 'tentacles' : 't-pape')} alt={unit} className="h-5 w-7 object-contain" /><span>= 1</span>{currency}</p>
    <div className="void-exchange-counter">
      <GameTextureButton tone={busy || ap <= 1 || maxAp < 1 ? 'gray' : idleTone} type="button" disabled={busy || ap <= 1 || maxAp < 1} onClick={() => setAp(ap - 1)} aria-label={text(language, 'Зменшити AP', 'Уменьшить AP', 'Decrease AP')}><Minus className="relative z-10" /></GameTextureButton>
      <output aria-live="polite">{format(ap)} {currency}</output>
      <GameTextureButton tone={busy || ap >= maxAp ? 'gray' : idleTone} type="button" disabled={busy || ap >= maxAp} onClick={() => setAp(ap + 1)} aria-label={text(language, 'Збільшити AP', 'Увеличить AP', 'Increase AP')}><Plus className="relative z-10" /></GameTextureButton>
    </div>
    <div className="void-exchange-presets" role="group" aria-label={text(language, 'Швидкий вибір AP', 'Быстрый выбор AP', 'Quick AP selection')}>
      {[1, 5, 10, 'MAX'].map((value) => {
        const amount = value === 'MAX' ? maxAp : value;
        return <GameTextureButton tone={idleTone} key={value} type="button" disabled={busy || amount < 1 || amount > maxAp} aria-pressed={amount > 0 && amount === ap} onClick={() => setAp(amount)}><span className="void-exchange-preset-label relative z-10">{value}</span></GameTextureButton>;
      })}
    </div>
    <p className="void-exchange-available">{text(language, 'В наявності:', 'В наличии:', 'Available:')} <strong>{format(balance)}</strong></p>
    <GameTextureButton tone={pumpkins ? 'orange' : 'yellow'} type="button" disabled={busy || ap < 1 || ap > maxAp} onClick={onFlush} className="void-exchange-flush w-full disabled:opacity-45">
      <span className="void-exchange-flush-label"><ArrowDownToLine />{text(language, 'Змити у чорну діру', 'Смыть в чёрную дыру', 'Flush into the black hole')}</span>
    </GameTextureButton>
    {feedback && <p role="status" className="void-exchange-feedback">{feedback}</p>}
  </section>;
}
