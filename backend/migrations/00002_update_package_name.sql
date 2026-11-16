-- Migration 00002: Update default package name to com.music.melo
ALTER TABLE IF EXISTS app_releases
    ALTER COLUMN package_name SET DEFAULT 'com.music.melo';

UPDATE app_releases
SET package_name = 'com.music.melo'
WHERE package_name IN ('com.sarwar.melo', 'com.melo.app');
