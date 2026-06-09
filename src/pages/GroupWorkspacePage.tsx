import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, FileText, Video, Users, Info, LogOut, Share2, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GroupChatPage = React.lazy(() => import('@/pages/GroupChatPage'));
const GroupFilesPage = React.lazy(() => import('@/pages/GroupFilesPage'));
const GroupVideoPage = React.lazy(() => import('@/pages/GroupVideoPage'));

interface Group {
  id: string; name: string; description: string | null; subject: string | null;
  grade_level: string | null; is_public: boolean; created_by: string; created_at: string;
}
interface Member { user_id: string; role: string | null; joined_at?: string; profile?: { full_name: string | null; avatar_url: string | null } }

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'video', label: 'Meet', icon: Video },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'about', label: 'About', icon: Info },
] as const;

const GroupWorkspacePage: React.FC = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'chat';
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  const loadAll = async () => {
    if (!groupId) return;
    setLoading(true);
    const [{ data: g }, { data: m }] = await Promise.all([
      supabase.from('study_groups').select('*').eq('id', groupId).maybeSingle(),
      supabase.from('study_group_members').select('user_id, role').eq('group_id', groupId),
    ]);
    setGroup((g as Group) || null);
    const memberList = (m as Member[]) || [];
    if (memberList.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', memberList.map(x => x.user_id));
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      memberList.forEach(mem => { mem.profile = map.get(mem.user_id) || { full_name: 'Member', avatar_url: null }; });
    }
    setMembers(memberList);
    setIsMember(memberList.some(x => x.user_id === user?.id) || (g as any)?.created_by === user?.id);
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [groupId, user?.id]);

  const setTab = (t: string) => { params.set('tab', t); setParams(params, { replace: true }); };

  const join = async () => {
    if (!user || !group) return;
    const { error } = await supabase.from('study_group_members').insert({ group_id: group.id, user_id: user.id });
    if (error) toast.error(error.message); else { toast.success('Joined group'); loadAll(); }
  };
  const leave = async () => {
    if (!user || !group || group.created_by === user.id) return;
    if (!confirm('Leave this group?')) return;
    await supabase.from('study_group_members').delete().eq('group_id', group.id).eq('user_id', user.id);
    toast.success('Left group'); navigate('/groups');
  };
  const share = async () => {
    const url = window.location.origin + `/group/${groupId}`;
    try { await navigator.share?.({ title: group?.name, url }); }
    catch { navigator.clipboard.writeText(url); toast.success('Link copied'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!group) return <div className="text-center py-20"><p className="text-muted-foreground mb-4">Group not found</p><Button asChild><Link to="/groups">Back to groups</Link></Button></div>;

  return (
    <div className="space-y-4 -mx-3 lg:mx-0">
      {/* Header */}
      <div className="px-3 lg:px-0">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate('/groups')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All groups
        </Button>
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30" />
          <CardContent className="p-4 -mt-10">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-background border-4 border-background shadow-lg flex items-center justify-center text-2xl font-bold text-primary">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold truncate">{group.name}</h1>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-1">
                  {group.subject && <Badge variant="secondary">{group.subject}</Badge>}
                  {group.grade_level && <Badge variant="outline">{group.grade_level}</Badge>}
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{members.length} member{members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={share}><Share2 className="h-4 w-4" /></Button>
                {isMember ? (
                  group.created_by !== user?.id && (
                    <Button size="sm" variant="outline" onClick={leave}><LogOut className="h-4 w-4 mr-1" />Leave</Button>
                  )
                ) : (
                  <Button size="sm" onClick={join}>Join group</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-0 z-20 -mx-3 px-3 lg:mx-0 lg:px-0 bg-background/95 backdrop-blur border-b">
          <TabsList className="h-auto p-1 bg-transparent w-full justify-start overflow-x-auto no-scrollbar gap-1">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-xs lg:text-sm whitespace-nowrap">
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="px-3 lg:px-0 pt-2">
          {!isMember && tab !== 'about' && (
            <Card className="mb-3 border-primary/30 bg-primary/5">
              <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm">Join this group to participate in chat, files, and meetings.</p>
                <Button size="sm" onClick={join}>Join</Button>
              </CardContent>
            </Card>
          )}

          <Suspense fallback={<div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}>
            <TabsContent value="chat" className="mt-0">{isMember ? <GroupChatPage /> : <LockedTab />}</TabsContent>
            <TabsContent value="files" className="mt-0">{isMember ? <GroupFilesPage /> : <LockedTab />}</TabsContent>
            <TabsContent value="video" className="mt-0">{isMember ? <GroupVideoPage /> : <LockedTab />}</TabsContent>
            <TabsContent value="members" className="mt-0">
              <Card>
                <CardContent className="p-4 space-y-2">
                  {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No members yet</p>}
                  {members.map(m => (
                    <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-9 w-9">
                        {m.profile?.avatar_url && <img src={m.profile.avatar_url} alt="" />}
                        <AvatarFallback>{(m.profile?.full_name || 'M').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.profile?.full_name || 'Member'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.role || 'member'}{m.user_id === group.created_by && ' · owner'}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="about" className="mt-0 space-y-3">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-primary" />About this group</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{group.description || 'No description yet.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {group.subject && <div className="p-2 bg-muted/50 rounded"><p className="text-muted-foreground">Subject</p><p className="font-medium">{group.subject}</p></div>}
                    {group.grade_level && <div className="p-2 bg-muted/50 rounded"><p className="text-muted-foreground">Level</p><p className="font-medium">{group.grade_level}</p></div>}
                    <div className="p-2 bg-muted/50 rounded"><p className="text-muted-foreground">Visibility</p><p className="font-medium">{group.is_public ? 'Public' : 'Private'}</p></div>
                    <div className="p-2 bg-muted/50 rounded"><p className="text-muted-foreground">Created</p><p className="font-medium">{new Date(group.created_at).toLocaleDateString()}</p></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
};

const LockedTab = () => (
  <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Join this group to unlock this tab.</CardContent></Card>
);

export default GroupWorkspacePage;
