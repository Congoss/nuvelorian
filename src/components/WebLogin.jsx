import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, LoaderCircle, Info, X, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '@/assets/ui/planet4-nuvelorian-logo.png';
import space from '@/assets/optimized/all/boss/boss_1/boss1_bck/boss4/kosmo/background-kosmo.webp';
import planet from '@/assets/login/nuvelor-junk-planet-v1.png';
import nearLogo from '@/assets/ui/near-logo.svg';
import frameHero from '@/assets/login/legendary-frame-hero-v1.png';
import voidling from '@/assets/hero/bp leg set/voidling-pet.png';
import { HALLOWEEN, halloweenActive } from '@/lib/halloweenEvent';
import herePet from '@/assets/hero/hereearlypet/hereearlypet-icon.webp';
import legionPet from '@/assets/login/legion-pet-transparent-v1.png';
import hotWalletLogo from '@/assets/login/hot-wallet-logo.svg';
import legionLogo from '@/assets/login/near-legion-logo.webp';
import hereNftOne from '@/assets/login/here-nft-preview-1.png';
import hereNftTwo from '@/assets/login/here-nft-preview-2.png';
import legionNftOne from '@/assets/login/legion-nft-preview-1.png';
import legionNftTwo from '@/assets/login/legion-nft-preview-2.png';

import LoginSpaceBackground from './LoginSpaceBackground';
import legendaryScreenshot from '@/assets/login/gameplay/legendary-hero.png';
import bossScreenshot from '@/assets/login/gameplay/cleopatrash-battle.png';
import leaderboardScreenshot from '@/assets/login/gameplay/leaderboard.png';
import fishingScreenshot from '@/assets/login/gameplay/cosmo-fishing.png';
import anubisScreenshot from '@/assets/login/gameplay/anubis-hero.png';
import './WebLogin.css';

const gameplayShots = [
  { image: leaderboardScreenshot, en: 'Leaderboards', uk: 'Рейтинг гравців', ru: 'Рейтинг игроков' },
  { image: fishingScreenshot, en: 'Cosmo Fishing', uk: 'Космічна риболовля', ru: 'Космическая рыбалка' },
  { image: legendaryScreenshot, en: 'Legendary gear', uk: 'Легендарне спорядження', ru: 'Легендарное снаряжение' },
  { image: bossScreenshot, en: 'Boss battles', uk: 'Битви з босами', ru: 'Битвы с боссами' },
  { image: anubisScreenshot, en: 'Build your hero', uk: 'Розвивай свого героя', ru: 'Развивай своего героя' },
];

const nftCollections = [
  { name: 'HERE Early', contract: 'nft.herewallet.near', image: herePet, logo: hotWalletLogo, brand: 'HOT Wallet', previews: [{ image: hereNftOne, title: 'HERE #0408' }, { image: hereNftTwo, title: 'HERE #1015' }] },
  { name: 'NEAR Legion', contract: 'nearlegion.nfts.tg', image: legionPet, logo: legionLogo, brand: 'NEAR Legion', previews: [{ image: legionNftOne, title: 'NEAR Legion #1122' }, { image: legionNftTwo, title: 'NEAR Legion #635' }] },
];
import { signNearWalletProof } from '@/lib/platform/nearWallet';
import { enableJudgeTour } from '@/components/game/JudgeTour';
import WebLiveStats from './WebLiveStats';

const copy = {
  uk: { title: 'Увійти в Planet4', intro: 'Підключіть Telegram або підтверджений NEAR-гаманець, щоб продовжити зі своїм прогресом.', telegram: 'Увійти через Telegram', near: 'Увійти через NEAR', waiting: 'Підтвердіть вхід у гаманці…', cancel: 'Скасувати', fallback: 'Відкрити гру в Telegram', hint: 'Новий гаманець створить акаунт. Щоб зберегти поточний прогрес, підключи гаманець у профілі гри.', telegramHint: 'Не працює кнопка? Відкрийте гру в Telegram → Профіль → Web game.', failed: 'Не вдалося увійти. Спробуйте ще раз.', unlinked: 'Гаманець не прив’язаний до доступного акаунта. Увійдіть через Telegram і підтвердьте гаманець у профілі.', invalid: 'Підпис недійсний або час входу минув. Спробуйте ще раз.' },
  ru: { title: 'Войти в Planet4', intro: 'Подключите Telegram или подтверждённый NEAR-кошелёк, чтобы продолжить со своим прогрессом.', telegram: 'Войти через Telegram', near: 'Войти через NEAR', waiting: 'Подтвердите вход в кошельке…', cancel: 'Отмена', fallback: 'Открыть игру в Telegram', hint: 'Новый кошелёк создаст аккаунт. Чтобы сохранить текущий прогресс, подключи кошелёк в профиле игры.', telegramHint: 'Не работает кнопка? Откройте игру в Telegram → Профиль → Web game.', failed: 'Не удалось войти. Попробуйте ещё раз.', unlinked: 'Кошелёк не привязан к доступному аккаунту. Войдите через Telegram и подтвердите кошелёк в профиле.', invalid: 'Подпись недействительна или время входа истекло. Попробуйте ещё раз.' },
  en: { title: 'Sign in to Planet4', intro: 'Connect Telegram or your verified NEAR wallet to continue with your progress.', telegram: 'Sign in with Telegram', near: 'Sign in with NEAR', waiting: 'Confirm sign-in in your wallet…', cancel: 'Cancel', fallback: 'Open game in Telegram', hint: 'A new wallet creates an account. To keep your current progress, link your wallet in your game profile first.', telegramHint: 'Button not working? Open the game in Telegram → Profile → Web game.', failed: 'Unable to sign in. Please try again.', unlinked: 'This wallet is not linked to an available account. Sign in with Telegram and verify your wallet in your profile.', invalid: 'Invalid signature or sign-in expired. Please try again.' },
};

async function post(route, body, signal) {
  const response = await fetch('/api/auth/web/' + route, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.message || 'Login failed'), { code: payload.code });
  return payload.data;
}

export default function WebLogin() {
  const { i18n } = useTranslation();
  const language = i18n.language?.split('-')[0] === 'ua' ? 'uk' : i18n.language?.split('-')[0];
  const t = copy[language] || copy.en;
  const labels = language === 'ru'
    ? { welcome: 'Твоя планета. Твой лут. Твои правила.', world: 'Боссы. Кланы. Твой мир.', choose: 'Выберите способ входа', saved: 'Твой прогресс — с тобой', web: 'ИГРАТЬ В БРАУЗЕРЕ', or: 'или' }
    : language === 'uk'
      ? { welcome: 'Твоя планета. Твій лут. Твої правила.', world: 'Боси. Клани. Твій світ.', choose: 'Оберіть спосіб входу', saved: 'Твій прогрес — з тобою', web: 'ГРАТИ У БРАУЗЕРІ', or: 'або' }
      : { welcome: 'Your planet. Your loot. Your rules.', world: 'Bosses. Clans. Your world.', choose: 'Choose how to sign in', saved: 'Your progress comes with you', web: 'PLAY IN YOUR BROWSER', or: 'or' };
  const gameIntro = language === 'ru' ? 'Побеждай боссов, собирай снаряжение, выращивай питомцев и развивай свой клан.' : language === 'uk' ? 'Перемагай босів, збирай спорядження, вирощуй петів і розвивай свій клан.' : 'Battle bosses, collect gear, raise pets and build your clan.';
  const nearHint = language === 'ru' ? 'Начни с NEAR или продолжи свой аккаунт.' : language === 'uk' ? 'Почни з NEAR або продовжуй свій акаунт.' : 'Start with NEAR or continue your account.';
  const eventActive = halloweenActive();
  const eventDate = new Intl.DateTimeFormat(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(new Date(HALLOWEEN.endAt));
  const eventStatus = eventActive ? (language === 'ru' ? 'До ' : language === 'uk' ? 'До ' : 'Until ') + eventDate : (language === 'ru' ? 'Боссы · Питомцы · Снаряжение' : language === 'uk' ? 'Боси · Пети · Спорядження' : 'Bosses · Pets · Gear');
  const community = language === 'uk'
    ? { title: 'Твої NFT — частина цього світу', intro: 'Інтегровані колекції NEAR та їхні пети у Planet4.', pet: 'Пет для холдерів', check: 'На Hotcraft', socials: 'Спільнота Planet4' }
    : language === 'ru'
      ? { title: 'Твои NFT — часть этого мира', intro: 'Интегрированные коллекции NEAR и их питомцы в Planet4.', pet: 'Питомец для холдеров', check: 'На Hotcraft', socials: 'Сообщество Planet4' }
      : { title: 'Your NFTs belong in this world', intro: 'Integrated NEAR collections and their companions in Planet4.', pet: 'Holder companion', check: 'View on Hotcraft', socials: 'Planet4 community' };
  const [selectedShot, setSelectedShot] = useState(null);
  const previewDialog = useRef(null);
  useEffect(() => {
    if (selectedShot !== null && !previewDialog.current?.open) previewDialog.current?.showModal();
    if (selectedShot === null && previewDialog.current?.open) previewDialog.current.close();
  }, [selectedShot]);
  const judgeMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('judge') === '1';
  const [skipTutorial, setSkipTutorial] = useState(judgeMode);
  const guest = language === 'ru'
    ? { play: 'Играть сразу — без регистрации', skip: 'Пропустить обучение', note: 'Прогресс сохранится в этом браузере. Подключи NEAR-кошелёк позже — прогресс перейдёт в аккаунт.', limited: 'Слишком много новых гостей. Попробуй позже или войди через NEAR.', judges: 'Для судей NEAR Hackathon' }
    : language === 'uk'
      ? { play: 'Грати одразу — без реєстрації', skip: 'Пропустити навчання', note: 'Прогрес збережеться в цьому браузері. Підключи NEAR-гаманець пізніше — прогрес перейде в акаунт.', limited: 'Забагато нових гостей. Спробуй пізніше або увійди через NEAR.', judges: 'Для суддів NEAR Hackathon' }
      : { play: 'Play now — no sign-up', skip: 'Skip the tutorial', note: 'Progress is kept in this browser. Link a NEAR wallet later and it moves to your account.', limited: 'Too many new guests. Try later or sign in with NEAR.', judges: 'For NEAR Hackathon judges' };
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const controller = useRef(null);
  const lock = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  const playAsGuest = async (demo = judgeMode) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(demo ? 'judge' : 'guest'); setError('');
    try {
      await post('guest', { skipTutorial: demo || skipTutorial, language });
      if (demo) enableJudgeTour();
      window.location.replace(demo ? '/web?judge=1' : '/web');
    } catch (e) { setError(e.code === 'GUEST_RATE_LIMITED' ? guest.limited : t.failed); setBusy(''); lock.current = false; }
  };
  const connectNear = async () => {
    if (lock.current) return;
    lock.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setBusy('near'); setError('');
    try {
      const challenge = await post('near/challenge', {}, abort.signal);
      const proof = await signNearWalletProof(challenge, { signal: abort.signal,forceSelect:new URLSearchParams(window.location.search).get('switchAccount')==='1' });
      await post('near/verify', { challengeId: challenge.challengeId, signedMessage: { ...proof.signedMessage, accountId: proof.account } }, abort.signal);
      window.location.reload();
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.code === 'NEAR_LOGIN_NOT_LINKED' ? t.unlinked : e.code === 'NEAR_LOGIN_INVALID' ? t.invalid : t.failed);
    } finally { setBusy(''); lock.current = false; }
  };
  return <main className="web-login" style={{ '--login-space': `url("${space}")` }}>
    <LoginSpaceBackground />
    <div className="web-login__shell">
      <header className="web-login__topbar">
        <img className="web-login__wordmark" src={logo} alt="Planet4 Nuvelorian" /><a className="web-login__demo" href="#web-login-title">{guest.judges}</a>
        
        <nav className="web-login__socials" aria-label={community.socials}>
          <a href="https://x.com/Nuvelorian" target="_blank" rel="noopener noreferrer" aria-label="Planet4 on X"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.4-8.5L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" /></svg><span>@Nuvelorian</span></a>
          
        </nav>
        <div className="web-login__languages" aria-label="Language">
          {['uk', 'ru', 'en'].map(lang => <button key={lang} type="button" aria-pressed={language === lang} aria-label={{ uk: 'Українська', ru: 'Русский', en: 'English' }[lang]} title={{ uk: 'Українська', ru: 'Русский', en: 'English' }[lang]} disabled={!!busy} onClick={() => { try { window.localStorage.setItem('game_language', lang); } catch { /* Language selection also works without storage. */ } i18n.changeLanguage(lang); }}><svg aria-hidden="true" width="26" height="18" viewBox="0 0 30 20" className="web-login__flag">
            {lang === 'uk' ? <><path fill="#0057b7" d="M0 0h30v10H0z" /><path fill="#ffd700" d="M0 10h30v10H0z" /></> : lang === 'ru' ? <><path fill="#fff" d="M0 0h30v7H0z" /><path fill="#0039a6" d="M0 7h30v7H0z" /><path fill="#d52b1e" d="M0 14h30v6H0z" /></> : <><path fill="#012169" d="M0 0h30v20H0z" /><path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20" /><path stroke="#c8102e" strokeWidth="1.5" d="m0 0 30 20M30 0 0 20" /><path stroke="#fff" strokeWidth="7" d="M15 0v20M0 10h30" /><path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30" /></>}
          </svg></button>)}
        </div>
      </header>
      <div className="web-login__layout">
        <section className="web-login__art web-login__gameplay" aria-label={language === 'uk' ? 'Скриншоти гри' : language === 'ru' ? 'Скриншоты игры' : 'Game screenshots'}>
          <div className="web-login__screenshot-fan">
            {gameplayShots.map((shot, index) => <button key={shot.en} type="button" className="web-login__shot" style={{ '--shot-index': index }} onClick={() => setSelectedShot(index)} aria-label={shot[language] || shot.en}>
              <img loading="lazy" decoding="async" src={shot.image} alt={shot[language] || shot.en} draggable="false" />
            </button>)}
          </div>
        </section>
      <section className="web-login__collections" aria-labelledby="web-login-nfts">
        <div className="web-login__collections-heading"><div><p>NEAR · NFT</p><h2 id="web-login-nfts">{community.title}</h2></div></div>

        <div className="web-login__collection-grid">
          {nftCollections.map(collection => <a key={collection.contract} className={`web-login__collection web-login__collection--${collection.brand === 'HOT Wallet' ? 'here' : 'legion'}`} href={`https://hotcraft.art/collection/${encodeURIComponent(collection.contract)}?ref=34725`} target="_blank" rel="noopener noreferrer">
            <img className="web-login__collection-pet" src={collection.image} alt="" />
            <div className="web-login__collection-copy"><span className="web-login__collection-kicker">{community.pet}</span><h3>{collection.name}</h3><span className="web-login__collection-link">{community.check}<ArrowUpRight size={14} aria-hidden="true" /></span></div>
            <div className="web-login__nft-previews">{collection.previews.map(nft => <img key={nft.title} src={nft.image} alt={nft.title} loading="lazy" />)}</div>
          </a>)}
        </div>
      </section>
        <div className="web-login__auth-column">
        <div className="web-login__integration-brands" aria-label={language === 'uk' ? 'Партнери' : language === 'ru' ? 'Партнёры' : 'Partners'}>
          <span className="web-login__partners-label">{language === 'uk' ? 'Партнери' : language === 'ru' ? 'Партнёры' : 'Partners'}</span>
          {nftCollections.map(collection => <a key={collection.contract} href={`https://hotcraft.art/collection/${encodeURIComponent(collection.contract)}?ref=34725`} target="_blank" rel="noopener noreferrer" className={collection.brand === 'HOT Wallet' ? 'web-login__brand web-login__brand--hot' : 'web-login__brand'}>
            <img src={collection.logo} alt={collection.brand} />{collection.brand === 'NEAR Legion' && <span>NEAR LEGION</span>}
          </a>)}
        </div>
        <section className="web-login__card" aria-labelledby="web-login-title">
          <img className="web-login__corner-planet" src={planet} alt="" aria-hidden="true" draggable="false" />
          <img src={voidling} className="web-login__frame-pet" alt="" aria-hidden="true" draggable="false" />
          <div className="web-login__eyebrow"><span />{labels.web}</div>
          <h1 id="web-login-title">{labels.welcome}</h1>
          <p className="web-login__intro">{gameIntro}</p>
          <button type="button" className="web-login__button web-login__button--guest" disabled={!!busy} onClick={() => playAsGuest()}>
            <span aria-hidden="true">▶</span><span>{guest.play}</span>{busy === 'guest' ? <LoaderCircle className="web-login__spinner" aria-hidden="true" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
          </button>
          <label className="web-login__skip"><input type="checkbox" checked={skipTutorial} disabled={!!busy} onChange={event => setSkipTutorial(event.target.checked)} />{guest.skip}</label>
          <p className="web-login__guest-note">{guest.note}</p>
          <button type="button" className="web-login__button web-login__button--judge" disabled={!!busy} onClick={() => playAsGuest(true)}>
            <span>{language === 'uk' ? 'Демо для суддів' : language === 'ru' ? 'Демо для судей' : 'Judge demo'}</span>{busy === 'judge' ? <LoaderCircle className="web-login__spinner" aria-hidden="true" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
          </button>
          <p className="web-login__guest-note">{language === 'uk' ? 'Без гаманця й навчання. Гостьовий вхід та короткий тур: маркет, ШІ-торговці й угоди у NEAR.' : language === 'ru' ? 'Без кошелька и обучения. Гостевой вход и короткий тур: рынок, ИИ-торговцы и сделки в NEAR.' : 'No wallet or tutorial. Enter as a guest for a short tour of the market, AI merchants and NEAR trades.'}</p>
          <p className="web-login__choose">{labels.choose}</p>
          <button type="button" className="web-login__button web-login__button--near" disabled={!!busy} onClick={connectNear}>
            <img src={nearLogo} alt="" width="21" height="21" /><span>{busy === 'near' ? t.waiting : t.near}</span>{busy === 'near' ? <LoaderCircle className="web-login__spinner" aria-hidden="true" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
          </button>
          {busy === 'near' && <button type="button" className="web-login__cancel" onClick={() => controller.current?.abort()}>{t.cancel}</button>}
          {error && <p role="alert" className="web-login__error">{error}</p>}
          <div className="web-login__hint web-login__near-hint"><span>{nearHint}</span><details><summary aria-label={t.hint}><Info size={14} aria-hidden="true" /></summary><p>{t.hint}</p></details></div>
          <div className="web-login__feature">
            <div className="web-login__event-hero" aria-hidden="true"><img src={frameHero} alt="" draggable="false" /></div>
            <div className="web-login__event-copy"><span className="web-login__event-label">{eventActive ? (language === 'uk' ? 'ПОДІЯ У ГРІ' : language === 'ru' ? 'СОБЫТИЕ В ИГРЕ' : 'IN-GAME EVENT') : 'PLANET4'}</span><p>{eventActive ? 'Halloween · Planet4' : 'Discover Planet4'}</p><small>{eventStatus}</small></div>
          </div>
        </section>
        </div>
      </div>

      <WebLiveStats language={language} highlight={judgeMode} />
      <footer className="web-login__bottom">PLANET4 <span>·</span> NUVELORIAN</footer>
    </div>
    <dialog ref={previewDialog} className="web-login__preview" onClose={() => setSelectedShot(null)} onClick={event => { if (event.target === event.currentTarget) setSelectedShot(null); }} aria-label={selectedShot === null ? 'Planet4' : gameplayShots[selectedShot][language] || gameplayShots[selectedShot].en}>
      {selectedShot !== null && <div className="web-login__preview-content">
        <button type="button" className="web-login__preview-close" aria-label={language === 'uk' ? 'Закрити' : language === 'ru' ? 'Закрыть' : 'Close'} onClick={() => setSelectedShot(null)}><X size={23} /></button>
        <img src={gameplayShots[selectedShot].image} alt={gameplayShots[selectedShot][language] || gameplayShots[selectedShot].en} />
        <div className="web-login__preview-nav"><button type="button" aria-label="Previous" onClick={() => setSelectedShot((selectedShot + gameplayShots.length - 1) % gameplayShots.length)}><ChevronLeft size={24} /></button><span>{gameplayShots[selectedShot][language] || gameplayShots[selectedShot].en}<small>{selectedShot + 1} / {gameplayShots.length}</small></span><button type="button" aria-label="Next" onClick={() => setSelectedShot((selectedShot + 1) % gameplayShots.length)}><ChevronRight size={24} /></button></div>
      </div>}
    </dialog>
  </main>;
}
