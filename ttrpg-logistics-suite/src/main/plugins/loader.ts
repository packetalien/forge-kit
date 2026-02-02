import path from 'path';
import { readdir, readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import type { Express } from 'express';
import type { PluginManifest, PluginAPI } from '../../shared/types';

const hooks = new Map<string, ((...args: unknown[]) => void)[]>();

function registerHook(event: string, handler: (...args: unknown[]) => void): void {
  const list = hooks.get(event) ?? [];
  list.push(handler);
  hooks.set(event, list);
}

export function emit(event: string, ...args: unknown[]): void {
  const list = hooks.get(event);
  if (!list) return;
  list.forEach((fn) => {
    try {
      fn(...args);
    } catch {
      // ignore plugin errors
    }
  });
}

export async function loadPlugins(
  pluginsDir: string,
  expressApp: Express.Application
): Promise<void> {
  const api: PluginAPI = {
    registerHook,
    app: expressApp,
  };
  let entries: string[];
  try {
    entries = await readdir(pluginsDir, { withFileTypes: true })
      .then((dirs) => dirs.filter((d) => d.isDirectory()).map((d) => d.name));
  } catch {
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
    try {
      const module = await import(pathToFileURL(entryPath).href);
      const register = module.default?.register ?? module.register;
      if (typeof register === 'function') register(api);
    } catch {
      // skip broken plugins
    }
  }
}
