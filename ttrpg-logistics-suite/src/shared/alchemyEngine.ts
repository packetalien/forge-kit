import type { Ingredient } from './types';
import { debug } from './logger';

const TAG = 'AlchemyEngine';

/** GURPS-style: refine reagent (skill roll simulation); purity += 0.2 on success. */
export function refineReagent(
  reagent: Ingredient,
  skill: number
): { purity: number } {
  const roll = Math.random() * 10;
  const success = roll <= Math.min(9, skill);
  const purity = (reagent.quality ?? 0.5) + (success ? 0.2 : 0);
  const result = { purity: Math.min(1, purity) };
  debug(TAG, 'refineReagent', { name: reagent.name, skill, success, purity: result.purity });
  return result;
}

/** State-based brewing: preparation | active | refinement | completion */
export type BrewState = 'preparation' | 'active' | 'refinement' | 'completion';

let currentBrew: { recipe: string; startedAt: number; attendHours: number } | null = null;

export function startBrew(recipe: string, timeMs: number): void {
  debug(TAG, 'startBrew', { recipe, timeMs });
  currentBrew = {
    recipe,
    startedAt: Date.now(),
    attendHours: 0,
  };
}

export function getBrewStatus(): { state: BrewState; recipe?: string; startedAt?: number; attendHours?: number } | null {
  if (!currentBrew) return null;
  debug(TAG, 'getBrewStatus', { recipe: currentBrew.recipe });
  const elapsed = (Date.now() - currentBrew.startedAt) / (1000 * 60 * 60);
  let state: BrewState = 'active';
  if (elapsed >= 1) state = 'refinement';
  if (currentBrew.attendHours >= 8 && elapsed >= 1) state = 'completion';
  return {
    state,
    recipe: currentBrew.recipe,
    startedAt: currentBrew.startedAt,
    attendHours: currentBrew.attendHours,
  };
}

export function setBrewAttendHours(hours: number): void {
  debug(TAG, 'setBrewAttendHours', { hours });
  if (currentBrew) currentBrew.attendHours = hours;
}

export function clearBrew(): void {
  debug(TAG, 'clearBrew');
  currentBrew = null;
}
