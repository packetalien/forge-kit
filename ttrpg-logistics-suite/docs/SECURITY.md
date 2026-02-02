# Security

## Policy

- Context isolation is enabled; no `nodeIntegration` in renderer.
- Preload exposes only `electronAPI.ping` via `contextBridge`.
- Local API listens on 127.0.0.1 (port 38462); not exposed to network by default.
- Credentials: if API keys are added later, use `~/.secrets` (see project credential-management rule).

## Audit

- **Initial:** Electron v33+, context isolation, CSP in index.html. No known critical CVEs for stack in use.
- **Phase 2:** WebGPU used in renderer with context isolation; GPU buffers are renderer-scoped only. No new vulns from grid/DnD (placement validated server-side via GridEngine).
- **2026-02 (dep/vuln audit):**
  - **Electron:** Bumped to ^35.7.5 to address GHSA-vmqv-hx8q-j7mg (ASAR integrity bypass). Tahoe: v39+ recommended when available.
  - **esbuild:** Added package.json override `"esbuild": "^0.25.0"` to fix GHSA-67mh-4wv8-2f99 (dev server CORS / request forging). Vite 5.x kept; override forces patched esbuild.
  - **tar / Electron Forge chain:** High vulns in node-tar (GHSA-8qq5-rm4j-mr97, etc.) are in indirect deps (@electron/node-gyp, @electron-forge). No fix available without downgrading sqlite3 or upgrading entire Forge stack; risk is build-time only (npm install), not runtime. Monitor for Forge/electron updates.
  - **tmp / inquirer:** tmp ≤0.2.3 vuln (GHSA-52f5-9888-hmc6) in @inquirer/prompts chain; no fix available from audit fix. Low runtime impact (editor prompts).
  - **db/setup.ts:** Refactored to remove callback-async anti-pattern: open DB in a pure Promise, then run migrations in .then(). No async inside sqlite3 callback.
  - **migrate.ts:** Migration SQL is trusted (repo .sql files only); no user input. Documented in code.
- Append new findings and mitigations below.

## Best Practices

- Keep Electron and dependencies updated.
- Do not disable webSecurity or contextIsolation.
- Run `npm audit` before releases.

---
## Audit 2026-02-02

# npm audit report

tar  <=7.5.6
Severity: high
node-tar is Vulnerable to Arbitrary File Overwrite and Symlink Poisoning via Insufficient Path Sanitization - https://github.com/advisories/GHSA-8qq5-rm4j-mr97
Race Condition in node-tar Path Reservations via Unicode Ligature Collisions on macOS APFS - https://github.com/advisories/GHSA-r6q2-hw4h-h46w
node-tar Vulnerable to Arbitrary File Creation/Overwrite via Hardlink Path Traversal - https://github.com/advisories/GHSA-34x7-hfp2-rc4v
No fix available
node_modules/tar
  @electron/node-gyp  *
  Depends on vulnerable versions of make-fetch-happen
  Depends on vulnerable versions of tar
  node_modules/@electron/node-gyp
    @electron/rebuild  3.2.10 - 4.0.2
    Depends on vulnerable versions of @electron/node-gyp
    Depends on vulnerable versions of tar
    node_modules/@electron/rebuild
      @electron-forge/core  *
      Depends on vulnerable versions of @electron-forge/core-utils
      Depends on vulnerable versions of @electron-forge/maker-base
      Depends on vulnerable versions of @electron-forge/plugin-base
      Depends on vulnerable versions of @electron-forge/publisher-base
      Depends on vulnerable versions of @electron-forge/shared-types
      Depends on vulnerable versions of @electron-forge/template-base
      Depends on vulnerable versions of @electron-forge/template-vite
      Depends on vulnerable versions of @electron-forge/template-vite-typescript
      Depends on vulnerable versions of @electron-forge/template-webpack
      Depends on vulnerable versions of @electron-forge/template-webpack-typescript
      Depends on vulnerable versions of @electron/rebuild
      node_modules/@electron-forge/core
        @electron-forge/cli  *
        Depends on vulnerable versions of @electron-forge/core
        Depends on vulnerable versions of @electron-forge/core-utils
        Depends on vulnerable versions of @electron-forge/shared-types
        Depends on vulnerable versions of @inquirer/prompts
        node_modules/@electron-forge/cli
      @electron-forge/core-utils  *
      Depends on vulnerable versions of @electron-forge/shared-types
      Depends on vulnerable versions of @electron/rebuild
      node_modules/@electron-forge/core-utils
        @electron-forge/template-base  *
        Depends on vulnerable versions of @electron-forge/core-utils
        Depends on vulnerable versions of @electron-forge/shared-types
        node_modules/@electron-forge/template-base
      @electron-forge/shared-types  *
      Depends on vulnerable versions of @electron/rebuild
      node_modules/@electron-forge/shared-types
        @electron-forge/maker-base  *
        Depends on vulnerable versions of @electron-forge/shared-types
        node_modules/@electron-forge/maker-base
        @electron-forge/plugin-base  *
        Depends on vulnerable versions of @electron-forge/shared-types
        node_modules/@electron-forge/plugin-base
        @electron-forge/plugin-vite  *
        Depends on vulnerable versions of @electron-forge/plugin-base
        Depends on vulnerable versions of @electron-forge/shared-types
        node_modules/@electron-forge/plugin-vite
        @electron-forge/publisher-base  *
        Depends on vulnerable versions of @electron-forge/shared-types
        node_modules/@electron-forge/publisher-base
        @electron-forge/template-vite  *
        Depends on vulnerable versions of @electron-forge/shared-types
        Depends on vulnerable versions of @electron-forge/template-base
        node_modules/@electron-forge/template-vite
        @electron-forge/template-vite-typescript  *
        Depends on vulnerable versions of @electron-forge/shared-types
        Depends on vulnerable versions of @electron-forge/template-base
        node_modules/@electron-forge/template-vite-typescript
        @electron-forge/template-webpack  *
        Depends on vulnerable versions of @electron-forge/shared-types
        Depends on vulnerable versions of @electron-forge/template-base
        node_modules/@electron-forge/template-webpack
        @electron-forge/template-webpack-typescript  *
        Depends on vulnerable versions of @electron-forge/shared-types
        Depends on vulnerable versions of @electron-forge/template-base
        node_modules/@electron-forge/template-webpack-typescript
  cacache  14.0.0 - 18.0.4
  Depends on vulnerable versions of tar
  node_modules/cacache
  node_modules/node-gyp/node_modules/cacache

### Outdated
Package               Current   Wanted   Latest  Location                           Depended by
@types/node           22.19.7  22.19.7   25.2.0  node_modules/@types/node           ttrpg-logistics-suite
@types/react          18.3.27  18.3.27  19.2.10  node_modules/@types/react          ttrpg-logistics-suite
@types/react-dom       18.3.7   18.3.7   19.2.3  node_modules/@types/react-dom      ttrpg-logistics-suite
@vitejs/plugin-react    4.7.0    4.7.0    5.1.2  node_modules/@vitejs/plugin-react  ttrpg-logistics-suite
@vitest/coverage-v8     2.1.9    2.1.9   4.0.18  node_modules/@vitest/coverage-v8   ttrpg-logistics-suite
electron               35.7.5   35.7.5   40.1.0  node_modules/electron              ttrpg-logistics-suite
express                4.22.1   4.22.1    5.2.1  node_modules/express               ttrpg-logistics-suite
jsdom                  25.0.1   25.0.1   28.0.0  node_modules/jsdom                 ttrpg-logistics-suite
react                  18.3.1   18.3.1   19.2.4  node_modules/react                 ttrpg-logistics-suite
react-dom              18.3.1   18.3.1   19.2.4  node_modules/react-dom             ttrpg-logistics-suite
tailwindcss            3.4.19   3.4.19   4.1.18  node_modules/tailwindcss           ttrpg-logistics-suite
vite                   5.4.21   5.4.21    7.3.1  node_modules/vite                  ttrpg-logistics-suite
vitest                  2.1.9    2.1.9   4.0.18  node_modules/vitest                ttrpg-logistics-suite
zustand                 4.5.7    4.5.7   5.0.11  node_modules/zustand               ttrpg-logistics-suite
