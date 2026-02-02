import sqlite3 from 'sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/** Migration SQL is trusted (from repo .sql files). No user input; db.exec is acceptable. */
function runSql(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function getTableInfo(db: sqlite3.Database, table: string): Promise<{ name: string }[]> {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
      if (err) return reject(err);
      resolve((rows as { name: string }[]) ?? []);
    });
  });
}

export async function runMigrations(db: sqlite3.Database): Promise<void> {
  const files = ['001_locations.sql', '002_containers.sql'];
  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      await runSql(db, stmt + ';');
    }
  }

  const tables = await new Promise<string[]>((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='items'",
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve((rows as { name: string }[]).map((r) => r.name));
      }
    );
  });
  const itemsExists = tables.length > 0;

  if (!itemsExists) {
    await runSql(db, `
      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 1,
        height INTEGER NOT NULL DEFAULT 1,
        left INTEGER NOT NULL,
        right INTEGER NOT NULL,
        parentId INTEGER,
        containerId INTEGER,
        equipmentSlot TEXT,
        slotRow INTEGER,
        slotCol INTEGER,
        rotated INTEGER DEFAULT 0,
        FOREIGN KEY (parentId) REFERENCES items(id),
        FOREIGN KEY (containerId) REFERENCES containers(id)
      )
    `);
    await runSql(db, 'CREATE INDEX IF NOT EXISTS idx_items_nested ON items(left, right)');
  } else {
    const cols = await getTableInfo(db, 'items');
    const hasContainerId = cols.some((c) => c.name === 'containerId');
    if (!hasContainerId) {
      await runSql(db, 'ALTER TABLE items ADD COLUMN containerId INTEGER');
      await runSql(db, 'ALTER TABLE items ADD COLUMN equipmentSlot TEXT');
      await runSql(db, 'ALTER TABLE items ADD COLUMN slotRow INTEGER');
      await runSql(db, 'ALTER TABLE items ADD COLUMN slotCol INTEGER');
      await runSql(db, 'UPDATE items SET containerId = 1 WHERE containerId IS NULL');
    }
    const hasRotated = cols.some((c) => c.name === 'rotated');
    if (!hasRotated) {
      await runSql(db, 'ALTER TABLE items ADD COLUMN rotated INTEGER DEFAULT 0');
    }
    await runSql(db, 'CREATE INDEX IF NOT EXISTS idx_items_nested ON items(left, right)');
  }

  const sql003 = await readFile(path.join(MIGRATIONS_DIR, '003_items_schema.sql'), 'utf-8');
  const statements003 = sql003
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
  for (const stmt of statements003) {
    await runSql(db, stmt + ';');
  }

  const sql004 = await readFile(path.join(MIGRATIONS_DIR, '004_seed_world_locations.sql'), 'utf-8');
  const statements004 = sql004
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
  for (const stmt of statements004) {
    await runSql(db, stmt + ';');
  }

  const sql005 = await readFile(path.join(MIGRATIONS_DIR, '005_gurps_tables.sql'), 'utf-8');
  const statements005 = sql005
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
  for (const stmt of statements005) {
    await runSql(db, stmt + ';');
  }

  const containerCols = await getTableInfo(db, 'containers');
  const hasVolumeLimit = containerCols.some((c) => c.name === 'volume_limit');
  if (!hasVolumeLimit) {
    await runSql(db, 'ALTER TABLE containers ADD COLUMN volume_limit REAL');
  }

  const sql006 = await readFile(path.join(MIGRATIONS_DIR, '006_reagents.sql'), 'utf-8');
  const statements006 = sql006
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
  for (const stmt of statements006) {
    await runSql(db, stmt + ';');
  }
}
