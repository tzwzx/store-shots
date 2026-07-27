// Bounded-concurrency worker pool. Results keep the input order; the first
// failure rejects the pool and stops lanes from picking up new items.

export const runPool = async <TItem, TResult>(
  items: readonly TItem[],
  limit: number,
  worker: (item: TItem) => Promise<TResult>
): Promise<TResult[]> => {
  const results: TResult[] = [];
  let nextIndex = 0;
  let failed = false;

  const lane = async (): Promise<void> => {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        // oxlint-disable-next-line no-await-in-loop -- each lane intentionally processes one item at a time
        results[index] = await worker(items[index] as TItem);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };

  const laneCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: laneCount }, lane));
  return results;
};
