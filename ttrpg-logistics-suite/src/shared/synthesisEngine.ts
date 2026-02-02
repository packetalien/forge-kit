import type { Vector, Ingredient, EffectNode, DiscoveryRecipe } from './types';
import { debug } from './logger';

const TAG = 'SynthesisEngine';

export type BaseLiquid = 'water' | 'oil' | 'mercury';

const BASE_POSITIONS: Record<BaseLiquid, Vector> = {
  water: { x: 0, y: 0 },
  oil: { x: -1, y: 0 },
  mercury: { x: 0, y: -1 },
};

/** Default effect nodes on 10x10 grid (proximity-based potion effects) */
export const DEFAULT_EFFECT_NODES: EffectNode[] = [
  { id: 'healing', name: 'Healing', x: 2, y: 2, radius: 2 },
  { id: 'poison', name: 'Poison', x: -2, y: 1, radius: 2 },
  { id: 'haste', name: 'Haste', x: 1, y: -2, radius: 1.5 },
  { id: 'resist', name: 'Resist', x: -1, y: -1, radius: 2 },
];

export interface SynthesisResult {
  potion: string;
  nodes: string[];
  position: Vector;
}

export type DiscoveryBook = Record<string, DiscoveryRecipe>;

export class SynthesisEngine {
  private position: Vector;
  private ingredients: Ingredient[] = [];
  private effectNodes: EffectNode[];
  private discoveryBook: DiscoveryBook = {};
  private baseLiquid: BaseLiquid;

  constructor(
    baseLiquid: BaseLiquid = 'water',
    effectNodes: EffectNode[] = DEFAULT_EFFECT_NODES
  ) {
    debug(TAG, 'constructor', { baseLiquid });
    this.baseLiquid = baseLiquid;
    this.position = { ...BASE_POSITIONS[baseLiquid] };
    this.effectNodes = effectNodes;
  }

  getPosition(): Vector {
    return { ...this.position };
  }

  getIngredients(): Ingredient[] {
    return [...this.ingredients];
  }

  addIngredient(ingredient: Ingredient): void {
    debug(TAG, 'addIngredient', { name: ingredient.name, vector: ingredient.vector });
    this.ingredients.push(ingredient);
    this.position.x += ingredient.vector.x;
    this.position.y += ingredient.vector.y;
    if (ingredient.mutable && ingredient.quality > 0.5) {
      this.position.x += Math.sign(ingredient.vector.x) * 0.5;
      this.position.y += Math.sign(ingredient.vector.y) * 0.5;
    }
    debug(TAG, 'position after add', this.position);
  }

  useTool(tool: 'alembic' | 'mortar'): void {
    debug(TAG, 'useTool', { tool });
    if (tool === 'mortar') {
      this.position.x = Math.round(this.position.x);
      this.position.y = Math.round(this.position.y);
    }
    if (tool === 'alembic') {
      this.position.x *= 2;
      this.position.y *= 2;
    }
  }

  computeFinalEffect(): SynthesisResult {
    const nodes: string[] = [];
    for (const node of this.effectNodes) {
      const dist = Math.hypot(
        this.position.x - node.x,
        this.position.y - node.y
      );
      if (dist <= node.radius) {
        nodes.push(node.id);
      }
    }
    const potion =
      nodes.length > 0 ? nodes.join('-') : 'Unknown';
    debug(TAG, 'computeFinalEffect', { potion, nodes, position: this.position });
    return {
      potion,
      nodes,
      position: { ...this.position },
    };
  }

  saveRecipe(name: string): void {
    debug(TAG, 'saveRecipe', { name });
    const result = this.computeFinalEffect();
    this.discoveryBook[name] = {
      name,
      ingredients: this.ingredients.map((i) => i.name),
      position: result.position,
      effectNodes: result.nodes,
      discoveredAt: Date.now(),
    };
  }

  loadDiscoveryBook(book: DiscoveryBook): void {
    this.discoveryBook = { ...book };
  }

  getDiscoveryBook(): DiscoveryBook {
    return { ...this.discoveryBook };
  }

  reset(): void {
    this.position = { ...BASE_POSITIONS[this.baseLiquid] };
    this.ingredients = [];
  }
}
