import { create } from 'zustand';
import type { Ingredient } from '@shared/types';
import type { SynthesisResult } from '@shared/synthesisEngine';

interface AlchemyState {
  baseLiquid: 'water' | 'oil' | 'mercury';
  ingredients: Ingredient[];
  lastResult: SynthesisResult | null;
  setBaseLiquid: (base: 'water' | 'oil' | 'mercury') => void;
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (index: number) => void;
  clearIngredients: () => void;
  setLastResult: (result: SynthesisResult | null) => void;
}

export const useAlchemyStore = create<AlchemyState>((set) => ({
  baseLiquid: 'water',
  ingredients: [],
  lastResult: null,
  setBaseLiquid: (base) => set({ baseLiquid: base }),
  addIngredient: (ingredient) =>
    set((s) => ({ ingredients: [...s.ingredients, ingredient] })),
  removeIngredient: (index) =>
    set((s) => ({
      ingredients: s.ingredients.filter((_, i) => i !== index),
    })),
  clearIngredients: () => set({ ingredients: [] }),
  setLastResult: (result) => set({ lastResult: result }),
}));
