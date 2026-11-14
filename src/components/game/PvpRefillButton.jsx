import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import PaymentMethodPicker from './PaymentMethodPicker';
import { pvpRefillQuote, getPvpRefillProduct } from '@/lib/pvpRanks';

const methods = [{ id: 'telegram_stars', title: 'Stars', label: 'Stars' }];
export default function PvpRefillButton({ language, progress, profile, disabled, onSuccess }) {
  const [pack, setPack] = useState(null);
  const quote = progress?.refill || pvpRefillQuote(progress?.attempts ?? 5);
  const label = language === 'ru' ? `Пополнить ${quote.attempts} боёв · ${quote.stars} Stars` : language === 'en' ? `Refill ${quote.attempts} fights · ${quote.stars} Stars` : `Поповнити ${quote.attempts} боїв · ${quote.stars} Stars`;
  return <>
    <button type="button" className="pvp-refill-button" disabled={disabled || !quote.attempts || !profile?.telegram_id} title={label} aria-label={label} onClick={()=>setPack(getPvpRefillProduct('pvp_refill_'+quote.attempts))}><RotateCcw size={16}/><small>{quote.stars}★</small></button>
    {pack && <PaymentMethodPicker pack={pack} paymentMethods={methods} initialMethodId="telegram_stars" portalLayer onClose={()=>setPack(null)} onSuccess={result=>{setPack(null);onSuccess?.(result);}}/>}
  </>;
}
