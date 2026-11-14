// Public numbers of the mainnet market for the landing page.
// Counts only sales whose payment was verified on chain (a sold lot always carries its tx hash).
// No player names, ids or wallets leave this function; transaction hashes are public on NEAR anyway.
const HASH = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;

export function marketPublicStats(book, { recentLimit = 5 } = {}) {
  const lots = Array.isArray(book?.lots) ? book.lots : [];
  const orders = new Map((Array.isArray(book?.orders) ? book.orders : []).map(order => [order.id, order]));
  const agentIds = new Set((Array.isArray(book?.agents) ? book.agents : []).map(agent => String(agent.id)));
  const sold = lots.filter(lot => lot.status === 'sold' && HASH.test(String(lot.txHash || '')));
  const kindOf = lot => {
    if (lot.sellerAi) return 'merchant-sale';
    const order = orders.get(lot.orderId);
    return order?.agentKey || agentIds.has(String(lot.buyerId)) ? 'merchant-buy' : 'player';
  };
  const humans = { sellers: new Set(), buyers: new Set() };
  const byKind = { player: 0, 'merchant-sale': 0, 'merchant-buy': 0 };
  let volume = 0, fees = 0;
  for (const lot of sold) {
    const kind = kindOf(lot);
    byKind[kind] += 1;
    volume += Number(lot.price) || 0;
    fees += Number(lot.fee) || 0;
    if (kind !== 'merchant-sale') humans.sellers.add(String(lot.sellerId));
    if (kind !== 'merchant-buy') humans.buyers.add(String(lot.buyerId));
  }
  const active = lots.filter(lot => lot.status === 'active');
  return {
    trades: sold.length,
    playerTrades: byKind.player,
    merchantSales: byKind['merchant-sale'],
    merchantPurchases: byKind['merchant-buy'],
    sellers: humans.sellers.size,
    buyers: humans.buyers.size,
    // PL4 in hundredths, the unit the market book uses
    volumeHundredths: volume,
    feeHundredths: fees,
    activeLots: active.length,
    merchantLots: active.filter(lot => lot.sellerAi).length,
    recent: [...sold]
      .sort((a, b) => Date.parse(b.soldAt || 0) - Date.parse(a.soldAt || 0))
      .slice(0, recentLimit)
      .map(lot => ({ hash: lot.txHash, kind: kindOf(lot), priceHundredths: Number(lot.price) || 0, at: Date.parse(lot.soldAt || '') || null })),
  };
}
