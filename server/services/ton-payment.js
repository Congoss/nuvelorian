function toTrimmed(value) {
  if (value && typeof value === 'object') {
    return toTrimmed(value.address || value.account_address || value.account || value.value || value.text || '');
  }
  return String(value ?? '').trim();
}

function asTransactionList(payload) {
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  return [];
}

function extractTonTransactionCandidate(entry = {}) {
  const hash =
    entry.hash ||
    entry.transaction_id?.hash ||
    entry.transaction_id ||
    entry.tx_hash ||
    entry.transactionHash ||
    '';
  const inMsg = entry.in_msg || entry.inMsg || entry.message || {};
  const source = inMsg.source || inMsg.src || inMsg.sender || inMsg.from || entry.source || '';
  const destination = inMsg.destination || inMsg.dest || inMsg.to || entry.destination || '';
  const value = inMsg.value ?? inMsg.amount ?? entry.value ?? entry.amount ?? '';
  const comment =
    inMsg.comment ||
    inMsg.message ||
    inMsg.text ||
    inMsg.msg_data?.text ||
    inMsg.message_content?.decoded?.comment ||
    inMsg.message_content?.decoded?.text ||
    inMsg.decoded?.comment ||
    entry.comment ||
    entry.body ||
    '';

  return { hash: toTrimmed(hash), source: toTrimmed(source), destination: toTrimmed(destination), value: toTrimmed(value), comment: toTrimmed(comment), raw: entry };
}

export function createTonPaymentService({ fetchImpl = fetch, apiBaseUrl = 'https://tonapi.io' } = {}) {
  async function getRecentReceiverTransactions(receiver, limit = 20) {
    const url = `${String(apiBaseUrl || '').replace(/\/+$/, '')}/v2/blockchain/accounts/${encodeURIComponent(receiver)}/transactions?limit=${limit}`;
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error || `TON verification failed with status ${response.status}`);
      error.code = 'TON_API_FAILED';
      error.details = payload;
      throw error;
    }
    return asTransactionList(payload).map(extractTonTransactionCandidate);
  }

  async function verifyTonTransaction({ order, receiver, expectedNanoAmount, orderComment, txHash = '', senderAddress = '', limit = 20 }) {
    const transactions = await getRecentReceiverTransactions(receiver, limit);
    const expectedAmount = toTrimmed(expectedNanoAmount);
    const expectedComment = toTrimmed(orderComment);
    const expectedHash = toTrimmed(txHash);
    const expectedSender = toTrimmed(senderAddress);

    const match = transactions.find((candidate) => {
      if (expectedHash && candidate.hash !== expectedHash) return false;
      // The account endpoint is already scoped to the receiver.  Require the
      // unique order comment and exact nanoTON value; do not accept incomplete
      // provider records as proof of payment.
      if (!expectedAmount || candidate.value !== expectedAmount) return false;
      if (!expectedComment || !candidate.comment.includes(expectedComment)) return false;
      if (expectedSender && candidate.source && candidate.source !== expectedSender) return false;
      return true;
    }) || null;

    return {
      confirmed: Boolean(match),
      txHash: match?.hash || expectedHash || '',
      senderAddress: match?.source || expectedSender || '',
      recipient: receiver,
      amount: expectedAmount,
      raw: match?.raw || null,
      order,
    };
  }

  return {
    getRecentReceiverTransactions,
    verifyTonTransaction,
  };
}
