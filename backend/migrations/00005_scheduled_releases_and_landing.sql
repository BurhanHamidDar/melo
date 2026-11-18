-- Migration: 00005_scheduled_releases_and_landing.sql
-- Adds scheduled release capabilities to app_releases and creates landing_content table for landing page CMS.

-- 1. Enhance app_releases with scheduled_release_at and landing flags
ALTER TABLE app_releases 
    ADD COLUMN IF NOT EXISTS scheduled_release_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS r2_object_key TEXT NULL,
    ADD COLUMN IF NOT EXISTS is_landing_primary BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_releases_scheduled ON app_releases(scheduled_release_at, status);

-- 2. Landing content table for screenshots, taglines, and announcement banners
CREATE TABLE IF NOT EXISTS landing_content (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hero_headline TEXT NOT NULL DEFAULT 'Music, With style <3',
    hero_subtext TEXT NOT NULL DEFAULT 'A free music player for Android with style. Player styles, synced lyrics, and cloud library sync.',
    alert_banner_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    alert_banner_text TEXT NULL,
    alert_banner_type TEXT NOT NULL DEFAULT 'emerald' CHECK (alert_banner_type IN ('info', 'emerald', 'amber')),
    alert_banner_link TEXT NULL,
    screenshots JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default landing content row if table is empty
INSERT INTO landing_content (is_active, hero_headline, hero_subtext, alert_banner_enabled, alert_banner_text, alert_banner_type, screenshots)
SELECT 
    TRUE,
    'Music, With style <3',
    'A free music player for Android with style. Player styles, synced lyrics, and cloud library sync.',
    FALSE,
    'Melo V2 with Cloud Sync is now available!',
    'emerald',
    '[{"url": "assets/img/mochy-hero.webp", "caption": "Dynamic Player", "order": 1}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM landing_content);
