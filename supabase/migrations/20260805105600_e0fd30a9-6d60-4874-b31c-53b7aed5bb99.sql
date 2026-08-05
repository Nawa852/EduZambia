CREATE TABLE IF NOT EXISTS public.note_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'folder',
  color text NOT NULL DEFAULT 'blue',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_folders TO authenticated;
GRANT ALL ON public.note_folders TO service_role;

ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own note folders" ON public.note_folders;
CREATE POLICY "Users manage own note folders" ON public.note_folders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS note_folders_updated_at ON public.note_folders;
CREATE TRIGGER note_folders_updated_at
  BEFORE UPDATE ON public.note_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.student_notes
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.note_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '📄',
  ADD COLUMN IF NOT EXISTS cover text,
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS word_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resource_id uuid;

CREATE INDEX IF NOT EXISTS student_notes_user_updated_idx ON public.student_notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS student_notes_folder_idx ON public.student_notes (folder_id);
CREATE INDEX IF NOT EXISTS note_folders_user_idx ON public.note_folders (user_id, position);