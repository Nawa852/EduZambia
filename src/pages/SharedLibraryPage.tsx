import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download, Upload, Search, Library, Trash2, Globe, Lock, FileText, Loader2, FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LIBRARY_CATEGORIES, LibraryCategory, LibraryItem, categoryLabel, deleteLibraryItem,
  downloadLibraryItem, formatBytes, listLibrary, setLibraryVisibility, uploadToLibrary,
} from '@/lib/sharedLibrary';
import { useAuth } from '@/components/Auth/AuthProvider';

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics', 'Social Studies', 'Civic Education', 'History', 'Geography', 'Computer Studies', 'Agriculture', 'Business Studies'];
const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const UploadDialog: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'notes' as LibraryCategory,
    subject: '', grade: '', shared: true,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return toast.error('Choose a file first');
    setBusy(true);
    try {
      await uploadToLibrary({ file, ...form });
      toast.success(form.shared ? 'Published to the library' : 'Saved to your private files');
      setOpen(false);
      setFile(null);
      setForm({ title: '', description: '', category: 'notes', subject: '', grade: '', shared: true });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2">
          <Upload className="w-4 h-4" /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add to the library</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <FolderOpen className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{file ? file.name : 'Choose a file'}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Word, slides, images, video</p>
          </button>
          <input
            ref={inputRef} type="file" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !form.title) setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') }));
            }}
          />

          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Grade 9 Algebra notes" />
          </div>
          <div className="space-y-2">
            <Label>What is it?</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description so others know what they are downloading" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as LibraryCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIBRARY_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
              <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Share with everyone</p>
              <p className="text-xs text-muted-foreground">Others can find and download it</p>
            </div>
            <Switch checked={form.shared} onCheckedChange={(v) => setForm({ ...form, shared: v })} />
          </div>

          <Button onClick={submit} disabled={busy || !file} className="w-full rounded-xl">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</> : 'Add to library'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SharedLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'shared' | 'mine'>('shared');
  const [category, setCategory] = useState<LibraryCategory | 'all'>('all');
  const [subject, setSubject] = useState<string>('all');
  const [grade, setGrade] = useState<string>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLibrary({
        scope,
        category,
        subject: subject === 'all' ? undefined : subject,
        grade: grade === 'all' ? undefined : grade,
      });
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load the library');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [scope, category, subject, grade]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q) ||
      (i.subject ?? '').toLowerCase().includes(q));
  }, [items, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] ?? 0) + 1; });
    return map;
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Library className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Resource Library</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              One shared shelf for lesson plans, schemes of work, notes, past papers and quizzes.
              Upload what you have — everyone else can find and download it.
            </p>
          </div>
          <UploadDialog onDone={load} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['shared', 'mine'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              scope === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {s === 'shared' ? 'Shared with everyone' : 'My uploads'}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search resources" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as LibraryCategory | 'all')}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LIBRARY_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}{counts[c.value] ? ` (${counts[c.value]})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Grade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h3 className="font-semibold">Nothing here yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {scope === 'mine'
                ? 'Upload your first resource and choose whether to keep it private or share it.'
                : 'Be the first to share a lesson plan, notes or a past paper with everyone.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <Card key={item.id} className="rounded-2xl border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full text-[11px]">{categoryLabel(item.category)}</Badge>
                  {item.is_public
                    ? <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  {item.subject && <span className="px-2 py-0.5 rounded-full bg-muted">{item.subject}</span>}
                  {item.grade_level && <span className="px-2 py-0.5 rounded-full bg-muted">{item.grade_level}</span>}
                  <span className="px-2 py-0.5 rounded-full bg-muted">{formatBytes(item.size_bytes)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted">{item.downloads} downloads</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm" className="flex-1 rounded-xl gap-1.5"
                    onClick={async () => {
                      try {
                        await downloadLibraryItem(item);
                        setItems((prev) => prev.map((p) => p.id === item.id ? { ...p, downloads: p.downloads + 1 } : p));
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Could not open the file');
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5" /> Open
                  </Button>
                  {item.user_id === user?.id && (
                    <>
                      <Button
                        size="sm" variant="outline" className="rounded-xl"
                        onClick={async () => {
                          try {
                            await setLibraryVisibility(item.id, !item.is_public);
                            toast.success(item.is_public ? 'Made private' : 'Shared with everyone');
                            load();
                          } catch { toast.error('Could not change sharing'); }
                        }}
                      >
                        {item.is_public ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="sm" variant="outline" className="rounded-xl text-destructive"
                        onClick={async () => {
                          try {
                            await deleteLibraryItem(item);
                            toast.success('Deleted');
                            setItems((prev) => prev.filter((p) => p.id !== item.id));
                          } catch { toast.error('Could not delete'); }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
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

export default SharedLibraryPage;
