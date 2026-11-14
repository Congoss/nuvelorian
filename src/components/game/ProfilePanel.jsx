import BugReportButton from './BugReportButton';
import ProfileFramePicker from './ProfileFramePicker';
import PlayerAchievements from './PlayerAchievements';
import { translateUiText } from '@/lib/uiTextTranslations';
import { useAnimationsEnabled, setAnimationsEnabled } from '@/lib/animationPreference';
﻿import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Bell, Copy, ExternalLink, Pencil, X } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import LootBoxModal from './LootBoxModal';
import { getCARank, getCARankIcon, getPlayerCA } from '@/lib/caRanks';
import { resolveTutorialStep } from '@/lib/tutorialProgress.js';

import { clearLocalTesterTutorialState, getLocalTesterResetUpdates, isLocalTesterProfile } from '@/lib/localTesterReset';
import { disconnectNearSession, getNearWalletConnector, signNearWalletProof, waitForNearWallet, setActiveNearAccount } from '@/lib/platform/nearWallet';
import { createNearWalletProofChallenge, verifyNearWalletProof, disconnectNearWallet as unlinkNearWallet, disconnectTonWallet as unlinkTonWallet } from '@/services/gameApi';
import { getTelegramSession } from '@/lib/platform/telegram';
import {isWebPlatform} from '@/lib/platform/config';
import {switchWebAccount} from '@/lib/platform/switchWebAccount';

const LANGUAGES = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'RU' },
  { id: 'uk', label: 'UA' },
];



function TextureButton({ children, onClick, disabled = false, className = '', textClassName = 'text-[#17310d]' }) {
  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-10 disabled:opacity-45 ${className}`}
    >
      <span className={`relative z-10 flex h-full items-center justify-center gap-1.5 px-2 font-mono text-[10px] font-black uppercase tracking-[0.08em] [text-shadow:0_1px_0_rgba(255,255,255,0.22)] ${textClassName}`}>
        {children}
      </span>
    </GameTextureButton>
  );
}

function DarkButton({ icon: Icon, label, sublabel, accent = false }) {
  return (
    <button
      type="button"
      className={`flex min-h-[46px] items-center gap-2 rounded-[9px] border px-2.5 text-left transition hover:brightness-110 ${
        accent
          ? 'border-[#28ee90] bg-[linear-gradient(180deg,#203615_0%,#0b1208_100%)]'
          : 'border-[#28ee90] bg-[linear-gradient(180deg,#11180f_0%,#070a06_100%)]'
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[#28ee90] bg-[#071006] text-[#c6ff61]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-[11px] font-black uppercase leading-none text-[#f1ffe6]">{label}</span>
        <span className="mt-1 block truncate font-mono text-[8px] uppercase tracking-[0.1em] text-[#8bb569]">{sublabel}</span>
      </span>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center overflow-hidden rounded-[6px] border border-[#28ee90] bg-[#0b1109]">
      <div className="h-full bg-[#315018]/55 px-2 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-[#d9ff9e]">
        {label}
      </div>
      <div className="min-w-0 px-2 py-1.5 font-sans text-[12px] font-black leading-none text-[#fff4d4] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]">
        {value}
      </div>
    </div>
  );
}

function TonLogo() {
  return (
    <svg viewBox="0 0 56 56" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r="28" fill="#0098ea" />
      <path d="M13 14h30L28 43 13 14Zm6.5 4.8L28 34l8.5-15.2h-17Z" fill="#fff" />
    </svg>
  );
}

function NearLogo() {
  return (
    <svg viewBox="0 0 56 56" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r="28" fill="#111" />
      <path d="M17 38V18l22 20V18" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
    </svg>
  );
}

function NicknameRow({ label, value, onEdit, freeChange }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_34px] items-center overflow-hidden rounded-[6px] border border-[#28ee90] bg-[#0b1109]">
      <div className="h-full bg-[#315018]/55 px-2 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-[#d9ff9e]">{label}</div>
      <div className="min-w-0 truncate px-2 py-1.5 font-sans text-[12px] font-black leading-none text-[#fff4d4] [text-shadow:0_1px_0_rgba(0,0,0,0.85)]">{value}</div>
      <button
        type="button"
        onClick={onEdit}
        title={translateUiText(freeChange ? 'Перша зміна безкоштовна' : 'Зміна нікнейма: 500 преміум-валюти')}
        className="flex h-full items-center justify-center border-l border-[#315018] text-[#d9ff9e] transition hover:bg-[#1d3013]"
        aria-label={translateUiText("Редагувати нікнейм")}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

function LanguageFlag({ id }) {
  if (id === 'uk') {
    return <span aria-hidden="true" className="h-[16px] w-[24px] overflow-hidden rounded-[2px] bg-[linear-gradient(to_bottom,#1769aa_0%,#1769aa_50%,#ffd633_50%,#ffd633_100%)] shadow-[0_1px_2px_rgba(0,0,0,.6)]" />;
  }
  if (id === 'ru') {
    return <span aria-hidden="true" className="h-[16px] w-[24px] overflow-hidden rounded-[2px] bg-[linear-gradient(to_bottom,#f6f7f4_0%,#f6f7f4_33%,#1d64b5_33%,#1d64b5_66%,#d72735_66%,#d72735_100%)] shadow-[0_1px_2px_rgba(0,0,0,.6)]" />;
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 16" className="h-[16px] w-[24px] overflow-hidden rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,.6)]">
      <rect width="24" height="16" fill="#1e4f91" />
      <path d="M0 0L24 16M24 0L0 16" stroke="#fff" strokeWidth="4" />
      <path d="M0 0L24 16M24 0L0 16" stroke="#ca2638" strokeWidth="1.7" />
      <path d="M12 0V16M0 8H24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0V16M0 8H24" stroke="#ca2638" strokeWidth="2.5" />
    </svg>
  );
}



export default function ProfilePanel({ profile, user, onClose, onUpdateProfile, onSyncProfile }) {
  const animationsEnabled = useAnimationsEnabled();
  const { t, i18n } = useTranslation();
  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [tonDisconnecting, setTonDisconnecting] = useState(false);
  const [tonWalletError, setTonWalletError] = useState('');
  const tonDisconnectBusy = useRef(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoRewardPopup, setPromoRewardPopup] = useState(null);
  const [soundOn, setSoundOn] = useState(profile?.sound_enabled !== false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [dynamicPromoCodes, setDynamicPromoCodes] = useState([]);
  const [nearWalletId, setNearWalletId] = useState(profile?.near_wallet_id || '');
  const [nearWalletError, setNearWalletError] = useState('');
  const [nearConnecting, setNearConnecting] = useState(false);
  const [nearDisconnecting, setNearDisconnecting] = useState(false);
  const pendingNearProof = useRef(null);
  const nearProofBusy = useRef(false);
  const [nearProofRetry, setNearProofRetry] = useState(false);
  const [xAccount, setXAccount] = useState(null);
  const [xLoading, setXLoading] = useState(false);
  const [xError, setXError] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState(profile?.nickname || profile?.username || '');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameConfirmOpen, setNicknameConfirmOpen] = useState(false);
  const [webOpening, setWebOpening] = useState(false);
  const [webError, setWebError] = useState('');
  const openWebGame = async () => {
    if (webOpening) return;
    setWebOpening(true);
    setWebError('');
    const telegramWebApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      if (!telegramWebApp?.initData) { window.open('/web', '_blank', 'noopener,noreferrer'); return; }
      let tutorialStep = resolveTutorialStep(profile?.tutorial_step, profile);
      try {
        const key = `local-tutorial:v55:${profile?.id || profile?.telegram_id || 'tester'}`;
        tutorialStep = resolveTutorialStep(window.localStorage.getItem(key), profile) || tutorialStep;
      } catch {}
      const response = await fetch('/api/auth/web/launch', { method: 'POST', signal: controller.signal, headers: { 'X-Telegram-Init-Data': telegramWebApp.initData, 'Content-Type': 'application/json' }, body: JSON.stringify({ tutorialStep }) });
      const payload = await response.json();
      if (!response.ok || !payload?.data?.path) throw new Error(payload.message || 'Could not open web game');
      const url = new URL(payload.data.path, window.location.origin).href;
      if (typeof telegramWebApp.openLink === 'function') telegramWebApp.openLink(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setWebError(error.name === 'AbortError'
        ? (profile?.language === 'ru' ? 'Сервер долго отвечает. Попробуйте снова.' : profile?.language === 'en' ? 'The server is taking too long. Try again.' : 'Сервер довго відповідає. Спробуйте ще раз.')
        : error.message);
    } finally {
      window.clearTimeout(timeout);
      setWebOpening(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/promo-codes').then((response) => response.json()).then((json) => {
      if (active && Array.isArray(json?.data)) setDynamicPromoCodes(json.data);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const playerName = profile?.nickname || profile?.username || 'local_tester';
  const uid = profile?.telegram_id || profile?.id || user?.id || '880673';
  const clanName = profile?.clan_name || 'Junk Protocol';
  const activeLanguage = profile?.language || 'en';
  const usedCodes = profile?.used_promo_codes || [];
  const power = getPlayerCA(profile);
  const caRank = getCARank(power);
  const caRankIcon = getCARankIcon(caRank);
  useEffect(() => {
    setNicknameDraft(playerName);
  }, [playerName]);

  useEffect(() => {
    let cancelled = false;
    let connector;

    const saveConnectedAccount = async (accountId) => {
      if (cancelled) return;
      const nextId = String(accountId || '');
      setActiveNearAccount(nextId);
    };
    const handleNearSignIn = ({ accounts }) => saveConnectedAccount(accounts?.[0]?.accountId);
    const handleNearSignOut = () => saveConnectedAccount('');

    getNearWalletConnector()
      .then((nearConnector) => {
        connector = nearConnector;
        connector.on('wallet:signIn', handleNearSignIn);
        connector.on('wallet:signOut', handleNearSignOut);
        connector.getConnectedWallet()
          .then(({ accounts }) => saveConnectedAccount(accounts?.[0]?.accountId))
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      nearProofBusy.current?.abort?.();
      nearProofBusy.current = false;
      connector?.off('wallet:signIn', handleNearSignIn);
      connector?.off('wallet:signOut', handleNearSignOut);
    };
  }, [profile?.id]);

  const connectNearWallet = async () => {
    if (nearProofBusy.current) return;
    const attempt = new AbortController();
    nearProofBusy.current = attempt;
    setNearConnecting(true);
    setNearWalletError('');
    try {
      if (!pendingNearProof.current || pendingNearProof.current.playerId !== profile?.id || pendingNearProof.current.expiresAt <= Date.now()) {
        pendingNearProof.current = null;
        setNearProofRetry(false);
        const challenge = await waitForNearWallet(createNearWalletProofChallenge(), { signal: attempt.signal, timeoutMs: 20000 });
        if (!challenge.expiresAt) throw new Error(profile?.language === 'ru' ? 'Сервер NEAR не обновлён. Сообщите администратору.' : profile?.language === 'en' ? 'The NEAR server needs updating. Contact the administrator.' : 'Сервер NEAR не оновлено. Повідомте адміністратора.');
        const { account, signedMessage } = await signNearWalletProof(challenge, { signal: attempt.signal });
        if (nearProofBusy.current !== attempt) return;
        pendingNearProof.current = { playerId: profile?.id, account, challengeId: challenge.challengeId, signedMessage, expiresAt: challenge.expiresAt || Date.now() + 4 * 60 * 1000 };
      }
      const proof = pendingNearProof.current;
      const verified = await waitForNearWallet(verifyNearWalletProof({ challengeId: proof.challengeId, signedMessage: proof.signedMessage }), { signal: attempt.signal, timeoutMs: 20000 });
      if (nearProofBusy.current !== attempt) return;
      setNearWalletId(verified.near_wallet_id || proof.account);
      setActiveNearAccount(verified.near_wallet_id || proof.account);
      onSyncProfile?.({ id: profile?.id, ...verified });
      pendingNearProof.current = null;
      setNearProofRetry(false);
    } catch (error) {
      if (nearProofBusy.current !== attempt || error?.name === 'AbortError') return;
      if (['NEAR_PROOF_INVALID', 'NEAR_WALLET_ALREADY_LINKED'].includes(error?.code)) pendingNearProof.current = null;
      setNearProofRetry(Boolean(pendingNearProof.current));
      setNearWalletError(error?.message || 'Unable to verify NEAR wallet');
    } finally {
      if (nearProofBusy.current === attempt) {
        setNearConnecting(false);
        nearProofBusy.current = false;
      }
    }
  };

  const disconnectNearWallet = async () => {
    if (nearProofBusy.current === 'disconnect') return;
    nearProofBusy.current?.abort?.();
    nearProofBusy.current = 'disconnect';
    setNearDisconnecting(true);
    setNearConnecting(true);
    setNearWalletError('');
    pendingNearProof.current = null;
    setNearProofRetry(false);
    try {
      const result = await waitForNearWallet(unlinkNearWallet(), { timeoutMs: 20000 });
      setNearWalletId('');
      onSyncProfile?.({ id: profile?.id, ...result });
      await disconnectNearSession();
    } catch (error) {
      setNearWalletError(error?.message || 'Unable to disconnect NEAR wallet');
    } finally {
      nearProofBusy.current = false;
      setNearConnecting(false);
      setNearDisconnecting(false);
    }
  };
  const changeWebAccount = async () => {
    if(nearDisconnecting)return;
    nearProofBusy.current?.abort?.();
    setNearDisconnecting(true);setNearWalletError('');
    try{await switchWebAccount();}catch(error){setNearWalletError(error.message);setNearDisconnecting(false);}
  };

  const disconnectTonWallet = async () => {
    if (tonDisconnectBusy.current) return;
    tonDisconnectBusy.current = true;
    setTonDisconnecting(true);
    setTonWalletError('');
    try {
      try { await unlinkTonWallet(); }
      catch (error) { if (error?.code !== 'TON_WALLET_NOT_FOUND') throw error; }
      if (tonConnectUI.connected) await tonConnectUI.disconnect();
    } catch (error) {
      setTonWalletError(error?.message || 'Unable to disconnect TON wallet');
    } finally {
      tonDisconnectBusy.current = false;
      setTonDisconnecting(false);
    }
  };

  const xRequest = async (path, method = 'GET') => {
    const session = getTelegramSession();
    const headers = { Accept: 'application/json' };
    if (session?.initData) headers['X-Telegram-Init-Data'] = session.initData;
    if (session?.telegramId) headers['X-Telegram-User-Id'] = String(session.telegramId);
    const response = await fetch(`/auth/x/${path}`, { method, headers, cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.message || 'X account request failed');
      error.code = payload?.code;
      throw error;
    }
    return payload?.data || {};
  };

  const loadXAccount = async () => {
    try {
      const account = await xRequest('me');
      setXAccount(account?.account || null);
    } catch {
      setXAccount(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get('x_oauth');
    if (oauthResult) {
      setXError(oauthResult === 'connected' ? '' : 'X connection failed. Please try again.');
      params.delete('x_oauth');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    }
    loadXAccount();
  }, []);

  const connectXAccount = async () => {
    setXLoading(true);
    setXError('');
    try {
      const result = await xRequest('start', 'POST');
      const webApp = window.Telegram?.WebApp;
      if (webApp?.initData && typeof webApp.openLink === 'function') {
        webApp.openLink(result.authorizationUrl, { try_browser: 'chrome' });
        setXLoading(false);
      } else window.location.assign(result.authorizationUrl);
    } catch (error) {
      setXError(error?.code === 'X_OAUTH_NOT_CONFIGURED'
        ? 'X OAuth needs server app credentials and callback configuration.'
        : error?.message || 'Could not start X authorization.');
      setXLoading(false);
    }
  };

  const disconnectXAccount = async () => {
    setXLoading(true);
    setXError('');
    try {
      await xRequest('disconnect', 'POST');
      setXAccount(null);
    } catch (error) {
      setXError(error?.message || 'Could not disconnect X.');
    } finally {
      setXLoading(false);
    }
  };

  const handlePromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    setPromoResult(null);

    if (code === '4444' && isLocalTesterProfile(profile)) {
      await onUpdateProfile?.(getLocalTesterResetUpdates());
      clearLocalTesterTutorialState();
      window.location.reload();
      return;
    }

    try {
      const result = await onUpdateProfile?.({playerAction:{type:'redeem-promo',code}});
      if (!result?.promo) throw new Error('Сервер не підтвердив активацію промокоду');
      setPromoCode('');
      setPromoRewardPopup(result.promo);
      setPromoResult({success:true,msg:t('profile.activated',{label:result.promo.label})});
    } catch(error) {
      const errorKeys = {PROMO_ALREADY_USED:'codeUsed',PROMO_NOT_FOUND:'codeNotFound',PROMO_LIMIT_REACHED:'codeLimitReached'};
      setPromoResult({success:false,msg:t('profile.' + (errorKeys[error?.code] || 'codeActivationFailed'))});
    } finally { setPromoLoading(false); }
  };

  const changeLanguage = async (language) => {
    if (language === activeLanguage) return;
    await i18n.changeLanguage(language);
    window.localStorage.setItem('game_language', language);
    await onUpdateProfile?.({ language });
  };

  const toggleSound = async () => {
    const nextSound = !soundOn;
    setSoundOn(nextSound);
    await onUpdateProfile?.({ sound_enabled: nextSound });
  };

  const openNicknameEditor = () => {
    setNicknameDraft(playerName);
    setNicknameError('');
    setNicknameConfirmOpen(true);
  };

  const changeNickname = async () => {
    const nickname = nicknameDraft.trim();
    setNicknameSaving(true);
    setNicknameError('');
    try {
      await onUpdateProfile?.({ nickname });
      return true;
    } catch (error) {
      setNicknameError(translateUiText(error?.message || 'Не вдалося змінити нікнейм'));
      return false;
    } finally {
      setNicknameSaving(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border border-[#28ee90] bg-[linear-gradient(180deg,#14200f_0%,#0b1108_9%,#050705_100%)] shadow-[inset_0_0_18px_rgba(40,238,144,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,7,0.86)_0%,rgba(7,10,7,0.94)_45%,rgba(7,10,7,0.98)_100%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#28ee90] pb-2 pl-3">
          <h2 className="font-sans text-[18px] font-black leading-none text-[#fff4d4] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">
            {t('profile.personalInfo')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#10170d] text-[#dfffc3] transition hover:brightness-110"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-2">
            <div className="space-y-2">
              <div className="flex h-[108px] w-[108px] items-center justify-center">
                {caRankIcon ? (
                  <img
                    src={caRankIcon}
                    alt={caRank.names?.[i18n.language] || caRank.names?.en || ''}
                    title={caRank.names?.[i18n.language] || caRank.names?.en || ''}
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <NicknameRow
                label={t('profile.nickname')}
                value={playerName}
                onEdit={openNicknameEditor}
                freeChange={Number(profile?.nickname_change_count || 0) < 1}
              />
              <InfoRow label={t('profile.uid')} value={uid} />
              <InfoRow label={t('profile.guild')} value={clanName} />
            </div>
          </div>
          <ProfileFramePicker profile={profile} onUpdateProfile={onUpdateProfile} />
          <TextureButton onClick={openWebGame} disabled={webOpening} className="mt-3 w-full">
            <ExternalLink className="h-4 w-4" />
            {webOpening ? (profile?.language === 'ru' ? 'Открываем…' : profile?.language === 'en' ? 'Opening…' : 'Відкриваємо…') : t('profile.openWebGame')}
          </TextureButton>
          {webError ? <p role="alert" className="mt-1 font-mono text-[9px] font-black text-[#ff8978]">{webError}</p> : null}
          {nicknameError ? <p className="mt-1 font-mono text-[9px] font-black text-[#ff8978]">{nicknameError}</p> : null}
          <div className="mt-3 flex items-center gap-2"><BugReportButton language={profile?.language}/><button type="button" onClick={()=>setAnimationsEnabled(!animationsEnabled)} aria-pressed={animationsEnabled} title={profile?.language==='ru'?'Анимации':profile?.language==='en'?'Animations':'Анімації'} aria-label={profile?.language==='ru'?'Анимации':profile?.language==='en'?'Animations':'Анімації'} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-black/60 text-lg font-black shadow-inner ${animationsEnabled?'bg-[#91bd2c] text-[#183107]':'bg-[#a23a31] text-[#ffe4ca]'}`}>{animationsEnabled?'▶':'Ⅱ'}</button></div>
          <div className="mt-3 rounded-[4px] border border-[#28ee90] bg-[#0b1009]/95 p-2">
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => event.key === 'Enter' && handlePromo()}
                placeholder={t('profile.promoCode')}
                maxLength={20}
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-[8px] border border-[#28ee90] bg-[#060906] px-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#f1ffe6] outline-none placeholder:text-[#597444] focus:border-[#28ee90]"
              />
              <TextureButton onClick={handlePromo} disabled={promoLoading || !promoCode.trim()} className="w-[74px] disabled:!opacity-100">
                {t('profile.ok')}
              </TextureButton>
            </div>
            {promoResult ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-2 font-mono text-[10px] ${promoResult.success ? 'text-[#b9ff58]' : 'text-[#ff7777]'}`}
              >
                {promoResult.msg}
              </motion.p>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {LANGUAGES.map((language) => {
              const active = language.id === activeLanguage;
              return (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => changeLanguage(language.id)}
                  className={`flex h-9 items-center justify-center gap-1 rounded-[8px] border font-mono text-[11px] font-black transition ${
                    active
                      ? 'border-[#28ee90] bg-[#263d15] text-[#eaffbd]'
                      : 'border-[#28ee90] bg-[#0b1009] text-[#86a869]'
                  }`}
                >
                  <LanguageFlag id={language.id} />
                  <span>{language.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 overflow-hidden rounded-[4px] border border-[#28ee90] bg-[#0b1009]/95 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#9bd96b]">{t('profile.walletLink')}</p>
              <span className="rounded-full px-2 py-1 font-mono text-[8px] uppercase text-[#8bb569]">{t('profile.walletStatus')}</span>
            </div>
            <div className="overflow-hidden rounded-[8px] bg-[#060906] px-2 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                <div className="wallet-ton-store-button relative h-10 overflow-hidden rounded-[10px_8px_11px_7px] border border-[#1c677e] bg-[linear-gradient(180deg,#50b9d5_0%,#2589a7_58%,#135169_100%)] shadow-[inset_0_1px_rgba(223,250,255,0.34),inset_0_-2px_rgba(0,35,48,0.25)]">
                  <TonConnectButton className="!h-full !w-full" />
                  <span title={tonAddress || undefined} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-1.5 overflow-hidden px-1 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#0c1b34] [text-shadow:0_1px_0_rgba(255,255,255,0.28)]">
                    <TonLogo />
                    <span className="truncate">{tonAddress || 'CONNECT TON'}</span>
                  </span>
                  <style>{`
                    .wallet-ton-store-button #ton-connect-button { width: 100% !important; height: 100% !important; }
                    .wallet-ton-store-button #ton-connect-button button { width: 100% !important; height: 100% !important; border: 0 !important; border-radius: 8px !important; background: transparent !important; box-shadow: none !important; opacity: 0 !important; }
                  `}</style>
                </div>
                <button type="button" onClick={disconnectTonWallet} disabled={tonDisconnecting} className="mt-1 block w-full text-center font-mono text-[9px] text-[#8bb569] underline underline-offset-2 disabled:opacity-50">Disconnect</button>
                </div>
                <div className="min-w-0">
                <TextureButton onClick={connectNearWallet} disabled={nearConnecting} textClassName="text-[#17310d]" className="w-full">
                  <NearLogo />
                  <span title={nearWalletId || undefined} className="min-w-0 truncate">{nearConnecting ? 'VERIFYING…' : nearProofRetry ? (profile?.language === 'ru' ? 'Повторить проверку' : profile?.language === 'en' ? 'Retry verification' : 'Повторити перевірку') : nearWalletId || 'CONNECT NEAR'}</span>
                </TextureButton>
                <button type="button" onClick={isWebPlatform&&!profile?.telegram_id?changeWebAccount:disconnectNearWallet} disabled={nearDisconnecting} className="mt-1 block w-full text-center font-mono text-[11px] text-[#8bb569] underline underline-offset-2 disabled:opacity-50">{nearDisconnecting ? '…' : isWebPlatform&&!profile?.telegram_id?(profile?.language==='ru'?'Сменить аккаунт':profile?.language==='en'?'Switch account':'Змінити акаунт'):'Disconnect'}</button>
                </div>
              </div>
              {nearWalletError ? <p className="col-span-2 mt-1 font-mono text-[10px] text-[#ff9b88]">{nearWalletError}</p> : null}
              {tonWalletError ? <p className="col-span-2 mt-1 font-mono text-[10px] text-[#ff9b88]">{tonWalletError}</p> : null}
              {isWebPlatform&&profile?.telegram_id&&<button type="button" onClick={changeWebAccount} disabled={nearDisconnecting} className="mt-2 w-full text-center font-mono text-[11px] text-[#b9dc81] underline disabled:opacity-50">{profile?.language==='ru'?'Выйти и сменить игровой аккаунт':profile?.language==='en'?'Sign out and switch game account':'Вийти та змінити ігровий акаунт'}</button>}
            </div>
          </div>

          <div className="mt-2 rounded-[4px] border border-[#28ee90] bg-[#0b1009]/95 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#9bd96b]">X / Twitter</p>
                <p className="mt-1 truncate font-mono text-[10px] font-bold text-[#d8e7cc]">
                  {xAccount ? `@${xAccount.username}` : 'Connect for subscription checks'}
                </p>
              </div>
              <TextureButton onClick={xAccount ? disconnectXAccount : connectXAccount} disabled={xLoading} className="min-w-[124px]">
                {xLoading ? 'PLEASE WAIT' : xAccount ? 'DISCONNECT X' : 'CONNECT X'}
              </TextureButton>
            </div>
            {xError ? <p className="mt-2 font-mono text-[9px] font-bold text-[#ff8978]">{xError}</p> : null}
          </div>

          <PlayerAchievements profile={profile} language={activeLanguage} />

          <div className="mt-3 grid grid-cols-2 gap-2 pb-1">
            <DarkButton icon={Bell} label={t('profile.notifications')} sublabel={t('profile.later')} />
            <DarkButton icon={Copy} label={t('profile.copyUid')} sublabel={String(uid)} />
          </div>
        </div>
      </div>
      {nicknameConfirmOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[330px] border border-[#28ee90] bg-[#0b1209] p-3 shadow-[0_0_26px_rgba(40,238,144,0.24)]">
            <p className="font-sans text-[16px] font-black uppercase text-[#fff4d4]">{t('profile.changeNickname', { defaultValue: 'Змінити нікнейм?' })}</p>
            <label className="mt-3 block font-mono text-[9px] font-black uppercase text-[#bce78a]">
              {t('profile.newNickname', { defaultValue: 'Новий нікнейм' })}
              <input
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && changeNickname().then((saved) => { if (saved) setNicknameConfirmOpen(false); })}
                maxLength={40}
                autoFocus
                className="mt-1 block w-full border border-[#28ee90] bg-[#060906] px-2 py-2 font-sans text-[13px] font-black text-[#fff4d4] outline-none focus:border-[#c6ff61]"
              />
            </label>
            <p className="mt-1 font-mono text-[10px] font-black uppercase text-[#bce78a]">
              {Number(profile?.nickname_change_count || 0) < 1 ? t('profile.firstNicknameFree', { defaultValue: 'Перша зміна — безкоштовно' }) : t('profile.nicknamePrice', { defaultValue: 'Ціна: 500 T-Pape' })}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <GameTextureButton type="button" tone="gray" onClick={() => { setNicknameDraft(playerName); setNicknameConfirmOpen(false); }} className="h-10">
                <span className="relative z-10 font-mono text-[10px] font-black uppercase text-[#f2f6ff]">{t('profile.cancel', { defaultValue: 'Скасувати' })}</span>
              </GameTextureButton>
              <GameTextureButton type="button" tone="green" disabled={nicknameSaving || !nicknameDraft.trim() || nicknameDraft.trim() === playerName} onClick={async () => { const saved = await changeNickname(); if (saved) setNicknameConfirmOpen(false); }} className="h-10 disabled:opacity-60">
                <span className="relative z-10 flex items-center justify-center gap-1 font-mono text-[10px] font-black uppercase text-[#17220e]">
                  {t('profile.confirm', { defaultValue: 'Підтвердити' })}
                </span>
              </GameTextureButton>
            </div>
          </div>
        </div>
      ) : null}
      {promoRewardPopup ? <LootBoxModal
        boxType="activity"
        boxName={promoRewardPopup.code}
        lang={activeLanguage === 'uk' ? 'ua' : activeLanguage}
        initialDrops={(promoRewardPopup.rewards || []).map(reward => ({
          type: reward.type === 'currency' ? 'tentacles' : reward.type === 'boss_keys' ? 'keycard' : reward.type === 'item' ? (reward.itemId === 'pet5' ? 'pet' : 'weapon') : reward.type,
          id: reward.itemId || reward.type,
          itemId: reward.type === 'item' && reward.itemId === 'pet5' ? reward.itemId : undefined,
          qty: Number(reward.amount || 0),
        }))}
        onClose={() => setPromoRewardPopup(null)}
      /> : null}
    </div>
  );
}
