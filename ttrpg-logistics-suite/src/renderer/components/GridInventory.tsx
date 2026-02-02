import type { Item } from '@shared/types';

interface GridInventoryProps {
  gridRows?: number;
  gridCols?: number;
  items?: Item[];
}

export function GridInventory({ gridRows = 10, gridCols = 12, items = [] }: GridInventoryProps) {
  return (
    <div className="border border-slate-600 rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Grid Inventory</h2>
      <div
        className="grid gap-0.5 bg-slate-800 p-2 rounded"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
          aspectRatio: `${gridCols} / ${gridRows}`,
        }}
      >
        {Array.from({ length: gridRows * gridCols }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-700 rounded-sm min-h-[20px]"
            data-cell-index={i}
          />
        ))}
      </div>
      {items.length > 0 && (
        <p className="text-slate-400 text-sm mt-2">{items.length} item(s)</p>
      )}
    </div>
  );
}
