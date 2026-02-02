CREATE TABLE IF NOT EXISTS reagents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  purity REAL DEFAULT 0.5,
  potency REAL DEFAULT 0.5,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_reagents_name ON reagents(name);
