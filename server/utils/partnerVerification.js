export function normalizePartnerLink(link) {
  const value = String(link || '').trim();
  return /^(?:t\.me|x\.com|twitter\.com)\//i.test(value) ? `https://${value}` : value;
}

export function parseVerifiablePartnerLink(link) {
  let url;
  try { url = new URL(link); } catch { return null; }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  if (url.search || url.hash) return null;
  const telegramPath = parts.length === 1 || ((parts.length === 2 || parts.length === 3) && parts.slice(1).every(part => /^[1-9]\d*$/.test(part)));
  if (url.hostname === 't.me' && telegramPath && /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(parts[0])) return { type: 'telegram', handle: parts[0] };
  if (parts.length !== 1) return null;
  if (['x.com', 'twitter.com'].includes(url.hostname) && /^[a-zA-Z0-9_]{1,15}$/.test(parts[0])) return { type: 'x', handle: parts[0] };
  return null;
}

export function classifyTelegramMembership(member) {
  if (['creator', 'administrator', 'member'].includes(member?.status)) return true;
  if (member?.status === 'restricted' && typeof member.is_member === 'boolean') return member.is_member;
  if (['left', 'kicked', 'banned'].includes(member?.status)) return false;
  throw new Error('Telegram membership status is unavailable');
}

export async function verifyXFollow(accessToken, userId, targetHandle, fetcher = fetch) {
  let nextToken = '';
  for (let page = 0; page < 10; page += 1) {
    const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/following`);
    url.searchParams.set('max_results', '1000');
    if (nextToken) url.searchParams.set('pagination_token', nextToken);
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`X follow check failed (${response.status})`);
    const body = await response.json();
    if (body?.data?.some((user) => String(user.username || '').toLowerCase() === targetHandle.toLowerCase())) return true;
    nextToken = body?.meta?.next_token || '';
    if (!nextToken) return false;
  }
  throw new Error('X follow list is too large to verify safely');
}
