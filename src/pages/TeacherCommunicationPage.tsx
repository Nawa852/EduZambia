import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare, Megaphone, Send, Search, Users, Mail,
  Bell, FileText, Plus,
} from 'lucide-react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  name: string;
  subtitle: string;
  unread: number;
  last: string;
  time: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  audience: string;
  created_at: string;
}

export default function TeacherCommunicationPage() {
  const { user } = useSecureAuth();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [audience, setAudience] = useState('all-students');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [posting, setPosting] = useState(false);

  // Demo conversations — sourced from chat_rooms if available, else fallback
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 'c1', name: 'Grade 11A Mathematics', subtitle: '32 students', unread: 3, last: 'When is the next quiz?', time: '12 min' },
    { id: 'c2', name: 'Grade 10B Mathematics', subtitle: '28 students', unread: 0, last: 'Thanks for the notes!', time: '1h' },
    { id: 'c3', name: 'Parents — Grade 11A', subtitle: 'Group chat', unread: 1, last: 'Meeting confirmed for Friday.', time: '3h' },
    { id: 'c4', name: 'Staff Room', subtitle: 'Lusaka Secondary', unread: 0, last: 'Curriculum update shared.', time: 'Yesterday' },
    { id: 'c5', name: 'Esther Banda (Parent)', subtitle: 'Direct message', unread: 0, last: 'Will do, thank you.', time: '2 days' },
  ]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('school_announcements')
        .select('id, title, body, audience, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setAnnouncements(data as any);
    })();
  }, [user]);

  const filtered = useMemo(
    () => conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );
  const activeConv = conversations.find(c => c.id === activeChat) || filtered[0];

  const sendMessage = () => {
    if (!draft.trim() || !activeConv) return;
    toast.success(`Message sent to ${activeConv.name}`);
    setDraft('');
  };

  const postAnnouncement = async () => {
    if (!annTitle.trim() || !user) return;
    setPosting(true);
    try {
      // Look up the teacher's school from their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('school')
        .eq('id', user.id)
        .maybeSingle();
      const school = profile?.school || 'My School';

      const { data, error } = await supabase
        .from('school_announcements')
        .insert({
          title: annTitle,
          body: annBody || null,
          audience,
          school,
          author_id: user.id,
          priority: 'normal',
        })
        .select('id, title, body, audience, created_at')
        .single();
      if (error) throw error;
      setAnnouncements(prev => [data as any, ...prev]);
      setAnnTitle('');
      setAnnBody('');
      toast.success('Announcement posted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };


  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px]">Teacher</Badge>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">Communication</h1>
          <p className="text-sm text-muted-foreground mt-1">Message students, parents, and staff. Send class announcements.</p>
        </div>
      </div>

      <Tabs defaultValue="messages">
        <TabsList className="bg-muted/50 rounded-2xl p-1">
          <TabsTrigger value="messages" className="rounded-xl">
            <MessageSquare className="w-4 h-4 mr-1.5" /> Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-xl">
            <Megaphone className="w-4 h-4 mr-1.5" /> Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4">
          <Card className="rounded-2xl border-border/40 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] h-[560px]">
              {/* Conversation list */}
              <div className="border-r border-border/40 flex flex-col">
                <div className="p-3 border-b border-border/40">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="pl-9 h-9 rounded-xl bg-muted/40 border-border/40"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChat(c.id)}
                      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 border-b border-border/30 ${
                        (activeConv?.id === c.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {c.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold truncate">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground shrink-0">{c.time}</div>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.last}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-0.5">{c.subtitle}</div>
                      </div>
                      {c.unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5 shrink-0">{c.unread}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active conversation */}
              <div className="flex flex-col">
                {activeConv ? (
                  <>
                    <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {activeConv.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold">{activeConv.name}</div>
                        <div className="text-[11px] text-muted-foreground">{activeConv.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                      <div className="flex">
                        <div className="max-w-[70%] bg-card border border-border/40 rounded-2xl rounded-tl-sm p-3">
                          <div className="text-sm">{activeConv.last}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">{activeConv.time} ago</div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3">
                          <div className="text-sm">Thanks — I'll share details in the next class.</div>
                          <div className="text-[10px] opacity-70 mt-1">just now</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-border/40 flex items-center gap-2">
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="rounded-xl bg-muted/40 border-border/40"
                      />
                      <Button onClick={sendMessage} size="icon" className="rounded-xl shrink-0">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a conversation
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            <Card className="p-4 rounded-2xl border-border/40">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">Recent Announcements</h2>
                <Badge variant="secondary" className="text-[10px]">{announcements.length} posted</Badge>
              </div>
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No announcements yet. Post one to update your classes.
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="p-3 rounded-xl border border-border/40 bg-muted/20">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-sm font-bold">{a.title}</div>
                        <Badge variant="outline" className="text-[10px]">{a.audience}</Badge>
                      </div>
                      {a.body && <div className="text-xs text-muted-foreground mb-1.5">{a.body}</div>}
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4 rounded-2xl border-border/40 h-fit">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-primary" />
                <h2 className="font-bold">New Announcement</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="mt-1 w-full h-9 rounded-xl bg-muted/40 border border-border/40 px-3 text-sm"
                  >
                    <option value="all-students">All students</option>
                    <option value="grade-11">Grade 11</option>
                    <option value="grade-10">Grade 10</option>
                    <option value="grade-12">Grade 12</option>
                    <option value="parents">Parents</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Quiz on Friday"
                    className="mt-1 rounded-xl bg-muted/40 border-border/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <Textarea
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                    placeholder="Share details with your class..."
                    rows={4}
                    className="mt-1 rounded-xl bg-muted/40 border-border/40"
                  />
                </div>
                <Button onClick={postAnnouncement} disabled={!annTitle.trim() || posting} className="w-full rounded-full">
                  <Send className="w-4 h-4 mr-1.5" /> {posting ? 'Posting...' : 'Post Announcement'}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
