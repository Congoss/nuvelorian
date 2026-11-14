import { createPortal } from 'react-dom';
import { getPaymentRates } from '@/services/paymentsApi';
import { isWebPlatform } from '@/lib/platform/config';
import PaymentMethodPicker from './PaymentMethodPicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CircleHelp, Clock3, Star, X } from 'lucide-react';
import GameTextureButton from './GameTextureButton';
import NewbieSoulPet from './NewbieSoulPet';
import newbieSoulIcon from '@/assets/hero/pet-newbie-soul-ico.png';
import newbiePack2PopupArt from '@/assets/hero/newbie pack/set-newbiepack-hands-popup.png';
import { DEFAULT_EQUIPMENT_ITEMS } from './equipmentData';
import { createPaymentOrder, getNewbiePackOffers, getPaymentOrder } from '@/services/gameApi';
import smallPoison from '@/assets/skills/small-poison.png';
import mediumPoison from '@/assets/skills/medium-poison.png';
import largePoison from '@/assets/skills/large-poison.png';
import { getResourceIcon } from '@/lib/resourceIcons';

const PACKS = {
  1: { id: 'newbie_pack_i', title: 'NEWBIE PACK I', stars: 499, usd: 4.99, paymentMethods: ['near', 'telegram_stars'], pet: true, rewards: [['premium', 150, 'T-PAPE'], ['tentacles', 10000, 'Tentacles'], ['energy', 500, 'Energy'], ['small', 20, 'Small poison'], ['medium', 7, 'Medium poison'], ['large', 2, 'Big poison'], ['spin', 5, 'Spins'], ['pet', 1, 'Mr.Newbie']] },
  2: { id: 'newbie_pack_ii', title: 'NEWBIE PACK II', stars: 999, usd: 9.99, paymentMethods: ['near', 'telegram_stars'], hero: true, rewards: [['premium', 350, 'T-PAPE'], ['tentacles', 25000, 'Tentacles'], ['energy', 1000, 'Energy'], ['small', 40, 'Small poison'], ['medium', 15, 'Medium poison'], ['large', 5, 'Big poison'], ['spin', 10, 'Spins']] },
};
const poisonIcons = { small: smallPoison, medium: mediumPoison, large: largePoison };
const PACK_II_GEAR_IDS = ['newbie_pack_ii_boots', 'newbie_pack_ii_legs', 'newbie_pack_ii_hands', 'newbie_pack_ii_armor', 'newbie_pack_ii_head', 'newbie_pack_ii_weapon'];
const packTwoGear = PACK_II_GEAR_IDS.map((id) => DEFAULT_EQUIPMENT_ITEMS.find((item) => item.id === id)).filter(Boolean);

function timeLeft(expiresAt, now) {
  const left = Math.max(0, new Date(expiresAt || 0).getTime() - now);
  const hours = String(Math.floor(left / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor(left / 60000) % 60).padStart(2, '0');
  const seconds = String(Math.floor(left / 1000) % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function Reward({ item }) {
  const [kind, amount, label] = item;
  const icon = poisonIcons[kind] || (kind === 'pet' ? newbieSoulIcon : getResourceIcon(kind));
  return <div style={{ backgroundColor: 'transparent', backgroundImage: 'none', border: 'none' }} className="newbie-pack-reward flex min-w-0 flex-col items-center gap-1 rounded-[10px] !bg-transparent px-1 py-1.5" title={label}>
    <div style={{ backgroundColor: 'transparent', backgroundImage: 'none', border: 'none' }} className="flex h-[clamp(52px,16vw,64px)] w-full items-center justify-center !bg-transparent">
      <img src={icon} alt="" className="h-[clamp(48px,15vw,60px)] w-[clamp(48px,15vw,60px)] object-contain" />
    </div>
    <p className="w-full truncate text-center font-mono text-[9px] uppercase tracking-[0.06em] text-[#eef7d9]">{label}</p>
    <p className="font-mono text-[15px] font-black leading-none text-[#dfff82]">×{amount}</p>
  </div>;
}

export default function NewbiePackModal({ profile, onClose, onRefreshProfile }) {
  const [offers, setOffers] = useState([]);
  const [nearUsd, setNearUsd] = useState(0);
  useEffect(() => { let active = true; getPaymentRates().then(rates => { if (active) setNearUsd(Number(rates?.nearUsd) || 0); }).catch(() => {}); return () => { active = false; }; }, []);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [nearPack, setNearPack] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successPack, setSuccessPack] = useState(null);
  const [petInfoOpen, setPetInfoOpen] = useState(false);
  const pollTimer = useRef(null);
  const active = useMemo(() => offers.find((offer) => offer.status === 'available') || null, [offers]);
  const displayPack = successPack ? { pack: successPack, status: 'purchased', expiresAt: active?.expiresAt } : active;
  const pack = displayPack ? PACKS[displayPack.pack] : null;
  const load = async () => {
    const data = await getNewbiePackOffers();
    setOffers(Array.isArray(data?.offers) ? data.offers : []);
  };
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => () => { if (pollTimer.current) window.clearInterval(pollTimer.current); }, []);
  useEffect(() => {
    if (!active?.expiresAt || new Date(active.expiresAt).getTime() > now) return;
    void load();
  }, [active?.expiresAt, now]);
  const buy = async () => {
    if (!pack || busy) return;
    if (isWebPlatform) { setNearPack(pack); return; }
    setBusy(true); setError('');
    try {
      const response = await createPaymentOrder({ itemId: pack.id, paymentMethod: 'telegram_stars' });
      const order = response?.order || response;
      const link = response?.invoiceLink || order?.payment_payload?.invoiceLink;
      if (!order?.id || !link) throw new Error('Telegram Stars invoice is unavailable');
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openInvoice) webApp.openInvoice(link, () => {});
      else window.open(link, '_blank', 'noopener,noreferrer');
      const waitForPayment = window.setInterval(async () => {
        try {
          const current = await getPaymentOrder(order.id);
          if (current?.status !== 'success') return;
          window.clearInterval(waitForPayment);
          pollTimer.current = null;
          setSuccessPack(active?.pack || null);
          setSuccess(true);
          await onRefreshProfile?.();
          await load();
          window.setTimeout(() => { setSuccess(false); setSuccessPack(null); }, 1200);
        } catch { /* webhook may still be processing */ }
      }, 2000);
      pollTimer.current = waitForPayment;
    } catch (err) { setError(err.message || 'Unable to create payment'); }
    finally { setBusy(false); }
  };
  return createPortal(<div onClick={event=>{if(event.target===event.currentTarget&&!busy)onClose();}} role="dialog" aria-modal="true" aria-label="Newbie Pack" className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center bg-black/80 px-3" style={{ height: 'var(--app-viewport-height, 100dvh)', paddingTop: 'calc(var(--app-top-offset, var(--app-safe-top, 0px)) + 12px)', paddingBottom: 'calc(var(--app-safe-bottom, 0px) + 12px)' }}>
    <section className="relative flex min-h-0 max-h-full w-full max-w-[420px] flex-col overflow-hidden rounded-[20px_15px_22px_17px] border-2 border-[#4ff58e] bg-[radial-gradient(ellipse_at_50%_12%,#284b25,#101b12_49%,#070b08)] shadow-[0_0_25px_rgba(63,255,133,.28)]">
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 p-1 text-[#dfffb8]"><X size={18} /></button>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-3 pt-9">
      {!pack ? <div className="py-16 text-center"><h2 className="text-lg font-black text-[#edffe4]">{offers.length ? 'NO ACTIVE NEWBIE PACKS' : 'LOADING...'}</h2><p className="mt-2 text-[11px] text-[#a0b99b]">{offers.some((offer) => offer.status === 'expired') ? 'Offer expired' : 'Pack I unlocks at level 10'}</p></div> : <>
        {!success ? <div className="relative z-[3] mx-9 mt-1 flex shrink-0 items-center justify-center gap-2 py-1.5 font-mono text-xl font-black tabular-nums text-[#ecff9e]"><Clock3 size={17} />{timeLeft(active.expiresAt, now)}</div> : null}
        <div className="mx-auto mt-2 flex min-h-[188px] w-full shrink-0 items-center justify-center">
          {pack.pet ? <div className="relative isolate flex h-[188px] w-[190px] shrink-0 items-center justify-center">
            <span aria-hidden="true" className="newbie-pack-pet-rays pointer-events-none absolute inset-[-28%]" />
            <NewbieSoulPet animated={false} className="z-[1] h-[188px] w-auto" />
            <button type="button" onClick={() => setPetInfoOpen((open) => !open)} aria-label="Mr.Newbie buffs" aria-expanded={petInfoOpen} className="absolute right-0 top-0 z-20 grid h-7 w-7 place-items-center rounded-full border-0 bg-transparent text-[#dfff82] shadow-none active:scale-95">
              <CircleHelp size={18} />
            </button>
            {petInfoOpen ? <div role="tooltip" className="absolute right-0 top-8 z-30 w-[210px] rounded-lg border border-[#9ccc55] bg-[#071009]/95 p-2.5 font-mono text-[10px] font-bold leading-relaxed text-[#efffdc] shadow-[0_8px_24px_rgba(0,0,0,.8)]">
              <p className="mb-1.5 text-[11px] text-[#dfff82]">Mr.Newbie · BUFFS</p>
              <p>Small poison damage <span className="float-right text-[#dfff82]">+20</span></p>
              <p>Medium poison damage <span className="float-right text-[#dfff82]">+35</span></p>
              <p>Poison flask damage <span className="float-right text-[#dfff82]">+50</span></p>
              <p>Critical chance <span className="float-right text-[#dfff82]">+1%</span></p>
              <p className="mt-1.5 text-[9px] font-normal text-[#a9bb91]">Tap ? again to close</p>
            </div> : null}
          </div> : pack.hero ? <div className="relative isolate flex h-[188px] w-[190px] shrink-0 items-center justify-center">
            <span aria-hidden="true" className="newbie-pack-pet-rays pointer-events-none absolute inset-[-28%]" />
            <img src={newbiePack2PopupArt} alt="Newbie Pack II gear set" className="relative z-[1] h-[188px] w-[105px] object-contain" />
          </div> : null}
        </div>
        <h2 className="mt-2 text-center text-xl font-black tracking-wide text-[#efffe1]">{pack.title}</h2>
        {pack.hero ? <><p className="text-center text-[10px] font-black tracking-wider text-[#e3c76d]">FULL STARTER EQUIPMENT</p><div className="grid grid-cols-6 gap-1 px-2">{packTwoGear.map((item) => <span key={item.id} title={item.names?.en || item.name} className="grid aspect-square place-items-center rounded border border-[#b29350]"><img src={item.icon} alt={item.names?.en || item.name} className="h-full w-full object-contain p-1" /></span>)}</div></> : null}
        <div className="mt-2 grid grid-cols-4 gap-1.5">{pack.rewards.map((item) => <Reward key={item[0]} item={item} />)}</div>
        {success ? <p className="mt-3 flex items-center justify-center gap-1 text-sm font-black text-[#c9ff7d]"><Check size={18} /> PACK RECEIVED</p> : null}
        {error ? <p className="mt-2 text-center text-xs font-bold text-[#ffaaa0]">{error}</p> : null}
        {!success ? <GameTextureButton type="button" tone="yellow" disabled={busy} onClick={buy} className="mt-3 min-h-12 w-full"><span className="relative z-10 flex h-full items-center justify-center gap-1 font-mono text-sm font-black text-[#182006]">{busy ? 'OPENING...' : isWebPlatform ? ('BUY NOW · ' + (nearUsd > 0 ? (pack.usd / nearUsd).toFixed(2) + ' NEAR' : pack.usd.toFixed(2) + ' USD')) : <><Star size={16} fill="currentColor" /> BUY NOW · {pack.stars}</>}</span></GameTextureButton> : null}
      </>}
      </div>
    </section>
    {nearPack && <PaymentMethodPicker pack={nearPack} paymentMethods={[{ id: 'near', title: 'NEAR' }]} initialMethodId="near" onClose={() => setNearPack(null)} onSuccess={async () => { setNearPack(null); setSuccessPack(active?.pack || null); setSuccess(true); await onRefreshProfile?.(); await load(); window.setTimeout(() => { setSuccess(false); setSuccessPack(null); }, 1200); }} />}
  </div>, document.body);
}
