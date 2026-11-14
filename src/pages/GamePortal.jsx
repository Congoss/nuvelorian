import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Menu, Minus, Plus, Wallet, X } from 'lucide-react';
import bossUnderweight from '@/assets/boss/avatars/underweight.png';
import bossMoth from '@/assets/boss/avatars/moth.png';
import bossShork from '@/assets/boss/avatars/shork.png';
import energy from '@/assets/ui/energy.png';
import collectionOne from '@/assets/nft/nuvelor-collection-01.png';
import collectionTwo from '@/assets/nft/nuvelor-collection-02.png';
import './GamePortal.css';

const tabs = [['home', 'Головна'], ['about', 'Про гру'], ['roadmap', 'Roadmap'], ['collection', 'Персонажі'], ['faq', 'FAQ'], ['mint', 'Мінт']];
const aliases = { top: 'home', wiki: 'about', nft: 'mint', marketplace: 'mint', staking: 'roadmap', raffle: 'about', community: 'about' };
const creatures = [['Недоважок', bossUnderweight], ['Міль', bossMoth], ['Шорк', bossShork]];
const nftPreviews = [
  { image: collectionOne, name: 'Дезінсекторка', code: 'NUVELOR // 001', tone: 'mint' },
  { image: collectionTwo, name: 'Червоний шолом', code: 'NUVELOR // 002', tone: 'orange' },
];
const questions = [
  ['Що таке Nuvelor?', 'Браузерна гра про виживання, небезпечних босів і дослідження дивного світу.'],
  ['Як почати грати?', 'Натисни «У гру» у верхньому меню або на головній вкладці.'],
  ['Чи доступна NFT-колекція?', 'Колекція готується. Персонажі на цій сторінці — герої гри, а не доступні для продажу NFT.'],
  ['Де можна придбати NFT?', 'Мінт і маркетплейс поки не запущені. Посилання з’являться після підготовки колекції.'],
  ['Чи буде стейкінг?', 'Механіка розглядається. Умови та дата запуску ще не затверджені.'],
  ['Де знайти адресу контракту?', 'NFT-контракт ще не опублікований. Не надсилай кошти за неперевіреними адресами.'],
];
const phases = [
  ['01', 'Гра', 'У розробці', ['Браузерна версія', 'Боси та спорядження', 'Квести та розвиток героя', 'Спільнота гравців']],
  ['02', 'Колекція', 'Заплановано', ['Підготовка персонажів', 'Атрибути та рідкість', 'NFT-контракт', 'Запуск мінту']],
  ['03', 'Екосистема', 'Концепція', ['Розвиток ігрового світу', 'Механіки колекції', 'Дослідження стейкінгу', 'Події для спільноти']],
];
function tabFromHash(hash) {
  const id = hash.replace('#', '');
  return tabs.find(([key]) => key === id)?.[0] || aliases[id] || 'home';
}
function Heading({ label, children }) {
  return <div className="nv-heading"><p>{label}<span aria-hidden="true"> ▦</span></p><h2>{children}</h2></div>;
}
// The game and portal have separate root providers; entering the game must remount them.
function Link(props) {
  return <RouterLink {...props} reloadDocument />;
}
export default function GamePortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = tabFromHash(location.hash);
  const index = tabs.findIndex(([id]) => id === active);
  const previousIndex = useRef(index);
  const direction = index >= previousIndex.current ? 1 : -1;
  const reduced = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(0);
  const tabRefs = useRef([]);
  useEffect(() => { previousIndex.current = index; }, [index]);
  const select = (id) => {
    setMenu(false);
    navigate({ pathname: location.pathname, search: location.search, hash: `#${id}` });
  };
  const handleKeys = (event) => {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const next = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : (index + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    select(tabs[next][0]);
    tabRefs.current[next]?.focus();
    tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  return <main className="nv-portal" data-page={active}>
    <div className="nv-atmosphere" aria-hidden="true"><div className="nv-glow" /><div className="nv-grid" /><div className="nv-noise" /><img className="nv-float nv-float-one" src={energy} alt="" /><span className="nv-float nv-float-two">✦</span><span className="nv-float nv-float-three">✧</span></div>
    <header className="nv-header">
      <button className="nv-brand" onClick={() => select('home')} aria-label="Nuvelor — головна"><span className="nv-mark" aria-hidden="true" /><span>NUVELOR</span></button>
      <div className="nv-header-actions"><Link className="nv-button nv-quiet" to="/">У гру <ArrowUpRight size={17} /></Link><button className="nv-button nv-quiet" disabled title="Гаманець для NFT ще не підключений"><Wallet size={17} /><span>Скоро</span></button><button className="nv-menu-toggle" aria-label={menu ? 'Закрити меню' : 'Відкрити меню'} aria-expanded={menu} aria-controls="nv-menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div>
      {menu && <nav id="nv-menu" className="nv-menu" aria-label="Розділи" onKeyDown={(event) => { if (event.key === 'Escape') setMenu(false); }}>{tabs.map(([id, label]) => <button key={id} onClick={() => select(id)} aria-current={id === active ? 'page' : undefined}>{label}<ArrowUpRight size={16} /></button>)}</nav>}
    </header>
    <div className="nv-stage"><AnimatePresence initial={false} mode="wait" custom={direction}>
      <motion.section key={active} id={`nv-panel-${active}`} role="tabpanel" aria-labelledby={`nv-tab-${active}`} tabIndex={0} className="nv-panel" custom={direction}
        variants={{ enter: (d) => ({ opacity: 0, x: reduced ? 0 : d * 90 }), center: { opacity: 1, x: 0 }, leave: (d) => ({ opacity: 0, x: reduced ? 0 : d * -90 }) }}
        initial="enter" animate="center" exit="leave" transition={{ duration: reduced ? 0 : .34, ease: [.22, 1, .36, 1] }}>
        <div className="nv-content">
          {active === 'home' && <div className="nv-home nv-columns"><div className="nv-copy"><p className="nv-eyebrow">Дивний світ. Твоя історія.</p><h1>ГРАЙ. ВИЖИВАЙ.<br />ЗБИРАЙ <span>✦</span></h1><h3>Ласкаво просимо в Nuvelor</h3><div className="nv-cta"><Link to="/" className="nv-button nv-primary">Увійти в гру <ArrowUpRight size={18} /></Link><button className="nv-button nv-outline" onClick={() => select('collection')}>Дослідити світ</button></div><div className="nv-home-notes"><p>БОСИ · КВЕСТИ · СПОРЯДЖЕННЯ</p><p>МАЙБУТНЯ NFT-КОЛЕКЦІЯ — <strong>НЕЗАБАРОМ</strong></p><p>ТВІЙ ШЛЯХ ПОЧИНАЄТЬСЯ ТУТ</p></div></div><motion.div className="nv-hero-art" animate={reduced ? undefined : { y: [0, -15, 0], rotate: [-2, 2, -2] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}><img src={bossUnderweight} alt="Недоважок — персонаж Nuvelor" /><span className="nv-art-caption">NUVELOR / CREATURE 001</span></motion.div></div>}
          {active === 'about' && <div className="nv-columns nv-about"><div><Heading label="Наша історія">ПРО NUVELOR</Heading><p>Світ, у якому виживання — лише початок. Зустрічай дивних істот, збирай спорядження й розвивай свого героя.</p><p>Бийся з босами, виконуй квести та знаходь своє місце у спільноті. Майбутня колекція продовжить історію цього всесвіту.</p></div><div className="nv-facts">{[['Боси', 'Небезпечні зустрічі'], ['Квести', 'Нові виклики'], ['Спорядження', 'Розвиток героя'], ['NFT', 'Колекція готується']].map(([title, text]) => <div key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></div>}
          {active === 'roadmap' && <><Heading label="Наші цілі">ROADMAP</Heading><div className="nv-roadmap">{phases.map(([number, title, status, items]) => <article key={number}><h3>Етап {number} — {title}</h3><p className="nv-status">{status}</p><ul>{items.map(item => <li key={item}><Minus size={16} />{item}</li>)}</ul></article>)}</div></>}
          {active === 'collection' && <><Heading label="Архів істот">ПЕРСОНАЖІ</Heading><div className="nv-creatures">{creatures.map(([name, image], i) => <motion.article key={name} initial={reduced ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: reduced ? 0 : i * .1 }} whileHover={reduced ? undefined : { y: -8 }}><div><img src={image} alt={name} /></div><p>CREATURE / 00{i + 1}</p><h3>{name}</h3></motion.article>)}</div></>}
          {active === 'faq' && <><Heading label="FAQ">ЗАПИТАННЯ Й ВІДПОВІДІ</Heading><div className="nv-faq">{[questions.slice(0, 3), questions.slice(3)].map((column, col) => <div key={col}>{column.map(([question, answer], i) => { const id = col * 3 + i; const open = openQuestion === id; return <article key={question}><h3><button id={`nv-question-${id}`} aria-expanded={open} aria-controls={`nv-answer-${id}`} onClick={() => setOpenQuestion(open ? -1 : id)}>{question}{open ? <Minus size={20} /> : <Plus size={20} />}</button></h3><div id={`nv-answer-${id}`} role="region" aria-labelledby={`nv-question-${id}`} hidden={!open}><p>{answer}</p></div></article>; })}</div>)}</div></>}
          {active === 'mint' && <div className="nv-mint-page">
            <div className="nv-mint-title"><Heading label="Прев’ю майбутньої колекції">NUVELOR NFT</Heading><p>Перший погляд на персонажів майбутньої колекції.</p></div>
            <div className="nv-nft-grid">{nftPreviews.map(({ image, name, code, tone }, i) => <motion.article key={code} className={`nv-nft-card nv-nft-${tone}`} initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * .12 }} whileHover={reduced ? undefined : { y: -6 }}>
              <div className="nv-nft-art"><img src={image} alt={`${name} — персонаж майбутньої колекції Nuvelor`} /><span>PREVIEW</span></div>
              <div className="nv-nft-meta"><div><p>{code}</p><h3>{name}</h3></div><span className="nv-nft-status">SOON</span></div>
            </motion.article>)}</div>
            <div className="nv-nft-footer"><div><span className="nv-live-dot" />Колекція готується</div><button className="nv-button nv-primary" disabled><Wallet size={17} /> Мінт ще не відкрито</button></div>
            <p className="nv-nft-note">Зображення показані як прев’ю. Контракт, кількість і ціна будуть оголошені перед запуском. Оплата поки не приймається.</p>
          </div>}
        </div>
      </motion.section>
    </AnimatePresence></div>
    {active === 'home' && <div className="nv-ticker" aria-hidden="true"><div>{[0, 1].map(n => <span key={n}>NUVELOR UNIVERSE　 ✧　 PLAY & SURVIVE　 ✧　 COLLECTION COMING SOON　 ✧　 NUVELOR UNIVERSE　 ✧　 PLAY & SURVIVE　 ✧　 </span>)}</div></div>}
    <nav className="nv-tabs" role="tablist" aria-label="Розділи Nuvelor" onKeyDown={handleKeys}>{tabs.map(([id, label], i) => <button key={id} ref={el => { tabRefs.current[i] = el; }} id={`nv-tab-${id}`} role="tab" aria-selected={active === id} aria-controls={`nv-panel-${id}`} tabIndex={active === id ? 0 : -1} onClick={() => select(id)}><span>{String(i + 1).padStart(2, '0')}.</span> {label}</button>)}</nav>
  </main>;
}
