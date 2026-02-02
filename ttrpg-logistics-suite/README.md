# TTRPG Logistics Suite

High-fidelity gear manager for TTRPGs on macOS Tahoe. Electron + WebGPU + SQLite (Nested Set Model), grid inventory, alchemy engine, local API, and GM sync.

## Quick Start

```bash
npm install && npm start
```

Or use the setup script (zsh):

```bash
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

## Stack

- **Electron** (v33+; use v39+ when available for Tahoe fixes) — main process (API, DB, IPC)
- **Vite + React + Tailwind** — renderer
- **SQLite** — Nested Set Model for hierarchical inventory
- **WebGPU** — grid/shaders (Phase 2)
- **Zustand** — client state

## Scripts

| Script           | Description              |
|------------------|--------------------------|
| `npm start`      | Run app (Electron Forge) |
| `npm run test`   | Unit/integration (Vitest)|
| `npm run test:coverage` | Coverage report   |
| `npm run e2e`    | Playwright e2e           |
| `npm run make`   | Package for macOS        |

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [Index](./INDEX.md)

## Roadmap

- **Phase 1:** API + DB (Nested Set) — done
- **Phase 2:** Grid logic + WebGPU shaders
- **Phase 3:** Alchemy / vector synthesis
- **Phase 4:** GM sync (WebSocket)

## Repo Note

This project fits under **baker-street-ai** (max 9 repos). If integrating into baker-street-ai, add `ttrpg-logistics-suite: Electron-based TTRPG tool; depends on SQLite, WebGPU` to parent `./docs/dependencies.md`.
