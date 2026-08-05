-- ============ Resource repository: shared library ============
ALTER TABLE public.resource_repository
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS grade_level text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS downloads integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_resource_repo_public ON public.resource_repository (is_public, category, created_at DESC);

CREATE OR REPLACE FUNCTION public.increment_resource_download(_resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.resource_repository
  SET downloads = downloads + 1
  WHERE id = _resource_id AND (is_public = true OR user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.increment_resource_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_resource_download(uuid) TO authenticated;

-- ============ Classes: join codes, roster, invites ============
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS term text,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS join_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_join_code ON public.classes (join_code) WHERE join_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.ensure_class_join_code(_class_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_code text; v_existing text;
BEGIN
  SELECT join_code INTO v_existing FROM public.classes
  WHERE id = _class_id AND teacher_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'not your class'; END IF;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classes WHERE join_code = v_code);
  END LOOP;
  UPDATE public.classes SET join_code = v_code WHERE id = _class_id;
  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_class_join_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_class_join_code(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_class_with_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_class uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_class FROM public.classes
  WHERE join_code = upper(trim(_code)) AND archived = false;
  IF v_class IS NULL THEN RAISE EXCEPTION 'invalid class code'; END IF;

  INSERT INTO public.class_enrollments (class_id, student_id, status)
  VALUES (v_class, v_user, 'active')
  ON CONFLICT DO NOTHING;

  RETURN v_class;
END;
$$;

REVOKE ALL ON FUNCTION public.join_class_with_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_with_code(text) TO authenticated;

-- ============ Class invites ============
CREATE TABLE IF NOT EXISTS public.class_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_invites TO authenticated;
GRANT ALL ON public.class_invites TO service_role;
ALTER TABLE public.class_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage invites for their classes"
ON public.class_invites FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_invites.class_id AND c.teacher_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_invites.class_id AND c.teacher_id = auth.uid()));

CREATE TRIGGER class_invites_touch BEFORE UPDATE ON public.class_invites
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Favourites / bookmarks in navigation ============
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own favorites"
ON public.user_favorites FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());