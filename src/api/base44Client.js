import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const isLocalDevHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(String(window.location.hostname || '').trim().toLowerCase());

function createDevBase44Mock() {
  const asyncNoop = async (value = null) => value;
  const entities = new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => asyncNoop,
    }),
  });

  return {
    auth: {
      me: async () => ({
        id: 'dev-local-user',
        email: 'telegram_777000@miniapp.local',
        username: 'local_tester',
      }),
      logout: asyncNoop,
      redirectToLogin: asyncNoop,
    },
    entities,
  };
}

// Avoid real Base44 auth/entity traffic in local dev so the app can boot without 401s.
export const base44 = isLocalDevHost
  ? createDevBase44Mock()
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    });
