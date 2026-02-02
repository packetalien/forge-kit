import type { Item } from './types';
import { debug } from './logger';

const TAG = 'GridEngine';

/** Item footprint for placement (width/height only; rotation applied in engine). */
export type ItemFootprint = Pick<Item, 'width' | 'height'>;

/** Tracks slot occupancy for one container. Uses 2D boolean array [row][col]. */
export class GridEngine {
  private grid: boolean[][];
  private readonly width: number;
  private readonly height: number;
  /** itemId -> { row, col, w, h } for placed items (so we can remove by item) */
  private placed: Map<number, { row: number; col: number; w: number; h: number }> = new Map();

  constructor(width: number, height: number) {
    debug(TAG, 'constructor', { width, height });
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => Array(width).fill(false));
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /** Effective width/height for placement (accounts for rotation). */
  effectiveSize(item: ItemFootprint & { rotated?: boolean }, rotated = false): { w: number; h: number } {
    const useRotated = rotated ?? (item as Item & { rotated?: boolean }).rotated ?? false;
    return useRotated ? { w: item.height, h: item.width } : { w: item.width, h: item.height };
  }

  canPlace(
    item: ItemFootprint & { id?: number; rotated?: boolean },
    row: number,
    col: number,
    rotated = false
  ): boolean {
    const { w, h } = this.effectiveSize(item, rotated);
    const outOfBounds = row < 0 || col < 0 || row + h > this.height || col + w > this.width;
    if (outOfBounds) {
      debug(TAG, 'canPlace: out of bounds', { row, col, w, h });
      return false;
    }
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (this.grid[row + i]![col + j]!) {
          debug(TAG, 'canPlace: conflict', { row, col });
          return false;
        }
      }
    }
    debug(TAG, 'canPlace: ok', { row, col, w, h });
    return true;
  }

  placeItem(
    item: ItemFootprint & { id?: number; rotated?: boolean },
    row: number,
    col: number,
    rotated = false
  ): void {
    const { w, h } = this.effectiveSize(item, rotated);
    debug(TAG, 'placeItem', { itemId: item.id, row, col, rotated });
    if (!this.canPlace(item, row, col, rotated)) return;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.grid[row + i]![col + j]! = true;
      }
    }
    if (item.id != null) {
      this.placed.set(item.id, { row, col, w, h });
    }
  }

  removeItem(item: Item & { rotated?: boolean }): void {
    debug(TAG, 'removeItem', { itemId: item.id });
    const pos = this.placed.get(item.id);
    if (!pos) return;
    const { row, col, w, h } = pos;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.grid[row + i]![col + j]! = false;
      }
    }
    this.placed.delete(item.id);
  }

  /** 90° CCW: swap width and height. Returns new footprint. */
  rotateItem(item: ItemFootprint): { width: number; height: number } {
    return { width: item.height, height: item.width };
  }

  /** Bottom-left packing: clear grid, sort items by height desc then width desc, place row-by-row. */
  autoSort(items: (ItemFootprint & { id?: number })[]): { id?: number; row: number; col: number }[] {
    this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    this.placed.clear();
    const sorted = [...items].sort((a, b) => {
      const ah = a.height;
      const bh = b.height;
      if (bh !== ah) return bh - ah;
      return b.width - a.width;
    });
    const results: { id?: number; row: number; col: number }[] = [];
    let row = 0;
    let col = 0;
    for (const item of sorted) {
      let placed = false;
      for (let r = 0; r <= this.height - item.height && !placed; r++) {
        for (let c = 0; c <= this.width - item.width && !placed; c++) {
          if (this.canPlace(item, r, c, false)) {
            this.placeItem(item, r, c, false);
            results.push({ id: item.id, row: r, col: c });
            placed = true;
          }
        }
      }
      if (!placed) break;
    }
    return results;
  }

  /**
   * PALS/MOLLE: attach pouch to vest; integrity 1.0 if multiple strap points, else 0.5 (wobble risk).
   */
  attachPouch(
    _pouch: ItemFootprint & { id?: number },
    _vest: { gridWidth: number; gridHeight: number },
    rows: number[],
    cols: number[]
  ): { integrity: number } {
    const integrity = rows.length > 2 ? 1.0 : 0.5;
    debug(TAG, 'attachPouch', { strapPoints: rows.length, integrity });
    return { integrity };
  }

  /** In-memory preset name → placements (for loadout presets). Not persisted across restarts. */
  private static presets: Map<string, { id?: number; row: number; col: number; rotated?: boolean }[]> = new Map();

  savePreset(name: string, items: { id?: number; row: number; col: number; rotated?: boolean }[]): void {
    debug(TAG, 'savePreset', { name, count: items.length });
    GridEngine.presets.set(name, [...items]);
  }

  loadPreset(name: string): { id?: number; row: number; col: number; rotated?: boolean }[] {
    const items = GridEngine.presets.get(name) ?? [];
    debug(TAG, 'loadPreset', { name, count: items.length });
    return items;
  }

  /** Build engine from container dimensions and pre-place existing items (for validation/display). */
  static fromItems(
    width: number,
    height: number,
    items: (Item & { rotated?: boolean })[]
  ): GridEngine {
    debug(TAG, 'fromItems', { width, height, itemCount: items.length });
    const engine = new GridEngine(width, height);
    for (const item of items) {
      if (
        item.slotRow != null &&
        item.slotCol != null &&
        item.containerId != null &&
        !item.equipmentSlot
      ) {
        engine.placeItem(item, item.slotRow, item.slotCol, item.rotated ?? false);
      }
    }
    return engine;
  }
}
