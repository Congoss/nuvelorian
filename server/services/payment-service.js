import crypto from 'node:crypto';
import { getShopPaymentProduct } from '../../src/lib/shopCatalog.js';

const TON_DECIMALS = 9;
const NEAR_DECIMALS = 24;
const DEFAULT_STARS_PER_USD = 100;
const DEFAULT_TON_RECEIVER = 'UQC1sfDPsVTpEVTjlV4Ef0kvfY2qbz27ODYOA1YotRsPeODP';
const DEFAULT_NEAR_RECEIVER = 'congos.tg';

function toTrimmedString(value, fallback = '') {
  const text = String(value ?? fallback).trim();
  return text;
}

function decimalToFraction(value) {
  const text = toTrimmedString(value, '0');
  if (!text || text === '.') return { numerator: 0n, denominator: 1n };
  const negative = text.startsWith('-');
  const raw = negative ? text.slice(1) : text;
  const [whole, fraction = ''] = raw.split('.');
  const digits = `${whole || '0'}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(digits);
  return {
    numerator: negative ? -numerator : numerator,
    denominator: denominator === 0n ? 1n : denominator,
  };
}

function multiplyDecimalByIntegerCeil(value, multiplier) {
  const { numerator, denominator } = decimalToFraction(value);
  const scaled = numerator * BigInt(multiplier);
  if (scaled <= 0n) return 0n;
  return (scaled + denominator - 1n) / denominator;
}

function divideDecimalToFixed(value, divisor, decimals) {
  const { numerator, denominator } = decimalToFraction(value);
  const { numerator: dNum, denominator: dDen } = decimalToFraction(divisor);
  if (dNum === 0n) return '0';
  const scale = 10n ** BigInt(decimals);
  const scaledNumerator = numerator * scale * dDen;
  const scaledDenominator = denominator * dNum;
  if (scaledDenominator === 0n) return '0';
  const negative = (scaledNumerator < 0n) !== (scaledDenominator < 0n);
  const absNum = scaledNumerator < 0n ? -scaledNumerator : scaledNumerator;
  const absDen = scaledDenominator < 0n ? -scaledDenominator : scaledDenominator;
  const quotient = (absNum + absDen - 1n) / absDen;
  const whole = quotient / scale;
  const fraction = String(quotient % scale).padStart(decimals, '0');
  const output = `${whole.toString()}.${fraction}`;
  return negative ? `-${output}` : output;
}

function normalizeAmountString(value, decimals) {
  const text = toTrimmedString(value, '0');
  if (!text) return '0';
  const [whole, fraction = ''] = text.split('.');
  return `${whole || '0'}.${fraction.padEnd(decimals, '0').slice(0, decimals)}`;
}

function generateId(prefix = 'pay') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function getCatalogItem(catalog = {}, itemId = '') {
  const sharedProduct = getShopPaymentProduct(itemId, catalog);
  if (sharedProduct) return sharedProduct;
  const packs = [
    ...(Array.isArray(catalog.gemPacks) ? catalog.gemPacks : []),
    ...(Array.isArray(catalog.battlePassPacks) ? catalog.battlePassPacks : []),
    ...(Array.isArray(catalog.newbiePacks) ? catalog.newbiePacks : []),
  ];
  return packs.find((item) => String(item?.id || '') === String(itemId || '')) || null;
}

function buildRateSnapshot(rates = {}) {
  return {
    tonUsd: toTrimmedString(rates.tonUsd || '0'),
    nearUsd: toTrimmedString(rates.nearUsd || '0'),
    starsPerUsd: Number(rates.starsPerUsd || DEFAULT_STARS_PER_USD),
    fetchedAt: toTrimmedString(rates.fetchedAt || new Date().toISOString()),
    source: toTrimmedString(rates.source || 'cache'),
  };
}

function buildLockedAmounts({ usdPrice, rates = {}, starsAmount = null }) {
  const snapshot = buildRateSnapshot(rates);
  const tonAmountLocked = divideDecimalToFixed(usdPrice, snapshot.tonUsd, TON_DECIMALS);
  const nearAmountLocked = divideDecimalToFixed(usdPrice, snapshot.nearUsd, NEAR_DECIMALS);
  const tonAmountNano = multiplyDecimalByIntegerCeil(tonAmountLocked, 10n ** BigInt(TON_DECIMALS));
  const nearAmountYocto = multiplyDecimalByIntegerCeil(nearAmountLocked, 10n ** BigInt(NEAR_DECIMALS));
  const fixedStars = Number(starsAmount);
  const starsAmountLocked = Number.isFinite(fixedStars) && fixedStars > 0
    ? Math.ceil(fixedStars)
    : Math.max(1, Number(multiplyDecimalByIntegerCeil(usdPrice, snapshot.starsPerUsd)));

  return {
    usdPrice: Number(usdPrice).toFixed(2),
    tonAmountLocked,
    nearAmountLocked,
    starsAmountLocked,
    tonAmountNano: tonAmountNano.toString(),
    nearAmountYocto: nearAmountYocto.toString(),
    exchangeRateSnapshot: snapshot,
  };
}

function sameText(a, b) {
  return toTrimmedString(a) === toTrimmedString(b);
}

async function maybeCreateEvent(db, event) {
  if (db?.appendEvent) {
    await db.appendEvent(event);
  }
}

export function createPaymentService({
  now = () => new Date(),
  fetchRates = async () => buildRateSnapshot(),
  catalog = {},
  db = {},
  grantReward = async () => {},
  tonReceiver = DEFAULT_TON_RECEIVER,
  nearReceiver = DEFAULT_NEAR_RECEIVER,
} = {}) {
  const successLocks = new Map();

  async function withPaymentLock(id, work) {
    const previous = successLocks.get(id) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    successLocks.set(id, current);
    await previous;
    try { return await work(); } finally {
      release();
      if (successLocks.get(id) === current) successLocks.delete(id);
    }
  }
  async function getRates() {
    const value = await fetchRates();
    return buildRateSnapshot(value);
  }

  async function purchase({ itemId, userId, paymentMethod }) {
    const item = getCatalogItem(catalog, itemId);
    if (!item) {
      const error = new Error('Shop item not found');
      error.code = 'SHOP_ITEM_NOT_FOUND';
      throw error;
    }

    const method = toTrimmedString(paymentMethod).toLowerCase();
    const allowedMethods = Array.isArray(item.paymentMethods) && item.paymentMethods.length ? item.paymentMethods : ['ton', 'near', 'telegram_stars'];
    if (!allowedMethods.includes(method)) {
      const error = new Error('Payment method not supported for this item');
      error.code = 'PAYMENT_METHOD_NOT_SUPPORTED';
      throw error;
    }

    const fixedStars = method === 'telegram_stars' && Number.isFinite(Number(item.stars)) && Number(item.stars) > 0;
    const rates = fixedStars ? { source: 'catalog' } : await getRates();
    const locked = buildLockedAmounts({ usdPrice: item.usd, rates, starsAmount: item.stars });
    if (method === 'near') {
      if (BigInt(locked.nearAmountYocto) <= 0n) throw Object.assign(new Error('NEAR exchange rate unavailable'), { code: 'PAYMENT_RATE_UNAVAILABLE' });
      // A tiny order-specific fraction binds a native transfer to its order.
      const nonce = BigInt('0x' + crypto.randomBytes(6).toString('hex')) + 1n;
      const amount = BigInt(locked.nearAmountYocto) + nonce;
      const scale = 10n ** 24n;
      locked.nearAmountYocto = amount.toString();
      locked.nearAmountLocked = `${amount / scale}.${String(amount % scale).padStart(24, '0')}`;
    }
    const createdAt = now().toISOString?.() || new Date(now()).toISOString();
    const transaction = {
      id: generateId('order'),
      user_id: String(userId || '').trim(),
      item_id: String(item.id || '').trim(),
      payment_method: method,
      usd_price: locked.usdPrice,
      ton_amount_locked: locked.tonAmountLocked,
      near_amount_locked: locked.nearAmountLocked,
      stars_amount_locked: locked.starsAmountLocked,
      tonAmountLocked: locked.tonAmountLocked,
      nearAmountLocked: locked.nearAmountLocked,
      starsAmountLocked: locked.starsAmountLocked,
      tonAmountNano: locked.tonAmountNano,
      nearAmountYocto: locked.nearAmountYocto,
      exchangeRateSnapshot: locked.exchangeRateSnapshot,
      exchange_rate_snapshot: { ...locked.exchangeRateSnapshot, achievementDonationV1: true },
      amount_paid: null,
      status: 'pending',
      tx_hash: null,
      created_at: createdAt,
      completed_at: null,
    };
    transaction.payment_payload = {};

    if (!db.createTransaction) {
      const error = new Error('Payment DB not configured');
      error.code = 'PAYMENT_DB_NOT_CONFIGURED';
      throw error;
    }

    await db.createTransaction(transaction);
    await maybeCreateEvent(db, {
      type: 'payment.order_created',
      transaction_id: transaction.id,
      payment_method: method,
      item_id: transaction.item_id,
      user_id: transaction.user_id,
      created_at: createdAt,
    });

    return {
      ...transaction,
      ton_receiver: tonReceiver,
      near_receiver: nearReceiver,
      tonAmountLocked: transaction.tonAmountLocked,
      nearAmountLocked: transaction.nearAmountLocked,
      starsAmountLocked: transaction.starsAmountLocked,
      tonAmountNano: transaction.tonAmountNano,
      nearAmountYocto: transaction.nearAmountYocto,
      exchangeRateSnapshot: transaction.exchangeRateSnapshot,
      payment_request: buildPaymentRequest(transaction, item, { tonReceiver, nearReceiver }),
    };
  }

  function buildPaymentRequest(transaction, item, { tonReceiver, nearReceiver }) {
    return {
      ton: {
        receiver: tonReceiver,
        amount: transaction.ton_amount_locked,
        nanoAmount: transaction.tonAmountNano,
        comment: `order:${transaction.id}:${item.id}`,
      },
      near: {
        receiver: nearReceiver,
        amount: transaction.near_amount_locked,
        yoctoAmount: transaction.nearAmountYocto,
        memo: `order:${transaction.id}:${item.id}`,
        url: `https://wallet.near.org/send-money/${nearReceiver}?amount=${transaction.near_amount_locked}`,
      },
      stars: {
        currency: 'XTR',
        amount: transaction.stars_amount_locked,
        payload: transaction.id,
      },
    };
  }

  async function markSuccess(transaction, { txHash, amountPaid }) {
    return withPaymentLock(transaction.id, async () => markSuccessLocked(transaction, { txHash, amountPaid }));
  }

  async function markSuccessLocked(transaction, { txHash, amountPaid }) {
    const latest = await db.findTransactionById(transaction.id);
    if (latest?.status === 'success') return latest;
    transaction = latest || transaction;
    if (transaction.status === 'success') {
      return transaction;
    }
    const completedAt = now().toISOString?.() || new Date(now()).toISOString();
    const next = {
      ...transaction,
      tx_hash: txHash || transaction.tx_hash || null,
      amount_paid: amountPaid ?? transaction.amount_paid,
      status: 'success',
      completed_at: completedAt,
    };
    const claimed = typeof db.claimPendingTransaction === 'function'
      ? await db.claimPendingTransaction(transaction.id, { tx_hash: next.tx_hash, amount_paid: next.amount_paid, completed_at: completedAt })
      : await db.updateTransaction(transaction.id, next);
    if (!claimed && typeof db.claimPendingTransaction === 'function') {
      const current = await db.findTransactionById(transaction.id);
      if (current?.status === 'success') return current;
      throw Object.assign(new Error('Payment order was already processed'), { code: 'PAYMENT_ALREADY_PROCESSING' });
    }
    await maybeCreateEvent(db, {
      type: 'payment.success',
      transaction_id: transaction.id,
      tx_hash: next.tx_hash,
      amount_paid: next.amount_paid,
      completed_at: completedAt,
    });
    await grantReward({ userId: transaction.user_id, itemId: transaction.item_id, paymentMethod: transaction.payment_method, transaction: next });
    return claimed || next;
  }

  async function failTransaction(transaction, reason, extra = {}) {
    const next = {
      ...transaction,
      status: transaction.status === 'success' ? transaction.status : 'failed',
      ...extra,
    };
    await db.updateTransaction(transaction.id, next);
    await maybeCreateEvent(db, {
      type: 'payment.failed',
      transaction_id: transaction.id,
      reason,
      ...extra,
    });
    return next;
  }

  async function confirmTonPayment({ orderId, txHash, amount, recipient, confirmed = true }) {
    const transaction = await db.findTransactionById(orderId);
    if (!transaction) {
      const error = new Error('Payment order not found');
      error.code = 'PAYMENT_ORDER_NOT_FOUND';
      throw error;
    }

    if (transaction.status === 'success') {
      return transaction;
    }

    if (!confirmed) {
      return failTransaction(transaction, 'ton_not_confirmed');
    }

    if (!sameText(recipient, tonReceiver)) {
      return failTransaction(transaction, 'ton_recipient_mismatch');
    }

    if (!sameText(amount, transaction.ton_amount_locked)) {
      return failTransaction(transaction, 'ton_amount_mismatch', { amount_paid: amount || null, tx_hash: txHash || null });
    }

    const usedTx = txHash ? await db.findTransactionByHash(txHash) : null;
    if (usedTx && usedTx.id !== transaction.id && usedTx.status === 'success') {
      const error = new Error('Transaction hash already used');
      error.code = 'TX_HASH_ALREADY_USED';
      throw error;
    }

    return markSuccess(transaction, { txHash, amountPaid: amount || transaction.ton_amount_locked });
  }

  async function confirmNearPayment({ orderId, txHash, amount, recipient, senderAccountId, confirmed = true }) {
    const transaction = await db.findTransactionById(orderId);
    if (!transaction) {
      const error = new Error('Payment order not found');
      error.code = 'PAYMENT_ORDER_NOT_FOUND';
      throw error;
    }

    if (transaction.status === 'success') {
      return transaction;
    }

    if (!confirmed) {
      return failTransaction(transaction, 'near_not_confirmed');
    }

    if (!sameText(recipient, nearReceiver)) {
      return failTransaction(transaction, 'near_recipient_mismatch');
    }

    if (!sameText(amount, transaction.near_amount_locked)) {
      return failTransaction(transaction, 'near_amount_mismatch', { amount_paid: amount || null, tx_hash: txHash || null });
    }

    if (!sameText(senderAccountId, transaction.near_sender_account_id || senderAccountId)) {
      // allow the sender field to be recorded without blocking old orders
    }

    const usedTx = txHash ? await db.findTransactionByHash(txHash) : null;
    if (usedTx && usedTx.id !== transaction.id && usedTx.status === 'success') {
      const error = new Error('Transaction hash already used');
      error.code = 'TX_HASH_ALREADY_USED';
      throw error;
    }

    return markSuccess(transaction, { txHash, amountPaid: amount || transaction.near_amount_locked });
  }

  async function confirmStarsPayment({ orderId, telegramPaymentChargeId, amount, currency = 'XTR', confirmed = true }) {
    const transaction = await db.findTransactionById(orderId);
    if (!transaction) {
      const error = new Error('Payment order not found');
      error.code = 'PAYMENT_ORDER_NOT_FOUND';
      throw error;
    }

    if (transaction.status === 'success') {
      if (/^pvp_refill_[1-5]$/.test(transaction.item_id) && transaction.payment_method === 'telegram_stars') {
        await grantReward({ userId: transaction.user_id, itemId: transaction.item_id, paymentMethod: transaction.payment_method, transaction });
      }
      return transaction;
    }

    if (!confirmed) {
      return failTransaction(transaction, 'stars_not_confirmed');
    }

    if (!sameText(currency, 'XTR')) {
      return failTransaction(transaction, 'stars_currency_mismatch');
    }

    if (Number(amount || 0) !== Number(transaction.stars_amount_locked || 0)) {
      return failTransaction(transaction, 'stars_amount_mismatch', { amount_paid: amount || null, tx_hash: telegramPaymentChargeId || null });
    }

    const usedTx = telegramPaymentChargeId ? await db.findTransactionByHash(telegramPaymentChargeId) : null;
    if (usedTx && usedTx.id !== transaction.id && usedTx.status === 'success') {
      const error = new Error('Transaction hash already used');
      error.code = 'TX_HASH_ALREADY_USED';
      throw error;
    }

    return markSuccess(transaction, {
      txHash: telegramPaymentChargeId,
      amountPaid: amount || transaction.stars_amount_locked,
    });
  }

  return {
    buildLockedAmounts,
    getRates,
    purchase,
    confirmTonPayment,
    confirmNearPayment,
    confirmStarsPayment,
  };
}
