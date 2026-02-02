import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';
import { debug, error } from '../../shared/logger';

const TAG = 'DB';
const dbPath = path.join(app.getPath('userData'), 'data', 'inventory.db');

let db: sqlite3.Database | null = null;

export function getDb(): sqlite3.Database {
  if (!db) {
    error(TAG, 'getDb: database not initialized');
    throw new Error('Database not initialized');
  }
  return db;
}

/**
 * Initialize DB: ensure data dir exists, open SQLite connection, run migrations.
 * Uses Promise chain only (no async inside sqlite3 callback) to avoid callback-async anti-pattern.
 */
export async function initDb(): Promise<void> {
  debug(TAG, 'initDb: starting', { dbPath });
  const { mkdir } = await import('fs/promises');
  await mkdir(path.dirname(dbPath), { recursive: true });
  debug(TAG, 'initDb: data dir ensured');

  const database = await new Promise<sqlite3.Database>((resolve, reject) => {
    const conn = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        error(TAG, 'initDb: open failed', err);
        reject(err);
      } else {
        debug(TAG, 'initDb: connection opened');
        resolve(conn);
      }
    });
  });

  debug(TAG, 'initDb: running migrations');
  const { runMigrations } = await import('./migrate');
  await runMigrations(database);
  db = database;
  debug(TAG, 'initDb: complete');
}
