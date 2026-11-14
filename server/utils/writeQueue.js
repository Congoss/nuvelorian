// Merge requests waiting behind the current write. Calls made during an active
// write get a later pass, so their changes cannot be acknowledged prematurely.
export function createWriteQueue(write) {
  let tail = Promise.resolve();
  let pending = null;
  const enqueue = (ids = null) => {
    if (pending) {
      if (!ids) pending.ids = null;
      else if (pending.ids) for (const id of ids) pending.ids.add(id);
      return pending.promise;
    }
    const batch = { ids: ids ? new Set(ids) : null, promise: null };
    pending = batch;
    batch.promise = tail.catch(() => {}).then(() => {
      if (pending === batch) pending = null;
      return write(batch.ids ? [...batch.ids] : null);
    });
    tail = batch.promise;
    return batch.promise;
  };
  enqueue.exclusive = (work) => {
    // Seal the pending group so later writes cannot join ahead of this work.
    pending = null;
    const task = tail.catch(() => {}).then(work);
    tail = task;
    return task;
  };
  return enqueue;
}
