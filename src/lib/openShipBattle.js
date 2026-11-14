// Keep the open request recoverable if the server commits before a network loss.
export async function openShipBattle(api, { playerId, clanId, moduleId, expectedFightId }, { storage = globalThis.sessionStorage, requestId = () => globalThis.crypto.randomUUID() } = {}) {
  const key = `ship-attack:${playerId}:${clanId}:${moduleId}:open`;
  let body;
  try { body = JSON.parse(storage?.getItem(key) || 'null'); } catch { /* Storage is optional. */ }
  if (expectedFightId && body?.fightId !== expectedFightId) body = null;
  if (!body?.requestId || body.moduleId !== moduleId) body = { requestId: requestId(), moduleId, ...(expectedFightId ? { fightId: expectedFightId } : {}) };
  try { storage?.setItem(key, JSON.stringify(body)); } catch { /* Server receipts remain authoritative. */ }
  try {
    const result = await api.clanShipCombat(clanId, 'open', body);
    if (!result?.fight?.id) throw new Error('Invalid ship battle response');
    try { storage?.removeItem(key); } catch { /* Ignore unavailable storage. */ }
    return result;
  } catch (error) {
    if (error.status >= 400 && error.status < 500) {
      try { storage?.removeItem(key); } catch { /* Ignore unavailable storage. */ }
    }
    throw error;
  }
}
