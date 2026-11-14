import { isWebPlatform } from '@/lib/platform/config';

let exchangePromise;
async function resumeNearPayment() {
  let pending;
  try { pending = JSON.parse(window.sessionStorage.getItem('p4-near-pending') || 'null'); } catch { return; }
  if (!pending?.orderId || !pending?.senderAccountId) return;
  const url = new URL(window.location.href);
  const hash = url.searchParams.get('transactionHashes')?.split(',')[0] || pending.txHash;
  if (!hash) return;
  pending.txHash = hash;
  window.sessionStorage.setItem('p4-near-pending', JSON.stringify(pending));
  url.searchParams.delete('transactionHashes');
  window.history.replaceState(null, '', url.pathname + url.search);
  try {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: pending.orderId, paymentMethod: 'near', txHash: hash, senderAccountId: pending.senderAccountId }),
    });
    const payload = await response.json();
    if (response.ok && payload?.data?.order?.status === 'success') window.sessionStorage.removeItem('p4-near-pending');
    else window.sessionStorage.setItem('p4-near-pending', JSON.stringify({ ...pending, message: payload.message || 'Payment confirmation pending' }));
  } catch { /* Retain the order so the shop can retry without another transfer. */ }
}

export function initializeWebSession() {
  if (!isWebPlatform) return Promise.resolve();
  if (exchangePromise) return exchangePromise;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('web_launch');
  if (token) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  exchangePromise = (async () => {
    if (token) {
      const response = await fetch('/api/auth/web/exchange', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const error = new Error(payload.message || 'Open the web game from your Telegram profile again.');
        error.status = response.status;
        throw error;
      }
    }
    await resumeNearPayment();
  })();
  return exchangePromise;
}
