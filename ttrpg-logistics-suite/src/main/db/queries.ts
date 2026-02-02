import type sqlite3 from 'sqlite3';
import { debug } from '../../shared/logger';

const TAG = 'Queries';

/**
 * Recursive CTE: sum weight of all descendants of a given item_instances row.
 * Uses adjacency list (parent_id). Weight = item_definitions.weight * item_instances.quantity.
 * Returns 0 if table empty or parent_id has no descendants.
 */
export function getSubtreeWeightRecursive(
  db: sqlite3.Database,
  parentId: number
): Promise<number> {
  debug(TAG, 'getSubtreeWeightRecursive', { parentId });
  const sql = `
    WITH RECURSIVE descendants(id, w) AS (
      SELECT i.id, COALESCE(d.weight, 0) * i.quantity
      FROM item_instances i
      LEFT JOIN item_definitions d ON i.def_id = d.id
      WHERE i.parent_id = ?
      UNION ALL
      SELECT i.id, COALESCE(d.weight, 0) * i.quantity
      FROM item_instances i
      JOIN descendants dec ON i.parent_id = dec.id
      LEFT JOIN item_definitions d ON i.def_id = d.id
    )
    SELECT COALESCE(SUM(w), 0) AS total FROM descendants
  `;
  return new Promise((resolve, reject) => {
    db.get<{ total: number }>(sql, [parentId], (err, row) => {
      if (err) return reject(err);
      const total = row?.total ?? 0;
      debug(TAG, 'getSubtreeWeightRecursive result', { parentId, total });
      resolve(total);
    });
  });
}
