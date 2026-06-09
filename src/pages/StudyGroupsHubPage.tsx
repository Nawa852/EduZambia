import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Search, Sparkles, TrendingUp, Lock, Globe2, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Group {
  id: string; name: string; description: string | null; subject: string | null;
  grade_level: string | null; is_public: boolean; created_by: string; created_at: string;
}

const CATEGORIES = ['All', 'Mathematics', 'Sciences', 'Languages', 'Humanities', 'ICT', 'Exam Prep', 'Career'];
const SUBJECT_TO_CAT: Record<string, string> = {
  Math: 'Mathematics', Mathematics: 'Mathematics',
  Physics: 'Sciences', Chemistry: 'Sciences', Biology: 'Sciences', Science: 'Sciences',
  English: 'Languages', Bemba: 'Languages', Nyanja: 'Languages', Tonga: 'Languages', Lozi: 'Languages',
  History: 'Humanities', Geography: 'Humanities', 'Religious Education': 'Humanities',
  ICT: 'ICT', Computing: 'ICT', Coding: 'ICT',
  ECZ: 'Exam Prep', Exam: 'Exam Prep', Revision: 'Exam Prep',
};

const StudyGroupsHubPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', subject: '', grade_level: '', is_public: true });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false }).limit(200);
    const list = (data as Group[]) || [];
    setGroups(list);
    if (list.length) {
      const { data: mems } = await supabase.from('study_group_members').select('group_id, user_id').in('group_id', list.map(g => g.id));
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (mems || []).forEach((m: any) => {
        counts[m.group_id] = (counts[m.group_id] || 0) + 1;
        if (m.user_id === user?.id) mine.add(m.group_id);
      });
      setMemberCounts(counts);
      setMemberIds(mine);
    }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const create = async () => {
    if (!user) { toast.error('Please sign in'); return; }
    if (!form.name.trim()) { toast.error('Group name required'); return; }
    setCreating(true);
    const { data, error } = await supabase.from('study_groups').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      subject: form.subject.trim() || null,
      grade_level: form.grade_level.trim() || null,
      is_public: form.is_public,
      created_by: user.id,
    }).select().single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    await supabase.from('study_group_members').insert({ group_id: (data as any).id, user_id: user.id });
    toast.success('Group created');
    setOpen(false);
    setForm({ name: '', description: '', subject: '', grade_level: '', is_public: true });
    navigate(`/group/${(data as any).id}`);
  };

  const join = async (g: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const { error } = await supabase.from('study_group_members').insert({ group_id: g.id, user_id: user.id });
    if (error) toast.error(error.message); else { toast.success(`Joined ${g.name}`); load(); }
  };

  const categorize = (g: Group) => SUBJECT_TO_CAT[g.subject || ''] || 'All';

  const filtered = useMemo(() => groups.filter(g => {
    const s = search.toLowerCase();
    const matchesSearch = !s || g.name.toLowerCase().includes(s) || (g.subject || '').toLowerCase().includes(s) || (g.description || '').toLowerCase().includes(s);
    const matchesCat = category === 'All' || categorize(g) === category;
    return matchesSearch && matchesCat;
  }), [groups, search, category]);

  const myGroups = filtered.filter(g => memberIds.has(g.id) || g.created_by === user?.id);
  const discover = filtered.filter(g => !memberIds.has(g.id) && g.created_by !== user?.id);
  const trending = [...discover].sort((a, b) => (memberCounts[b.id] || 0) - (memberCounts[a.id] || 0)).slice(0, 6);

  const Card_ = ({ g }: { g: Group }) => {
    const joined = memberIds.has(g.id) || g.created_by === user?.id;
    return (
      <Card className="group hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer active:scale-[0.99]" onClick={() => navigate(`/group/${g.id}`)}>
        <div className="h-12 bg-gradient-to-br from-primary/25 via-primary/15 to-accent/25 rounded-t-lg" />
        <CardContent className="p-3 -mt-6">
          <div className="flex items-start gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-background border-2 border-background shadow-md flex items-center justify-center text-base font-bold text-primary shrink-0">
              {g.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pt-1.5">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{g.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                {g.is_public ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                <span>·</span>
                <Users className="h-3 w-3" />
                <span>{memberCounts[g.id] || 0}</span>
              </div>
            </div>
          </div>
          {g.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{g.description}</p>}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {g.subject && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{g.subject}</Badge>}
            {g.grade_level && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{g.grade_level}</Badge>}
          </div>
          {!joined && (
            <Button size="sm" className="w-full mt-3 h-8 text-xs" onClick={(e) => join(g, e)}>Join group</Button>
          )}
          {joined && (
            <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/group/${g.id}`); }}>Open</Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground p-4 lg:p-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white_2px,transparent_2px)] [background-size:24px_24px]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold flex items-center gap-2"><Users className="h-6 w-6 lg:h-8 lg:w-8" /> Study Groups</h1>
              <p className="text-xs lg:text-sm text-primary-foreground/85 mt-1 max-w-md">Learn together. Share notes, schedule sessions, host meets, and crush exams as a team.</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="shrink-0"><Plus className="h-4 w-4 mr-1" /> New group</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create a study group</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Group name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Grade 12 Maths Squad" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" /></div>
                    <div><Label>Level</Label><Input value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} placeholder="Grade 12" /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will you study together?" rows={3} /></div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div><Label className="text-sm">Public group</Label><p className="text-xs text-muted-foreground">Anyone can find and join</p></div>
                    <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
                  </div>
                  <Button onClick={create} disabled={creating} className="w-full">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create group'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups, subjects, topics..." />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3 lg:mx-0 lg:px-0">
        {CATEGORIES.map(c => (
          <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="rounded-full h-8 text-xs whitespace-nowrap shrink-0" onClick={() => setCategory(c)}>
            {c}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="discover" className="text-xs"><Sparkles className="h-3.5 w-3.5 mr-1" />Discover</TabsTrigger>
          <TabsTrigger value="mine" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" />My groups <span className="ml-1 text-[10px] opacity-70">({myGroups.length})</span></TabsTrigger>
          <TabsTrigger value="trending" className="text-xs"><TrendingUp className="h-3.5 w-3.5 mr-1" />Trending</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <TabsContent value="discover" className="mt-4">
              {discover.length === 0 ? (
                <EmptyState onCreate={() => setOpen(true)} />
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {discover.map(g => <Card_ key={g.id} g={g} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="mine" className="mt-4">
              {myGroups.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  You haven't joined any groups yet.
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {myGroups.map(g => <Card_ key={g.id} g={g} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="trending" className="mt-4">
              {trending.length === 0 ? (
                <EmptyState onCreate={() => setOpen(true)} />
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {trending.map(g => <Card_ key={g.id} g={g} />)}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
    <p className="text-sm text-muted-foreground mb-3">No groups match your filters yet.</p>
    <Button size="sm" onClick={onCreate}><Plus className="h-4 w-4 mr-1" />Create the first one</Button>
  </div>
);

export default StudyGroupsHubPage;
