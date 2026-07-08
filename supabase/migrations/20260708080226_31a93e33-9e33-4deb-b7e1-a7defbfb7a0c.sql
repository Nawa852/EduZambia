
-- 1. Restrict sensitive columns on profiles from cross-user reads.
REVOKE SELECT (phone, date_of_birth, guardian_contact, guardian_details, app_block_consent) ON public.profiles FROM authenticated;
REVOKE SELECT (phone, date_of_birth, guardian_contact, guardian_details, app_block_consent) ON public.profiles FROM anon;

-- 2. Restrict mentor contact_email from cross-user reads (accessed via get_mentor_contact_email RPC).
REVOKE SELECT (contact_email) ON public.mentors_directory FROM authenticated;
REVOKE SELECT (contact_email) ON public.mentors_directory FROM anon;

-- 3. Storage uploads: enforce folder prefix = auth.uid() on INSERT.
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Leaderboard view: run with invoker permissions.
ALTER VIEW public.leaderboard_view SET (security_invoker = on);

-- 5. Lock down internal SECURITY DEFINER functions (trigger helpers) so signed-in
--    users cannot invoke them directly. Triggers still fire regardless of EXECUTE.
REVOKE EXECUTE ON FUNCTION public.on_lesson_completed()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_focus_session_saved()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_quiz_completed()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_submission_graded()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_assignment()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()   FROM PUBLIC, anon, authenticated;
