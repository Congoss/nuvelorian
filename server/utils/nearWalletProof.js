// A signed message proves possession of a key; RPC must also prove the key owns
// the claimed account. Keep this query bounded so a retry can reuse the signature.
export async function verifyNearAccountKey({ accountId, publicKey, network = 'mainnet' }) {
  const nodeUrl = process.env.NEAR_WALLET_RPC_URL || process.env.NEAR_HOLDER_RPC_URL || process.env.NEAR_AUDIENCE_RPC_URL || `https://rpc.${network}.near.org`;
  const response = await fetch(nodeUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ jsonrpc: '2.0', id: 'wallet-proof', method: 'query', params: {
      request_type: 'view_access_key', finality: 'final', account_id: accountId, public_key: publicKey,
    } }),
  });
  if (!response.ok) throw new Error(`NEAR RPC unavailable (${response.status}). Retry wallet verification.`);
  const payload = await response.json();
  if (payload.error) {
    const name = payload.error.cause?.name || payload.error.data?.name;
    if (['UNKNOWN_ACCESS_KEY', 'UNKNOWN_ACCOUNT'].includes(name)) return false;
    throw new Error('NEAR RPC could not verify the account key. Retry wallet verification.');
  }
  if (!payload.result || !Object.hasOwn(payload.result, 'permission')) throw new Error('NEAR RPC returned an incomplete account key. Retry wallet verification.');
  return payload.result.permission === 'FullAccess';
}
