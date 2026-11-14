const legacyAfkFields = ['location_passive_ready_at', 'location_passive_last_claim_at', 'location_passive_claimed_at'];

export function normalizePlayerPatch(body = {}) {
  if (!legacyAfkFields.some(key => Object.hasOwn(body, key))) return body;
  // Old clients echoed calculated timer fields in ordinary profile updates.
  // Strip them; never turn a profile sync into an implicit reward claim.
  const safeBody = { ...body };
  legacyAfkFields.forEach(key => delete safeBody[key]);
  return safeBody;
}
