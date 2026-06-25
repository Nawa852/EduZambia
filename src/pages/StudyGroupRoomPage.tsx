import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Users, MessageSquare, Video, FileText, BookOpen, Clock, Send,
  Sparkles, Pin, Hash, Phone, Settings, ChevronLeft, Plus, Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

type Group = { id: string; name: string; subject: string | null; description: string | null; grade_level: string | null; created_by: string };
type Msg = { id: string; user_id: string; content: string; created_at: string };

export default function StudyGroupRoomPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<{ user_id: string }[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<'chat' | 'notes' | 'resources' | 'plan'>('chat');
  const [pinned, setPinned] = useState('📚 Weekly goal: Finish Chapter 4 — quiz Friday 4pm.');
  const [notes, setNotes] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      const [{ data: g }, { data: m }, { data: msgs }] = await Promise.all([
        supabase.from('study_groups').select('*').eq('id', groupId).maybeSingle(),
        supabase.from('study_group_members').select('user_id').eq('group_id', groupId),
        supabase.from('study_group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(200),
      ]);
      setGroup(g as Group | null);
      setMembers((m as any[]) || []);
      setMessages((msgs as Msg[]) || []);
    })();
    const ch = supabase
      .channel(`group:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_group_messages', filter: `group_id=eq.${groupId}` }, (p) => {
        setMessages(prev => [...prev, p.new as Msg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [groupId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!user || !groupId || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    const { error } = await supabase.from('study_group_messages').insert({ group_id: groupId, user_id: user.id, content: text });
    if (error) toast.error(error.message);
  }

  function startVideo() {
    const code = `nexus-${groupId?.slice(0, 8)}`;
    window.open(`https://meet.jit.si/${code}`, '_blank', 'noopener');
  }

  const initials = (uid: string) => uid.slice(0, 2).toUpperCase();

  const fallbackGroup: Group = group || {
    id: groupId || '',
    name: 'Study Group',
    subject: 'General',
    description: 'A focused space to learn together.',
    grade_level: null,
    created_by: '',
  };

  return (
    <div className="container mx-auto px-3 lg:px-6 py-4 max-w-7xl">
      {/* Header */}
      <div className="mb-4">
        <Link to="/study-groups" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="w-3.5 h-3.5" /> All groups
        </Link>
        <Card className="p-4 lg:p-5 rounded-2xl border-border/40 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold truncate">{fallbackGroup.name}</h1>
                {fallbackGroup.subject && <Badge variant="secondary">{fallbackGroup.subject}</Badge>}
                {fallbackGroup.grade_level && <Badge variant="outline">{fallbackGroup.grade_level}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{fallbackGroup.description || 'A focused space to learn together.'}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {members.length} members</span>
                <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {messages.length} messages</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Active now</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={startVideo} className="bg-emerald-600 hover:bg-emerald-700">
                <Video className="w-4 h-4 mr-1.5" /> Start Video Room
              </Button>
              <Button variant="outline"><Phone className="w-4 h-4 mr-1.5" /> Voice</Button>
              <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <Pin className="w-4 h-4 text-amber-600 mt-0.5" />
            <Input
              value={pinned}
              onChange={e => setPinned(e.target.value)}
              className="border-0 bg-transparent text-sm focus-visible:ring-0 px-0"
            />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Main */}
        <Card className="p-0 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '70vh' }}>
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-border/40">
            {([
              ['chat', 'Chat', MessageSquare],
              ['notes', 'Shared Notes', FileText],
              ['resources', 'Resources', BookOpen],
              ['plan', 'Study Plan', Calendar],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg inline-flex items-center gap-1.5 ${tab === key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === 'chat' && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20" style={{ maxHeight: '60vh' }}>
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-12">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Say hi — kick off the conversation.
                  </div>
                )}
                {messages.map(m => {
                  const mine = m.user_id === user?.id;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px]">{initials(m.user_id)}</AvatarFallback></Avatar>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border/40 rounded-bl-sm'}`}>
                        <div>{m.content}</div>
                        <div className={`text-[9px] mt-0.5 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-border/40 flex items-center gap-2">
                <Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button>
                <Input
                  placeholder="Message the group..."
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                />
                <Button onClick={send} disabled={!draft.trim()}><Send className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {tab === 'notes' && (
            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-2">Collaborative scratchpad — visible to your group.</div>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Start typing shared notes..." className="min-h-[55vh] font-mono text-sm" />
            </div>
          )}

          {tab === 'resources' && (
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              {[
                { t: 'Past Papers', d: 'Pinned ECZ papers', i: BookOpen, to: '/ecz-past-papers' },
                { t: 'Flashcards', d: 'Shared decks', i: Sparkles, to: '/flashcards' },
                { t: 'Group Files', d: 'PDFs and uploads', i: FileText, to: `/group/${groupId}/files` },
                { t: 'Video Library', d: 'Saved lessons', i: Video, to: '/watch' },
              ].map(r => (
                <button key={r.t} onClick={() => navigate(r.to)} className="text-left p-3.5 rounded-xl border border-border/40 hover:border-primary/40 hover:shadow-elevated transition-all">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2"><r.i className="w-4 h-4" /></div>
                  <div className="text-sm font-bold">{r.t}</div>
                  <div className="text-xs text-muted-foreground">{r.d}</div>
                </button>
              ))}
            </div>
          )}

          {tab === 'plan' && (
            <div className="p-4 space-y-2">
              {[
                { day: 'Mon', topic: 'Review chapter 4', done: true },
                { day: 'Wed', topic: 'Group quiz · 30 questions', done: false },
                { day: 'Fri', topic: 'Mock exam @ 4pm', done: false },
                { day: 'Sun', topic: 'Reflection & retros', done: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{s.day}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.topic}</div>
                    <div className="text-[11px] text-muted-foreground">{s.done ? '✓ Completed' : 'Upcoming'}</div>
                  </div>
                  <Button variant="ghost" size="sm">Open</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-3">
          <Card className="p-4 rounded-2xl">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Members</div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {members.length === 0 && <div className="text-xs text-muted-foreground">No members yet.</div>}
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px]">{initials(m.user_id)}</AvatarFallback></Avatar>
                  <div className="text-xs font-medium truncate flex-1">{m.user_id === user?.id ? 'You' : `Member · ${m.user_id.slice(0, 6)}`}</div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3"><Plus className="w-3.5 h-3.5 mr-1.5" /> Invite</Button>
          </Card>

          <Card className="p-4 rounded-2xl">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Co-pilot</div>
            <div className="space-y-2">
              {[
                { l: 'Summarize chat', p: 'Summarize the latest study group conversation into key points and action items.' },
                { l: 'Generate quiz', p: 'Generate a 10-question quiz from this group\'s study topic.' },
                { l: 'Make flashcards', p: 'Create flashcards from the topic we are studying.' },
              ].map(s => (
                <Button key={s.l} variant="outline" size="sm" className="w-full justify-start text-xs"
                  onClick={() => navigate(`/ai?tab=chat&prompt=${encodeURIComponent(s.p)}`)}>
                  {s.l}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4 rounded-2xl">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Next Session</div>
            <div className="text-xs text-muted-foreground">Friday · 4:00 PM</div>
            <div className="text-sm font-medium mt-1">Mock Exam — Chapter 4</div>
            <Button size="sm" className="w-full mt-3" onClick={startVideo}><Video className="w-4 h-4 mr-1.5" /> Join Room</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
