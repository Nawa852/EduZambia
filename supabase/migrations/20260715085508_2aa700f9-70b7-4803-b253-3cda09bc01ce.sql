
-- Medical Suite
CREATE TABLE public.medical_cpd_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'clinical',
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  provider TEXT,
  evidence_url TEXT,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_cpd_activities TO authenticated;
GRANT ALL ON public.medical_cpd_activities TO service_role;
ALTER TABLE public.medical_cpd_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_cpd" ON public.medical_cpd_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.medical_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initials TEXT NOT NULL,
  age INT,
  sex TEXT,
  complaint TEXT,
  status TEXT DEFAULT 'active',
  next_review DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_patients TO authenticated;
GRANT ALL ON public.medical_patients TO service_role;
ALTER TABLE public.medical_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_patients" ON public.medical_patients FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.medical_case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.medical_patients(id) ON DELETE CASCADE,
  subjective TEXT, objective TEXT, assessment TEXT, plan TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_case_notes TO authenticated;
GRANT ALL ON public.medical_case_notes TO service_role;
ALTER TABLE public.medical_case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_case_notes" ON public.medical_case_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.medical_drug_lookups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  result JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_drug_lookups TO authenticated;
GRANT ALL ON public.medical_drug_lookups TO service_role;
ALTER TABLE public.medical_drug_lookups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_drug_lookups" ON public.medical_drug_lookups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entrepreneur
CREATE TABLE public.venture_cofounder_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skills TEXT[],
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_cofounder_matches TO authenticated;
GRANT ALL ON public.venture_cofounder_matches TO service_role;
ALTER TABLE public.venture_cofounder_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_or_target_cofounder" ON public.venture_cofounder_matches FOR SELECT USING (auth.uid() IN (user_id, target_user_id));
CREATE POLICY "create_cofounder" ON public.venture_cofounder_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_cofounder" ON public.venture_cofounder_matches FOR UPDATE USING (auth.uid() IN (user_id, target_user_id));
CREATE POLICY "delete_own_cofounder" ON public.venture_cofounder_matches FOR DELETE USING (auth.uid() = user_id);

-- Developer
CREATE TABLE public.developer_bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reward_kwacha NUMERIC(12,2) DEFAULT 0,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'open',
  deadline DATE,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_bounties TO authenticated;
GRANT ALL ON public.developer_bounties TO service_role;
ALTER TABLE public.developer_bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_bounties" ON public.developer_bounties FOR SELECT USING (true);
CREATE POLICY "poster_manage_bounties" ON public.developer_bounties FOR ALL USING (auth.uid() = poster_id) WITH CHECK (auth.uid() = poster_id);

CREATE TABLE public.developer_bounty_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.developer_bounties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  score INT,
  ai_review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_bounty_submissions TO authenticated;
GRANT ALL ON public.developer_bounty_submissions TO service_role;
ALTER TABLE public.developer_bounty_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_own_sub" ON public.developer_bounty_submissions FOR SELECT USING (auth.uid() = developer_id OR auth.uid() IN (SELECT poster_id FROM public.developer_bounties WHERE id = bounty_id));
CREATE POLICY "dev_create_sub" ON public.developer_bounty_submissions FOR INSERT WITH CHECK (auth.uid() = developer_id);
CREATE POLICY "dev_update_sub" ON public.developer_bounty_submissions FOR UPDATE USING (auth.uid() = developer_id OR auth.uid() IN (SELECT poster_id FROM public.developer_bounties WHERE id = bounty_id));
CREATE POLICY "dev_delete_sub" ON public.developer_bounty_submissions FOR DELETE USING (auth.uid() = developer_id);

CREATE TABLE public.developer_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Novice',
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.developer_reputation TO authenticated;
GRANT ALL ON public.developer_reputation TO service_role;
ALTER TABLE public.developer_reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_rep" ON public.developer_reputation FOR SELECT USING (true);

-- NGO
CREATE TABLE public.ngo_impact_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.ngo_programs(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  narrative TEXT,
  generated_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ngo_impact_reports TO authenticated;
GRANT ALL ON public.ngo_impact_reports TO service_role;
ALTER TABLE public.ngo_impact_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_impact" ON public.ngo_impact_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Skills
CREATE TABLE public.skills_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT,
  current_level TEXT,
  motivation TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills_profile TO authenticated;
GRANT ALL ON public.skills_profile TO service_role;
ALTER TABLE public.skills_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_skills_profile" ON public.skills_profile FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  evidence TEXT,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_assessments TO authenticated;
GRANT ALL ON public.skill_assessments TO service_role;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_skill_assess" ON public.skill_assessments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INT NOT NULL DEFAULT 0,
  generated_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_paths TO authenticated;
GRANT ALL ON public.learning_paths TO service_role;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_paths" ON public.learning_paths FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger reused
CREATE TRIGGER trg_med_pat_upd BEFORE UPDATE ON public.medical_patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_med_note_upd BEFORE UPDATE ON public.medical_case_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_med_cpd_upd BEFORE UPDATE ON public.medical_cpd_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bounty_upd BEFORE UPDATE ON public.developer_bounties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_paths_upd BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
