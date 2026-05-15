-- ============================================================================
-- SKYG Academy Template — Base Schema
-- Core LMS + auth profile schema required by the current Next.js application.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- Profiles
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS profiles_is_super_admin_idx ON public.profiles(is_super_admin) WHERE is_super_admin = true;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_super_admin FROM public.profiles p WHERE p.id = user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (p.is_admin OR p.is_super_admin) FROM public.profiles p WHERE p.id = user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_role_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
      NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin
    ) AND COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only super admins can change profile roles';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role
      AND NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin
      AND NEW.is_super_admin IS NOT DISTINCT FROM OLD.is_super_admin THEN
      NEW.is_super_admin := NEW.role = 'super_admin';
      NEW.is_admin := NEW.role IN ('admin', 'super_admin');
    ELSE
      NEW.role := CASE
        WHEN NEW.is_super_admin THEN 'super_admin'
        WHEN NEW.is_admin THEN 'admin'
        ELSE 'student'
      END;
    END IF;
  ELSE
    IF NEW.role IN ('admin', 'super_admin') AND NOT (NEW.is_admin OR NEW.is_super_admin) THEN
      NEW.is_super_admin := NEW.role = 'super_admin';
      NEW.is_admin := NEW.role IN ('admin', 'super_admin');
    ELSE
      NEW.role := CASE
        WHEN NEW.is_super_admin THEN 'super_admin'
        WHEN NEW.is_admin THEN 'admin'
        ELSE 'student'
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_role_flags ON public.profiles;
CREATE TRIGGER profiles_sync_role_flags
BEFORE INSERT OR UPDATE OF role, is_admin, is_super_admin ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_flags();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_admin, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student',
    false,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Courses / modules / lessons
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  published BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  promo_video_url TEXT,
  level TEXT,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  course_type TEXT NOT NULL DEFAULT 'course',
  show_in_landing BOOLEAN NOT NULL DEFAULT true,
  show_in_store BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courses_published_idx ON public.courses(published);
CREATE INDEX IF NOT EXISTS courses_created_at_idx ON public.courses(created_at DESC);
CREATE INDEX IF NOT EXISTS courses_show_in_landing_idx ON public.courses(show_in_landing) WHERE show_in_landing = true;
CREATE INDEX IF NOT EXISTS courses_show_in_store_idx ON public.courses(show_in_store) WHERE show_in_store = true;
CREATE INDEX IF NOT EXISTS courses_scheduled_at_idx ON public.courses(scheduled_at) WHERE scheduled_at IS NOT NULL;

DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;
CREATE TRIGGER courses_set_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index)
);

CREATE INDEX IF NOT EXISTS modules_course_id_idx ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS modules_course_order_idx ON public.modules(course_id, order_index);

DROP TRIGGER IF EXISTS modules_set_updated_at ON public.modules;
CREATE TRIGGER modules_set_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  resource_url TEXT,
  is_free_preview BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, position)
);

CREATE INDEX IF NOT EXISTS lessons_module_id_idx ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS lessons_module_position_idx ON public.lessons(module_id, position);
CREATE INDEX IF NOT EXISTS lessons_free_preview_idx ON public.lessons(is_free_preview) WHERE is_free_preview = true;

CREATE OR REPLACE FUNCTION public.sync_lesson_position_order_index()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.position = 0 AND NEW.order_index <> 0 THEN
      NEW.position := NEW.order_index;
    ELSE
      NEW.order_index := NEW.position;
    END IF;
  ELSE
    IF NEW.position IS DISTINCT FROM OLD.position THEN
      NEW.order_index := NEW.position;
    ELSIF NEW.order_index IS DISTINCT FROM OLD.order_index THEN
      NEW.position := NEW.order_index;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lessons_sync_position_order_index ON public.lessons;
CREATE TRIGGER lessons_sync_position_order_index
BEFORE INSERT OR UPDATE OF position, order_index ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.sync_lesson_position_order_index();

DROP TRIGGER IF EXISTS lessons_set_updated_at ON public.lessons;
CREATE TRIGGER lessons_set_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Enrollments
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS enrollments_course_id_idx ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS enrollments_active_idx ON public.enrollments(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS enrollments_user_course_active_idx ON public.enrollments(user_id, course_id, active);

CREATE OR REPLACE FUNCTION public.is_enrolled(course UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.enrollments e
      WHERE e.user_id = user_id
        AND e.course_id = course
        AND e.active = true
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
    ),
    false
  );
$$;

DROP TRIGGER IF EXISTS enrollments_set_updated_at ON public.enrollments;
CREATE TRIGGER enrollments_set_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Landing CMS blocks used by /admin/landing
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.landing_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS landing_blocks_enabled_idx ON public.landing_blocks(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS landing_blocks_order_idx ON public.landing_blocks(order_index);
CREATE INDEX IF NOT EXISTS landing_blocks_type_idx ON public.landing_blocks(type);

DROP TRIGGER IF EXISTS landing_blocks_set_updated_at ON public.landing_blocks;
CREATE TRIGGER landing_blocks_set_updated_at
BEFORE UPDATE ON public.landing_blocks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_blocks ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;
CREATE POLICY profiles_update_own_or_admin
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Courses
DROP POLICY IF EXISTS courses_public_read_published ON public.courses;
CREATE POLICY courses_public_read_published
ON public.courses FOR SELECT
USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS courses_admin_insert ON public.courses;
CREATE POLICY courses_admin_insert
ON public.courses FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS courses_admin_update ON public.courses;
CREATE POLICY courses_admin_update
ON public.courses FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS courses_admin_delete ON public.courses;
CREATE POLICY courses_admin_delete
ON public.courses FOR DELETE
USING (public.is_admin());

-- Modules
DROP POLICY IF EXISTS modules_read_accessible_courses ON public.modules;
CREATE POLICY modules_read_accessible_courses
ON public.modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = modules.course_id
      AND (c.published = true OR public.is_admin() OR public.is_enrolled(c.id))
  )
);

DROP POLICY IF EXISTS modules_admin_insert ON public.modules;
CREATE POLICY modules_admin_insert
ON public.modules FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS modules_admin_update ON public.modules;
CREATE POLICY modules_admin_update
ON public.modules FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS modules_admin_delete ON public.modules;
CREATE POLICY modules_admin_delete
ON public.modules FOR DELETE
USING (public.is_admin());

-- Lessons
DROP POLICY IF EXISTS lessons_read_accessible_courses ON public.lessons;
CREATE POLICY lessons_read_accessible_courses
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
      AND (
        c.published = true
        OR public.is_admin()
        OR public.is_enrolled(c.id)
      )
  )
);

DROP POLICY IF EXISTS lessons_admin_insert ON public.lessons;
CREATE POLICY lessons_admin_insert
ON public.lessons FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lessons_admin_update ON public.lessons;
CREATE POLICY lessons_admin_update
ON public.lessons FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lessons_admin_delete ON public.lessons;
CREATE POLICY lessons_admin_delete
ON public.lessons FOR DELETE
USING (public.is_admin());

-- Enrollments
DROP POLICY IF EXISTS enrollments_select_own_or_admin ON public.enrollments;
CREATE POLICY enrollments_select_own_or_admin
ON public.enrollments FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS enrollments_admin_insert ON public.enrollments;
CREATE POLICY enrollments_admin_insert
ON public.enrollments FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS enrollments_admin_update ON public.enrollments;
CREATE POLICY enrollments_admin_update
ON public.enrollments FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS enrollments_admin_delete ON public.enrollments;
CREATE POLICY enrollments_admin_delete
ON public.enrollments FOR DELETE
USING (public.is_admin());

-- Landing blocks
DROP POLICY IF EXISTS landing_blocks_public_read_enabled ON public.landing_blocks;
CREATE POLICY landing_blocks_public_read_enabled
ON public.landing_blocks FOR SELECT
USING (enabled = true OR public.is_admin());

DROP POLICY IF EXISTS landing_blocks_admin_insert ON public.landing_blocks;
CREATE POLICY landing_blocks_admin_insert
ON public.landing_blocks FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS landing_blocks_admin_update ON public.landing_blocks;
CREATE POLICY landing_blocks_admin_update
ON public.landing_blocks FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS landing_blocks_admin_delete ON public.landing_blocks;
CREATE POLICY landing_blocks_admin_delete
ON public.landing_blocks FOR DELETE
USING (public.is_admin());
