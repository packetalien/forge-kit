import { describe, it, expect } from 'vitest';
import type { Item } from '../../src/shared/types';

describe('Item type', () => {
  it('accepts valid item shape', () => {
    const item: Item = {
      id: 1,
      name: 'Sword',
      width: 2,
      height: 1,
      left: 1,
      right: 2,
      parentId: null,
      containerId: 1,
      equipmentSlot: null,
      slotRow: null,
      slotCol: null,
    };
    expect(item.name).toBe('Sword');
    expect(item.left).toBeLessThan(item.right);
  });
});
