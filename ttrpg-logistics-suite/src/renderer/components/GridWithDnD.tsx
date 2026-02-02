import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ItemSlot } from './ItemSlot';
import type { Item, Container } from '@shared/types';

interface GridWithDnDProps {
  container: Container;
  items: Item[];
  onPlace: (item: Item, row: number, col: number) => void;
}

function itemAt(items: Item[], row: number, col: number): Item | null {
  return items.find((i) => i.slotRow === row && i.slotCol === col) ?? null;
}

function isOriginOf(items: Item[], row: number, col: number): boolean {
  return items.some((i) => i.slotRow === row && i.slotCol === col);
}

export function GridWithDnD({ container, items, onPlace }: GridWithDnDProps) {
  const { gridWidth, gridHeight } = container;
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < gridHeight; r++) {
    for (let c = 0; c < gridWidth; c++) {
      cells.push({ row: r, col: c });
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <p className="text-slate-500 text-xs mb-1">Weave Mode: press <kbd className="px-1 rounded bg-slate-700">W</kbd> for PALS/MOLLE straps</p>
      <div
        className="inline-grid gap-0.5 bg-slate-800 p-2 rounded"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, minmax(28px, 1fr))`,
          gridTemplateRows: `repeat(${gridHeight}, minmax(28px, 1fr))`,
        }}
      >
        {cells.map(({ row, col }) => (
          <ItemSlot
            key={`${row}-${col}`}
            row={row}
            col={col}
            item={itemAt(items, row, col)}
            isOrigin={isOriginOf(items, row, col)}
            onPlace={onPlace}
          />
        ))}
      </div>
    </DndProvider>
  );
}
