import { buildReferralLink } from '../../src/lib/referralLinks.js';

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export function referralPage(code, language='en', affiliateUrl='') {
 if (!/^[A-Za-z0-9_-]{1,60}$/.test(code)) return null;
 const origin = new URL(process.env.PUBLIC_APP_URL || 'https://p4.nuvelor.gg').origin;
 const bot = String(process.env.TELEGRAM_BOT_USERNAME || process.env.VITE_TELEGRAM_BOT_USERNAME || 'planet_4bot').replace(/^@/, '');
 const link = buildReferralLink({referral_code:code,telegram_affiliate_url:affiliateUrl},bot);
 const descriptions = {uk:'Приєднуйся до PLANET4: бий босів, прокачуй героя та грай разом із друзями!',ru:'Присоединяйся к PLANET4: побеждай боссов, прокачивай героя и играй вместе с друзьями!',en:'Join PLANET4: fight bosses, upgrade your hero and play with friends!'};
 const lang = Object.hasOwn(descriptions,language)?language:'en';
 const description=escape(descriptions[lang]);
 const image=escape(origin+'/referral-card-v2.jpg');
 const canonical=escape(origin+'/invite/'+code+'?lang='+lang);
 return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PLANET4 · NUVELORIAN</title><meta property="og:type" content="website"><meta property="og:title" content="PLANET4 · NUVELORIAN"><meta property="og:description" content="'+description+'"><meta property="og:url" content="'+canonical+'"><meta property="og:image" content="'+image+'"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="720"><meta name="twitter:card" content="summary_large_image"><style>body{margin:0;background:#0a1209;color:#efffdf;font:18px system-ui;display:grid;min-height:100vh;place-items:center}main{max-width:640px;margin:24px;text-align:center}img{width:100%;border-radius:20px}p{line-height:1.5}a{display:inline-block;background:#c4f13b;color:#16200a;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:800}</style></head><body><main><img src="'+image+'" alt="PLANET4 NUVELORIAN"><h1>PLANET4 · NUVELORIAN</h1><p>'+description+'</p><a href="'+escape(link)+'">'+({uk:'Грати в Telegram',ru:'Играть в Telegram',en:'Play in Telegram'}[lang])+'</a></main></body></html>';
}

