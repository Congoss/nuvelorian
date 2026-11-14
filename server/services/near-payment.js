function toTrimmed(value) {
  return String(value ?? '').trim();
}

function getRpcUrl(network = 'mainnet') {
  return network === 'testnet'
    ? 'https://rpc.testnet.near.org'
    : 'https://rpc.mainnet.near.org';
}

function extractTransferAmount(action = {}) {
  const transfer = action?.Transfer || action?.transfer || action?.transfer_action || action?.data?.Transfer;
  if (!transfer) return '';
  return toTrimmed(transfer.deposit || transfer.amount || transfer.value || '');
}

function getIndexerUrl(network = 'mainnet') {
  return network === 'testnet' ? 'https://api-testnet.nearblocks.io' : 'https://api.nearblocks.io';
}

export function createNearPaymentService({ fetchImpl = fetch } = {}) {
  async function listRecentIncomingTransfers({ receiverAccountId, network = 'mainnet', apiKey = '', oldestTimestampNs = '', limit = 25, maxPages = 20 }) {
    const receiver = toTrimmed(receiverAccountId);
    if (!receiver) throw Object.assign(new Error('receiverAccountId is required'), { code: 'NEAR_RECEIVER_REQUIRED' });
    const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 25)));
    const safeMaxPages = Math.max(1, Math.min(50, Math.floor(Number(maxPages) || 20)));
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const transfers = [];
    const seenHashes = new Set();
    const seenCursors = new Set();
    let next = '';
    let reachedOldestPending = false;

    for (let page = 0; page < safeMaxPages; page += 1) {
      // NearBlocks v3 ignores/returns no rows for the `receiver` query parameter.
      // Scan the account transaction feed and filter the receiver locally below.
      const query = new URLSearchParams({ limit: String(safeLimit) });
      if (next) query.set('next', next);
      const response = await fetchImpl(`${getIndexerUrl(network)}/v3/accounts/${encodeURIComponent(receiver)}/txns?${query}`, {
        headers,
        signal: AbortSignal.timeout(15000),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.data)) {
        throw Object.assign(new Error(payload?.message || `NEAR transfer scan failed with status ${response.status}`), { code: 'NEAR_INDEXER_FAILED' });
      }

      for (const entry of payload.data) {
        const timestampNs = toTrimmed(entry?.block_timestamp || entry?.block?.block_timestamp);
        if (oldestTimestampNs && /^\d+$/.test(timestampNs) && BigInt(timestampNs) < BigInt(oldestTimestampNs)) {
          reachedOldestPending = true;
          break;
        }
        const txHash = toTrimmed(entry?.transaction_hash);
        const actionList = Array.isArray(entry?.actions) ? entry.actions : [];
        const hasTransfer = actionList.some((action) => String(typeof action === 'string' ? action : action?.action || '').toUpperCase() === 'TRANSFER');
        const amountYocto = entry?.actions_agg?.deposit;
        if (!txHash || seenHashes.has(txHash) || !hasTransfer || entry?.outcomes?.status !== true
          || toTrimmed(entry?.receiver_account_id) !== receiver || typeof amountYocto !== 'string' || !/^\d+$/.test(amountYocto)) continue;
        seenHashes.add(txHash);
        transfers.push({
          txHash,
          senderAccountId: toTrimmed(entry?.signer_account_id),
          receiverAccountId: receiver,
          amountYocto,
          timestampNs,
        });
      }

      if (reachedOldestPending) break;
      next = toTrimmed(payload.meta?.next_page);
      if (!next) break;
      if (seenCursors.has(next)) throw Object.assign(new Error('NEAR indexer repeated a pagination cursor'), { code: 'NEAR_INDEXER_PAGINATION_INVALID' });
      seenCursors.add(next);
    }
    return transfers;
  }

  async function verifyNearTransaction({ txHash, senderAccountId, receiverAccountId, expectedYoctoAmount, network = 'mainnet' }) {
    const sender = toTrimmed(senderAccountId);
    if (!sender) {
      const error = new Error('senderAccountId is required for NEAR verification');
      error.code = 'NEAR_SENDER_REQUIRED';
      throw error;
    }

    const url = getRpcUrl(network);
    if (!/^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(toTrimmed(txHash)) || !/^([a-z0-9]+[-_])*[a-z0-9]+(?:\.([a-z0-9]+[-_])*[a-z0-9]+)*$/.test(sender) || !/^\d+$/.test(toTrimmed(expectedYoctoAmount))) {
      throw Object.assign(new Error('Invalid NEAR payment details'), { code: 'NEAR_PAYMENT_INVALID' });
    }
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'p4-payment',
        method: 'tx',
        params: { tx_hash: txHash, sender_account_id: sender, wait_until: 'FINAL' },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      const error = new Error(payload?.error?.message || payload?.message || `NEAR verification failed with status ${response.status}`);
      error.code = 'NEAR_RPC_FAILED';
      error.details = payload;
      throw error;
    }

    const result = payload.result || payload;
    const transaction = result?.transaction || result?.transaction_outcome?.transaction || result?.transaction_info?.transaction || null;
    const receiverId = toTrimmed(transaction?.receiver_id || transaction?.receiverId || result?.transaction?.receiver_id);
    const signerId = toTrimmed(transaction?.signer_id || transaction?.signerId || '');
    const actions = Array.isArray(transaction?.actions) ? transaction.actions : [];
    const transferAction = actions.find((action) => action?.Transfer || action?.transfer || action?.transfer_action) || null;
    const amount = extractTransferAmount(transferAction || {});
    const status = result?.status || result?.transaction?.outcome?.status || result?.final_execution_status || {};
    const completed = typeof status === 'object' && status !== null && Object.hasOwn(status, 'SuccessValue');
    const expectedAmount = toTrimmed(expectedYoctoAmount);

    return {
      confirmed: completed && result.final_execution_status === 'FINAL' && transaction?.hash === txHash && receiverId === toTrimmed(receiverAccountId) && amount === expectedAmount && signerId === sender,
      txHash,
      senderAccountId: sender,
      recipient: receiverId,
      amount,
      raw: result,
    };
  }

  return {
    listRecentIncomingTransfers,
    verifyNearTransaction,
  };
}
