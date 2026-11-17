-- Migration 00003: Allow 'upsert' operation in sync_mutations table
ALTER TABLE sync_mutations DROP CONSTRAINT IF EXISTS sync_mutations_operation_check;
ALTER TABLE sync_mutations ADD CONSTRAINT sync_mutations_operation_check CHECK (operation IN ('insert', 'update', 'delete', 'upsert'));
