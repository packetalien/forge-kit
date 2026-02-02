import path from 'path';
import { readdir, readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import type { Express } from 'express';
import type { PluginManifest, PluginAPI } from '../../shared/types';
import { debug, warn } from '../../shared/logger';

const TAG = 'Plugins';
const hooks = new Map<string, ((...args: unknown[]) => void)[]>();

function registerHook(event: string, handler: (...args: unknown[]) => void): void {
  const list = hooks.get(event) ?? [];
  list.push(handler);
  hooks.set(event, list);
  debug(TAG, 'registerHook', { event, handlers: list.length });
}

export function emit(event: string, ...args: unknown[]): void {
  const list = hooks.get(event);
  debug(TAG, 'emit', { event, handlers: list?.length ?? 0 });
  if (!list) return;
  list.forEach((fn) => {
    try {
      fn(...args);
    } catch (e) {
      warn(TAG, 'emit handler error', { event, error: e });
    }
  });
}

export async function loadPlugins(
  pluginsDir: string,
  expressApp: Express.Application
): Promise<void> {
  debug(TAG, 'loadPlugins', { pluginsDir });
  const api: PluginAPI = {
    registerHook,
    app: expressApp,
  };
  let entries: string[];
  try {
    entries = await readdir(pluginsDir, { withFileTypes: true })
      .then((dirs) => dirs.filter((d) => d.isDirectory()).map((d) => d.name));
    debug(TAG, 'loadPlugins: dirs', entries);
  } catch (e) {
    debug(TAG, 'loadPlugins: readdir failed', e);
    return;
  }
  for (const name of entries) {
    const pluginPath = path.join(pluginsDir, name);
    let manifest: PluginManifest | null = null;
    try {
      const manifestPath = path.join(pluginPath, 'manifest.json');
      const raw = await readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(raw) as PluginManifest;
    } catch {
      try {
        const pkgPath = path.join(pluginPath, 'package.json');
        const raw = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw) as { plugin?: PluginManifest; main?: string };
        if (pkg.plugin) manifest = { ...pkg.plugin, main: pkg.plugin.main ?? pkg.main ?? 'index.js' };
      } catch {
        continue;
      }
    }
    if (!manifest?.name) continue;
    const mainFile = manifest.main ?? 'index.js';
    const entryPath = path.join(pluginPath, mainFile);
    debug(TAG, 'loadPlugins: loading', { name: manifest.name, entryPath });
    try {
      const module = await import(pathToFileURL(entryPath).href);
      const register = module.default?.register ?? module.register;
      if (typeof register === 'function') {
        register(api);
        debug(TAG, 'loadPlugins: registered', manifest.name);
      }
    } catch (e) {
      warn(TAG, 'loadPlugins: skip broken plugin', { name: manifest.name, error: e });
    }
  }
  debug(TAG, 'loadPlugins: complete');
}
