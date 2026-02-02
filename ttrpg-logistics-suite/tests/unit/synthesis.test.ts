import { describe, it, expect } from 'vitest';
import { SynthesisEngine, DEFAULT_EFFECT_NODES } from '../../src/shared/synthesisEngine';
import type { Ingredient } from '../../src/shared/types';

describe('SynthesisEngine', () => {
  it('starts at base position for water', () => {
    const engine = new SynthesisEngine('water');
    expect(engine.getPosition()).toEqual({ x: 0, y: 0 });
  });

  it('sums ingredient vectors', () => {
    const engine = new SynthesisEngine('water');
    engine.addIngredient({
      name: 'deathcap',
      vector: { x: 1, y: 2 },
      quality: 1,
      mutable: false,
    });
    expect(engine.getPosition()).toEqual({ x: 1, y: 2 });
    engine.addIngredient({
      name: 'root',
      vector: { x: -1, y: 0 },
      quality: 0.5,
      mutable: false,
    });
    expect(engine.getPosition()).toEqual({ x: 0, y: 2 });
  });

  it('computes final effect by proximity to nodes', () => {
    const engine = new SynthesisEngine('water');
    engine.addIngredient({
      name: 'poison-sac',
      vector: { x: -2, y: 1 },
      quality: 1,
      mutable: false,
    });
    const result = engine.computeFinalEffect();
    expect(result.position).toEqual({ x: -2, y: 1 });
    expect(result.nodes).toContain('poison');
    expect(result.potion).toContain('poison');
  });

  it('mortar tool rounds position', () => {
    const engine = new SynthesisEngine('water');
    engine.addIngredient({
      name: 'a',
      vector: { x: 1.3, y: -0.7 },
      quality: 1,
      mutable: false,
    });
    engine.useTool('mortar');
    expect(engine.getPosition()).toEqual({ x: 1, y: -1 });
  });

  it('alembic tool doubles position', () => {
    const engine = new SynthesisEngine('water');
    engine.addIngredient({
      name: 'a',
      vector: { x: 1, y: 1 },
      quality: 1,
      mutable: false,
    });
    engine.useTool('alembic');
    expect(engine.getPosition()).toEqual({ x: 2, y: 2 });
  });

  it('saveRecipe stores in discovery book', () => {
    const engine = new SynthesisEngine('water');
    engine.addIngredient({
      name: 'deathcap',
      vector: { x: 2, y: -1 },
      quality: 0.8,
      mutable: true,
    });
    engine.saveRecipe('Test Potion');
    const book = engine.getDiscoveryBook();
    expect(book['Test Potion']).toBeDefined();
    expect(book['Test Potion'].ingredients).toContain('deathcap');
    expect(book['Test Potion'].effectNodes).toBeDefined();
  });

  it('reset clears position and ingredients', () => {
    const engine = new SynthesisEngine('water');
    engine.addIngredient({
      name: 'x',
      vector: { x: 5, y: 5 },
      quality: 1,
      mutable: false,
    });
    engine.reset();
    expect(engine.getPosition()).toEqual({ x: 0, y: 0 });
    expect(engine.getIngredients()).toHaveLength(0);
  });
});
