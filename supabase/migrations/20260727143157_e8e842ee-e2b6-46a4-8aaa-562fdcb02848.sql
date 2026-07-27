-- Signed-out visitors get no privileged routines at all.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.sig);
  END LOOP;
END $$;

-- Internal automation: not callable by app users at all.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        pg_get_function_result(p.oid) = 'trigger'
        OR p.proname IN (
          'email_queue_dispatch','enqueue_email','read_email_batch',
          'delete_email','move_to_dlq'
        )
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END $$;

-- award_xp is client-callable, so it must never trust the caller-supplied id
-- or let anyone credit another account.
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp integer, p_coins integer DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := COALESCE(auth.uid(), p_user_id);
  v_xp integer := LEAST(GREATEST(COALESCE(p_xp, 0), 0), 500);
  v_coins integer := LEAST(GREATEST(COALESCE(p_coins, 0), 0), 250);
BEGIN
  -- Called from triggers with no auth context: fall back to the passed id.
  IF auth.uid() IS NOT NULL THEN
    v_user := auth.uid();
  END IF;
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO user_stats (user_id, xp, edu_coins, level)
  VALUES (v_user, v_xp, v_coins, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    xp = user_stats.xp + v_xp,
    edu_coins = user_stats.edu_coins + v_coins,
    level = GREATEST(1, FLOOR((user_stats.xp + v_xp) / 100.0)::integer),
    updated_at = now();
END;
$function$;

REVOKE ALL ON FUNCTION public.award_xp(uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer) TO authenticated, service_role;
