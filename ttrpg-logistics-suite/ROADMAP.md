# Roadmap

**Table of Contents**
- [Next Quarter (Phases 1–4)](#next-quarter-phases-14)
- [Phase 1: Foundational Systems](#phase-1-foundational-systems-weeks-1-3)
- [Phase 2: Grid and Volumetric UI](#phase-2-the-grid-and-volumetric-ui-weeks-4-6)
- [Phase 3: Alchemy and Crafting](#phase-3-alchemy-and-crafting-weeks-7-9)
- [Phase 4: Logistics, GM Tools, Polish](#phase-4-logistics-gm-tools-and-polish-weeks-10-12)
- [Backlog](#backlog)
- [Completed](#completed)
- [Glossary](#glossary)
- [Index](#index)

## Next Quarter (Phases 1–4)

1. **Phase 1** — Environment, DB (Nested Set + locations/containers/items), Local API (GET/POST inventory, GET character/inventory tree, POST character/equip).
2. **Phase 2** — Grid logic (canPlace, rotateItem, autoSort), WebGPU pipeline and Liquid Glass shaders, drag-and-drop.
3. **Phase 3** — Synthesis engine, Discovery Book, alchemy bench UI, ingredient database.
4. **Phase 4** — World View (multi-location), GM WebSocket sync, GM Dashboard, plugin loader (ESM, PluginManifest).

## Phase 1: Foundational Systems (Weeks 1–3)

| # | Task | Status |
|---|------|--------|
| 1 | Environment: Electron-Vite-React-Tailwind; Tahoe vibrancy and transparent title bar | Done |
| 2 | Database: SQLite Nested Set; migrations for **locations**, **containers**, **items** | Done |
| 3 | Local API: Express GET/POST for inventory; **GET /character/inventory** (tree); **POST /character/equip** (slot checks) | Done |

## Phase 2: The Grid and Volumetric UI (Weeks 4–6)

| # | Task | Status |
|---|------|--------|
| 1 | Grid logic: TypeScript 2D grid engine (canPlace, rotateItem, autoSort) | Backlog |
| 2 | WebGPU: Initialize pipeline; shader for gear icons with Liquid Glass (refraction/depth) | Backlog |
| 3 | Drag-and-drop: Custom DnD handler wired to grid logic | Backlog |

## Phase 3: Alchemy and Crafting (Weeks 7–9)

| # | Task | Status |
|---|------|--------|
| 1 | Synthesis engine: Vector-based alchemical calculation; Discovery Book (JSON) for recipes | Backlog |
| 2 | Crafting UI: Interactive alchemy bench | Backlog |
| 3 | Ingredient database: Underdark reagents and alchemical vectors | Backlog |

## Phase 4: Logistics, GM Tools, and Polish (Weeks 10–12)

| # | Task | Status |
|---|------|--------|
| 1 | Multi-Location Hub: World View (ship cabin, town apartment) | Backlog |
| 2 | GM WebSocket sync: LAN sync layer; lightweight GM Dashboard | Backlog |
| 3 | Extensibility: Plugin loader (ESM dynamic imports), PluginManifest, API hooks | Backlog |

## Backlog

- Quick-Access slots and HUD overlay
- Treasure/valuation engine and regional arbitrage
- Adamantine degradation (Environment Watcher)
- Logistical Fetch with time-based transit

## Completed

- Electron-Vite-React-Tailwind setup
- SQLite items table with Nested Set (left/right)
- **Migrations:** locations, containers, items (containerId, equipmentSlot, slotRow, slotCol)
- Express API: GET/POST /api/inventory; **GET /character/inventory** (tree + equipped); **POST /character/equip** (slot conflict checks)
- Basic window with WebGPU prefs and Tahoe vibrancy option
- Shared types (Location, Container, Item, EQUIPMENT_SLOTS) and grid placement helpers
- Unit and integration tests; Playwright e2e scaffold

## Glossary

- **Nested Set** — Hierarchy model with left/right markers for subtree queries.
- **Liquid Glass** — macOS Tahoe UI material (refractive translucency).
- **Discovery Book** — JSON store for discovered alchemical recipes.
- **PluginManifest** — Declared API and metadata for ESM plugins.

## Index

- [Development Plan](./docs/ttrpg-equipment-manager-development-plan.md) | [Architecture](./docs/ARCHITECTURE.md) | [Security](./docs/SECURITY.md) | [README](./README.md) | [INDEX](./INDEX.md)
