import { describe, it, expect } from 'vitest';
import {
  refineReagent,
  startBrew,
  getBrewStatus,
  setBrewAttendHours,
  clearBrew,
} from '../../src/shared/alchemyEngine';

describe('AlchemyEngine', () => {
  it('refineReagent returns purity in [0, 1]', () => {
    const reagent = { name: 'Deathcap', vector: { x: 1, y: 0 }, quality: 0.5, mutable: false };
    const result = refineReagent(reagent, 5);
    expect(result.purity).toBeGreaterThanOrEqual(0);
    expect(result.purity).toBeLessThanOrEqual(1);
  });

  it('startBrew and getBrewStatus return state', () => {
    clearBrew();
    expect(getBrewStatus()).toBeNull();
    startBrew('healing-potion', 3600000);
    const status = getBrewStatus();
    expect(status).not.toBeNull();
    expect(status!.state).toBe('active');
    expect(status!.recipe).toBe('healing-potion');
    setBrewAttendHours(8);
    const s2 = getBrewStatus();
    expect(s2!.attendHours).toBe(8);
    clearBrew();
    expect(getBrewStatus()).toBeNull();
  });
});
