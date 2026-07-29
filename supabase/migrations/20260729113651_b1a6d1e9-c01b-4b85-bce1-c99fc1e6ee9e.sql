
-- 1. Follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows viewable by authenticated" ON public.user_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own follows" ON public.user_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users remove own follows" ON public.user_follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 2. Group roles
ALTER TABLE public.study_group_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

DO $$ BEGIN
  ALTER TABLE public.study_group_members ADD CONSTRAINT study_group_members_role_check
    CHECK (role IN ('owner','moderator','member'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_group_members TO authenticated;
GRANT ALL ON public.study_group_members TO service_role;

DROP POLICY IF EXISTS "Members view group members" ON public.study_group_members;
CREATE POLICY "Members view group members" ON public.study_group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()) OR EXISTS (
    SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.is_public = true));

DROP POLICY IF EXISTS "Users join groups" ON public.study_group_members;
CREATE POLICY "Users join groups" ON public.study_group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users leave or owner removes" ON public.study_group_members;
CREATE POLICY "Users leave or owner removes" ON public.study_group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.created_by = auth.uid()));

DROP POLICY IF EXISTS "Group owner manages roles" ON public.study_group_members;
CREATE POLICY "Group owner manages roles" ON public.study_group_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.created_by = auth.uid()));

-- 3. Live class replay
ALTER TABLE public.video_rooms
  ADD COLUMN IF NOT EXISTS recording_url text,
  ADD COLUMN IF NOT EXISTS description text;

-- 4. Notification triggers
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_name text;
BEGIN
  SELECT user_id INTO v_owner FROM public.social_posts WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(NULLIF(full_name,''),'Someone') INTO v_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_owner, 'reaction', 'New reaction', COALESCE(v_name,'Someone') || ' reacted to your post', '/connect?tab=feed');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_post_reaction ON public.social_reactions;
CREATE TRIGGER trg_notify_post_reaction AFTER INSERT ON public.social_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_post_reaction();

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_name text;
BEGIN
  SELECT user_id INTO v_owner FROM public.social_posts WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(NULLIF(full_name,''),'Someone') INTO v_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_owner, 'comment', 'New comment', COALESCE(v_name,'Someone') || ' commented on your post', '/connect?tab=feed');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_post_comment ON public.social_comments;
CREATE TRIGGER trg_notify_post_comment AFTER INSERT ON public.social_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  SELECT COALESCE(NULLIF(full_name,''),'Someone') INTO v_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (NEW.following_id, 'follow', 'New follower', COALESCE(v_name,'Someone') || ' started following you', '/connect?tab=feed');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.user_follows;
CREATE TRIGGER trg_notify_new_follower AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

CREATE OR REPLACE FUNCTION public.notify_page_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_page record;
BEGIN
  SELECT id, name, handle INTO v_page FROM public.community_pages WHERE id = NEW.page_id;
  IF v_page.id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT f.user_id, 'page_post', v_page.name || ' posted', left(NEW.content, 120), '/page/' || v_page.handle
  FROM public.page_followers f
  WHERE f.page_id = NEW.page_id AND f.user_id <> NEW.author_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_page_post ON public.page_posts;
CREATE TRIGGER trg_notify_page_post AFTER INSERT ON public.page_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_page_post();
