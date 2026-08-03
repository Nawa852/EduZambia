import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/UI/EmptyState';
import { ErrorState } from '@/components/UI/ErrorState';
import {
  UploadCloud, Search, Loader2, Download, Folder, FileText, Sparkles, Check, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { getResourcePermissions } from '@/lib/resourcePermissions';
import { ResourceUploader } from '@/components/Resources/ResourceUploader';
import { tagValue } from '@/components/Resources/ResourceCard';
import { listRepository, getResourceUrl, deleteResource, type RepositoryItem } from '@/lib/resourceRepository';

type Breakdown = {
  title?: string;
  summary?: string;
  keyPoints?: string[];
  outline?: { chapter: string; lessons: string[] }[];
  flashcards?: { q: string; a: string }[];
  quiz?: { question: string; options: string[]; correct: number; explanation: string }[];
  studyPlan?: { day: number; focus: string; tasks: string[] }[];
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

const ECZPastPapersPage = () => {
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';
  const perms = useMemo(() => getResourcePermissions(role), [role]);

  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  const [viewItem, setViewItem] = useState<RepositoryItem | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const [breakItem, setBreakItem] = useState<RepositoryItem | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [analysing, setAnalysing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setItems(await listRepository());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      (i.subject || '').toLowerCase().includes(q) ||
      i.folder_path.toLowerCase().includes(q));
  }, [items, query]);

  const folders = useMemo(() => filtered.reduce<Record<string, RepositoryItem[]>>((acc, item) => {
    const key = [item.subject || 'Unsorted', tagValue(item, 'class') || 'General', tagValue(item, 'year') || '—'].join(' · ');
    (acc[key] ||= []).push(item);
    return acc;
  }, {}), [filtered]);

  const open = async (item: RepositoryItem) => {
    setViewItem(item);
    setViewUrl(null);
    const url = await getResourceUrl(item);
    if (!url) { toast.error('Could not open this file'); setViewItem(null); return; }
    setViewUrl(url);
  };

  const remove = async (item: RepositoryItem) => {
    try {
      await deleteResource(item);
      toast.success('Removed');
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const breakItDown = async (item: RepositoryItem) => {
    setBreakItem(item);
    setBreakdown(null);
    setAnalysing(true);
    try {
      const url = await getResourceUrl(item);
      if (!url) throw new Error('Could not read the file.');
      const blob = await (await fetch(url)).blob();
      const payload = {
        topic: [item.subject, tagValue(item, 'class'), item.title].filter(Boolean).join(' — '),
        file: await blobToBase64(blob),
        filename: item.title,
        mimeType: item.mime_type || 'application/pdf',
      };
      const { data, error: fnError } = await supabase.functions.invoke('ai-study-kit', { body: payload });
      if (fnError) throw fnError;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setBreakdown(data as Breakdown);
    } catch (err) {
      toast.error((err as Error).message || 'Could not break down this file.');
      setBreakItem(null);
    } finally {
      setAnalysing(false);
    }
  };

  const renderList = (list: RepositoryItem[]) => (
    <div className="space-y-2">
      {list.map(item => (
        <div key={item.id} className="rounded-2xl border border-border/60 bg-card/60 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.subject && <Badge variant="secondary" className="text-[10px]">{item.subject}</Badge>}
              {tagValue(item, 'class') && <Badge variant="outline" className="text-[10px]">{tagValue(item, 'class')}</Badge>}
              {tagValue(item, 'year') && <Badge variant="outline" className="text-[10px]">{tagValue(item, 'year')}</Badge>}
            </div>
          </div>
          <Button size="sm" className="rounded-xl shrink-0" onClick={() => breakItDown(item)}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Break down
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={() => open(item)}>Open</Button>
          {perms.canDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Delete file"
              onClick={() => remove(item)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Your papers & materials</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Upload your own past papers, notes and handouts. Synapse stores them, files them by subject, class and year —
          then breaks any file down into a summary, key points, flashcards and a quiz.
        </p>
      </div>

      {perms.canUpload && <ResourceUploader perms={perms} role={role} onUploaded={load} />}

      {items.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your papers…"
            className="pl-9 rounded-xl" aria-label="Search your papers" />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : error ? (
        <ErrorState title="Could not load your papers" onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title={items.length ? 'No matches' : 'Nothing uploaded yet'}
          description={items.length
            ? 'Try a different search term.'
            : 'Upload a past paper, exercise book photo or set of notes — it will be stored and organised here.'}
        />
      ) : (
        <Accordion type="multiple" defaultValue={Object.keys(folders).slice(0, 3)} className="space-y-2">
          {Object.entries(folders).map(([folder, list]) => (
            <AccordionItem key={folder} value={folder} className="border border-border/60 rounded-2xl px-3">
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  {folder}
                  <span className="text-xs text-muted-foreground">({list.length})</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">{renderList(list)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Viewer */}
      <Dialog open={!!viewItem} onOpenChange={o => { if (!o) { setViewItem(null); setViewUrl(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-border/60">
            <DialogTitle className="text-sm truncate pr-8">{viewItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {!viewUrl ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : viewItem?.kind === 'image' ? (
              <div className="h-full overflow-auto flex items-center justify-center p-4">
                <img src={viewUrl} alt={viewItem.title} className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            ) : (
              <iframe src={viewUrl} title={viewItem?.title ?? 'File'} className="w-full h-full border-0" />
            )}
          </div>
          {viewUrl && (
            <div className="px-4 py-3 border-t border-border/60 flex justify-end">
              <Button size="sm" variant="outline" asChild>
                <a href={viewUrl} target="_blank" rel="noreferrer" download>
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI breakdown */}
      <Dialog open={!!breakItem} onOpenChange={o => { if (!o) { setBreakItem(null); setBreakdown(null); } }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base pr-8">{breakdown?.title || breakItem?.title}</DialogTitle>
          </DialogHeader>

          {analysing || !breakdown ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Reading your file and breaking it down…</p>
            </div>
          ) : (
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList className="rounded-2xl bg-muted/60 p-1 h-auto flex-wrap">
                <TabsTrigger value="summary" className="rounded-xl">Summary</TabsTrigger>
                <TabsTrigger value="cards" className="rounded-xl">Flashcards</TabsTrigger>
                <TabsTrigger value="quiz" className="rounded-xl">Quiz</TabsTrigger>
                <TabsTrigger value="plan" className="rounded-xl">Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{breakdown.summary}</p>
                <ul className="space-y-2">
                  {breakdown.keyPoints?.map((k, i) => (
                    <li key={i} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />{k}</li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="cards" className="space-y-2">
                {breakdown.flashcards?.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-border/60 p-3">
                    <p className="text-sm font-medium">{c.q}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.a}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="quiz" className="space-y-3">
                {breakdown.quiz?.map((q, i) => (
                  <div key={i} className="rounded-2xl border border-border/60 p-3 space-y-1.5">
                    <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                    {q.options?.map((o, j) => (
                      <p key={j} className={`text-sm ${j === q.correct ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {String.fromCharCode(65 + j)}. {o}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">{q.explanation}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="plan" className="space-y-2">
                {breakdown.studyPlan?.map(d => (
                  <div key={d.day} className="rounded-2xl border border-border/60 p-3">
                    <p className="text-sm font-semibold">Day {d.day} — {d.focus}</p>
                    <ul className="mt-1 space-y-1">
                      {d.tasks?.map((t, i) => <li key={i} className="text-sm text-muted-foreground">• {t}</li>)}
                    </ul>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECZPastPapersPage;
