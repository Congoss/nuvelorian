export const PENDING_PAYMENT_DISPLAY_TTL_MS = 60 * 60 * 1000;
// Admin display only. Keep the authoritative order available for late confirmations.
export function getPaymentDisplayStatus(transaction, now = Date.now()) {
 const status = String(transaction?.status || '').toLowerCase();
 const created = Date.parse(transaction?.created_at || '');
 return status === 'pending' && Number.isFinite(created) && now - created >= PENDING_PAYMENT_DISPLAY_TTL_MS ? 'expired' : status;
}
