ALTER TABLE public.flashcard_decks
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description text;

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deck_id uuid NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.flashcard_cards(id) ON DELETE CASCADE,
  quality integer NOT NULL CHECK (quality BETWEEN 0 AND 5),
  seconds_spent integer NOT NULL DEFAULT 0,
  ease_after numeric,
  interval_after integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_reviews TO authenticated;
GRANT ALL ON public.flashcard_reviews TO service_role;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own flashcard reviews"
ON public.flashcard_reviews FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers view student flashcard reviews"
ON public.flashcard_reviews FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.user_id = flashcard_reviews.user_id
      AND c.created_by = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS flashcard_reviews_user_created_idx
  ON public.flashcard_reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS flashcard_reviews_deck_idx
  ON public.flashcard_reviews(deck_id);

CREATE TABLE IF NOT EXISTS public.user_progress_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  ref_key text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress_snapshots TO authenticated;
GRANT ALL ON public.user_progress_snapshots TO service_role;
ALTER TABLE public.user_progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress snapshots"
ON public.user_progress_snapshots FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_progress_snapshots_user_idx
  ON public.user_progress_snapshots(user_id, updated_at DESC);

CREATE TRIGGER user_progress_snapshots_touch
BEFORE UPDATE ON public.user_progress_snapshots
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();