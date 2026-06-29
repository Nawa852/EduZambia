
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, grade text, subject text, room text,
  color text DEFAULT 'blue', schedule jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own classes" ON public.classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_enrollments TO authenticated;
GRANT ALL ON public.class_enrollments TO service_role;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage enrollments in their classes" ON public.class_enrollments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Students view own enrollments" ON public.class_enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students view enrolled classes" ON public.classes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_enrollments ce WHERE ce.class_id = classes.id AND ce.student_id = auth.uid()));

CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  title text NOT NULL, topic text, grade text, subject text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_plans TO authenticated;
GRANT ALL ON public.lesson_plans TO service_role;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own lesson plans" ON public.lesson_plans FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE TRIGGER lesson_plans_updated_at BEFORE UPDATE ON public.lesson_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.generated_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  title text NOT NULL, topic text, grade text, subject text,
  difficulty text DEFAULT 'medium',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_generated boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_quizzes TO authenticated;
GRANT ALL ON public.generated_quizzes TO service_role;
ALTER TABLE public.generated_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own quizzes" ON public.generated_quizzes FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE TRIGGER generated_quizzes_updated_at BEFORE UPDATE ON public.generated_quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.parent_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL, body text NOT NULL,
  ai_generated boolean DEFAULT false,
  sent_at timestamptz, read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_updates TO authenticated;
GRANT ALL ON public.parent_updates TO service_role;
ALTER TABLE public.parent_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own parent updates" ON public.parent_updates FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Parents view their updates" ON public.parent_updates FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.guardian_links gl
    WHERE gl.student_id = parent_updates.student_id AND gl.guardian_id = auth.uid()
  ));
CREATE POLICY "Students view their updates" ON public.parent_updates FOR SELECT TO authenticated
  USING (student_id = auth.uid());
