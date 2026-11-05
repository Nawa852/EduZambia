CREATE OR REPLACE FUNCTION public.can_read_connected_profile(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT auth.uid() IS NOT NULL AND (
 _profile_id = auth.uid()
 OR EXISTS (SELECT 1 FROM public.guardian_links g WHERE g.student_id = _profile_id AND g.guardian_id = auth.uid() AND g.status IN ('active','accepted'))
 OR EXISTS (SELECT 1 FROM public.class_enrollments ce JOIN public.classes c ON c.id=ce.class_id WHERE ce.student_id=_profile_id AND c.teacher_id=auth.uid() AND ce.status='active')
) $$;
REVOKE ALL ON FUNCTION public.can_read_connected_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_connected_profile(uuid) TO authenticated;
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;
CREATE POLICY "Owners and connected educators read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.can_read_connected_profile(id));

DROP POLICY IF EXISTS "Anyone authenticated can view rooms" ON public.video_rooms;
CREATE POLICY "Hosts read archived rooms" ON public.video_rooms FOR SELECT TO authenticated USING (host_id=auth.uid());
DROP POLICY IF EXISTS "View participants" ON public.video_room_participants;
CREATE POLICY "Users read own room participation" ON public.video_room_participants FOR SELECT TO authenticated USING (user_id=auth.uid());
COMMENT ON TABLE public.video_rooms IS 'DEPRECATED: video-room experience retired; historic data is host-only.';
COMMENT ON TABLE public.video_room_participants IS 'DEPRECATED: historic participation is visible only to its subject.';

DROP POLICY IF EXISTS "Follows viewable by authenticated" ON public.user_follows;
CREATE POLICY "Users read own follow connections" ON public.user_follows FOR SELECT TO authenticated USING (follower_id=auth.uid() OR following_id=auth.uid());
DROP POLICY IF EXISTS "View memberships" ON public.study_group_members;
DROP POLICY IF EXISTS "Members view group members" ON public.study_group_members;
CREATE POLICY "Group members read their roster" ON public.study_group_members FOR SELECT TO authenticated USING (public.is_group_member(group_id,auth.uid()));
DROP POLICY IF EXISTS "Anyone can view attendees" ON public.event_attendees;
CREATE POLICY "Users read own event attendance" ON public.event_attendees FOR SELECT TO authenticated USING (user_id=auth.uid());
DROP POLICY IF EXISTS "Comments viewable by authenticated" ON public.social_comments;
CREATE POLICY "Authors read archived comments" ON public.social_comments FOR SELECT TO authenticated USING (user_id=auth.uid());
DROP POLICY IF EXISTS "Posts viewable by authenticated" ON public.social_posts;
CREATE POLICY "Authors read archived posts" ON public.social_posts FOR SELECT TO authenticated USING (user_id=auth.uid());
COMMENT ON TABLE public.social_comments IS 'DEPRECATED: social feed retired; historic comments are author-only.';
COMMENT ON TABLE public.social_posts IS 'DEPRECATED: social feed retired; historic posts are author-only.';

ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;