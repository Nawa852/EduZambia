CREATE TABLE IF NOT EXISTS public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text,
  route text,
  role text,
  duration_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS system_events_type_time_idx ON public.system_events(event_type, created_at DESC);
GRANT INSERT ON public.system_events TO authenticated, anon;
GRANT SELECT ON public.system_events TO authenticated;
GRANT ALL ON public.system_events TO service_role;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can record events" ON public.system_events FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "staff read events" ON public.system_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ministry') OR public.has_role(auth.uid(), 'institution'));

CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  details text,
  occurrences integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.monitoring_alerts TO authenticated;
GRANT ALL ON public.monitoring_alerts TO service_role;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage alerts" ON public.monitoring_alerts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ministry') OR public.has_role(auth.uid(), 'institution'))
  WITH CHECK (public.has_role(auth.uid(), 'ministry') OR public.has_role(auth.uid(), 'institution'));
CREATE TRIGGER monitoring_alerts_touch BEFORE UPDATE ON public.monitoring_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0,
  allowed_roles text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags readable" ON public.feature_flags FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "staff write flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ministry') OR public.has_role(auth.uid(), 'institution'))
  WITH CHECK (public.has_role(auth.uid(), 'ministry') OR public.has_role(auth.uid(), 'institution'));
CREATE TRIGGER feature_flags_touch BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.resource_repository (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'document',
  subject text,
  folder_path text NOT NULL DEFAULT 'General',
  bucket text NOT NULL DEFAULT 'uploads',
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  source text,
  is_public boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resource_repository_user_idx ON public.resource_repository(user_id, folder_path);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_repository TO authenticated;
GRANT ALL ON public.resource_repository TO service_role;
ALTER TABLE public.resource_repository ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resources" ON public.resource_repository FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public resources readable" ON public.resource_repository FOR SELECT TO authenticated
  USING (is_public = true);
CREATE TRIGGER resource_repository_touch BEFORE UPDATE ON public.resource_repository
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();