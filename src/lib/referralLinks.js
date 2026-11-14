export function referralCode(player) {
  return String(player?.referral_code || player?.telegram_id || player?.id || '').trim();
}

export function referralBotName(value = 'planet_4bot') {
  return String(value).trim().replace(/^@/, '');
}

// Telegram handles ref separately from the Mini App's signed start_param.
// An affiliate token is opaque: never derive it from a Telegram/player ID.
export function parseAffiliateLink(value, bot = 'planet_4bot') {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('INVALID_TELEGRAM_AFFILIATE_LINK');
  let url;
  try { url = new URL(String(value).trim()); } catch { throw new Error('INVALID_TELEGRAM_AFFILIATE_LINK'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port
    || !['t.me', 'telegram.me'].includes(url.hostname.toLowerCase())
    || url.pathname.replace(/\/$/, '').toLowerCase() !== `/${referralBotName(bot).toLowerCase()}`) throw new Error('INVALID_TELEGRAM_AFFILIATE_LINK');
  if (url.searchParams.getAll('ref').length > 1 || url.searchParams.getAll('start').length > 1
    || url.searchParams.getAll('startapp').length > 1) throw new Error('INVALID_TELEGRAM_AFFILIATE_LINK');
  const start = url.searchParams.get('start') || url.searchParams.get('startapp') || '';
  const token = url.searchParams.get('ref') || (start.startsWith('_tgr_') ? start.slice(5) : '');
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(token)) throw new Error('INVALID_TELEGRAM_AFFILIATE_LINK');
  return { token, url: `https://t.me/${referralBotName(bot)}?ref=${encodeURIComponent(token)}` };
}

export function buildReferralLink(player, bot = 'planet_4bot') {
  const code = referralCode(player);
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(code)) return '';
  const url = new URL(`https://t.me/${referralBotName(bot)}`);
  url.searchParams.set('startapp', `ref_${code}`);
  if (player.telegram_affiliate_url) {
    const { token } = parseAffiliateLink(player.telegram_affiliate_url, bot);
    url.searchParams.set('ref', token);
  }
  return url.href;
}
