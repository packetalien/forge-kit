import { create } from 'zustand';

interface WorldState {
  selectedLocationId: number | null;
  setSelectedLocation: (id: number | null) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  selectedLocationId: null,
  setSelectedLocation: (id) => set({ selectedLocationId: id }),
}));
