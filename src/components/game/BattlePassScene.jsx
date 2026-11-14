import epicAnimationIcon from '@/assets/hero/animation-icons/epic-ravens.png';
import legendaryAnimationIcon from '@/assets/hero/animation-icons/legendary-blue-fire.png';
import epicBackground from '@/assets/hero/bp epic set/setbp1-bg+anim.png';
import legendaryBackground from '@/assets/hero/bp leg set/setbp2-background.png';
import epicarmorIcon from '@/assets/hero/bp epic set/setbp1-armor-ico.png';
import { LEGENDARY_SET_ART } from './LegendarySetEffects';
import epicbootsIcon from '@/assets/hero/bp epic set/setbp1-boots-ico.png';
import epichandsIcon from '@/assets/hero/bp epic set/setbp1-hands-ico.png';
import epicheadIcon from '@/assets/hero/bp epic set/setbp1-head-ico.png';
import epiclegsIcon from '@/assets/hero/bp epic set/setbp1-legs-ico.png';
import epicweaponIcon from '@/assets/hero/bp epic set/setbp1-weap-ico.png';
import epicpetIcon from '@/assets/hero/bp epic set/setbp1-pet-ico.png';
import { isWebPlatform } from '@/lib/platform/config';
import PaymentMethodPicker from './PaymentMethodPicker';
import { BATTLE_PASS_PACKS } from '@/lib/shopCatalog';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Lock, Ticket, Image as ImageIcon } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import RewardPopup from './RewardPopup';
import { BP_REWARDS, BP_REWARD_LABELS, BP_STAR_PRODUCTS, BP_TRACKS, bpTrackUnlocked } from '@/lib/battlePass';
import { createPaymentOrder, getPaymentOrder } from '@/services/gameApi';
import dmIcon from '@/assets/optimized/cosmohand.webp';
import cdmIcon from '@/assets/optimized/paper.webp';
import energyIcon from '@/assets/ui/energy+100.png';
import largeIcon from '@/assets/skills/large-poison.png';
import mediumIcon from '@/assets/skills/medium-poison.png';
import battlePassBanner from '@/assets/ui/battle-pass-banner.png';
import battlePassMoneyIcon from '@/assets/optimized/battle-pass-money.webp';
import './battlePass.css';
import ProceduralPortalCanvas from './ProceduralPortalCanvas';

const epicIcons = { armor: epicarmorIcon, boots: epicbootsIcon, hands: epichandsIcon, head: epicheadIcon, legs: epiclegsIcon, weapon: epicweaponIcon, epic_pet: epicpetIcon };
const rewardIcon = (reward, track) => reward.type === 'season_animation' ? epicAnimationIcon : reward.type === 'exclusive_animation' ? legendaryAnimationIcon : reward.type === 'epic_background' ? epicBackground : reward.type === 'legendary_background' ? legendaryBackground : (track === 'epic' ? epicIcons[reward.type] : track === 'legendary' ? (reward.type === 'exclusive_animation' ? legendaryBackground : LEGENDARY_SET_ART[reward.type.replace('legendary_', '')]) : null) || icons[reward.type];
const icons = { dm: dmIcon, cdm: cdmIcon, energy: energyIcon, large: largeIcon, medium: mediumIcon };
const portalPalettes = {
  free: { core: '#d9ff35', glow: '#54ff39', deep: '#092b19' },
  epic: { core: '#f19bff', glow: '#a83cff', deep: '#241044' },
  legendary: { core: '#fff19a', glow: '#ffb51f', deep: '#49300a' },
};
const groups = { daily: 'daily', weekly: 'weekly', season: 'season' };
const TASK_LABELS = {
  login: { ua: 'Увійти в гру', ru: 'Войти в игру', en: 'Log in to the game' },
  energy: { ua: 'Витратити енергію у планетарних завданнях', ru: 'Потратить энергию в планетарных заданиях', en: 'Spend energy on planetary missions' },
  missions: { ua: 'Виконати планетарні завдання', ru: 'Выполнить планетарные задания', en: 'Complete planetary missions' },
  daily: { ua: 'Виконати завдання Daily', ru: 'Выполнить задания Daily', en: 'Complete Daily tasks' },
  boss: { ua: 'Завдати шкоди босу', ru: 'Нанести урон боссу', en: 'Deal damage to a boss' },
  bossKills: { ua: 'Перемогти до 3 босів', ru: 'Победить до 3 боссов', en: 'Defeat up to 3 bosses' },
  weekly: { ua: 'Закрити тижневі завдання', ru: 'Закрыть недельные задания', en: 'Complete weekly tasks' },
  dm: { ua: 'Заробити tentacles у грі (без покупок)', ru: 'Заработать tentacles в игре (без покупок)', en: 'Earn tentacles in game (no purchases)' },
};
function localizedTaskLabel(task, language) {
  return TASK_LABELS[task.metric]?.[language] || TASK_LABELS[task.metric]?.ua || task.label;
}

function battlePassRewardPopupItems(rewards = [], t, track) {
  return rewards.map((reward, index) => ({
    id: `${reward.type}-${index}`,
    icon: rewardIcon(reward, track) || cdmIcon,
    label: t(`battle_pass.rewards.${reward.type}`, { defaultValue: BP_REWARD_LABELS[reward.type] || t('battle_pass.reward') }),
    text: `+${reward.amount}`,
  }));
}

export function BattlePassTasks({ view, onGo }) {
  const { t, i18n } = useTranslation();
  const language = ['uk', 'ua', 'ru', 'en'].includes(i18n.language) ? (i18n.language === 'uk' ? 'ua' : i18n.language) : 'ua';
  if (!view) return null;
  return <section className="bp-tasks" aria-label={t('battle_pass.tasks_aria')}>
    <h3>{t('battle_pass.tasks_title')}</h3>
    <p className="bp-muted">{t('battle_pass.tasks_hint')}</p>
    <section>
      <h4>{t('battle_pass.groups.bosses')}</h4>
      {Object.entries(groups).flatMap(([scope]) => (view.tasks?.[scope] || [])
        .filter((task) => ['boss', 'bossKills'].includes(task.metric))
        .map((task) => ({ ...task, scope })))
        .map((task) => <div className={`bp-task ${task.done ? 'is-done' : ''}`} key={`${task.scope}:${task.id}`}>
          <div><span>{localizedTaskLabel(task, language)}</span><small>{t(`battle_pass.groups.${task.scope}`)} · {task.progress} / {task.goal}</small>
            <progress value={task.progress} max={task.goal} aria-label={localizedTaskLabel(task, language)} /></div>
          <div className="bp-task-action">
            <strong>{task.done ? <><Check size={14} /> {t('battle_pass.done')}</> : task.metric === 'bossKills' ? t('battle_pass.boss_victory_xp') : `+${task.xp} XP`}</strong>
            <GameTextureButton type="button" tone={task.done ? 'green' : 'yellow'} disabled={task.done} onClick={() => onGo?.(task)} className="bp-task-button">
              <span className="relative z-10">{task.done ? t('battle_pass.done') : t('battle_pass.go')}</span>
            </GameTextureButton>
          </div>
        </div>)}
    </section>
    {Object.entries(groups).map(([scope, titleKey]) => <section key={scope}>
      <h4>{t(`battle_pass.groups.${titleKey}`)}</h4>
      {(view.tasks?.[scope] || []).filter((task) => !['boss', 'bossKills'].includes(task.metric)).map((task) => <div className={`bp-task ${task.done ? 'is-done' : ''}`} key={task.id}>
        <div><span>{localizedTaskLabel(task, language)}</span><small>{task.progress} / {task.goal}</small>
          <progress value={task.progress} max={task.goal} aria-label={localizedTaskLabel(task, language)} /></div>
        <div className="bp-task-action">
          <strong>{task.done ? <><Check size={14} /> {t('battle_pass.done')}</> : task.metric === 'bossKills' ? t('battle_pass.boss_victory_xp') : `+${task.xp} XP`}</strong>
          <GameTextureButton type="button" tone={task.done ? 'green' : 'yellow'} disabled={task.done} onClick={() => onGo?.(task)} className="bp-task-button">
            <span className="relative z-10">{task.done ? t('battle_pass.done') : t('battle_pass.go')}</span>
          </GameTextureButton>
        </div>
      </div>)}
    </section>)}
  </section>;
}

function Reward({ rewards, track, level, view, busy, onClaim, t, animationsEnabled }) {
  const claimed = view.claims.includes(`${track}:${level}`);
  const unlocked = bpTrackUnlocked(view.tier, track);
  const reached = view.level >= level;
  const canClaim = view.active && unlocked && reached && !claimed;
  return <button type="button" className={`bp-reward bp-${track} ${claimed ? 'is-claimed' : ''} ${canClaim ? 'is-ready' : ''}`}
    disabled={!canClaim || busy} onClick={() => onClaim(level, track)}
    aria-label={t('battle_pass.reward_aria', { track, level, rewards: rewards.map((reward) => `${t(`battle_pass.rewards.${reward.type}`, { defaultValue: BP_REWARD_LABELS[reward.type] })} ×${reward.amount}`).join(', '), status: claimed ? t('battle_pass.claimed') : canClaim ? t('battle_pass.claim') : t('battle_pass.locked') })}>
    <ProceduralPortalCanvas colors={portalPalettes[track]} className="z-0" animated={animationsEnabled} />
    {rewards.map((reward) => <div className="bp-reward-item" key={reward.type}>
      {rewardIcon(reward, track) ? <img src={rewardIcon(reward, track)} alt="" loading="lazy" />
        : reward.type === 'ticket' ? <Ticket className="bp-ticket" size={34} />
          : <div className="bp-placeholder"><ImageIcon size={25} /><small>{t('battle_pass.art_coming')}</small></div>}
      <span>{t(`battle_pass.rewards.${reward.type}`, { defaultValue: BP_REWARD_LABELS[reward.type] || t('battle_pass.reward') })} {reward.amount > 1 || icons[reward.type] ? `×${reward.amount}` : ''}</span>
    </div>)}
    <span className="bp-reward-status">{claimed ? <Check size={16} /> : canClaim ? t('battle_pass.claim') : !unlocked ? <Lock size={13} /> : t('battle_pass.level', { level })}</span>
  </button>;
}

export default function BattlePassScene({ profile, onUpdateProfile, onClose, onNavigate }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    try { return localStorage.getItem('bp-animations') !== 'off'; } catch { return true; }
  });
  const toggleAnimations = () => {
    const next = !animationsEnabled;
    setAnimationsEnabled(next);
    try { localStorage.setItem('bp-animations', next ? 'on' : 'off'); } catch {}
  };
  const [nearProduct, setNearProduct] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('rewards');
  const [rewardPopup, setRewardPopup] = useState(null);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const update = useRef(onUpdateProfile);
  const sceneRef = useRef(null);
  const lastAutoScrollKey = useRef('');
  update.current = onUpdateProfile;
  const view = profile?.battle_pass_view;
  const claimBusyRef = useRef(false);
  const claimableRewards = view?.active ? BP_REWARDS.flatMap(row => row.level <= view.level ? BP_TRACKS.filter(track => bpTrackUnlocked(view.tier, track) && !view.claims.includes(track + ":" + row.level)).map(track => ({level:row.level, track})) : []) : [];
  useEffect(() => {
    let mounted = true;
    const sync = () => !document.hidden && update.current?.({ battlePassAction: { type: 'sync' } }).catch((err) => { if (mounted) setError(err.message); });
    sync();
    const timer = setInterval(sync, 30000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!purchaseOrderId) return undefined;
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const order = await getPaymentOrder(purchaseOrderId);
        if (cancelled || order?.status !== 'success') return;
        setPurchaseOrderId('');
        await update.current?.({ battlePassAction: { type: 'sync' } });
      } catch {
        // The webhook can take a moment; continue polling until this screen closes.
      }
    };
    void poll();
    const timer = window.setInterval(poll, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [purchaseOrderId]);
  useEffect(() => {
    if (!view || tab !== 'rewards') return undefined;

    const claims = Array.isArray(view.claims) ? view.claims : [];
    const key = `${tab}:${view.level}:${view.tier}:${claims.join('|')}`;
    if (lastAutoScrollKey.current === key) return undefined;
    lastAutoScrollKey.current = key;

    const unlockedTracks = BP_TRACKS.filter((track) => bpTrackUnlocked(view.tier, track));
    const claimableLevels = BP_REWARDS
      .filter((row) => row.level <= view.level && unlockedTracks.some((track) => !claims.includes(`${track}:${row.level}`)))
      .map((row) => row.level);
    const claimedLevels = claims
      .map((claim) => Number(String(claim).split(':')[1]))
      .filter(Number.isFinite);
    const targetLevel = claimableLevels.at(0) || claimedLevels.at(-1);
    if (!targetLevel) return undefined;

    let frame = requestAnimationFrame(() => {
      const scene = sceneRef.current;
      const row = scene?.querySelector(`[data-bp-level="${targetLevel}"]`);
      if (!scene || !row) return;
      scene.scrollTo({ top: Math.max(0, scene.scrollTop + row.getBoundingClientRect().top - scene.getBoundingClientRect().top - 12), behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [tab, view?.level, view?.tier, view?.claims]);
  const claim = async (level, track) => {
    if (busy || claimBusyRef.current) return;
    claimBusyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await onUpdateProfile({ battlePassAction: { type: 'claim', level, track } });
      const rewards = BP_REWARDS.find((row) => row.level === level)?.[track] || [];
      setRewardPopup({ title: t('battle_pass.reward_title'), items: battlePassRewardPopupItems(rewards, t, track) });
    }
    catch (err) { setError(err.message || t('battle_pass.claim_error')); }
    finally { claimBusyRef.current = false; setBusy(false); }
  };
  const claimAll = async () => {
    if (busy || claimBusyRef.current || !claimableRewards.length) return;
    claimBusyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await onUpdateProfile({ battlePassAction: { type: 'claim-all' } });
      if (!Array.isArray(result?.battlePassClaimed)) throw new Error(t('battle_pass.claim_error'));
      const totals = new Map();
      for (const {level, track} of result.battlePassClaimed) {
        for (const reward of BP_REWARDS.find(row => row.level === level)?.[track] || []) {
          const key = track + ':' + reward.type;
          const existing = totals.get(key);
          if (existing) existing.reward.amount += reward.amount;
          else totals.set(key, {track, reward:{...reward}});
        }
      }
      const items = [...totals.entries()].flatMap(([id, entry]) => battlePassRewardPopupItems([entry.reward], t, entry.track).map(item => ({...item, id})));
      if (items.length) setRewardPopup({title:t('battle_pass.reward_title'), items});
    } catch (err) { setError(err.message || t('battle_pass.claim_error')); }
    finally { claimBusyRef.current = false; setBusy(false); }
  };
  const purchaseTrack = async (track) => {
    const product = BP_STAR_PRODUCTS.find((item) => item.tier === track);
    if (!product || busy || bpTrackUnlocked(view?.tier, track)) return;
    if (isWebPlatform) { setNearProduct(BATTLE_PASS_PACKS.find(item => item.id === product.id)); return; }
    setBusy(true);
    setError('');
    try {
      const response = await createPaymentOrder({ itemId: product.id, paymentMethod: 'telegram_stars' });
      const order = response?.order || response;
      const invoiceLink = response?.invoiceLink || order?.payment_payload?.invoiceLink;
      if (!order?.id || !invoiceLink) throw new Error('Telegram Stars invoice is unavailable');
      setPurchaseOrderId(order.id);
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openInvoice) webApp.openInvoice(invoiceLink, () => {});
      else window.open(invoiceLink, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Unable to create payment');
    } finally { setBusy(false); }
  };
  return <div ref={sceneRef} className={`bp-scene ${animationsEnabled ? '' : 'bp-animations-off'}`}>
    <header className="bp-header">
      <div className="bp-topline"><button onClick={onClose} aria-label={t('battle_pass.back')}><ArrowLeft size={21} /></button><button type="button" onClick={toggleAnimations} aria-pressed={animationsEnabled} className="rounded border border-[#587944] px-2 py-1 text-[10px] font-bold text-[#d7ff94]">{profile?.language === 'ru' ? 'АНИМАЦИЯ' : profile?.language === 'en' ? 'ANIMATION' : 'АНІМАЦІЯ'}: {animationsEnabled ? 'ON' : 'OFF'}</button></div>
      <div className="bp-season-art" style={{ backgroundImage: `linear-gradient(90deg, rgba(4,12,9,.78), rgba(4,12,9,.38), rgba(4,12,9,.78)), url(${battlePassBanner})` }}><img className="bp-money-icon" src={battlePassMoneyIcon} alt="" /><div><small>{t('battle_pass.season')}</small><h1>{t('battle_pass.season_title')}</h1><p>{t('battle_pass.season_subtitle')}</p></div><span className="bp-art-label">{t('battle_pass.season_art')}</span></div>
      <div className="bp-stats"><strong>{t('battle_pass.level', { level: view?.level ?? 0 })}<small>/ 50</small></strong><span>{view?.active ? t('battle_pass.days_left', { days: view.daysLeft }) : t('battle_pass.inactive')}</span><span><Ticket size={14} /> {view?.tickets || 0}</span></div>
      <div className="bp-xp"><progress max={150} value={view?.levelXp || 0} /><span>{view?.level === 50 ? t('battle_pass.max_level') : `${view?.levelXp || 0} / 150 XP`}</span></div>
      <p className="px-3 pb-2 text-center font-mono text-[10px] font-bold leading-snug text-[#c8d8b5]">{t('battle_pass.progress_hint')}</p>
      <nav className="bp-tabs">
        <GameTextureButton tone={tab === 'rewards' ? 'green' : 'gray'} className="bp-tab-button" onClick={() => setTab('rewards')}>
          <span className="bp-tab-label">{t('battle_pass.rewards_tab')}</span>
        </GameTextureButton>
        <GameTextureButton tone={tab === 'tasks' ? 'green' : 'gray'} className="bp-tab-button" onClick={() => setTab('tasks')}>
          <span className="bp-tab-label">{t('battle_pass.tasks_tab')}</span>
        </GameTextureButton>
      </nav>
    </header>
    {error && <p role="alert" className="bp-error">{error}</p>}
    <div className="bp-scroll">
      {!view ? <p className="bp-muted">{t('battle_pass.loading')}</p> : tab === 'tasks' ? <BattlePassTasks view={view} onGo={onNavigate} /> : <>
        <GameTextureButton type="button" disabled={busy || !claimableRewards.length} onClick={claimAll} className="mb-2 flex h-11 w-full items-center justify-center"><span className="relative z-10 text-xs font-black text-[#172016]">{profile?.language === 'ru' ? 'ЗАБРАТЬ ВСЁ' : profile?.language === 'en' ? 'CLAIM ALL' : 'ЗАБРАТИ ВСЕ'} · {claimableRewards.length}</span></GameTextureButton>
        <div className="bp-road-head bp-grid"><span>FREE</span><span>LVL</span><span>{bpTrackUnlocked(view.tier, 'epic') ? 'EPIC ✓' : <button type="button" onClick={() => purchaseTrack('epic')} disabled={busy}>OPEN EPIC · {isWebPlatform ? 'NEAR' : '299 ★'}</button>}</span><span>{bpTrackUnlocked(view.tier, 'legendary') ? 'LEGENDARY ✓' : <button type="button" onClick={() => purchaseTrack('legendary')} disabled={busy}>OPEN LEG · {isWebPlatform ? 'NEAR' : '699 ★'}</button>}</span></div>
        <div className="bp-road">{BP_REWARDS.map((row) => <div className="bp-grid bp-row" data-bp-level={row.level} key={row.level}>
          <Reward rewards={row.free} track="free" level={row.level} view={view} busy={busy} onClaim={claim} t={t} animationsEnabled={animationsEnabled} />
          <div className={`bp-level ${row.level <= view.level ? 'is-reached' : ''}`}><span>{row.level}</span></div>
          {BP_TRACKS.slice(1).map((track) => <Reward key={track} rewards={row[track]} track={track} level={row.level} view={view} busy={busy} onClaim={claim} t={t} animationsEnabled={animationsEnabled} />)}
        </div>)}</div>
        <footer className="bp-finish"><img className="bp-money-icon bp-money-icon-finish" src={battlePassMoneyIcon} alt="" /><h2>{t('battle_pass.finish_title')}</h2><p>{t('battle_pass.finish_text')}</p><strong><Ticket size={18} /> {t('battle_pass.tickets', { count: view.tickets })}</strong></footer>
      </>}
    </div>
    <RewardPopup
      open={Boolean(rewardPopup)}
      title={rewardPopup?.title || t('battle_pass.reward_title')}
      items={rewardPopup?.items || []}
      onClose={() => setRewardPopup(null)}
    />
  {nearProduct && <PaymentMethodPicker pack={nearProduct} paymentMethods={[{ id: 'near', title: 'NEAR' }]} initialMethodId="near" onClose={() => setNearProduct(null)} onSuccess={async () => { setNearProduct(null); await update.current?.({ battlePassAction: { type: 'sync' } }); }} />}</div>;
}
