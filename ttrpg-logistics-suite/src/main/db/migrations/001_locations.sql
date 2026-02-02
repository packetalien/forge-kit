CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('person', 'cabin', 'apartment', 'other'))
);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
INSERT OR IGNORE INTO locations (id, name, type) VALUES (1, 'Person', 'person');
