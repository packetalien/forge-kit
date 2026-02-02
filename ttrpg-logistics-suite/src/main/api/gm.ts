import { Request, Response } from 'express';
import { getDb } from '../db/setup';
import { broadcastGmSnapshot } from '../gm-sync';
import { emit as emitPluginHook } from '../plugins/loader';
import type { Item } from '../../shared/types';

const itemColumns =
  'id, name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol, rotated';

export function registerGmRoutes(app: import('express').Application): void {
  app.post('/gm/injectItem', (req: Request, res: Response) => {
    const { name, width = 1, height = 1, containerId = 1 } = req.body as {
      name?: string;
      width?: number;
      height?: number;
      containerId?: number;
    };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name required' });
    }
    const db = getDb();
    db.get<{ maxRight: number }>('SELECT COALESCE(MAX("right"), 0) AS maxRight FROM items', [], (err, row) => {
      if (err) return res.status(500).json({ error: String(err) });
      const left = (row?.maxRight ?? 0) + 1;
      const right = left + 1;
      db.run(
        'INSERT INTO items (name, width, height, left, right, parentId, containerId, equipmentSlot, slotRow, slotCol, rotated) VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, NULL, NULL, 0)',
        [name, width ?? 1, height ?? 1, left, right, containerId ?? 1],
        function (runErr) {
          if (runErr) return res.status(500).json({ error: String(runErr) });
          broadcastGmSnapshot();
          const created: Item = {
            id: this.lastID,
            name,
            width: width ?? 1,
            height: height ?? 1,
            left,
            right,
            parentId: null,
            containerId: containerId ?? 1,
            equipmentSlot: null,
            slotRow: null,
            slotCol: null,
            rotated: false,
          };
          emitPluginHook('onItemCreate', created);
          emitPluginHook('onWeightChange', created);
          res.status(201).json(created);
        }
      );
    });
  });

  app.post('/gm/modifyState', (req: Request, res: Response) => {
    const { itemId, state } = req.body as { itemId?: number; state?: Record<string, unknown> };
    if (itemId == null || typeof itemId !== 'number') {
      return res.status(400).json({ error: 'itemId (number) required' });
    }
    const db = getDb();
    db.get<Item>(`SELECT ${itemColumns} FROM items WHERE id = ?`, [itemId], (err, item) => {
      if (err) return res.status(500).json({ error: String(err) });
      if (!item) return res.status(404).json({ error: 'item not found' });
      if (state && typeof state === 'object' && state.equipmentSlot !== undefined) {
        db.run(
          'UPDATE items SET equipmentSlot = ? WHERE id = ?',
          [state.equipmentSlot === null ? null : String(state.equipmentSlot), itemId],
          (runErr) => {
            if (runErr) return res.status(500).json({ error: String(runErr) });
            broadcastGmSnapshot();
            emitPluginHook('onWeightChange', { itemId, state });
            res.json({ ok: true, itemId, state: state });
          }
        );
      } else {
        broadcastGmSnapshot();
        res.json({ ok: true, itemId });
      }
    });
  });
}
