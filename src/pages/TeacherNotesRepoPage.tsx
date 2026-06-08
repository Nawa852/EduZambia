import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { useTeachingResources, ResourceType, Visibility } from '@/hooks/useTeachingResources';
import { BookOpen, Upload, FileText, Link as LinkIcon, Trash2, Download, Globe, Lock, Plus } from 'lucide-react';

const ZAMBIAN_SUBJECTS = ['Mathematics','English','Science','Biology','Chemistry','Physics','Civic Education','Geography','History','Religious Education','Business Studies','ICT','Agriculture','Bemba','Nyanja','Tonga','Lozi'];
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const TYPES: { value: ResourceType; label: string }[] = [
  { value: 'notes', label: 'Notes' },
  { value: 'lesson_plan', label: 'Lesson Plan' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'past_paper', label: 'Past Paper' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'External Link' },
  { value: 'other', label: 'Other' },
];

const TeacherNotesRepoPage = () => {
  const [scope, setScope] = useState<'all' | 'mine' | 'public'>('public');
  const [subject, setSubject] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [type, setType] = useState<ResourceType | ''>('');
  const [search, setSearch] = useState('');
  const { items, loading, create, remove, uploadFile } = useTeachingResources({
    scope,
    subject: subject || undefined,
    grade: grade || undefined,
    type: (type || undefined) as ResourceType | undefined,
    search: search || undefined,
  });

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    title: string; description: string; subject: string; grade: string;
    type: ResourceType; visibility: Visibility; external_url: string; file: File | null;
  }>({ title: '', description: '', subject: '', grade: '', type: 'notes', visibility: 'public', external_url: '', file: null });

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    let file_url: string | null = null;
    if (form.file) file_url = await uploadFile(form.file, 'teaching');
    await create({
      title: form.title,
      description: form.description,
      subject: form.subject || null,
      grade_level: form.grade || null,
      resource_type: form.type,
      visibility: form.visibility,
      external_url: form.external_url || null,
      file_url,
    });
    setBusy(false);
    setOpen(false);
    setForm({ title: '', description: '', subject: '', grade: '', type: 'notes', visibility: 'public', external_url: '', file: null });
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <PageHeader
        title="Teaching Notes & Lesson Plan Repository"
        subtitle="Browse, share and download ECZ-aligned teaching resources. Upload your own notes to help fellow teachers."
        icon={BookOpen}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add resource</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Publish a teaching resource</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Textarea placeholder="Description / what it covers" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>{ZAMBIAN_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                    <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                    <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ResourceType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v as Visibility })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public — anyone can read</SelectItem>
                      <SelectItem value="private">Private — only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="External URL (optional, e.g. zedpastpapers.com link)" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
                <div>
                  <label className="text-sm text-muted-foreground">Upload file (PDF / DOCX / image)</label>
                  <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                </div>
                <Button onClick={submit} disabled={busy || !form.title.trim()} className="w-full">
                  {busy ? 'Saving…' : 'Publish'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={subject || 'all'} onValueChange={(v) => setSubject(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All subjects</SelectItem>{ZAMBIAN_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={grade || 'all'} onValueChange={(v) => setGrade(v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All grades</SelectItem>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v as ResourceType)}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All types</SelectItem>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <Tabs value={scope} onValueChange={(v) => setScope(v as any)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="public">Public</TabsTrigger>
              <TabsTrigger value="mine">Mine</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading…</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No resources match yet. Be the first to publish notes.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{r.title}</CardTitle>
                  {r.visibility === 'public' ? <Globe className="w-4 h-4 text-primary shrink-0" /> : <Lock className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {r.subject && <Badge variant="secondary" className="text-[10px]">{r.subject}</Badge>}
                  {r.grade_level && <Badge variant="outline" className="text-[10px]">{r.grade_level}</Badge>}
                  <Badge className="text-[10px]">{r.resource_type.replace('_', ' ')}</Badge>
                </div>
                <div className="flex gap-2">
                  {r.file_url && (
                    <Button size="sm" variant="outline" asChild className="flex-1">
                      <a href={r.file_url} target="_blank" rel="noreferrer"><Download className="w-3.5 h-3.5 mr-1" /> Open</a>
                    </Button>
                  )}
                  {r.external_url && (
                    <Button size="sm" variant="outline" asChild className="flex-1">
                      <a href={r.external_url} target="_blank" rel="noreferrer"><LinkIcon className="w-3.5 h-3.5 mr-1" /> Visit</a>
                    </Button>
                  )}
                  {scope === 'mine' && (
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherNotesRepoPage;
