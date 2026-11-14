import { GUM_QUEEN_DOSSIER_STORIES } from '@/lib/gumQueenDossierStories';
import { KANGAROO_DOSSIER_STORIES } from '@/lib/kangarooDossierStories';
import { SOLDIER_DOSSIER_STORIES } from '@/lib/soldierDossierStories';
import { SHKRABAN_DOSSIER_STORIES } from '@/lib/shkrabanDossierStories';
import shkrabanPortrait from '@/assets/boss/avatars/shkraban.png';
import shkrabanBackground from '@/assets/ui/shkraban-profile-strip-v1.webp';
import { readLocalDossierView, saveLocalDossierView } from '@/lib/localDossierView';
import DossierClassifiedStamp from './DossierClassifiedStamp';
import { CHEESE_DOSSIER_STORIES } from '@/lib/cheeseDossierStories';
import cheesePlanet from '@/assets/ui/cheese-profile-bg-v1.png';
import { PROFILE_HEADER_THEMES } from '@/lib/profileHeaderThemes';
import { useContext, useState } from 'react';
import { unlockLocalProfileHeaderSkin } from '@/lib/localProfileHeaderSkin';
import { ArrowLeft, X, Gift, Lock, Check, Radio } from 'lucide-react';
import { AchievementClaimContext } from '@/lib/useAchievementLanguage';
import { getDossierChapters, DOSSIER_STORIES, dossierChapterUnlocked } from '@/lib/bossDossier';
import { MOTH_DOSSIER_STORIES } from '@/lib/mothDossierStories';
import { SHORK_DOSSIER_STORIES } from '@/lib/shorkDossierStories';
import { WORM_DOSSIER_STORIES } from '@/lib/wormDossierStories';
import { SPORGOL_DOSSIER_STORIES } from '@/lib/sporgolDossierStories';
import { CLEOPATRASH_DOSSIER_STORIES } from '@/lib/cleopatrashDossierStories';
import { SUCKHOLE_DOSSIER_STORIES } from '@/lib/suckholeDossierStories';
import { BOSS_MEDAL_IMGS } from '@/lib/playerMedalAssets';
import { getResourceIcon } from '@/lib/resourceIcons';
import bossPortrait from '@/assets/boss/avatars/underweight.png';
import dossierPlanet from '@/assets/quests/dossier-heli-background-v3.png';
import mothPortrait from '@/assets/boss/avatars/moth.png';
import mothPlanet from '@/assets/quests/dossier-tank-background-v3.png';
import shorkPortrait from '@/assets/boss/avatars/shork.png';
import shorkPlanet from '@/assets/quests/dossier-chinook-background-v3.png';
import wormPortrait from '@/assets/boss/avatars/worm.png';
import wormPlanet from '@/assets/quests/dossier-boss4-background-v3.png';
import sporgolPortrait from '@/assets/boss/avatars/sporgol.png';
import sporgolPlanet from '@/assets/quests/dossier-boss5-background-v3.png';
import cleopatrashPlanet from '@/assets/quests/dossier-boss7-background-v3.png';
import cleopatrashPortrait from '@/assets/boss/avatars/cleopatrash.png';
import suckholePortrait from '@/assets/boss/avatars/suckhole.png';
import suckholePlanet from '@/assets/quests/dossier-boss6-background-v3.png';
import './bossDossier.css';

const COPY = {
  uk: { back:'До медалей', close:'Закрити досьє', file:'АРХІВ АНОМАЛІЙ / СПРАВА 001', name:'Недоважок', location:'P4-U00 · Загублена доставка', tiers:['Бронза','Срібло','Золото'], sealed:'Розділ засекречено', unlock:'Перемоги над босом', signal:'Сигнал: бонус доступний', claim:'Забрати бонус', claimed:'Бонус отримано', reward:'Мала отрута', busy:'Отримуємо…', error:'Не вдалося отримати. Спробуй ще раз.', guest:'Одноразовий бонус власника медалі', preview:'Перегляд · ресурси не видаються', note:'Поштова служба не відповідає за пошкодження причинності.' },
  ru: { back:'К медалям', close:'Закрыть досье', file:'АРХИВ АНОМАЛИЙ / ДЕЛО 001', name:'Недовес', location:'P4-U00 · Потерянная доставка', tiers:['Бронза','Серебро','Золото'], sealed:'Раздел засекречен', unlock:'Победы над боссом', signal:'Сигнал: бонус доступен', claim:'Забрать бонус', claimed:'Бонус получен', reward:'Малый яд', busy:'Получаем…', error:'Не удалось получить. Попробуй ещё раз.', guest:'Разовый бонус владельца медали', preview:'Просмотр · ресурсы не выдаются', note:'Почта не отвечает за повреждения причинности.' },
  en: { back:'Back to medals', close:'Close dossier', file:'ANOMALY ARCHIVE / CASE 001', name:'Underweight', location:'P4-U00 · Lost Delivery', tiers:['Bronze','Silver','Gold'], sealed:'Chapter classified', unlock:'Boss victories', signal:'Signal: bonus ready', claim:'Claim bonus', claimed:'Bonus claimed', reward:'Small poison', busy:'Claiming…', error:'Could not claim. Try again.', guest:'One-time bonus for the medal owner', preview:'Preview · no resources granted', note:'Postal services accept no liability for damaged causality.' },
};

const rewardItems = {
  uk: {'small-poison':'Мала отрута','medium-poison':'Середня отрута','large-poison':'Фляга з отрутою',spins:'Спіни','gum-normal':'Звичайна жуйка','gum-improved':'Покращена жуйка'},
  ru: {'small-poison':'Малый яд','medium-poison':'Средний яд','large-poison':'Фляга с ядом',spins:'Спины','gum-normal':'Обычная жвачка','gum-improved':'Улучшенная жвачка'},
  en: {'small-poison':'Small Poison','medium-poison':'Medium Poison','large-poison':'Poison Flask',spins:'Spins','gum-normal':'Normal Gum','gum-improved':'Improved Gum'},
};

export default function BossDossier({ profile, language, preview, onBack, bossId = 'heli' }) {
  const owner = useContext(AchievementClaimContext);
  const skinOwnerId = owner?.profile?.id || profile?.id;
  const isOwner = String(owner?.profile?.id || '') === String(profile?.id || '') && Boolean(profile?.id);
  const currentProfile = isOwner ? owner.profile : profile;
  const chapterViewKey = `p4-dossier-chapter:${profile?.id}:${bossId}`;
  const [active, setActiveState] = useState(() => { const saved = readLocalDossierView(chapterViewKey, 0); return [0,1,2].includes(saved) ? saved : 0; });
  function setActive(value) { saveLocalDossierView(chapterViewKey, value); setActiveState(value); }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [receipts, setReceipts] = useState({});
  const [stampId, setStampId] = useState(null);
  const [localFitting, setLocalFitting] = useState(false);
  const sandbox = Boolean(preview);
  const isGumQueen = bossId === 'ship-portal';
  const isKangaroo = bossId === 'ship-hangar';
  const isSoldier = bossId === 'ship-engine';
  const isShkraban = bossId === 'boss8';
  const isCheese = bossId === 'ship-hull';
  const isMoth = bossId === 'tank';
  const isShork = bossId === 'chinook';
  const isWorm = bossId === 'boss4';
  const isSporgol = bossId === 'boss5';
  const isCleopatrash = bossId === 'boss7';
  const isSuckhole = bossId === 'boss6';
  const fileNumber = isGumQueen ? '012' : isKangaroo ? '011' : isSoldier ? '010' : isShkraban ? '008' : isCheese ? '009' : isSuckhole ? '006' : isCleopatrash ? '007' : isSporgol ? '005' : isWorm ? '004' : isShork ? '003' : isMoth ? '002' : '001';
  const portrait = isGumQueen ? '/ship-gum-queen/portrait-card.webp' : isKangaroo ? '/ship-kangaroo-boss/portrait-card.webp' : isSoldier ? '/ship-soldier-boss/portrait-card-v2.webp' : isShkraban ? shkrabanPortrait : isCheese ? '/ship-cheese-boss/portrait-card-v3.webp' : isSuckhole ? suckholePortrait : isCleopatrash ? cleopatrashPortrait : isSporgol ? sporgolPortrait : isWorm ? wormPortrait : isShork ? shorkPortrait : isMoth ? mothPortrait : bossPortrait;
  const planet = isGumQueen ? '/ship-gum-queen/cartoon-garage.webp' : isKangaroo ? '/ship-kangaroo-boss/background.webp' : isSoldier ? '/ship-soldier-boss/growth-room-v2.webp' : isShkraban ? shkrabanBackground : isCheese ? cheesePlanet : isSuckhole ? suckholePlanet : isCleopatrash ? cleopatrashPlanet : isSporgol ? sporgolPlanet : isWorm ? wormPlanet : isShork ? shorkPlanet : isMoth ? mothPlanet : dossierPlanet;
  const locationCode = isGumQueen ? 'SHIP-PORTAL' : isKangaroo ? 'SHIP-HANGAR' : isSoldier ? 'SHIP-ENGINE' : isShkraban ? 'TELETRON' : isCheese ? 'SHIP-HULL' : isSuckhole ? 'P4-U05' : isCleopatrash ? 'BOSS-07' : isSporgol ? 'P4-U04' : isWorm ? 'P4-U03' : isShork ? 'P4-U02' : isMoth ? 'P4-U01' : 'P4-U00';
  const copy = {...COPY[language], ...(isSuckhole ? {name:{uk:'Засмокт',ru:'Засос',en:'Suckhole'}[language]} : isCleopatrash ? {name:{uk:'Клеопатреш',ru:'Клеопатреш',en:'Cleopatrash'}[language]} : isSporgol ? {name:{uk:'Споргол',ru:'Споргол',en:'Sporgol'}[language]} : isWorm ? {name:{uk:'Глиста',ru:'Глиста',en:'Worm'}[language]} : isMoth ? {name: {uk:'Міль',ru:'Моль',en:'Moth'}[language]} : isShork ? {name:{uk:'Шорк',ru:'Шорк',en:'Shork'}[language]} : {})};
  const chapters = getDossierChapters(bossId);
  if(isCheese)copy.name={uk:'Сирний паразит',ru:'Сырный паразит',en:'Cheese Parasite'}[language];
  if(isShkraban)copy.name={uk:'Шкрябан',ru:'Шкрябан',en:'Shkraban'}[language];
  if(isSoldier)copy.name={uk:'Заражений солдат',ru:'Заражённый солдат',en:'Infected Soldier'}[language];
  if(isKangaroo)copy.name={uk:'Орбітальний нокаут',ru:'Орбитальный нокаут',en:'Orbital Knockout'}[language];
  if(isGumQueen)copy.name={uk:'Жуйкова королева',ru:'Королева жвачек',en:'Gum Queen'}[language];
  const chapter = chapters[active];
  const hasHeaderReward = chapter.tier === 'gold' && (sandbox || isOwner) && Boolean(PROFILE_HEADER_THEMES[bossId]);
  const unlocked = (sandbox && localFitting) || dossierChapterUnlocked(currentProfile, chapter);
  const claimed = Boolean(receipts[chapter.id] || (!sandbox && currentProfile.player_achievements?.[chapter.id]?.reward_status === 'claimed'));
  const canClaim = unlocked && !claimed && (sandbox || isOwner);
  const story = (isGumQueen ? GUM_QUEEN_DOSSIER_STORIES : isKangaroo ? KANGAROO_DOSSIER_STORIES : isSoldier ? SOLDIER_DOSSIER_STORIES : isShkraban ? SHKRABAN_DOSSIER_STORIES : isCheese ? CHEESE_DOSSIER_STORIES : isSuckhole ? SUCKHOLE_DOSSIER_STORIES : isCleopatrash ? CLEOPATRASH_DOSSIER_STORIES : isSporgol ? SPORGOL_DOSSIER_STORIES : isWorm ? WORM_DOSSIER_STORIES : isShork ? SHORK_DOSSIER_STORIES : isMoth ? MOTH_DOSSIER_STORIES : DOSSIER_STORIES)[language][active];
  const summary = (isGumQueen ? {uk:[['Фах','Чотири руки. Гаманець перевірив?'],['Реактор','Запитай у звірятка.'],['Розшук','Дев’ять станцій. Душ не згадуй.']],ru:[['Профиль','Четыре руки. Кошелёк проверил?'],['Реактор','Спроси у зверька.'],['Розыск','Девять станций. Душ не упоминай.']],en:[['Job','Four hands. Check your wallet.'],['Reactor','Ask her pet.'],['Wanted','Nine stations. Forget the shower.']]} : isKangaroo ? {uk:[['Фах','Астрофізик. Подача — сорок метрів.'],['Напої','Спогади продаються окремо.'],['Тренер','У рюкзаку. Гроші теж.']],ru:[['Профиль','Астрофизик. Подача — сорок метров.'],['Напитки','Воспоминания продаются отдельно.'],['Тренер','В рюкзаке. Деньги тоже.']],en:[['Job','Astrophysicist. Forty-meter delivery.'],['Drinks','Memories sold separately.'],['Coach','In the backpack. So is the cash.']]} : isSoldier ? {uk:[['Служба','Тридцять років. Без зміни.'],['Діагноз','Він їв гриб. Гриб не згоден.'],['Підрозділ','На карантині. Карти не показуй.']],ru:[['Служба','Тридцать лет. Без смены.'],['Диагноз','Он ел гриб. Гриб не согласен.'],['Подразделение','На карантине. Карты не показывай.']],en:[['Service','Thirty years. No relief.'],['Diagnosis','Ate a mushroom. It disagrees.'],['Unit','Quarantined. Hide your cards.']]} : isShkraban ? {uk:[['Фах','Ремонтник. Зламав планету.'],['Ефір','Цілодобовий. Навіть у труні.'],['Реклама','П’ять секунд. Мінус рік.']],ru:[['Профиль','Ремонтник. Сломал планету.'],['Эфир','Круглосуточный. Даже в гробу.'],['Реклама','Пять секунд. Минус год.']],en:[['Job','Repairman. Broke a planet.'],['Broadcast','24/7. Even in your coffin.'],['Ads','Five seconds. One year gone.']]} : isCheese ? {uk:[['Фах','Ремонтує. До першого укусу.'],['Корпус','Витримка три роки.'],['Технагляд','Дві миші. Обидві голодні.']],ru:[['Профиль','Чинит. До первого укуса.'],['Корпус','Выдержка три года.'],['Технадзор','Две мыши. Обе голодные.']],en:[['Job','Repairs. Until the first bite.'],['Hull','Aged three years.'],['Inspection','Two mice. Both hungry.']]} : isSuckhole ? {
    uk: [['Фах', 'Видаляє. Насправді — стискає.'], ['Спогади', 'Твій сором. Повний зал.'], ['Банка', 'Нуль. Не ділити.']],
    ru: [['Профиль', 'Удаляет. На деле — сжимает.'], ['Воспоминания', 'Твой стыд. Полный зал.'], ['Банка', 'Ноль. Не делить.']],
    en: [['Job', 'Deletes. Actually compresses.'], ['Memories', 'Your shame. A full house.'], ['Jar', 'Zero. Do not divide.']],
  } : isCleopatrash ? {
    uk: [['Статус', 'Шукає чоловіка. Назавжди.'], ['Посаг', 'Піраміда. Будувати тобі.'], ['Розлучення', 'По банках.']],
    ru: [['Статус', 'Ищет мужа. Навсегда.'], ['Приданое', 'Пирамида. Строить тебе.'], ['Развод', 'По банкам.']],
    en: [['Status', 'Seeking husband. Forever.'], ['Dowry', 'A pyramid. You build it.'], ['Divorce', 'Sorted into jars.']],
  } : isSporgol ? {
    uk: [['Фах', 'Оздоровлює. Тепер вас двоє.'], ['Відгуки', 'Усі задоволені. Навіть кашель.'], ['Корона', 'Не їсти. Він уже.']],
    ru: [['Профиль', 'Оздоровляет. Теперь вас двое.'], ['Отзывы', 'Все довольны. Даже кашель.'], ['Корона', 'Не есть. Он уже.']],
    en: [['Job', 'Wellness. Now there’s two of you.'], ['Reviews', 'Even your cough approves.'], ['Crown', 'Do not eat. He already did.']],
  } : isWorm ? {
    uk: [['Фах', 'Рієлтор. Тебе вже засвоюють.'], ['Житло', 'Тепло. Слизько. Без застави.'], ['Вихід', 'Є. Але ти не персонал.']],
    ru: [['Профиль', 'Риелтор. Тебя уже усваивают.'], ['Жильё', 'Тепло. Скользко. Без залога.'], ['Выход', 'Есть. Но ты не персонал.']],
    en: [['Job', 'Landlord. You’re being digested.'], ['Housing', 'Warm. Slimy. Deposit gone.'], ['Exit', 'Exists. But you’re not staff.']],
  } : isShork ? {
    uk: [['Фах', 'Король. До розморожування.'], ['Сервіс', 'Ремонтує. Разом із тобою.'], ['Гарантія', 'Довічна. Термін — у майстра.']],
    ru: [['Профиль', 'Король. До разморозки.'], ['Сервис', 'Чинит. Вместе с тобой.'], ['Гарантия', 'Пожизненная. Срок — у мастера.']],
    en: [['Job', 'King. Until defrosted.'], ['Service', 'Repairs appliances. And you.'], ['Warranty', 'Lifetime. Mechanic decides.']],
  } : isMoth ? {
    uk: [['Фах', 'Їсть колір. Сре розкішшю.'], ['Меню', 'Місто. Спогади — на десерт.'], ['Секрет', 'Рожевий. Але це між нами.']],
    ru: [['Профиль', 'Ест цвет. Срёт роскошью.'], ['Меню', 'Город. Воспоминания — на десерт.'], ['Секрет', 'Розовый. Но это между нами.']],
    en: [['Job', 'Eats color. Shits luxury.'], ['Menu', 'A city. Memories for dessert.'], ['Secret', 'Pink. Keep it between us.']],
  } : {
    uk: [['Фах', 'Кур’єр. Винен — ти.'], ['Вантаж', 'Планета. Ти — у комплекті.'], ['Скан', 'Маса −3 кг. Совість — 0.']],
    ru: [['Профиль', 'Курьер. Виноват — ты.'], ['Груз', 'Планета. Ты — в комплекте.'], ['Скан', 'Масса −3 кг. Совесть — 0.']],
    en: [['Job', 'Courier. Your fault.'], ['Cargo', 'A planet. You’re included.'], ['Scan', 'Mass: −3 kg. Conscience: 0.']],
  })[language];
  const labels = {
    uk: ['КОСМО ТАЄМНО', 'КОСМОДОСЬЄ', 'ГАЛАКТИЧНА ПОШТА / БЮРО АНОМАЛІЙ', 'Ідентифікований об’єкт', 'Міжгалактичний кур’єр', 'Дані біосканера', 'Маса: −3 кг. Совість: сигнал відсутній.', 'Відновлений бортовий запис', 'ВАНТАЖНИЙ МАНІФЕСТ / БОНУС', 'БІОСКАН ПІДТВЕРДЖЕНО'],
    ru: ['КОСМО СЕКРЕТНО', 'КОСМОДОСЬЕ', 'ГАЛАКТИЧЕСКАЯ ПОЧТА / БЮРО АНОМАЛИЙ', 'Идентифицированный объект', 'Межгалактический курьер', 'Данные биосканера', 'Масса: −3 кг. Совесть: сигнал отсутствует.', 'Восстановленная бортовая запись', 'ГРУЗОВОЙ МАНИФЕСТ / БОНУС', 'БИОСКАН ПОДТВЕРЖДЁН'],
    en: ['COSMIC TOP SECRET', 'COSMIC DOSSIER', 'GALACTIC POST / ANOMALY BUREAU', 'Identified subject', 'Intergalactic courier', 'Bioscanner readings', 'Mass: −3 kg. Conscience: no signal.', 'Recovered flight log', 'CARGO MANIFEST / BONUS', 'BIOSCAN VERIFIED'],
  }[language];
  async function claim() {
    if (!canClaim || busy) return;
    setBusy(true); setError(false);
    try { if (!sandbox) await owner.claim(chapter.id); if(sandbox && hasHeaderReward)unlockLocalProfileHeaderSkin(skinOwnerId,bossId); setReceipts(value => ({ ...value, [chapter.id]: true })); setStampId(chapter.id); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section className="boss-dossier">
    <div className="dossier-nav">
      <button autoFocus type="button" onClick={onBack} className="dossier-back"><ArrowLeft size={14}/>{copy.back}</button>
      <button type="button" onClick={onBack} aria-label={copy.close} title={copy.close} className="dossier-close"><X size={19}/></button>
    </div>
    <div className="dossier-paper" style={{'--dossier-planet': `url("${planet}")`}}>
    <div className="dossier-overview">
    <header className="dossier-heading">
      <div className="dossier-topline"><span className="dossier-stamp"><span>{labels[0].split(' ')[0]}</span><span>{labels[0].split(' ').slice(1).join(' ')}</span></span></div>
      <div className="dossier-award"><img src={BOSS_MEDAL_IMGS[bossId][chapter.tier]} alt={copy.tiers[active]}/></div>
      <p className="dossier-file-label">{labels[1]}</p>
      <h3 className="dossier-handwriting">{copy.name}</h3>
    </header>
    <div className="dossier-identity">
      <figure className="dossier-photo"><span className="dossier-clip" aria-hidden="true"/><span className="dossier-scan-corners" aria-hidden="true"/><img src={portrait} alt={copy.name}/><figcaption>{locationCode} / BIO-ID: {fileNumber}</figcaption><span className="dossier-photo-stamp">{labels[9]}</span></figure>
      <div className="dossier-facts">{summary.map(([label, value]) => <p key={label}><span>{label}:</span> {value}</p>)}</div>
    </div>
    </div>
    <div role="tablist" aria-label={copy.name} className="dossier-tabs">{chapters.map((row, index) => {
      const open = (sandbox && localFitting) || dossierChapterUnlocked(currentProfile, row);
      const ready = open && !receipts[row.id] && (sandbox || (isOwner && currentProfile.player_achievements?.[row.id]?.reward_status !== 'claimed'));
      return <button key={row.id} role="tab" id={`dossier-tab-${row.tier}`} aria-controls="dossier-chapter" aria-selected={index === active} type="button" onClick={() => { setActive(index); setError(false); }} className="dossier-tab">
        <img src={BOSS_MEDAL_IMGS[bossId][row.tier]} alt="" className={open ? '' : 'is-locked'}/><span>{!open && <Lock size={10}/>} {copy.tiers[index]}</span><small>{String(index + 1).padStart(2, '0')} / {row.target}</small>{ready && <i className="dossier-beacon"/>}
      </button>;
    })}</div>
    <div role="tabpanel" id="dossier-chapter" aria-labelledby={`dossier-tab-${chapter.tier}`} className="dossier-content">
      <p className="dossier-section-label">{labels[7]} / {String(active + 1).padStart(2, '0')}</p>
      <div key={chapter.id} className="dossier-story-scroll" tabIndex={0} aria-label={labels[7]}>
        {unlocked ? <><h4 className="dossier-story-title">{story[0]}</h4>{story.slice(1).map((paragraph, index) => <p key={index} className="dossier-paragraph" style={{whiteSpace:'pre-line'}}>{paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2,-2)}</strong> : part)}</p>)}</> : <div className="dossier-locked"><DossierClassifiedStamp language={language}/><p>{copy.unlock}: {(bossId.startsWith('ship-') ? currentProfile.ship_boss_kills?.[bossId.slice(5)] : currentProfile.boss_kills_by_id?.[bossId]) || 0}/{chapter.target}</p>{sandbox && <button type="button" className="dossier-local-fitting" onClick={()=>setLocalFitting(true)}>{{uk:'Відкрити для примірки',ru:'Открыть для примерки',en:'Open for fitting'}[language]}</button>}</div>}
      </div>
      {(sandbox || isOwner) && <div className={`dossier-reward ${canClaim ? 'is-ready' : ''} ${claimed ? 'is-claimed' : ''}`}>
        <p className="dossier-section-label">{labels[8]}</p>
        <p className="dossier-reward-status" role="status">{canClaim ? <Radio size={14}/> : claimed ? <Check size={14}/> : <Gift size={14}/>} {claimed ? copy.claimed : sandbox ? copy.preview : canClaim ? copy.signal : copy.guest}</p>
        <div className="dossier-reward-item dossier-reward-pack">{Object.entries(chapter.rewards).map(([id, amount]) => {
          const item = rewardItems[language][id];
          const icon = id.startsWith('gum-') ? `/local-enhancement/${id}.webp` : getResourceIcon(id);
          return <span key={id} title={item}><img src={icon} alt={item}/><b>×{amount}</b></span>;
        })}</div>
        {canClaim && <button type="button" disabled={busy} onClick={claim} className="dossier-claim">{busy ? copy.busy : copy.claim}</button>}
        {claimed && <div key={chapter.id} className={`dossier-claimed-stamp ${stampId === chapter.id ? 'is-stamping' : ''}`} onAnimationEnd={() => setStampId(null)} aria-label={copy.claimed}><Check aria-hidden="true" size={20}/><span>{copy.claimed}</span></div>}
      </div>}
      {error && <p role="alert" className="dossier-error">{copy.error}</p>}
      <footer className="dossier-footer"><p>{copy.note}</p><span>{fileNumber} — {String(active + 1).padStart(2, '0')}</span></footer>
    </div>
    </div>
  </section>;
}
