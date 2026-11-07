CREATE TABLE public.open_learning_materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_url text NOT NULL UNIQUE,
 title text NOT NULL,
 language text NOT NULL DEFAULT 'loz',
 provider text NOT NULL,
 material_type text NOT NULL DEFAULT 'story' CHECK (material_type IN ('story','collection','phrasebook','curriculum')),
 level integer,
 license_name text,
 license_url text,
 attribution text,
 content text,
 download_url text,
 import_status text NOT NULL DEFAULT 'link_only' CHECK (import_status IN ('imported','link_only')),
 curriculum_status text NOT NULL DEFAULT 'not_verified' CHECK (curriculum_status IN ('not_verified','verified')),
 imported_at timestamptz NOT NULL DEFAULT now(),
 CHECK (import_status <> 'imported' OR (content IS NOT NULL AND length(content) > 0 AND license_url IS NOT NULL AND attribution IS NOT NULL))
);
GRANT SELECT ON public.open_learning_materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.open_learning_materials TO authenticated;
GRANT ALL ON public.open_learning_materials TO service_role;
ALTER TABLE public.open_learning_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in readers view open materials" ON public.open_learning_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Protected admins manage open materials" ON public.open_learning_materials FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));