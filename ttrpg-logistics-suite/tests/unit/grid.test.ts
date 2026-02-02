import { describe, it, expect } from 'vitest';
import { canPlaceItem, createGrid, placeItem } from '../../src/shared/grid';

describe('Grid Placement', () => {
  it('creates empty grid', () => {
    const grid = createGrid(10, 12);
    expect(grid.length).toBe(10);
    expect(grid[0].length).toBe(12);
    expect(grid.every((r) => r.every((c) => !c))).toBe(true);
  });

  it('allows placing item at origin', () => {
    const grid = createGrid(10, 12);
    expect(canPlaceItem(grid, { width: 2, height: 2 }, 0, 0)).toBe(true);
  });

  it('rejects out-of-bounds placement', () => {
    const grid = createGrid(10, 12);
    expect(canPlaceItem(grid, { width: 2, height: 2 }, 9, 11)).toBe(false);
    expect(canPlaceItem(grid, { width: 3, height: 1 }, 0, 10)).toBe(false);
  });

  it('rejects overlapping placement after first place', () => {
    const grid = createGrid(10, 12);
    const after = placeItem(grid, { width: 2, height: 2 }, 0, 0);
    expect(canPlaceItem(after, { width: 1, height: 1 }, 0, 0)).toBe(false);
    expect(canPlaceItem(after, { width: 1, height: 1 }, 1, 1)).toBe(false);
    expect(canPlaceItem(after, { width: 1, height: 1 }, 2, 2)).toBe(true);
  });
});
