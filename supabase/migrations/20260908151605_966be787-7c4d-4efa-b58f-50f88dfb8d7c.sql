ALTER TABLE public.study_group_members DROP CONSTRAINT IF EXISTS study_group_members_role_check;
ALTER TABLE public.study_group_members ADD CONSTRAINT study_group_members_role_check
  CHECK (role IN ('owner','moderator','member','teacher'));

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins read admin list" ON public.admin_users;
CREATE POLICY "Admins read admin list" ON public.admin_users FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read all quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Admins read all quiz attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read all focus sessions" ON public.focus_sessions;
CREATE POLICY "Admins read all focus sessions" ON public.focus_sessions FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read all lesson completions" ON public.lesson_completions;
CREATE POLICY "Admins read all lesson completions" ON public.lesson_completions FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read all resources" ON public.resource_repository;
CREATE POLICY "Admins read all resources" ON public.resource_repository FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage resources" ON public.resource_repository;
CREATE POLICY "Admins manage resources" ON public.resource_repository FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read system events" ON public.system_events;
CREATE POLICY "Admins read system events" ON public.system_events FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read monitoring alerts" ON public.monitoring_alerts;
CREATE POLICY "Admins read monitoring alerts" ON public.monitoring_alerts FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));