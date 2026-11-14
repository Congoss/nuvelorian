import { useEffect, useState } from 'react';
import { gameApi } from '@/services/gameApi';
import { serverNow } from '@/lib/serverClock.js';
import small from '@/assets/skills/small-poison.png';
import medium from '@/assets/skills/medium-poison.png';
import large from '@/assets/skills/large-poison.png';
import tentacles from '@/assets/optimized/cosmohand.webp';

const icons = { small, medium, large };
const names = { uk: ['Магазин ядів', 'Купити', 'Залишок', 'Великий', 'Середній', 'Малий', 'Куплено'], ru: ['Магазин ядов', 'Купить', 'Остаток', 'Большой', 'Средний', 'Малый', 'Куплено'], en: ['Poison shop', 'Buy', 'Remaining', 'Large', 'Medium', 'Small', 'Purchased'] };
export default function EventPoisonShop({ profile, onRefreshProfile, lang = 'uk' }) {
  const [shop, setShop] = useState(null);
  const [quantities, setQuantities] = useState({ large: 1, medium: 1, small: 1 });
  const [now, setNow] = useState(serverNow());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);
  const text = names[lang] || names.uk;
  useEffect(() => {
    let mounted = true;
    const load = () => gameApi.getEventPoisonShop().then(value => { if (mounted) setShop(value); }).catch(() => {});
    load();
    const refresh = setInterval(load, 15000);
    const tick = setInterval(() => setNow(serverNow()), 1000);
    return () => { mounted = false; clearInterval(refresh); clearInterval(tick); };
  }, []);
  if (!shop || !shop.active || now >= Date.parse(shop.endAt)) return null;
  const seconds = Math.max(0, Math.ceil((Date.parse(shop.endAt) - now) / 1000));
  const clock = [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
  async function buy(product) {
    if (busy) return;
    const quantity = Math.min(quantities[product.id], product.remaining);
    const body = pending?.productId === product.id && pending.quantity === quantity ? pending : { productId: product.id, quantity, requestId: crypto.randomUUID() };
    setPending(body); setBusy(true); setMessage('');
    try {
      const result = await gameApi.buyEventPoison(body);
      setShop(result.shop); setPending(null); setMessage(text[6]);
      await onRefreshProfile?.();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="border border-[#28ee90] bg-[#0b120a] p-2">
    <div className="mb-1 flex items-center justify-between gap-2"><h3 className="text-[11px] font-black uppercase text-[#d7ff94]">{text[0]}</h3><span className="font-mono text-[10px] text-[#ffbb55]">{clock}</span></div>
    <div className="grid grid-cols-3 gap-1">{shop.products.map((product, index) => {
      const quantity = Math.min(quantities[product.id], product.remaining);
      return <div key={product.id} className="min-w-0 rounded bg-black/30 px-1 py-1 text-center">
        <div className="text-[10px] font-bold text-[#e9f6df]">{text[index + 3]}</div>
        <img src={icons[product.id]} alt={text[index + 3]} className="mx-auto my-0.5 h-8 w-8 object-contain" />
        <div className="text-[9px] leading-tight text-[#a7b99b]">{text[2]}: {product.remaining}</div>
        <div className="my-1 flex items-center justify-center gap-1 text-[#e9f6df]">
          <button type="button" aria-label="−" disabled={busy || quantity <= 1} onClick={() => setQuantities(value => ({ ...value, [product.id]: quantity - 1 }))} className="h-6 w-6 rounded bg-[#24341b] disabled:opacity-30">−</button>
          <span className="min-w-4 text-[11px] font-black">{quantity}</span>
          <button type="button" aria-label="+" disabled={busy || quantity >= product.remaining} onClick={() => setQuantities(value => ({ ...value, [product.id]: quantity + 1 }))} className="h-6 w-6 rounded bg-[#24341b] disabled:opacity-30">+</button>
        </div>
        <div className="mb-1 flex items-center justify-center gap-1 text-[10px] text-[#d7ff94]"><img src={tentacles} alt="" className="h-3 w-3 object-contain" />{(quantity * product.price).toLocaleString()}</div>
        <button type="button" disabled={busy || quantity < 1 || Number(profile?.tentacles || 0) < quantity * product.price} onClick={() => buy(product)} className="w-full rounded bg-[#a4d52c] py-1 text-[10px] font-black text-[#172006] disabled:opacity-35">{text[1]}</button>
      </div>;
    })}</div>
    {message ? <p role="status" className="mt-2 text-center text-xs text-[#d7ff94]">{message}</p> : null}
  </section>;
}
