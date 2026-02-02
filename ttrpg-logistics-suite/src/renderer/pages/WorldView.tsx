import { useCallback, useEffect, useState } from 'react';
import { GridWithDnD } from '../components/GridWithDnD';
import { useWorldStore } from '../stores/world-store';
import type { Item, Container, Location } from '@shared/types';
import { debug } from '@shared/logger';

const TAG = 'WorldView';
const API = 'http://127.0.0.1:38462';

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

function flattenTree(
  items: ItemTreeNode[]
): Item[] {
  const out: Item[] = [];
  function walk(nodes: ItemTreeNode[]) {
    for (const n of nodes) {
      if (n.slotRow != null && n.slotCol != null) {
        out.push(n);
      }
      if (Array.isArray(n.children) && n.children.length) {
        walk(n.children);
      }
    }
  }
  walk(items);
  return out;
}

interface InventoryPayload {
  tree: { location: Location; containers: ContainerNode[] }[];
  equipped: Item[];
}

export function WorldView() {
  const [data, setData] = useState<InventoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedLocationId, setSelectedLocation } = useWorldStore();

  const fetchInventory = useCallback(async () => {
    debug(TAG, 'fetchInventory');
    try {
      const res = await fetch(`${API}/character/inventory`);
      debug(TAG, 'fetchInventory response', { status: res.status });
      if (res.ok) {
        const payload: InventoryPayload = await res.json();
        setData(payload);
        if (payload.tree?.length && selectedLocationId == null) {
          setSelectedLocation(payload.tree[0].location.id);
          debug(TAG, 'setSelectedLocation initial', payload.tree[0].location.id);
        }
      }
    } catch (e) {
      debug(TAG, 'fetchInventory error', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId, setSelectedLocation]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handlePlace = useCallback(
    async (containerId: number, item: Item, row: number, col: number) => {
      debug(TAG, 'handlePlace', { containerId, itemId: item.id, row, col });
      try {
        const res = await fetch(`${API}/api/inventory/place`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            containerId,
            slotRow: row,
            slotCol: col,
            rotated: item.rotated ?? false,
          }),
        });
        debug(TAG, 'handlePlace response', { status: res.status });
        if (res.ok) await fetchInventory();
      } catch (e) {
        debug(TAG, 'handlePlace error', e);
      }
    },
    [fetchInventory]
  );

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-2">World View</h2>
        <p className="text-slate-400">Loading…</p>
      </section>
    );
  }

  const tree = data?.tree ?? [];
  const selectedNode = tree.find((n) => n.location.id === selectedLocationId);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">World View</h2>
      <p className="text-slate-400 text-sm mb-4">Multi-location hub: Person, Ship&apos;s Cabin, Town Apartment.</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {tree.map(({ location }) => (
          <button
            key={location.id}
            type="button"
            className={`px-3 py-2 rounded border transition-colors ${
              selectedLocationId === location.id
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
            onClick={() => setSelectedLocation(location.id)}
          >
            {location.name}
          </button>
        ))}
      </div>
      {selectedNode && (
        <div className="space-y-6">
          {selectedNode.containers.map(({ container, items }) => {
            const flatItems = flattenTree(items);
            return (
              <div key={container.id}>
                <h3 className="text-lg font-medium mb-2">{container.name}</h3>
                <GridWithDnD
                  container={container}
                  items={flatItems}
                  onPlace={(item, row, col) => handlePlace(container.id, item, row, col)}
                />
              </div>
            );
          })}
          {selectedNode.containers.length === 0 && (
            <p className="text-slate-400">No containers at this location.</p>
          )}
        </div>
      )}
      {!selectedNode && tree.length > 0 && (
        <p className="text-slate-400">Select a location above.</p>
      )}
      {tree.length === 0 && (
        <p className="text-slate-400">No locations. Run the app to seed locations.</p>
      )}
    </section>
  );
}
