import type { Ingredient } from './types';

/** Underdark and common reagents with vector, quality, and mutation flag (Phase 3) */
export const UNDERDARK_INGREDIENTS: Ingredient[] = [
  { name: 'High-Potency Deathcap', vector: { x: 2, y: -1 }, quality: 0.8, mutable: true },
  { name: 'Standard Deathcap', vector: { x: 1, y: -1 }, quality: 0.5, mutable: false },
  { name: 'Faerzress Dust', vector: { x: -1, y: 2 }, quality: 0.9, mutable: true },
  { name: 'Drow Poison Sac', vector: { x: -2, y: 0 }, quality: 0.7, mutable: false },
  { name: 'Cave Moss', vector: { x: 0, y: 1 }, quality: 0.3, mutable: true },
  { name: 'Glow Lichen', vector: { x: 1, y: 1 }, quality: 0.4, mutable: false },
  { name: 'Deep Root', vector: { x: -1, y: -1 }, quality: 0.6, mutable: true },
  { name: 'Spider Venom', vector: { x: 2, y: 0 }, quality: 0.8, mutable: false },
  { name: 'Mushroom Cap', vector: { x: 0, y: 2 }, quality: 0.5, mutable: true },
  { name: 'Sulfur Crystals', vector: { x: -2, y: 1 }, quality: 0.7, mutable: false },
  { name: 'Quicksilver Droplet', vector: { x: 1, y: -2 }, quality: 0.9, mutable: true },
  { name: 'Nightshade Berry', vector: { x: -1, y: 2 }, quality: 0.6, mutable: true },
  { name: 'Bone Ash', vector: { x: 0, y: -2 }, quality: 0.4, mutable: false },
  { name: 'Witherweed', vector: { x: 2, y: 1 }, quality: 0.5, mutable: true },
  { name: 'Bloodroot', vector: { x: 1, y: 0 }, quality: 0.7, mutable: false },
  { name: 'Shadowgrass', vector: { x: -1, y: 0 }, quality: 0.6, mutable: true },
  { name: 'Iron Filings', vector: { x: 0, y: -1 }, quality: 0.2, mutable: false },
  { name: 'Silver Dust', vector: { x: -2, y: -1 }, quality: 0.8, mutable: false },
  { name: 'Wyvern Stinger', vector: { x: 2, y: 2 }, quality: 0.9, mutable: false },
  { name: 'Pixie Dust', vector: { x: 1, y: 2 }, quality: 0.5, mutable: true },
];
