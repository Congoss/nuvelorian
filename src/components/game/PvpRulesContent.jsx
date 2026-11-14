import { ArrowRight, Clock3, ShieldCheck, Swords } from 'lucide-react';
import BossWeaponIcon from './BossWeaponIcon';
import GameTextureButton from './GameTextureButton';
import cardBackground from '@/assets/pvp/duel-card-bg-v1.webp';

export default function PvpRulesContent({ language = 'uk', online, onClose }) {
  const text = (uk, ru, en) => language === 'ru' ? ru : language === 'en' ? en : uk;
  const actions = [
    { id: 'fist', name: text('Палець', 'Палец', 'Finger') },
    { id: 'knuckle', name: text('Олівець', 'Карандаш', 'Pencil') },
    { id: 'satchel', name: text('Яд', 'Яд', 'Poison') },
  ];
  return <div className="pvp-rules-content" style={{ backgroundImage: `url(${cardBackground})` }}>
    <small>{text('ПАМ’ЯТКА ПІЛОТА', 'ПАМЯТКА ПИЛОТА', 'PILOT FIELD GUIDE')}</small>
    <h2>{text('ХТО КОГО Б’Є', 'КТО КОГО БЬЁТ', 'WHAT BEATS WHAT')}</h2>
    <div className="pvp-counter-diagram">{actions.map((action, i) => <div className="pvp-counter-row" key={action.id}>
      <div><BossWeaponIcon weapon={action} showDamage={false}/><b>{action.name}</b></div>
      <span><ArrowRight aria-hidden="true"/><small>{text('б’є', 'бьёт', 'beats')}</small></span>
      <div><BossWeaponIcon weapon={actions[(i + 1) % 3]} showDamage={false}/><b>{actions[(i + 1) % 3].name}</b></div>
    </div>)}</div>
    <div className="pvp-rule-notes">
      <p><Swords aria-hidden="true"/>{text('Однакові ходи — нічия. Переможний хід завдає спільну шкоду зброї. Отрута з інвентарю не витрачається.', 'Одинаковые ходы — ничья. Победивший ход наносит общий урон оружия. Яд из инвентаря не тратится.', 'Matching moves draw. A winning move deals your shared weapon damage. No inventory poison is consumed.')}</p>
      <p><ShieldCheck aria-hidden="true"/>{online ? text('Шукаємо гравця до 10 секунд, далі — суперник ШІ. Ходи приховані; ШІ обирає заздалегідь. Спорядження фіксується на початку пошуку.', 'Ищем игрока до 10 секунд, далее — соперник ИИ. Ходы скрыты; ИИ выбирает заранее. Снаряжение фиксируется в начале поиска.', 'We search for a player for 10 seconds, then match you with AI. Moves stay hidden; AI chooses first. Gear is captured when joining the queue.') : text('ШІ обирає хід заздалегідь і вчиться лише на минулих раундах. Примірка білду діє тільки в тренуванні.', 'ИИ выбирает ход заранее и учится только на прошлых раундах. Примерка билда действует только в тренировке.', 'AI chooses first and only learns from earlier rounds. Build previews apply only in training.')}</p>
      {online && <p><Clock3 aria-hidden="true"/>{text('30 секунд на хід. Пропустив — поразка; пропустили обидва — нічия. Вихід з арени — поразка. Після перезавантаження можна повернутися до бою.', '30 секунд на ход. Пропустил — поражение; пропустили оба — ничья. Выход из арены — поражение. После перезагрузки можно вернуться в бой.', '30 seconds per move. Missing it forfeits; both missing draws. Leaving the arena forfeits. Reloading lets you resume.')}</p>}
    </div>
    <GameTextureButton type="button" tone="green" onClick={onClose} className="pvp-rules-close"><span>{text('ЗРОЗУМІЛО', 'ПОНЯТНО', 'GOT IT')}</span></GameTextureButton>
  </div>;
}
