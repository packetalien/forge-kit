-- Phase 5: GURPS-style ItemDefinitions/ItemInstances (adjacency list), Attachments, container volume_limit
CREATE TABLE IF NOT EXISTS item_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  weight REAL DEFAULT 0,
  volume REAL DEFAULT 0,
  tl INTEGER DEFAULT 0,
  lc INTEGER DEFAULT 4,
  malf INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS item_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  def_id INTEGER NOT NULL,
  parent_id INTEGER,
  quantity INTEGER DEFAULT 1,
  quality REAL DEFAULT 1,
  state TEXT DEFAULT 'ok',
  condition INTEGER DEFAULT 0,
  FOREIGN KEY (def_id) REFERENCES item_definitions(id),
  FOREIGN KEY (parent_id) REFERENCES item_instances(id)
);
CREATE INDEX IF NOT EXISTS idx_item_instances_parent ON item_instances(parent_id);
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  slot_type TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES item_instances(id)
);
CREATE INDEX IF NOT EXISTS idx_attachments_parent ON attachments(parent_id);
