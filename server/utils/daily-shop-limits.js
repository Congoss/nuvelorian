const DAILY_ITEM_LIMITS = Object.freeze({
  energy_25: 3,
  daily_toxic_pack: 1,
  energy_50: 1,
  energy_100: 1,
  spin_1: 5,
  spin_5: 5,
  spin_20: 5,
});

export function validateDailyShopPatch(player, body, today = new Date().toISOString().slice(0, 10)) {
  const patch = {};

  if (Object.hasOwn(body, 'daily_shop_date') || Object.hasOwn(body, 'daily_shop_purchases')) {
    if (body.daily_shop_date !== today || !Array.isArray(body.daily_shop_purchases)) {
      return { error: 'Daily shop purchase state is invalid' };
    }

    const alreadyBought = player.daily_shop_date === today && Array.isArray(player.daily_shop_purchases)
      ? player.daily_shop_purchases.map(String)
      : [];
    const requested = body.daily_shop_purchases.map(String);
    const uniqueRequested = new Set(requested);
    if (uniqueRequested.size !== requested.length || alreadyBought.some((id) => !uniqueRequested.has(id))) {
      return { error: 'Daily shop purchase state cannot be reset' };
    }

    const added = requested.filter((id) => !alreadyBought.includes(id));
    if (added.length !== 1 || added.some((id) => !new RegExp(`^daily-${today}-[0-2]$`).test(id))) {
      return { error: 'A daily offer purchase must be new and valid' };
    }
    patch.daily_shop_date = today;
    patch.daily_shop_purchases = [...alreadyBought, ...added];
  }

  if (Object.hasOwn(body, 'shop_daily_limits')) {
    const requestedLimits = body.shop_daily_limits;
    if (!requestedLimits || requestedLimits.day !== today || !requestedLimits.counts || typeof requestedLimits.counts !== 'object' || Array.isArray(requestedLimits.counts)) {
      return { error: 'Daily purchase limits are invalid' };
    }

    const previousCounts = player.shop_daily_limits?.day === today ? player.shop_daily_limits.counts || {} : {};
    const counts = { ...previousCounts };
    let increments = 0;
    for (const [key, rawValue] of Object.entries(requestedLimits.counts)) {
      const value = Number(rawValue);
      const previous = Number(previousCounts[key] || 0);
      const maximum = DAILY_ITEM_LIMITS[key];
      if (!Number.isInteger(value) || value < previous || maximum === undefined || value > maximum || value - previous > 1) {
        return { error: 'Daily purchase limit cannot be reset or exceeded' };
      }
      increments += value - previous;
      counts[key] = value;
    }
    if (increments !== 1) return { error: 'A daily-limited purchase must increment exactly one item limit' };
    for (const [key, value] of Object.entries(previousCounts)) {
      if (!Object.hasOwn(counts, key)) counts[key] = value;
    }
    patch.shop_daily_limits = { day: today, counts };
  }

  return { patch };
}
