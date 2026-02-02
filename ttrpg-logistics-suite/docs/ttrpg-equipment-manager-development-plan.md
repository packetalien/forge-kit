# Technical Architecture and Implementation Roadmap for a High-Fidelity TTRPG Logistics and Equipment Management Suite

**Table of Contents**
- [Overview](#overview)
- [macOS Tahoe and Framework Selection](#the-macos-tahoe-ecosystem-and-framework-selection)
- [Data Modeling](#data-modeling-for-hyper-detailed-gear-management)
- [Crafting and Alchemy Engine](#the-crafting-and-alchemy-engine-procedural-synthesis)
- [Specialized Gear](#specialized-gear-for-the-drow-special-operator)
- [UI/UX Design](#uiux-design-the-liquid-glass-tactical-interface)
- [API and GM Controls](#api-gm-controls-and-extensibility)
- [Project Plan (Phases 1–4)](#project-plan-for-cursor-ai-agentic-development)
- [Technical Deep Dive](#technical-deep-dive-the-logistics-of-the-drow-special-operator)
- [Glossary](#glossary)
- [Index](#index)

---

## Overview

The development of a specialized tabletop roleplaying game (TTRPG) equipment manager for the macOS Tahoe environment represents a shift from list-based inventory to a high-fidelity, simulation-centric model. For a character such as a Drow Special Operator, effectiveness depends on precise deployment of gadgets, alchemical reagents, and tactical gear. The requirement for "pedantic" detail implies a multi-scalar approach: spatial orientation on the character's person is managed with the same rigor as long-term storage in a ship's cabin or urban safehouse. The application integrates volumetric grid-based storage and nested container hierarchies to bridge logistical complexity and tactical gameplay.

## The macOS Tahoe Ecosystem and Framework Selection

### Stability of Electron on macOS 26 Tahoe

macOS Tahoe (version 26) introduced the "Liquid Glass" visual language. Early Tahoe development was affected by a performance bug in Electron apps due to use of private AppKit APIs (e.g. `_cornerMask`), causing WindowServer GPU spikes. macOS 26.2 and Electron v39 addressed these issues. Electron remains the chosen shell for high-performance web tech, Node.js ecosystem, and WebGPU in the renderer.

### Architectural Comparison

| Attribute | Native Swift (Metal) | Electron (WebGPU/Metal 4) |
|-----------|----------------------|---------------------------|
| UI | SwiftUI / AppKit | HTML5 / CSS3 / Liquid Glass |
| 3D API | Metal 4 Native | WebGPU (mapped to Metal) |
| Extensibility | Dynamic Libraries | ES Modules / Plugins |
| AI Agent Compatibility | High | Very High (Cursor optimized) |

WebGPU maps to Metal, Vulkan, and D3D12 and supports GPGPU for crafting simulations and rendering many gear items without single-threaded bottlenecks.

## Data Modeling for Hyper-Detailed Gear Management

### Relational Hierarchy and Nested Containers

Items are tracked in three primary states: **equipped**, **carried (nested)**, and **archived (remote)**. The app uses a **Nested Set Model** in SQLite: left and right integer markers allow retrieval of an entire hierarchy in one query. For a parent location (e.g. Ship's Cabin), all descendant items satisfy the interval condition: parent.left < item.left AND item.right < parent.right.

### Volumetric Grid (Tetris-Style) Inventory

Every item has a footprint (width × height) on a 2D grid. Containers have fixed dimensions:

| Container Type | Grid (W×H) | Constraints |
|----------------|------------|-------------|
| Tactical Rig | 8×6 | Slot-locked for magazines/tools |
| Main Backpack | 10×12 | Nested containers allowed |
| Secret Pockets | 2×1 | Hidden from inspection |
| Ship Locker | 20×20 | Static, no weight limit |
| Alchemist Case | 6×4 | Fragile items only |

Implementation uses a 2D boolean array or bitmask; drag-and-drop checks footprint and collisions; rotation swaps width/height and applies 90° CCW.

## The Crafting and Alchemy Engine: Procedural Synthesis

### Grid-Based Alchemical Synthesis

A "Coordinate Grid Synthesis" model: ingredients act as vectors. A base liquid (water, oil, mercury) sets a starting point on a 2D effect grid; adding ingredients moves the synthesis point by a vector. Final effect is determined by proximity to Effect Nodes. Tools (Alembic, Mortar and Pestle) can modify vectors (e.g. decompose into cardinal components, or double magnitude at cost of stability).

### Ingredient Mutation and Quality

Quality and mutation layer: ingredients vary by source (e.g. Underdark). Crafters can mutate ingredients for extra effects or to cancel toxicity. Instance metadata in the DB distinguishes e.g. "High-Potency Deathcap" from a standard specimen.

## Specialized Gear for the Drow Special Operator

Tactical items include Piwafwi (cloak), Spidersilk Armor, Tentacle Rod, Flash Globe, Hand Crossbow—each with slot/position constraints. Quick-Access slots and HUD overlay map holsters/belt loops to hotkeys. Treasure is physical: coinage as slot/dot tracking; gems/jewelry with high-resolution 3D previews.

## UI/UX Design: The Liquid Glass Tactical Interface

HUD-centric design: refractive translucency (Liquid Glass), dynamic viewports linking body parts to grid slots, tactical overlays (Noise Level, Visibility Index, Toxic Load). Accessibility: minimal cognitive load, Tahoe Magnifier, braille display support for formulas.

## API, GM Controls, and Extensibility

### Local REST API and IPC

Electron main hosts a server on localhost; renderer uses Context Isolation and preload for security.

**Key API Endpoints:**
- **GET /character/inventory** — JSON tree of all items and nested locations
- **POST /character/equip** — Equip item with slot conflict checks
- **GET /crafting/recipes** — Discovered alchemical combinations
- **WS /gm/sync** — WebSocket for real-time GM state sync

### GM Controls and LAN Sync

"Shadow Terminal" for the GM: state synchronization over LAN; GM can push items, damage gear, trigger environment effects (e.g. Adamantine Degradation). Snapshot model: server broadcasts state only when changes occur.

## Project Plan for Cursor AI Agentic Development

### Phase 1: Foundational Systems (Weeks 1–3)
1. Environment: Electron-Vite-React-Tailwind; Tahoe vibrancy and transparent title bar
2. Database: SQLite Nested Set Model; migrations for locations, containers, items
3. Local API: Express in main process; GET/POST for inventory management

### Phase 2: Grid and Volumetric UI (Weeks 4–6)
1. Grid logic: TypeScript 2D grid engine (canPlace, rotateItem, autoSort)
2. WebGPU: pipeline and shaders for gear icons with Liquid Glass effects
3. Drag-and-drop: custom DnD handler wired to grid logic

### Phase 3: Alchemy and Crafting (Weeks 7–9)
1. Synthesis engine: vector-based alchemical calculation; Discovery Book (JSON) for recipes
2. Crafting UI: interactive alchemy bench
3. Ingredient database: Underdark reagents and alchemical vectors

### Phase 4: Logistics, GM Tools, Polish (Weeks 10–12)
1. Multi-Location Hub: World View (ship cabin, town apartment)
2. GM WebSocket sync: LAN sync layer; lightweight GM Dashboard
3. Extensibility: plugin loader (ESM dynamic imports), PluginManifest, API hooks

## Technical Deep Dive: The Logistics of the Drow Special Operator

- **Quartermaster's Apartment / Ship's Cabin:** High-capacity static grids; "Logistical Fetch" with time-based transit delay by in-game distance.
- **Adamantine and Sunlight:** Environment Watcher; when GM sets "Sunlight," decay function applies to drowcraft item integrity; UI shows "Degradation Flare."
- **Treasure and Valuation:** Valuation Engine for regional prices; regional arbitrage display (e.g. gem value surface vs. Menzoberranzan).

## Glossary

- **Nested Set Model** — Hierarchy stored with left/right integer markers for efficient subtree queries.
- **Liquid Glass** — macOS Tahoe visual language (refractive translucency).
- **WebGPU** — Modern GPU API mapping to Metal/Vulkan/D3D12.
- **Effect Node** — Point on alchemy grid defining a potion effect.
- **Snapshot (sync)** — State broadcast only when changes occur.

## Index

- [Architecture](./ARCHITECTURE.md) | [Security](./SECURITY.md) | [README](../README.md) | [ROADMAP](../ROADMAP.md)
- Data modeling: Nested Set, Volumetric Grid
- API: /character/inventory, /character/equip, /crafting/recipes, WS /gm/sync
- Phases: 1 (Foundation), 2 (Grid/WebGPU), 3 (Alchemy), 4 (Logistics/GM/Plugins)
