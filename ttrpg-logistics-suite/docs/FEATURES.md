# Features

**Table of Contents**
- [Overview](#overview)
- [Inventory and Character Management](#inventory-and-character-management)
- [Volumetric Grid Engine](#volumetric-grid-engine)
- [WebGPU and Liquid Glass](#webgpu-and-liquid-glass)
- [Drag-and-Drop](#drag-and-drop)
- [Alchemy and Crafting](#alchemy-and-crafting)
- [World View (Multi-Location Hub)](#world-view-multi-location-hub)
- [GM WebSocket Sync and GM Dashboard](#gm-websocket-sync-and-gm-dashboard)
- [Plugin System](#plugin-system)
- [REST API Reference](#rest-api-reference)
- [Planned and Backlog](#planned-and-backlog)
- [Glossary](#glossary)
- [Index](#index)

---

## Overview

The **TTRPG Logistics Suite** is a high-fidelity tabletop roleplaying game equipment and logistics manager built for macOS Tahoe. It shifts from simple list-based inventory to a simulation-centric model: items live in a **Nested Set** hierarchy, occupy **volumetric grids** inside containers, can be **equipped** to character slots, and are tracked across **multiple locations** (person, ship cabin, town apartment). The app includes a **vector-based alchemy** system for potion synthesis, **WebSocket-based GM sync** for LAN play, and an **ESM plugin loader** for extensibility. The UI is organized into tabs: **Inventory**, **Alchemy Bench**, **World View**, and **GM Dashboard**, with state managed by Zustand and visuals optionally enhanced by WebGPU and a Liquid Glass–style shader.

---

## Inventory and Character Management

### Nested Set Model

All items are stored in SQLite using a **Nested Set Model**. Each item has integer **left** and **right** markers; descendants have `left` and `right` strictly between their parent’s values. This allows subtree queries (e.g. “everything in this container”) with simple range conditions and a single query, without recursive CTEs. The hierarchy supports nested containers (e.g. a box inside a backpack) and is used when building the full **character inventory tree** returned by the API.

### Locations and Containers

- **Locations** are top-level places where gear can live: **Person** (on the character), **Ship’s Cabin**, and **Town Apartment**. Each has an id, name, and type (`person`, `cabin`, `apartment`, `other`). They are seeded by migrations and can be listed via **GET /locations**.
- **Containers** belong to a location and have a **grid** (width × height). Types include `backpack`, `rig`, `pocket`, `locker`, `alchemist_case`, and `other`. Default seeds: Person → Main Backpack (10×12); Ship’s Cabin → Ship Locker (20×20); Town Apartment → Apartment Storage (12×12). Each container’s dimensions define how many grid cells are available for item placement.

### Items

Items have: **name**, **width**, **height** (footprint on the grid), **left/right** (nested set), **parentId** (optional parent item), **containerId** (which container they are in, or null when equipped), **equipmentSlot** (when equipped: e.g. `main_hand`, `off_hand`, `back`, `torso`, `belt`, `quick_1`, `quick_2`), **slotRow**, **slotCol** (grid position inside the container), and **rotated** (90° counter-clockwise rotation; effective footprint becomes height×width). Items can be created via **POST /api/inventory** and are then placed in a container or equipped.

### Equipping

**POST /character/equip** accepts `itemId` and `slot`. The API checks that the slot is one of the allowed **EQUIPMENT_SLOTS** and that no other item already occupies that slot; on success it updates the item (sets `containerId` to null, `equipmentSlot` to the given slot, and clears grid position). Equipped items appear in the **equipped** array of the character inventory response and are excluded from container trees. Slot conflicts return HTTP 409.

### Character Inventory Tree

**GET /character/inventory** returns a single payload: **tree** (array of locations, each with an array of containers, each with a nested **item tree** built from the Nested Set), and **equipped** (flat list of items that have an `equipmentSlot`). The tree is used by the Inventory tab (first location’s first container by default) and by the World View (all locations and their containers). This same structure is used for **GM sync snapshots** (see below).

---

## Volumetric Grid Engine

### GridEngine

The **GridEngine** (`src/shared/gridEngine.ts`) manages a 2D boolean grid for one container: each cell is either occupied or free. It is used to validate placement before writing to the database.

- **canPlace(item, row, col, rotated)** — Returns whether the item’s footprint (accounting for rotation) fits at (row, col) without overlapping existing items or going out of bounds. Rotation is 90° CCW: effective width/height are swapped when `rotated` is true.
- **placeItem(item, row, col, rotated)** — Marks the cells covered by the item as occupied and records the item id and footprint for later removal.
- **removeItem(itemId)** — Clears the cells previously occupied by that item.
- **rotateItem(itemId)** — Removes the item, then re-places it at the same (row, col) with the opposite rotation (if it fits).
- **autoSort(items)** — Packs a list of items (with width, height, id, rotated) using a bottom-left packing heuristic and returns an array of placements { itemId, row, col, rotated }.
- **fromItems(width, height, items)** — Static factory: builds a GridEngine for the given dimensions and pre-fills it from an array of items (using their slotRow, slotCol, width, height, rotated).

The API **POST /api/inventory/place** loads the target container and all items already in it, builds a GridEngine with `fromItems`, checks `canPlace`, and only then updates the item’s containerId, slotRow, slotCol, and rotated in the database. Conflict or out-of-bounds returns HTTP 409.

---

## WebGPU and Liquid Glass

### InventoryCanvas

The renderer includes an **InventoryCanvas** component that initializes **WebGPU**: it requests an adapter and device, configures the canvas context with `alphaMode: 'premultiplied'` for translucency (Tahoe Liquid Glass–style), creates a shader module from **liquidGlass.wgsl**, builds a render pipeline, and runs a render loop that clears and draws a full-screen quad. The shader provides vertex position/UV and a fragment stage that outputs a translucent glass-like color. This is optional visual flair for the inventory view; the grid logic itself does not depend on WebGPU.

### Shader

The **liquidGlass.wgsl** shader is a minimal WGSL pipeline (vertex + fragment) used for refractive/translucent visual effects consistent with macOS Tahoe’s Liquid Glass design language. The canvas is isolated so that GPU buffer access stays within the renderer’s context.

---

## Drag-and-Drop

### GridWithDnD and ItemSlot

The **GridWithDnD** component wraps the grid in **react-dnd**’s **DndProvider** (HTML5Backend). Each cell is an **ItemSlot** that:

- Acts as a **drop target** (useDrop) accepting the `'ingredient'` type for the alchemy bench and the item type for the inventory grid. On drop, it calls **onPlace(item, row, col)** (inventory) or adds the ingredient to the cauldron (alchemy).
- Acts as a **drag source** (useDrag) when the cell contains an item, so the user can drag that item to another slot.

When the user drops an item in the inventory grid, the renderer calls **POST /api/inventory/place** with itemId, containerId, slotRow, slotCol, and rotated; on success it refetches **GET /character/inventory** so the tree and grid state stay in sync. Placement is validated by the GridEngine on the server before any DB write.

---

## Alchemy and Crafting

### SynthesisEngine (Vector-Based Alchemy)

The **SynthesisEngine** (`src/shared/synthesisEngine.ts`) implements **Coordinate Grid Synthesis**: the “brew” is a point on a 2D effect grid. A **base liquid** (water, oil, or mercury) sets the initial position. **Ingredients** are vectors (x, y); adding an ingredient moves the synthesis point by that vector. **Quality** and **mutable** affect the result: high-quality mutable ingredients add a small extra nudge in the vector direction. **Tools** modify the position: **mortar** rounds the position to integer cardinal coordinates; **alembic** doubles the position (magnitude). The **final effect** is determined by **proximity to effect nodes**: predefined points (e.g. healing, poison, haste, resist) with a radius; if the synthesis point falls within a node’s radius, that effect is included. The engine returns **potion** name (or “Unknown”), **nodes** (list of effect ids), and **position**.

### Discovery Book

Discovered recipes are stored in a **Discovery Book**, a JSON file at **userData/crafting/discoveryBook.json**. Each recipe has name, ingredients (names), position, effectNodes, and discoveredAt timestamp. **GET /crafting/recipes** returns the full book. **POST /crafting/recipes** saves a new or updated recipe (body: DiscoveryRecipe). The SynthesisEngine can load and save the book when running in a context that has filesystem or API access (e.g. the API layer reads/writes the file).

### Alchemy Bench UI

The **Alchemy Bench** tab provides an interactive crafting view: the user selects a **base liquid**, drags **ingredients** from a list (the **UNDERDARK_INGREDIENTS** set, 20+ entries with vectors and quality/mutable) into a cauldron drop zone, optionally uses tools, and clicks **Brew** to run **computeFinalEffect()**. The result (potion name and effect nodes) is shown; the user can **Save** the current combination as a recipe (POST /crafting/recipes). State (baseLiquid, ingredients list, last result) is held in the **alchemy-store** (Zustand). The bench reuses react-dnd for dragging ingredients onto the cauldron.

### Underdark Ingredients

**UNDERDARK_INGREDIENTS** (`src/shared/ingredients.ts`) is a curated list of 20+ reagents: each has **name**, **vector** (x, y), **quality** (0–1), and **mutable** (boolean). Examples: High-Potency Deathcap, Faerzress Dust, Drow Poison Sac, Spider Venom, Quicksilver Droplet, Wyvern Stinger, Pixie Dust, etc. These are used by the Alchemy Bench UI and can be passed to **POST /crafting/synthesize** in the request body.

### Crafting API

- **GET /crafting/recipes** — Returns the Discovery Book (object keyed by recipe name).
- **POST /crafting/synthesize** — Body: `{ baseLiquid?, ingredients[] }`. Runs a SynthesisEngine with the given base and ingredients (each with name, vector, quality, mutable) and returns `{ potion, nodes, position }`.
- **POST /crafting/recipes** — Body: DiscoveryRecipe (name required). Writes the recipe into the Discovery Book and returns the saved recipe (HTTP 201).

---

## World View (Multi-Location Hub)

### Locations and Seeds

The app supports a **multi-location hub**: gear can live on the **Person** (character), in a **Ship’s Cabin**, or in a **Town Apartment**. Migration **004_seed_world_locations.sql** seeds locations 2 and 3 (Ship’s Cabin, Town Apartment) and their default containers (Ship Locker 20×20, Apartment Storage 12×12). **GET /locations** returns all locations; **GET /character/inventory** returns the full tree for every location.

### World View Tab

The **World View** tab shows a list of **location buttons** (Person, Ship’s Cabin, Town Apartment). The user selects one location; the UI then displays **all containers** at that location. For each container, a **GridWithDnD** grid is rendered so the user can see and move items in that container. Placement uses **POST /api/inventory/place** with the **selected container’s id** (so items can be moved between containers and locations by switching location and dropping). The **world-store** (Zustand) holds **selectedLocationId** so the selection persists across tab switches.

---

## GM WebSocket Sync and GM Dashboard

### WebSocket Server (gm-sync)

The main process runs a **WebSocket server** on port **38463** (separate from the HTTP API on 38462). When a client connects, the server immediately sends a **snapshot**: a JSON message `{ type: 'snapshot', payload: { tree, equipped } }` where `tree` and `equipped` are the same structure as **GET /character/inventory**. Whenever inventory state changes (after **POST /api/inventory/place**, **POST /character/equip**, or **POST /api/inventory**), the main process calls **broadcastGmSnapshot()**: it builds the current snapshot via **getInventorySnapshot()** (same DB logic as the character inventory endpoint) and sends it to **all connected WebSocket clients**. Thus, GM or other LAN clients see updates only when something actually changes (snapshot model).

### GM Dashboard Tab

The **GM Dashboard** tab in the renderer connects to **ws://127.0.0.1:38463**. It shows connection status (connected/disconnected), displays the **last received snapshot** (locations, number of containers per location, equipped count), and offers a simple “Reconnect” action (page reload). This gives the GM a live view of character inventory from the same machine; for LAN, a separate client would connect to the host’s IP on port 38463.

---

## Plugin System

### PluginManifest and PluginAPI

Plugins are declared with a **PluginManifest** (in shared types): **name**, **version**, **apiVersion**, and optional **main** (entry file). The **PluginAPI** passed to each plugin on registration includes **registerHook(event, handler)** and **app** (the Express application). Plugins can register hook handlers (e.g. for custom logic when items are created) and can attach routes to **app** (e.g. **app.get('/plugin/foo', ...)**) for custom HTTP endpoints.

### Loader

The **plugin loader** (`src/main/plugins/loader.ts`) runs at startup, after the Express app is created but before the HTTP server listens. It reads the **userData/plugins** directory; for each subdirectory it looks for **manifest.json** or **package.json** with a **plugin** field, resolves the **main** entry (default **index.js**), and **dynamic-imports** the entry via **pathToFileURL** (ESM). The default export (or **register**) is called with the **PluginAPI**. Only the **userData/plugins** directory is scanned; no eval or arbitrary path loading. Broken or missing plugins are skipped without crashing the app.

### Hooks

The loader maintains a registry of **hooks** (event name → list of handlers). **emit(event, ...args)** runs all handlers for that event. The API server calls **emit('onItemCreate', item)** after successfully creating an item via **POST /api/inventory** (so plugins can react to new items). Future hooks (e.g. onItemEquip, onPlace) can be added in the same way.

---

## REST API Reference

All endpoints are on **http://127.0.0.1:38462** (local API).

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/inventory | List all items (flat array). |
| POST | /api/inventory | Create item. Body: name (required), width?, height?, parentId?, containerId?. Returns created item (201). |
| GET | /locations | List all locations (id, name, type). |
| GET | /character/inventory | Full character inventory: { tree, equipped }. Tree = locations → containers → nested item trees; equipped = items with equipmentSlot. |
| POST | /character/equip | Equip item. Body: itemId, slot (one of EQUIPMENT_SLOTS). Conflict returns 409. |
| POST | /api/inventory/place | Place item in container. Body: itemId, containerId, slotRow, slotCol, rotated?. Validates with GridEngine; conflict/out-of-bounds returns 409. |
| GET | /crafting/recipes | Discovery Book (object keyed by recipe name). |
| POST | /crafting/synthesize | Compute potion effect. Body: baseLiquid?, ingredients[] (each: name, vector, quality?, mutable?). Returns { potion, nodes, position }. |
| POST | /crafting/recipes | Save recipe. Body: DiscoveryRecipe (name required). Returns saved recipe (201). |

**WebSocket:** **ws://127.0.0.1:38463** — GM sync; messages are `{ type: 'snapshot', payload: { tree, equipped } }`.

---

## Planned and Backlog

- **Quick-Access slots and HUD overlay** — Hotkeys and overlay for holsters/belt slots.
- **Treasure/valuation engine and regional arbitrage** — Regional prices and value display (e.g. gem value surface vs. Menzoberranzan).
- **Adamantine degradation (Environment Watcher)** — When GM sets “Sunlight” (or similar), decay function for drowcraft item integrity; UI “Degradation Flare.”
- **Logistical Fetch with time-based transit** — Moving items between locations with in-game delay by distance.

---

## Glossary

- **Nested Set** — Hierarchy model with left/right integer markers for efficient subtree queries.
- **GridEngine** — 2D slot occupancy and placement (canPlace, placeItem, removeItem, rotateItem, autoSort, fromItems).
- **Liquid Glass** — macOS Tahoe UI material (refractive translucency); shader in liquidGlass.wgsl.
- **SynthesisEngine** — Vector-based alchemy (addIngredient, useTool, computeFinalEffect, Discovery Book).
- **Discovery Book** — JSON file (userData/crafting/discoveryBook.json) of discovered recipes.
- **Effect Node** — Point on the alchemy grid (id, name, x, y, radius) defining a potion effect by proximity.
- **PluginManifest** — name, version, apiVersion, main; declares an ESM plugin in userData/plugins.
- **Snapshot (sync)** — State (tree + equipped) broadcast to GM WebSocket clients only when changes occur.
- **EQUIPMENT_SLOTS** — main_hand, off_hand, back, torso, belt, quick_1, quick_2.

---

## Index

- [Architecture](./ARCHITECTURE.md) | [Development Plan](./ttrpg-equipment-manager-development-plan.md) | [Security](./SECURITY.md)
- [README](../README.md) | [ROADMAP](../ROADMAP.md)
- Inventory: Nested Set, locations, containers, items, equip, character tree
- Grid: GridEngine, canPlace, placeItem, rotate, autoSort, POST /api/inventory/place
- UI: WebGPU InventoryCanvas, liquidGlass.wgsl, GridWithDnD, ItemSlot
- Alchemy: SynthesisEngine, Discovery Book, AlchemyBench, UNDERDARK_INGREDIENTS, GET/POST /crafting/*
- World View: locations, 004_seed_world_locations, WorldView tab, world-store
- GM: WebSocket :38463, broadcastGmSnapshot, GMDashboard tab
- Plugins: PluginManifest, loadPlugins, registerHook, onItemCreate
