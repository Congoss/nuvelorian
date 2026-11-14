import { watchGameBuild } from '@/lib/gameBuildRefresh';
import LoadingOverlay from '@/components/game/LoadingOverlay';
import { translateUiText } from '@/lib/uiTextTranslations';
import { Component, Suspense, lazy, useEffect, useState } from 'react';
import { Toaster } from "@/components/game/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { installClientDiagnostics, reportClientDiagnostic } from '@/lib/diagnosticReporter';
import { isWebPlatform, platformConfig } from '@/lib/platform/config';
import WebLogin from '@/components/WebLogin';
const loadGame = () => import('./pages/Game');
const Game = lazy(loadGame);
const GamePortal = lazy(() => import('./pages/GamePortal'));
const NftPetCheck = lazy(() => import('./pages/NftPetCheck'));
const AdvancedTalentsPreview = import.meta.env.DEV ? lazy(() => import('./pages/AdvancedTalentsPreview')) : null;
const AnubisSetPreview = import.meta.env.DEV ? lazy(() => import('./pages/AnubisSetPreview')) : null;
const ShkrabanSetPreview = import.meta.env.DEV ? lazy(() => import('./pages/ShkrabanSetPreview')) : null;
const TutorialJourneyPreview = import.meta.env.DEV ? lazy(() => import('./pages/TutorialJourneyPreview')) : null;
const CardGamePreview = import.meta.env.DEV ? lazy(() => import('./pages/CardGamePreview')) : null;
const AchievementPreview = import.meta.env.DEV ? lazy(() => import('./pages/AchievementPreview')) : null;
const BossDossierPreview = import.meta.env.DEV ? lazy(() => import('./pages/BossDossierPreview')) : null;
const ProfileHeaderSkinPreview = import.meta.env.DEV ? lazy(() => import('./pages/ProfileHeaderSkinPreview')) : null;
const PublicPlayerProfilePreview = import.meta.env.DEV ? lazy(() => import('./pages/PublicPlayerProfilePreview')) : null;
const PlayerProfilePreview = import.meta.env.DEV ? lazy(() => import('./pages/PlayerProfilePreview')) : null;
const EquipmentEnhancePreview = import.meta.env.DEV ? lazy(() => import('./pages/EquipmentEnhancePreview')) : null;
const MarketTestnetPreview = import.meta.env.DEV ? lazy(() => import('./pages/MarketTestnetPreview')) : null;
const NearSubaccountSetup = import.meta.env.DEV ? lazy(() => import('./pages/NearSubaccountSetup')) : null;
const JunkSkunkPreview = import.meta.env.DEV ? lazy(() => import('./pages/JunkSkunkPreview')) : null;
const ClanShipPreview = import.meta.env.DEV ? lazy(() => import('./pages/ClanShipPreview')) : null;
const PvpPreview = import.meta.env.DEV ? lazy(() => import('./pages/PvpPreview')) : null;
const CosmoGrowPreview = import.meta.env.DEV ? lazy(() => import('./pages/CosmoGrowPreview')) : null;

const adminRouteEnabled = import.meta.env.DEV || import.meta.env.MODE === 'admin' || import.meta.env.VITE_ENABLE_ADMIN === 'true';
const AdminGate = adminRouteEnabled ? lazy(() => import('./pages/AdminGate')) : null;
const BoneCursePreview = import.meta.env.DEV ? lazy(() => import('./pages/BoneCursePreview')) : null;
const BossDemo = lazy(() => import('./pages/BossDemo')); 

const Forbidden = () => (
  <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6 text-center">
    403
  </div>
);

const AdminDisabled = () => (
  <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6 text-center">
    Admin disabled
  </div>
);

const DebugPanel = ({ data }) => (
  <div className="fixed bottom-3 left-3 right-3 z-50 rounded-xl border border-[#28ee90] bg-[#0c100b] p-3 text-left font-mono text-[10px] text-[#d7e8c7]">
    <p>debug=1</p>
    <p>hasTelegramObject: {String(data.hasTelegramObject)}</p>
    <p>hasInitData: {String(data.hasInitData)}</p>
    <p>initDataLength: {String(data.initDataLength || 0)}</p>
    <p>authMeStatus: {String(data.authMeStatus || '')}</p>
    <p>authMeErrorCode: {String(data.authMeErrorCode || '')}</p>
    <p>bootstrapStatus: {String(data.bootstrapStatus || '')}</p>
    <p>bootstrapErrorCode: {String(data.bootstrapErrorCode || '')}</p>
    <p>bootStatus: {String(data.bootStatus || '')}</p>
    <p>lastFailingEndpoint: {String(data.lastFailingEndpoint || '')}</p>
  </div>
);

const OpenInTelegramScreen = ({ onOpen }) => isWebPlatform ? <WebLogin onFallback={onOpen} /> : (
  <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6">
    <div className="max-w-sm rounded-[28px] border border-[#28ee90] bg-[#10140f] p-5 text-center">
      <p className="font-mono text-[18px] font-bold text-[#edf8d9]">{isWebPlatform ? 'Planet4 · Web game' : 'Open in Telegram'}</p>
      <p className="mt-2 font-mono text-[11px] text-[#9cb087]">{isWebPlatform ? 'Увійдіть через Telegram, щоб продовжити з тим самим ігровим акаунтом.' : 'Open the game inside Telegram Mini App.'}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 h-10 rounded-xl border border-[#28ee90] bg-[#182114] px-4 font-mono text-[12px] text-[#d7e8c7] hover:bg-[#1f2b18]"
      >
        Open in Telegram
      </button>
    </div>
  </div>
);

const AuthErrorScreen = ({ message, onRetry }) => (
  <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6">
    <div className="max-w-sm rounded-[28px] border border-[#28ee90] bg-[#10140f] p-5 text-center">
      <p className="font-mono text-[18px] font-bold text-[#edf8d9]">Authentication error</p>
      <p className="mt-2 font-mono text-[11px] text-[#9cb087]">{message || 'Unable to authenticate Telegram session.'}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 h-10 rounded-xl border border-[#28ee90] bg-[#182114] px-4 font-mono text-[12px] text-[#d7e8c7] hover:bg-[#1f2b18]"
      >
        Retry
      </button>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkAppState } = useAuth();
  const hasTelegramObject = Boolean(window.Telegram?.WebApp);
  const hasInitData = Boolean(window.Telegram?.WebApp?.initData);
  const debugEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
  const [debugData, setDebugData] = useState(() => window.__tgBootDebug || {});

  useEffect(() => {
    if (!debugEnabled) return;
    const update = () => setDebugData({ ...(window.__tgBootDebug || {}) });
    update();
    const timer = window.setInterval(update, 400);
    return () => window.clearInterval(timer);
  }, [debugEnabled]);

  useEffect(() => {
    // Fetch the game while authentication is in flight, without mounting it
    // or issuing player requests before authentication succeeds.
    if (['/', '/web'].includes(window.location.pathname)) {
      void loadGame().catch(() => {});
    }
  }, []);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <>
        <LoadingOverlay />
        {debugEnabled ? <DebugPanel data={debugData} /> : null}
      </>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      if (!hasTelegramObject || !hasInitData) {
        return (
          <>
            <OpenInTelegramScreen onOpen={navigateToLogin} />
            {debugEnabled ? <DebugPanel data={debugData} /> : null}
          </>
        );
      }
      return (
        <>
          <AuthErrorScreen message={authError.message} onRetry={checkAppState} />
          {debugEnabled ? <DebugPanel data={debugData} /> : null}
        </>
      );
    }
    return (
      <>
        <AuthErrorScreen message={authError.message} onRetry={checkAppState} />
        {debugEnabled ? <DebugPanel data={debugData} /> : null}
      </>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Game />} />
      <Route path="/web" element={<Game />} />
      <Route path="/portal" element={<GamePortal />} />
      <Route path="/nft" element={<GamePortal />} />
      <Route path="/admin" element={adminRouteEnabled ? <AdminGate /> : <AdminDisabled />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info);
    reportClientDiagnostic('RENDER_ERROR', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[100dvh] bg-[#0b0d0a] p-5 text-[#edf8d9] flex items-center justify-center">
        <div className="w-full max-w-sm rounded-[14px] border border-[#28ee90] bg-[#10160f] p-5 text-center">
          <p className="font-mono text-[16px] font-black uppercase">{translateUiText("Помилка завантаження")}</p>
          <p className="mt-2 font-mono text-[11px] text-[#b8c9aa]">{translateUiText("Спробуй оновити гру.")}</p>
          {this.state.error?.message ? <p className="mt-2 break-words font-mono text-[10px] text-[#ff9a8d]">{this.state.error.message}</p> : null}
          <button type="button" onClick={() => window.location.reload()} className="mt-4 h-10 w-full rounded-[10px] bg-[#b9ea45] font-mono text-[12px] font-black uppercase text-[#172016]">{translateUiText("Оновити")}</button>
        </div>
      </div>
    );
  }
}

function AppContent() {
  const [dossierPreviewClosed, setDossierPreviewClosed] = useState(false);
  const isPetCheck = typeof window !== 'undefined' && window.location.pathname === '/nft-pet-check';
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const isPortalRoute = typeof window !== 'undefined' && ['/portal', '/nft'].includes(window.location.pathname);

  useEffect(() => {
    document.documentElement.classList.toggle('portal-scroll', isPortalRoute);
    return () => document.documentElement.classList.remove('portal-scroll');
  }, [isPortalRoute]);

  if (import.meta.env.DEV && window.location.pathname === '/login-preview') return <WebLogin onFallback={() => window.location.assign(`https://t.me/${platformConfig.telegram.botUsername.replace(/^@/, '')}`)} />;
  if (BoneCursePreview && window.location.pathname === '/bone-curse-preview') return <BoneCursePreview />;
  if (window.location.pathname === '/demo') return <BossDemo />;
  if (isPetCheck) return <NftPetCheck />;
  if (AdvancedTalentsPreview && window.location.pathname === '/advanced-talents-preview') return <AdvancedTalentsPreview />;
  if (AnubisSetPreview && window.location.pathname === '/anubis-preview') return <AnubisSetPreview />;
  if (ShkrabanSetPreview && window.location.pathname === '/shkraban-preview') return <ShkrabanSetPreview />;
  if (TutorialJourneyPreview && window.location.pathname === '/tutorial-journey-preview') return <TutorialJourneyPreview />;
  if (CardGamePreview && window.location.pathname === '/card-game-preview') return <CardGamePreview />;
  if (AchievementPreview && window.location.pathname === '/achievement-preview') return <AchievementPreview />;
  if (BossDossierPreview && !dossierPreviewClosed && window.location.pathname === '/boss-dossier-preview') return <BossDossierPreview onExit={()=>{window.history.replaceState(null,'','/');setDossierPreviewClosed(true);}} />;
  if (ProfileHeaderSkinPreview && window.location.pathname === '/profile-header-skin-preview') return <ProfileHeaderSkinPreview />;
  if (PublicPlayerProfilePreview && window.location.pathname === '/public-player-profile-preview') return <PublicPlayerProfilePreview />;
  if (PlayerProfilePreview && window.location.pathname === '/player-profile-preview') return <PlayerProfilePreview />;
  if (EquipmentEnhancePreview && window.location.pathname === '/equipment-enhance-preview') return <EquipmentEnhancePreview />;
  if (MarketTestnetPreview && window.location.pathname === '/market-testnet') return <MarketTestnetPreview />;
  if (NearSubaccountSetup && window.location.pathname === '/near-subaccount') return <NearSubaccountSetup />;
  if (JunkSkunkPreview && window.location.pathname === '/skunk-preview') return <JunkSkunkPreview />;
  if (ClanShipPreview && window.location.pathname === '/clan-ship-preview') return <ClanShipPreview key="ship-layout-v3" />;
  if (PvpPreview && window.location.pathname === '/pvp-preview') return <PvpPreview />;
  if (CosmoGrowPreview && window.location.pathname === '/cosmo-grow-preview') return <CosmoGrowPreview />;
  if (isAdminRoute) {
    return (
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/admin" element={adminRouteEnabled ? <AdminGate /> : <AdminDisabled />} />
            <Route path="*" element={<Forbidden />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    );
  }

  if (isPortalRoute) {
    return (
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <GamePortal />
        </Router>
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

function App() {
  useEffect(() => { installClientDiagnostics(); }, []);
  useEffect(watchGameBuild, []);
  return <AppErrorBoundary><Suspense fallback={<LoadingOverlay />}><AppContent /></Suspense></AppErrorBoundary>;
}

export default App

