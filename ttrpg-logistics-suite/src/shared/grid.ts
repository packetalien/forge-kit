import type { Item } from './types';

export type Grid = boolean[][];

export function createGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

export function canPlaceItem(
  grid: Grid,
  item: Pick<Item, 'width' | 'height'>,
  row: number,
  col: number
): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (row + item.height > rows || col + item.width > cols) return false;
  for (let r = row; r < row + item.height; r++) {
    for (let c = col; c < col + item.width; c++) {
      if (grid[r]?.[c]) return false;
    }
  }
  return true;
}

export function placeItem(
  grid: Grid,
  item: Pick<Item, 'width' | 'height'>,
  row: number,
  col: number
): Grid {
  const next = grid.map((r) => [...r]);
  for (let r = row; r < row + item.height; r++) {
    for (let c = col; c < col + item.width; c++) {
      if (next[r]) next[r][c] = true;
    }
  }
  return next;
}
