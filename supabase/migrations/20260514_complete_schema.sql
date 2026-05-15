-- ═══════════════════════════════════════════════════════════════════════
-- SKYG Academy — Complete Schema Migration
-- Execute in Supabase SQL Editor
-- Schema rule: modules → order_index | lessons → position
-- ═══════════════════════════════════════════════════════════════════════

-- ── COURSES: Required columns ─────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type       TEXT DEFAULT 'course';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_in_landing   BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_in_store     BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url     TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS promo_video_url   TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level             TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes  INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_at      TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS published         BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug              TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description       TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_cents       INTEGER DEFAULT 0;

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses (slug);

-- ── MODULES: Uses order_index ─────────────────────────────────────────
ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- ── LESSONS: Uses position (NOT order_index) ──────────────────────────
-- IMPORTANT: lessons use 'position' for ordering
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS position         INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url        TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free_preview  BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id        UUID;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS course_id        UUID;

-- Normalize: if any lessons have position = NULL, set from rownum
UPDATE lessons SET position = 0 WHERE position IS NULL;

-- ── PROFILES: Role columns ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin       BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url     TEXT;

-- ── ENROLLMENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
  active      BOOLEAN DEFAULT true,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_enrollments" ON enrollments
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_all_enrollments" ON enrollments
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin OR is_super_admin))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── LESSON PROGRESS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed    BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_lesson_progress" ON lesson_progress
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── THEME ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS theme (
  id                INTEGER PRIMARY KEY DEFAULT 1,
  brand_name        TEXT DEFAULT 'SKYG Academy',
  logo_url          TEXT,
  primary_color     TEXT DEFAULT '#3589F2',
  accent_color      TEXT DEFAULT '#E8004A',
  bg_color          TEXT DEFAULT '#070B12',
  surface_color     TEXT DEFAULT '#0D1421',
  glow_color        TEXT DEFAULT 'rgba(53,137,242,0.13)',
  glow_accent_color TEXT DEFAULT 'rgba(232,0,74,0.07)',
  text_color        TEXT DEFAULT '#E8EFF8',
  muted_color       TEXT DEFAULT '#8FA4C4',
  font_display      TEXT DEFAULT 'Sora',
  font_body         TEXT DEFAULT 'DM Sans',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO theme (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE theme ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "public_read_theme" ON theme FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "superadmin_write_theme" ON theme
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── LIVE CLASSES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_classes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  zoom_url         TEXT NOT NULL,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  course_id        UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_public        BOOLEAN DEFAULT false,
  created_by       UUID REFERENCES auth.users(id),
  recording_url    TEXT,
  status           TEXT DEFAULT 'scheduled',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "read_live_classes" ON live_classes
    FOR SELECT USING (is_public = true OR auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_manage_live_classes" ON live_classes
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin OR is_super_admin))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── PRODUCTS / STORE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  type        TEXT NOT NULL DEFAULT 'digital',
  active      BOOLEAN DEFAULT true,
  course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  image_url   TEXT,
  featured    BOOLEAN DEFAULT false,
  stock       INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "public_read_products" ON products
    FOR SELECT USING (active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_manage_products" ON products
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin OR is_super_admin))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── LANDING BLOCKS (CMS) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landing_blocks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type        TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  enabled     BOOLEAN DEFAULT true,
  content     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE landing_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "public_read_landing_blocks" ON landing_blocks
    FOR SELECT USING (enabled = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_manage_landing_blocks" ON landing_blocks
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin OR is_super_admin))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ORDERS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID REFERENCES auth.users(id),
  status                      TEXT DEFAULT 'pending',
  amount_cents                INTEGER NOT NULL,
  currency                    TEXT DEFAULT 'mxn',
  stripe_checkout_session_id  TEXT UNIQUE,
  stripe_payment_intent_id    TEXT,
  customer_email              TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  paid_at                     TIMESTAMPTZ,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_all_orders" ON orders
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin OR is_super_admin))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── STORAGE BUCKET ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "public_read_brand_assets"
    ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_upload_brand_assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'brand-assets' AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin OR is_super_admin))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, is_admin, is_super_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- DONE
-- Schema rule enforced:
--   modules   → order_index  (INTEGER)
--   lessons   → position     (INTEGER)
-- ─────────────────────────────────────────────────────────────────────
