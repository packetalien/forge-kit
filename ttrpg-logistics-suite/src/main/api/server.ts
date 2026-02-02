import express, { Request, Response } from 'express';
import { getDb } from '../db/setup';
import type { Item, Location, Container } from '../../shared/types';
import { EQUIPMENT_SLOTS } from '../../shared/types';

const app = express();
app.use(express.json());

const PORT = 38462;

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

export function startApi(): void {
  app.get('/api/inventory', (_req: Request, res: Response) => {
    const db = getDb();
    db.all<Item>(
      'SELECT id, name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol FROM items ORDER BY left',
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: String(err) });
        res.json(rows ?? []);
      }
    );
  });

  app.get('/character/inventory', (_req: Request, res: Response) => {
    const db = getDb();
    db.all<Location>('SELECT id, name, type FROM locations ORDER BY id', [], (errLoc, locations) => {
      if (errLoc) return res.status(500).json({ error: String(errLoc) });
      db.all<Container>(
        'SELECT id, locationId, name, gridWidth, gridHeight, type FROM containers ORDER BY id',
        [],
        (errCont, containers) => {
          if (errCont) return res.status(500).json({ error: String(errCont) });
          db.all<Item>(
            'SELECT id, name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol FROM items ORDER BY left',
            [],
            (errItems, items) => {
              if (errItems) return res.status(500).json({ error: String(errItems) });
              const itemList = items ?? [];
              const tree: LocationNode[] = (locations ?? []).map((loc) => ({
                location: loc,
                containers: (containers ?? [])
                  .filter((c) => c.locationId === loc.id)
                  .map((cont) => ({
                    container: cont,
                    items: buildItemTree(
                      itemList.filter((i) => i.containerId === cont.id && !i.equipmentSlot)
                    ),
                  })),
              }));
              const equipped = itemList.filter((i) => i.equipmentSlot != null);
              res.json({ tree, equipped });
            }
          );
        }
      );
    });
  });

  app.post('/character/equip', (req: Request, res: Response) => {
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
          'UPDATE items SET containerId = NULL, equipmentSlot = ?, slotRow = NULL, slotCol = NULL WHERE id = ?',
          [slot, itemId],
          (err3) => {
            if (err3) return res.status(500).json({ error: String(err3) });
            res.json({ ok: true, itemId, slot });
          }
        );
      });
    });
  });

  app.post('/api/inventory', (req: Request, res: Response) => {
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
        'INSERT INTO items (name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)',
        [name, width, height, left, right, parentId ?? null, containerId ?? 1],
        function (runErr) {
          if (runErr) return res.status(500).json({ error: String(runErr) });
          res.status(201).json({
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
          });
        }
      );
    });
  });

  app.listen(PORT, () => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Local API: http://127.0.0.1:${PORT}`);
    }
  });
}
