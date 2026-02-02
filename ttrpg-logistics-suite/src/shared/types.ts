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
