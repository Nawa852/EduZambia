
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.teaching_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  grade_level text,
  resource_type text NOT NULL DEFAULT 'notes',
  file_url text,
  external_url text,
  source text DEFAULT 'own',
  tags text[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private',
  downloads integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teaching_resources TO authenticated;
GRANT ALL ON public.teaching_resources TO service_role;
ALTER TABLE public.teaching_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read public or own resources" ON public.teaching_resources FOR SELECT TO authenticated USING (visibility = 'public' OR owner_id = auth.uid());
CREATE POLICY "Insert own resources" ON public.teaching_resources FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Update own resources" ON public.teaching_resources FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Delete own resources" ON public.teaching_resources FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX idx_teaching_resources_subject ON public.teaching_resources(subject);
CREATE INDEX idx_teaching_resources_grade ON public.teaching_resources(grade_level);
CREATE INDEX idx_teaching_resources_owner ON public.teaching_resources(owner_id);
CREATE INDEX idx_teaching_resources_visibility ON public.teaching_resources(visibility);
CREATE TRIGGER trg_teaching_resources_updated BEFORE UPDATE ON public.teaching_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.teacher_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  grade_levels text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  qualifications text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_specializations TO authenticated;
GRANT ALL ON public.teacher_specializations TO service_role;
ALTER TABLE public.teacher_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Specializations readable" ON public.teacher_specializations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own specialization" ON public.teacher_specializations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own specialization" ON public.teacher_specializations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own specialization" ON public.teacher_specializations FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_teacher_specializations_updated BEFORE UPDATE ON public.teacher_specializations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
