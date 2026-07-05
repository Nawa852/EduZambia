
-- =========================================================
-- PROFILES: revoke sensitive columns from general read
-- =========================================================
REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (
  id, full_name, avatar_url, role, bio, school, grade, province,
  created_at, updated_at, device_setup_complete, theme_preference,
  education_level, institution_name, institution_type, program_of_study,
  year_of_study, subjects, exam_target, exam_year, study_goals,
  learning_style, preferred_language, subjects_taught, grades_taught,
  years_experience, teacher_qualification, num_children,
  favorite_subjects, app_block_consent, onboarding_extras_complete
) ON public.profiles TO authenticated;
GRANT SELECT (id, full_name, avatar_url, role) ON public.profiles TO anon;

-- Owner reads own full profile via RPC
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.profiles WHERE id = auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- =========================================================
-- GUARDIAN_LINKS: split the permissive ALL policy
-- =========================================================
DROP POLICY IF EXISTS "Students can manage own guardian links" ON public.guardian_links;
CREATE POLICY "Students view own guardian links"
  ON public.guardian_links FOR SELECT TO authenticated
  USING (auth.uid() = student_id);
CREATE POLICY "Students insert own guardian links"
  ON public.guardian_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own guardian links"
  ON public.guardian_links FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id AND student_id = (SELECT student_id FROM public.guardian_links g WHERE g.id = guardian_links.id));
CREATE POLICY "Students delete own guardian links"
  ON public.guardian_links FOR DELETE TO authenticated
  USING (auth.uid() = student_id);

-- Hide phone/email columns from general SELECT; owner/guardian read via RPC
REVOKE SELECT ON public.guardian_links FROM authenticated, anon;
GRANT SELECT (id, student_id, guardian_id, guardian_name, relationship, mode, status, created_at)
  ON public.guardian_links TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.guardian_links TO authenticated;

CREATE OR REPLACE FUNCTION public.get_guardian_link_contact(_link_id uuid)
RETURNS TABLE(phone text, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT g.phone, g.email FROM public.guardian_links g
  WHERE g.id = _link_id
    AND (g.student_id = auth.uid() OR g.guardian_id = auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.get_guardian_link_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_guardian_link_contact(uuid) TO authenticated;

-- =========================================================
-- MENTORS_DIRECTORY: hide contact_email at column level
-- =========================================================
REVOKE SELECT ON public.mentors_directory FROM authenticated, anon;
GRANT SELECT (id, user_id, name, expertise, bio, sectors, linkedin_url,
              directory_type, province, is_verified, created_by, created_at)
  ON public.mentors_directory TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mentors_directory TO authenticated;

-- =========================================================
-- NGO_PARTNERSHIPS: hide contact_email
-- =========================================================
REVOKE SELECT ON public.ngo_partnerships FROM authenticated, anon;
GRANT SELECT (id, ngo_name, program_name, focus_area, province, funding_amount,
              start_date, end_date, status, notes, created_by, created_at, updated_at)
  ON public.ngo_partnerships TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ngo_partnerships TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ngo_partnership_contact(_partnership_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.contact_email FROM public.ngo_partnerships p
  WHERE p.id = _partnership_id AND p.created_by = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_ngo_partnership_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ngo_partnership_contact(uuid) TO authenticated;

-- =========================================================
-- PARTNER_SCHOOLS: tighten SELECT to owners only
-- (get_partner_school_contact already exists for authorized reads)
-- =========================================================
DROP POLICY IF EXISTS "Schools viewable by authenticated" ON public.partner_schools;
CREATE POLICY "Owners view partner schools"
  ON public.partner_schools FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- =========================================================
-- ASSESSMENT_QUESTIONS: hide correct_answer + explanation from students
-- =========================================================
REVOKE SELECT ON public.assessment_questions FROM authenticated, anon;
GRANT SELECT (id, assessment_id, question_text, question_type, options,
              difficulty_level, points, order_index, created_at)
  ON public.assessment_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;

-- Server-side grading: returns score without ever exposing answers
CREATE OR REPLACE FUNCTION public.grade_assessment_attempt(
  _assessment_id uuid,
  _answers jsonb,
  _time_spent_minutes integer DEFAULT NULL
) RETURNS TABLE(
  attempt_id uuid, score integer, passed boolean,
  earned_points integer, total_points integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_earned integer := 0;
  v_total integer := 0;
  v_score integer := 0;
  v_pass_threshold numeric;
  v_passed boolean;
  v_attempt_number integer;
  v_attempt_id uuid;
  v_course_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT ca.pass_threshold, ca.course_id INTO v_pass_threshold, v_course_id
  FROM public.course_assessments ca WHERE ca.id = _assessment_id;
  IF v_pass_threshold IS NULL THEN v_pass_threshold := 70; END IF;

  SELECT
    COALESCE(SUM(q.points), 0),
    COALESCE(SUM(CASE WHEN _answers->>q.id::text = q.correct_answer THEN q.points ELSE 0 END), 0)
  INTO v_total, v_earned
  FROM public.assessment_questions q
  WHERE q.assessment_id = _assessment_id;

  IF v_total > 0 THEN v_score := ROUND((v_earned::numeric / v_total) * 100); END IF;
  v_passed := v_score >= v_pass_threshold;

  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_attempt_number
  FROM public.assessment_attempts
  WHERE assessment_id = _assessment_id AND user_id = v_user;

  INSERT INTO public.assessment_attempts(
    assessment_id, user_id, score, total_points, earned_points,
    answers, passed, completed_at, attempt_number, time_spent_minutes
  ) VALUES (
    _assessment_id, v_user, v_score, v_total, v_earned,
    _answers, v_passed, now(), v_attempt_number, _time_spent_minutes
  ) RETURNING id INTO v_attempt_id;

  -- Award XP
  PERFORM public.award_xp(v_user, CASE WHEN v_passed THEN 25 + (v_score/10) ELSE 10 END,
                                   CASE WHEN v_passed THEN 15 ELSE 5 END);

  -- Certificate on pass
  IF v_passed AND v_course_id IS NOT NULL THEN
    INSERT INTO public.certificates(user_id, course_id)
    SELECT v_user, v_course_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.user_id = v_user AND c.course_id = v_course_id
    );
  END IF;

  RETURN QUERY SELECT v_attempt_id, v_score, v_passed, v_earned, v_total;
END $$;
REVOKE EXECUTE ON FUNCTION public.grade_assessment_attempt(uuid, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_assessment_attempt(uuid, jsonb, integer) TO authenticated;

-- Review answers only after user has submitted an attempt
CREATE OR REPLACE FUNCTION public.get_assessment_review(_attempt_id uuid)
RETURNS TABLE(
  question_id uuid, question_text text, options jsonb,
  correct_answer text, explanation text, points integer, order_index integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT q.id, q.question_text, q.options, q.correct_answer, q.explanation, q.points, q.order_index
  FROM public.assessment_questions q
  JOIN public.assessment_attempts a ON a.assessment_id = q.assessment_id
  WHERE a.id = _attempt_id
    AND a.user_id = auth.uid()
    AND a.completed_at IS NOT NULL
  ORDER BY q.order_index
$$;
REVOKE EXECUTE ON FUNCTION public.get_assessment_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_assessment_review(uuid) TO authenticated;

-- =========================================================
-- CTF_SUBMISSIONS: hide flag column from SELECT
-- =========================================================
REVOKE SELECT ON public.ctf_submissions FROM authenticated, anon;
GRANT SELECT (id, user_id, challenge_name, is_correct, points, category, created_at)
  ON public.ctf_submissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ctf_submissions TO authenticated;

-- =========================================================
-- USER_STATS: hide edu_coins from other users
-- =========================================================
DROP POLICY IF EXISTS "Authenticated leaderboard view" ON public.user_stats;
DROP POLICY IF EXISTS "Users manage own stats" ON public.user_stats;

CREATE POLICY "Users view own stats"
  ON public.user_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stats"
  ON public.user_stats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats"
  ON public.user_stats FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stats"
  ON public.user_stats FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Public leaderboard view: exposes only non-sensitive columns
CREATE OR REPLACE VIEW public.leaderboard_view
WITH (security_invoker = false)
AS SELECT user_id, xp, level, current_streak, longest_streak,
          total_lessons_completed, total_quizzes_passed, total_focus_minutes
   FROM public.user_stats;
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- =========================================================
-- SECURITY DEFINER trigger functions: revoke authenticated execute
-- (triggers still fire under table owner; no direct client call needed)
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.on_lesson_completed() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.on_focus_session_saved() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_submission_graded() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.on_quiz_completed() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_assignment() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, authenticated, anon;
