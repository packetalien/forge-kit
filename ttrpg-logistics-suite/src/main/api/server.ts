import express, { Request, Response } from 'express';
import path from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { app } from 'electron';
import { getDb } from '../db/setup';
import { startGmSync, broadcastGmSnapshot, type InventorySnapshot } from '../gm-sync';
import { loadPlugins, emit as emitPluginHook } from '../plugins/loader';
import type { Item, Location, Container, Ingredient, DiscoveryRecipe } from '../../shared/types';
import { EQUIPMENT_SLOTS } from '../../shared/types';
import { GridEngine } from '../../shared/gridEngine';
import { SynthesisEngine } from '../../shared/synthesisEngine';
import type { DiscoveryBook } from '../../shared/synthesisEngine';

const expressApp = express();
expressApp.use(express.json());

const PORT = 38462;
const GM_SYNC_PORT = 38463;

interface LocationNode {
  location: Location;
  containers: ContainerNode[];
}

interface ContainerNode {
  container: Container;
  items: ItemTreeNode[];
}

interface ItemTreeNode extends Item {
  children?: ItemTreeNode[];
}

function buildItemTree(items: Item[], parentLeft?: number, parentRight?: number): ItemTreeNode[] {
  const inRange =
    parentLeft != null && parentRight != null
      ? items.filter((i) => i.left > parentLeft && i.right < parentRight)
      : items;
  const roots = inRange.filter(
    (item) =>
      !inRange.some(
        (m) => m.id !== item.id && m.left < item.left && m.right > item.right
      )
  );
  return roots.map((r) => ({
    ...r,
    children: buildItemTree(items, r.left, r.right),
  }));
}

function buildInventoryPayload(
  locations: Location[],
  containers: Container[],
  items: Item[]
): { tree: LocationNode[]; equipped: Item[] } {
  const tree: LocationNode[] = locations.map((loc) => ({
    location: loc,
    containers: containers
      .filter((c) => c.locationId === loc.id)
      .map((cont) => ({
        container: cont,
        items: buildItemTree(
          items.filter((i) => i.containerId === cont.id && !i.equipmentSlot)
        ),
      })),
  }));
  const equipped = items.filter((i) => i.equipmentSlot != null);
  return { tree, equipped };
}

function getInventorySnapshot(): Promise<InventorySnapshot> {
  const db = getDb();
  const itemColumns =
    'id, name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol, rotated';
  return new Promise((resolve, reject) => {
    db.all<Location>('SELECT id, name, type FROM locations ORDER BY id', [], (errLoc, locations) => {
      if (errLoc) return reject(errLoc);
      db.all<Container>(
        'SELECT id, locationId, name, gridWidth, gridHeight, type FROM containers ORDER BY id',
        [],
        (errCont, containers) => {
          if (errCont) return reject(errCont);
          db.all<Item>(
            `SELECT ${itemColumns} FROM items ORDER BY left`,
            [],
            (errItems, items) => {
              if (errItems) return reject(errItems);
              resolve(
                buildInventoryPayload(locations ?? [], containers ?? [], items ?? [])
              );
            }
          );
        }
      );
    });
  });
}

export function startApi(): void {
  const itemColumns =
    'id, name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol, rotated';

  expressApp.get('/api/inventory', (_req: Request, res: Response) => {
    const db = getDb();
    db.all<Item>(
      `SELECT ${itemColumns} FROM items ORDER BY left`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: String(err) });
        res.json(rows ?? []);
      }
    );
  });

  expressApp.get('/locations', (_req: Request, res: Response) => {
    const db = getDb();
    db.all<Location>('SELECT id, name, type FROM locations ORDER BY id', [], (err, rows) => {
      if (err) return res.status(500).json({ error: String(err) });
      res.json(rows ?? []);
    });
  });

  expressApp.get('/character/inventory', (_req: Request, res: Response) => {
    const db = getDb();
    db.all<Location>('SELECT id, name, type FROM locations ORDER BY id', [], (errLoc, locations) => {
      if (errLoc) return res.status(500).json({ error: String(errLoc) });
      db.all<Container>(
        'SELECT id, locationId, name, gridWidth, gridHeight, type FROM containers ORDER BY id',
        [],
        (errCont, containers) => {
          if (errCont) return res.status(500).json({ error: String(errCont) });
          db.all<Item>(
            `SELECT ${itemColumns} FROM items ORDER BY left`,
            [],
            (errItems, items) => {
              if (errItems) return res.status(500).json({ error: String(errItems) });
              const itemList = items ?? [];
              const { tree, equipped } = buildInventoryPayload(
                locations ?? [],
                containers ?? [],
                itemList
              );
              res.json({ tree, equipped });
            }
          );
        }
      );
    });
  });

  expressApp.post('/character/equip', (req: Request, res: Response) => {
    const { itemId, slot } = req.body as { itemId?: number; slot?: string };
    if (itemId == null || typeof itemId !== 'number' || !slot || typeof slot !== 'string') {
      return res.status(400).json({ error: 'itemId (number) and slot (string) required' });
    }
    if (!EQUIPMENT_SLOTS.includes(slot as any)) {
      return res.status(400).json({ error: `slot must be one of: ${EQUIPMENT_SLOTS.join(', ')}` });
    }
    const db = getDb();
    db.get<Item>('SELECT id, equipmentSlot FROM items WHERE id = ?', [itemId], (err, item) => {
      if (err) return res.status(500).json({ error: String(err) });
      if (!item) return res.status(404).json({ error: 'item not found' });
      db.get<{ id: number }>('SELECT id FROM items WHERE equipmentSlot = ? AND id != ?', [slot, itemId], (err2, conflict) => {
        if (err2) return res.status(500).json({ error: String(err2) });
        if (conflict) return res.status(409).json({ error: `slot ${slot} already occupied` });
        db.run(
          'UPDATE items SET containerId = NULL, equipmentSlot = ?, slotRow = NULL, slotCol = NULL, rotated = 0 WHERE id = ?',
          [slot, itemId],
          (err3) => {
            if (err3) return res.status(500).json({ error: String(err3) });
            broadcastGmSnapshot();
            res.json({ ok: true, itemId, slot });
          }
        );
      });
    });
  });

  expressApp.post('/api/inventory/place', (req: Request, res: Response) => {
    const { itemId, containerId, slotRow, slotCol, rotated = false } = req.body as {
      itemId?: number;
      containerId?: number;
      slotRow?: number;
      slotCol?: number;
      rotated?: boolean;
    };
    if (
      itemId == null ||
      typeof itemId !== 'number' ||
      containerId == null ||
      typeof containerId !== 'number' ||
      typeof slotRow !== 'number' ||
      typeof slotCol !== 'number'
    ) {
      return res.status(400).json({ error: 'itemId, containerId, slotRow, slotCol required' });
    }
    const db = getDb();
    db.get<Container>(
      'SELECT id, gridWidth, gridHeight FROM containers WHERE id = ?',
      [containerId],
      (errCont, container) => {
        if (errCont) return res.status(500).json({ error: String(errCont) });
        if (!container) return res.status(404).json({ error: 'container not found' });
        db.get<Item>(`SELECT ${itemColumns} FROM items WHERE id = ?`, [itemId], (errItem, item) => {
          if (errItem) return res.status(500).json({ error: String(errItem) });
          if (!item) return res.status(404).json({ error: 'item not found' });
          db.all<Item>(
            `SELECT ${itemColumns} FROM items WHERE containerId = ? AND id != ?`,
            [containerId, itemId],
            (errOthers, others) => {
              if (errOthers) return res.status(500).json({ error: String(errOthers) });
              const engine = GridEngine.fromItems(
                container.gridWidth,
                container.gridHeight,
                others ?? []
              );
              const rot = Boolean(rotated);
              if (!engine.canPlace(item, slotRow, slotCol, rot)) {
                return res.status(409).json({ error: 'placement conflict or out of bounds' });
              }
              db.run(
                'UPDATE items SET containerId = ?, equipmentSlot = NULL, slotRow = ?, slotCol = ?, rotated = ? WHERE id = ?',
                [containerId, slotRow, slotCol, rot ? 1 : 0, itemId],
                (errUpdate) => {
                  if (errUpdate) return res.status(500).json({ error: String(errUpdate) });
                  broadcastGmSnapshot();
                  res.json({ ok: true, itemId, containerId, slotRow, slotCol, rotated: rot });
                }
              );
            }
          );
        });
      }
    );
  });

  expressApp.post('/api/inventory', (req: Request, res: Response) => {
    const { name, width = 1, height = 1, parentId, containerId = 1 } = req.body as Partial<Item> & { name: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name required' });
    }
    const db = getDb();
    db.get<{ maxRight: number }>('SELECT COALESCE(MAX("right"), 0) AS maxRight FROM items', [], (err, row) => {
      if (err) return res.status(500).json({ error: String(err) });
      const left = (row?.maxRight ?? 0) + 1;
      const right = left + 1;
      db.run(
        'INSERT INTO items (name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol, rotated) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 0)',
        [name, width, height, left, right, parentId ?? null, containerId ?? 1],
        function (runErr) {
          if (runErr) return res.status(500).json({ error: String(runErr) });
          broadcastGmSnapshot();
          const created = {
            id: this.lastID,
            name,
            width,
            height,
            left,
            right,
            parentId: parentId ?? null,
            containerId: containerId ?? 1,
            equipmentSlot: null,
            slotRow: null,
            slotCol: null,
            rotated: false,
          };
          emitPluginHook('onItemCreate', created);
          res.status(201).json(created);
        }
      );
    });
  });

  const discoveryBookPath = path.join(app.getPath('userData'), 'crafting', 'discoveryBook.json');

  async function readDiscoveryBook(): Promise<DiscoveryBook> {
    try {
      const raw = await readFile(discoveryBookPath, 'utf-8');
      return JSON.parse(raw) as DiscoveryBook;
    } catch {
      return {};
    }
  }

  async function writeDiscoveryBook(book: DiscoveryBook): Promise<void> {
    await mkdir(path.dirname(discoveryBookPath), { recursive: true });
    await writeFile(discoveryBookPath, JSON.stringify(book, null, 2), 'utf-8');
  }

  expressApp.get('/crafting/recipes', async (_req: Request, res: Response) => {
    try {
      const book = await readDiscoveryBook();
      res.json(book);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  expressApp.post('/crafting/synthesize', (req: Request, res: Response) => {
    const { baseLiquid = 'water', ingredients = [] } = req.body as {
      baseLiquid?: 'water' | 'oil' | 'mercury';
      ingredients?: Ingredient[];
    };
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'ingredients must be array' });
    }
    const engine = new SynthesisEngine(baseLiquid);
    for (const ing of ingredients) {
      if (ing?.name && typeof ing.vector?.x === 'number' && typeof ing.vector?.y === 'number') {
        engine.addIngredient({
          name: ing.name,
          vector: { x: ing.vector.x, y: ing.vector.y },
          quality: typeof ing.quality === 'number' ? ing.quality : 1,
          mutable: Boolean(ing.mutable),
        });
      }
    }
    const result = engine.computeFinalEffect();
    res.json(result);
  });

  expressApp.post('/crafting/recipes', async (req: Request, res: Response) => {
    const recipe = req.body as DiscoveryRecipe;
    if (!recipe?.name || typeof recipe.name !== 'string') {
      return res.status(400).json({ error: 'recipe name required' });
    }
    try {
      const book = await readDiscoveryBook();
      book[recipe.name] = {
        name: recipe.name,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        position: recipe.position ?? { x: 0, y: 0 },
        effectNodes: Array.isArray(recipe.effectNodes) ? recipe.effectNodes : [],
        discoveredAt: typeof recipe.discoveredAt === 'number' ? recipe.discoveredAt : Date.now(),
      };
      await writeDiscoveryBook(book);
      res.status(201).json(book[recipe.name]);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  const pluginsDir = path.join(app.getPath('userData'), 'plugins');
  loadPlugins(pluginsDir, expressApp).then(() => {
    startGmSync(GM_SYNC_PORT, getInventorySnapshot);
    expressApp.listen(PORT, () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Local API: http://127.0.0.1:${PORT}`);
        console.log(`GM Sync WS: ws://127.0.0.1:${GM_SYNC_PORT}`);
      }
    });
  });
}
