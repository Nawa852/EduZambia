CREATE OR REPLACE FUNCTION public.notify_followers_new_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_name text;
BEGIN
  SELECT COALESCE(NULLIF(full_name,''),'Someone') INTO v_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT f.follower_id, 'new_post', COALESCE(v_name,'Someone') || ' posted', left(NEW.content, 120), '/connect?tab=feed'
  FROM public.user_follows f
  WHERE f.following_id = NEW.user_id AND f.follower_id <> NEW.user_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_followers_new_post ON public.social_posts;
CREATE TRIGGER trg_notify_followers_new_post
AFTER INSERT ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_post();

CREATE OR REPLACE FUNCTION public.notify_followers_live_class()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_name text; v_live boolean;
BEGIN
  v_live := NEW.scheduled_at IS NULL OR NEW.scheduled_at <= now() + interval '1 minute';
  SELECT COALESCE(NULLIF(full_name,''),'A host') INTO v_name FROM public.profiles WHERE id = NEW.host_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT f.follower_id,
         CASE WHEN v_live THEN 'live_class' ELSE 'scheduled_class' END,
         CASE WHEN v_live THEN COALESCE(v_name,'A host') || ' is live now' ELSE COALESCE(v_name,'A host') || ' scheduled a class' END,
         NEW.title,
         '/video-rooms'
  FROM public.user_follows f
  WHERE f.following_id = NEW.host_id AND f.follower_id <> NEW.host_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_followers_live_class ON public.video_rooms;
CREATE TRIGGER trg_notify_followers_live_class
AFTER INSERT ON public.video_rooms
FOR EACH ROW EXECUTE FUNCTION public.notify_followers_live_class();

ALTER TABLE public.video_rooms ADD COLUMN IF NOT EXISTS ended_by uuid;