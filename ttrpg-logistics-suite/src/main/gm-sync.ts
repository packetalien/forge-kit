import { WebSocketServer, WebSocket } from 'ws';
import { debug } from '../shared/logger';

const TAG = 'GMSync';

export interface InventorySnapshot {
  tree: unknown[];
  equipped: unknown[];
}

let getSnapshot: (() => Promise<InventorySnapshot>) | null = null;
let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function startGmSync(port: number, snapshotGetter: () => Promise<InventorySnapshot>): void {
  debug(TAG, 'startGmSync', { port });
  getSnapshot = snapshotGetter;
  wss = new WebSocketServer({ port });
  wss.on('connection', (ws) => {
    clients.add(ws);
    debug(TAG, 'connection', { clients: clients.size });
    getSnapshot!()
      .then((payload) => {
        ws.send(JSON.stringify({ type: 'snapshot', payload }));
        debug(TAG, 'sent initial snapshot to client');
      })
      .catch((e) => debug(TAG, 'getSnapshot failed', e));
    ws.on('close', () => {
      clients.delete(ws);
      debug(TAG, 'client closed', { clients: clients.size });
    });
  });
}

export async function broadcastGmSnapshot(): Promise<void> {
  if (!getSnapshot || clients.size === 0) {
    debug(TAG, 'broadcastGmSnapshot: skip', { clients: clients.size });
    return;
  }
  debug(TAG, 'broadcastGmSnapshot', { clients: clients.size });
  const payload = await getSnapshot();
  const msg = JSON.stringify({ type: 'snapshot', payload });
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}
