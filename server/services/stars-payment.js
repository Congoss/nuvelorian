import { serverConfig } from '../config.js';

function assertBotToken() {
  const token = String(serverConfig.telegramBotToken || '').trim();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required for Telegram Stars');
  }
  return token;
}

async function telegramBotRequest(method, payload) {
  const token = assertBotToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    const error = new Error(data?.description || `Telegram Bot API ${method} failed`);
    error.code = data?.error_code || 'TELEGRAM_BOT_API_FAILED';
    error.details = data;
    throw error;
  }
  return data.result;
}

export function createStarsPaymentService({ botRequest = telegramBotRequest } = {}) {
  async function createInvoiceLink({ order, item, title, description }) {
    return botRequest('createInvoiceLink', {
      title: title || item?.title || 'Purchase',
      description: description || item?.title || 'Digital item',
      payload: order.id,
      currency: 'XTR',
      prices: [
        {
          label: item?.title || item?.id || 'Purchase',
          amount: Number(order.stars_amount_locked || 0),
        },
      ],
    });
  }

  async function answerPreCheckoutQuery({ preCheckoutQueryId, ok, errorMessage }) {
    return botRequest('answerPreCheckoutQuery', {
      pre_checkout_query_id: preCheckoutQueryId,
      ok: Boolean(ok),
      error_message: errorMessage || undefined,
    });
  }

  return {
    createInvoiceLink,
    answerPreCheckoutQuery,
    telegramBotRequest,
  };
}

