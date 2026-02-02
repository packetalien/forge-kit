import { useEffect, useState, useCallback } from 'react';

const GM_WS_URL = 'ws://127.0.0.1:38463';

interface SnapshotPayload {
  tree: { location: { id: number; name: string }; containers: unknown[] }[];
  equipped: unknown[];
}

export function GMDashboard() {
  const [snapshot, setSnapshot] = useState<SnapshotPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    debug(TAG, 'useEffect: connecting', GM_WS_URL);
    setError(null);
    const ws = new WebSocket(GM_WS_URL);
    ws.onopen = () => {
      debug(TAG, 'ws onopen');
      setConnected(true);
    };
    ws.onclose = () => {
      debug(TAG, 'ws onclose');
      setConnected(false);
    };
    ws.onerror = () => {
      debug(TAG, 'ws onerror');
      setError('WebSocket error');
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        debug(TAG, 'ws onmessage', { type: msg.type });
        if (msg.type === 'snapshot' && msg.payload) {
          setSnapshot(msg.payload as SnapshotPayload);
          debug(TAG, 'snapshot set', { locations: (msg.payload as SnapshotPayload).tree?.length });
        }
      } catch (e) {
        debug(TAG, 'ws message parse error', e);
        setError('Invalid message');
      }
    };
    return () => {
      debug(TAG, 'useEffect cleanup: close ws');
      ws.close();
    };
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">GM Dashboard</h2>
      <p className="text-slate-400 text-sm">
        LAN sync view: snapshot of character inventory. Connect from another device to ws://&lt;this-host&gt;:38463.
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-500'}`}
          aria-hidden
        />
        <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        <button
          type="button"
          className="text-sm px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
          onClick={() => window.location.reload()}
        >
          Reconnect
        </button>
      </div>
      {error && <p className="text-amber-400 text-sm">{error}</p>}
      {snapshot && (
        <div className="rounded border border-slate-600 p-4 bg-slate-800/50">
          <h3 className="text-lg font-medium mb-2">Last snapshot</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Locations: {snapshot.tree.map((n) => n.location.name).join(', ')}</li>
            <li>Equipped items: {snapshot.equipped.length}</li>
            {snapshot.tree.map((node) => (
              <li key={node.location.id}>
                {node.location.name}: {node.containers.length} container(s)
              </li>
            ))}
          </ul>
        </div>
      )}
      {!snapshot && connected && <p className="text-slate-400 text-sm">Waiting for snapshot…</p>}
    </section>
  );
}
