export function bossMedalLayout({ height, width, top, count, bottomInset = 0 }) {
  if (!(height > 0 && width > 0) || !Number.isFinite(top)) return null;
  const available = Math.max(4, Math.floor(height - top - Math.max(height * .12, bottomInset) - 12));
  const visible = Math.min(6, Math.max(4, Math.floor(available / 64)));
  const size = Math.max(1, Math.floor(Math.min(76, width * .16, available / visible)));
  return { count: visible, size, height: Math.min(count, visible) * size };
}
