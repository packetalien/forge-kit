import { useEffect, useState, useCallback } from 'react';
import { GridWithDnD } from './components/GridWithDnD';
import { InventoryCanvas } from './components/InventoryCanvas';
import { AlchemyBench } from './components/AlchemyBench';
import { WorldView } from './pages/WorldView';
import { GMDashboard } from './components/GMDashboard';
import type { Item, Container } from '@shared/types';

const API = 'http://127.0.0.1:38462';

function flattenTree(
  items: { id: number; slotRow?: number | null; slotCol?: number | null; children?: unknown[] }[]
): Item[] {
  const out: Item[] = [];
  function walk(nodes: typeof items) {
    for (const n of nodes) {
      if (n.slotRow != null && n.slotCol != null) {
        out.push(n as Item);
      }
      if (Array.isArray((n as { children?: unknown[] }).children) && (n as { children: unknown[] }).children.length) {
        walk((n as { children: unknown[] }).children as typeof items);
      }
    }
  }
  walk(items);
  return out;
}

function App() {
  const [tree, setTree] = useState<{ tree: { location: unknown; containers: { container: Container; items: unknown[] }[] }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/character/inventory`);
      if (res.ok) {
        const data = await res.json();
        setTree(data);
      }
    } catch {
      setTree(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handlePlace = useCallback(
    async (item: Item, row: number, col: number) => {
      const container = tree?.tree?.[0]?.containers?.[0];
      if (!container?.container?.id) return;
      try {
        const res = await fetch(`${API}/api/inventory/place`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            containerId: container.container.id,
            slotRow: row,
            slotCol: col,
            rotated: item.rotated ?? false,
          }),
        });
        if (res.ok) await fetchInventory();
      } catch {
        // ignore
      }
    },
    [tree, fetchInventory]
  );

  const [tab, setTab] = useState<'inventory' | 'alchemy' | 'world' | 'gm'>('inventory');
  const firstContainer = tree?.tree?.[0]?.containers?.[0];
  const container = firstContainer?.container;
  const flatItems = firstContainer?.items ? flattenTree(firstContainer.items as { id: number; slotRow?: number | null; slotCol?: number | null; children?: unknown[] }[]) : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">TTRPG Logistics Suite</h1>
        <p className="text-slate-400 text-sm">High-fidelity gear manager for macOS Tahoe</p>
        <nav className="flex gap-4 mt-2">
          <button
            type="button"
            className={tab === 'inventory' ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-300'}
            onClick={() => setTab('inventory')}
          >
            Inventory
          </button>
          <button
            type="button"
            className={tab === 'alchemy' ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-300'}
            onClick={() => setTab('alchemy')}
          >
            Alchemy Bench
          </button>
          <button
            type="button"
            className={tab === 'world' ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-300'}
            onClick={() => setTab('world')}
          >
            World View
          </button>
          <button
            type="button"
            className={tab === 'gm' ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-300'}
            onClick={() => setTab('gm')}
          >
            GM Dashboard
          </button>
        </nav>
      </header>
      <main>
        {tab === 'alchemy' && <AlchemyBench />}
        {tab === 'world' && <WorldView />}
        {tab === 'gm' && <GMDashboard />}
        {tab === 'inventory' && (
          <>
        {loading && <p className="text-slate-400">Loading…</p>}
        {!loading && container && (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-semibold mb-2">{container.name}</h2>
              <GridWithDnD container={container} items={flatItems} onPlace={handlePlace} />
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-2">WebGPU Canvas</h2>
              <div className="rounded overflow-hidden border border-slate-600 max-w-md">
                <InventoryCanvas container={container} />
              </div>
            </section>
          </div>
        )}
        {!loading && !container && (
          <p className="text-slate-400">Start the app to load inventory. Run <code className="text-slate-300">npm start</code>.</p>
        )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
