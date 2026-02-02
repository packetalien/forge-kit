import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'data', 'inventory.db');

let db: sqlite3.Database | null = null;

export function getDb(): sqlite3.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function initDb(): Promise<void> {
  const { mkdir } = await import('fs/promises');
  await mkdir(path.dirname(dbPath), { recursive: true });

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) return reject(err);
      try {
        const { runMigrations } = await import('./migrate');
        await runMigrations(db!);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}
