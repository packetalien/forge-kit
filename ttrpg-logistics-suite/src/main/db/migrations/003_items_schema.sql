-- Items table: ensure schema includes containerId, equipmentSlot, slotRow, slotCol
-- (Columns added by migration runner in setup.ts if missing)
CREATE INDEX IF NOT EXISTS idx_items_container ON items(containerId);
CREATE INDEX IF NOT EXISTS idx_items_equipment ON items(equipmentSlot);
