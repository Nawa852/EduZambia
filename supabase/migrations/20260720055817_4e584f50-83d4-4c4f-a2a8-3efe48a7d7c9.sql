
CREATE TABLE public.study_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  board TEXT,
  objectives TEXT,
  target_grade TEXT,
  exam_date DATE,
  daily_minutes INT DEFAULT 30,
  level TEXT,
  learning_style TEXT,
  color TEXT DEFAULT 'blue',
  emoji TEXT DEFAULT '📘',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_courses TO authenticated;
GRANT ALL ON public.study_courses TO service_role;
ALTER TABLE public.study_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own courses" ON public.study_courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.study_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.study_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'file',
  mime TEXT,
  size_bytes BIGINT,
  storage_path TEXT,
  source_url TEXT,
  extracted_text TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_resources TO authenticated;
GRANT ALL ON public.study_resources TO service_role;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resources" ON public.study_resources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_study_resources_course ON public.study_resources(course_id);

CREATE TABLE public.study_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id UUID REFERENCES public.study_courses(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.study_resources(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_artifacts TO authenticated;
GRANT ALL ON public.study_artifacts TO service_role;
ALTER TABLE public.study_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own artifacts" ON public.study_artifacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_study_artifacts_course ON public.study_artifacts(course_id);
CREATE INDEX idx_study_artifacts_resource ON public.study_artifacts(resource_id);

CREATE TABLE public.study_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id UUID REFERENCES public.study_courses(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.study_resources(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_chat_messages TO authenticated;
GRANT ALL ON public.study_chat_messages TO service_role;
ALTER TABLE public.study_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat" ON public.study_chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_study_chat_course ON public.study_chat_messages(course_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_study_courses_updated BEFORE UPDATE ON public.study_courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_study_resources_updated BEFORE UPDATE ON public.study_resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_study_artifacts_updated BEFORE UPDATE ON public.study_artifacts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
