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
import { isWebPlatform } from '@/lib/platform/config';
const Game = lazy(() => import('./pages/Game'));
const GamePortal = lazy(() => import('./pages/GamePortal'));
const NftPetCheck = lazy(() => import('./pages/NftPetCheck'));

const adminRouteEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN !== 'false';
const AdminPage = adminRouteEnabled ? lazy(() => import('./pages/Admin')) : null;

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

const ADMIN_TOKEN_STORAGE_KEY = 'admin_token';
const DEV_ADMIN_TOKEN = 'dev-admin';

const AdminGate = () => {
  const [adminRole,setAdminRole]=useState('operator');
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || (import.meta.env.DEV ? DEV_ADMIN_TOKEN : '');
  });
  const [status, setStatus] = useState(token ? 'checking' : 'idle');
  const [error, setError] = useState('');

  const verifyToken = async (value) => {
    const candidate = String(value || '').trim();
    if (!candidate) {
      setError('Password required');
      return false;
    }
    setStatus('checking');
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: candidate }),
      });
      if (!res.ok) {
        setStatus('idle');
        setError('Access denied');
        return false;
      }
      const auth=await res.json();
      setAdminRole(auth.data?.role || 'owner');
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, candidate);
      setToken(candidate);
      setStatus('ok');
      return true;
    } catch {
      setStatus('idle');
      setError('Auth request failed');
      return false;
    }
  };

  useEffect(() => {
    if (!token) return;
    verifyToken(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await verifyToken(tokenInput);
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken('');
    setTokenInput('');
    setStatus('idle');
    setError('');
  };

  if (status === 'ok' && token && AdminPage) {
    return (
      <Suspense fallback={null}>
        <AdminPage role={adminRole} adminToken={token} onLogout={handleLogout} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-[20px] border border-[#28ee90] bg-[#10140f] p-5">
        <p className="font-mono text-[18px] font-bold text-[#edf8d9]">Admin Login</p>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="mt-3 w-full rounded-lg border border-[#28ee90] bg-[#0b1209] px-3 py-2 font-mono text-[12px] text-[#d7e8c7] outline-none"
          placeholder="Password"
        />
        {error ? <p className="mt-2 font-mono text-[11px] text-[#ff9a9a]">{error}</p> : null}
        <button
          type="submit"
          disabled={status === 'checking'}
          className="mt-3 h-10 w-full rounded-xl border border-[#28ee90] bg-[#182114] px-4 font-mono text-[12px] text-[#d7e8c7] hover:bg-[#1f2b18] disabled:opacity-60"
        >
          {status === 'checking' ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  );
};

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

const OpenInTelegramScreen = ({ onOpen }) => (
  <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6">
    <div className="max-w-sm rounded-[28px] border border-[#28ee90] bg-[#10140f] p-5 text-center">
      <p className="font-mono text-[18px] font-bold text-[#edf8d9]">{isWebPlatform ? 'Planet4 · Web game' : 'Open in Telegram'}</p>
      <p className="mt-2 font-mono text-[11px] text-[#9cb087]">{isWebPlatform ? 'Open your Telegram game profile and select “Web game · pay with NEAR” to continue with the same account.' : 'Open the game inside Telegram Mini App.'}</p>
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

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
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
  const isPetCheck = typeof window !== 'undefined' && window.location.pathname === '/nft-pet-check';
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const isPortalRoute = typeof window !== 'undefined' && ['/portal', '/nft'].includes(window.location.pathname);

  useEffect(() => {
    document.documentElement.classList.toggle('portal-scroll', isPortalRoute);
    return () => document.documentElement.classList.remove('portal-scroll');
  }, [isPortalRoute]);

  if (isPetCheck) return <NftPetCheck />;
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
  return <AppErrorBoundary><Suspense fallback={<div role="status" aria-label="Loading" className="flex min-h-[100dvh] items-center justify-center bg-black"><span className="h-7 w-7 animate-spin rounded-full border-2 border-[#83b83d]/25 border-t-[#a7d860]" /></div>}><AppContent /></Suspense></AppErrorBoundary>;
}

export default App
