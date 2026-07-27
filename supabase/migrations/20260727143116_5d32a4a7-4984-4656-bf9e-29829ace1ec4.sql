-- 1. PROFILES: hide direct contact/PII columns from other members.
-- RLS cannot filter columns, so we use column-level privileges. Users still
-- read their own complete row through public.get_my_profile().
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, role, bio, school, grade, province,
  created_at, updated_at, device_setup_complete, theme_preference,
  education_level, institution_name, institution_type, program_of_study,
  year_of_study, subjects, exam_target, exam_year, study_goals,
  career_interest, learning_style, preferred_language, subjects_taught,
  grades_taught, years_experience, teacher_qualification,
  relationship_to_child, num_children, favorite_subjects,
  learning_goals_detailed, app_block_consent, onboarding_extras_complete
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. MENTORS DIRECTORY: contact_email only via get_mentor_contact_email().
REVOKE SELECT ON public.mentors_directory FROM anon, authenticated;
GRANT SELECT (
  id, user_id, name, expertise, bio, sectors, linkedin_url,
  directory_type, province, is_verified, created_by, created_at
) ON public.mentors_directory TO authenticated;
GRANT ALL ON public.mentors_directory TO service_role;

-- 3. ASSESSMENT QUESTIONS: never hand the answer key to a learner.
REVOKE SELECT ON public.assessment_questions FROM anon, authenticated;
GRANT SELECT (
  id, assessment_id, question_text, options, points, order_index,
  question_type, difficulty_level, created_at
) ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;

-- Authors still need the key to edit their own course assessments.
CREATE OR REPLACE FUNCTION public.get_assessment_answer_key(_assessment_id uuid)
RETURNS TABLE(question_id uuid, correct_answer text, explanation text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.id, q.correct_answer, q.explanation
  FROM public.assessment_questions q
  JOIN public.course_assessments ca ON ca.id = q.assessment_id
  JOIN public.courses c ON c.id = ca.course_id
  WHERE q.assessment_id = _assessment_id
    AND c.created_by = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.get_assessment_answer_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_assessment_answer_key(uuid) TO authenticated;

-- 4. GUARDIAN LINKS: the self-referencing WITH CHECK was a no-op; replace it
-- with a straightforward owner check that cannot be re-pointed.
DROP POLICY IF EXISTS "Students update own guardian links" ON public.guardian_links;
CREATE POLICY "Students update own guardian links"
ON public.guardian_links
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- 5. SECURITY DEFINER helpers: pin search_path and stop client roles from
-- executing internal queue plumbing.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_xp(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM anon;
