import { Suspense, lazy, useEffect, useState } from 'react';
const AdminPage = lazy(() => import('./Admin'));
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


export default AdminGate;
