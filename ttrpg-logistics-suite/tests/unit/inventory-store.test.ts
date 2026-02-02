import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '../../src/renderer/stores/inventory-store';
import type { Item } from '../../src/shared/types';

describe('inventory-store', () => {
  const sample: Item = {
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

  beforeEach(() => {
    useInventoryStore.setState({ items: [] });
  });

  it('setItems replaces items', () => {
    useInventoryStore.getState().setItems([sample]);
    expect(useInventoryStore.getState().items).toHaveLength(1);
    expect(useInventoryStore.getState().items[0].name).toBe('Sword');
  });

  it('addItem appends item', () => {
    useInventoryStore.getState().addItem(sample);
    useInventoryStore.getState().addItem({ ...sample, id: 2, name: 'Shield' });
    expect(useInventoryStore.getState().items).toHaveLength(2);
    expect(useInventoryStore.getState().items[1].name).toBe('Shield');
  });
});
