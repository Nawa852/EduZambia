-- Curriculum engine: competences with official codes
CREATE TABLE public.curriculum_competences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'specific',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, code)
);
GRANT SELECT ON public.curriculum_competences TO anon, authenticated;
GRANT ALL ON public.curriculum_competences TO service_role;
ALTER TABLE public.curriculum_competences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read competences" ON public.curriculum_competences FOR SELECT USING (true);
ALTER TABLE public.curriculum_topics ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.curriculum_topics ADD COLUMN IF NOT EXISTS term integer;

-- Schools (branded accounts + codes)
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  emis_number text,
  motto text,
  address text,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#0A84FF',
  secondary_color text NOT NULL DEFAULT '#30D158',
  school_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  staff_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER schools_touch BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.school_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  member_role text NOT NULL DEFAULT 'teacher',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.school_members TO authenticated;
GRANT ALL ON public.school_members TO service_role;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_school_member(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM schools WHERE id=_school_id AND owner_id=_user_id)
      OR EXISTS (SELECT 1 FROM school_members WHERE school_id=_school_id AND user_id=_user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_school_member(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid,uuid) TO authenticated;

CREATE POLICY "Members read school" ON public.schools FOR SELECT TO authenticated USING (public.is_school_member(id, auth.uid()));
CREATE POLICY "Owner creates school" ON public.schools FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates school" ON public.schools FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes school" ON public.schools FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Members see roster" ON public.school_members FOR SELECT TO authenticated USING (public.is_school_member(school_id, auth.uid()));
CREATE POLICY "Owner removes members" ON public.school_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM schools s WHERE s.id=school_id AND s.owner_id=auth.uid()) OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.join_school_with_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_school uuid; v_role text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id, 'teacher' INTO v_school, v_role FROM schools WHERE staff_code = upper(trim(_code));
  IF v_school IS NULL THEN
    SELECT id, 'learner' INTO v_school, v_role FROM schools WHERE school_code = upper(trim(_code));
  END IF;
  IF v_school IS NULL THEN RAISE EXCEPTION 'invalid school code'; END IF;
  INSERT INTO school_members (school_id, user_id, member_role) VALUES (v_school, v_user, v_role)
  ON CONFLICT (school_id, user_id) DO NOTHING;
  RETURN v_school;
END $$;
REVOKE EXECUTE ON FUNCTION public.join_school_with_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_school_with_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_school()
RETURNS SETOF public.schools LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.* FROM schools s
  WHERE s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM school_members m WHERE m.school_id=s.id AND m.user_id=auth.uid())
  ORDER BY (s.owner_id = auth.uid()) DESC LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_school() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_school() TO authenticated;

-- Mastery entries (teacher marks per learner per competence)
CREATE TABLE public.mastery_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  competence_code text NOT NULL,
  competence_title text,
  mastered boolean NOT NULL,
  lesson_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id, competence_code, lesson_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mastery_entries TO authenticated;
GRANT ALL ON public.mastery_entries TO service_role;
ALTER TABLE public.mastery_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own class mastery" ON public.mastery_entries FOR ALL TO authenticated
  USING (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM classes c WHERE c.id=class_id AND c.teacher_id=auth.uid()))
  WITH CHECK (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM classes c WHERE c.id=class_id AND c.teacher_id=auth.uid()));
CREATE POLICY "Learner reads own mastery" ON public.mastery_entries FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Guardian reads child mastery" ON public.mastery_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM guardian_links g WHERE g.student_id = mastery_entries.student_id AND g.guardian_id = auth.uid() AND g.status='accepted'));

-- Lesson plan version history
CREATE TABLE public.lesson_plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  content jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.lesson_plan_versions TO authenticated;
GRANT ALL ON public.lesson_plan_versions TO service_role;
ALTER TABLE public.lesson_plan_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manages own plan versions" ON public.lesson_plan_versions FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

-- Class list with guardian-link status (teacher only)
CREATE OR REPLACE FUNCTION public.get_class_roster(_class_id uuid)
RETURNS TABLE(student_id uuid, full_name text, guardian_linked boolean, mastered_count integer, entries_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ce.student_id, COALESCE(NULLIF(p.full_name,''),'Learner'),
    EXISTS (SELECT 1 FROM guardian_links g WHERE g.student_id=ce.student_id AND g.guardian_id IS NOT NULL AND g.status='accepted'),
    (SELECT count(*)::int FROM mastery_entries m WHERE m.class_id=_class_id AND m.student_id=ce.student_id AND m.mastered),
    (SELECT count(*)::int FROM mastery_entries m WHERE m.class_id=_class_id AND m.student_id=ce.student_id)
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id AND c.teacher_id = auth.uid()
  LEFT JOIN profiles p ON p.id = ce.student_id
  WHERE ce.class_id = _class_id
  ORDER BY 2
$$;
REVOKE EXECUTE ON FUNCTION public.get_class_roster(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_class_roster(uuid) TO authenticated;

-- School command overview (owner only)
CREATE OR REPLACE FUNCTION public.get_school_command(_school_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM schools WHERE id=_school_id AND owner_id=auth.uid()) THEN
    RAISE EXCEPTION 'not your school';
  END IF;
  WITH learners AS (SELECT user_id FROM school_members WHERE school_id=_school_id AND member_role='learner'),
       staff AS (SELECT user_id FROM school_members WHERE school_id=_school_id AND member_role='teacher')
  SELECT jsonb_build_object(
    'learners', (SELECT count(*) FROM learners),
    'teachers', (SELECT count(*) FROM staff),
    'guardian_linked', (SELECT count(DISTINCT l.user_id) FROM learners l JOIN guardian_links g ON g.student_id=l.user_id AND g.status='accepted' AND g.guardian_id IS NOT NULL),
    'plans_7d', (SELECT count(*) FROM lesson_plans lp JOIN staff s ON s.user_id=lp.teacher_id WHERE lp.created_at > now()-interval '7 days'),
    'teacher_activity', (SELECT COALESCE(jsonb_agg(t ORDER BY t->>'name'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('name', COALESCE(NULLIF(p.full_name,''),'Teacher'),
          'plans', (SELECT count(*) FROM lesson_plans lp WHERE lp.teacher_id=s.user_id AND lp.created_at > now()-interval '30 days'),
          'mastery_entries', (SELECT count(*) FROM mastery_entries m WHERE m.teacher_id=s.user_id AND m.created_at > now()-interval '30 days')) t
        FROM staff s LEFT JOIN profiles p ON p.id=s.user_id) x),
    'weak_competences', (SELECT COALESCE(jsonb_agg(w), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('code', m.competence_code, 'title', max(m.competence_title),
          'rate', round(100.0*avg(CASE WHEN m.mastered THEN 1 ELSE 0 END)), 'n', count(*)) w
        FROM mastery_entries m JOIN staff s ON s.user_id=m.teacher_id
        GROUP BY m.competence_code HAVING count(*) >= 3
        ORDER BY avg(CASE WHEN m.mastered THEN 1 ELSE 0 END) ASC LIMIT 8) y)
  ) INTO r;
  RETURN r;
END $$;
REVOKE EXECUTE ON FUNCTION public.get_school_command(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_school_command(uuid) TO authenticated;