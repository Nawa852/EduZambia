
-- 1. ctf_submissions
DROP POLICY IF EXISTS "Public view ctf leaderboard" ON public.ctf_submissions;

CREATE OR REPLACE VIEW public.ctf_leaderboard
WITH (security_invoker = off) AS
SELECT id, user_id, challenge_name, is_correct, points, category, created_at
FROM public.ctf_submissions
WHERE is_correct = true;

GRANT SELECT ON public.ctf_leaderboard TO authenticated;

-- 2. mentors_directory: hide contact_email
REVOKE SELECT (contact_email) ON public.mentors_directory FROM authenticated;
REVOKE SELECT (contact_email) ON public.mentors_directory FROM anon;

CREATE OR REPLACE FUNCTION public.get_mentor_contact_email(_mentor_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.contact_email
  FROM public.mentors_directory m
  WHERE m.id = _mentor_id
    AND (
      m.created_by = auth.uid()
      OR m.user_id  = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.mentor_requests mr
        WHERE mr.mentor_id = m.id
          AND mr.requester_id = auth.uid()
          AND mr.status IN ('accepted','approved')
      )
      OR EXISTS (
        SELECT 1 FROM public.mentorships ms
        WHERE ms.mentor_id = m.user_id
          AND ms.mentee_id = auth.uid()
          AND ms.status = 'active'
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.get_mentor_contact_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mentor_contact_email(uuid) TO authenticated;

-- 3. ngo_partnerships: require auth
DROP POLICY IF EXISTS "Authenticated users view partnerships" ON public.ngo_partnerships;
DROP POLICY IF EXISTS "Ministry users delete partnerships" ON public.ngo_partnerships;
DROP POLICY IF EXISTS "Ministry users insert partnerships" ON public.ngo_partnerships;
DROP POLICY IF EXISTS "Ministry users update partnerships" ON public.ngo_partnerships;

CREATE POLICY "Authenticated users view partnerships"
ON public.ngo_partnerships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners insert partnerships"
ON public.ngo_partnerships FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners update partnerships"
ON public.ngo_partnerships FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owners delete partnerships"
ON public.ngo_partnerships FOR DELETE TO authenticated USING (auth.uid() = created_by);

REVOKE SELECT ON public.ngo_partnerships FROM anon;

-- 4. partner_schools: hide phone / contact_person
REVOKE SELECT (contact_phone, contact_person) ON public.partner_schools FROM authenticated;
REVOKE SELECT (contact_phone, contact_person) ON public.partner_schools FROM anon;

CREATE OR REPLACE FUNCTION public.get_partner_school_contact(_school_id uuid)
RETURNS TABLE(contact_person text, contact_phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.contact_person, s.contact_phone
  FROM public.partner_schools s
  WHERE s.id = _school_id AND s.owner_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_partner_school_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_partner_school_contact(uuid) TO authenticated;

-- 5. profiles: block anonymous
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;
CREATE POLICY "Authenticated users view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 6. user_stats: block anonymous
DROP POLICY IF EXISTS "Public leaderboard view" ON public.user_stats;
CREATE POLICY "Authenticated leaderboard view"
ON public.user_stats FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_stats FROM anon;

-- 7. permissive system insert policies (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'achievements' AND relnamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can insert achievements" ON public.achievements';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'learning_analytics' AND relnamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "System can insert analytics" ON public.learning_analytics';
  END IF;
END $$;

-- 8. login_events: drop from realtime
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'login_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.login_events';
  END IF;
END $$;

-- 9. SECURITY DEFINER lockdown
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_lesson_completed()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_focus_session_saved()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_quiz_completed()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_assignment()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_submission_graded()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer)     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_user_streak(uuid)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats()                 FROM PUBLIC, anon;

-- 10. storage: drop broad public uploads SELECT policy
DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;

CREATE POLICY "Users view own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
