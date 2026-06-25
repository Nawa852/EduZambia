
DROP VIEW IF EXISTS public.ctf_leaderboard;

CREATE OR REPLACE VIEW public.ctf_leaderboard
WITH (security_invoker = on) AS
SELECT id, user_id, challenge_name, is_correct, points, category, created_at
FROM public.ctf_submissions
WHERE is_correct = true;

GRANT SELECT ON public.ctf_leaderboard TO authenticated;

-- Allow authenticated users to read non-sensitive columns of correct submissions
-- (the column-level revoke below still hides `flag`).
DROP POLICY IF EXISTS "Authenticated view ctf leaderboard" ON public.ctf_submissions;
CREATE POLICY "Authenticated view ctf leaderboard"
ON public.ctf_submissions FOR SELECT
TO authenticated
USING (is_correct = true);

-- Hide the actual flag value from every signed-in user; the owner-manage policy
-- still lets submitters insert/update their own rows.
REVOKE SELECT (flag) ON public.ctf_submissions FROM authenticated;
REVOKE SELECT (flag) ON public.ctf_submissions FROM anon;
