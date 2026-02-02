import { useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAlchemyStore } from '../stores/alchemy-store';
import { SynthesisEngine } from '@shared/synthesisEngine';
import { UNDERDARK_INGREDIENTS } from '@shared/ingredients';
import type { Ingredient } from '@shared/types';

const INGREDIENT_TYPE = 'ingredient';
const API = 'http://127.0.0.1:38462';

function CauldronDropZone() {
  const addIngredient = useAlchemyStore((s) => s.addIngredient);
  const [{ isOver }, drop] = useDrop({
    accept: INGREDIENT_TYPE,
    drop: (item: Ingredient) => addIngredient(item),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  });
  return (
    <div
      ref={drop}
      className={`
        w-48 h-48 rounded-full border-2 border-slate-500 flex items-center justify-center text-slate-400
        ${isOver ? 'bg-emerald-900/40 border-emerald-500' : 'bg-slate-800'}
      `}
    >
      Cauldron
    </div>
  );
}

function IngredientChip({ ingredient }: { ingredient: Ingredient }) {
  const [{ opacity }, drag] = useDrag({
    type: INGREDIENT_TYPE,
    item: ingredient,
    collect: (monitor) => ({ opacity: monitor.isDragging() ? 0.5 : 1 }),
  });
  return (
    <div
      ref={drag}
      className="px-2 py-1 rounded bg-slate-700 text-sm cursor-grab border border-slate-600"
      style={{ opacity }}
    >
      {ingredient.name}
    </div>
  );
}

function AlchemyBenchInner() {
  const {
    baseLiquid,
    ingredients,
    lastResult,
    addIngredient,
    removeIngredient,
    clearIngredients,
    setLastResult,
  } = useAlchemyStore();

  const handleBrew = useCallback(async () => {
    const engine = new SynthesisEngine(baseLiquid);
    ingredients.forEach((i) => engine.addIngredient(i));
    const result = engine.computeFinalEffect();
    setLastResult(result);
    try {
      await fetch(`${API}/crafting/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseLiquid, ingredients }),
      });
    } catch {
      // offline or API not running
    }
  }, [baseLiquid, ingredients, setLastResult]);

  const handleSaveRecipe = useCallback(async () => {
    if (!lastResult) return;
    const name = `Recipe ${Date.now()}`;
    try {
      await fetch(`${API}/crafting/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ingredients: ingredients.map((i) => i.name),
          position: lastResult.position,
          effectNodes: lastResult.nodes,
          discoveredAt: Date.now(),
        }),
      });
    } catch {
      // offline
    }
  }, [lastResult, ingredients]);

  return (
    <div className="border border-slate-600 rounded p-4 space-y-4">
      <h2 className="text-lg font-semibold">Alchemy Bench</h2>
      <div className="flex gap-6 flex-wrap">
        <CauldronDropZone />
        <div className="flex-1 min-w-[200px]">
          <p className="text-slate-400 text-sm mb-2">Drag ingredients to cauldron</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {UNDERDARK_INGREDIENTS.slice(0, 8).map((ing) => (
              <IngredientChip key={ing.name} ingredient={ing} />
            ))}
          </div>
          <p className="text-slate-400 text-sm mb-1">In cauldron ({ingredients.length})</p>
          <ul className="list-disc list-inside text-sm text-slate-300 mb-4">
            {ingredients.map((ing, i) => (
              <li key={`${ing.name}-${i}`}>
                {ing.name}
                <button
                  type="button"
                  className="ml-2 text-red-400 hover:underline"
                  onClick={() => removeIngredient(i)}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500"
              onClick={handleBrew}
            >
              Brew
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500"
              onClick={clearIngredients}
            >
              Clear
            </button>
            {lastResult && (
              <button
                type="button"
                className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600"
                onClick={handleSaveRecipe}
              >
                Save recipe
              </button>
            )}
          </div>
          {lastResult && (
            <div className="mt-4 p-2 rounded bg-slate-800 text-sm">
              <p className="text-slate-300">Effect: {lastResult.potion}</p>
              <p className="text-slate-400">Nodes: {lastResult.nodes.join(', ') || '—'}</p>
              <p className="text-slate-400">Position: ({lastResult.position.x}, {lastResult.position.y})</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlchemyBench() {
  return (
    <DndProvider backend={HTML5Backend}>
      <AlchemyBenchInner />
    </DndProvider>
  );
}
