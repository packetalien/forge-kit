import { create } from 'zustand';
import type { Item } from '@shared/types';

interface InventoryState {
  items: Item[];
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));
