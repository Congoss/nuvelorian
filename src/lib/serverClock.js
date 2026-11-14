let anchor = null;
export function syncServerClock(response) {
  const timestamp = Date.parse(response.headers.get('date'));
  if (Number.isFinite(timestamp)) anchor = { timestamp, tick: performance.now() };
}
export function serverNow() {
  return anchor ? anchor.timestamp + performance.now() - anchor.tick : Date.now();
}
