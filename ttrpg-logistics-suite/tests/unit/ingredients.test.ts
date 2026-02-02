import { describe, it, expect } from 'vitest';
import { UNDERDARK_INGREDIENTS } from '../../src/shared/ingredients';

describe('UNDERDARK_INGREDIENTS', () => {
  it('has 20+ entries', () => {
    expect(UNDERDARK_INGREDIENTS.length).toBeGreaterThanOrEqual(20);
  });

  it('each has name, vector, quality, mutable', () => {
    for (const ing of UNDERDARK_INGREDIENTS) {
      expect(ing.name).toBeDefined();
      expect(typeof ing.vector.x).toBe('number');
      expect(typeof ing.vector.y).toBe('number');
      expect(typeof ing.quality).toBe('number');
      expect(ing.quality).toBeGreaterThanOrEqual(0);
      expect(ing.quality).toBeLessThanOrEqual(1);
      expect(typeof ing.mutable).toBe('boolean');
    }
  });

  it('names are unique', () => {
    const names = UNDERDARK_INGREDIENTS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
