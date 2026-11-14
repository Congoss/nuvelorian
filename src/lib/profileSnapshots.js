// Authentication is a startup snapshot, never a replacement for live game state.
export function seedProfileFromAuth(current, snapshot) {
  if (!snapshot?.id) return current;
  if (current?.id === snapshot.id) return current;
  return { ...snapshot };
}

export function mergeSavedProfile(current, updates, saved) {
  // A successful API response owns economy fields; ignored client fields must
  // not appear as temporary rewards until the next periodic refresh.
  return { ...current, ...(saved && typeof saved === 'object' ? saved : updates) };
}
