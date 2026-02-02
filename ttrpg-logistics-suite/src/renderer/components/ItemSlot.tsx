import { useDrag, useDrop } from 'react-dnd';
import type { Item } from '@shared/types';

const ITEM_TYPE = 'item';

interface ItemSlotProps {
  row: number;
  col: number;
  item?: Item | null;
  isOrigin: boolean;
  onPlace: (item: Item, row: number, col: number) => void;
  children?: React.ReactNode;
}

export function ItemSlot({ row, col, item, isOrigin, onPlace, children }: ItemSlotProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (dragged: Item) => onPlace(dragged, row, col),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  });

  const [{ opacity }, drag] = useDrag({
    type: ITEM_TYPE,
    item: isOrigin && item ? item : undefined,
    canDrag: Boolean(isOrigin && item),
    collect: (monitor) => ({ opacity: monitor.isDragging() ? 0.5 : 1 }),
  });

  const setRef = (node: HTMLDivElement | null) => {
    drop(node);
    if (isOrigin && item) drag(node);
  };

  return (
    <div
      ref={setRef}
      className={`
        min-h-[28px] min-w-[28px] rounded border border-slate-600 flex items-center justify-center text-xs
        ${isOver ? 'bg-emerald-900/50 border-emerald-500' : 'bg-slate-700'}
      `}
      style={{ opacity }}
      data-slot-row={row}
      data-slot-col={col}
    >
      {children ?? (isOrigin && item ? item.name : null)}
    </div>
  );
}
