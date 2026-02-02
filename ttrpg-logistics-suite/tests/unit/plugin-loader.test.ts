import { describe, it, expect } from 'vitest';
import { loadPlugins, emit } from '../../src/main/plugins/loader';

describe('Plugin loader', () => {
  it('emit with no handlers does not throw', () => {
    emit('onItemCreate', { id: 1, name: 'Test' });
  });

  it('loadPlugins with nonexistent dir resolves', async () => {
    const mockApp = {};
    await expect(
      loadPlugins('/nonexistent-plugins-dir-12345', mockApp as any)
    ).resolves.toBeUndefined();
  });
});
