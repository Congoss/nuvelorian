import { randomBytes } from 'node:crypto';
import { verifySignature } from '@near-wallet-selector/core';
import { verifyNearAccountKey } from './nearWalletProof.js';

export function createNearWebLogin({ now = Date.now, verifyKey = verifyNearAccountKey } = {}) {
  const challenges = new Map();
  const secure = !['test', 'development'].includes(process.env.NODE_ENV);
  const cookieName = secure ? '__Host-p4_near_login' : 'p4_near_login';
  const bindingFrom = headers => String(headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  return {
    challenge(headers) {
      for (const [id, c] of challenges) if (c.expiresAt <= now() || c.binding === bindingFrom(headers)) challenges.delete(id);
      if (challenges.size >= 10000) throw Object.assign(new Error('Try again later'), { status: 429 });
      const challengeId = randomBytes(24).toString('base64url');
      const binding = randomBytes(32).toString('base64url');
      const expiresAt = now() + 300000;
      const message = `Sign in to Planet4. Challenge ${challengeId}. Expires ${new Date(expiresAt).toISOString()}.`;
      const nonce = randomBytes(32);
      challenges.set(challengeId, { binding, expiresAt, message, nonce });
      return {
        cookie: `${cookieName}=${binding}; Path=/; HttpOnly; SameSite=Strict; Max-Age=300${secure ? '; Secure' : ''}`,
        data: { challengeId, message, nonce: nonce.toString('base64'), recipient: 'planet4.near', expiresAt },
      };
    },
    async verify(headers, body, players, network) {
      const c = challenges.get(body?.challengeId);
      const invalid = () => Object.assign(new Error('Wallet proof expired or invalid'), { status: 401, code: 'NEAR_LOGIN_INVALID' });
      if (!c || c.expiresAt <= now() || c.binding !== bindingFrom(headers) || c.busy) throw invalid();
      c.busy = true;
      try {
        const signed = body?.signedMessage || {};
        const accountId = String(signed.accountId || '');
        if (!/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(accountId) || accountId.length > 64) throw invalid();
        let valid = false;
        try { valid = verifySignature({ publicKey: signed.publicKey, signature: signed.signature, message: c.message, nonce: c.nonce, recipient: 'planet4.near' }); } catch { /* Invalid proof. */ }
        if (!valid) throw invalid();
        if (!await verifyKey({ accountId, publicKey: signed.publicKey, network })) throw invalid();
        if (c.expiresAt <= now() || challenges.get(body.challengeId) !== c) throw invalid();
        challenges.delete(body.challengeId);
        const matches = players.filter(p => String(p.near_wallet_id || '').toLowerCase() === accountId);
        if (matches.length > 1 || matches.some(p => p.is_banned || p.near_wallet_verified !== true)) {
          throw Object.assign(new Error('This wallet has a conflicting or unavailable game account. Sign in through Telegram to verify its link.'), { status: 403, code: 'NEAR_LOGIN_NOT_LINKED' });
        }
        const player = matches[0];
        return { telegramId: String(player?.telegram_id || ''), username: player?.username || accountId, nearAccountId: accountId, email: player?.created_by || `near_${accountId}@miniapp.local`, isMock: false };
      } finally { c.busy = false; }
    },
  };
}
