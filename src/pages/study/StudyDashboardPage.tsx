import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { StudyDashboardSkeleton } from '@/components/UI/StudySkeleton';
import {
  Plus, Folder, FileText, Upload, Sparkles, Mic, PenLine, ListChecks, BookOpen,
  Search, Trash2, Youtube, Link as LinkIcon, ImageIcon, ChevronRight, Clock,
} from 'lucide-react';

type Tab = 'actions' | 'files' | 'folders' | 'history';

interface Course {
  id: string; name: string; subject: string|null; grade: string|null;
  emoji: string|null; color: string|null; exam_date: string|null;
  target_grade: string|null; updated_at: string;
}
interface Resource {
  id: string; title: string; kind: string; mime: string|null;
  source_url: string|null; storage_path: string|null;
  course_id: string; created_at: string; updated_at: string|null;
}

const EMOJIS = ['📘','🧮','🧪','🧬','🔭','📐','💻','🩺','🎨','📚','🌍','⚗️'];
const COLORS = ['blue','purple','emerald','amber','rose','indigo','teal','orange'];
const colorMap: Record<string,string> = {
  blue: 'bg-blue-500/10 text-blue-600',
  purple: 'bg-purple-500/10 text-purple-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  amber: 'bg-amber-500/10 text-amber-600',
  rose: 'bg-rose-500/10 text-rose-600',
  indigo: 'bg-indigo-500/10 text-indigo-600',
  teal: 'bg-teal-500/10 text-teal-600',
  orange: 'bg-orange-500/10 text-orange-600',
};

const StudyDashboardPage = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('folders');
  const [query, setQuery] = useState('');
  const [openFolder, setOpenFolder] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadCourseId, setUploadCourseId] = useState<string>('');
  const [form, setForm] = useState({
    name: '', subject: '', grade: '', board: 'ECZ', objectives: '',
    target_grade: '', exam_date: '', daily_minutes: 30,
    level: 'Intermediate', learning_style: 'Visual',
    emoji: '📘', color: 'blue',
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: cs }, { data: rs }] = await Promise.all([
      supabase.from('study_courses').select('*').order('updated_at', { ascending: false }),
      supabase.from('study_resources').select('id,title,kind,mime,source_url,storage_path,course_id,created_at,updated_at').order('created_at', { ascending: false }).limit(200),
    ]);
    setCourses((cs as any) || []);
    setResources((rs as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const createFolder = async () => {
    if (!form.name.trim()) return toast.error('Folder name required');
    setBusy(true);
    const { data, error } = await supabase.from('study_courses').insert({
      user_id: user!.id,
      name: form.name, subject: form.subject || null, grade: form.grade || null,
      board: form.board || null, objectives: form.objectives || null,
      target_grade: form.target_grade || null,
      exam_date: form.exam_date || null,
      daily_minutes: form.daily_minutes,
      level: form.level, learning_style: form.learning_style,
      emoji: form.emoji, color: form.color,
    } as any).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Folder created');
    setOpenFolder(false);
    setForm({ ...form, name: '', subject: '', objectives: '' });
    nav(`/study/course/${(data as any).id}`);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this folder and all its files?')) return;
    await supabase.from('study_courses').delete().eq('id', id);
    load();
  };

  const uploadFile = async (file: File) => {
    if (!user || !uploadCourseId) return;
    setBusy(true);
    try {
      const path = `${user.id}/${uploadCourseId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('study-resources').upload(path, file);
      if (upErr) throw upErr;
      const text = file.type.startsWith('text/') || /\.(md|txt)$/i.test(file.name) ? await file.text() : null;
      const { data, error } = await supabase.from('study_resources').insert({
        user_id: user.id, course_id: uploadCourseId, title: file.name,
        kind: 'file', mime: file.type, storage_path: path,
        size_bytes: file.size, extracted_text: text,
      } as any).select().single();
      if (error) throw error;
      toast.success('Uploaded');
      setOpenUpload(false);
      nav(`/study/resource/${(data as any).id}`);
    } catch (e:any) { toast.error(e.message); }
    setBusy(false);
  };

  const filteredCourses = useMemo(
    () => courses.filter(c => c.name.toLowerCase().includes(query.toLowerCase())),
    [courses, query]
  );
  const filteredResources = useMemo(
    () => resources.filter(r => r.title.toLowerCase().includes(query.toLowerCase())),
    [resources, query]
  );
  const itemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of resources) map[r.course_id] = (map[r.course_id] || 0) + 1;
    return map;
  }, [resources]);

  const resIcon = (r: Resource) => {
    if (r.kind === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (r.kind === 'url') return <LinkIcon className="w-4 h-4 text-blue-500" />;
    if (r.mime?.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    return <FileText className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-6xl space-y-5">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
          Your Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your study material into folders — upload notes, watch lessons, and let Synapse turn them into flashcards, quizzes and a personal tutor.
        </p>
      </div>

      {/* Tabs + primary action */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="inline-flex bg-muted/60 backdrop-blur rounded-full p-1 border border-border/60">
          {([
            ['actions', 'Actions'],
            ['files', 'Files'],
            ['folders', 'Folders'],
            ['history', 'History'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 h-9 rounded-full text-sm font-medium transition ${
                tab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-9 h-9 rounded-full w-48"
            />
          </div>
          {tab === 'folders' && (
            <Button onClick={() => setOpenFolder(true)} className="rounded-full gap-2 h-9 bg-foreground text-background hover:bg-foreground/90">
              <Plus className="w-4 h-4" /> Add folder
            </Button>
          )}
          {tab === 'files' && (
            <Button onClick={() => { setUploadCourseId(courses[0]?.id || ''); setOpenUpload(true); }} className="rounded-full gap-2 h-9 bg-foreground text-background hover:bg-foreground/90">
              <Upload className="w-4 h-4" /> Upload file
            </Button>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      {tab === 'actions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Upload, title: 'Upload file', desc: 'PDF, DOCX, image or notes → instant study pack', onClick: () => { setUploadCourseId(courses[0]?.id || ''); setOpenUpload(true); }, tint: 'from-blue-500/15 to-blue-500/0' },
            { icon: Folder, title: 'New folder', desc: 'Group material by subject or exam', onClick: () => setOpenFolder(true), tint: 'from-purple-500/15 to-purple-500/0' },
            { icon: Mic, title: 'Record lecture', desc: 'Live transcript, notes & summary', onClick: () => nav('/lecture'), tint: 'from-rose-500/15 to-rose-500/0' },
            { icon: PenLine, title: 'Ask AI Tutor', desc: 'Chat with your personal tutor', onClick: () => nav('/ai-chat'), tint: 'from-emerald-500/15 to-emerald-500/0' },
            { icon: ListChecks, title: 'Quick quiz', desc: 'Pick any folder to test yourself', onClick: () => setTab('folders'), tint: 'from-amber-500/15 to-amber-500/0' },
            { icon: BookOpen, title: 'Assignment help', desc: 'Solve problems step-by-step', onClick: () => nav('/ai-chat?mode=assignment'), tint: 'from-indigo-500/15 to-indigo-500/0' },
          ].map((a) => (
            <button
              key={a.title}
              onClick={a.onClick}
              className={`text-left p-5 rounded-2xl border bg-gradient-to-br ${a.tint} hover:shadow-md hover:-translate-y-0.5 transition`}
            >
              <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center mb-3">
                <a.icon className="w-5 h-5 text-foreground" />
              </div>
              <p className="font-semibold text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* FOLDERS */}
      {tab === 'folders' && (
        <Card className="rounded-2xl overflow-hidden border">
          <div className="hidden md:grid grid-cols-[1fr_120px_180px_40px] px-5 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
            <div>Name</div><div>Items</div><div>Updated</div><div />
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-10 text-center">
              <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No folders yet.</p>
              <Button onClick={() => setOpenFolder(true)} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Add folder</Button>
            </div>
          ) : (
            filteredCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => nav(`/study/course/${c.id}`)}
                className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_180px_40px] items-center gap-3 px-5 py-4 hover:bg-muted/40 transition border-b last:border-0 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[c.color||'blue']}`}>
                    <span className="text-base">{c.emoji || '📁'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap md:hidden">
                      <span className="text-[11px] text-muted-foreground">{itemCounts[c.id] || 0} items · {new Date(c.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block text-sm text-muted-foreground">{itemCounts[c.id] || 0}</div>
                <div className="hidden md:block text-sm text-muted-foreground">{new Date(c.updated_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div>
                <div className="flex items-center justify-end gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e)=>{e.stopPropagation();del(c.id);}}
                    onKeyDown={(e)=>{if(e.key==='Enter'){e.stopPropagation();del(c.id);}}}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                </div>
              </button>
            ))
          )}
        </Card>
      )}

      {/* FILES */}
      {tab === 'files' && (
        <Card className="rounded-2xl overflow-hidden border">
          <div className="hidden md:grid grid-cols-[1fr_180px_180px_40px] px-5 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
            <div>Name</div><div>Folder</div><div>Added</div><div />
          </div>
          {filteredResources.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No files yet.</p>
              <Button onClick={() => { setUploadCourseId(courses[0]?.id || ''); setOpenUpload(true); }} disabled={!courses.length} className="rounded-full">
                <Upload className="w-4 h-4 mr-1" /> Upload file
              </Button>
              {!courses.length && <p className="text-xs text-muted-foreground mt-2">Create a folder first.</p>}
            </div>
          ) : (
            filteredResources.map((r) => {
              const folder = courses.find(c => c.id === r.course_id);
              return (
                <button
                  key={r.id}
                  onClick={() => nav(`/study/resource/${r.id}`)}
                  className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_180px_180px_40px] items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition border-b last:border-0 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">{resIcon(r)}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate md:hidden">{folder?.name || '—'} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                    <span className="text-base">{folder?.emoji || '📁'}</span>
                    <span className="truncate">{folder?.name || '—'}</span>
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                </button>
              );
            })
          )}
        </Card>
      )}

      {/* HISTORY */}
      {tab === 'history' && (
        <Card className="rounded-2xl overflow-hidden border">
          {filteredResources.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              No activity yet.
            </div>
          ) : (
            filteredResources.slice(0, 40).map((r) => {
              const folder = courses.find(c => c.id === r.course_id);
              return (
                <button
                  key={r.id}
                  onClick={() => nav(`/study/resource/${r.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition border-b last:border-0 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">{resIcon(r)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Opened {r.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{folder?.name || '—'} · {new Date(r.updated_at || r.created_at).toLocaleString()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })
          )}
        </Card>
      )}

      {/* Add folder dialog */}
      <Dialog open={openFolder} onOpenChange={setOpenFolder}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add folder</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`w-10 h-10 rounded-xl text-lg border ${form.emoji === e ? 'bg-primary/10 border-primary' : 'border-border'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-8 px-3 rounded-full text-xs border capitalize ${colorMap[c]} ${form.color === c ? 'ring-2 ring-primary' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div>
              <Label>Folder name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Biology Grade 10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Biology" /></div>
              <div><Label>Grade / Level</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Grade 10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Exam date</Label><Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} /></div>
              <div><Label>Target grade</Label><Input value={form.target_grade} onChange={(e) => setForm({ ...form, target_grade: e.target.value })} placeholder="A" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Learning style</Label>
                <Select value={form.learning_style} onValueChange={(v) => setForm({ ...form, learning_style: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Visual">Visual</SelectItem><SelectItem value="Reading">Reading</SelectItem><SelectItem value="Practice">Practice</SelectItem><SelectItem value="Audio">Audio</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Objectives</Label><Textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={2} placeholder="What do you want to master?" /></div>
          </div>
          <DialogFooter>
            <Button onClick={createFolder} disabled={busy}>{busy ? 'Creating…' : 'Create folder'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload file dialog */}
      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload a file</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Folder</Label>
              <Select value={uploadCourseId} onValueChange={setUploadCourseId}>
                <SelectTrigger><SelectValue placeholder="Choose folder" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!uploadCourseId || busy}
              className="w-full p-8 rounded-2xl border-2 border-dashed hover:border-primary hover:bg-primary/5 disabled:opacity-50 transition text-center"
            >
              <Upload className="w-8 h-8 text-primary/70 mx-auto mb-2" />
              <p className="text-sm font-medium">{busy ? 'Uploading…' : 'Click to choose a file'}</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, images, notes, audio</p>
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyDashboardPage;
