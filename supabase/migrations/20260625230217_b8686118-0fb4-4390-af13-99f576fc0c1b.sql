
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_subjects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_goals_detailed jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS app_block_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guardian_details jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_extras_complete boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.curriculum_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'BookOpen',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade, code)
);
GRANT SELECT ON public.curriculum_subjects TO anon, authenticated;
GRANT ALL ON public.curriculum_subjects TO service_role;
ALTER TABLE public.curriculum_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Curriculum subjects readable by all" ON public.curriculum_subjects FOR SELECT USING (true);
CREATE POLICY "Educators manage subjects" ON public.curriculum_subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'ministry') OR public.has_role(auth.uid(),'institution'))
  WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'ministry') OR public.has_role(auth.uid(),'institution'));

CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.curriculum_subjects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  objectives text[] DEFAULT '{}',
  difficulty text DEFAULT 'medium',
  estimated_minutes integer DEFAULT 30,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.curriculum_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON public.curriculum_topics(parent_id);
GRANT SELECT ON public.curriculum_topics TO anon, authenticated;
GRANT ALL ON public.curriculum_topics TO service_role;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics readable by all" ON public.curriculum_topics FOR SELECT USING (true);
CREATE POLICY "Educators manage topics" ON public.curriculum_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'ministry') OR public.has_role(auth.uid(),'institution'))
  WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'ministry') OR public.has_role(auth.uid(),'institution'));

CREATE TABLE IF NOT EXISTS public.curriculum_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  url text,
  description text,
  thumbnail_url text,
  duration_minutes integer,
  source text,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resources_topic ON public.curriculum_resources(topic_id);
GRANT SELECT ON public.curriculum_resources TO anon, authenticated;
GRANT ALL ON public.curriculum_resources TO service_role;
ALTER TABLE public.curriculum_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources readable by all" ON public.curriculum_resources FOR SELECT USING (true);
CREATE POLICY "Educators manage resources" ON public.curriculum_resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'ministry') OR public.has_role(auth.uid(),'institution'))
  WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'ministry') OR public.has_role(auth.uid(),'institution'));

CREATE TABLE IF NOT EXISTS public.user_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_type text,
  file_size_bytes bigint,
  category text DEFAULT 'general',
  subject text,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_materials_user ON public.user_materials(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_materials TO authenticated;
GRANT ALL ON public.user_materials TO service_role;
ALTER TABLE public.user_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own materials" ON public.user_materials FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_youtube_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_url text NOT NULL,
  channel_name text,
  channel_id text,
  kind text DEFAULT 'channel',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_youtube_user ON public.user_youtube_channels(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_youtube_channels TO authenticated;
GRANT ALL ON public.user_youtube_channels TO service_role;
ALTER TABLE public.user_youtube_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own channels" ON public.user_youtube_channels FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject text NOT NULL,
  location text,
  notes text,
  is_block_apps boolean DEFAULT true,
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_timetable_user ON public.user_timetables(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_timetables TO authenticated;
GRANT ALL ON public.user_timetables TO service_role;
ALTER TABLE public.user_timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own timetable" ON public.user_timetables FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_curriculum_subjects_updated ON public.curriculum_subjects;
CREATE TRIGGER trg_curriculum_subjects_updated BEFORE UPDATE ON public.curriculum_subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_curriculum_topics_updated ON public.curriculum_topics;
CREATE TRIGGER trg_curriculum_topics_updated BEFORE UPDATE ON public.curriculum_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_user_timetables_updated ON public.user_timetables;
CREATE TRIGGER trg_user_timetables_updated BEFORE UPDATE ON public.user_timetables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.curriculum_subjects (grade, code, name, description, color, icon, sort_order) VALUES
  ('7','MATH','Mathematics','Numbers, algebra, geometry, statistics','#3B82F6','Calculator',1),
  ('7','ENG','English','Reading, writing, grammar, comprehension','#8B5CF6','BookOpen',2),
  ('7','SCI','Integrated Science','Living things, matter, energy, earth','#10B981','FlaskConical',3),
  ('7','SS','Social Studies','Zambia, geography, civics, history','#F59E0B','Globe',4),
  ('9','MATH','Mathematics','Algebra, trigonometry, geometry, statistics','#3B82F6','Calculator',1),
  ('9','ENG','English Language','Composition, comprehension, literature','#8B5CF6','BookOpen',2),
  ('9','SCI','Integrated Science','Biology, chemistry, physics basics','#10B981','FlaskConical',3),
  ('9','SS','Social & Development Studies','Zambian society, governance, economics','#F59E0B','Globe',4),
  ('12','MATH','Mathematics','Calculus, vectors, probability, mechanics','#3B82F6','Calculator',1),
  ('12','ENG','English Language','Advanced composition, summary, literature','#8B5CF6','BookOpen',2),
  ('12','BIO','Biology','Cells, genetics, ecology, human biology','#10B981','Leaf',3),
  ('12','CHE','Chemistry','Atomic structure, organic, inorganic, physical','#F97316','FlaskConical',4),
  ('12','PHY','Physics','Mechanics, waves, electricity, modern physics','#06B6D4','Atom',5),
  ('12','HIS','History','African and world history, Zambian independence','#A855F7','Landmark',6),
  ('12','GEO','Geography','Physical, human, Zambian geography','#84CC16','Map',7),
  ('12','CIV','Civic Education','Governance, citizenship, human rights','#EAB308','Scale',8)
ON CONFLICT (grade, code) DO NOTHING;
