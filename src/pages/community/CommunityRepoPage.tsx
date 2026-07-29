import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowBigUp, FileUp, Loader2, Plus, Search, ExternalLink, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Contribution, CONTRIBUTION_KINDS, SUBJECTS,
  createContribution, listContributions, toggleVote,
} from '@/lib/community';
import { uploadToRepository, getResourceUrl } from '@/lib/resourceRepository';
import { EmptyState } from '@/components/UI/EmptyState';

const ContributeDialog: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kind: 'tip', title: '', body: '', subject: 'Mathematics', grade_level: '', link_url: '', tags: '' });
  const [file, setFile] = useState<File | null>(null);

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Add a title'); return; }
    setSaving(true);
    try {
      let resourceId: string | null = null;
      if (file) {
        const item = await uploadToRepository({
          file, title: form.title, subject: form.subject, source: 'community-contribution', isPublic: true,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
        resourceId = item.id;
      }
      await createContribution({
        kind: form.kind,
        title: form.title,
        body: form.body,
        subject: form.subject,
        grade_level: form.grade_level || null,
        link_url: form.link_url || null,
        resource_id: resourceId,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Thanks for contributing!');
      setOpen(false);
      setForm({ kind: 'tip', title: '', body: '', subject: 'Mathematics', grade_level: '', link_url: '', tags: '' });
      setFile(null);
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? 'Could not save your contribution');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Contribute</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Share a resource or study tip</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRIBUTION_KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="How I memorise trig identities" /></div>
          <div><Label>Details</Label><Textarea rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write the tip, summary or description..." /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Grade / level</Label><Input value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} placeholder="Grade 12" /></div>
            <div><Label>Link (optional)</Label><Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://" /></div>
          </div>
          <div><Label>Tags</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ecz, revision, formulas" /></div>
          <div>
            <Label>Attach a file (goes to the shared repo)</Label>
            <label className="mt-1 flex items-center gap-2 border border-dashed rounded-xl p-3 cursor-pointer hover:bg-muted/50 transition">
              <FileUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">{file ? file.name : 'Choose a PDF, image, doc or video'}</span>
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Publish to community
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ContributionCard: React.FC<{ item: Contribution; onVote: (c: Contribution) => void }> = ({ item, onVote }) => {
  const [url, setUrl] = useState<string | null>(null);

  const openFile = async () => {
    if (!item.resource_id) return;
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('resource_repository').select('bucket,storage_path').eq('id', item.resource_id).maybeSingle();
      if (!data) { toast.error('File is unavailable'); return; }
      const signed = await getResourceUrl(data as any);
      if (signed) { setUrl(signed); window.open(signed, '_blank', 'noopener'); }
    } catch {
      toast.error('Could not open the file');
    }
  };

  return (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-4 flex gap-3">
        <button
          onClick={() => onVote(item)}
          className={`flex flex-col items-center justify-center rounded-lg border px-2 py-1 h-fit transition ${item.voted_by_me ? 'border-primary text-primary bg-primary/10' : 'hover:bg-muted'}`}
          aria-label="Upvote"
        >
          <ArrowBigUp className={`h-4 w-4 ${item.voted_by_me ? 'fill-current' : ''}`} />
          <span className="text-xs font-semibold">{item.vote_count ?? 0}</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">{item.kind}</Badge>
            {item.subject && <Badge variant="outline" className="text-[10px]">{item.subject}</Badge>}
            {item.grade_level && <Badge variant="outline" className="text-[10px]">{item.grade_level}</Badge>}
          </div>
          <h3 className="font-semibold text-sm mt-1.5 truncate">{item.title}</h3>
          {item.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{item.body}</p>}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span>{item.author?.full_name || 'Community member'}</span>
            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex gap-2 mt-2">
            {item.resource_id && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openFile}>Open file</Button>}
            {item.link_url && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                <a href={item.link_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" />Link</a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CommunityRepoPage: React.FC = () => {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [subject, setSubject] = useState('all');
  const [sort, setSort] = useState<'new' | 'top'>('new');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listContributions({ search, kind, subject, sort }));
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load contributions');
    } finally {
      setLoading(false);
    }
  }, [search, kind, subject, sort]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const vote = async (c: Contribution) => {
    setItems(prev => prev.map(i => i.id === c.id ? { ...i, voted_by_me: !i.voted_by_me, vote_count: (i.vote_count ?? 0) + (i.voted_by_me ? -1 : 1) } : i));
    try { await toggleVote(c.id, !!c.voted_by_me); } catch (e: any) { toast.error(e.message); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Community repo</h2>
          <p className="text-sm text-muted-foreground">Shared resources and study tips from learners, teachers and schools.</p>
        </div>
        <ContributeDialog onDone={load} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contributions..." />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {CONTRIBUTION_KINDS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v: 'new' | 'top') => setSort(v)}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="top">Top voted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Nothing shared yet" description="Be the first to post a study tip or upload notes for everyone." icon={Lightbulb} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(i => <ContributionCard key={i.id} item={i} onVote={vote} />)}
        </div>
      )}
    </div>
  );
};

export default CommunityRepoPage;
