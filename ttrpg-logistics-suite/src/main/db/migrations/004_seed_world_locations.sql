-- Phase 4: Multi-Location Hub – Ship's Cabin and Town Apartment
INSERT OR IGNORE INTO locations (id, name, type) VALUES (2, 'Ship''s Cabin', 'cabin');
INSERT OR IGNORE INTO locations (id, name, type) VALUES (3, 'Town Apartment', 'apartment');
INSERT OR IGNORE INTO containers (id, locationId, name, gridWidth, gridHeight, type) VALUES (2, 2, 'Ship Locker', 20, 20, 'locker');
INSERT OR IGNORE INTO containers (id, locationId, name, gridWidth, gridHeight, type) VALUES (3, 3, 'Apartment Storage', 12, 12, 'other');
