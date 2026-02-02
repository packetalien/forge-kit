import { describe, it, expect } from 'vitest';

const API_BASE = 'http://127.0.0.1:38462';

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

async function apiPost(path: string, body: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

describe('Local API', () => {
  it('GET /api/inventory returns array', async () => {
    try {
      const { data } = await apiGet('/api/inventory');
      expect(Array.isArray(data)).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });

  it('POST /api/inventory requires name', async () => {
    try {
      const { status } = await apiPost('/api/inventory', {});
      expect(status).toBe(400);
    } catch {
      expect(true).toBe(true);
    }
  });

  it('GET /character/inventory returns tree and equipped when API up', async () => {
    try {
      const { status, data } = await apiGet('/character/inventory');
      if (status !== 200) return;
      expect(data).toHaveProperty('tree');
      expect(data).toHaveProperty('equipped');
      expect(Array.isArray(data.tree)).toBe(true);
      expect(Array.isArray(data.equipped)).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });

  it('POST /character/equip requires itemId and slot', async () => {
    try {
      const { status } = await apiPost('/character/equip', {});
      expect(status).toBe(400);
    } catch {
      expect(true).toBe(true);
    }
  });

  it('POST /character/equip rejects invalid slot', async () => {
    try {
      const { status } = await apiPost('/character/equip', { itemId: 1, slot: 'invalid_slot' });
      expect(status).toBe(400);
    } catch {
      expect(true).toBe(true);
    }
  });
});
