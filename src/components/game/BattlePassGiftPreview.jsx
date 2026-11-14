import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import giftIcon from '@/assets/bp-gifts/gift-icon-v1.webp';
import giftBackground from '@/assets/bp-gifts/gift-modal-v1.webp';
import epicBackground from '@/assets/bp-gifts/gift-epic-v1.webp';
import legendaryBackground from '@/assets/bp-gifts/gift-legendary-v1.webp';
import PaymentMethodPicker from './PaymentMethodPicker';
import { getShopPaymentProduct, SHOP_PAYMENT_METHODS } from '@/lib/shopCatalog';
import { isWebPlatform } from '@/lib/platform/config';
import './battlePassGiftPreview.css';

const copy = {
  uk: { gift:'Подарувати BP', title:'Подарунок для', owned:'Уже відкрито', choose:'Вибери пропуск', close:'Закрити', epic:'Epic + Free нагороди', legendary:'Усі гілки нагород' },
  ru: { gift:'Подарить BP', title:'Подарок для', owned:'Уже открыт', choose:'Выбери пропуск', close:'Закрыть', epic:'Epic + Free награды', legendary:'Все ветки наград' },
  en: { gift:'Gift BP', title:'Gift for', owned:'Already unlocked', choose:'Choose a pass', close:'Close', epic:'Epic + Free rewards', legendary:'All reward tracks' },
};
export default function BattlePassGiftPreview({ player, language = 'uk' }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('legendary');
  const [payment, setPayment] = useState(null);
  const [paidTier, setPaidTier] = useState(null);
  const t = copy[language] || copy.uk;
  const tier = paidTier || player.battle_pass_tier || player.battle_pass_view?.tier || 'free';
  const productFor = option => getShopPaymentProduct('bp_gift:' + player.battle_pass_gift_season + ':' + option + ':' + player.id);
  const product = productFor(selected);
  const alreadyOwned = tier === 'legendary' || tier === selected;
  if (!product) return null;
  return <>
    <button type="button" onClick={() => setOpen(true)} className="bp-gift-launcher absolute right-3 z-30" style={{ bottom:'calc(var(--bottom-nav-space, 90px) + 22px)' }}>
      <img src={giftIcon} alt="" /><span className="font-mono text-[9px] font-black uppercase">{t.gift}</span>
    </button>
    {open && !payment && createPortal(
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
        <section role="dialog" aria-modal="true" aria-label={t.gift} className="bp-gift-modal" style={{backgroundImage: 'linear-gradient(180deg, transparent, #06151299), url('+giftBackground+')'}} onClick={event => event.stopPropagation()}>
          <button type="button" aria-label={t.close} onClick={() => setOpen(false)} className="absolute right-3 top-3"><X size={20}/></button>
          <h3 className="bp-gift-title">{t.title}<strong>{player.nickname || player.username}</strong></h3>
          <p className="my-3 text-xs text-[#a5bba8]">{t.choose}</p>
          {['epic','legendary'].map(option => {
            const owned = tier === 'legendary' || tier === option;
            const pack = productFor(option);
            return <button key={option} type="button" disabled={owned} aria-pressed={selected===option} onClick={()=>setSelected(option)}
              className={'bp-gift-card bp-gift-'+option+(owned?' is-owned':'')+(selected===option?' is-selected':'')}
              style={{backgroundImage:'linear-gradient(90deg, transparent, #06141a88), url('+(option==='epic'?epicBackground:legendaryBackground)+')'}}>
              <span className="flex justify-between font-bold"><span>{option.toUpperCase()}</span><span>{isWebPlatform ? pack.usd.toFixed(2)+' USD' : pack.stars+' ★'}</span></span>
              <span className="mt-2 block text-[11px] text-[#bbcfbc]">{owned?t.owned:t[option]}</span>
            </button>;
          })}
          <button type="button" disabled={alreadyOwned} className="mt-3 w-full rounded-lg bg-lime-300 p-2 font-black text-black disabled:opacity-40" onClick={()=>setPayment(product)}>{t.gift}</button>
        </section>
      </div>, document.body)}
    {payment && <PaymentMethodPicker pack={payment}
      paymentMethods={SHOP_PAYMENT_METHODS.filter(method => isWebPlatform ? method.id==='near' : payment.paymentMethods.includes(method.id))}
      initialMethodId={isWebPlatform?'near':'telegram_stars'} onClose={()=>setPayment(null)}
      onSuccess={()=>{setPaidTier(payment.tier);setPayment(null);setOpen(false);}}/>}
  </>;
}
