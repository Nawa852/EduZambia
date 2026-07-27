ALTER TABLE public.guardian_links ADD COLUMN IF NOT EXISTS link_code text;
CREATE UNIQUE INDEX IF NOT EXISTS guardian_links_link_code_key ON public.guardian_links (link_code) WHERE link_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_guardian_link_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
  v_existing text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT link_code INTO v_existing
  FROM public.guardian_links
  WHERE student_id = v_user AND guardian_id IS NULL AND link_code IS NOT NULL
    AND status = 'pending'
  LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.guardian_links WHERE link_code = v_code);
  END LOOP;

  INSERT INTO public.guardian_links (student_id, guardian_name, relationship, status, link_code, mode)
  VALUES (v_user, 'Pending invite', 'guardian', 'pending', v_code, 'invite');

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_guardian_link_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_link public.guardian_links%ROWTYPE;
  v_name text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO v_link FROM public.guardian_links
  WHERE link_code = upper(trim(_code)) AND guardian_id IS NULL AND status = 'pending'
  LIMIT 1;

  IF v_link.id IS NULL THEN RAISE EXCEPTION 'invalid or already used code'; END IF;
  IF v_link.student_id = v_user THEN RAISE EXCEPTION 'you cannot link to yourself'; END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'Guardian') INTO v_name FROM public.profiles WHERE id = v_user;

  UPDATE public.guardian_links
  SET guardian_id = v_user,
      guardian_name = COALESCE(v_name, 'Guardian'),
      status = 'accepted',
      link_code = NULL
  WHERE id = v_link.id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_link.student_id, 'guardian_linked', 'Guardian connected',
          COALESCE(v_name, 'Your guardian') || ' is now linked to your account.', '/profile');

  RETURN v_link.id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_guardian_link_code() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_guardian_link_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_guardian_link_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_guardian_link_code(text) TO authenticated;