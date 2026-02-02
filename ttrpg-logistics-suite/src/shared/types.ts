export interface Location {
  id: number;
  name: string;
  type: 'person' | 'cabin' | 'apartment' | 'other';
}

export interface Container {
  id: number;
  locationId: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  type: 'backpack' | 'rig' | 'pocket' | 'locker' | 'alchemist_case' | 'other';
  volume_limit?: number | null;
}

export interface Item {
  id: number;
  name: string;
  width: number;
  height: number;
  left: number;
  right: number;
  parentId?: number | null;
  containerId: number | null;
  /** When equipped: main_hand, off_hand, back, torso, belt, etc. */
  equipmentSlot: string | null;
  slotRow: number | null;
  slotCol: number | null;
  /** 90° CCW rotation: effective footprint becomes height×width (DB: 0/1) */
  rotated?: boolean | number;
}

export interface GridCell {
  x: number;
  y: number;
  occupied: boolean;
  itemId?: number;
}

/** Equipment slot keys for POST /character/equip */
export const EQUIPMENT_SLOTS = [
  'main_hand',
  'off_hand',
  'back',
  'torso',
  'belt',
  'quick_1',
  'quick_2',
] as const;
export type EquipmentSlotKey = (typeof EQUIPMENT_SLOTS)[number];

/** Alchemy: 2D vector on effect grid */
export interface Vector {
  x: number;
  y: number;
}

/** Ingredient with vector, quality (0–1), and mutation flag */
export interface Ingredient {
  name: string;
  vector: Vector;
  quality: number;
  mutable: boolean;
}

/** Effect node on the synthesis grid (proximity-based) */
export interface EffectNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
}

/** Discovered recipe stored in Discovery Book */
export interface DiscoveryRecipe {
  name: string;
  ingredients: string[];
  position: Vector;
  effectNodes: string[];
  discoveredAt: number;
}

/** Plugin manifest (e.g. plugin.json or package.json "plugin" field) */
export interface PluginManifest {
  name: string;
  version: string;
  apiVersion: string;
  main?: string;
}

/** API passed to plugins on register(); app is Express.Application in main */
export interface PluginAPI {
  registerHook: (event: string, handler: (...args: unknown[]) => void) => void;
  app: unknown;
}

/** GURPS 4e: definition (master library) */
export interface ItemDefinition {
  id: number;
  name: string;
  weight: number;
  volume: number;
  tl: number;
  lc: number;
  malf: number;
}

/** GURPS 4e: instance (owned item with parent_id for adjacency / recursive CTE) */
export interface ItemInstance {
  id: number;
  def_id: number;
  parent_id: number | null;
  quantity: number;
  quality: number;
  state: string;
  condition: number;
}

/** GURPS 4e: attachment slot (MOLLE/Rail/Holster) */
export interface Attachment {
  id: number;
  parent_id: number;
  slot_type: string;
}
