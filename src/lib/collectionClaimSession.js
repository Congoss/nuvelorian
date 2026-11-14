export function collectionClaimSession(location, count = 1) {
  return { ...location, claimCount: count, claimRequestId: crypto.randomUUID() };
}
