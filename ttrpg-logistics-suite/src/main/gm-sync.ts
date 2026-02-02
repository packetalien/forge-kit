import { WebSocketServer, WebSocket } from 'ws';

export interface InventorySnapshot {
  tree: unknown[];
  equipped: unknown[];
}

let getSnapshot: (() => Promise<InventorySnapshot>) | null = null;
let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function startGmSync(port: number, snapshotGetter: () => Promise<InventorySnapshot>): void {
  getSnapshot = snapshotGetter;
  wss = new WebSocketServer({ port });
  wss.on('connection', (ws) => {
    clients.add(ws);
    getSnapshot!()
      .then((payload) => {
        ws.send(JSON.stringify({ type: 'snapshot', payload }));
      })
      .catch(() => {});
    ws.on('close', () => clients.delete(ws));
  });
}

export async function broadcastGmSnapshot(): Promise<void> {
  if (!getSnapshot || clients.size === 0) return;
  const payload = await getSnapshot();
  const msg = JSON.stringify({ type: 'snapshot', payload });
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}
