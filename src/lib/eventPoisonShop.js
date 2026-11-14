export const POISON_SHOP = Object.freeze({
  id: 'poison-shop-2026-10-15',
  startAt: '2026-10-15T12:22:00.000Z',
  endAt: '2026-10-17T12:22:00.000Z',
});
export const POISON_SHOP_PRODUCTS = Object.freeze([
  { id: 'large', field: 'large-poison', price: 200000, stock: 299 },
  { id: 'medium', field: 'medium-poison', price: 150000, stock: 599 },
  { id: 'small', field: 'small-poison', price: 100000, stock: 999 },
]);
export function poisonShopState(players, now = Date.now()) {
  const sold = {};
  for (const player of players) {
    for (const receipt of Object.values(player.event_poison_purchases || {})) {
      if (receipt.shopId === POISON_SHOP.id) sold[receipt.productId] = (sold[receipt.productId] || 0) + receipt.quantity;
    }
  }
  return { ...POISON_SHOP, active: now >= Date.parse(POISON_SHOP.startAt) && now < Date.parse(POISON_SHOP.endAt),
    products: POISON_SHOP_PRODUCTS.map(product => ({ ...product, remaining: Math.max(0, product.stock - (sold[product.id] || 0)) })) };
}
// No asynchronous work between validation and mutation: concurrent requests
// share the same authoritative player collection on this game server.
export function purchaseEventPoison(players, player, body, now = Date.now()) {
  const { productId, quantity, requestId } = body || {};
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(requestId)) throw new Error('Некоректний номер покупки');
  const previous = player.event_poison_purchases?.[requestId];
  if (previous) {
    if (previous.productId !== productId || previous.quantity !== quantity) throw new Error('Номер покупки вже використаний');
    return previous;
  }
  const shop = poisonShopState(players, now);
  if (!shop.active) throw new Error('Магазин закрито');
  const product = shop.products.find(item => item.id === productId);
  if (!product || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.stock) throw new Error('Некоректна кількість');
  if (quantity > product.remaining) throw new Error('Недостатньо товару на сервері');
  const cost = quantity * product.price;
  if (!(Number(player.tentacles || 0) >= cost)) throw new Error('Недостатньо щупалець');
  const receipt = { shopId: shop.id, productId, quantity, cost, purchasedAt: new Date(now).toISOString() };
  player.tentacles -= cost;
  player.weapon_inventory = { ...player.weapon_inventory, [product.field]: Number(player.weapon_inventory?.[product.field] || 0) + quantity };
  player.event_poison_purchases = { ...player.event_poison_purchases, [requestId]: receipt };
  return receipt;
}
