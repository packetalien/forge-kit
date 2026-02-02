import { describe, it, expect } from 'vitest';
import { GridEngine } from '../../src/shared/gridEngine';

describe('GridEngine', () => {
  const backpackW = 10;
  const backpackH = 12;
  const engine = new GridEngine(backpackW, backpackH);

  beforeEach(() => {
    engine['grid'] = Array.from({ length: backpackH }, () => Array(backpackW).fill(false));
    engine['placed'].clear();
  });

  it('returns dimensions', () => {
    expect(engine.getDimensions()).toEqual({ width: 10, height: 12 });
  });

  it('allows placement at origin', () => {
    expect(engine.canPlace({ width: 2, height: 2 }, 0, 0)).toBe(true);
    engine.placeItem({ id: 1, width: 2, height: 2 }, 0, 0);
    expect(engine.canPlace({ width: 1, height: 1 }, 0, 0)).toBe(false);
    expect(engine.canPlace({ width: 1, height: 1 }, 2, 2)).toBe(true);
  });

  it('rejects out-of-bounds placement', () => {
    expect(engine.canPlace({ width: 2, height: 2 }, 11, 0)).toBe(false);
    expect(engine.canPlace({ width: 2, height: 2 }, 0, 9)).toBe(false);
  });

  it('handles rotation (90° CCW)', () => {
    const rotated = engine.rotateItem({ width: 3, height: 1 });
    expect(rotated).toEqual({ width: 1, height: 3 });
    expect(engine.canPlace({ width: 3, height: 1 }, 0, 0, true)).toBe(true);
    engine.placeItem({ id: 2, width: 3, height: 1 }, 0, 0, true);
    expect(engine.canPlace({ width: 1, height: 1 }, 0, 0)).toBe(false);
    expect(engine.canPlace({ width: 1, height: 1 }, 1, 0)).toBe(false);
    expect(engine.canPlace({ width: 1, height: 1 }, 2, 0)).toBe(false);
    expect(engine.canPlace({ width: 1, height: 1 }, 0, 1)).toBe(true);
  });

  it('removeItem clears slots', () => {
    engine.placeItem({ id: 3, width: 2, height: 1 }, 0, 0);
    engine.removeItem({
      id: 3,
      name: 'x',
      width: 2,
      height: 1,
      left: 1,
      right: 2,
      containerId: 1,
      equipmentSlot: null,
      slotRow: 0,
      slotCol: 0,
    });
    expect(engine.canPlace({ width: 2, height: 1 }, 0, 0)).toBe(true);
  });

  it('autoSort packs items bottom-left', () => {
    const items = [
      { id: 10, width: 2, height: 2 },
      { id: 11, width: 1, height: 1 },
      { id: 12, width: 3, height: 1 },
    ];
    const result = engine.autoSort(items);
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ id: 10, row: 0, col: 0 });
    expect(engine.canPlace({ width: 2, height: 2 }, 0, 0)).toBe(false);
  });
});

describe('GridEngine.fromItems', () => {
  it('builds engine with pre-placed items', () => {
    const engine = GridEngine.fromItems(10, 12, [
      {
        id: 1,
        name: 'a',
        width: 2,
        height: 1,
        left: 1,
        right: 2,
        containerId: 1,
        equipmentSlot: null,
        slotRow: 0,
        slotCol: 0,
      } as any,
    ]);
    expect(engine.canPlace({ width: 1, height: 1 }, 0, 0)).toBe(false);
    expect(engine.canPlace({ width: 1, height: 1 }, 0, 2)).toBe(true);
  });
});
