// Lookup and authoritative claim share a deadline; no artificial animation wait.
export async function openLootReward({ open, apply, context, timeoutMs = 30000 }) {
  let timer;
  let expired = false;
  const timeoutError = () => Object.assign(new Error('Chest opening timed out'), { code: 'CHEST_TIMEOUT' });
  try {
    return await Promise.race([
      Promise.resolve().then(async () => {
        const drops = await open?.(context) || [];
        if (expired) throw timeoutError();
        await apply?.(drops);
        return drops;
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => { expired = true; reject(timeoutError()); }, timeoutMs);
      }),
    ]);
  } finally { clearTimeout(timer); }
}
