CREATE TABLE IF NOT EXISTS containers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locationId INTEGER NOT NULL,
  name TEXT NOT NULL,
  gridWidth INTEGER NOT NULL DEFAULT 10,
  gridHeight INTEGER NOT NULL DEFAULT 12,
  type TEXT NOT NULL CHECK (type IN ('backpack', 'rig', 'pocket', 'locker', 'alchemist_case', 'other')),
  FOREIGN KEY (locationId) REFERENCES locations(id)
);
CREATE INDEX IF NOT EXISTS idx_containers_location ON containers(locationId);
INSERT OR IGNORE INTO containers (id, locationId, name, gridWidth, gridHeight, type) VALUES (1, 1, 'Main Backpack', 10, 12, 'backpack');
