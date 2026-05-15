-- ==========================================================================
-- FASE 2C — Fix Real DB Persistence
-- Ensure admin/editor reads can see persisted modules and lessons through RLS,
-- and ensure legacy databases have the FK relationships required by PostgREST
-- nested course -> modules -> lessons queries.
-- ==========================================================================
-- Required relationship for courses -> modules nested reads.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'modules_course_id_fkey'
      AND conrelid = 'public.modules'::regclass
  ) THEN
    ALTER TABLE public.modules
      ADD CONSTRAINT modules_course_id_fkey
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Required relationship for modules -> lessons nested reads.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_module_id_fkey'
      AND conrelid = 'public.lessons'::regclass
  ) THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_module_id_fkey
      FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
  END IF;
END $$;


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

CREATE OR REPLACE FUNCTION public.is_enrolled(course UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT e.active
      FROM public.enrollments e
      WHERE e.course_id = course
        AND e.user_id = user_id
        AND e.active = true
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
      LIMIT 1
    ),
    false
  );
$$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Admins must be able to read unpublished course content in the editor.
DROP POLICY IF EXISTS courses_public_read_published ON public.courses;
CREATE POLICY courses_public_read_published
ON public.courses FOR SELECT
USING (published = true OR public.is_admin());

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

DROP POLICY IF EXISTS lessons_read_accessible_courses ON public.lessons;
CREATE POLICY lessons_read_accessible_courses
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
      AND (c.published = true OR public.is_admin() OR public.is_enrolled(c.id))
  )
);

-- Writes stay admin-only; service-role API writes bypass RLS, but these policies
-- keep direct authenticated admin writes explicit and non-silent.
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
