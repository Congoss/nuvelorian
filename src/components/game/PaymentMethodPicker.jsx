import { useTranslation } from 'react-i18next';
import { paymentText } from '@/lib/paymentUiText';
import { isWebPlatform } from '@/lib/platform/config';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TonConnectUIContext, TonConnectUIProvider, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import nearIcon from '@/assets/ui/near-logo.svg';
import starsCurrencyIcon from '@/assets/ui/star1.png';
import tonIcon from '@/assets/optimized/paper.webp';
import GameTextureButton from './GameTextureButton';
import { confirmPaymentOrder, createPaymentOrder, getPaymentOrder, getPaymentRates } from '@/services/paymentsApi';
import { createTonCommentPayload, getTonChainId, getTonConnectProviderProps } from '@/lib/platform/ton';
import { getActiveNearAccount, getNearWalletConnector, openNearWalletModal, sendNearTransfer } from '@/lib/platform/nearWallet';
import { applyFriday13SaleToProduct } from '@/lib/friday13Event';

const FALLBACK_METHODS = [
  { id: 'ton', title: 'TON' },
  { id: 'near', title: 'NEAR' },
  { id: 'telegram_stars', title: 'Stars' },
];

function getMethodIcon(methodId) {
  if (methodId === 'ton') return tonIcon;
  if (methodId === 'near') return nearIcon;
  if (methodId === 'telegram_stars') return starsCurrencyIcon;
  return null;
}

function PaymentMethodButton({ method, active, onClick }) {
  const icon = getMethodIcon(method.id);
  const tone = active
    ? method.id === 'telegram_stars'
      ? 'yellow'
      : method.id === 'near'
        ? 'green'
        : 'blue'
    : 'gray';

  return (
    <GameTextureButton
      type="button"
      onClick={onClick}
      tone={tone}
      className="h-[38px]"
    >
      <span className={`relative z-[1] flex h-full items-center justify-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.08em] ${active ? 'text-[#142c0b]' : 'text-[#173207]'}`}>
        {icon ? <img src={icon} alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" /> : null}
        {method.title}
      </span>
    </GameTextureButton>
  );
}

export default function PaymentMethodPicker(props) {
  const existingTon=useContext(TonConnectUIContext);
  const offered=(props.paymentMethods||FALLBACK_METHODS).map(method=>method.id);
  const allowed=props.pack?.paymentMethods||offered;
  const needsTon=!isWebPlatform&&offered.includes('ton')&&allowed.includes('ton');
  if(!needsTon)return <PaymentPicker {...props} />;
  return existingTon?<TonPaymentPicker {...props}/>:<TonConnectUIProvider {...getTonConnectProviderProps()}><TonPaymentPicker {...props}/></TonConnectUIProvider>;
}

function TonPaymentPicker(props) {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();
  const tonWallet = useTonWallet();
  return <PaymentPicker {...props} tonConnectUI={tonConnectUI} tonAddress={tonAddress} tonWallet={tonWallet} />;
}

function PaymentPicker({
  pack,
  paymentMethods = FALLBACK_METHODS,
  initialMethodId = null,
  onClose,
  onSuccess,
  tonConnectUI = null,
  tonAddress = '',
  tonWallet = null,
  portalLayer = false,
}) {



  const { i18n } = useTranslation();
  const pt = text => paymentText(text,i18n.resolvedLanguage||i18n.language);
  const displayPack = applyFriday13SaleToProduct(pack);
  const [method, setMethod] = useState(initialMethodId || paymentMethods[0]?.id || 'ton');
  const [phase, setPhase] = useState('idle');
  const purchaseBusy = useRef(false);
  const verificationBusy = useRef(false);
  const verificationAttempts = useRef(0);
  const supportMessage = 'If funds were deducted but rewards are missing, contact support with your order number.';
  const [message, setMessage] = useState('');
  const [nearTxHash, setNearTxHash] = useState('');
  const [nearSender, setNearSender] = useState('');
  const [order, setOrder] = useState(null);
  const [nearUsd, setNearUsd] = useState(0);

  useEffect(() => {
    let active = true;
    let pending;
    try { pending = JSON.parse(window.sessionStorage.getItem('p4-near-pending') || 'null'); } catch { return undefined; }
    if (!pending?.orderId || pending.itemId !== pack?.id || !paymentMethods.some((entry) => entry.id === 'near')) return undefined;
    getPaymentOrder(pending.orderId).then((saved) => {
      if (!active || saved?.payment_method !== 'near' || saved?.status !== 'pending') return;
      setOrder(saved);
      setMethod('near');
      setNearSender(pending.senderAccountId || '');
      setNearTxHash(pending.txHash || '');
      setPhase(pending.txHash ? 'waiting_near' : 'idle');
      setMessage(pending.txHash ? 'Checking your wallet payment.' : 'Payment was not completed. You can try again. If funds were deducted, contact support.');
    }).catch(() => {});
    return () => { active = false; };
  }, [pack?.id, paymentMethods]);

  useEffect(() => {
    let alive = true;
    getPaymentRates().then((rates) => {
      const value = Number(rates?.nearUsd);
      if (alive && Number.isFinite(value) && value > 0) setNearUsd(value);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const allowed = Array.isArray(pack?.paymentMethods) && pack.paymentMethods.length ? pack.paymentMethods : paymentMethods.map((item) => item.id);
    const available = paymentMethods.map((item) => item.id).filter((id) => allowed.includes(id));
    setMethod((current) => {
      const preferred = initialMethodId || current;
      return available.includes(preferred) ? preferred : available[0] || '';
    });
  }, [initialMethodId, pack, paymentMethods]);

  const methods = useMemo(() => {
    const available = Array.isArray(pack?.paymentMethods) && pack.paymentMethods.length
      ? pack.paymentMethods
      : paymentMethods.map((item) => item.id);
    return paymentMethods.filter((item) => available.includes(item.id));
  }, [pack, paymentMethods]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    async function pollStarsOrder(orderId) {
      if (!orderId) return;
      timer = window.setInterval(async () => {
        try {
          const fresh = await getPaymentOrder(orderId);
          if (cancelled || !fresh) return;
          if (fresh.status === 'success') {
            window.clearInterval(timer);
            setPhase('success');
            setMessage('Payment confirmed');
            onSuccess?.(fresh);
          }
          if (fresh.status === 'failed' || fresh.status === 'expired') {
            window.clearInterval(timer);
            setPhase(fresh.status);
            setMessage(`Payment ${fresh.status}`);
          }
        } catch {
          // ignore transient polling errors
        }
      }, 2000);
    }

      if (phase === 'waiting_stars' && order?.id) {
        pollStarsOrder(order.id);
      }

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [order?.id, onSuccess, phase]);

  const beginPurchase = async () => {
    if (!pack?.id || !method || purchaseBusy.current) return;
    purchaseBusy.current = true;
    verificationAttempts.current = 0;
    setNearTxHash('');
    setNearSender('');
    setPhase('creating_order');
    setMessage('');

    let nearTransferSubmitted = false;
    try {
      if(method==='ton'){
        if(!tonConnectUI)throw new Error('TON wallet is not available');
        await tonConnectUI.connectionRestored;
        if(!tonConnectUI.connected){await tonConnectUI.openModal();setPhase('idle');return;}
      }
      const response = await createPaymentOrder({ itemId: pack.id, paymentMethod: method });
      const nextOrder = response?.order || response;
      setOrder(nextOrder);

      if (method === 'ton') {
        setPhase('waiting_ton');
        if (!tonConnectUI) throw new Error('TON wallet is not available');
        const request = nextOrder.payment_request?.ton || {};
        const result = await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 600,
          network: getTonChainId(),
          messages: [
            {
              address: request.receiver,
              amount: request.nanoAmount,
              payload: createTonCommentPayload(request.comment),
            },
          ],
        });
        const confirmed = await confirmPaymentOrder({
          orderId: nextOrder.id,
          paymentMethod: 'ton',
          // TonConnect returns a signed BOC here, not an on-chain transaction
          // hash. The server verifies the transfer against the receiver ledger.
          txHash: '',
          senderAddress: tonConnectUI.wallet?.account?.address || tonAddress || tonWallet?.account?.address || '',
          amount: request.amount,
          recipient: request.receiver,
          confirmed: true,
        });
        setPhase('success');
        setMessage('Payment confirmed');
        onSuccess?.(confirmed?.player || confirmed);
        return;
      }

      if (method === 'near') {
        setPhase('waiting_near');
        const request = nextOrder.payment_request?.near || {};
        const connector = await getNearWalletConnector();
        try { await connector.getConnectedWallet(); } catch { await openNearWalletModal(); }
        const connected = await connector.getConnectedWallet();
        let senderAccountId = connected.accounts[0]?.accountId || getActiveNearAccount();
        if (!senderAccountId) throw new Error('Connect a NEAR wallet first');
        window.sessionStorage.setItem('p4-near-pending', JSON.stringify({ orderId: nextOrder.id, senderAccountId, itemId: pack.id }));
        const outcome = await sendNearTransfer({
          receiverId: request.receiver,
          amount: request.yoctoAmount,
          signerId: senderAccountId,
        });
        senderAccountId = outcome?.transaction?.signer_id || getActiveNearAccount();
        const txHash = outcome?.transaction?.hash || outcome?.transaction_outcome?.id || '';
        nearTransferSubmitted = true;
        setNearSender(senderAccountId);
        if (txHash) {
          setNearTxHash(txHash);
          window.sessionStorage.setItem('p4-near-pending', JSON.stringify({ orderId: nextOrder.id, senderAccountId, itemId: pack.id, txHash }));
        }
        if (!txHash) {
          setNearSender(senderAccountId);
          setPhase('support');
          setMessage(supportMessage);
          return;
        }
        const confirmed = await confirmPaymentOrder({
          orderId: nextOrder.id,
          paymentMethod: 'near',
          txHash,
          senderAccountId,
          recipient: request.receiver,
          confirmed: true,
        });
        if (confirmed?.order?.status !== 'success') throw new Error('Payment confirmation pending');
        window.sessionStorage.removeItem('p4-near-pending');
        setPhase('success');
        setMessage('Payment confirmed');
        onSuccess?.(confirmed?.player || confirmed);
        return;
      }

      if (method === 'telegram_stars') {
        const invoiceLink = response?.invoiceLink || nextOrder.payment_payload?.invoiceLink;
        if (!invoiceLink) {
          throw new Error('Invoice link is missing');
        }
        setPhase('waiting_stars');
        setMessage('Open the invoice and complete payment.');
        const webApp = window.Telegram?.WebApp;
        if (webApp?.openInvoice) {
          webApp.openInvoice(invoiceLink, () => {});
        } else {
          window.open(invoiceLink, '_blank', 'noopener,noreferrer');
        }
        return;
      }
    } catch (error) {
      if (method === 'near' && !nearTransferSubmitted) window.sessionStorage.removeItem('p4-near-pending');
      setPhase(nearTransferSubmitted ? 'waiting_near' : 'idle');
      setMessage(nearTransferSubmitted ? 'Checking payment automatically…' : error?.message || 'Payment failed');
    } finally { purchaseBusy.current = false; }
  };

  const verifyNearPayment = async () => {
    if (!order?.id || !nearTxHash || !nearSender || verificationBusy.current) return;
    verificationBusy.current = true;
    setPhase('verifying_near');
    setMessage('');
    try {
      const result = await confirmPaymentOrder({
        orderId: order.id,
        paymentMethod: 'near',
        txHash: nearTxHash.trim(),
        senderAccountId: nearSender.trim(),
        amount: order.payment_request?.near?.yoctoAmount || order.nearAmountYocto,
        recipient: order.payment_request?.near?.receiver,
        confirmed: true,
      });
      if (result?.order?.status !== 'success') throw new Error('Payment confirmation pending');
      window.sessionStorage.removeItem('p4-near-pending');
      setPhase('success');
      setMessage('Payment confirmed');
      onSuccess?.(result?.player || result);
    } catch (error) {
      setPhase('waiting_near');
      verificationAttempts.current += 1;
      setPhase(verificationAttempts.current >= 3 ? 'support' : 'waiting_near');
      setMessage(verificationAttempts.current >= 3 ? supportMessage : 'Checking payment automatically…');
    } finally { verificationBusy.current = false; }
  };

  useEffect(() => {
    if (phase !== 'waiting_near' || !order?.id || !nearTxHash || !nearSender) return undefined;
    const timeout = window.setTimeout(() => { void verifyNearPayment(); }, 5000);
    return () => window.clearTimeout(timeout);
  }, [phase, order?.id, nearTxHash, nearSender]);

  if (!pack) return null;

  const lockedNearAmount = Number(order?.nearAmountLocked || order?.near_amount_locked || order?.payment_request?.near?.amount || 0);
  const nearPrice = lockedNearAmount > 0
    ? lockedNearAmount
    : displayPack.near ? Number(displayPack.near) : nearUsd > 0 ? Math.ceil((Number(displayPack.usd || 0) / nearUsd) * 1e6) / 1e6 : 0;
  const priceLabel = method === 'telegram_stars'
    ? <span className="inline-flex items-center gap-1">{displayPack.friday13SalePercent ? <del className="text-[#bd8f84]">{Number(pack.stars || Math.ceil(Number(pack.usd || 0) * 100)).toLocaleString()}</del> : null}<img src={starsCurrencyIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" /><b>{Number(displayPack.stars || Math.ceil(Number(displayPack.usd || 0) * 100)).toLocaleString()} Stars</b></span>
    : method === 'near'
      ? <span className="inline-flex items-center gap-1">{displayPack.friday13SalePercent && nearUsd>0 ? <del className="text-[#bd8f84]">{(Number(pack.usd||0)/nearUsd).toLocaleString('en-US',{maximumFractionDigits:2})}</del> : null}<img src={nearIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" /><b>{nearPrice > 0 ? nearPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'} NEAR</b></span>
      : `$${Number(displayPack.usd || 0).toFixed(2)} USD`;

  return (
    <div onClick={event=>{if(event.target===event.currentTarget)onClose();}} className={`fixed inset-0 ${portalLayer ? "z-[240]" : "z-[20]"} flex items-center justify-center bg-black/75 px-4 py-6`}>
      <div role="dialog" aria-modal="true" aria-label={pack.title} className="max-h-full w-full max-w-[360px] overflow-y-auto overscroll-contain border-2 border-[#28ee90] bg-[#10170d] p-4 shadow-[0_0_24px_rgba(40,238,144,.2)]">
        <div className="relative flex min-h-6 items-center justify-center">
          <p className="max-w-[290px] truncate text-center font-mono text-sm font-black uppercase text-[#eaffd1]">{pack.title}</p>
          <button type="button" onClick={onClose} aria-label={pt('Close')} className="absolute right-0 top-0 font-mono text-xl font-black leading-none text-[#d8ff86]">×</button>
        </div>
        <div className="flex flex-col items-center justify-center py-2">
          <img src={pack.icon || getMethodIcon(method)} alt="" aria-hidden="true" className="h-24 w-24 object-contain drop-shadow-[0_0_12px_rgba(216,255,134,.2)]" />
          <p className="mt-1 text-center font-mono text-xs font-black text-[#d8ff86]">{priceLabel}</p>
        </div>

        {methods.length > 1 && <div className="mb-3 grid grid-cols-3 gap-2">
          {methods.map((item) => (
            <PaymentMethodButton key={item.id} method={item} active={method === item.id} onClick={() => setMethod(item.id)} />
          ))}
        </div>}

        <div className="border border-[#33452a] bg-[#0b1009] px-3 py-2 text-center">
          <p className="font-mono text-[10px] text-[#d8ffb6]">
            {pt(phase === 'support' ? 'Contact support' : phase === 'success' ? 'Payment complete' : phase === 'waiting_near' ? 'NEAR transfer pending' : phase === 'waiting_ton' ? 'TON wallet signing' : phase === 'waiting_stars' ? 'STARS pending' : 'Ready to pay')}
          </p>
          {phase === 'support' && order?.id ? <p className="mt-1 font-mono text-[10px] text-[#a9c18d]">{pt('Order')}: {order.id}</p> : null}
          {message ? <p className="mt-1 font-mono text-[10px] text-[#a9c18d]">{pt(message)}</p> : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <GameTextureButton type="button" tone="yellow" onClick={onClose} className="h-[38px]">
            <span className="relative z-[1] flex h-full items-center justify-center font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#173207]">
              {pt('Close')}
            </span>
          </GameTextureButton>

            <GameTextureButton type="button" onClick={beginPurchase} disabled={!method || phase !== 'idle'} className="h-[38px] disabled:opacity-60">
              <span className="relative z-[1] flex h-full items-center justify-center font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#173207]">
                {pt(phase === 'support' ? 'Contact support' : ['waiting_near', 'verifying_near'].includes(phase) ? 'Checking…' : phase === 'creating_order' ? '...' : 'Pay')}
              </span>
            </GameTextureButton>
        </div>
      </div>
    </div>
  );
}
