CREATE OR REPLACE FUNCTION public.create_parent_invite_for_student(_student_id uuid)
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    WHERE ce.student_id = _student_id AND c.teacher_id = v_user
  ) THEN
    RAISE EXCEPTION 'you do not teach this student';
  END IF;

  SELECT link_code INTO v_existing
  FROM public.guardian_links
  WHERE student_id = _student_id AND guardian_id IS NULL AND link_code IS NOT NULL AND status = 'pending'
  LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.guardian_links WHERE link_code = v_code);
  END LOOP;

  INSERT INTO public.guardian_links (student_id, guardian_name, relationship, status, link_code, mode)
  VALUES (_student_id, 'Pending invite', 'guardian', 'pending', v_code, 'invite');

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_parent_invite_for_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_parent_invite_for_student(uuid) TO authenticated;