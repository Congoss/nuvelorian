const calendar = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function kyivDayKey(now = Date.now()) {
  return calendar.format(new Date(now));
}

export function nextKyivMidnight(now = Date.now()) {
  const today = kyivDayKey(now);
  let low = new Date(now).getTime();
  let high = low + 26 * 3600000;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (kyivDayKey(mid) === today) low = mid;
    else high = mid;
  }
  return high;
}
