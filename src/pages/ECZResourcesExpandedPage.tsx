import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/UI/EmptyState';
import { ErrorState } from '@/components/UI/ErrorState';
import {
  UploadCloud, Search, Loader2, Download, Folder, List, LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { listRepository, getResourceUrl, deleteResource, type RepositoryItem } from '@/lib/resourceRepository';
import { getResourcePermissions } from '@/lib/resourcePermissions';
import { ResourceUploader } from '@/components/Resources/ResourceUploader';
import { ResourceCard, tagValue } from '@/components/Resources/ResourceCard';

const ALL = '__all__';

const ECZResourcesExpandedPage = () => {
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';
  const perms = useMemo(() => getResourcePermissions(role), [role]);

  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState(ALL);
  const [classLevel, setClassLevel] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [grouped, setGrouped] = useState(true);

  const [openItem, setOpenItem] = useState<RepositoryItem | null>(null);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

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

  const options = useMemo(() => ({
    subjects: Array.from(new Set(items.map((i) => i.subject).filter(Boolean))) as string[],
    classes: Array.from(new Set(items.map((i) => tagValue(i, 'class')).filter(Boolean))) as string[],
    years: Array.from(new Set(items.map((i) => tagValue(i, 'year')).filter(Boolean))).sort().reverse() as string[],
  }), [items]);

  const filtered = useMemo(() => items.filter((i) => {
    if (subject !== ALL && i.subject !== subject) return false;
    if (classLevel !== ALL && tagValue(i, 'class') !== classLevel) return false;
    if (year !== ALL && tagValue(i, 'year') !== year) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!i.title.toLowerCase().includes(q) && !i.folder_path.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, subject, classLevel, year, query]);

  const folders = useMemo(() => {
    return filtered.reduce<Record<string, RepositoryItem[]>>((acc, item) => {
      const key = [item.subject || 'Unsorted', tagValue(item, 'class') || 'General', tagValue(item, 'year') || '—']
        .join(' · ');
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [filtered]);

  const open = async (item: RepositoryItem) => {
    setOpenItem(item);
    setOpenUrl(null);
    setOpenLoading(true);
    const url = await getResourceUrl(item);
    setOpenUrl(url);
    setOpenLoading(false);
    if (!url) toast.error('Could not open this file');
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

  const renderList = (list: RepositoryItem[]) => (
    <div className="space-y-2">
      {list.map((item) => (
        <ResourceCard key={item.id} item={item} canDelete={perms.canDelete} onOpen={open} onDelete={remove} />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {perms.canUpload && <ResourceUploader perms={perms} role={role} onUploaded={load} />}

      {/* Filters */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your files…"
              className="pl-9" aria-label="Search files" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All subjects</SelectItem>
                {options.subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classLevel} onValueChange={setClassLevel}>
              <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All classes</SelectItem>
                {options.classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All years</SelectItem>
                {options.years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {options.kinds.map((k) => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-xs"
                onClick={() => { setSubject(ALL); setClassLevel(ALL); setYear(ALL); setKind(ALL); setQuery(''); }}>
                Clear filters
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-9 ml-auto" onClick={() => setGrouped((g) => !g)}>
              {grouped ? <List className="w-4 h-4 mr-1.5" /> : <LayoutGrid className="w-4 h-4 mr-1.5" />}
              {grouped ? 'Flat list' : 'Folders'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Showing {filtered.length} of {items.length} files · {perms.canUpload ? 'you can upload' : 'view only'}
            {perms.canDelete ? ' and delete' : ''} as {role}.
          </p>
        </div>
      )}


      {/* Files */}
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : error ? (
        <ErrorState title="Could not load your resources" onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title={items.length ? 'No matches' : 'Your repository is empty'}
          description={items.length
            ? 'Try a different search term or clear the filters.'
            : 'Everything you upload anywhere in Synapse lands here, organised by subject, class and year.'}
        />
      ) : grouped ? (
        <Accordion type="multiple" defaultValue={Object.keys(folders).slice(0, 3)} className="space-y-2">
          {Object.entries(folders).map(([folder, list]) => (
            <AccordionItem key={folder} value={folder} className="border border-border/60 rounded-xl px-3">
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
      ) : renderList(filtered)}

      {/* File opener */}
      <Dialog open={!!openItem} onOpenChange={(o) => { if (!o) { setOpenItem(null); setOpenUrl(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-border/60">
            <DialogTitle className="text-sm truncate pr-8">{openItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {openLoading || !openUrl ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : openItem?.kind === 'image' ? (
              <div className="h-full overflow-auto flex items-center justify-center p-4">
                <img src={openUrl} alt={openItem.title} className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            ) : openItem?.kind === 'video' ? (
              <video src={openUrl} controls className="w-full h-full bg-black" />
            ) : openItem?.kind === 'audio' ? (
              <div className="h-full flex items-center justify-center p-6">
                <audio src={openUrl} controls className="w-full max-w-md" />
              </div>
            ) : (
              <iframe src={openUrl} title={openItem?.title ?? 'File'} className="w-full h-full border-0" />
            )}
          </div>
          {openUrl && (
            <div className="px-4 py-3 border-t border-border/60 flex justify-end">
              <Button size="sm" variant="outline" asChild>
                <a href={openUrl} target="_blank" rel="noreferrer" download>
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ECZResourcesExpandedPage;
