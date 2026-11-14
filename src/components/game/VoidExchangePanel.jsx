import { Minus, Plus, ArrowDownToLine } from 'lucide-react';
import { getResourceIcon } from '@/lib/resourceIcons';
import GameTextureButton from './GameTextureButton';
import './voidExchangePanel.css';

const text = (language, uk, ru, en) => language === 'en' ? en : language === 'ru' ? ru : uk;
const formatNumber = (value, language) => new Intl.NumberFormat(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uk-UA').format(value);

export default function VoidExchangePanel({ language, resource, onResourceChange, ap, setAp, rate, balance, maxAp, busy, onFlush, feedback, compact = false }) {
  const format = (value) => formatNumber(value, language);
  const idleTone = resource === 'tentacles' ? 'dark-green' : 'dark-pink';
  const unit = resource === 'tentacles' ? text(language, 'щупалець', 'щупалец', 'tentacles') : text(language, 'паперу', 'бумаги', 'paper');
  const options = [
    { id: 'tentacles', name: text(language, 'Щупальця', 'Щупальца', 'Tentacles'), icon: 'tentacles' },
    { id: 'paper', name: text(language, 'Т-ПЕЙП', 'Т-ПЕЙП', 'T-PAPE'), icon: 't-pape' },
  ];
  return <section data-resource={resource} className={`void-exchange-panel${compact ? ' void-exchange-compact' : ''}`}>
    <div className="void-exchange-heading">
      <h2 className="void-exchange-title">{text(language, 'ОБМІН НА AP', 'ОБМЕН НА AP', 'EXCHANGE FOR AP')}</h2>
      <p className="void-exchange-subtitle">{text(language, 'Відправ ресурси в чорну діру', 'Отправь ресурсы в чёрную дыру', 'Send resources into the black hole')}</p>
      <span className="void-exchange-vortex" aria-hidden="true" />
    </div>
    <div className="void-exchange-resources" role="group" aria-label={text(language, 'Ресурс', 'Ресурс', 'Resource')}>
      {options.map((option) => <GameTextureButton tone={option.id === 'tentacles' ? 'green' : 'pink'} key={option.id} type="button" aria-pressed={resource === option.id} disabled={busy} onClick={() => onResourceChange(option.id)} className={`void-exchange-resource ${resource === option.id ? 'is-selected' : ''}`}>
        <span className="void-exchange-resource-content"><img src={getResourceIcon(option.icon)} alt="" /><span>{option.name}</span></span>
      </GameTextureButton>)}
    </div>
    <p className="void-exchange-rate">{format(rate)} {unit} = 1 AP</p>
    <div className="void-exchange-counter">
      <GameTextureButton tone={busy || ap <= 1 || maxAp < 1 ? 'gray' : idleTone} type="button" disabled={busy || ap <= 1 || maxAp < 1} onClick={() => setAp(ap - 1)} aria-label={text(language, 'Зменшити AP', 'Уменьшить AP', 'Decrease AP')}><Minus className="relative z-10" /></GameTextureButton>
      <output aria-live="polite">{format(ap)} AP</output>
      <GameTextureButton tone={busy || ap >= maxAp ? 'gray' : idleTone} type="button" disabled={busy || ap >= maxAp} onClick={() => setAp(ap + 1)} aria-label={text(language, 'Збільшити AP', 'Увеличить AP', 'Increase AP')}><Plus className="relative z-10" /></GameTextureButton>
    </div>
    <div className="void-exchange-presets" role="group" aria-label={text(language, 'Швидкий вибір AP', 'Быстрый выбор AP', 'Quick AP selection')}>
      {[1, 5, 10, 'MAX'].map((value) => {
        const amount = value === 'MAX' ? maxAp : value;
        return <GameTextureButton tone={idleTone} key={value} type="button" disabled={busy || amount < 1 || amount > maxAp} aria-pressed={amount > 0 && amount === ap} onClick={() => setAp(amount)}><span className="void-exchange-preset-label relative z-10">{value}</span></GameTextureButton>;
      })}
    </div>
    <p className="void-exchange-available">{text(language, 'В наявності:', 'В наличии:', 'Available:')} <strong>{format(balance)}</strong></p>
    <GameTextureButton tone="yellow" type="button" disabled={busy || ap < 1 || ap > maxAp} onClick={onFlush} className="void-exchange-flush w-full disabled:opacity-45">
      <span className="void-exchange-flush-label"><ArrowDownToLine />{text(language, 'Змити у чорну діру', 'Смыть в чёрную дыру', 'Flush into the black hole')}</span>
    </GameTextureButton>
    {feedback && <p role="status" className="void-exchange-feedback">{feedback}</p>}
  </section>;
}
