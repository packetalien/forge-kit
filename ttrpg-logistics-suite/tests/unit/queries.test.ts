import { describe, it, expect, vi } from 'vitest';
import { getSubtreeWeightRecursive } from '../../src/main/db/queries';

describe('Recursive CTE queries', () => {
  it('getSubtreeWeightRecursive returns sum from mock db', async () => {
    const mockDb = {
      get: vi.fn((_sql: string, _params: number[], cb: (err: null, row: { total: number }) => void) => {
        cb(null, { total: 12.5 });
      }),
    } as unknown as import('sqlite3').Database;
    const total = await getSubtreeWeightRecursive(mockDb, 1);
    expect(total).toBe(12.5);
    expect(mockDb.get).toHaveBeenCalledWith(
      expect.stringContaining('WITH RECURSIVE'),
      [1],
      expect.any(Function)
    );
  });

  it('getSubtreeWeightRecursive returns 0 when row is undefined', async () => {
    const mockDb = {
      get: vi.fn((_sql: string, _params: number[], cb: (err: null, row: undefined) => void) => {
        cb(null, undefined);
      }),
    } as unknown as import('sqlite3').Database;
    const total = await getSubtreeWeightRecursive(mockDb, 99);
    expect(total).toBe(0);
  });
});
