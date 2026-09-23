import { describe, it, expect } from 'vitest';
import { mapLimit, mapLimitSettled } from './concurrency.js';

describe('mapLimit', () => {
  it('maps items and resolves with the results in input order, like Promise.all', async () => {
    const result = await mapLimit([1, 2, 3], async (n) => n * 2);

    expect(result).toEqual([2, 4, 6]);
  });

  it('never runs more than the concurrency cap in flight at once, defaulting to 8', async () => {
    let inFlight = 0;
    let peak = 0;

    await mapLimit(Array.from({ length: 20 }, (_, i) => i), async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
    });

    expect(peak).toBeLessThanOrEqual(8);
    expect(peak).toBeGreaterThan(1);
  });

  it('respects a custom concurrency cap', async () => {
    let inFlight = 0;
    let peak = 0;

    await mapLimit(
      Array.from({ length: 10 }, (_, i) => i),
      async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;
      },
      { concurrency: 3 },
    );

    expect(peak).toBeLessThanOrEqual(3);
  });

  it('rejects as soon as one item rejects, like Promise.all', async () => {
    const promise = mapLimit([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('item 2 failed');
      return n;
    });

    await expect(promise).rejects.toThrow('item 2 failed');
  });
});

describe('mapLimitSettled', () => {
  it('resolves with every outcome, fulfilled and rejected, like Promise.allSettled', async () => {
    const result = await mapLimitSettled([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('item 2 failed');
      return n * 10;
    });

    expect(result).toEqual([
      { status: 'fulfilled', value: 10 },
      { status: 'rejected', reason: new Error('item 2 failed') },
      { status: 'fulfilled', value: 30 },
    ]);
  });

  it('respects the concurrency cap, defaulting to 8', async () => {
    let inFlight = 0;
    let peak = 0;

    await mapLimitSettled(Array.from({ length: 20 }, (_, i) => i), async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
    });

    expect(peak).toBeLessThanOrEqual(8);
  });
});
