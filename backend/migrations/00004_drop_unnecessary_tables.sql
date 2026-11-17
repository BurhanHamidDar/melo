-- Migration: 00004_drop_unnecessary_tables.sql
-- Removes obsolete relational playlist tables, unused feature flags, devices, and settings.
-- Melo V2 uses sync_mutations for playlists and library sync, and local Room DB for device settings/history.

-- 1. Drop foreign key constraints on media_assets
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS fk_user_avatar;
ALTER TABLE IF EXISTS announcements DROP CONSTRAINT IF EXISTS announcements_image_asset_id_fkey;

-- 2. Drop obsolete relational playlist tables (in correct dependency order)
DROP TABLE IF EXISTS playlist_follows CASCADE;
DROP TABLE IF EXISTS playlist_members CASCADE;
DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;

-- 3. Drop obsolete feature flags, listening history, library items, settings, devices, media assets
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS listening_history CASCADE;
DROP TABLE IF EXISTS user_library_items CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
